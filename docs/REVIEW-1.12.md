# Daymark 1.12 review record

## Starting point

The initial calendar change was merged through PR #4 at 32ffc51. PR #5 contains the first review fixes (97336a5) and the follow-up. A reviewer can start here without the earlier conversation.

| First review finding | Resolution and regression evidence |
| --- | --- |
| Clear accepted an unreadable checkpoint or a readable file containing a different planner. | The worker reads the file back, enforces the restore limits, compares its bytes with the saved planner, and validates the recovered data. Fault injection covers a truncated gzip and another valid planner in both clear modes. |
| Empty clears could evict the only good pre-clear backup. | Clear and Restore each keep 20 checkpoints. Repeated empty clears write none. |
| Same-millisecond suffixes sorted incorrectly. | Retention understands old numeric suffixes. New files carry a write sequence independent of wall-clock time. |
| Bulk editing might change the wrong meetings. | Native tests cover different categories with the same color and title, imported and native meetings in the same slot, splitting one weekday, and deleting one parallel occurrence. |
| Full clear had no full-content restoration test. | Both modes reopen their checkpoints through the backup importer and compare the entire normalized planner. Failure leaves every field unchanged. Calendar-only removal retains notes and removes their links to deleted blocks. |

These tests live in `tests/clear-checkpoints.cjs` and `tests/calendar-review.cjs`. The first review also uncovered a deleted imported meeting returning on re-import. Exact import IDs now suppress previously deleted timed occurrences. Deletions made before this change have no recorded ID.

## Follow-up review

| # | Result |
| --- | --- |
| 1 | Reproduced duplicate morning blocks on re-extending an evening. Newly created overnight entries and rules now reuse stable morning identities. Editing just one evening occurrence updates that morning's exception. Older unlinked nights remain independent. If a matching midnight block is visible, the editor asks before creating another. |
| 2 | The regular end selector represents midnight as 1440. Opening the editor with the alternate numeric value 0 also ends a nonzero start at midnight without writing a zero-length next-day block. Equal endpoints remain invalid. |
| 3 | Overnight halves remain individually editable and deletable. The skip-days-off option applies to each half's own calendar date. A holiday evening can therefore leave the next morning visible, and a holiday morning can hide only the morning. The morning has no second backlog link, completion flag, or start reminder. Imported time precision is retained. |
| 4 | Reproduced edited exceptions surviving bulk series deletion. Deleting a matched series now removes its overrides, exclusions, and note links. Weekday-scoped deletion keeps the other weekdays. |
| 5 | Splitting a weekday updates occurrence IDs, exclusions and note links. The desktop reminder ledger lives outside the planner and includes occurrence IDs. Split series retain the reminder identity for the original weekday and time. Task completion history uses backlog-item IDs. |
| 6 | Single-click opens date and template actions. Double-click in Week or Month opens the day at the top of the grid. The native test also checks the date range of the template dialog. |
| 7 | Fit still shows the whole displayed range. Scheduling an overnight span expands displayed hours to 24. On a short window, some short blocks are small. Choosing a larger density under View trades scrolling for larger blocks. |
| 8 | The renderer already rolled back failed imports through Immer. The standalone import function now validates dates and times for all events before changing any day. A deliberately invalid second event leaves the planner unchanged. |
| 9 | Reproduced same-UID hourly meetings collapsing. Import matches the exact occurrence first. Rescheduled standalone meetings can match an unambiguous complete UID on their date. Colon prefixes are distinct. |
| 10 | An ordinary re-import preserves local edits. Explicitly enabling updates replaces the source title, time and notes. The existing task category is preserved. |
| 11 | Legacy grouped Daymark notes now merge by text and origin date. Previously unseen notes retain their completion flag. Unstructured grouped text is retained as a note. Omitting the description omits the only note content these old exports contain. |
| 12 | Real ICS text fixtures verify an overnight timed event, an exclusive all-day end date, and a New York event spanning the fall DST change. Re-import preserves the occurrence count. |
| 13 | Reproduced newer writes falling out of retention after the clock moved backward. Both pools now retain files by write order across clock changes and restarts. Old filenames remain readable. |
| 14 | A locked old checkpoint now produces a cleanup warning and can be pruned later. It does not invalidate the new verified recovery copy. |

