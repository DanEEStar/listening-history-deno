import { playTrack } from "~/server/services/spotify.ts";


export default defineEventHandler(async (event) => {
  console.log("spotify play (first line)");
  const body = await readBody(event);
  console.log("spotify play", body);
  await playTrack(body.album_uri, body.track_number - 1, body.device_id ?? null);
  return { status: "success" };
});