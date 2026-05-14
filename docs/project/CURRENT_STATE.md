# Current State - Agentic PM Tools

## Product Snapshot

- Portable, file-based project management tool for agentic development workflows.
- Node.js HTTP server (zero npm dependencies), plain ES6 module frontend, no framework.
- Data model: markdown files with YAML front matter stored under `docs/project/backlog/` and `docs/project/releases/`.
- Project registry: `app/pm-tools-config.json` supports multiple project registrations with quick-switch.
- Current version: v0.1.0.

## What Is Working

- Full backlog CRUD: create, edit, view, delete items via the UI and `PUT /api/backlog/items/{id}`.
- Simplified 9-status lifecycle with automatic folder routing (active / completed / deferred / archived).
- Automatic lifecycle date stamping (`developed`, `tested`, `deployed`) on item status transitions.
- Release management: create releases, bulk-assign items, generate Codex prompts and human testing checklists.
- Release status updates stamp release `developed`, `tested`, and `deployed` dates without overwriting existing dates.
- Validation: checks are grouped by severity and safe mechanical fixes are available for folder moves and index regeneration.
- Prompt Workspace: generate item-level and release-level Codex prompts, version-control prompts, and human testing checklists.
- Project registry: add, edit, delete, switch projects, analyze project structure before saving, and display project colors.
- Lifecycle Kanban board with overflow filtering and drag-and-drop status changes.
- Inline and bulk status updates, quick-add rows, CSV export, saved filter views, full-text search, and keyboard shortcuts.
- Tags, dependency links, sprint labels, activity notes, roadmap view, sprint planning view, release progress bars, and effort summaries.
- Dark mode with local browser preference persistence.
- Comprehensive test suite: 90+ passing tests using only Node built-ins.

## Known Gaps

- **ENH-0011 (Validation auto-fix)**: The safe-fix buttons for mechanical issues (folder moves, index regeneration) are not implemented in the UI. The Validation view explicitly states "Safe-fix buttons are future scope." This item remains in `Needs Validation`.

## End Of Day Snapshot - 2026-05-13

Completed today:

- Full automated human testing pass on all 21 backlog items in `Needs Validation` using Claude-in-Chrome browser automation.
- 20 items passed all acceptance criteria and were promoted to `Ready to Release`.
- 1 item failed (ENH-0011): no auto-fix buttons implemented in Validation UI — remains in `Needs Validation`.

Recommended next work:

1. Decide disposition for ENH-0011 — implement fix buttons or defer to a future release.
2. Plan and cut releases for the 20 `Ready to Release` items (candidates: v0.2.0, v0.3.0, v0.3.1 per existing release assignments).
3. Run release approval workflow and deploy.

## Useful Commands

```bash
# Start the app
node app/server.js

# Run tests
cd app
npm test
```
