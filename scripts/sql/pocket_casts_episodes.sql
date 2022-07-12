create table if not exists pocket_casts_episodes (
    uuid uuid primary key,
    episode jsonb not null,
    title text generated always as (episode->>'title') stored,
    podcast text generated always as (episode->>'podcastTitle') stored,
    published text generated always as (episode->>'published') stored,
    played_at timestamptz not null default now()
);


select count(*)
from pocket_casts_episodes;

select uuid, title, podcast, published, played_at
from pocket_casts_episodes
order by played_at desc;
