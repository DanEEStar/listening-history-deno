import { lastPocketCastsEpisodeDb } from "~/server/pocketCasts.ts";
import consola from "consola";
import { env } from "node:process";

export default defineEventHandler(async (event) => {
  consola.log("start /api/casts endpoint");
  consola.log("SPOTIFY_CLIENT_ID", env.SPOTIFY_CLIENT_ID);
  const lastPocketCastsEpisode = await lastPocketCastsEpisodeDb();
  return lastPocketCastsEpisode;
});
