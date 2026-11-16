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

## Python scripts

Python dependencies are managed with [uv](https://docs.astral.sh/uv/) in the root
`pyproject.toml` and `uv.lock`. Python and uv are configured in `mise.toml`.
From the repository root:

```bash
mise install
uv sync --locked
```

`uv sync` creates or updates the local `.venv`; manual activation and `pip install`
are not needed when using `uv run`. Keep dependency declarations in `pyproject.toml`
rather than inline script metadata, which bypasses the project environment and lockfile.

Manage libraries with:

```bash
uv add <package>
uv remove <package>
```

Commit both `pyproject.toml` and `uv.lock` when dependencies change. Use
`uv lock --check` to verify that they agree without updating the lockfile.
GitLab CI uses the uv Python image and `uv run --locked` so a stale lockfile fails
the job instead of being updated silently.

The status checker is an **operational command, not a unit test**: it calls live
Apple Music and Pocket Casts history-update endpoints before checking status.
Only run it when those updates are intended:

```bash
uv run --locked scripts/python/check_listening_history_status.py
```

## CapRover deployment (locally built image)

The Dockerfile builds Nuxt with the `node-server` preset and runs its standalone
output as the non-root `node` user on `0.0.0.0:3000`. Node defaults to the version
in `mise.toml`; keep the Dockerfile default aligned when upgrading Node.
Only allowlisted source files enter the build context. No local environment
variables, `secrets/`, or application credentials are copied into the image.
Supply application configuration at **runtime**, not with Docker build arguments.

### One-time setup

1. Install/start Docker with Buildx and install the CapRover CLI.
2. Choose a container registry/repository and authenticate locally using
   `docker login`. For a private image, add the registry credentials in CapRover
   under **Cluster → Add Remote Registry** so the server can pull it too.
3. Create the CapRover app (for example, `listening-history`). Under HTTP Settings,
   set **Container HTTP Port** to **3000**, configure its domain, and enable and
   enforce HTTPS. Do not add a host port mapping or a persistent volume.
4. Configure the following app environment variables in CapRover:

| Variables                                                             | Purpose                                                                                                        |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_KEY`                | Supabase project URL and public publishable/anon key for UI authentication. Never use a service-role key here. |
| `SUPABASE_DATABASE_URL`                                               | PostgreSQL connection URL used directly by the server utilities.                                               |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` | Spotify history collection and playback.                                                                       |
| `SPOTIFY_DEVICE_ID`                                                   | Default Spotify playback device, if needed.                                                                    |
| `POCKET_CASTS_USER`, `POCKET_CASTS_PW`                                | Pocket Casts history collection.                                                                               |
| `APPLE_MUSIC_DEV_TOKEN`, `APPLE_MUSIC_USER_TOKEN_DANIEL`              | Apple Music history collection.                                                                                |

Use the exact `NUXT_PUBLIC_SUPABASE_*` names: the legacy `SUPABASE_URL` and
`SUPABASE_KEY` aliases are resolved at build time, not when this image starts.
A credential-free build may warn about missing Supabase configuration; those two
runtime variables must be set before using the UI. The built Node server does not
load `.env` files automatically.

### Build, push, deploy

The script follows the local-build → registry-push → CapRover-image-deploy workflow.
It works from any directory, stops on failure, and deploys the exact versioned tag
it just pushed. It does not create/delete apps, modify their environment, or change
cron jobs. A `captain-definition` is not needed for this image-based workflow.

Configure these non-secret deployment settings in your shell:

```bash
export DOCKER_IMAGE=docker.io/YOUR_DOCKERHUB_USER/listening-history
export CAPROVER_URL=https://captain.YOUR_CAPROVER_DOMAIN
export CAPROVER_APP=listening-history
export PLATFORM=linux/amd64
```

Replace the placeholders with your registry and Captain address. Set `PLATFORM`
according to the **Hetzner server**, not your Mac: use `linux/arm64` for an ARM server.
The default is `linux/amd64`; Docker Desktop/OrbStack can emulate it on Apple Silicon,
although cross-architecture builds are slower. The selected Docker/Buildx builder
performs the build, not the CapRover server.

```bash
./deploy-caprover.sh --dry-run    # Show the build/push/deploy commands only
./deploy-caprover.sh --build-only # Build and load locally, without pushing/deploying
./deploy-caprover.sh --push-only  # Build and push, without deploying
./deploy-caprover.sh              # Build, push, then deploy to the existing app
```

Alternatively, use `CAPROVER_NAME` for a server saved with `caprover login`;
it takes precedence over `CAPROVER_URL`. Otherwise the CLI prompts for authentication
or uses its supported credential environment variables. Never put passwords in
this script or command-line arguments.

`IMAGE_TAG` defaults to the Git revision plus a UTC timestamp; the build includes
the current working tree, not just committed files. Set `IMAGE_TAG` explicitly when
needed. The script does not overwrite a moving `latest` tag. Registry charges and
image retention depend on your registry provider.

### Local smoke test

Build without any registry or CapRover settings (choose the architecture you want):

```bash
DOCKER_IMAGE=listening-history IMAGE_TAG=local PLATFORM=linux/arm64 \
  ./deploy-caprover.sh --build-only

docker run --rm -p 127.0.0.1:3000:3000 listening-history:local
```

In another terminal, `curl http://localhost:3000/api/hello` should return
`{"hello":"world"}` without contacting Supabase or a music provider. The UI requires
its Supabase runtime variables; supply them with `docker run -e` or a private
Docker-compatible env file (plain `KEY=value`, without `export`).
Do not test history-update endpoints against production data accidentally.

Before cutover, allow the new app's `/confirm` URL in Supabase Auth and update the
Site URL if appropriate. Verify login and read-only history views, then switch the
existing Supabase cron URLs and the host in
`scripts/python/check_listening_history_status.py`. Keep only one active set of
polling schedules. These changes are deliberately not performed by the deploy script.
Also review the existing PostgreSQL client lifecycle before sustained polling on a
long-lived Node process; the Docker packaging does not change connection management.

To roll back, redeploy a previously pushed image tag from CapRover's deployment UI
or with `caprover deploy --imageName YOUR_PREVIOUS_IMAGE_REFERENCE` and the same
server/app options. This does not rebuild the old tag from today's working tree.

Script checks (mocked Docker/CapRover; no live deployment):

```bash
bash -n deploy-caprover.sh scripts/bash/test-deploy-caprover.sh
shellcheck deploy-caprover.sh scripts/bash/test-deploy-caprover.sh
bash scripts/bash/test-deploy-caprover.sh
```

References: [Nuxt Node deployment](https://nuxt.com/docs/4.x/getting-started/deployment),
[CapRover registry deployment](https://caprover.com/docs/ci-cd-integration/deploy-from-gitlab.html).

## Legacy Deno deployment

The existing `npm run deploy` script still targets Deno Deploy. Do not use it for
CapRover; use `./deploy-caprover.sh` instead.
