-- Drop and recreate the view with SECURITY DEFINER to allow admin access to auth.users
DROP VIEW IF EXISTS public.terms_acceptances_with_emails;

CREATE OR REPLACE VIEW public.terms_acceptances_with_emails
WITH (security_invoker = false)
AS
SELECT 
  uta.id,
  uta.user_id,
  uta.terms_version,
  uta.privacy_accepted,
  uta.privacy_version,
  uta.accepted_at,
  uta.privacy_accepted_at,
  uta.created_at,
  uta.ip_address,
  uta.user_agent,
  au.email
FROM public.user_terms_acceptance uta
LEFT JOIN auth.users au ON uta.user_id = au.id;