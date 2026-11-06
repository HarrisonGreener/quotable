-- Daily AI usage per account, so one account can't use up the shared AI allowance.
-- Only server functions touch it (RLS on, no policies).
CREATE TABLE IF NOT EXISTS public.ai_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/London')::date,
  kind text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day, kind)
);
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.bump_ai_usage(_user_id uuid, _kind text, _limit integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _today date := (now() AT TIME ZONE 'Europe/London')::date;
  _count integer;
BEGIN
  INSERT INTO public.ai_usage (user_id, day, kind, count)
  VALUES (_user_id, _today, _kind, 1)
  ON CONFLICT (user_id, day, kind) DO UPDATE SET count = public.ai_usage.count + 1
  RETURNING count INTO _count;
  RETURN _count <= _limit;
END;
$$;

REVOKE ALL ON FUNCTION public.bump_ai_usage(uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bump_ai_usage(uuid, text, integer) TO service_role;

-- Keep the table small: usage older than 90 days isn't needed.
DELETE FROM public.ai_usage WHERE day < (now() - interval '90 days')::date;
