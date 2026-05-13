Create a new release and assign backlog items to it. The release version and optional item list is: $ARGUMENTS

Follow these steps exactly:

1. Read `docs/project/BACKLOG.md` and list all items with status `Ready to Release` or `Ready` that are currently `Unassigned`.
2. Read `docs/project/releases/` to confirm the requested version does not already exist.
3. Ask the user to confirm: release version, goal statement, and which items to include — or use $ARGUMENTS if a version and item list are provided.
4. Create the release file at `docs/project/releases/<version>.md` using the release template from `docs/_methodology/templates/`:
   - Set `status` to `Planning`.
   - Set `created` to today's date (use currentDate from context).
   - Populate `## Included Backlog Items` with the confirmed item IDs.
   - Write the `## Goal` from the confirmed goal statement.
   - Leave `## Release Notes`, `## Human Testing Checklist`, and `## Version Control Prompt` with placeholder content.
5. Update each included backlog item's `release` front matter field to the new version.
6. Regenerate `docs/project/BACKLOG.md`.
7. Report: release file created, items assigned, any items that could not be assigned and why.
