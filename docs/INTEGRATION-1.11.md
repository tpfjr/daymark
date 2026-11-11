# Daymark 1.11.0 integration review

This version combines `13c9133` (GitHub main's month-view, imported-schedule and
planning workflows) with `ca05e07` (the calendar-first layout and per-block reminders).
It supersedes the two different 1.10.0 builds. Planner schema remains 9; schemas 1–8
remain importable. No real planner profile was used in development or testing.

## Integration decisions

- The calendar-first layout owns sidebar placement and menus. Month view shares the
  same calendar, notes, time totals and date navigation as Day/Week.
- One right-click menu offers Edit, Delete, Copy with notes, and Copy task/duration.
  Right-click empty calendar space or a month date to paste. Generated recurring
  occurrences are copied as independent blocks.
- Copies with notes retain the block reminder. Task/duration-only copies omit notes
  and reminders. Existing per-block reminder editing remains available in every view.
- Month events and linked notes highlight one another. Clicking a month's notes count
  reopens the Notes sidebar if it was collapsed.
- The upstream direct-import workflow, automatically detected dates, event titles,
  display-hour expansion, and optional matching-event updates are retained. Updates
  preserve block reminders and accept imported times off the ten-minute grid.
- The template builder and explicit date/weekday application are retained, with one
  notes field and the new Allow overlap choice. Templates captured from a day retain
  its reminder values. Applying an out-of-hours template expands displayed hours.
- New recurring schedules still default to *not* skipping days off. Existing schedules
  retain their saved choice. New blocks allow overlaps; busy conflicts remain flagged.
- Density calculations cover the timed Day/Week grids, including scrolling to imports.
  Month remains a date-cell view. Readability and contrast styles apply to month entries.

## Validation

`npm test`: 88/88 groups passed (15 focused suites and 73 historical groups).
The combined native suite exercises direct import/re-import/update, month navigation,
per-block reminders in month view, linked-note highlighting, sidebar reopening,
Delete/Undo, copy/paste with and without notes, and multi-week template application.
Additional unit regressions cover copied reminders, off-grid import updates, template
reminder preservation, overlap application and supported-year month boundaries.
The historical storage, recovery, backup, migration, search and import checks remain enabled.

Historical tests navigate moved controls through the existing UI adapter. The new
combined native test exercises the month/import/template flows alongside the layout.
All profiles are isolated. Test screenshots contain synthetic study sessions only.

## Review focus / limits

Check the interactions in ui/planner-ux.js, ui/layout.js, ui/app.js and
ui/planning-core.js first. Import updates match entries on the same date; this is a
local import workflow, not calendar account synchronization. Explicit import and template
application can expand displayed hours and consequently Open time.

The build remains unsigned, publishing is disabled, and there is no automatic updater.
Physical cross-window task dragging, Windows notification delivery across sleep/lock/logoff,
and a clean-machine installer upgrade remain manual release checks. Automated task-drop
coverage dispatches renderer drag events; block movement/resizing uses real pointer events.

The unsigned 1.11.0 installer built successfully. All three native suites also passed
against the packaged executable: integrated month/import workflows, calendar controls,
and density/theme/preference checks. No installation over a real profile was performed.
