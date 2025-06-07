<script setup lang="ts">
import type { SpotifyDevice, SpotifyTrackApiPlayInfo, SpotifyTrackDb } from "~/server/services/spotify";

const supabase = useSupabaseClient();

const { data: spotifyDevicesRaw } = await useFetch("/api/spotify/devices");
const spotifyDevices = computed(() => {
  if (spotifyDevicesRaw.value) {
    return spotifyDevicesRaw.value.map((device: SpotifyDevice) => ({
      label: device.name,
      description: `${device.type}${device.is_active ? ' (Active)' : ''}${device.volume_percent ? ` - ${device.volume_percent}%` : ''}`,
      value: device.id,
      disabled: !device.is_active && device.is_restricted,
    }));
  }
  return [];
});

const searchQuery = ref("");

function search() {
  refreshLastTracks();
  refreshAudiobooks();
}

const spotifyDeviceSelected = useLocalStorage("spotifyDevice", undefined);

const {
  data: lastTracks,
  refresh: refreshLastTracks,
} = await useAsyncData<SpotifyTrackDb[]>("lastTracks", async () => {
  const query = supabase
    .from("spotify_tracks")
    .select("id, artist, title, album_title, played_at, track->track_number, track->album_index, album_uri:track->album->uri, album_image:track->album->images->0->url")
    .order("played_at", { ascending: false })
    .limit(10);

  if (searchQuery.value) {
    query.or(`title.ilike.%${searchQuery.value}%,artist.ilike.%${searchQuery.value}%,album_title.ilike.%${searchQuery.value}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching data:", error);
    return [];
  }

  return data as SpotifyTrackDb[] || [];
});

const {
  data: audiobooks,
  refresh: refreshAudiobooks,
} = await useAsyncData<SpotifyTrackDb[]>("audiobooks", async () => {
  const query = supabase
    .rpc("get_album_tracks")
    .select("*")
    .order("played_at", { ascending: false })
    .limit(10);

  if (searchQuery.value) {
    query.or(`title.ilike.%${searchQuery.value}%,artist.ilike.%${searchQuery.value}%,album_title.ilike.%${searchQuery.value}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching data:", error);
    return [];
  }

  return data as SpotifyTrackDb[] || [];
});

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
    <UContainer class="py-6 px-4 sm:px-6 lg:px-8">

      <section class="my-6">
        <div class="space-y-4">
          <h2 class="text-lg font-semibold text-gray-900">Spotify Device</h2>
          <URadioGroup 
            v-model="spotifyDeviceSelected" 
            :items="spotifyDevices"
            variant="card"
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          />
        </div>
      </section>

      <USeparator />

      <section class="my-8">
        <div class="flex flex-col sm:flex-row gap-4">
          <UInput 
            v-model="searchQuery" 
            placeholder="Search tracks, artists, or albums..."
            class="flex-1"
            size="lg"
          />
          <UButton 
            @click="search()" 
            size="lg"
            class="w-full sm:w-auto px-8"
          >
            Search
          </UButton>
        </div>
      </section>

      <section class="my-8 flex flex-col lg:flex-row gap-8">
        <div class="w-full lg:w-1/2">
          <h3 class="text-2xl lg:text-3xl mb-6 font-bold text-gray-900">Audiobooks</h3>
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

        <div class="w-full lg:w-1/2 mt-8 lg:mt-0">
          <h3 class="text-2xl lg:text-3xl mb-6 font-bold text-gray-900">Last Tracks</h3>
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
    </UContainer>
  </div>
</template>
