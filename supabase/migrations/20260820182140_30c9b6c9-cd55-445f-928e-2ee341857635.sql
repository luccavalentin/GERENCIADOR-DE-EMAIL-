REVOKE EXECUTE ON FUNCTION public.reserve_email_for_processing(uuid, text, bigint) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.reserve_email_for_processing(uuid, text, bigint, integer) FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION public.reserve_email_for_processing(uuid, text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_email_for_processing(uuid, text, bigint, integer) TO service_role;