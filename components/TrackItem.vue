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

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
    <div class="flex gap-4">
      <!-- Album Thumbnail -->
      <div class="flex-shrink-0">
        <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-200 shadow-sm">
          <img 
            v-if="track.album_image" 
            :src="track.album_image" 
            :alt="`${track.album_title} album cover`"
            class="w-full h-full object-cover"
            loading="lazy"
          />
          <div 
            v-else 
            class="w-full h-full flex items-center justify-center text-gray-400"
          >
            <Icon name="heroicons:musical-note" class="w-8 h-8" />
          </div>
        </div>
      </div>

      <!-- Track Info -->
      <div class="flex-1 min-w-0 space-y-3">
        <div class="space-y-1">
          <div class="font-medium text-base text-gray-900 truncate">{{ track.title }}</div>
          <div class="text-sm text-gray-600 truncate">{{ track.artist }}</div>
          <div class="text-sm text-gray-500 truncate">{{ track.album_title }}</div>
        </div>
        
        <div class="text-xs text-gray-400 flex flex-wrap gap-3">
          <span v-if="track.track_number">Track {{ track.track_number }}</span>
          <span v-if="track.album_index">Index {{ track.album_index }}</span>
          <span>{{ formatDate(track.played_at) }}</span>
        </div>
        
        <div class="pt-1">
          <UButton 
            @click="handlePlay" 
            size="sm" 
            variant="outline"
            class="min-h-[36px] px-4"
          >
            <Icon name="heroicons:play-solid" class="w-4 h-4 mr-2" />
            Play
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>