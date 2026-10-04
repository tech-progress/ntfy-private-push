# ntfy private push

Upstream products: [ntfy](https://ntfy.sh/).

Template release **v1.0.1** updates documentation and docs verification for this low-volume private HTTP push recipe. Runtime files and pins are unchanged from public source `v1.0.0`. This release must be qualified independently. A source release does not prove marketplace publication; see [PUBLISHING.md](PUBLISHING.md) for the exact-source, stored-graph, recovery, headroom, cleanup and publication readback gates. Original recipe code is owner-approved MIT; ntfy, its browser assets and container dependencies retain their own licenses and notices.

## What deploys

One ntfy 2.28.0 service, pinned by digest, with an exclusive volume holding auth, cached messages, and optional browser subscriptions. The server denies topic publishing/subscriptions by default, disables public signup/reservations, and reconciles a non-admin user whose topic ACL grants `alerts-*`. ntfy also grants the user's own private sync topic for settings/subscription synchronization. Static UI/login, payload-free `/v1/health`, public configuration and aggregate `/v1/stats` remain accessible; message endpoints require authentication. Aggregate statistics expose activity, not topic names or message payloads.

A first-boot loopback-only initializer creates ntfy's SQLite databases before the upstream CLI can add the user. It is stopped before credentials/ACLs are installed and before the public listener opens. Each startup forces the bootstrap user back to the non-admin role, clears all anonymous grants, resets that user's ACL and rotates its bcrypt password from the supplied secret. Changing the prefix removes that user's old grants. Other manually added users are not erased; explicitly audit/remove their grants when changing your privacy policy. Anonymous topic grants are unsupported and deliberately removed at restart/restore.

## Railway setup

1. Publish the ntfy service at target port 8080 and set `NTFY_BASE_URL` to its HTTPS public domain. The server trusts Railway's forwarded-client header; do not expose its plaintext backend directly to untrusted ingress.
2. Use the generated scoped user/password with the web login or HTTP Basic over HTTPS. Publish with `curl -u "$NTFY_BOOTSTRAP_USER:$NTFY_BOOTSTRAP_PASSWORD" -d "backup finished" "$NTFY_BASE_URL/alerts-backup"` and subscribe using the same credentials.
3. Prefer revocable tokens in clients. Privately run `ntfy token add --expires=24h --label=backup publisher` using Railway SSH inside this service; store the returned token in a secret manager. Tokens inherit the user's complete permissions, not narrower token-specific scopes. For read-only subscribers or write-only publishers, create distinct non-admin users, grant the required topic pattern with `ntfy access USER "alerts-*" ro` or `wo`, then mint separate tokens. Each account also retains read/write access to its own private sync topic. Never grant `everyone` access or use an admin client token.
4. Replay buffered messages using `/alerts-backup/json?poll=1&since=all` with authentication. Default retention is 24 hours and rate limits apply. Replay is not exactly-once processing; clients deduplicate message IDs.
5. Browser Web Push is optional: privately run `ntfy webpush keys`, set `NTFY_WEB_PUSH_PUBLIC_KEY`, `NTFY_WEB_PUSH_PRIVATE_KEY` and `NTFY_WEB_PUSH_EMAIL_ADDRESS` together. The wrapper sets `NTFY_WEB_PUSH_FILE=/var/lib/ntfy/webpush.db`. Preserve keys and subscriptions across restores. Browser push providers receive push metadata; instant iOS background delivery normally needs ntfy's external upstream and is deliberately not enabled here. Plain authenticated HTTP notifications need no provider.
6. Use one replica with its exclusive 5,000 MB volume. Attachments are deliberately disabled. Cache is time-bounded, not hard byte-capped: monitor volume usage and message rates; no indefinite disk-growth promise is made. The pruning interval must be at least five seconds and nonzero cache duration must be at least the interval. Changed defaults apply to new message expiry; test any requirement to erase older cached messages separately.

## Source prerequisites

The public [standalone source](https://github.com/tech-progress/ntfy-private-push) has immutable `v1.0.0` at commit `08089b9848557308275a05c80de581f1a8e81cb8`, compatibility branch `release-v1`, and root `/`. Maintainers must freeze and compare this release's sanitized source, create its immutable tag once and verify the exact revision selected for live qualification. Preserve historical tags.

Historical source proof: Railway fetched and deployed that exact `v1.0.0` revision successfully with one running and zero crashed replicas. Anonymous publish/read denial, namespace restriction, authenticated publish and persistent cache replay passed. This was a selected-source test, not a stored-template deployment or marketplace publication. Historical local tests also exercised ACL reconciliation, token revocation, restart, cold-volume restore and finite retention. These receipts do not qualify `v1.0.1`; qualification requires its own clean rebuild/start and exact final stored-graph tests.

`.railway/railway.ts` defaults to this standalone repository and `release-v1`, root `/`. Marketplace users retain that release channel. Fork maintainers must set `SOURCE_REPO` to their repository, establish their own slash-free `SOURCE_BRANCH`, set `SOURCE_ROOT_DIRECTORY` if needed, and authorize Railway's GitHub App. These are authoring inputs, not runtime secrets. Public visibility alone is not proof of Railway source accessibility; check the actual selected revision and stored graph after each release.

## Runtime variables

Every default below is documented; descriptions are in template-descriptions.json. The public HTTPS base URL is a Railway service reference and the bootstrap password is a native generated secret. Do not paste resolved secrets into metadata or commit local .env files.

| Service | Variable | Default kind/value | Meaning |
| --- | --- | --- | --- |
| ntfy | `PORT` | `8080` | HTTP listener and healthcheck target, default 8080. |
| ntfy | `NTFY_BASE_URL` | Service reference | Public HTTPS base URL, matching the Railway domain; required for links and browser push. |
| ntfy | `NTFY_BOOTSTRAP_USER` | `publisher` | Non-admin user reconciled at startup; alphanumeric, dash and underscore only. |
| ntfy | `NTFY_BOOTSTRAP_PASSWORD` | Generated secret | Generated 32-character password; persisted bcrypt credential is rotated on each startup. |
| ntfy | `NTFY_TOPIC_PREFIX` | `alerts-` | Topic ACL grants prefix*; ntfy also allows the user's own private sync topic. |
| ntfy | `NTFY_CACHE_DURATION` | `24h` | Finite persistent message replay retention, default 24h; not indefinite delivery. |
| ntfy | `NTFY_MANAGER_INTERVAL` | `1m` | Message pruning and statistics cadence, default 1m; retention is enforced on this schedule. |

`.env.example` documents local-only NTFY_HTTP_PORT (18101) and the optional browser-push values NTFY_WEB_PUSH_PUBLIC_KEY, NTFY_WEB_PUSH_PRIVATE_KEY and NTFY_WEB_PUSH_EMAIL_ADDRESS, which must be supplied together. The wrapper derives the subscription file path; do not share it with another service. Unknown optional upstream variables are outside this recipe's tested contract.

## Local build and smoke

Run inside this directory. Never use global Docker cleanup. Compose publishes only loopback ports in the 18100–18119 allocation.

```bash
export NTFY_BOOTSTRAP_PASSWORD="$(openssl rand -hex 16)"
docker compose -p my-ntfy up --build -d
COMPOSE_PROJECT_NAME=my-ntfy bash scripts/smoke.sh
# Optional isolated restart/token/restore test:
bash scripts/local-smoke.sh
docker compose -p my-ntfy down -v
```

Install authoring dependencies with `npm ci --ignore-scripts`, then run `bash scripts/verify.sh`. Run the documentation checks separately; the existing structural verifier does not invoke the Node docs suite:

```bash
node scripts/verify-docs.mjs
node --test tests/docs.test.mjs
```

`scripts/local-smoke.sh` owns a unique Compose project and removes only its containers/volumes in an EXIT trap. `scripts/smoke.sh` tests an already-running stack without deleting it. Docs and offline structural tests do not prove an image builds or starts; maintainers must repeat the isolated build/start/workload verification for this release's frozen source.

## State, backups and restore

Only ntfy mounts `/var/lib/ntfy`. Back up auth.db, cache.db, optional webpush.db and any SQLite journal/WAL files together after stopping the service, or use SQLite's supported online backup API for each database. Treat auth backups, minted tokens and VAPID keys as secrets. Do not tar running SQLite files. Restore the directory with its original permissions into an independently checked empty volume, restore the same bootstrap variables and VAPID keys, then check denial, token validity and retained replay before reconnecting clients. A newer backup can contain changed ACLs: audit them before exposing the server. `scripts/local-smoke.sh` exercises a stopped-volume archive and scoped-token/cached-message continuity; repeat it for this release's frozen source and test a distinct fresh-volume recovery on Railway.

## Security and support boundary

401 means missing/incorrect credentials; 403 means the authenticated user lacks that topic ACL. Topic names are not security credentials. If boot fails with missing auth-file, verify the initializer can write its exclusive volume. If replay is absent, inspect retention and cache-file persistence, not just HTTP readiness. Changing the bootstrap password rotates it on startup, but existing tokens require separate revocation with ntfy token remove. Browser permission, stable VAPID keys and HTTPS are separate from HTTP notification health. Never attach auth.db or print access tokens in logs.

No HA, production capacity, hostile multi-tenant isolation, exactly-once external delivery or indefinite retention claim is made. Only ntfy's HTTP listener is public; its SQLite databases stay on the exclusive volume. Use Railway TLS for all public authenticated endpoints. See [SUPPORT.md](SUPPORT.md), [UPGRADE.md](UPGRADE.md) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
