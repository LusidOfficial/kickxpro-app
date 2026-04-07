-- Add email column to profiles so coaches can see student login credentials
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
