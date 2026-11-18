DROP POLICY IF EXISTS "Public football reads" ON public.football_data;
REVOKE ALL ON public.football_data FROM anon, authenticated;
GRANT ALL ON public.football_data TO service_role;