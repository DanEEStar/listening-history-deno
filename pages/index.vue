<script setup lang="ts">
import type { SpotifyDevice, SpotifyTrackApiPlayInfo, SpotifyTrackDb } from "~/server/services/spotify";

const supabase = useSupabaseClient();

const { data: spotifyDevicesRaw } = await useFetch("/api/spotify/devices");
const spotifyDevices = computed(() => {
  if (spotifyDevicesRaw.value) {
    return spotifyDevicesRaw.value.map((device: SpotifyDevice) => ({
      ...device,
      label: device.name,
      value: device.id,
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
    .select("id, artist, title, album_title, played_at, track->track_number, album_uri:track->album->uri")
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

const { data: audiobooks, refresh: refreshAudiobooks } = await useAsyncData<SpotifyTrackDb[]>("audiobooks", async () => {
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

  return data;
});

async function playTrack(track: SpotifyTrackApiPlayInfo) {
  const res = await $fetch("/api/spotify/play", {
    method: "POST",
    body: {
      track_number: track.track_number,
      album_uri: track.album_uri,
      device_id: spotifyDeviceSelected.value,
    },
  });
}

</script>

<template>
  <div>
    <UContainer>

      <section class="my-4">
        <URadioGroup v-model="spotifyDeviceSelected" legend="Spotify Device" :options="spotifyDevices" />
      </section>

      <UDivider />

      <section class="my-8">
        <UInput v-model="searchQuery" placeholder="Search" />
        <UButton @click="search()">Search</UButton>
      </section>

      <section class="my-8 flex">
        <div class="w-1/2">
          <h3 class="text-2xl">Audiobooks</h3>
          <div v-for="track in audiobooks" :key="track.id" class="py-2">
            <div>{{ track.artist }}</div>
            <div>{{ track.album_title }}</div>
            <div>{{ track.title }}</div>
            <div>{{ track.played_at }}</div>
            <UButton @click="playTrack(track)">Play</UButton>
          </div>
        </div>

        <div class="w-1/2">
          <h3 class="text-2xl">Last Tracks</h3>
          <div v-for="track in lastTracks" :key="track.id" class="py-2">
            <div>{{ track.artist }}</div>
            <div>{{ track.album_title }}</div>
            <div>{{ track.title }}</div>
            <div>{{ track.played_at }}</div>
            <UButton @click="playTrack(track)">Play</UButton>
          </div>
        </div>
      </section>
    </UContainer>
  </div>
</template>
