-- Clean up duplicate records in user_terms_acceptance, keeping only the most recent for each user
DELETE FROM user_terms_acceptance
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM user_terms_acceptance
  ORDER BY user_id, accepted_at DESC
);

-- Add unique constraint on user_id to prevent future duplicates
ALTER TABLE user_terms_acceptance ADD CONSTRAINT unique_user_terms_acceptance UNIQUE (user_id);