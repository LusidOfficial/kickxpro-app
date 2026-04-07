-- 004_session_attendance.sql
-- Add attendance tracking to sessions

ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS attendance JSONB DEFAULT '{}'::jsonb;
