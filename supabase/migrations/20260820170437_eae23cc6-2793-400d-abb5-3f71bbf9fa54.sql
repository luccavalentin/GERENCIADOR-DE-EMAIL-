
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'monitor-emails-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--be0ed204-07ca-4c9d-94a3-85dadb49afd5.lovable.app/api/public/cron/monitor',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_9klNiYfipDaAaS5soluiKg_7KA199Mv"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
