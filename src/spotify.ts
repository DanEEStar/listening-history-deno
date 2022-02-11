import * as postgres from "https://deno.land/x/postgres@v0.15.0/mod.ts";
import { myFetch } from "./utils.ts";

const databaseUrl = Deno.env.get("SUPBASE_DATABASE_URL")!;

interface SpotifyTrackDb {
  id: number;
  track: any;
  track_id: string;
  artist: string;
  title: string;
  played_at: string;
}

async function refreshAccessToken(): Promise<string> {
  const spotifyClientId = Deno.env.get("SPOTIFY_CLIENT_ID")!;
  const spotifyClientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET")!;
  const spotifyRefreshToken = Deno.env.get("SPOTIFY_REFRESH_TOKEN")!;

  const jsonResponse2 = await myFetch(
    "https://accounts.spotify.com/api/token",
    {
      body: `grant_type=refresh_token&refresh_token=${spotifyRefreshToken}`,
      headers: {
        "Authorization": `Basic ${
          btoa(spotifyClientId + ":" + spotifyClientSecret)
        }`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    },
  );

  return (await jsonResponse2.json()).access_token;
}

async function createAuthHeader() {
  const accessToken = await refreshAccessToken();
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function recentlyPlayed() {
  const authHeader = await createAuthHeader();
  const jsonResponse = await myFetch(
    "https://api.spotify.com/v1/me/player/recently-played?limit=50",
    {
      headers: authHeader,
    },
  );
  return (await jsonResponse.json()).items;
}

async function lastPlayedDb(): Promise<SpotifyTrackDb | null> {
  const client = new postgres.Client(databaseUrl);
  await client.connect();
  const result = (await client.queryObject(`
    select id, track_id, artist, title, played_at
    from spotify_tracks
    order by played_at desc
    limit 1;
  `));
  await client.end();
  if (result.rows.length > 0) {
    return result.rows[0] as SpotifyTrackDb;
  }
  return null;
}

export async function updateSpotifyHistory() {
  const recentlyPlayedApi = await recentlyPlayed();
  const lastPlayedApiTrack = recentlyPlayedApi[0]?.track;

  console.log("fetched last played api track", {
    trackId: lastPlayedApiTrack?.track,
  });

  if (lastPlayedApiTrack) {
    const apiTrackId = lastPlayedApiTrack.id;
    console.log("fetched last played api track", apiTrackId);

    const lastPlayedDbTrack = await lastPlayedDb();
    const dbTrackId = lastPlayedDbTrack?.track_id;

    const trackInfo = {
      apiTrackId,
      apiTrackName: lastPlayedApiTrack.name,
      dbTrackId,
      dbTrackName: lastPlayedDbTrack?.title,
    };

    if (apiTrackId !== dbTrackId) {
      console.log("tracks different -> updating db");
      const client = new postgres.Client(databaseUrl);
      await client.connect();
      await client.queryArray(
        `insert into spotify_tracks (track) values ($1)`,
        [lastPlayedApiTrack],
      );
      await client.end();
      console.log("updated db successfully");
      return Object.assign({
        message: "updated db successfully",
        trackInfo,
        lastPlayedDbTrack,
      });
    } else {
      console.log("tracks same -> no update needed");
      return Object.assign({
        message: "no db update needed",
        trackInfo,
        lastPlayedDbTrack,
      });
    }
  } else {
    return {
      message: "no api track found",
    };
  }
}

function main() {
  updateSpotifyHistory();
}

if (import.meta.main) {
  main();
}
