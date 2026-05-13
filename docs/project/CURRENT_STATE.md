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

All current active backlog items are implemented and marked ready for human testing. Remaining work is human QA, release approval, and deployment/version-control approval.

## End Of Day Snapshot - 2026-05-07

Completed today:

- Simplified the backlog lifecycle to the solo developer / AI-assisted workflow: `Backlog`, `Ready`, `In Progress`, `Needs Validation`, `Ready to Release`, `Done`, `Blocked`, `Deferred`, and `Archived`.
- Updated PM Tools app behavior, validation, tests, UI labels, and methodology docs to use the simplified lifecycle.
- Synced the reusable `docs/_methodology` package into active projects: PM Tools, GeoData, DistrictView, and trading-agent.
- Repaired GeoData PM data after the lifecycle migration by converting `New` to `Backlog` and `Ready for Testing` to `Needs Validation`.
- Verified PM Tools, GeoData, DistrictView, and trading-agent project data through the PM Tools parser. GeoData, PM Tools, and trading-agent validate cleanly; DistrictView remains valid with two release membership warnings.
- Restarted the local PM Tools app server after stale UI behavior was observed.

Recommended next work:

1. Review and commit the PM Tools lifecycle/methodology changes.
2. Decide whether to commit the copied `docs/_methodology` folders in GeoData, DistrictView, and trading-agent.
3. Resolve DistrictView's two release membership warnings for `BUG-0025` and `UI-0028`.
4. Leave GeoData's unrelated generated/data-builder dirty files out of any PM Tools commit.

## Useful Commands

```bash
# Start the app
node app/server.js

# Run tests
cd app
npm test
```
