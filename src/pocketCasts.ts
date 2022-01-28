import * as postgres from "https://deno.land/x/postgres@v0.15.0/mod.ts";

const databaseUrl = Deno.env.get("SUPBASE_DATABASE_URL")!;


interface PocketCastsEpisode {
  uuid: string;
  episode: any;
  title: string;
  podcast: string;
  playingStatus: number;
  duration: number;
  playedUpTo: number;
  created_at: string;
  updated_at: string;
}


async function fetchToken(): Promise<string> {
  const pocketcastsUser = Deno.env.get("POCKET_CASTS_USER")!;
  const pocketcastsPw = Deno.env.get("POCKET_CASTS_PW")!;

  const jsonResponse = await fetch("https://api.pocketcasts.com/user/login", {
    "headers": {
      "content-type": "application/json",
    },
    "body": `{"email":"${pocketcastsUser}","password":"${pocketcastsPw}","scope":"webplayer"}`,
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

  const jsonResponse = await fetch("https://api.pocketcasts.com/user/history", {
    "headers": authHeader,
    "method": "POST",
  });

  return await jsonResponse.json();
}

async function processHistory() {

}

async function insertEpisode(episodeJson: PocketCastsEpisode, playedAt: Date = new Date()) {
  const episodeInfo = {
    uuid: episodeJson.uuid,
    title: episodeJson.title,
    podcast: episodeJson.podcast,
    playingStatus: episodeJson.playingStatus,
    playedPercent: episodeJson.playedUpTo / episodeJson.duration,
  };

  if (episodeJson.playingStatus === 3 || episodeJson.playedUpTo / episodeJson.duration > 0.7) {
    const client = new postgres.Client(databaseUrl);
    await client.connect();
    await client.queryArray(
        `insert into pocket_casts_episodes (uuid, episode, played_at) values ($1, $2, $3) 
       on conflict (uuid) do nothing`,
        [episodeJson.uuid, episodeJson, playedAt],
    );
    await client.end();
    console.log("episode inserted", episodeInfo);
  }
  else {
    console.log("episode not fully played -> do not insert", episodeInfo);
  }
}

//
// async function lastPlayedDb(): Promise<SpotifyTrackDb | null> {
//   const client = new postgres.Client(databaseUrl);
//   await client.connect();
//   const result = (await client.queryObject(`
//     select id, track_id, artist, title
//     from spotify_tracks
//     order by id desc
//     limit 1;
//   `));
//   await client.end();
//   if (result.rows.length > 0) {
//     return result.rows[0] as SpotifyTrackDb;
//   }
//   return null;
// }
//
// export async function updatePlayHistory() {
//   const recentlyPlayedApi = await recentlyPlayed();
//   const lastPlayedApiTrack = recentlyPlayedApi[0]?.track;
//
//   console.log("fetched last played api track", {
//     trackId: lastPlayedApiTrack?.track,
//   });
//
//   if (lastPlayedApiTrack) {
//     const apiTrackId = lastPlayedApiTrack.id;
//     console.log("fetched last played api track", apiTrackId);
//
//     const lastPlayedDbTrack = await lastPlayedDb();
//     const dbTrackId = lastPlayedDbTrack?.track_id;
//
//     const trackInfo = {
//       apiTrackId,
//       apiTrackName: lastPlayedApiTrack.name,
//       dbTrackId,
//       dbTrackName: lastPlayedDbTrack?.title,
//     }
//
//
//     if (apiTrackId !== dbTrackId) {
//       console.log("tracks different -> updating db");
//       const client = new postgres.Client(databaseUrl);
//       await client.connect();
//       await client.queryArray(
//         `insert into spotify_tracks (track) values ($1)`,
//         [lastPlayedApiTrack],
//       );
//       await client.end();
//       console.log("updated db successfully");
//       return Object.assign({
//         message: "updated db successfully",
//         trackInfo,
//       })
//     } else {
//       console.log("tracks same -> no update needed");
//       return Object.assign({
//         message: "no db update needed",
//         trackInfo,
//       })
//     }
//   } else {
//     return {
//       message: "no api track found",
//     }
//   }
// }

async function main() {
  const [p1, p2, p3] = (await fetchHistory()).episodes;
  console.log(p3);
  console.log(p2);
  console.log(p1);

  for (const episode of (await fetchHistory()).episodes) {
    await insertEpisode(episode);
  }
}

if (import.meta.main) {
  main();
}
