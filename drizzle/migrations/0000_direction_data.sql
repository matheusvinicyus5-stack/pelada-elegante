CREATE TABLE public.football_data (id integer PRIMARY KEY CHECK (id = 1), payload jsonb NOT NULL, revision integer NOT NULL DEFAULT 1);
GRANT SELECT ON public.football_data TO anon, authenticated;
GRANT ALL ON public.football_data TO service_role;
ALTER TABLE public.football_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public football reads" ON public.football_data FOR SELECT TO anon, authenticated USING (true);
CREATE TABLE public.direction_settings (id integer PRIMARY KEY CHECK (id = 1), password_hash text, session_version integer NOT NULL DEFAULT 1);
GRANT ALL ON public.direction_settings TO service_role;
ALTER TABLE public.direction_settings ENABLE ROW LEVEL SECURITY;