create extension if not exists pg_cron;
create extension if not exists http;

CREATE OR REPLACE FUNCTION http_get_or_fail(uri VARCHAR)
    RETURNS http_response
    LANGUAGE plpgsql
AS $$
DECLARE
    response http_response;
BEGIN
   SELECT *
   INTO response
   FROM http_get(uri);

   IF response.status != '200' THEN
     RAISE EXCEPTION 'The http request failed';
   END IF;

   RETURN response;
END;
$$;

select
  cron.schedule(
    'update-spotify-history',
    '* * * * *',
    $$
    select status
    from http_get_or_fail('https://listening-history-deno.deno.dev/update')
    $$
  );

select
  cron.schedule(
    'update-pocket-casts-history', -- name of the cron job
    '*/5 * * * *', -- every 5 minutes
    $$
    select status
    from http_get_or_fail('https://listening-history-deno.deno.dev/updatepocketcasts')
    $$
  );

-- purging old log entries
SELECT cron.schedule(
  'purge-old-logs',
  '0 0 * * *',
  $$
  DELETE
  FROM cron.job_run_details
  WHERE end_time < now() - interval '10 days'
  $$
);

-- see cron jobs
select * from cron.job;

-- see cron jobs details
select end_time, status, * from cron.job_run_details order by end_time desc limit 100;

select count(*) from cron.job_run_details;

-- get last entry from last succesfull job run
select max(j.jobname), max(jr.end_time)
from cron.job_run_details jr
join cron.job j on jr.jobid = j.jobid
where status = 'succeeded'
group by jr.jobid;


-- delete cron job
-- select cron.unschedule('webhook-test');
