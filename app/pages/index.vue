<script setup lang="ts">
import type { SpotifyDevice, SpotifyTrackApiPlayInfo } from "#shared/types/spotify";

const { data: spotifyDevicesRaw } = await useFetch("/api/spotify/devices");
const spotifyDevices = computed(() => {
  if (spotifyDevicesRaw.value) {
    return spotifyDevicesRaw.value.map((device: SpotifyDevice) => ({
      label: device.name,
      description: `${device.type}${device.is_active ? " (Active)" : ""}${device.volume_percent ? ` - ${device.volume_percent}%` : ""}`,
      value: device.id,
      disabled: !device.is_active && device.is_restricted,
    }));
  }
  return [];
});

const spotifyDeviceSelected = useLocalStorage("spotifyDevice", undefined);

const {
  searchQuery,
  lastTracks,
  lastTracksError,
  audiobooks,
  audiobooksError,
  search,
} = await useListeningHistory();

async function playTrack(track: SpotifyTrackApiPlayInfo) {
  let track_number = track.track_number;
  if (track.album_index) {
    track_number = track.album_index + 1;
  }
  await $fetch("/api/spotify/play", {
    method: "POST",
    body: {
      // `album_index` somehow is 1-based...
      track_number: track_number,
      album_uri: track.album_uri,
      device_id: spotifyDeviceSelected.value,
    },
  });
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section class="my-6">
        <div class="space-y-4">
          <h2 class="text-lg font-semibold text-gray-900">Spotify Device</h2>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label
              v-for="device in spotifyDevices"
              :key="device.value"
              class="relative flex cursor-pointer rounded-lg border p-4 transition-colors"
              :class="[
                device.disabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer hover:border-blue-500',
                spotifyDeviceSelected === device.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white',
              ]"
            >
              <input
                type="radio"
                :value="device.value"
                v-model="spotifyDeviceSelected"
                :disabled="device.disabled"
                class="sr-only"
              />
              <div>
                <span class="block font-medium text-gray-900">{{ device.label }}</span>
                <span class="mt-1 block text-sm text-gray-500">
                  {{ device.description }}
                </span>
              </div>
            </label>
          </div>
        </div>
      </section>

      <hr class="my-6 border-gray-200" />

      <section class="my-8">
        <div class="flex flex-col gap-4 sm:flex-row">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search tracks, artists, or albums..."
            class="flex-1 rounded-md border border-gray-300 px-3 py-2.5 text-base focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <button
            @click="search()"
            class="w-full rounded-md bg-blue-600 px-8 py-2.5 text-base font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:w-auto"
          >
            Search
          </button>
        </div>
      </section>

      <section class="my-8 flex flex-col gap-8 lg:flex-row">
        <div class="w-full lg:w-1/2">
          <h3 class="mb-6 text-2xl font-bold text-gray-900 lg:text-3xl">Audiobooks</h3>
          <p v-if="audiobooksError" class="text-sm text-red-600">
            Failed to load audiobooks: {{ audiobooksError.message }}
          </p>
          <div class="space-y-4">
            <TrackItem
              v-for="track in audiobooks"
              :key="track.id"
              :track="track"
              :is-audiobook="true"
              @play="playTrack"
            />
          </div>
        </div>

        <div class="mt-8 w-full lg:mt-0 lg:w-1/2">
          <h3 class="mb-6 text-2xl font-bold text-gray-900 lg:text-3xl">Last Tracks</h3>
          <p v-if="lastTracksError" class="text-sm text-red-600">
            Failed to load tracks: {{ lastTracksError.message }}
          </p>
          <div class="space-y-4">
            <TrackItem
              v-for="track in lastTracks"
              :key="track.id"
              :track="track"
              :is-audiobook="false"
              @play="playTrack"
            />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
