-- ==============================================================================
-- PHASE 5: CUSTOM METRICS
-- Migration: 20260406000016_custom_metrics.sql
-- ==============================================================================

-- 1. ADD EVALUATION METRICS TO PROFILES
-- Allows coaches to define their own custom metrics instead of hardcoded defaults.
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS evaluation_metrics TEXT[] DEFAULT ARRAY['Pace', 'Shooting', 'Passing', 'Dribbling']::TEXT[];

-- Note: Since we are using JSONB for the actual evaluation data in the `event_tracking` table,
-- we do not need to alter any evaluation tables. The frontend will dynamically read the coach's
-- `evaluation_metrics` array and use those keys to populate the `metrics` JSONB column.
