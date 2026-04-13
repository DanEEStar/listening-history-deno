import type { SpotifyTrackDb } from "#shared/types/spotify";

export async function useListeningHistory() {
  const supabase = useSupabaseClient();
  const searchQuery = ref("");

  const {
    data: lastTracks,
    error: lastTracksError,
    refresh: refreshLastTracks,
  } = await useAsyncData<SpotifyTrackDb[]>("lastTracks", async () => {
    const query = supabase
      .from("spotify_tracks")
      .select(
        "id, artist, title, album_title, played_at, track->track_number, track->album_index, album_uri:track->album->uri, album_image:track->album->images->0->url"
      )
      .order("played_at", { ascending: false })
      .limit(10);

    if (searchQuery.value) {
      query.or(
        `title.ilike.%${searchQuery.value}%,artist.ilike.%${searchQuery.value}%,album_title.ilike.%${searchQuery.value}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as SpotifyTrackDb[]) ?? [];
  });

  const {
    data: audiobooks,
    error: audiobooksError,
    refresh: refreshAudiobooks,
  } = await useAsyncData<SpotifyTrackDb[]>("audiobooks", async () => {
    const query = supabase
      .rpc("get_album_tracks")
      .select("*")
      .order("played_at", { ascending: false })
      .limit(10);

    if (searchQuery.value) {
      query.or(
        `title.ilike.%${searchQuery.value}%,artist.ilike.%${searchQuery.value}%,album_title.ilike.%${searchQuery.value}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as SpotifyTrackDb[]) ?? [];
  });

  function search() {
    refreshLastTracks();
    refreshAudiobooks();
  }

  return {
    searchQuery,
    lastTracks,
    lastTracksError,
    audiobooks,
    audiobooksError,
    search,
  };
}
