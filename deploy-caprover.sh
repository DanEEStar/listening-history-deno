#!/usr/bin/env bash
# Build on this machine, push a versioned image, then ask CapRover to pull it.
set -euo pipefail

ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)

usage() {
    cat <<'HELP'
Usage: ./deploy-caprover.sh [--build-only | --push-only] [--dry-run]

Default: build locally, push to the registry, and deploy the exact image tag.
  --build-only  Load the image into local Docker; do not push or deploy.
  --push-only   Build and push, but do not deploy.
  --dry-run     Print commands without running Docker or CapRover.
  --help        Show this help.

Environment:
  DOCKER_IMAGE    Registry/repository without a tag (required except --build-only).
  IMAGE_TAG       Optional tag; defaults to Git revision plus UTC build timestamp.
  PLATFORM        Target server architecture: linux/amd64 (default) or linux/arm64.
  CAPROVER_URL    Captain HTTPS URL (required for deployment unless NAME is set).
  CAPROVER_NAME   Alternatively, a server previously saved with caprover login.
  CAPROVER_APP    Existing CapRover app name (default: listening-history).

Authenticate with docker login first; CapRover must also be able to pull the image.
CapRover CLI handles authentication interactively or via its own environment variables.
No application secrets or local env files are loaded or passed to the build.
HELP
}

fail() {
    printf 'Error: %s\n' "$*" >&2
    exit 1
}

MODE=deploy
DRY_RUN=false
for arg in "$@"; do
    case "$arg" in
        --build-only|--push-only)
            [[ "$MODE" == deploy ]] || fail 'Choose only one build/push mode.'
            MODE=${arg#--}
            ;;
        --dry-run) DRY_RUN=true ;;
        --help|-h) usage; exit 0 ;;
        *) fail "Unknown option: $arg (see --help)." ;;
    esac
done

IMAGE=${DOCKER_IMAGE:-}
PLATFORM=${PLATFORM:-linux/amd64}
APP=${CAPROVER_APP:-listening-history}
case "$PLATFORM" in
    linux/amd64|linux/arm64) ;;
    *) fail 'PLATFORM must be linux/amd64 or linux/arm64 (the server, not your Mac).' ;;
esac

if [[ "$MODE" == build-only ]]; then
    IMAGE=${IMAGE:-listening-history}
else
    [[ -n "$IMAGE" && "$IMAGE" == */* ]] || fail 'Set DOCKER_IMAGE to a registry/repository without a tag.'
fi
[[ "$IMAGE" != -* && "$IMAGE" != *@* && "$IMAGE" != *[[:space:]]* && "${IMAGE##*/}" != *:* ]] \
    || fail 'DOCKER_IMAGE must be a repository without a tag, digest, or whitespace.'

DEPLOY_ARGS=()
if [[ "$MODE" == deploy ]]; then
    if [[ -n "${CAPROVER_NAME:-}" ]]; then
        DEPLOY_ARGS+=(--caproverName "$CAPROVER_NAME")
    else
        [[ "${CAPROVER_URL:-}" == https://* ]] || fail 'Set CAPROVER_URL to the Captain HTTPS URL, or set CAPROVER_NAME.'
        DEPLOY_ARGS+=(--caproverUrl "$CAPROVER_URL")
    fi
    [[ "$APP" =~ ^[a-z0-9][a-z0-9-]*$ && ${#APP} -le 50 ]] || fail 'Invalid CAPROVER_APP name.'
fi

TAG=${IMAGE_TAG:-}
if [[ -z "$TAG" ]]; then
    REVISION=$(git -C "$ROOT" rev-parse --short=12 HEAD)
    TAG="$REVISION-$(date -u +%Y%m%dT%H%M%SZ)"
fi
[[ "$TAG" =~ ^[a-zA-Z0-9_][a-zA-Z0-9_.-]*$ && ${#TAG} -le 128 ]] || fail 'Invalid IMAGE_TAG.'
IMAGE_REF="$IMAGE:$TAG"

run() {
    printf '+'
    printf ' %q' "$@"
    printf '\n'
    if [[ "$DRY_RUN" == false ]]; then
        "$@"
    fi
}

if [[ "$DRY_RUN" == false ]]; then
    command -v docker > /dev/null || fail 'Docker is required.'
    if [[ "$MODE" == deploy ]]; then
        command -v caprover > /dev/null || fail 'Install the CapRover CLI first.'
    fi
    docker info > /dev/null
    docker buildx version > /dev/null
fi

cd "$ROOT"
printf 'Image: %s\nTarget platform: %s\n' "$IMAGE_REF" "$PLATFORM"
if [[ "$MODE" == deploy ]]; then
    printf 'CapRover: %s / %s\n' "${CAPROVER_NAME:-${CAPROVER_URL:-}}" "$APP"
fi

OUTPUT=--push
[[ "$MODE" != build-only ]] || OUTPUT=--load
run docker buildx build --platform "$PLATFORM" --file "$ROOT/Dockerfile" \
    --tag "$IMAGE_REF" "$OUTPUT" "$ROOT"

if [[ "$MODE" == deploy ]]; then
    run caprover deploy "${DEPLOY_ARGS[@]}" --caproverApp "$APP" --imageName "$IMAGE_REF"
fi
printf 'Finished (%s): %s\n' "$MODE" "$IMAGE_REF"
