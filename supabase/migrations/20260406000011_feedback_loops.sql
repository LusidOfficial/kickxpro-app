-- ============================================================================
-- Feedback Loops Schema
-- ============================================================================

-- Create feedback table
CREATE TABLE public.feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('coach', 'player', 'parent')),
    type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'ai_report', 'general')),
    message TEXT NOT NULL,
    context JSONB, -- Additional data (e.g. session_id, player_id, which AI report)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Users can only insert their own feedback
CREATE POLICY "Users can insert own feedback"
    ON public.feedback
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all feedback, users can view their own
CREATE POLICY "Users can view own feedback"
    ON public.feedback
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
