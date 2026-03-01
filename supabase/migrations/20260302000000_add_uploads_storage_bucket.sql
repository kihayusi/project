-- ============================================================
-- Storage bucket for citizen document uploads & payment proofs
-- ============================================================

-- Create the bucket (public so signed URLs aren't needed)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  true,
  5242880,  -- 5 MB max per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Anyone authenticated can upload files
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');

-- Anyone can read/download (bucket is public)
CREATE POLICY "Public read access on uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads');

-- Users can delete their own uploads  (path starts with their uid)
CREATE POLICY "Users can delete own uploads"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admins can delete any upload
CREATE POLICY "Admins can delete any upload"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'uploads' AND public.has_role(auth.uid(), 'admin'));
