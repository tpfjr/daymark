# Release procedure — publishing disabled

Publisher: Thomas P. Fausnaught, Jr.
Destination: https://github.com/tpfjr/daymark/releases
General support: https://github.com/tpfjr/daymark/issues
Private vulnerability reports (enabled): https://github.com/tpfjr/daymark/security/advisories/new
Do not publish security details in a public issue.
Distribution terms beyond all rights reserved: NOT DECIDED.
Signing certificate: NOT PROVIDED. No purchase or signing service has been configured.

## Before any public launch

- Use a fresh Windows 11 VM/user with no developer tools. Record OS/build and artifact hash.
- Install unsigned candidate for testing; verify first launch, default theme/hours, sample
  tasks, empty notes, keyboard/drag, cancellation and persistence after restart.
- Upgrade copies of old supported profiles. Never use the only copy of real data. Verify
  notes, completion, dates, task colors, recurrence exceptions, search and restore/merge.
- Set the second backup folder on another drive; make edits, restore into an isolated
  profile, disconnect/reconnect, and verify local saves continue with a visible warning.
- Test every theme at 125%, 150%, 175% and 200%, including task tray, note pop-out,
  dialogs and Windows tray icon. Record screenshots; look for clipped controls.
- Enable reminders. Check foreground, closed-to-tray, locked screen and sleep/resume.
  After logoff the process is gone: reminders are not guaranteed and there is no Windows
  startup registration. Document observed behavior rather than implying background service.
- Import real, consenting Google and Outlook exports: recurring/moved/cancelled meetings,
  IANA/Windows zones, DST changes, all-day/multi-day events, long descriptions, detached
  invitations and duplicate re-import. Confirm titles, full note text, done state and
  omitted-description imports. Do not commit these private files.
- Verify the file-based main window and calendar worker on the clean machine. The file
  privilege fuse remains enabled; disabling it previously prevented the packaged UI from
  loading. Node integration is off, renderer sandbox/context isolation on, permissions
  denied, and ASAR-only/integrity fuses on. A protocol redesign is not claimed here.
- Obtain an appropriate Windows signing certificate separately. Sign app/installer,
  verify signature and publisher on a clean machine, and repeat install/upgrade/uninstall.
  Signing does not guarantee immediate SmartScreen reputation or antivirus acceptance.
- Choose support/security contact and approve privacy/distribution wording. Review build
  dependency advisories (current build-tool audit has moderate findings; runtime audit clean).
- Fill release-readiness.json only after recording evidence. Keep missing checks false.

## Build without storing credentials

The development path never signs or publishes. For a public candidate, use a signing
Windows certificate accessible to signtool, selecting it with DAYMARK_CERTIFICATE_SHA1 (preferred, 40 hexadecimal digits) or DAYMARK_CERTIFICATE_SUBJECT. Set DAYMARK_CERTIFICATE_PUBLISHER to the exact publisher spelling on that certificate. These values map to win.signtoolOptions.certificateSha1, certificateSubjectName, and publisherName; CSC_NAME is not used. Private key material stays with the certificate provider/store. Confirm whether the issuer supplies a hardware token, store-backed key, or cloud signing service. The current integration supports Windows store selection, not an unconfigured cloud service. Do not commit
credentials, .env, certificates, private keys, npm tokens or CI secret values. The
application publisher remains Thomas P. Fausnaught, Jr.; the signing publisher is explicitly supplied from the actual certificate. Confirm it with your issuer before proceeding.

Run npm test, then npm run dist:public. This checks readiness, uses forceCodeSigning,
and always runs electron-builder with --publish never. The app has no update feed,
update client, background checks or downloaded-code installation mechanism.

## Manual release handoff

1. Inspect Authenticode signatures on the setup EXE and installed Daymark.exe. Use
   Get-AuthenticodeSignature; Status must be Valid. Verify publisher and timestamp.
2. Produce SHA-256 checksums with Get-FileHash and retain the exact tested artifacts.
3. Keep installer, checksums, license notices, release notes and review evidence together.
4. Separately create a DRAFT GitHub Release using your own authenticated account. Upload
   setup EXE and checksum as release assets, not Git commits. No tool here publishes it.
5. Review the draft and make an explicit publish decision only after all blockers clear.
6. Security patches are manual releases: bump the pinned Electron patch, rebuild, run
   regression/clean-machine checks, sign and publish a new installer with clear notes.
   Users choose Help > Download releases or visit the releases page and install manually.

## Rollback

Keep the previous signed installer and pre-upgrade backups. Do not open a newer schema
with an older build. Revert binaries only with a compatible isolated restored backup;
confirm data before replacing a user's profile. Never silently downgrade schema or data.

Signing API reference: https://www.electron.build/docs/api/app-builder-lib.interface.windowssigntoolsigningconfig/ (also verified against the installed v26 types).
