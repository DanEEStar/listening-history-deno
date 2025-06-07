# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Using agent.plan.md for Task Planning

When working on tasks, check the `agent.plan.md` file first for current instructions. This file serves as a communication channel where:
- Instructions for Claude Code are placed at the top of the file
- Completed short work summaries are added below the `##########################################` divider
- This approach allows for persistent task tracking across Claude Code sessions

## Development Commands

```bash
npm run dev                    # Start development server
npm run build                  # Build for production (includes Buffer import fix for Deno)
npm run deploy                 # Build and deploy to Deno Deploy
npm run gen-types              # Generate Supabase database types
```

## Architecture Overview

This is a Nuxt 3 application that tracks listening history from Spotify and Pocket Casts, storing data in a Supabase PostgreSQL database. The app provides a web interface to view and control playback.

### Core Services

- **server/services/spotify.ts**: Handles Spotify API integration including OAuth token refresh, recently played tracks, device management, and playback control. Key functions include `updateSpotifyHistory()` for syncing new tracks and `playTrack()` for remote playback.

- **server/services/pocketCasts.ts**: Manages Pocket Casts API integration for podcast episode tracking. Uses `updatePocketCastsHistory()` to sync episodes that are >70% complete or marked as finished.

### Database Schema

- **spotify_tracks**: Stores Spotify listening history with JSONB track data and generated columns for artist, title, album info. Includes computed `album_index` for multi-disc albums.
- **pocket_casts_episodes**: Stores podcast episodes with JSONB episode data and generated columns for title, podcast name, and publish date.

### API Endpoints

- `/api/spotify/update`: Syncs latest Spotify tracks to database
- `/api/spotify/last`: Returns last played track from database
- `/api/spotify/play`: Controls Spotify playback with album URI and track offset
- `/api/pocketcasts/update`: Syncs Pocket Casts episode history
- `/api/status`: Combined status of both services

### Environment Variables

Required environment variables (see example.env):
- Spotify: CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN, DEVICE_ID
- Supabase: DATABASE_URL
- Pocket Casts: USER, PW

### Deployment

Built for Deno Deploy with special Buffer import handling in the build script. The build process adds a Buffer import to the Nitro output for Deno compatibility.