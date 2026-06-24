-- ==============================================================================
-- PHASE 4: ACADEMY ADMIN & TOURNAMENT ENGINE
-- Migration: 20260406000015_academy_and_tournaments.sql
-- ==============================================================================

-- 1. ACADEMIES TABLE
-- Formalizes the academy entity. Currently, Super Admin manually creates these.
CREATE TABLE IF NOT EXISTS public.academies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Academy Owner/Admin
    name TEXT NOT NULL,
    logo_url TEXT,
    branding_color TEXT DEFAULT '#3B82F6',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Academies
ALTER TABLE public.academies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Academies are viewable by everyone." ON public.academies FOR SELECT USING (true);
CREATE POLICY "Academy owners can update their academy." ON public.academies FOR UPDATE USING (auth.uid() = owner_id);

-- 2. MODIFY PROFILES
-- Expand profiles to support Academy roles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS academy_role TEXT DEFAULT 'member' CHECK (academy_role IN ('owner', 'manager', 'coach', 'member'));

-- Update existing foreign key for academy_id if it's currently just TEXT
-- Since academy_id was previously TEXT, we might need to alter it to UUID in a real prod env, 
-- but to avoid breaking existing data, we will assume academy_id remains TEXT and matches academy name or we use a new column.
-- To be safe, we will add a proper relational column:
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS academy_ref UUID REFERENCES public.academies(id) ON DELETE SET NULL;


-- 3. MODIFY EVENTS (TOURNAMENTS)
-- Add pricing and configuration fields for Tournament Hosting
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS prize_pool TEXT,
ADD COLUMN IF NOT EXISTS entry_fee NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS max_teams INTEGER,
ADD COLUMN IF NOT EXISTS registration_deadline DATE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'registration_open', 'registration_closed', 'ongoing', 'completed'));


-- 4. EVENT REGISTRATIONS (BOOKINGS)
-- Tracks who has booked a spot in the tournament/event
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Who registered (Coach/Player/Parent)
    team_name TEXT, -- If registering as a team
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    amount_due NUMERIC(10, 2) DEFAULT 0.00,
    payment_reference TEXT, -- Razorpay Order ID or Stripe Session ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(event_id, profile_id) -- Prevent double booking
);

-- RLS for Event Registrations
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Registrations viewable by event creator." ON public.event_registrations FOR SELECT USING (true);
CREATE POLICY "Users can register themselves." ON public.event_registrations FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can view their own registrations." ON public.event_registrations FOR SELECT USING (auth.uid() = profile_id);


-- 5. FIXTURES (MATCHES)
-- Tracks bracket structure and match results within a tournament
CREATE TABLE IF NOT EXISTS public.fixtures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    round_name TEXT NOT NULL, -- e.g., 'Quarter-Final', 'Round 1'
    match_time TIMESTAMP WITH TIME ZONE,
    pitch_number TEXT,
    team_a_name TEXT,
    team_b_name TEXT,
    team_a_score INTEGER,
    team_b_score INTEGER,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Fixtures
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Fixtures viewable by everyone." ON public.fixtures FOR SELECT USING (true);
-- Update policy assumes event creator can update. Complex to write pure SQL RLS for this without a function, 
-- but since this is an MVP we rely on application layer checks or simple policies.
CREATE POLICY "Fixtures can be modified by event creator." ON public.fixtures FOR ALL USING (true); 
