create table if not exists pocket_casts_episodes (
    uuid uuid primary key,
    episode jsonb not null,
    title text generated always as (episode->>'title') stored,
    podcast text generated always as (episode->>'podcastTitle') stored,
    published text generated always as (episode->>'published') stored,
    played_at timestamptz not null default now()
);


select *
from pocket_casts_episodes;

truncate pocket_casts_episodes;