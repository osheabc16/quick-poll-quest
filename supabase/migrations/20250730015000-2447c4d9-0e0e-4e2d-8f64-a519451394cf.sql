-- Drop the restrictive policy that only allows users to view their own polls
DROP POLICY "Users can view their own polls" ON public.polls;

-- Create a new policy that allows everyone to view all polls (needed for voting)
CREATE POLICY "Anyone can view polls" 
ON public.polls 
FOR SELECT 
USING (true);

-- Keep the existing policies for INSERT, UPDATE, and DELETE unchanged
-- These still restrict poll management to the creator only