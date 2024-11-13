import { updateSpotifyHistory } from "~/server/services/spotify.ts";

export default defineEventHandler(async (event) => {
  return await updateSpotifyHistory();
});
