-- ==========================================
-- KickXPro MVP — Phase 6 Schema Definition
-- Event Tracking & Read Receipts
-- ==========================================

-- 1. ANNOUNCEMENT VIEWS
CREATE TABLE IF NOT EXISTS public.announcement_views (
    announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (announcement_id, player_id)
);

ALTER TABLE public.announcement_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can insert their own views." 
    ON public.announcement_views FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "Views are readable by coaches and the specific player." 
    ON public.announcement_views FOR SELECT USING (true); -- simplified for MVP

-- 2. EVENT RESPONSES (RSVPs)
CREATE TABLE IF NOT EXISTS public.event_responses (
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('Attending', 'Not Attending', 'Maybe')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (event_id, player_id)
);

ALTER TABLE public.event_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can insert/update their own RSVPs." 
    ON public.event_responses FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "Players can update their own RSVPs." 
    ON public.event_responses FOR UPDATE USING (auth.uid() = player_id);
CREATE POLICY "RSVPs are readable by everyone." 
    ON public.event_responses FOR SELECT USING (true);
