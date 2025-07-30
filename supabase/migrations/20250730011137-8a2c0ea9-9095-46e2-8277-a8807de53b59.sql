-- Create polls table
CREATE TABLE public.polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create votes table
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_choice TEXT NOT NULL CHECK (option_choice IN ('a', 'b')),
  voter_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for polls
CREATE POLICY "Users can view their own polls" 
ON public.polls 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own polls" 
ON public.polls 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own polls" 
ON public.polls 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own polls" 
ON public.polls 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for votes
CREATE POLICY "Anyone can view votes for existing polls" 
ON public.votes 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.polls WHERE polls.id = poll_id));

CREATE POLICY "Anyone can create votes for existing polls" 
ON public.votes 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.polls WHERE polls.id = poll_id));

-- Add indexes
CREATE INDEX idx_polls_user_id ON public.polls(user_id);
CREATE INDEX idx_polls_created_at ON public.polls(created_at DESC);
CREATE INDEX idx_votes_poll_id ON public.votes(poll_id);

-- Add trigger for updated_at
CREATE TRIGGER update_polls_updated_at
BEFORE UPDATE ON public.polls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();