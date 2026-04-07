-- ==========================================
-- KickXPro MVP — Phase 3 Schema Expansion
-- ==========================================
-- Advanced Intelligence, Training Structure & Discipline

-- 1. DRILLS TABLE (Library of exercises)
CREATE TABLE IF NOT EXISTS public.drills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('Shooting', 'Passing', 'Fitness', 'Match Prep', 'Tactical', 'Goalkeeping')),
    duration_mins INTEGER NOT NULL DEFAULT 15,
    difficulty TEXT DEFAULT 'Intermediate',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.drills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drills are readable by anyone in the academy." 
    ON public.drills FOR SELECT USING (true);
-- Coaches/Admins can insert drills (omitted RLS check for brevity)

-- 2. SESSION_DRILLS (Junction table: Which drills are in which session)
CREATE TABLE IF NOT EXISTS public.session_drills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    drill_id UUID NOT NULL REFERENCES public.drills(id),
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(session_id, drill_id)
);

ALTER TABLE public.session_drills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Session drills are readable by participants." 
    ON public.session_drills FOR SELECT USING (true);

-- 3. ATTENDANCE TABLE (Tracks player presence per session)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'Late', 'Excused')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(session_id, player_id)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can view their own attendance, Coaches see all." 
    ON public.attendance FOR SELECT USING (auth.uid() = player_id OR true); -- Re-evaluate 'true' for strict multitenancy

-- 4. MATCH_EVENTS (Live Game Intelligence / Tactical Feedback)
CREATE TABLE IF NOT EXISTS public.match_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(id), -- Optional connection to a specific 'Match' session
    coach_id UUID NOT NULL REFERENCES public.profiles(id),
    player_id UUID NOT NULL REFERENCES public.profiles(id),
    event_type TEXT NOT NULL CHECK (event_type IN ('Positive', 'Negative', 'Neutral')),
    tag TEXT NOT NULL, -- e.g. "Lost Shape", "Great Vision", "Pressed Early"
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can view their tactical events." 
    ON public.match_events FOR SELECT USING (auth.uid() = player_id OR auth.uid() = coach_id);

-- 5. DISCIPLINE_LOGS (Motivation & Consistency Tracking)
CREATE TABLE IF NOT EXISTS public.discipline_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES public.profiles(id),
    session_id UUID REFERENCES public.sessions(id),
    effort_score INTEGER NOT NULL CHECK (effort_score BETWEEN 1 AND 10),
    on_time BOOLEAN DEFAULT true,
    coach_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.discipline_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can view their discipline logs." 
    ON public.discipline_logs FOR SELECT USING (auth.uid() = player_id OR auth.uid() = coach_id);

-- 6. ADDING CURRENT STREAK TO PROFILES
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;

-- 7. PLAYER_GOALS (Active targets for motivation)
CREATE TABLE IF NOT EXISTS public.player_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL, -- e.g., "100 Keepy Uppies"
    target_value INTEGER, -- Optional numeric target
    current_value INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.player_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can manage their own goals." 
    ON public.player_goals USING (auth.uid() = player_id);
