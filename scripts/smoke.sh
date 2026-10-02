#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${root}"
export NTFY_SMOKE_URL="${NTFY_SMOKE_URL:-http://127.0.0.1:${NTFY_HTTP_PORT:-18101}}"
python3 scripts/smoke.py
