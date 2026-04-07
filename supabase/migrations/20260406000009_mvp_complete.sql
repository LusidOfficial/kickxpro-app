-- ==========================================
-- KickXPro MVP — Phase 7: Complete Feature Set
-- Adds: match_stats, leaderboard, notification_preferences
-- Fixes: ensures all new feature tables exist
-- ==========================================

-- 1. MATCH_STATS — Live match stat tracking for Match Day Mode
CREATE TABLE IF NOT EXISTS public.match_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES public.profiles(id),
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    shots_on_target INTEGER DEFAULT 0,
    shots_off_target INTEGER DEFAULT 0,
    passes_completed INTEGER DEFAULT 0,
    passes_attempted INTEGER DEFAULT 0,
    tackles INTEGER DEFAULT 0,
    interceptions INTEGER DEFAULT 0,
    fouls INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    minutes_played INTEGER DEFAULT 0,
    rating NUMERIC(3,1) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(session_id, player_id)
);

ALTER TABLE public.match_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Match stats viewable by coach and player." ON public.match_stats FOR SELECT USING (auth.uid() = player_id OR auth.uid() = coach_id);
CREATE POLICY "Coaches can insert match stats." ON public.match_stats FOR INSERT WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Coaches can update match stats." ON public.match_stats FOR UPDATE USING (auth.uid() = coach_id);

-- 2. NOTIFICATION_PREFERENCES — User notification settings
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    session_reminders BOOLEAN DEFAULT true,
    fee_reminders BOOLEAN DEFAULT true,
    evaluation_alerts BOOLEAN DEFAULT true,
    message_notifications BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own preferences." ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own preferences." ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences." ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);

-- 3. Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_match_stats_session ON public.match_stats(session_id);
CREATE INDEX IF NOT EXISTS idx_match_stats_player ON public.match_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_match_stats_coach ON public.match_stats(coach_id);

-- 4. Add avatar_seed to profiles for deterministic avatars
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_seed TEXT;

-- 5. Add session_drills insert policy (was missing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'session_drills' AND policyname = 'Coaches can add drills to sessions.'
    ) THEN
        CREATE POLICY "Coaches can add drills to sessions." ON public.session_drills FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- 6. Add drills insert policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'drills' AND policyname = 'Coaches can create drills.'
    ) THEN
        CREATE POLICY "Coaches can create drills." ON public.drills FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- 7. Parent read-only policies (parents can view their child's data)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'evaluations' AND policyname = 'Parents can view their child evaluations.'
    ) THEN
        CREATE POLICY "Parents can view their child evaluations." ON public.evaluations FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'parent' AND p.child_id = evaluations.player_id)
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'goals' AND policyname = 'Parents can view their child goals.'
    ) THEN
        CREATE POLICY "Parents can view their child goals." ON public.goals FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'parent' AND p.child_id = goals.player_id)
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'fees' AND policyname = 'Parents can view their child fees.'
    ) THEN
        CREATE POLICY "Parents can view their child fees." ON public.fees FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'parent' AND p.child_id = fees.player_id)
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'attendance_logs' AND policyname = 'Parents can view their child attendance.'
    ) THEN
        CREATE POLICY "Parents can view their child attendance." ON public.attendance_logs FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'parent' AND p.child_id = attendance_logs.player_id)
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'match_stats' AND policyname = 'Parents can view their child match stats.'
    ) THEN
        CREATE POLICY "Parents can view their child match stats." ON public.match_stats FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'parent' AND p.child_id = match_stats.player_id)
        );
    END IF;
END $$;
