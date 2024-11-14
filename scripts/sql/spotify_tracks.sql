CREATE TABLE IF NOT EXISTS spotify_tracks (
    id serial PRIMARY KEY,
    track jsonb NOT NULL,
    track_id text GENERATED ALWAYS AS (COALESCE(track->>'id', '')) STORED,
    artist text GENERATED ALWAYS AS (COALESCE(track->'artists'->0->>'name', '')) STORED,
    title text GENERATED ALWAYS AS (COALESCE(track->>'name', '')) STORED,
    album_title text GENERATED ALWAYS AS (COALESCE(track->'album'->>'name', '')) STORED,
    played_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_played_at ON spotify_tracks (played_at);


CREATE OR REPLACE FUNCTION get_album_tracks()
RETURNS TABLE (
    id int,
    played_at timestamptz,
    artist text,
    title text,
    album_title text,
    track_number text,
    album_uri text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        max(spotify_tracks.id) AS id,
        max(spotify_tracks.played_at) AS played_at,
        COALESCE(max(spotify_tracks.artist), '') AS artist,
        COALESCE(max(spotify_tracks.title), '') AS title,
        COALESCE(max(spotify_tracks.album_title), '') AS album_title,
        COALESCE(max(spotify_tracks.track->>'track_number'), '') AS track_number,
        COALESCE(max(spotify_tracks.track->'album'->>'uri'), '') AS album_uri
    FROM spotify_tracks
    WHERE (track->'album'->>'total_tracks')::int > 50
    GROUP BY track->'album'->>'id'
    ORDER BY played_at DESC;
END;
$$ LANGUAGE plpgsql;



select *
from get_album_tracks()
where album_title ilike '%zwerge%';


select *
from spotify_tracks
order by id desc;

select count(id)
from spotify_tracks;


-- most played songs
select count(*), p.track_id, p.artist, p.title, max(p.played_at), min(p.played_at)
from spotify_tracks p
group by 2, 3, 4
order by 1 desc, max(p.played_at) desc;

-- most played artist
select count(*), p.artist, max(p.played_at), min(p.played_at)
from spotify_tracks p
group by p.artist
order by 1 desc;

-- most played artist with distinct tracks
select count(*), p.artist
from (
    select distinct on(pi.track_id) *
    from spotify_tracks pi
) p
where played_at > '2024-01-01'
group by p.artist
order by 1 desc;

-- heuristic to get latest audiobooks
select max(played_at) as played_at, max(artist) as artist, max(album_title) as album_title, max(track->>'track_number') as track_number, max(track->'album'->>'uri') as album_uri
from spotify_tracks
where (track->'album'->>'total_tracks')::int > 50
group by track->'album'->>'id'
order by played_at desc;
