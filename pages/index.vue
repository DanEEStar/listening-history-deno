<script setup lang="ts">
import type { SpotifyTrackApiPlayInfo, SpotifyTrackDb } from "~/server/services/spotify";

const client = useSupabaseClient();

const data = ref<SpotifyTrackDb[]>([]);

async function loadData() {
  const response = await client
    .from("spotify_tracks")
    .select("id, artist, title, album_title, played_at, track->track_number, album_uri:track->album->uri")
    // .ilike("title", "%Zwerge%")
    .order("played_at", { ascending: false })
    .limit(10)
    .returns<SpotifyTrackDb[]>()
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
    .returns<SpotifyTrackDb[]>()
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
    <ULandingHero
      description="Nuxt UI Pro is a collection of premium Vue components built on top of Nuxt UI to create beautiful & responsive Nuxt applications in minutes.">
      <template #title>
        The <span class="text-primary block lg:inline-block">Building Blocks</span> for Modern Web apps
      </template>
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
    </ULandingHero>

    <ULandingSection title="The freedom to build anything" align="left" />

    <ULandingSection title="The flexibility to control your data" align="right" />
  </div>
</template>
