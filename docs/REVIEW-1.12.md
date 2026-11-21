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

The Windows test runs use temporary profiles. Packaged-app checks launch the executable directly. A clean-machine installer walkthrough and an upgrade over a live planner are separate manual checks.
