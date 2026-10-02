# Third-party notices

The original recipe is MIT. The unmodified upstream server/web assets are not covered by that grant. This recipe chooses ntfy's Apache-2.0 option and supplies its complete tagged license at `licenses/ntfy-Apache-2.0.txt`, also retained in the derived image. The upstream distribution remains Copyright Philipp C. Heckel and its contributors.

Upstream source and its asset attribution inventory: https://github.com/binwiederhier/ntfy/tree/v2.28.0#license . The source tag identifies the matching server, Go dependencies, browser bundle and notification assets. No upstream server, browser dependency, font or audio source is modified by this recipe; no standalone audio/font redistribution is offered.

- Notification sounds from Mixkit: https://mixkit.co/free-sound-effects/notification/ — Mixkit Free License, not Apache/MIT.
- Notification sounds from Notification Sounds: https://notificationsounds.com — Creative Commons Attribution; retain upstream credits and source attribution when reusing assets.
- Roboto font: https://fonts.google.com/specimen/Roboto — Apache-2.0.
- React, Material UI, MUI dashboard template, urfave/cli, go-smtp, go-sqlite3, github/gemoji, webpush-go and Sprig retain their MIT notices.
- Dexie.js and Firebase Admin SDK retain Apache-2.0 notices. Go's text/template retains BSD-3-Clause notices, including the upstream vendored patch attribution.

Alpine/container/runtime packages retain their individual upstream licenses and source availability. The base image's files and package metadata are not stripped. The server is referenced by immutable digest; wrapper licensing does not promise a uniform license for the complete image, trademark endorsement, mobile push-provider entitlement or a security certification.
