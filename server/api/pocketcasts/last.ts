import { lastPocketCastsEpisodeDb } from "~/server/services/pocketCasts.ts";

export default defineEventHandler(async (event) => {
    return await lastPocketCastsEpisodeDb();
});
