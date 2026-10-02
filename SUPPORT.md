# Support boundary

This is an unpublished, self-contained low-volume evaluation recipe. The primary upstream projects are [ntfy](https://ntfy.sh/). It does not provide managed-service support, multi-node availability, performance sizing, or an exactly-once guarantee.

401 means missing/incorrect credentials; 403 means the authenticated user lacks that topic ACL. Topic names are not security credentials. If boot fails with missing auth-file, verify the initializer can write its exclusive volume. If replay is absent, inspect retention and cache-file persistence, not just HTTP readiness. Changing the bootstrap password rotates it on startup, but existing tokens require separate revocation with ntfy token remove. Browser permission, stable VAPID keys and HTTPS are separate from HTTP notification health. Never attach auth.db or print access tokens in logs.

Provide template VERSION, exact upstream pins, failing command/HTTP status and redacted logs. Do not provide token output, auth databases, /config contents, full DSNs, passwords, customer payloads or raw database dumps. Reproduce with scripts/verify.sh and an isolated scripts/local-smoke.sh first. Escalate product bugs upstream only after separating wrapper configuration from upstream behavior.
