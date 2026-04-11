<script setup lang="ts">
import type {
  SpotifyTrackDb,
  SpotifyTrackApiPlayInfo,
} from "~/server/services/spotify";

interface Props {
  track: SpotifyTrackDb;
  isAudiobook?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  play: [track: SpotifyTrackApiPlayInfo];
}>();

function handlePlay() {
  emit("play", props.track);
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) {
    return "Just now";
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInHours < 48) {
    return "Yesterday";
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
}
</script>

<template>
  <div
    class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6"
  >
    <div class="flex gap-4">
      <!-- Album Thumbnail -->
      <div class="flex-shrink-0">
        <div
          class="h-16 w-16 overflow-hidden rounded-lg bg-gray-200 shadow-sm sm:h-20 sm:w-20"
        >
          <img
            v-if="track.album_image"
            :src="track.album_image"
            :alt="`${track.album_title} album cover`"
            class="h-full w-full object-cover"
            loading="lazy"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center text-gray-400"
          >
            <Icon name="heroicons:musical-note" class="h-8 w-8" />
          </div>
        </div>
      </div>

      <!-- Track Info -->
      <div class="min-w-0 flex-1 space-y-3">
        <div class="space-y-1">
          <div class="truncate text-base font-medium text-gray-900">
            {{ isAudiobook ? track.album_title : track.title }}
          </div>
          <div class="truncate text-sm text-gray-600">{{ track.artist }}</div>
          <div v-if="!isAudiobook" class="truncate text-sm text-gray-500">
            {{ track.album_title }}
          </div>
          <div v-else class="truncate text-sm text-gray-500">{{ track.title }}</div>
        </div>

        <div class="flex flex-wrap gap-3 text-xs text-gray-400">
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
            <Icon name="heroicons:play-solid" class="mr-2 h-4 w-4" />
            Play
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
