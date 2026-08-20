
-- Fix search path and execution permissions
ALTER FUNCTION public.reserve_email_for_processing(uuid, text, bigint) SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.reserve_email_for_processing(uuid, text, bigint) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reserve_email_for_processing(uuid, text, bigint) FROM anon;

GRANT EXECUTE ON FUNCTION public.reserve_email_for_processing(uuid, text, bigint) TO authenticated, service_role;
