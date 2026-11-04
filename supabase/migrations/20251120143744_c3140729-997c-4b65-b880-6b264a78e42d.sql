-- Create a view that joins terms acceptances with user emails
-- Only accessible by admins via RLS
CREATE OR REPLACE VIEW public.terms_acceptances_with_emails AS
SELECT 
  uta.id,
  uta.user_id,
  uta.terms_version,
  uta.privacy_accepted,
  uta.privacy_version,
  uta.accepted_at,
  uta.privacy_accepted_at,
  uta.ip_address,
  uta.user_agent,
  uta.created_at,
  au.email
FROM public.user_terms_acceptance uta
LEFT JOIN auth.users au ON uta.user_id = au.id;

-- Enable RLS on the view
ALTER VIEW public.terms_acceptances_with_emails SET (security_invoker = true);

-- Create RLS policy for the view
CREATE POLICY "Admins can view terms acceptances with emails"
ON public.user_terms_acceptance
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Make harry@quotable-it.co.uk an admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'harry@quotable-it.co.uk'
ON CONFLICT (user_id, role) DO NOTHING;