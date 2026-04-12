CREATE TABLE IF NOT EXISTS apple_music_tracks (
    id serial PRIMARY KEY,
    track jsonb NOT NULL,
    song_id text GENERATED ALWAYS AS (COALESCE(track->>'id', '')) STORED,
    artist text GENERATED ALWAYS AS (COALESCE(track->'attributes'->>'artistName', '')) STORED,
    title text GENERATED ALWAYS AS (COALESCE(track->'attributes'->>'name', '')) STORED,
    album_title text GENERATED ALWAYS AS (COALESCE(track->'attributes'->>'albumName', '')) STORED,
    played_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_apple_music_played_at ON apple_music_tracks (played_at);


select *
from apple_music_tracks
order by played_at desc;

select count(id)
from apple_music_tracks;


-- most played songs
select count(*), p.song_id, p.artist, p.title, max(p.played_at), min(p.played_at)
from apple_music_tracks p
group by 2, 3, 4
order by 1 desc, max(p.played_at) desc;

-- most played artists
select count(*), p.artist, max(p.played_at), min(p.played_at)
from apple_music_tracks p
group by p.artist
order by 1 desc;
