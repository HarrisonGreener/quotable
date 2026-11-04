-- Add privacy policy acceptance tracking
ALTER TABLE public.user_terms_acceptance 
ADD COLUMN privacy_accepted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN privacy_version TEXT NOT NULL DEFAULT '1.0',
ADD COLUMN privacy_accepted_at TIMESTAMP WITH TIME ZONE;

-- Update existing records to mark privacy as accepted (for users who signed up before this change)
UPDATE public.user_terms_acceptance 
SET privacy_accepted = true, privacy_accepted_at = accepted_at 
WHERE privacy_accepted_at IS NULL;