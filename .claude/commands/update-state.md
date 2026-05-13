Update `docs/project/CURRENT_STATE.md` to reflect the current session's work. Follow these steps exactly:

1. Read the current `docs/project/CURRENT_STATE.md`.
2. Read `docs/project/BACKLOG.md` to get current item statuses.
3. Ask the user: "What did we complete this session?" if $ARGUMENTS is empty, otherwise use $ARGUMENTS as the summary of completed work.
4. Update the following sections in CURRENT_STATE.md:
   - **What Is Working**: add any newly validated or shipped features.
   - **Known Gaps**: remove items that are now resolved; add new gaps discovered.
   - **End Of Day Snapshot**: replace the previous snapshot with today's date (use the currentDate from context), a bullet list of what was completed, and a numbered list of recommended next work.
5. Do not reference other projects by name. Keep content scoped to this project only.
6. Write the updated file.
7. Confirm the update is complete and show the new End Of Day Snapshot section.
