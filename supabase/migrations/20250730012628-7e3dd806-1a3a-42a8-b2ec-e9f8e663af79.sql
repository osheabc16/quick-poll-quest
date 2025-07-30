-- Add allow_comments field to polls table
ALTER TABLE public.polls 
ADD COLUMN allow_comments BOOLEAN NOT NULL DEFAULT true;

-- Add comment field to votes table  
ALTER TABLE public.votes
ADD COLUMN comment TEXT;