import { getDevices, SpotifyDevice } from "~/server/services/spotify.ts";

export default defineEventHandler(async (event) => {
  return (await getDevices()).devices as SpotifyDevice[];
});
