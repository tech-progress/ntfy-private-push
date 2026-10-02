# Deploy and Host ntfy private push on Railway

Private ntfy topics with scoped credentials and persistent replay.

## About Hosting ntfy private push

One ntfy 2.28.0 service, pinned by digest, with an exclusive volume holding auth, cached messages, and optional browser subscriptions. The server denies topic publishing/subscriptions by default, disables public signup/reservations, and reconciles a non-admin user with read/write access only to `alerts-*`. Public static UI/login and the payload-free `/v1/health` remain accessible; message endpoints require authentication.

A first-boot loopback-only initializer creates ntfy's SQLite databases before the upstream CLI can add the user. It is stopped before credentials/ACLs are installed and before the public listener opens. Each startup resets only the bootstrap user's ACL and rotates its bcrypt password from the supplied secret. Changing the prefix removes that user's old grants. Manually added users are not erased; explicitly audit/remove their grants when changing your privacy policy.

## Why Deploy ntfy private push on Railway

Independent service lifecycles, explicit private networking, generated credentials and exclusive persistent volumes provide a reproducible low-volume evaluation. Authentication protects workload endpoints; this is not an HA production claim.

## Common Use Cases

- Evaluate the upstream product with a real authenticated workflow.
- Exercise persistence, retries/replay and operational recovery before adoption.
- Extend the included bounded fixture without exposing internal backends.

## Dependencies for ntfy private push

[ntfy](https://ntfy.sh/). Exact runtime/image pins live in Dockerfile, compose.yaml and the dependency locks.

### Deployment Dependencies

An existing source repository on a slash-free release-v1 branch, configured source root, Railway private networking and the documented persistent volumes are required. Fill every required secret and complete the bootstrap described in README.md. Hatchet requires a real tenant token minted after initialization, not a generated placeholder. Consult FINDINGS.md: marketplace publication, disposable Railway deployment and resource/soak gates remain pending.
