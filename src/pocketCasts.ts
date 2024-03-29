import * as postgres from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import {myFetch} from "./utils.ts";

const databaseUrl = Deno.env.get("SUPBASE_DATABASE_URL")!;

interface PocketCastsEpisode {
  uuid: string;
  episode: any;
  title: string;
  podcast: string;
  playingStatus: number;
  duration: number;
  playedUpTo: number;
  played_at: string;
}

async function fetchToken(): Promise<string> {
  const pocketcastsUser = Deno.env.get("POCKET_CASTS_USER")!;
  const pocketcastsPw = Deno.env.get("POCKET_CASTS_PW")!;

  const jsonResponse = await myFetch("https://api.pocketcasts.com/user/login", {
    "headers": {
      "content-type": "application/json",
    },
    "body":
      `{"email":"${pocketcastsUser}","password":"${pocketcastsPw}","scope":"webplayer"}`,
    "method": "POST",
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
      "headers": authHeader,
      "method": "POST",
    },
  );

  return await jsonResponse.json();
}

async function insertEpisode(episodeJson: PocketCastsEpisode, ignorePlayingStatus = false) {
  const episodeInfo = {
    uuid: episodeJson.uuid,
    title: episodeJson.title,
    podcast: episodeJson.podcast,
    playingStatus: episodeJson.playingStatus,
    playedPercent: episodeJson.playedUpTo / episodeJson.duration,
  };

  if (
    episodeJson.playingStatus === 3 ||
    episodeJson.playedUpTo / episodeJson.duration > 0.7 ||
    ignorePlayingStatus
  ) {
    if (!episodeJson.played_at) {
      episodeJson.played_at = new Date().toISOString();
    }

    const client = new postgres.Client(databaseUrl);
    await client.connect();
    await client.queryArray(
      `
            insert into pocket_casts_episodes (uuid, episode, played_at) values ($1, $2, $3) 
            on conflict (uuid) do nothing`,
      [episodeJson.uuid, episodeJson, episodeJson.played_at],
    );
    await client.end();
    console.log("episode inserted", episodeInfo);
  } else {
    console.log("episode not fully played -> do not insert", episodeInfo);
  }
}

export async function updatePocketCastsHistory(size= 10, ignorePlayingStatus= false) {
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

export async function lastPocketCastsEpisodeDb(): Promise<
  PocketCastsEpisode | null
> {
  const client = new postgres.Client(databaseUrl);
  await client.connect();
  const result = (await client.queryObject(`
    select uuid, title, podcast, published, played_at
    from pocket_casts_episodes
    order by played_at desc
    limit 1;
  `));
  await client.end();
  if (result.rows.length > 0) {
    return result.rows[0] as PocketCastsEpisode;
  }
  return null;
}

async function insertOldData() {
  const text = await Deno.readTextFile("./processed_history.json");
  const json = JSON.parse(text);
  for (const episode of json) {
    console.log(episode.title, episode.played_at);
    await insertEpisode(episode);
  }
}

async function main() {
  await updatePocketCastsHistory();
}

if (import.meta.main) {
  main();
}
