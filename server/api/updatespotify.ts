import { updatePocketCastsHistory } from "~/server/pocketCasts.ts";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const size = parseInt((query.size as string) ?? "10", 10);
  // const ignorePlayingStatus =
  //   url.searchParams.get("ignorePlayingStatus") === "true";
  return await updatePocketCastsHistory(size);
});
