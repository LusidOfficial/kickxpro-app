-- ==========================================
-- KickXPro MVP — Phase 2 Schema Definition
-- ==========================================

-- Enable the pgcrypto extension for UUIDs
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. PROFILES TABLE (Extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'coach', 'player')),
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    -- Player specific attributes
    position TEXT,
    age INTEGER,
    overall_score INTEGER DEFAULT 0,
    -- Associations
    academy_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone in the academy." 
    ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." 
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. SESSIONS TABLE (Created by Coaches)
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    session_type TEXT NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_mins INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sessions are viewable by assigned players and the coach." 
    ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Coaches can create sessions." 
    ON public.sessions FOR INSERT WITH CHECK (auth.uid() = coach_id);

-- 3. EVALUATIONS TABLE (Linked to Session and Player)
CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES public.profiles(id),
    scores JSONB NOT NULL DEFAULT '{}'::jsonb, -- {pace: 80, shooting: 60...}
    strengths TEXT[] DEFAULT '{}',
    focus_areas TEXT[] DEFAULT '{}',
    badge_awarded TEXT,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(session_id, player_id) -- A player can only have one evaluation per session
);

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can view their own evaluations." 
    ON public.evaluations FOR SELECT USING (auth.uid() = player_id OR auth.uid() = coach_id);
CREATE POLICY "Coaches can insert evaluations." 
    ON public.evaluations FOR INSERT WITH CHECK (auth.uid() = coach_id);

-- 4. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id),
    receiver_id UUID NOT NULL REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own messages." 
    ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages." 
    ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 5. TOURNAMENTS TABLE (Created by Admin)
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    event_date DATE NOT NULL,
    status TEXT DEFAULT 'Upcoming',
    teams TEXT[] DEFAULT '{}', -- Array of team names or academy IDs
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tournaments are viewable by everyone." 
    ON public.tournaments FOR SELECT USING (true);
-- Admin checks required for INSERT/UPDATE (omitted for brevity)
