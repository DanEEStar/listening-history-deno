<script setup lang="ts">
const client = useSupabaseClient();

const data = ref([]);

async function loadData() {
  const response = await client
    .from("spotify_tracks")
    .select("id, artist, title, played_at, track->track_number, album_uri:track->album->uri")
    .ilike("title", "%Zwerge%")
    .order("played_at", { ascending: false });
  data.value = response.data;
}

async function playTrack(track) {
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
        <UButton @click="loadData()">Load</UButton>
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
