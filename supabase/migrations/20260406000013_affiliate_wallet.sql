-- Add referral system columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by_coach_id UUID REFERENCES profiles(id);

-- Create an index to quickly look up coaches by their referral code
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- Create an index to quickly find all players referred by a specific coach
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by_coach_id);
