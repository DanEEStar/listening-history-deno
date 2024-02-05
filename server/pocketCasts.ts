import postgres from "postgres";
import { myFetch } from "./services.ts";
import { env } from "node:process";

const databaseUrl = env.SUPABASE_DATABASE_URL!;

interface PocketCastsEpisode {
  uuid: string;
  episode: any;
  title: string;
  podcastTitle: string;
  playingStatus: number;
  duration: number;
  playedUpTo: number;
  played_at: string;
}

async function fetchToken(): Promise<string> {
  const pocketcastsUser = env.POCKET_CASTS_USER;
  const pocketcastsPw = env.POCKET_CASTS_PW;

  const jsonResponse = await myFetch("https://api.pocketcasts.com/user/login", {
    headers: {
      "content-type": "application/json",
    },
    body: `{"email":"${pocketcastsUser}","password":"${pocketcastsPw}","scope":"webplayer"}`,
    method: "POST",
  });

  return (await jsonResponse.json()).token;
}

async function createAuthHeader() {
  const accessToken = await fetchToken();
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function fetchHistory() {
  const authHeader = await createAuthHeader();

  const jsonResponse = await myFetch(
    "https://api.pocketcasts.com/user/history",
    {
      headers: authHeader,
      method: "POST",
    }
  );

  return await jsonResponse.json();
}

async function insertEpisode(
  episodeJson: PocketCastsEpisode,
  ignorePlayingStatus = false
) {
  if (
    episodeJson.playingStatus === 3 ||
    episodeJson.playedUpTo / episodeJson.duration > 0.7 ||
    ignorePlayingStatus
  ) {
    if (!episodeJson.played_at) {
      episodeJson.played_at = new Date().toISOString();
    }

    const sql = postgres(databaseUrl);
    const result = await sql`
        insert into pocket_casts_episodes (uuid, episode, played_at) 
        values (${episodeJson.uuid}, ${JSON.stringify(episodeJson)}, ${
          episodeJson.played_at
        }) 
        on conflict (uuid) do nothing
    `;
    console.log("episode inserted", episodeJson.title);
  } else {
    console.log("episode not fully played -> do not insert", episodeJson.title);
  }
}

export async function updatePocketCastsHistory(
  size = 10,
  ignorePlayingStatus = false
) {
  const history = await fetchHistory();
  for (const episode of history.episodes.slice(0, size)) {
    await insertEpisode(episode, ignorePlayingStatus);
  }

  const newestEpisode = history.episodes[0];

  return {
    message: "update complete",
    newestEpisode: newestEpisode,
  };
}

export async function lastPocketCastsEpisodeDb(): Promise<PocketCastsEpisode | null> {
  const sql = postgres(databaseUrl);

  const latestTracks = await sql`
    select uuid, title, podcast, published, played_at
    from pocket_casts_episodes
    order by played_at desc
    limit 1;
`;

  if (latestTracks.length > 0) {
    return latestTracks[0] as PocketCastsEpisode;
  }
  return null;
}

/*
async function insertOldData() {
  const text = await Deno.readTextFile("./processed_history.json");
  const json = JSON.parse(text);
  for (const episode of json) {
    console.log(episode.title, episode.played_at);
    await insertEpisode(episode);
  }
}
 */

async function main() {
  // await updatePocketCastsHistory();
  const lastEpisode = await lastPocketCastsEpisodeDb();
  console.log(lastEpisode);
}

// @ts-ignore
if (import.meta.main) {
  main();
}
