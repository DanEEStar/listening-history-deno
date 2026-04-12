import { updateAppleMusicHistory } from "~/server/services/appleMusic.ts";

export default defineEventHandler(async () => {
  return await updateAppleMusicHistory();
});
