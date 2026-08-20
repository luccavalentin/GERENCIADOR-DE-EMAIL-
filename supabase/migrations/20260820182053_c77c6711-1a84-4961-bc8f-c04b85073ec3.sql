CREATE POLICY "Service role can do everything" ON public.email_credentials
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Also ensure email_processing_state has a policy for service_role if needed
-- But it already has some policies probably. Let's check.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'email_processing_state' AND policyname = 'Service role full access'
    ) THEN
        CREATE POLICY "Service role full access" ON public.email_processing_state
        FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;
