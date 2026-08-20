
-- 1. Alter email_configurations to add monitoring fields
ALTER TABLE public.email_configurations 
ADD COLUMN IF NOT EXISTS last_heartbeat timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_check_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_success_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_error text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'idle';

-- 2. Create email_processing_state for deduplication
CREATE TABLE IF NOT EXISTS public.email_processing_state (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id uuid REFERENCES public.email_configurations(id) ON DELETE CASCADE NOT NULL,
    mailbox text NOT NULL,
    imap_uid bigint NOT NULL,
    message_id text,
    status text DEFAULT 'processing', -- processing, forwarded, error
    attempt_count int DEFAULT 1,
    processing_started_at timestamp with time zone DEFAULT now(),
    forwarded_at timestamp with time zone,
    last_error text,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(config_id, mailbox, imap_uid)
);

-- 3. Grants for the new table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_processing_state TO authenticated;
GRANT ALL ON public.email_processing_state TO service_role;

-- 4. Enable RLS
ALTER TABLE public.email_processing_state ENABLE ROW LEVEL SECURITY;

-- 5. Policies for email_processing_state (scoped to user's configs)
CREATE POLICY "Users can view their own processing states"
ON public.email_processing_state
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.email_configurations
        WHERE id = email_processing_state.config_id
        AND user_id = auth.uid()
    )
);

-- 6. Function for atomic reservation (Lock/Deduplication)
CREATE OR REPLACE FUNCTION public.reserve_email_for_processing(
    p_config_id uuid,
    p_mailbox text,
    p_imap_uid bigint
) RETURNS boolean AS $$
BEGIN
    INSERT INTO public.email_processing_state (config_id, mailbox, imap_uid)
    VALUES (p_config_id, p_mailbox, p_imap_uid)
    ON CONFLICT (config_id, mailbox, imap_uid) DO NOTHING;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.reserve_email_for_processing TO authenticated, service_role;

-- 7. Add internal identifier to configs if needed (already has id)
