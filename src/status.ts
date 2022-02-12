import * as postgres from "https://deno.land/x/postgres@v0.15.0/mod.ts";
import {lastSpotifyTrackDb} from "./spotify.ts";
import {lastPocketCastsEpisodeDb} from "./pocketCasts.ts";

const databaseUrl = Deno.env.get("SUPBASE_DATABASE_URL")!;

async function getJobStatus() {
  const client = new postgres.Client(databaseUrl);
  await client.connect();
  const result = (await client.queryObject(`
    select max(j.jobname) as jobname, max(jr.end_time) as end_time
    from cron.job_run_details jr
    join cron.job j on jr.jobid = j.jobid
    where status = 'succeeded'
    group by jr.jobid;
  `));
  await client.end();

  if (result.rows instanceof Array) {
    return result.rows.reduce((acc, row) => {
      acc[row.jobname] = row;
      return acc;
    }, {});
  }

  return {};
}

async function getNumJobEntries() {
  const client = new postgres.Client(databaseUrl);
  await client.connect();
  const result = (await client.queryObject(`
    select count(*) from cron.job_run_details;
  `));
  await client.end();

  if (result.rows instanceof Array) {
    return parseInt(result.rows[0].count, 10);
  }

  return -1;
}

export async function createStatusResult() {
  const jobStatus = await getJobStatus();
  const numJobEntries = await getNumJobEntries();
  const lastSpotifyTrack = await lastSpotifyTrackDb();
  const lastPocketCastsEpisode = await lastPocketCastsEpisodeDb();

  return {
    jobStatus,
    numJobEntries,
    lastSpotifyTrack,
    lastPocketCastsEpisode,
  };
}

async function main() {
  const statusResult = await createStatusResult();
  console.log(JSON.stringify(statusResult, null, 2));
}

if (import.meta.main) {
  main();
}
