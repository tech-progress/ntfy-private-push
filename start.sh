#!/bin/sh
set -eu
if [ "${1:-serve}" != serve ]; then exec ntfy "$@"; fi
: "${NTFY_BASE_URL:?Set the public HTTPS base URL}"
: "${NTFY_BOOTSTRAP_USER:?Set a scoped bootstrap username}"
: "${NTFY_BOOTSTRAP_PASSWORD:?Set a strong bootstrap password}"
: "${NTFY_TOPIC_PREFIX:?Set the private topic namespace}"
case "$NTFY_BASE_URL" in https://*) ;; http://localhost*|http://127.0.0.1*) ;; *) echo 'Base URL must use HTTPS except local testing' >&2; exit 1;; esac
case "$NTFY_BOOTSTRAP_USER" in *[!a-zA-Z0-9_-]*|'') echo 'Invalid username' >&2; exit 1;; esac
case "$NTFY_TOPIC_PREFIX" in *[!a-zA-Z0-9_-]*|'') echo 'Invalid topic prefix' >&2; exit 1;; esac
[ "${#NTFY_BOOTSTRAP_PASSWORD}" -ge 16 ] || { echo 'Password must contain at least 16 characters' >&2; exit 1; }
mkdir -p /var/lib/ntfy
chmod 700 /var/lib/ntfy
export NTFY_CONFIG_FILE=/etc/ntfy/server.yml NTFY_AUTH_FILE=/var/lib/ntfy/auth.db NTFY_AUTH_DEFAULT_ACCESS=deny-all
if [ ! -s "$NTFY_AUTH_FILE" ]; then
  ntfy serve --listen-http 127.0.0.1:8080 --auth-default-access deny-all --enable-signup=false &
  bootstrap_pid=$!
  trap 'kill "$bootstrap_pid" 2>/dev/null || true' EXIT INT TERM
  retries=0
  until wget -q -O /dev/null http://127.0.0.1:8080/v1/health; do
    retries=$((retries + 1))
    [ "$retries" -lt 30 ] || exit 1
    sleep 1
  done
  kill "$bootstrap_pid"
  wait "$bootstrap_pid" || [ "$?" -eq 143 ]
  trap - EXIT INT TERM
fi
export NTFY_PASSWORD="$NTFY_BOOTSTRAP_PASSWORD"
ntfy user add --ignore-exists --role=user "$NTFY_BOOTSTRAP_USER"
ntfy user change-role "$NTFY_BOOTSTRAP_USER" user
ntfy user change-pass "$NTFY_BOOTSTRAP_USER"
ntfy access --reset everyone
ntfy access --reset "$NTFY_BOOTSTRAP_USER"
ntfy access "$NTFY_BOOTSTRAP_USER" "${NTFY_TOPIC_PREFIX}*" rw
unset NTFY_PASSWORD NTFY_BOOTSTRAP_PASSWORD
if [ -n "${NTFY_WEB_PUSH_PUBLIC_KEY:-}${NTFY_WEB_PUSH_PRIVATE_KEY:-}${NTFY_WEB_PUSH_EMAIL_ADDRESS:-}" ]; then
  : "${NTFY_WEB_PUSH_PUBLIC_KEY:?Browser push requires both VAPID keys and contact email}"
  : "${NTFY_WEB_PUSH_PRIVATE_KEY:?Browser push requires both VAPID keys and contact email}"
  : "${NTFY_WEB_PUSH_EMAIL_ADDRESS:?Browser push requires both VAPID keys and contact email}"
  export NTFY_WEB_PUSH_FILE=/var/lib/ntfy/webpush.db
fi
exec ntfy serve --listen-http ":${PORT:-8080}" --auth-default-access deny-all --enable-signup=false --enable-reservations=false
