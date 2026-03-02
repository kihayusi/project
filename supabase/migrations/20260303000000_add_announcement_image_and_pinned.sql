-- Add image_url and is_pinned columns to city_announcements
ALTER TABLE public.city_announcements
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_city_announcements_pinned
  ON public.city_announcements (is_pinned DESC, created_at DESC);
