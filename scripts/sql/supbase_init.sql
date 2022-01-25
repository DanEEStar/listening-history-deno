create extension if not exists pg_cron;
create extension if not exists http;

select
  cron.schedule(
    'webhook-every-minute', -- name of the cron job
    '* * * * *', -- every minute
    $$
    select status
    from http_get('https://listening-history-deno.deno.dev/update')
    $$
  );

-- see cron jobs
select * from cron.job;

-- see cron jobs details
select * from cron.job_run_details;