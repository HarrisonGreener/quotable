-- Customer-facing quote/invoice links, deposits, payment links and site photos.

-- Quotes: share link, acceptance and deposit, photos
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS share_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS customer_viewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_name text,
  ADD COLUMN IF NOT EXISTS deposit_percent numeric CHECK (deposit_percent IS NULL OR (deposit_percent >= 0 AND deposit_percent <= 100)),
  ADD COLUMN IF NOT EXISTS valid_until date,
  ADD COLUMN IF NOT EXISTS photos jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Invoices: share link with pay button
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS share_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS customer_viewed_at timestamptz;

-- The tradesperson's own payment link (Stripe Payment Link, SumUp, PayPal.me…)
ALTER TABLE public.brand_settings
  ADD COLUMN IF NOT EXISTS payment_link text CHECK (payment_link IS NULL OR payment_link ~* '^https://');

-- Unguessable tokens: 24 random bytes, URL-safe
CREATE OR REPLACE FUNCTION public.new_share_token()
RETURNS text LANGUAGE sql VOLATILE AS $$
  SELECT translate(encode(gen_random_bytes(24), 'base64'), '+/=', '-_');
$$;

-- Private bucket for site photos, one folder per user: <user_id>/<file>
INSERT INTO storage.buckets (id, name, public)
VALUES ('quote-photos', 'quote-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users read their own quote photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'quote-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload their own quote photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'quote-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete their own quote photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'quote-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
