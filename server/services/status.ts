import postgres from "postgres";
import { env } from "node:process";
import { lastSpotifyTrackDb } from "./spotify.ts";
import { lastPocketCastsEpisodeDb } from "./pocketCasts.ts";

const databaseUrl = env.SUPABASE_DATABASE_URL!;

async function getJobStatus() {
  const sql = postgres(databaseUrl);
  const result = await sql`
    select max(j.jobname) as jobname, max(jr.end_time) as end_time
    from cron.job_run_details jr
    join cron.job j on jr.jobid = j.jobid
    where status = 'succeeded'
    group by jr.jobid;
  `;

  if (result.length === 0) {
    return {};
  }

  return result.reduce((acc, row) => {
    acc[row.jobname] = row;
    return acc;
  }, {});
}

async function getNumJobEntries() {
  const sql = postgres(databaseUrl);
  const result = await sql`
    select count(*) from cron.job_run_details;
  `;

  if (result[0].count > 0) {
    return parseInt(result[0].count, 10);
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

// @ts-ignore
if (import.meta.main) {
  main();
}
