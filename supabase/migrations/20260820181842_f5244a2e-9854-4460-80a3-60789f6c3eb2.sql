-- 1. Email Credentials
CREATE TABLE IF NOT EXISTS public.email_credentials (
    config_id uuid PRIMARY KEY REFERENCES public.email_configurations(id) ON DELETE CASCADE,
    password text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

GRANT ALL ON public.email_credentials TO service_role;
ALTER TABLE public.email_credentials ENABLE ROW LEVEL SECURITY;

-- 2. Locks on email_configurations
ALTER TABLE public.email_configurations 
ADD COLUMN IF NOT EXISTS processing_lock_id uuid,
ADD COLUMN IF NOT EXISTS processing_lock_until timestamp with time zone;

-- 3. Locking Functions
CREATE OR REPLACE FUNCTION public.acquire_email_config_lock(p_config_id uuid, p_lock_timeout interval)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_lock_id uuid := gen_random_uuid();
BEGIN
    UPDATE email_configurations
    SET 
        processing_lock_id = v_lock_id,
        processing_lock_until = now() + p_lock_timeout
    WHERE id = p_config_id
      AND (processing_lock_id IS NULL OR processing_lock_until < now());
    
    IF FOUND THEN
        RETURN v_lock_id;
    ELSE
        RETURN NULL;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_email_config_lock(p_config_id uuid, p_lock_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE email_configurations
    SET 
        processing_lock_id = NULL,
        processing_lock_until = NULL
    WHERE id = p_config_id
      AND processing_lock_id = p_lock_id;
    
    RETURN FOUND;
END;
$$;

-- 4. Updated reserve_email_for_processing
CREATE OR REPLACE FUNCTION public.reserve_email_for_processing(
    p_config_id uuid,
    p_mailbox text,
    p_imap_uid bigint,
    p_max_retries integer DEFAULT 3
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO email_processing_state (config_id, mailbox, imap_uid, status, processing_started_at, attempt_count)
    VALUES (p_config_id, p_mailbox, p_imap_uid, 'processing', now(), 1)
    ON CONFLICT (config_id, mailbox, imap_uid) DO UPDATE
    SET 
        status = 'processing',
        processing_started_at = now(),
        attempt_count = email_processing_state.attempt_count + 1
    WHERE email_processing_state.status = 'error' 
      AND email_processing_state.attempt_count < p_max_retries;

    RETURN FOUND;
END;
$$;

-- 5. Data migration
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'email_configurations' AND column_name = 'email_password'
    ) THEN
        INSERT INTO public.email_credentials (config_id, password)
        SELECT id, email_password FROM public.email_configurations
        ON CONFLICT (config_id) DO UPDATE SET password = EXCLUDED.password;
        
        ALTER TABLE public.email_configurations DROP COLUMN email_password;
    END IF;
END $$;

-- 6. Cron Update (pointing to stable URL)
SELECT cron.unschedule('monitor-emails-every-minute');
SELECT cron.schedule(
    'monitor-emails-every-minute',
    '* * * * *',
    $$
    SELECT net.http_post(
        url := 'https://project--api.agilliza.app/api/public/cron/monitor',
        headers := '{"Content-Type": "application/json", "x-cron-secret": "EMAIL_MONITOR_CRON_SECRET_VALUE"}'::jsonb,
        body := '{}'::jsonb
    ) as request_id;
    $$
);