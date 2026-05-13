# Multi-Project PM Deployment Runbook

This runbook is project-specific to PM Tools. Keep it in this repository under `docs/project/operations/` and do not copy it into target projects or `docs/_methodology`.

## Scope

Use this runbook to deploy the current PM Tools methodology and data conventions into these projects:

- `C:\My Projects\DistrictView`
- `C:\My Projects\DictaFlow_android`
- `C:\My Projects\CardScan`
- `C:\Users\srlob\OneDrive\Documents\My Projects\trading-agent`

For each target project, update all PM folders, backlog item formatting, release files, PM logs, validation metadata, and PM Tools app registration. Do not change product source code unless a target project's PM migration requires a clearly documented, approved local fix.

## Safety Gates

Before changing a target project:

1. Confirm the current working directory is the target project root.
2. Confirm the Git remote identity with `git remote -v` if the target project is a Git repo.
3. Inspect `git status --short` and identify unrelated user work.
4. Do not overwrite, reset, delete, force push, commit, tag, release, or deploy without explicit approval.
5. Work one project at a time and validate before moving to the next project.

## Target PM Folder Layout

Each target project should contain:

```text
docs/
  _methodology/
  project/
    .pm-meta.json
    BACKLOG.md
    CURRENT_STATE.md
    TEST_COMMANDS.md
    backlog/
      active/
      completed/
      deferred/
      archived/
    releases/
```

Rules:

- `docs/_methodology/` is the portable methodology package copied from this repo.
- `docs/project/` is target-project-specific data and must not be overwritten with PM Tools project data.
- Individual backlog item files are the source of truth.
- `docs/project/BACKLOG.md` is a generated index.
- Individual release files under `docs/project/releases/` are the source of truth for releases.

## Deployment Steps

1. Copy or sync `docs/_methodology/` from PM Tools into the target project's `docs/_methodology/`.
2. Create any missing `docs/project/` files and folders from the target layout above.
3. Preserve existing target-project backlog, release, test, decision, and state data.
4. Reformat all backlog item files to the accepted front matter and section structure.
5. Move backlog item files into the correct folder based on status.
6. Reformat all PM logs and history sections to use the accepted lifecycle terms.
7. Reformat release files to the accepted release front matter and section structure.
8. Regenerate `docs/project/BACKLOG.md` from individual backlog item files.
9. Update `.pm-meta.json` with current validation/index timestamps after validation passes.
10. Register the target `docs/project` path in the PM Tools app so it loads automatically.
11. Run PM Tools validation for the target project and resolve all structural errors.

## Backlog Item Format

Each backlog item must use this front matter shape:

```yaml
---
id: FEAT-0001
prefix: FEAT
number: 0001
title: Short title
status: Backlog
priority: Medium
effort: Unknown
release: Unassigned
created: YYYY-MM-DD
developed:
updated: YYYY-MM-DD
tested:
deployed:
archived:
archive_reason:
deferred:
defer_reason:
---
```

Required body sections:

- `# ITEM-0000: Title`
- `## Summary`
- `## Problem / Need`
- `## Expected Outcome`
- `## Acceptance Criteria`
- `## Testing Notes`
- `## Human Testing Plan`
- `## Codex Prompt`
- `## Changed Files`
- `## Links`

Detailed/user-facing cards should also include:

- `## User Story`
- `## Functional Requirements`
- `## Technical Requirements`
- `## Edge Cases`
- `## Implementation Notes`
- `## Owner Review Needed`
- `## Activity`

## Accepted Backlog Statuses

Only these backlog item statuses are accepted:

- `Backlog`
- `Ready`
- `In Progress`
- `Needs Validation`
- `Ready to Release`
- `Done`
- `Blocked`
- `Deferred`
- `Archived`

Folder mapping:

- `active/`: `Backlog`, `Ready`, `In Progress`, `Needs Validation`, `Ready to Release`, `Blocked`
- `completed/`: `Done`
- `deferred/`: `Deferred`
- `archived/`: `Archived`

## Backlog Status Migration Map

Normalize old backlog statuses as follows:

| Old status | New status |
|---|---|
| `New` | `Backlog` |
| `Ready for Development` | `Ready` |
| `Active` | `In Progress` |
| `In Development` | `In Progress` |
| `Development Complete` | `Needs Validation` |
| `Ready for Testing` | `Needs Validation` |
| `Testing` | `Needs Validation` |
| `Ready for Human Testing` | `Needs Validation` |
| `Ready to Deploy` | `Ready to Release` |
| `Deployed` | `Done` |
| `Released` | `Done` |

