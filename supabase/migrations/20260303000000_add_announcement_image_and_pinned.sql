-- Add image_url and is_pinned columns to city_announcements
ALTER TABLE public.city_announcements
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;

-- Index for faster ordering (pinned first, then newest)
CREATE INDEX IF NOT EXISTS idx_announcements_pinned_created
  ON public.city_announcements (is_pinned DESC, created_at DESC);
