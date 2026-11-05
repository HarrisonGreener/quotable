-- Run ONCE in your new project's SQL editor (Supabase dashboard → SQL Editor).
-- Schedules the nightly price refresh. Your service-role key is stored in
-- Supabase Vault, not in this file. Replace the two placeholders below.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select vault.create_secret('https://YOUR-PROJECT-REF.supabase.co', 'project_url');
select vault.create_secret('YOUR-SERVICE-ROLE-KEY', 'service_role_key');

-- 05:37 UK time-ish (cron runs in UTC). Off the hour so it doesn't queue behind other jobs.
select cron.schedule(
  'nightly-price-refresh',
  '37 5 * * *',
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/refresh-prices-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 300000
  );
  $$
);

-- Every hour at :23 — read 60 queued product pages (about 20 per supplier) and
-- cache their prices. Over a week that covers the common trade items at
-- Toolstation, Wickes and Travis Perkins; quotes open any missing page live.
select cron.schedule(
  'hourly-product-crawl',
  '23 * * * *',
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/process-crawl-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body    := '{"batchSize": 60}'::jsonb,
    timeout_milliseconds := 150000
  );
  $$
);

-- To check it later:   select * from cron.job_run_details order by start_time desc limit 5;
-- To remove them:       select cron.unschedule('nightly-price-refresh'); select cron.unschedule('hourly-product-crawl');
