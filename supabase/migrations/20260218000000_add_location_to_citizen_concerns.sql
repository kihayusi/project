-- Add location column to citizen_concerns table
ALTER TABLE public.citizen_concerns
ADD COLUMN location TEXT DEFAULT '';
