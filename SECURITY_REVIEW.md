# Scoped default-workflow review

Reviewed October 4, 2026 for ntfy 2.28.0, selected by the immutable image digest in [Dockerfile](Dockerfile). This is a finite assessment of the source recipe and its default authenticated HTTP publish/replay workflow, not a complete image, vulnerability, legal or production-capacity certification.

## Access boundary

The wrapper initializes new SQLite state using a loopback listener, stops that listener, and installs credentials and deny-all access before opening the public listener. Each startup forces the bootstrap account to the non-admin role, resets its topic ACL and password, and clears anonymous grants. Manually created users remain; operators must audit their privileges separately.

The bootstrap ACL grants `alerts-*`, but upstream deliberately also grants each authenticated user full access to that user's own private synchronization topic. A nominal read-only or write-only user likewise retains its own synchronization-channel read/write access. This is not a demonstrated anonymous grant or access to another user's sync topic. See [the pinned authorization implementation](https://github.com/binwiederhier/ntfy/blob/v2.28.0/user/manager.go).

Static UI, login, health, public configuration and aggregate `/v1/stats` are accessible without credentials. Aggregate statistics can reveal traffic activity, not topic names or message payloads. “Private” refers to message authorization, not hiding server existence or aggregate activity.

Tokens inherit the user's current permissions; they do not provide narrower per-token scopes. Use distinct non-admin accounts for separate clients, request explicit token expiry, and revoke tokens separately when changing a password. Avoid query-string credentials and trace logging of authenticated traffic. Public TLS terminates at Railway; do not expose the trusted-proxy backend directly to untrusted ingress.

## Selected binary and advisory evidence

The selected Linux amd64 product binary has SHA-256 `4ef640e91318b877c570045f833e5eaae6467b71978bd8b617d65026d303a5ca`. Its embedded build information identifies ntfy 2.28.0, Go 1.27.0, `CGO_ENABLED=1`, and the `sqlite_omit_load_extension,osusergo,netgo` build tags. These observed bytes do not attest every other image architecture. The source `go.mod` minimum Go version is not the compiled toolchain version.

A bounded comparison of 26 previously identified primary Go standard-library advisory leads finds Go 1.27.0 outside their recorded affected version ranges. For example, [GO-2026-5039](https://vuln.go.dev/ID/GO-2026-5039) concerns textproto errors and was fixed on older Go branches; [GO-2026-6218](https://vuln.go.dev/ID/GO-2026-6218) includes a fix at 1.27.0-rc.3. Two retained `golang.org/x/net` leads are also outside their affected ranges at actual 0.58.0. This is not a search for every advisory or a zero-vulnerability claim.

The binary includes `golang.org/x/crypto` 0.55.0. [GO-2026-5932](https://vuln.go.dev/ID/GO-2026-5932) concerns OpenPGP, and [GO-2026-6354](https://vuln.go.dev/ID/GO-2026-6354) / [GO-2026-6355](https://vuln.go.dev/ID/GO-2026-6355) concern SSH channel deadlocks. Default authentication uses bcrypt; no default SSH or OpenPGP operation was identified. The affected package version is disclosed rather than relabeled patched. Actual `github.com/pkg/errors` 0.9.1 was absent from the prior source-module query batch and remains unassessed in this existing-lead comparison. Optional SMTP, browser/mobile push, provider integrations and arbitrary operator extensions require their own assessment.

No concrete default-workflow blocker was identified in this finite review. Alpine/native packages, all embedded dependencies, unrelated binary code paths and future advisories have not received comprehensive clearance. Selected license and attribution material is described in [LICENSE_REVIEW.md](LICENSE_REVIEW.md) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md); distributing an assembled image has additional obligations distinct from distributing this source recipe.

## Qualification and operations

Readiness alone does not prove authorization or recovery. Follow [PUBLISHING.md](PUBLISHING.md) for revision-specific actual source deployment, queried-template graph, scoped authentication, token/cache continuity, fresh-volume restore, bounded workload and metadata readback checks. Optional VAPID/provider delivery, HA, hostile multi-tenant isolation and exactly-once external effects are not covered.

Back up auth/cache and any optional subscription state together while the service is stopped. Retention bounds message lifetime, not total stored bytes; monitor the volume. Standard deletion plus verified zero compute and disclosed Railway retention meets the owner's qualification-cleanup policy, but proves neither physical storage erasure nor billing cessation.
