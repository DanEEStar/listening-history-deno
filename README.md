# Listening History Deno

This project uses `deno` to make a copy of the Spotify listening history to a
Postgres DB

## Setup

- Create a Postgres DB (tested with Supabase)
- Create the `spotify_tracks` table (see scripts/sql/spotify_tracks.sql)
- Set the required environment variables (see example.env)

## Single run

```
deno run --allow-env --allow-net src/spotify.ts
```

## Start server

```
# start server
deno run --allow-env --allow-net --watch src/server.tsx

# update listening history
curl http://localhost:8000/update
```
