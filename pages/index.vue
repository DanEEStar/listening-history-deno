<script setup lang="ts">
import type { SpotifyDevice, SpotifyTrackApiPlayInfo, SpotifyTrackDb } from "~/server/services/spotify";

const client = useSupabaseClient();

const data = ref<SpotifyTrackDb[]>([]);

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

const spotifyDeviceSelected = useLocalStorage('spotifyDevice', undefined);


async function loadData() {
  const response = await client
    .from("spotify_tracks")
    .select("id, artist, title, album_title, played_at, track->track_number, album_uri:track->album->uri")
    // .ilike("title", "%Zwerge%")
    .order("played_at", { ascending: false })
    .limit(10)
    .returns<SpotifyTrackDb[]>();
  if (response.data) {

    data.value = response.data;
  }
}

async function loadAlbumData() {
  const response = await client
    .rpc("get_album_tracks")
    .select("*")
    .order("played_at", { ascending: false })
    .limit(10)
    .returns<SpotifyTrackDb[]>();
  if (response.data) {
    data.value = response.data;
  }
}

async function playTrack(track: SpotifyTrackApiPlayInfo) {
  const res = await $fetch("/api/spotify/play", {
    method: "POST",
    body: track,
  });
}

</script>

<template>
  <div>
    <UContainer>

      <section>
        <URadioGroup v-model="spotifyDeviceSelected" legend="Spotify Device" :options="spotifyDevices" />
      </section>
      <div>
        <UButton @click="loadAlbumData()">Load</UButton>
      </div>
      <div>
        <div v-for="track in data" :key="track.id" class="p-2">
          <div>{{ track.title }}</div>
          <div>{{ track.artist }}</div>
          <UButton @click="playTrack(track)">Play</UButton>
        </div>
      </div>
      <div>
        <pre>{{ data }}</pre>
      </div>
    </UContainer>
  </div>
</template>
