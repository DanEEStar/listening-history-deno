import { lastPocketCastsEpisodeDb } from "~/server/pocketCasts.ts";

export default defineEventHandler(async (event) => {
  const lastPocketCastsEpisode = await lastPocketCastsEpisodeDb();
  return lastPocketCastsEpisode;
});
