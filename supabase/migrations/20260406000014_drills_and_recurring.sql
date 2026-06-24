-- Phase 2: Drills and Recurring Sessions
-- Add missing columns for attachments and recurrences

-- 1. Modify Drills Table
ALTER TABLE drills
ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Index for fast coach drill lookup
CREATE INDEX IF NOT EXISTS idx_drills_coach ON drills(coach_id);

-- 2. Modify Sessions Table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurring_pattern TEXT; -- 'weekly', 'bi-weekly', 'monthly'

-- 3. Seed Drills
-- Insert the KickXPro core global drills
INSERT INTO drills (title, category, duration_mins, difficulty, description)
VALUES 
('Rondo 4v1', 'Passing', 15, 'Beginner', 'Basic passing and pressing under pressure.'),
('Dynamic Stretching', 'Fitness', 10, 'Beginner', 'Warmup targeting hamstrings, quads, and calves.'),
('Shooting Gallery', 'Shooting', 20, 'Intermediate', 'Quick-fire shooting from the edge of the box.'),
('High Press Tactical', 'Tactical', 25, 'Advanced', 'Team shape and triggers for a high press.'),
('Attacking Overloads', 'Match Prep', 30, 'Elite', '3v2 and 4v3 scenarios in the final third.'),
('Goalkeeper Distribution', 'Goalkeeping', 15, 'Intermediate', 'Playing out from the back under pressure.')
ON CONFLICT DO NOTHING;
