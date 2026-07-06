-- Migration: Coach Subscriptions & B2B SaaS
-- Adds subscription tracking to user profiles.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

-- Ensure RLS allows users to view their own subscription status
-- (This should already be covered by the existing profiles policy, but we can re-verify if needed)

-- Update all existing coach profiles to free tier explicitly just in case
UPDATE profiles SET subscription_tier = 'free' WHERE role = 'coach' AND subscription_tier IS NULL;
