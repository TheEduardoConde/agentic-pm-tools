# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the `app/` directory:

```bash
npm start          # Start the local web app (serves on localhost)
npm test           # Run the test suite (also aliased as npm check)
```

To point the app at a specific project:
```bash
node server.js --project ../docs/project
# or via env var: PM_TOOLS_PROJECT_PATH=../docs/project node server.js
```

To run a single test: the test file is `app/test/readBacklog.test.js` — add a focused call inside it or run the file directly with `node test/readBacklog.test.js`.

## Architecture

**Agentic PM Tools** is a portable, markdown-based project management system for teams working with human developers and AI coding agents. No build toolchain, no external dependencies, no TypeScript — pure Node.js and vanilla browser JavaScript.

### Three-layer structure

- **`app/`** — Local web app (Node.js HTTP server + single-page frontend)
- **`docs/_methodology/`** — Read-only, reusable PM methodology: standards, LLM prompts, templates. Designed to be copied into any software project once.
- **`docs/project/`** — Project-specific working data: backlog items, releases, test logs, decisions. This is what the app reads and writes.

### Backend: `app/server.js`

Single-file HTTP server (~1000 lines). Key responsibilities:

- **Markdown parsing**: `parseFrontMatter()` and `parseBodySections()` extract YAML metadata and named sections from backlog item `.md` files
- **Backlog CRUD**: Read/write items from `docs/project/backlog/{active|completed|deferred|archived}/`
- **Validation**: `validateBacklog()` checks duplicate IDs, required fields, status/folder alignment, release references, date formats
- **Release management**: Reads release files, generates release planning views
- **Config**: Manages `pm-tools-config.json` for saved projects and active project state
- **Sequence numbering**: Scans all folders globally to assign the next item ID

**Key enums** (defined as constants in server.js):
- Status: `Backlog`, `Ready`, `In Progress`, `Needs Validation`, `Ready to Release`, `Done`, `Blocked`, `Deferred`, `Archived`
- Priority: `Critical`, `High`, `Medium`, `Low`, `Someday`, `Parking Lot`
- Effort: `XS`, `S`, `M`, `L`, `XL`, `Unknown`
- Item type prefixes: `FEAT`, `BUG`, `ENH`, `ARCH`, `AI`, etc. (20+ types)

### Frontend: `app/src/app.js`

Single-file SPA (~3500 lines), loaded as an ES module. Views are rendered by switching section visibility; no client-side router. Key views:

- **Dashboard** — Summary counts, recent activity, attention panels (blocked, needs validation, ready to release)
- **Status Board** — Kanban grouped by status
- **Backlog Manager** — Table with filtering, sorting, bulk operations, CSV export
- **Sprint / Roadmap views** — Group items by sprint or release
- **Release Workspace** — Promotable work, per-release item lists
- **Validation** — Runs server-side validation, renders findings
- **Prompt Workspace** — Generates LLM prompts for implementation, release, QA, and version-control workflows
- **Settings** — Project picker, color themes, project structure analysis

### Data format

Each backlog item is a `.md` file with YAML frontmatter + named markdown sections:

```
---
id: FEAT-0013
title: Item dependency and blocking links
status: Backlog
priority: Medium
effort: L
release: v0.3.0
tags: [graph, linking]
---

## Summary
...

## Acceptance Criteria
...
```

Items live in `docs/project/backlog/{active|completed|deferred|archived}/`. Status changes that cross folder boundaries (e.g., `Done` → `completed/`) trigger a file move.

### Tests: `app/test/readBacklog.test.js`

Uses Node's built-in `assert/strict`. No test framework. `makeProjectFixture()` and `makeGitProjectFixture()` create temp directories as test environments. Tests cover parsing, sequence generation, item creation/updates, validation, release management, saved views, and config management.

### Methodology docs: `docs/_methodology/`

- `STARTUP.md` — Entry point for every LLM session; tells the agent which standard to load for the task
- `BACKLOG_STANDARD.md` — Item format, enums, readiness criteria, card-writing guidelines
- `DELIVERY_STANDARD.md` — Implementation, testing, completion reporting, security, version-control approval
- `RELEASE_STANDARD.md` — Release planning, readiness gates, approval workflows
- `prompts/` — Role-specific LLM prompts (developer, QA reviewer, release planner, etc.)
- `templates/` — Markdown templates for backlog items, releases, agent completion reports
