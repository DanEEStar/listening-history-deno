import postgres from "postgres";
import { env } from "node:process";
import { ofetch } from "ofetch";

const databaseUrl = env.SUPABASE_DATABASE_URL!;

function appleAuthHeaders() {
  return {
    Authorization: `Bearer ${env.APPLE_MUSIC_DEV_TOKEN!}`,
    "Music-User-Token": env.APPLE_MUSIC_USER_TOKEN_DANIEL!,
  };
}

async function recentlyPlayedAppleMusic() {
  const response = await ofetch(
    "https://api.music.apple.com/v1/me/recent/played/tracks?limit=10",
    {
      headers: appleAuthHeaders(),
    }
  );
  return response.data[0] ?? null;
}

export async function lastAppleMusicTrackDb(): Promise<any> {
  const sql = postgres(databaseUrl);
  const result = await sql`
    select id, song_id, artist, title, played_at
    from apple_music_tracks
    order by played_at desc
    limit 1;
  `;

  if (result.length > 0) {
    return result[0];
  }
  return null;
}

// 📥 Update database with most recent track if new
export async function updateAppleMusicHistory(forceUpdate = false) {
  const lastPlayedApiTrack = await recentlyPlayedAppleMusic();

  console.log("fetched last played apple music track", lastPlayedApiTrack);

  if (lastPlayedApiTrack) {
    const apiTrackId = lastPlayedApiTrack.id;
    console.log("apple music track id", apiTrackId);

    const lastPlayedDbTrack = await lastAppleMusicTrackDb();
    const dbTrackId = lastPlayedDbTrack?.song_id;

    const trackInfo = {
      apiTrackId,
      apiTrackName: lastPlayedApiTrack.attributes?.name,
      dbTrackId,
      dbTrackName: lastPlayedDbTrack?.title,
    };
    console.log("track info", trackInfo);

    if (((dbTrackId || apiTrackId) && apiTrackId !== dbTrackId) || forceUpdate) {
      console.log("tracks different -> updating db");
      const sql = postgres(databaseUrl);
      await sql`insert into apple_music_tracks (track) values (${lastPlayedApiTrack})`;
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
  const updateResult = await updateAppleMusicHistory(true);
  console.log(updateResult);
  process.exit(0);
}

// @ts-ignore
if (import.meta.main) {
  main();
}
