create table if not exists pocket_casts_episodes (
    uuid uuid primary key,
    episode jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);