import { createStatusResult } from "~/server/services/status.ts";

export default defineEventHandler(async (event) => {
  return await createStatusResult();
});
