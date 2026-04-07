-- 003_coach_roster.sql
-- Add coach_id and assignments to support Squad-specific logic

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES public.profiles(id);

-- Update the RLS policy for profiles so a coach can only see players assigned to them.
-- Since we already have a read-all policy in 001_core_schema, we drop it to restrict access if that's what we want.
-- But for the sake of MVP and avoiding breaking other things, let's just use the column in queries:
-- frontend query will be: `.eq('coach_id', user.id)`

-- Create a junction for historical or multiple coaches if needed, but for now `coach_id` on profiles is enough.
