# Deploy and Host ntfy private push on Railway

Private ntfy topics with scoped credentials and persistent replay.

## About Hosting ntfy private push

Run [ntfy](https://ntfy.sh/) as one digest-pinned ntfy 2.28.0 service with one exclusive 5,000 MB `/var/lib/ntfy` volume for authentication and cached messages. Topic access is denied by default; signup/reservations and attachments are disabled. A non-admin bootstrap user's ACL grants `alerts-*`, and ntfy also permits that user's own private sync topic. Static UI/login, health, public configuration and aggregate traffic statistics are public; message endpoints require authentication.

Startup initializes SQLite through a loopback-only listener, then stops it before installing credentials and opening the public listener. Every restart forces the bootstrap user back to non-admin, resets its ACL/password and clears anonymous grants. Manually created users remain and require their own access review.

## Why Deploy ntfy private push

Evaluate authenticated private HTTP notifications without an external database, broker or paid push provider. Railway supplies HTTPS ingress, a generated bootstrap password and persistent SQLite storage. Revocable client tokens inherit their user's topic permissions. Default cache retention is 24h with a 1m pruning cadence; clients deduplicate replayed message IDs.

## Common Use Cases

- Send authenticated backup/build/job alerts to private topic namespaces.
- Replay recent notifications after a subscriber reconnects.
- Practice scoped tokens, stopped-volume backups and recovery before adoption.

## Dependencies for ntfy private push

One ntfy service, one single-service persistent volume and the [standalone source repository](https://github.com/tech-progress/ntfy-private-push) on `release-v1`, root `/`. No PostgreSQL, worker, SMTP or provider account is required for default HTTP publish/subscribe. Template release **v1.0.1** changes docs and docs verification only; runtime pins are unchanged from public source `v1.0.0`. This release must be qualified independently. Historical `v1.0.0` selected-source success does not qualify this release, and a source release does not prove marketplace publication. Follow the exact-source, stored-graph, recovery, headroom, cleanup and publication readback gates in [PUBLISHING.md](PUBLISHING.md).

### Deployment Dependencies

Use one replica and public HTTP port 8080 behind Railway TLS. `NTFY_BASE_URL` must match the HTTPS service domain; `NTFY_BOOTSTRAP_USER=publisher` and its generated password initialize/reconcile access. Defaults are `NTFY_TOPIC_PREFIX=alerts-`, `NTFY_CACHE_DURATION=24h` and `NTFY_MANAGER_INTERVAL=1m`. Preserve credentials and full SQLite state during recovery. Changing the password does not revoke existing tokens; revoke them separately. Do not create anonymous grants.

For optional browser Web Push, supply `NTFY_WEB_PUSH_PUBLIC_KEY`, `NTFY_WEB_PUSH_PRIVATE_KEY` and `NTFY_WEB_PUSH_EMAIL_ADDRESS` together and keep keys stable. Provider delivery and browser-subscription restoration are unqualified; instant iOS relaying is deliberately not enabled. No HA, hostile-tenant isolation, production capacity, exactly-once delivery or indefinite retention claim is made. Monitor volume use: finite cache expiry is not a hard byte cap. Follow the distributed [README](README.md), [SUPPORT](SUPPORT.md) and [UPGRADE](UPGRADE.md) instructions.
