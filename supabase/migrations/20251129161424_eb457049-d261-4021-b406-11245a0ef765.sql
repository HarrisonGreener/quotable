-- Add missing DELETE policies for settings tables
CREATE POLICY "Users can delete their own brand settings"
  ON brand_settings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own theme settings"
  ON user_theme_settings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own app settings"
  ON app_settings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix auth.users exposure by dropping and recreating the view with proper security
DROP VIEW IF EXISTS terms_acceptances_with_emails;

-- Create a security definer function to get user emails for admin view
CREATE OR REPLACE FUNCTION get_user_email_for_acceptance(user_id_param UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text FROM auth.users WHERE id = user_id_param;
$$;

-- Recreate the view using the security definer function instead of direct join
CREATE VIEW terms_acceptances_with_emails AS
SELECT 
  uta.id,
  uta.user_id,
  get_user_email_for_acceptance(uta.user_id) as email,
  uta.accepted_at,
  uta.terms_version,
  uta.privacy_accepted,
  uta.privacy_version,
  uta.privacy_accepted_at,
  uta.ip_address,
  uta.user_agent,
  uta.created_at
FROM user_terms_acceptance uta;