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
  album_image?: string;
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

export async function playTrack(albumUri: string, trackOffset: number, deviceId: string | null = null) {
  if (!deviceId) {
    deviceId = env.SPOTIFY_DEVICE_ID!;
  }
  console.log(albumUri, trackOffset, deviceId);

  const authHeader = await createAuthHeader();
  return await ofetch(
    `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
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

// 🔍 Fetch full album tracklist and compute index of trackId
export async function getAlbumTrackIndex(albumUri: string, trackId: string): Promise<number | null> {
  const albumId = albumUri.split(":").pop();
  if (!albumId) return null;

  const authHeader = await createAuthHeader();
  const allTracks: any[] = [];

  let offset = 0;
  const limit = 50;

  while (true) {
    const res = await ofetch(`https://api.spotify.com/v1/albums/${albumId}/tracks`, {
      headers: authHeader,
      params: {
        offset,
        limit,
      },
    });

    allTracks.push(...res.items);

    if (res.items.length < limit) break;
    offset += limit;
  }

  allTracks.sort((a, b) =>
    a.disc_number === b.disc_number
      ? a.track_number - b.track_number
      : a.disc_number - b.disc_number,
  );

  const index = allTracks.findIndex((t) => t.id === trackId);
  return index >= 0 ? index : null;
}

// ⚡ Fast path if disc_number === 1
export async function getAlbumTrackIndexFast(track: any): Promise<number | null> {
  if (track.disc_number === 1) {
    return track.track_number - 1;
  }

  return await getAlbumTrackIndex(track.album.uri, track.id);
}

// 📥 Update database with most recent track if new
export async function updateSpotifyHistory(forceUpdate = false) {
  const recentlyPlayedApi = await recentlyPlayed();
  const lastPlayedApiTrack = recentlyPlayedApi[0]?.track;

  console.log("fetched last played api track", lastPlayedApiTrack);

  if (lastPlayedApiTrack) {
    const apiTrackId = lastPlayedApiTrack.id;
    console.log("fetched last played api track", apiTrackId);

    const lastPlayedDbTrack = await lastSpotifyTrackDb();
    const dbTrackId = lastPlayedDbTrack?.track_id;

    const albumIndex = await getAlbumTrackIndexFast(lastPlayedApiTrack);
    console.log("album index of current track", albumIndex);

    const trackInfo = {
      apiTrackId,
      apiTrackName: lastPlayedApiTrack.name,
      dbTrackId,
      dbTrackName: lastPlayedDbTrack?.title,
      albumIndex,
    };
    console.log("track info", trackInfo);

    if (dbTrackId && apiTrackId !== dbTrackId || forceUpdate) {
      console.log("tracks different -> updating db");
      const sql = postgres(databaseUrl);

      const enrichedTrack = {
        ...lastPlayedApiTrack,
        album_index: albumIndex,
      };

      await sql`insert into spotify_tracks (track) values (${enrichedTrack})`;
      console.log("updated db successfully");
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

async function main() {
  const updateResult = await updateSpotifyHistory(true);
  console.log(updateResult);
  process.exit(0);
}

// @ts-ignore
if (import.meta.main) {
  main();
}