-- ==========================================
-- KickXPro — Phase 5: New Features Schema
-- Adds: coach_ratings, announcements, events
-- Updates: profiles for parent role
-- ==========================================

-- 1. COACH_RATINGS — Players rate their coaches
CREATE TABLE IF NOT EXISTS public.coach_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.coach_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coach ratings viewable by coach and player." ON public.coach_ratings FOR SELECT USING (auth.uid() = coach_id OR auth.uid() = player_id);
CREATE POLICY "Players can submit ratings." ON public.coach_ratings FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "Players can update their ratings." ON public.coach_ratings FOR UPDATE USING (auth.uid() = player_id);

-- 2. ANNOUNCEMENTS — Coach posts announcements
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'info' CHECK (priority IN ('info', 'warning', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Announcements viewable by all." ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Coaches can create announcements." ON public.announcements FOR INSERT WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Coaches can update their announcements." ON public.announcements FOR UPDATE USING (auth.uid() = coach_id);
CREATE POLICY "Coaches can delete their announcements." ON public.announcements FOR DELETE USING (auth.uid() = coach_id);

-- 3. EVENTS — Tournaments, trials, friendlies
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_time TIME,
    location TEXT,
    event_type TEXT DEFAULT 'tournament' CHECK (event_type IN ('tournament', 'trial', 'friendly', 'camp', 'other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events viewable by all." ON public.events FOR SELECT USING (true);
CREATE POLICY "Coaches can create events." ON public.events FOR INSERT WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Coaches can update their events." ON public.events FOR UPDATE USING (auth.uid() = coach_id);
CREATE POLICY "Coaches can delete their events." ON public.events FOR DELETE USING (auth.uid() = coach_id);

-- 4. UPDATE PROFILES — Allow 'parent' role and add child_id
-- Note: We need to drop and recreate the check constraint to add 'parent'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'coach', 'player', 'parent'));

-- Add child_id column for parent accounts
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS child_id UUID REFERENCES public.profiles(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coach_ratings_coach ON public.coach_ratings(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_ratings_player ON public.coach_ratings(player_id);
CREATE INDEX IF NOT EXISTS idx_announcements_coach ON public.announcements(coach_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_coach ON public.events(coach_id, event_date);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_profiles_child ON public.profiles(child_id);
