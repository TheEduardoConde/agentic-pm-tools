Mark a backlog item as Done and close it out. The item ID is: $ARGUMENTS

Follow these steps exactly:

1. Read the backlog item file from `docs/project/backlog/active/` matching the given ID.
2. Confirm the item's current status is `Ready to Release` or `Needs Validation`. If it is not, stop and report — items should reach Done via the proper lifecycle.
3. Confirm with the user that human testing and any required security review are complete before proceeding.
4. Update the item's front matter:
   - Set `status` to `Done`.
   - Set `deployed` to today's date (use currentDate from context) if not already set.
   - Set `tested` to today's date if not already set.
5. Move the file from `docs/project/backlog/active/` to `docs/project/backlog/completed/`.
6. Append an Activity entry: `- <ISO timestamp> - Status changed to Done.`
7. Regenerate `docs/project/BACKLOG.md` by calling `POST /api/backlog/regenerate` or by reading all item files and rebuilding the index tables.
8. Confirm the move and index update, then show the closed item's ID, title, and final lifecycle dates.
