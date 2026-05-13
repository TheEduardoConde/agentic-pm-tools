---
id: BUG-0001
type: Bug
prefix: BUG
number: 0001
title: archive_reason/defer_reason field naming mismatch between API and front matter
status: Done
priority: Low
effort: XS
release: v0.3.0
created: 2026-04-29
developed: 2026-04-29
updated: 2026-05-11
tested: 2026-05-11
deployed:
archived:
archive_reason:
deferred:
defer_reason:
---

# BUG-0001: archive_reason/defer_reason field naming mismatch between API and front matter

## User Story



## Summary

The edit form sends `archiveReason` and `deferReason` (camelCase) to the server, but the server writes `archive_reason` and `defer_reason` (snake_case) to the front matter. The server correctly translates between the two, but the API contract is inconsistent — one side is camelCase and the other is snake_case with no documented convention.

## Problem / Need

The inconsistency makes the API contract harder to reason about and could cause silent data loss if a future client sends snake_case directly (bypassing the camelCase translation path in the server).

## Expected Outcome

Field names are consistent between the HTTP API payload, the server handler, and the markdown front matter, or the translation is explicitly documented in code.

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [x] The API consistently uses one casing convention for archive/defer reason fields.
- [x] The server handler and front matter writer use the same field names.
- [x] Existing items with `archive_reason` / `defer_reason` in front matter continue to load correctly after the fix.

## Edge Cases

## Implementation Notes

Implemented in the large backlog delivery pass on 2026-05-06. The pass added status workflow acceleration, quick add, keyboard shortcuts, validation safe fixes, full-text search, dependency/tag/sprint metadata, activity notes, release progress and effort summaries, CSV export, roadmap and sprint views, and dark mode support as applicable to this item.

## Testing Notes

Automated validation: npm test from app/ passed (93/93 tests). All 3 acceptance criteria verified via code inspection and automated tests on 2026-05-11:
- AC1: Frontend sends snake_case (`archive_reason`, `defer_reason`) consistently — no camelCase in app.js API calls.
- AC2: server.js normalizes both snake_case and legacy camelCase inputs, writes snake_case to front matter (lines 1201–1208).
- AC3: Legacy camelCase path (`archiveReason` → `archive_reason`) preserved and covered by dedicated test "updateBacklogItem still accepts legacy camelCase archive and defer reasons".

## Human Testing Plan

Human tester should exercise the item acceptance criteria in the running app, including the affected UI workflow and any file updates on disk. Record pass/fail results before deployment.

## Owner Review Needed



## Codex Prompt

## Changed Files

- `app/server.js`
- `app/index.html`
- `app/src/app.js`
- `app/src/styles.css`
- `app/test/readBacklog.test.js`
- `docs/project/TEST_COMMANDS.md`

## Links

- None.
