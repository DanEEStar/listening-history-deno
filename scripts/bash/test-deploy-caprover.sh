#!/usr/bin/env bash
# Isolated command-level tests: no Docker daemon, registry, or CapRover access.
set -euo pipefail

ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
TEST_DIR=$(mktemp -d)
trap 'rm -rf -- "$TEST_DIR"' EXIT
mkdir "$TEST_DIR/bin"

cat > "$TEST_DIR/bin/docker" <<'MOCK'
#!/usr/bin/env bash
printf 'docker' >> "$CALL_LOG"
printf ' <%s>' "$@" >> "$CALL_LOG"
printf '\n' >> "$CALL_LOG"
if [[ "${1:-}" == buildx && "${2:-}" == build ]]; then
    exit "${BUILD_EXIT_CODE:-0}"
fi
MOCK
cat > "$TEST_DIR/bin/caprover" <<'MOCK'
#!/usr/bin/env bash
printf 'caprover' >> "$CALL_LOG"
printf ' <%s>' "$@" >> "$CALL_LOG"
printf '\n' >> "$CALL_LOG"
exit "${DEPLOY_EXIT_CODE:-0}"
MOCK
chmod +x "$TEST_DIR/bin/"*
export PATH="$TEST_DIR/bin:$PATH"
export CALL_LOG="$TEST_DIR/calls"
export DOCKER_IMAGE=registry.example.com/team/listening-history
export IMAGE_TAG=test-version
export PLATFORM=linux/amd64
export CAPROVER_URL=https://captain.example.com
export CAPROVER_APP=listening-history-test
unset CAPROVER_NAME CAPROVER_PASSWORD CAPROVER_APP_TOKEN CAPROVER_CONFIG_FILE BUILD_EXIT_CODE DEPLOY_EXIT_CODE

run_script() {
    : > "$CALL_LOG"
    (cd / && bash "$ROOT/deploy-caprover.sh" "$@") > "$TEST_DIR/output" 2>&1
}

assert_call() {
    if ! grep -F -- "$1" "$CALL_LOG" > /dev/null; then
        printf 'Missing expected command: %s\n' "$1" >&2
        exit 1
    fi
}

assert_no_deploy() {
    if grep -F 'caprover' "$CALL_LOG" > /dev/null; then
        printf 'Unexpected CapRover deployment\n' >&2
        exit 1
    fi
}

run_script --help
[[ ! -s "$CALL_LOG" ]]
grep -F 'Usage:' "$TEST_DIR/output" > /dev/null

IMAGE_TAG='' run_script --build-only
REVISION=$(git -C "$ROOT" rev-parse --short=12 HEAD)
assert_call "<--tag> <registry.example.com/team/listening-history:$REVISION-"

run_script --build-only
assert_call '<--platform> <linux/amd64>'
assert_call '<--tag> <registry.example.com/team/listening-history:test-version>'
assert_call '<--load>'
assert_call "<$ROOT>"
assert_no_deploy

PLATFORM=linux/arm64 run_script --push-only
assert_call '<--platform> <linux/arm64>'
assert_call '<--push>'
assert_no_deploy

run_script
assert_call '<--push>'
assert_call 'caprover <deploy> <--caproverUrl> <https://captain.example.com> <--caproverApp> <listening-history-test> <--imageName> <registry.example.com/team/listening-history:test-version>'

CAPROVER_URL='' CAPROVER_NAME=saved-server run_script
assert_call '<--caproverName> <saved-server>'

run_script --dry-run
[[ ! -s "$CALL_LOG" ]]
grep -F 'test-version' "$TEST_DIR/output" > /dev/null

DOCKER_IMAGE='' CAPROVER_URL='' run_script --build-only
assert_call '<--tag> <listening-history:test-version>'

if DOCKER_IMAGE='' run_script; then
    printf 'Missing registry image should fail\n' >&2
    exit 1
fi
[[ ! -s "$CALL_LOG" ]]

if CAPROVER_URL='' run_script; then
    printf 'Missing CapRover destination should fail\n' >&2
    exit 1
fi
[[ ! -s "$CALL_LOG" ]]

if DOCKER_IMAGE=registry.example.com/team/app:latest run_script; then
    printf 'Repository containing a tag should fail\n' >&2
    exit 1
fi
[[ ! -s "$CALL_LOG" ]]

if PLATFORM=darwin/arm64 run_script --build-only; then
    printf 'Non-Linux platform should fail\n' >&2
    exit 1
fi
[[ ! -s "$CALL_LOG" ]]

if IMAGE_TAG='bad tag' run_script; then
    printf 'Invalid image tag should fail\n' >&2
    exit 1
fi
[[ ! -s "$CALL_LOG" ]]

if run_script --build-only --push-only; then
    printf 'Conflicting modes should fail\n' >&2
    exit 1
fi
[[ ! -s "$CALL_LOG" ]]

if run_script --unknown; then
    printf 'Unknown option should fail\n' >&2
    exit 1
fi
[[ ! -s "$CALL_LOG" ]]

if BUILD_EXIT_CODE=42 run_script; then
    printf 'Build failure should fail the script\n' >&2
    exit 1
fi
assert_no_deploy

if DEPLOY_EXIT_CODE=43 run_script; then
    printf 'Deployment failure should fail the script\n' >&2
    exit 1
fi

printf 'CapRover deployment script tests passed.\n'
