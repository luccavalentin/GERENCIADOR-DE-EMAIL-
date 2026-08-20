
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'monitor-emails-every-minute') THEN
        PERFORM cron.unschedule('monitor-emails-every-minute');
    END IF;
END $$;

SELECT cron.schedule(
  'monitor-emails-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://id-preview--be0ed204-07ca-4c9d-94a3-85dadb49afd5.lovable.app/api/public/cron/monitor',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJid2luYmdkeWdvYm90a3ZwaGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMzg3NzQsImV4cCI6MjEwMjgxNDc3NH0.E3TkqILiVGSbs2v9dyUMGEkUv1wQOfHJXCwVQqjoQDs"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
