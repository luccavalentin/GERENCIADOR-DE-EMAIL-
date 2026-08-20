REVOKE EXECUTE ON FUNCTION public.acquire_email_config_lock(uuid, interval) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_email_config_lock(uuid, interval) TO service_role;

REVOKE EXECUTE ON FUNCTION public.release_email_config_lock(uuid, uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_email_config_lock(uuid, uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.reserve_email_for_processing(uuid, text, bigint, integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_email_for_processing(uuid, text, bigint, integer) TO service_role;