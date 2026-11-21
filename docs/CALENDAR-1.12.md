# Daymark 1.12 calendar changes

- Fresh profiles open in Week, with Fit to window and closed Tasks and Notes panels. View holds these controls. Existing explicit layout preferences are respected. Fit scales the ten-minute grid to the window. A full 24-hour schedule makes short entries small; choose a larger density to zoom in.
- Search and filters are in the header. Totals sit below the calendar. Plan contains Add, Undo and Redo. Clicking or dragging in Day/Week creates a block; Plan → Add and the N shortcut provide keyboard access. Undo reverses a change. Redo reapplies it.
- Hover the holiday symbols in date headers or month cells for names. They follow modern nationwide US federal holiday rules with weekend observance. They are decorative and do not mark a day off.
- Click a date heading to save that day's blocks as a template or apply a saved template to that date. Saving and applying remain separate confirmations.
- Shift-drag across blocks to select them, then choose Delete selected. A regular drag keeps its create/move/resize behavior. Deleting selected recurring occurrences leaves the rest of each series scheduled.
- Use Edit or delete similar from a block or its context menu to move start times, replace or clear block text, or delete across dates. Review the match count and scope first. The weekday/time option matches the same task and title. Choosing All blocks of this task color matches the category, not every category with the same color value. Imported .ics occurrences are individually saved blocks; native repeating blocks also offer Entire repeating series.
- Editing a block's color changes the shared task color. Tray scheduling starts a clean task without the prior entry's notes. Clear Used before hides current suggestions in that tray profile. The calendar retains its history.
- A finish earlier than the start creates two adjacent blocks. For example 11 PM–7 AM creates 11 PM–midnight and midnight–7 AM the following date. Each part can subsequently be edited independently. Weekly repetition creates two weekday schedules. The initial reminder is on the evening part. Saving expands the displayed hours to show both parts.
- Daily notes have a direct delete button. Planner Undo restores the deletion.
- Data → Clear planner offers scheduled blocks/series only, or all planner content. The app flushes edits and requires a confirmed restorable checkpoint before clearing. The calendar-only option preserves notes, templates and tasks. App preferences and backup files are separate.

Clear reads the new gzip back from disk, compares it to the saved planner and checks that the normal backup-format validator accepts it within restore size limits. A failed check stops the clear. An empty clear creates no checkpoint. The automatic backups folder keeps the latest 20 pre-clear files (`before-clear-*.json.gz`) separately from the 20 before-restore files. Existing backups retain their names and restore as before.

Deleting an imported timed occurrence records its import ID on that date. Importing the same calendar again skips the deleted occurrence. Undo restores it. Deletions made in older builds have no recorded ID to match.
