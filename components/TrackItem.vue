<script setup lang="ts">
import type { SpotifyTrackApiPlayInfo } from "~/server/services/spotify";

interface Props {
  track: SpotifyTrackApiPlayInfo;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  play: [track: SpotifyTrackApiPlayInfo];
}>();

function handlePlay() {
  emit('play', props.track);
}
</script>

<template>
  <div class="p-4 sm:p-6 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
    <div class="space-y-3">
      <div class="space-y-2">
        <div class="font-semibold text-lg text-gray-900">{{ track.artist }}</div>
        <div class="text-gray-700 font-medium">{{ track.album_title }}</div>
        <div class="text-gray-600">{{ track.title }}</div>
      </div>
      
      <div class="text-sm text-gray-500 flex flex-wrap gap-4">
        <span v-if="track.track_number" class="inline-flex items-center">
          <span class="font-medium">Track:</span> {{ track.track_number }}
        </span>
        <span v-if="track.album_index" class="inline-flex items-center">
          <span class="font-medium">Album index:</span> {{ track.album_index }}
        </span>
      </div>
      
      <div class="text-sm text-gray-400">{{ track.played_at }}</div>
      
      <div class="pt-2">
        <UButton 
          @click="handlePlay" 
          size="lg" 
          variant="solid"
          color="primary"
          class="w-full sm:w-auto min-h-[44px] px-6"
        >
          <Icon name="heroicons:play-solid" class="w-5 h-5 mr-2" />
          Play
        </UButton>
      </div>
    </div>
  </div>
</template>