The follow-up tests are in `tests/review-import.mjs`, `tests/review-editor.cjs` and `tests/clear-checkpoints.cjs`. A stale selection is ignored, native task notes no longer create identical tray suggestions, and date-heading templates use the selected date for both endpoints. The holiday badge also handles the October observance of Veterans Day from 1971 through 1977. [VA holiday history](https://department.va.gov/veterans-day/history-of-veterans-day/)

## Third review (N1–N8)

| Finding | Behavior and verification |
| --- | --- |
| N1 · Linked mornings | Shortening the midnight end in the editor or by resizing, or directly deleting an evening block, offers to remove its identified morning. Declining keeps the morning and proceeds with the evening change. Deleting an entire evening series offers the same choice for its morning series. Deleting one occurrence can remove just the matching morning. The two changes undo together. Bulk operations continue to act on their displayed selection or matching scope. Earlier entries without a stable link are independent. |
| N2 · Missing or repeated local hours | For a named time zone without an embedded VTIMEZONE, the importer tests offsets on either side of the transition. It uses the pre-gap offset in spring and the first occurrence in autumn. The regression reads real ICS text and compares the date and minute with the expected UTC instant in the host's local zone. [RFC 5545 §3.3.5](https://www.rfc-editor.org/rfc/rfc5545#section-3.3.5) |
| N3 · Legacy grouped notes | A description limit that would cut an old grouped-notes event skips that event with a warning. Choosing full descriptions imports the complete notes. A blank line followed by a checkbox inside a note is preserved unless it also follows the legacy origin-date delimiter. The legacy text format cannot distinguish a literal copy of its entire delimiter from a real boundary. |
| N4 · Sub-minute overnight tail | When a calendar component cannot be represented at minute resolution, the importer removes its partial preview entries and reports the reason. Other valid events remain available. |
| N5 · Clear and re-import | Calendar-only clear retains the IDs of individually deleted imported events whether the calendar is empty or populated. It removes obsolete recurrence exclusions and calendar links. Full planner clear resets import exclusions too. |
| N6 · Date headings | Week and Month share one pending heading action. A rapid click on a different heading replaces the earlier pending action. Native tests check Wednesday is selected after clicking Monday then Wednesday, and a Month double-click opens the correct Day view at the top. |
| N7 · Fit and resizing | Fit measures the remaining calendar space, including the headings and footer. A half-hour block gets at least 14 pixels. With a 24-hour schedule in a short window the grid scrolls internally. When there is room it fits again. Tested at heights of 700 and 1,400 pixels. The calendar's saved display range still applies across days. |
| N8 · Series fields and migration | The morning rule explicitly drops the backlog link, completion flag and start reminder. Normalization initializes missing legacy daily-note arrays. The tests migrate a day without that array and split and delete a weekday series on the migrated day. The link cleanup loops also tolerate an absent array. |

`tests/review-edges.mjs` covers the file-format cases. `tests/review-boundaries-native.cjs` exercises the desktop editor, legacy normalization, date navigation, clear and resize behavior. The reviewer attachment includes `ui/planner-ux.js` and the actual normalization and legacy recovery code from `ui/core.js`.

## Fourth review (R1–R7)

| Finding | Resolution |
| --- | --- |
| R1 · Weekday split from the morning | A weekday edit from either side of a paired overnight series splits the corresponding weekday on the other side. The Monday/Tuesday pair keeps its link and edits to it leave Wednesday/Thursday alone. A native regression opens the Tuesday morning, moves it to 00:30, then re-extends Monday evening and checks the exact count and hours on both mornings. |
| R2 · Moving an evening by date | Moving a midnight-ending evening in the editor or across calendar columns carries its linked morning to the following date and updates note links for that morning. A single recurring occurrence leaves the following week's series intact. |
| R3 · Imported notes returning | Deleting a note through the main window or its pop-out records the note ID on that date. Re-import skips that ID. Legacy grouped notes use the original text and origin date to identify individual notes when the group is reordered. Existing deletions made before the update cannot be reconstructed. Calendar-only clear preserves import exclusions; full planner clear resets them. |
| R4 · Direct deletion and resizing | Native pointer tests right-click the evening and use Delete block, then separately drag the bottom grip upward. Both actions offer the linked-morning choice. Bulk moves change the matched blocks' times only. For example, moving a 23:00–00:00 rule to 22:00–23:00 can leave a gap before its morning. |
| R5 · Short entries in Fit | After the date headers are laid out, Fit uses the shortest visible timed block, down to a ten-minute row. Ten-, twenty- and thirty-minute blocks get at least 14 pixels. Short windows scroll internally when necessary. A native test switches from Month to Week in a 700-pixel-high window and measures the block, grid and scroll area. Imported blocks shorter than ten minutes can be smaller. |
| R6 · Dates announced by screen readers | Week and Month buttons share an accessible name including the date, named holiday, and listed day-off status. Tested in both views on Thanksgiving marked as a day off. |
| R7 · Description limit | Blank, missing and nonnumeric limits use 1,000 characters. Explicit zero and valid numeric limits are honored. |

“Skip days off” consults the specific and yearly dates you have listed. A Saturday outside your working week can still show Friday night's morning block. Listing that Saturday as a day off hides it.

The Windows test runs use temporary profiles. Packaged-app checks launch the executable directly. A clean-machine installer walkthrough and an upgrade over a live planner are separate manual checks.
