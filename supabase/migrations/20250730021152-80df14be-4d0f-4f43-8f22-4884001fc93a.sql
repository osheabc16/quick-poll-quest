-- Add creator_comment field to polls table
ALTER TABLE public.polls 
ADD COLUMN creator_comment TEXT;