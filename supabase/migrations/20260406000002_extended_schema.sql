-- ==========================================
-- KickXPro MVP — Phase 3 Extended Schema
-- Adds: teams, attendance_logs, fees, goals, notifications
-- ==========================================

-- 1. TEAMS TABLE — Coaches group players into squads
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age_group TEXT,
    level TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches can view their own teams." ON public.teams FOR SELECT USING (auth.uid() = coach_id);
CREATE POLICY "Coaches can create teams." ON public.teams FOR INSERT WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Coaches can update their own teams." ON public.teams FOR UPDATE USING (auth.uid() = coach_id);

-- 2. TEAM_PLAYERS — Many-to-many mapping of players to teams
CREATE TABLE IF NOT EXISTS public.team_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(team_id, player_id)
);

ALTER TABLE public.team_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team players viewable by coach and player." ON public.team_players FOR SELECT USING (true);
CREATE POLICY "Coaches can manage team players." ON public.team_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Coaches can update team players." ON public.team_players FOR UPDATE USING (true);
CREATE POLICY "Coaches can remove team players." ON public.team_players FOR DELETE USING (true);

-- 3. ATTENDANCE_LOGS — Normalized session attendance
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('Present', 'Late', 'Absent')),
    marked_by UUID REFERENCES public.profiles(id),
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(session_id, player_id)
);

ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Attendance viewable by coach and player." ON public.attendance_logs FOR SELECT USING (auth.uid() = player_id OR auth.uid() = marked_by);
CREATE POLICY "Coaches can mark attendance." ON public.attendance_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Coaches can update attendance." ON public.attendance_logs FOR UPDATE USING (true);

-- 4. FEES — Monthly fee tracking per player
CREATE TABLE IF NOT EXISTS public.fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES public.profiles(id),
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    month TEXT NOT NULL,            -- e.g. '2026-04'
    status TEXT NOT NULL CHECK (status IN ('Paid', 'Pending', 'Overdue')) DEFAULT 'Pending',
    paid_at TIMESTAMP WITH TIME ZONE,
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(player_id, month)
);

ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches can view fees for their players." ON public.fees FOR SELECT USING (auth.uid() = coach_id OR auth.uid() = player_id);
CREATE POLICY "Coaches can create fee records." ON public.fees FOR INSERT WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Coaches can update fee records." ON public.fees FOR UPDATE USING (auth.uid() = coach_id);

-- 5. GOALS — Coach-assigned goals for players
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES public.profiles(id),
    category TEXT CHECK (category IN ('technical', 'tactical', 'physical', 'discipline')),
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    status TEXT CHECK (status IN ('not_started', 'in_progress', 'achieved', 'archived')) DEFAULT 'not_started',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Goals viewable by player and coach." ON public.goals FOR SELECT USING (auth.uid() = player_id OR auth.uid() = coach_id);
CREATE POLICY "Coaches can create goals." ON public.goals FOR INSERT WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Goals can be updated by coach or player." ON public.goals FOR UPDATE USING (auth.uid() = coach_id OR auth.uid() = player_id);

-- 6. NOTIFICATIONS — Lightweight alert system
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id),
    type TEXT NOT NULL,              -- 'goal_assigned', 'evaluation_posted', 'fee_reminder', 'message', 'announcement'
    title TEXT NOT NULL,
    body TEXT,
    entity_type TEXT,                -- 'goal', 'evaluation', 'fee', 'session'
    entity_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications." ON public.notifications FOR SELECT USING (auth.uid() = recipient_id);
CREATE POLICY "Notifications can be created." ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can mark own notifications read." ON public.notifications FOR UPDATE USING (auth.uid() = recipient_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_coach ON public.teams(coach_id);
CREATE INDEX IF NOT EXISTS idx_team_players_team ON public.team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_team_players_player ON public.team_players(player_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON public.attendance_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_player ON public.attendance_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_fees_player ON public.fees(player_id);
CREATE INDEX IF NOT EXISTS idx_fees_coach ON public.fees(coach_id);
CREATE INDEX IF NOT EXISTS idx_goals_player ON public.goals(player_id, status);
CREATE INDEX IF NOT EXISTS idx_goals_coach ON public.goals(coach_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, is_read, created_at DESC);
