create table if not exists spotify_tracks(
    id serial primary key,
    track jsonb not null,
    track_id text generated always as (track->>'id') stored,
    artist text generated always as (track->'artists'->0->>'name') stored,
    title text generated always as (track->>'name') stored,
    played_at timestamptz NOT NULL DEFAULT NOW()
);


select *
from spotify_tracks
order by id desc;


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
group by p.artist
order by 1 desc;
