# Daymark Desktop

Copyright (c) 2026 Thomas P. Fausnaught, Jr. All rights reserved.
Package license: UNLICENSED. This is not an open-source license grant.

Release destination: https://github.com/tpfjr/daymark/releases
Publishing is disabled. Installers belong in GitHub Releases, never in the repository.
No credentials, signing keys or tokens are included or required for a development build.

## Build and test

Use Windows and Node 24 or newer with node:sqlite. From this project directory:

    npm ci
    npm test
    npm run dist:dev

The default output is dist/Daymark-<package-version>-Installer. Set DAYMARK_BUILD_OUTPUT
to another build-output directory if this project is used as a standalone repository.
The Windows workflow is manual (workflow_dispatch), read-only, pinned to official
action commits, and does not upload installers or publish releases.
npm test also runs the historical storage/fault-injection, import and Electron desktop suites from tests/regression in isolated temporary profiles.

## Install and upgrade

### Planner controls in 1.10.0

- Day, Week, and Month show the same saved calendar. Click a month date to open
  that day, or an event to edit its session notes. The current-time label updates
  live; today's day/week column also has a labeled time line.
- Import calendar: choose a local file, then Import. Display hours expand
  automatically, the first imported date is selected, and duplicate blocks are
  skipped. There is no required preview step. Advanced options contain the date
  range and description settings. All-day events remain daily notes.
- To import a revised plan, select **Update matching imported blocks**. Matching
  imported events on the same date receive the file's times, title, notes, and
  selected task/color; their previous contents can be restored with Undo.
  Ordinary imports keep existing entries. This is not account synchronization.
- Imported blocks display their event title without a task-category prefix.
- Right-click a block to copy with notes or just its task/title and duration.
  Right-click another time or month date to paste. The paste dialog lets you
  choose the exact date and start time. Copies are independent, not recurring.
- Day templates: name a draft, add task/time blocks (or use the selected day's
  blocks), then Save template. In step 2 choose the saved template, first/last
  dates and weekdays. Review the listed dates and Apply. Saving alone does not
  schedule anything; checking weekdays filters the selected date range.
- Time by task, My day and Keep your history are on the left. Calendar is in
  the center; task backlog and daily notes are on the right. Narrow windows
  stack the supporting panels to retain usable calendar space.

Quit the old app via File > Quit. Run the setup EXE. The installer supports per-user
installation, choosing a directory, in-place upgrades, and uninstall. Planner data
stays in the existing Daymark user profile. Uninstall is configured to keep it.
The development installer is unsigned and can show an unknown-publisher warning.
Do not describe this candidate as ready for public distribution.

## Public release

Read RELEASE.md and complete release-readiness.json with actual evidence. The public
build command refuses to run without an OS-store signing certificate and completed
checks. npm run dist:public still uses --publish never. No automated publishing or
updates are implemented. Help > Download releases opens GitHub only on a user click.
Any future auto-update proposal must be opt-in and clearly disclosed.

## Backups outside the profile

File > Second backup location lets you choose another drive or a locally synchronized
OneDrive/Dropbox folder. Daymark writes a per-installation Daymark-backups-UUID folder.
It copies automatic recovery/history snapshots after local backup flushes, using
atomic replacement. Intraday snapshots are included. External history is retained independently: intraday/checkpoint files for at least 7 days, daily for at least 30 days, monthly for at least 400 days, and dated before-restore files for at least 90 days (day-boundary grace applies). Recent current/previous and undated pre-upgrade files are kept. Local deletion does not delete external history. The app reports unavailable-folder errors while
keeping local saving operational. Reconnect the folder to resume copying.

UNC/network share paths are rejected. Mapped network drives are unsupported and not recommended: mirroring still uses synchronous file operations in the storage worker, so a hung network I/O operation could delay saving. Use local/USB storage or a locally synchronized cloud folder. A separate-thread, timed mirror is not implemented.

Choose an actually independent location: another folder on the same disk alone will
not protect against disk loss. Daymark does not provide cloud sync or encrypt these
copies. Your cloud client's sync and retention are outside Daymark's control. Restore
via the existing backup file picker, selecting a .json.gz file from the second folder.
Disabling copies keeps existing external backups. The location preference is outside
planner backups and undo history; select it again when moving to a new computer.

## Notes and calendar export

Each note can export as its own all-day event. SUMMARY is at most 100 Unicode
characters; DESCRIPTION keeps the full note. Daymark-specific properties preserve
full text, ID, original date and completion, even when importing with descriptions
omitted. Older Daymark individual-note files use SUMMARY plus the [x] marker; text
is not concatenated twice. Existing matching notes keep your edits.

Uncheck Include notes as all-day events to avoid note banners. Scheduled events and
linked-note descriptions still export. There is no account synchronization. Weekly
review counts unique note IDs, completed if any copy in that week is complete.

## Third-party components

Keep THIRD-PARTY-NOTICES.txt, ICAL-LICENSE.txt, IMMER-LICENSE.txt,
ELECTRON-LICENSE.txt and runtime LICENSE/LICENSES.chromium.html with distributions.
Electron is pinned at 45.2.3. No automatic update client is bundled.
