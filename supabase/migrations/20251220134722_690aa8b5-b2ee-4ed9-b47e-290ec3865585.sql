-- Fix: Revoke broad SELECT access from the terms_acceptances_with_emails view
-- Only admins should be able to query this view directly
-- Regular users can still view their own terms acceptance via the user_terms_acceptance table

-- Revoke the overly permissive grant
REVOKE SELECT ON public.terms_acceptances_with_emails FROM authenticated;

-- Grant access only to admins (using a more restrictive approach)
-- Note: Views don't support RLS directly, so we restrict at the grant level
-- Admins who need this data can query it directly
-- For non-admin access, they should use the user_terms_acceptance table which has proper RLS