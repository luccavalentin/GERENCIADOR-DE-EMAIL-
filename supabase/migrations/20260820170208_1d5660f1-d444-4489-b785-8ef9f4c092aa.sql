
-- Create email_configurations table
CREATE TABLE public.email_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL DEFAULT 'Custom',
    imap_host TEXT NOT NULL,
    imap_port INTEGER NOT NULL,
    imap_secure BOOLEAN NOT NULL DEFAULT true,
    smtp_host TEXT NOT NULL,
    smtp_port INTEGER NOT NULL,
    smtp_secure BOOLEAN NOT NULL DEFAULT true,
    email_user TEXT NOT NULL,
    email_password TEXT NOT NULL,
    destinations TEXT[] NOT NULL DEFAULT '{}',
    keywords TEXT[] NOT NULL DEFAULT '{"codigo"}',
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create email_logs table
CREATE TABLE public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID REFERENCES public.email_configurations(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT 'info',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create forwarded_emails table
CREATE TABLE public.forwarded_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID REFERENCES public.email_configurations(id) ON DELETE CASCADE NOT NULL,
    original_subject TEXT,
    original_from TEXT,
    forwarded_at TIMESTAMPTZ DEFAULT now()
);

-- Grant privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_configurations TO authenticated;
GRANT SELECT, INSERT ON public.email_logs TO authenticated;
GRANT SELECT, INSERT ON public.forwarded_emails TO authenticated;

GRANT ALL ON public.email_configurations TO service_role;
GRANT ALL ON public.email_logs TO service_role;
GRANT ALL ON public.forwarded_emails TO service_role;

-- Enable RLS
ALTER TABLE public.email_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forwarded_emails ENABLE ROW LEVEL SECURITY;

-- Policies for email_configurations
CREATE POLICY "Users can manage their own email configurations" 
ON public.email_configurations 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- Policies for email_logs
CREATE POLICY "Users can view logs for their own configurations" 
ON public.email_logs 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.email_configurations 
        WHERE id = email_logs.config_id AND user_id = auth.uid()
    )
);

CREATE POLICY "System can insert logs" 
ON public.email_logs 
FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.email_configurations 
        WHERE id = email_logs.config_id AND user_id = auth.uid()
    )
);

-- Policies for forwarded_emails
CREATE POLICY "Users can view forwarded emails for their own configurations" 
ON public.forwarded_emails 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.email_configurations 
        WHERE id = forwarded_emails.config_id AND user_id = auth.uid()
    )
);

CREATE POLICY "System can insert forwarded emails" 
ON public.forwarded_emails 
FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.email_configurations 
        WHERE id = forwarded_emails.config_id AND user_id = auth.uid()
    )
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_logs;
