-- ==========================================
-- KickXPro MVP — Phase 2: Player Tiers
-- Add explicit tier to profiles instead of calculating from score
-- ==========================================

-- 1. Add tier column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'Beginner' CHECK (tier IN ('Beginner', 'Intermediate', 'Advanced', 'Elite', 'Pro'));

-- 2. Update existing players to Beginner if they don't have a tier
UPDATE public.profiles
SET tier = 'Beginner'
WHERE role = 'player' AND tier IS NULL;
