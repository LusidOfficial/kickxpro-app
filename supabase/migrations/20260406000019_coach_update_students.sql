-- Allow coaches to update profiles of their own students
CREATE POLICY "Coaches can update their own students" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = coach_id);
