-- 1. Create tournament_fixtures table
CREATE TABLE IF NOT EXISTS public.tournament_fixtures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    team1_id UUID REFERENCES public.event_registrations(id) ON DELETE SET NULL,
    team2_id UUID REFERENCES public.event_registrations(id) ON DELETE SET NULL,
    score1 INTEGER,
    score2 INTEGER,
    winner_id UUID REFERENCES public.event_registrations(id) ON DELETE SET NULL,
    next_match_id UUID REFERENCES public.tournament_fixtures(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.tournament_fixtures ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Policy: Anyone can read fixtures
CREATE POLICY "Anyone can read fixtures" 
    ON public.tournament_fixtures FOR SELECT 
    USING (true);

-- Policy: Event creators and Admins can update fixtures
CREATE POLICY "Creators and Admins can manage fixtures" 
    ON public.tournament_fixtures FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.events e 
            WHERE e.id = event_id AND e.coach_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );
