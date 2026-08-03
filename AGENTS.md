# Repository Guide

## Project overview

This is a Nuxt 4 application for collecting and viewing listening history from Spotify, Pocket Casts, and Apple Music. The application uses Vue 3, TypeScript, Nitro server routes, Tailwind CSS, and Supabase/PostgreSQL. Spotify playback can also be controlled from the UI.

## Repository map

- `app/`: Nuxt application pages, components, composables, and CSS. Use Vue Composition API with `<script setup lang="ts">`.
- `server/api/`: thin Nitro event handlers. Keep provider and persistence logic out of route files.
- `server/utils/`: Spotify, Pocket Casts, Apple Music, and status integrations, including direct PostgreSQL access.
- `shared/types/`: types shared by client and server code.
- `scripts/sql/`: database schema and initialization SQL.
- `scripts/python/` and `scripts/bash/`: operational and monitoring utilities. Python dependencies are managed with `uv`.
- `database.generated.types.ts`: generated Supabase types; do not edit manually. Put deliberate type refinements in `database.types.ts`.

## Tooling and commands

The pinned development tools are defined in `mise.toml`. JavaScript dependencies use npm and `package-lock.json`.

```bash
mise install                 # Install pinned Node, Python, and uv versions
npm ci                       # Install JavaScript dependencies
npm run dev                  # Start the Nuxt development server
npm run fmt                  # Format supported files with oxfmt
npm run fmt:check            # Check formatting without modifying files
npm run build                # Build the Nuxt application
npm run gen-types            # Regenerate Supabase database types
```

There is currently no automated JavaScript test suite. For relevant changes, run `npm run fmt:check` and run `npm run build` when practical. Report checks that were not run and why. Do not treat the live Python status checker as a unit test.

## Implementation conventions

- Follow Nuxt 4 directory conventions and nearby code patterns.
- Use TypeScript and Vue Composition API rather than Options API.
- Keep API handlers small and put reusable integration logic in `server/utils/`.
- Preserve the existing separation between generated database types and handwritten overrides.
- Use the repository's oxfmt configuration instead of introducing separate formatting rules.
- Make focused changes; avoid unrelated migrations or refactors.

## Environment and operational safety

- Never inspect, print, copy, or modify values in `secrets/`. `mise.toml` loads `secrets/daniel.env`, so avoid commands that expose the environment.
- Use `example.env` only as a starting point for variable names. It may lag runtime requirements; verify environment references in the relevant `server/utils/` module.
- Do not commit credentials, tokens, database URLs, generated dumps, or decrypted secret material.
- Do not run `npm run deploy`, invoke history-update endpoints, apply files from `scripts/sql/`, or run backup/database-mutating scripts without explicit user approval. These operations can affect live services or data.
- `npm run gen-types` requires access to the configured Supabase project; regenerate rather than manually editing `database.generated.types.ts`.
