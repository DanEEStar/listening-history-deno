<script setup lang="ts">
const client = useSupabaseClient();

const data = ref([]);

async function loadData() {
  const response = await client
    .from("spotify_tracks")
    .select("artist, title, played_at")
    .ilike("title", "%Zwerge%")
    .order("played_at", { ascending: false });
  data.value = response.data;
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
        <pre>{{ data }}</pre>
      </div>
    </ULandingHero>

    <ULandingSection title="The freedom to build anything" align="left" />

    <ULandingSection title="The flexibility to control your data" align="right" />
  </div>
</template>
