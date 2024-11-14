import postgres from "postgres";
import { env } from "node:process";
import { ofetch } from "ofetch";

const databaseUrl = env.SUPABASE_DATABASE_URL!;

export interface SpotifyTrackDb {
  id: number;
  artist: string;
  title: string;
  album_title: string;
  played_at: string;
  track_number: number;
  album_uri: string;
}

export type SpotifyTrackApiPlayInfo = Pick<SpotifyTrackDb, "album_uri" | "track_number">;

export interface SpotifyDevice {
  id: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number;
}

async function refreshAccessToken(): Promise<string> {
  const spotifyClientId = env.SPOTIFY_CLIENT_ID!;
  const spotifyClientSecret = env.SPOTIFY_CLIENT_SECRET!;
  const spotifyRefreshToken = env.SPOTIFY_REFRESH_TOKEN!;

  const jsonResponse = await ofetch(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      body: `grant_type=refresh_token&refresh_token=${spotifyRefreshToken}`,
      headers: {
        "Authorization": `Basic ${btoa(
          spotifyClientId + ":" + spotifyClientSecret,
        )}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  return jsonResponse.access_token;
}

async function createAuthHeader() {
  const accessToken = await refreshAccessToken();
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function recentlyPlayed() {
  const authHeader = await createAuthHeader();
  const jsonResponse = await ofetch(
    "https://api.spotify.com/v1/me/player/recently-played?limit=50",
    {
      headers: authHeader,
    },
  );
  return jsonResponse.items;
}

export async function lastSpotifyTrackDb(): Promise<any> {
  const sql = postgres(databaseUrl);
  const result = await sql`
    select id, track_id, artist, title, played_at
    from spotify_tracks
    order by played_at desc
    limit 1;
  `;

  if (result.length > 0) {
    return result[0];
  }
  return null;
}

export async function playTrack(albumUri: string, trackOffset: number) {
  const authHeader = await createAuthHeader();
  console.log(albumUri, trackOffset);
  return await ofetch(
    `https://api.spotify.com/v1/me/player/play?device_id=${env.SPOTIFY_DEVICE_ID!}`,
    {
      method: "PUT",
      headers: {
        ...authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        context_uri: albumUri,
        offset: {
          position: trackOffset,
        },
      }),
    },
  );
}

export async function getDevices() {
  const authHeader = await createAuthHeader();
  return await ofetch("https://api.spotify.com/v1/me/player/devices", {
    headers: authHeader,
  });
}

export async function updateSpotifyHistory() {
  const recentlyPlayedApi = await recentlyPlayed();
  const lastPlayedApiTrack = recentlyPlayedApi[0]?.track;

  console.log("fetched last played api track", lastPlayedApiTrack);

  if (lastPlayedApiTrack) {
    const apiTrackId = lastPlayedApiTrack.id;
    console.log("fetched last played api track", apiTrackId);

    const lastPlayedDbTrack = await lastSpotifyTrackDb();
    const dbTrackId = lastPlayedDbTrack?.track_id;

    const trackInfo = {
      apiTrackId,
      apiTrackName: lastPlayedApiTrack.name,
      dbTrackId,
      dbTrackName: lastPlayedDbTrack?.title,
    };
    console.log("track info", trackInfo);

    if (dbTrackId && apiTrackId !== dbTrackId) {
      console.log("tracks different -> updating db");
      const sql = postgres(databaseUrl);

      await sql`insert into spotify_tracks (track) values (${lastPlayedApiTrack})`;
      console.log("updated db successfully");
      return {
        message: "updated db successfully",
        trackInfo,
        lastPlayedDbTrack,
      };
    } else {
      console.log("tracks same -> no update needed");
      return {
        message: "no db update needed",
        trackInfo,
        lastPlayedDbTrack,
      };
    }
  } else {
    return {
      message: "no api track found",
    };
  }
}

/*
export async function searchSpotify(query: string) {
  if (query.length < 3) {
    return [];
  }

  const client = new postgres.Client(databaseUrl);
  await client.connect();
  return await client.queryArray(
    `
    select id, track_id, artist, title, played_at
    from spotify_tracks
    where artist ilike $1 or title ilike $1
    order by played_at desc
    limit 10;
    `,
    [`%${query}%`]
  );
}
 */

async function main() {
  // searchSpotify("ein mann namens ove").then((result) => {
  //   console.log(result.rows);
  // });
  // const lastSpotifyTrack = await lastSpotifyTrackDb();
  // console.log(lastSpotifyTrack);
  // const accessToken = await refreshAccessToken();
  // console.log(accessToken);
  // const recentlyPlayedTracks = await recentlyPlayed();
  // console.log(recentlyPlayedTracks[0].track);
  // const lastPlayedTrackDb = await lastSpotifyTrackDb();
  // console.log(lastPlayedTrackDb);
  const updateResult = await updateSpotifyHistory();
  console.log(updateResult);
  process.exit(0);
}

// @ts-ignore
if (import.meta.main) {
  main();
}
