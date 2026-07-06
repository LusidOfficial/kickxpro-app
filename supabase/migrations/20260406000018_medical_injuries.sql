-- Add medical_injuries to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medical_injuries text;
