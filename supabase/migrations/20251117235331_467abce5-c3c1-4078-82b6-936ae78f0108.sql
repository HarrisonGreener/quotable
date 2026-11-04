-- Create user_terms_acceptance table for legal protection
CREATE TABLE public.user_terms_acceptance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  terms_version TEXT NOT NULL DEFAULT '1.0',
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_terms_acceptance ENABLE ROW LEVEL SECURITY;

-- Create policies for user_terms_acceptance
CREATE POLICY "Users can view their own terms acceptance" 
ON public.user_terms_acceptance 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert terms acceptance" 
ON public.user_terms_acceptance 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_terms_acceptance_user_id ON public.user_terms_acceptance(user_id);
CREATE INDEX idx_user_terms_acceptance_accepted_at ON public.user_terms_acceptance(accepted_at);