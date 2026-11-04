
-- Drop the existing security definer view
DROP VIEW IF EXISTS public.terms_acceptances_with_emails;

-- Recreate as a regular view (without SECURITY DEFINER)
-- The view uses the get_user_email_for_acceptance security definer function
-- which is the correct pattern for accessing auth.users data
CREATE VIEW public.terms_acceptances_with_emails AS
SELECT 
  uta.id,
  uta.user_id,
  uta.accepted_at,
  uta.privacy_accepted,
  uta.privacy_accepted_at,
  uta.created_at,
  uta.privacy_version,
  public.get_user_email_for_acceptance(uta.user_id) AS email,
  uta.user_agent,
  uta.terms_version,
  uta.ip_address
FROM public.user_terms_acceptance uta;

-- Grant select permissions to authenticated users
-- RLS on user_terms_acceptance will control actual access
GRANT SELECT ON public.terms_acceptances_with_emails TO authenticated;
