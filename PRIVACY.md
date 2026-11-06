# Privacy summary — maintainer review required before public release

Daymark stores planner content and appearance/reminder preferences locally in the
Windows user profile. It makes local backups. A second folder is used only when
selected by the user; it contains readable planner data in compressed JSON.
A user-selected cloud-synchronized folder may be uploaded by that cloud provider's
client. Daymark has no cloud account integration or built-in telemetry/crash upload.

Calendar/text/CSV/backup exports can contain private notes and event details. Calendar
exports include full notes in descriptions and Daymark metadata for lossless import.
Review files before sharing. Desktop notification content may be visible on screen.

There is no automatic update client or background update check. Choosing Help >
Download releases opens GitHub in the default browser, subject to browser/GitHub
network and privacy behavior. No credentials are included in the project or build.

General support uses GitHub Issues. Private vulnerability reporting uses the repository Security tab. Final distribution terms and this privacy wording still require approval. This summary
must be reviewed by the publisher before the public-release checklist is completed.
