# Upgrade and rollback

Template VERSION (currently 1.0.0) is separate from upstream runtime versions. Major template changes break the deployment contract; minor versions add compatible behavior; patch versions fix packaging/security. Future publication should maintain release-v1 and immutable vX.Y.Z tags.

Back up the stopped volume and securely record VAPID settings. Read the upstream changelog, update the exact image tag and manifest digest together, rebuild, and test anonymous denial, off-namespace rejection, token access, replay and restart. The wrapper uses v2.28.0 CLI flags (including --ignore-exists); verify them if upgrading. New SQLite schemas may not permit binary downgrade: restore a matched old image and backup rather than reusing migrated files.

Before changing a compatibility branch: stop new work, retain a restorable backup, test the intended runtime/image pins locally, record required operator actions and measure the disposable Railway deployment. Never delete volumes as an upgrade step or run global Docker cleanup. Check credentials, private DNS and healthcheck target ports independently of deployment status.