When migrating status history, preserve the original chronology but rewrite activity lines to the new status vocabulary. If preserving old labels is useful, place them in a migration note rather than leaving old statuses as active lifecycle terms.

Preferred activity format:

```text
## Activity

- 2026-05-08T16:00:00.000Z - Status changed from Backlog to Needs Validation.
- 2026-05-08T16:00:00.000Z - Migration note: original status labels were `New` to `Development Complete`.
```

## Release File Format

Each release file must use this front matter shape:

```yaml
---
id: v0.1.0
title: Release v0.1.0
status: Planning
created: YYYY-MM-DD
developed:
tested:
deployed:
---
```

Required body sections:

- `# Release v0.1.0`
- `## Goal`
- `## Included Backlog Items`
- `## Release Status Summary`
- `## Codex Development Prompt`
- `## Human Testing Checklist`
- `## Version-Control Prompt`
- `## Release Notes`

Accepted release statuses:

- `Planning`
- `In Progress`
- `Needs Validation`
- `Ready to Release`
- `Released`
- `Blocked`
- `Cancelled`

## Release Status Migration Map

Normalize old release statuses as follows:

| Old status | New status |
|---|---|
| `Active` | `In Progress` |
| `Ready for Development` | `Planning` |
| `In Development` | `In Progress` |
| `Development Complete` | `Needs Validation` |
| `Testing` | `Needs Validation` |
| `Ready for Human Testing` | `Needs Validation` |
| `Ready to Deploy` | `Ready to Release` |
| `Deployed` | `Released` |

Release readiness should be derived from included backlog items:

- If all included items are `Ready to Release` or `Done`, the release can be `Ready to Release`.
- If any included item is `Needs Validation`, the release should remain `Needs Validation`.
- If any included item is `Blocked`, the release should be `Blocked`.

## Log Refactoring

Refactor all PM history artifacts, not just front matter.

Backlog item `## Activity` sections:

- Preserve chronological order.
- Rewrite old lifecycle names to accepted statuses.
- Keep status-change lines concise and machine-readable.
- Add a migration note if old labels need to remain auditable.

`TEST_LOG.md`, if present:

- Group entries by date.
- Record scope, command or check, result, relevant output, skipped tests, and limitations.
- Use `Needs Validation`, `Ready to Release`, and `Done` consistently.

`DECISION_LOG.md`, if present:

- Group entries by date.
- Record decision, context, options considered, outcome, owner, and follow-up.
- Remove obsolete lifecycle wording unless quoted in a migration note.

Release files:

- Normalize release status and status summaries.
- Keep release notes user-facing.
- Keep changed-file details in backlog items, not release files.

`CURRENT_STATE.md`:

- Update product snapshot, what works, known gaps, and next work.
- Remove stale lifecycle terms or explain them as historical migration notes.

## App Registration

PM Tools loads projects from `app/pm-tools-config.json`. Register each target by its `docs/project` path, not the repository root.

Target registrations:

| Label | Project path |
|---|---|
| `DistrictView` | `C:\My Projects\DistrictView\docs\project` |
| `DictaFlow Android` | `C:\My Projects\DictaFlow_android\docs\project` |
| `CardScan` | `C:\My Projects\CardScan\docs\project` |
| `trading-agent` | `C:\Users\srlob\OneDrive\Documents\My Projects\trading-agent\docs\project` |

Preferred registration method:

1. Start PM Tools with `node app/server.js`.
2. Open the Project Registry in the app.
3. Add or update each project using the target `docs/project` path.
4. Use the app's project analysis before saving.
5. Confirm each registered project appears in the project switcher and loads backlog/release data.

Manual config edits are acceptable only when the app UI is unavailable. Preserve existing project IDs when updating existing records.

## Validation

For each target project:

1. Run PM Tools project analysis during registration.
2. Run backlog validation from the app.
3. Fix all `Error` findings.
4. Resolve safe mechanical warnings, including wrong-folder placement and stale `BACKLOG.md`.
5. Document any accepted warnings in the target project's `CURRENT_STATE.md`.
6. Confirm the project appears in the app switcher and loads without structural errors.

After PM Tools app files or methodology files are changed in this repo, run:

```bash
cd app
npm test
```

For target-project product code changes, follow that target project's `docs/project/TEST_COMMANDS.md`. If no test command file exists, create one during migration and label any inferred command until confirmed.

## Completion Report

For each migrated target project, report:

- Target project path.
- Git remote identity, if applicable.
- Files and folders changed.
- Backlog items reformatted.
- Releases reformatted.
- Logs refactored.
- Status mappings applied.
- App registration status.
- Validation command/check and result.
- Remaining warnings or required owner approvals.
- Commit/push status, only if explicitly approved.
