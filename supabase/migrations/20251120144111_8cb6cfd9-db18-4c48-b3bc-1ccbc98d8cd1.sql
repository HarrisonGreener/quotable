-- Drop the duplicate policy (we already have one from earlier)
DROP POLICY IF EXISTS "Admins can view terms acceptances with emails" ON public.user_terms_acceptance;

-- The existing "Admins can view all terms acceptances" policy should handle this

-- Verify the view can be accessed by checking if we need to grant select permissions
GRANT SELECT ON public.terms_acceptances_with_emails TO authenticated;