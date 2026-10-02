# License review

## Original recipe code

On October 2, 2026 the owner explicitly approved MIT for newly authored template, wrapper and application-recipe code. `LICENSE` covers that original code only; upstream products, dependencies, container files, fonts, sounds, plugins and enterprise components retain their own licenses and notices. This approval does not relicense or grant rights to any upstream artifact.

Reviewed primary upstream material on October 2, 2026.

ntfy is dual licensed Apache-2.0/GPLv2; the upstream Apache-2.0 option is the intended redistribution basis. Its README separately lists Mixkit notification sounds, Creative Commons Attribution sounds, Roboto fonts and other UI dependencies. Preserve bundled licenses/attributions; an Apache choice for server code does not relicense those assets. Do not imply trademark endorsement. This is an engineering review, not legal advice.

## Primary evidence

- [Configuration and auth](https://docs.ntfy.sh/config/)
- [Pinned server config](https://github.com/binwiederhier/ntfy/blob/v2.28.0/server/server.yml)
- [CLI user creation](https://github.com/binwiederhier/ntfy/blob/v2.28.0/cmd/user.go)
- [CLI token behavior](https://github.com/binwiederhier/ntfy/blob/v2.28.0/cmd/token.go)
- [License and third-party assets](https://github.com/binwiederhier/ntfy/tree/v2.28.0#license)

## Publication gate

The owner's original-code MIT approval is recorded above. The tagged upstream README's Go/web/font/audio inventory is retained in THIRD_PARTY_NOTICES.md, and the complete selected Apache-2.0 license is supplied both in source and in the derived image. Unmodified base-image assets retain their individual terms; notification audio is not separately sold or relicensed. VAPID/browser push and external mobile relays are not part of the default qualified private HTTP publish/subscribe core. No security certification or provider entitlement is claimed.
