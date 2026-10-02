#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${root}"
export COMPOSE_PROJECT_NAME="rt-ntfy-check-$$"
export NTFY_BOOTSTRAP_PASSWORD="$(openssl rand -hex 16)"
export NTFY_BOOTSTRAP_USER=publisher NTFY_TOPIC_PREFIX=alerts-
export NTFY_HTTP_PORT="${NTFY_TEST_PORT:-18111}"
export NTFY_BASE_URL="http://localhost:${NTFY_HTTP_PORT}"
export NTFY_SMOKE_URL="http://127.0.0.1:${NTFY_HTTP_PORT}"
export NTFY_SMOKE_MARKER="restore-$(openssl rand -hex 8)"
compose=(docker compose -p "${COMPOSE_PROJECT_NAME}")
temporary="$(mktemp -d)"
cleanup() {
  status=$?
  if [ "$status" -ne 0 ]; then "${compose[@]}" logs --tail=30 ntfy >&2; fi
  "${compose[@]}" down -v --remove-orphans >/dev/null
  rm -rf "${temporary}"
}
trap cleanup EXIT
"${compose[@]}" up --build -d --wait
export NTFY_SMOKE_TOKEN="$("${compose[@]}" exec -T ntfy ntfy token add --expires=1h --label=local-smoke publisher | awk '$1=="token" {print $2}')"
[[ -n "${NTFY_SMOKE_TOKEN}" ]]
bash scripts/smoke.sh
"${compose[@]}" exec -T ntfy ntfy user change-role publisher admin >/dev/null
"${compose[@]}" exec -T ntfy ntfy access everyone 'alerts-*' rw >/dev/null
"${compose[@]}" restart ntfy
"${compose[@]}" up -d --wait
export NTFY_SMOKE_REPLAY_ONLY=1
bash scripts/smoke.sh
"${compose[@]}" stop ntfy
"${compose[@]}" run --rm --no-deps --entrypoint sh ntfy -c 'tar -C /var/lib/ntfy -cf - .' > "${temporary}/ntfy.tar"
"${compose[@]}" down -v
"${compose[@]}" run --rm --no-deps -T --entrypoint sh ntfy -c 'tar -C /var/lib/ntfy -xf -' < "${temporary}/ntfy.tar"
"${compose[@]}" up -d --wait
bash scripts/smoke.sh
export NTFY_CACHE_DURATION=5s NTFY_MANAGER_INTERVAL=5s
"${compose[@]}" up -d --wait
export NTFY_SMOKE_MARKER="expiry-$(openssl rand -hex 8)"
unset NTFY_SMOKE_REPLAY_ONLY
bash scripts/smoke.sh
sleep 11
export NTFY_SMOKE_REPLAY_ONLY=1 NTFY_SMOKE_EXPECT_EXPIRED=1
bash scripts/smoke.sh
"${compose[@]}" exec -T ntfy ntfy token remove publisher "${NTFY_SMOKE_TOKEN}" >/dev/null
export NTFY_SMOKE_REVOKED_TOKEN=1
bash scripts/smoke.sh
echo "ntfy build/start/anonymous denial/ACL/token/restart/cold-restore replay/retention/token-revocation gates passed"
