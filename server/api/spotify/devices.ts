import type { SpotifyDevice } from "#shared/types/spotify";

export default defineEventHandler(async (event) => {
  return (await getDevices()).devices as SpotifyDevice[];
});
