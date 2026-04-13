export interface SpotifyTrackDb {
  id: number;
  artist: string;
  title: string;
  album_title: string;
  played_at: string;
  track_number: number;
  album_uri: string;
  album_image?: string;
  album_index?: number;
}

export type SpotifyTrackApiPlayInfo = Pick<
  SpotifyTrackDb,
  "album_uri" | "track_number" | "album_index"
>;

export interface SpotifyDevice {
  id: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number;
}
