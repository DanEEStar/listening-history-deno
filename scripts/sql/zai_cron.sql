-- z.ai cron jobs: trigger the GLM Coding Plan 5-hour usage window with a
-- minimal "hello" request, three times a day.
--
-- How to apply:
--   1. Copy this into the Supabase SQL editor (requires pg_cron and http
--      extensions, which supbase_init.sql creates).
--   2. Replace <ZAI_API_KEY> with the Coding Plan key from the z.ai console.
--      Do NOT put the real key in this file; it is committed to the repo.
--   3. Run. The key is then stored in the function definition (pg_proc).
--
-- Verify:
--   select status, content from zai_hello_or_fail();  -- fires one real request
--   select jobname, schedule, active from cron.job where jobname like 'zai-hello%';

-- minimal "hello" request against the OpenAI-compatible endpoint.
-- the http extension is pgsql-http: its http_post() has no header support,
-- so use the generic http() with an http_request composite instead
CREATE OR REPLACE FUNCTION zai_hello_or_fail()
    RETURNS http_response
    LANGUAGE plpgsql
AS $fn$
DECLARE
    response http_response;
BEGIN
    PERFORM set_config('http.timeout_msec', '30000', true);

    SELECT *
    INTO response
    FROM http(
        ROW(
            'POST',
            'https://api.z.ai/api/coding/paas/v4/chat/completions',
            ARRAY[ROW('Authorization', 'Bearer <ZAI_API_KEY>')::http_header]::http_header[],
            'application/json',
            '{"model": "glm-5.3-flash", "messages": [{"role": "user", "content": "Say hello"}]}'
        )::http_request
    );

    IF response.status IS DISTINCT FROM 200 THEN
        RAISE EXCEPTION 'The z.ai request failed: % %', response.status, response.content;
    END IF;

    RETURN response;
END;
$fn$;

-- times are UTC (pg_cron always schedules in UTC), staggered just over five
-- hours apart
select
  cron.schedule(
    'zai-hello-1',
    '14 3 * * *',
    $$
    select status
    from zai_hello_or_fail()
    $$
  );

select
  cron.schedule(
    'zai-hello-2',
    '31 8 * * *',
    $$
    select status
    from zai_hello_or_fail()
    $$
  );

select
  cron.schedule(
    'zai-hello-3',
    '48 13 * * *',
    $$
    select status
    from zai_hello_or_fail()
    $$
  );
