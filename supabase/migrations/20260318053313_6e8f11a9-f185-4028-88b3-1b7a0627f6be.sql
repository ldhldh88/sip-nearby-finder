
-- Add sync config to districts
ALTER TABLE public.districts
  ADD COLUMN sync_interval_days integer DEFAULT NULL,
  ADD COLUMN last_synced_at timestamptz DEFAULT NULL;

-- Cached places table
CREATE TABLE public.cached_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id uuid NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  kakao_place_id text NOT NULL,
  place_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(district_id, kakao_place_id)
);

CREATE INDEX idx_cached_places_district ON public.cached_places(district_id);

ALTER TABLE public.cached_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached_places" ON public.cached_places
  FOR SELECT TO anon, authenticated USING (true);

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
