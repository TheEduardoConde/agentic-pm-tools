# Current State — Agentic PM Tools

## Product Snapshot

- Portable, file-based project management tool for agentic development workflows.
- Node.js HTTP server (zero npm dependencies), plain ES6 module frontend, no framework.
- Data model: markdown files with YAML front matter stored under `docs/project/backlog/` and `docs/project/releases/`.
- Project registry: `app/pm-tools-config.json` — supports multiple project registrations with quick-switch.
- Current version: v0.1.0.

## What Is Working

- Full backlog CRUD: create, edit, view, delete items via the UI and `PUT /api/backlog/items/{id}`.
- 19-status lifecycle with automatic folder routing (active / completed / deferred / archived).
- Automatic lifecycle date stamping (`developed`, `tested`, `deployed`) on status transitions.
- Release management: create releases, bulk-assign items, generate Codex prompts and human testing checklists.
- Validation: 13+ checks, findings grouped by severity (Error, Warning, Info).
- Prompt Workspace: generate item-level and release-level Codex prompts, version-control prompts.
- Project registry: add, edit, delete, switch projects; analyze project structure before saving.
- Lifecycle Kanban board (view-only, 6-item column limit).
- Comprehensive test suite: 77 passing tests using only Node built-ins.

## Known Gaps (Backlog)

See `BACKLOG.md` for the full prioritized list. Key items:

- No inline or bulk status change — every status change requires opening the edit modal. (ENH-0006, ENH-0007)
- Kanban board is view-only — no drag-and-drop. (FEAT-0019)
- Validation findings are read-only — no auto-fix actions. (ENH-0011)
- No item relationships / dependency tracking. (FEAT-0013)
- Release lifecycle dates are never auto-stamped. (ENH-0010)
- Project color is stored but never shown in the main UI. (BUG-0005)

## Useful Commands

```bash
# Start the app
node app/server.js

# Run tests
node app/test/readBacklog.test.js
```
