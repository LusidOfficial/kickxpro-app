-- ==========================================
-- KickXPro MVP — Phase 8: Session Responses (RSVP)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.session_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    response TEXT NOT NULL CHECK (response IN ('going', 'not_going')),
    responded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(session_id, player_id)
);

ALTER TABLE public.session_responses ENABLE ROW LEVEL SECURITY;

-- Players can view their own responses
CREATE POLICY "Players can view their own responses." ON public.session_responses FOR SELECT USING (auth.uid() = player_id);

-- Players can insert/update their own responses
CREATE POLICY "Players can insert their own responses." ON public.session_responses FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "Players can update their own responses." ON public.session_responses FOR UPDATE USING (auth.uid() = player_id);

-- Coaches can view responses for their sessions
CREATE POLICY "Coaches can view responses for their sessions." ON public.session_responses FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_id AND s.coach_id = auth.uid())
);

-- Parents can view their child's responses
CREATE POLICY "Parents can view their child's responses." ON public.session_responses FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'parent' AND p.child_id = session_responses.player_id)
);

-- Parents can manage their child's responses
CREATE POLICY "Parents can insert their child's responses." ON public.session_responses FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'parent' AND p.child_id = session_responses.player_id)
);
CREATE POLICY "Parents can update their child's responses." ON public.session_responses FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'parent' AND p.child_id = session_responses.player_id)
);

CREATE INDEX IF NOT EXISTS idx_session_responses_session ON public.session_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_session_responses_player ON public.session_responses(player_id);
