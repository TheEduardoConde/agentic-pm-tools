Run PM Tools validation against the active project and report findings. Follow these steps exactly:

1. Read `docs/project/CURRENT_STATE.md` to confirm the active project path.
2. Start the PM Tools server if not already running: `node app/server.js --project docs/project` from the `app/` directory.
3. Call `GET /api/validate` against the running server.
4. Parse the response and group findings into three sections:
   - **Errors** (must fix before release): list each finding with item ID and description.
   - **Warnings** (review required): list each finding with item ID and description.
   - **Info** (informational): summarize count only unless $ARGUMENTS includes "verbose".
5. If any safe mechanical fixes are available (folder moves, index regeneration), list them and ask the user whether to apply them.
6. Report total counts: X errors, Y warnings, Z info.
7. If zero errors and zero warnings, confirm the project is structurally clean.
