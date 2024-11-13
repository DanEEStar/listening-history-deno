# Listening History Deno

This project uses `nuxt` to make a copy of the Spotify listening history to a
Postgres DB

## Setup

- Create a Postgres DB (tested with Supabase)
- Create the `spotify_tracks` table (see scripts/sql/spotify_tracks.sql)
- Set the required environment variables (see example.env)

## Single run

```
npm run dev
```

## Deployment

We use deno for deploment.

```
npm run build --preset=deno_deploy
(cd .output && deployctl deploy --project=listening-history-deno server/index.mjs)
```
