# Dependency audit — 2026-11-06

Verified with a clean npm ci from package-lock.json and npm audit.
Full audit: 9 affected packages, all moderate.
Production-only audit: 0 findings. This command excludes
build-time packages; bundled ical.js and Immer are also covered by the full audit.

Affected build dependency names: @electron/asar, @electron/packager, @electron/universal, app-builder-lib, dmg-builder, electron-builder, electron-builder-squirrel-windows, glob, minimatch.
These are build/tooling findings, not a claim of zero security risk. No forced
major downgrade or dependency override was applied. buildDependencyReview remains
false in release-readiness.json. Re-run both commands before a public launch.

CI runs npm audit --omit=dev as a failing check. The full build audit remains a
manual release-review item; known findings are not suppressed or marked fixed.
