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

select
  cron.schedule(
    'update-pocket-casts-history', -- name of the cron job
    '*/5 * * * *', -- every 5 minutes
    $$
    select status
    from http_get('https://listening-history-deno.deno.dev/updatepocketcasts')
    $$
  );

-- see cron jobs
select * from cron.job;

-- see cron jobs details
select * from cron.job_run_details order by end_time desc limit 10;