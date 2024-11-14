import { playTrack } from "~/server/services/spotify.ts";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  await playTrack(body.album_uri, body.track_number - 1, body.device_id ?? null);
  return { status: "success" };
});