---
id: FEAT-0016
type: Feature
prefix: FEAT
number: 0016
title: Item activity log and comments
status: Ready to Release
priority: Low
effort: L
release: Unassigned
tags: []
blocks: []
blocked_by: []
sprint: 
created: 2026-04-29
developed: 2026-05-06
updated: 2026-05-13
tested: 2026-05-13
deployed: 
archived: 
archive_reason: 
deferred: 
defer_reason: 
---

# FEAT-0016: Item activity log and comments

## User Story



## Summary

Append a `## Activity` section to backlog item markdown files that records timestamped status changes and free-text comments. No database required — the log is pure markdown, append-only, and stored in the item file itself.

## Problem / Need

Once a backlog item leaves `Backlog` status, there is no history of what happened to it or why decisions were made. JIRA's activity stream is one of its most-referenced features during retrospectives and audits.

## Expected Outcome

Every status change stamps an entry like `- 2026-04-29: Status changed from Backlog to In Progress.` in the `## Activity` section. Users can also post a free-text note from the item detail modal. The activity log is read-only (append-only) and shown in the item view.

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [x] Status changes append a timestamped entry to `## Activity`.
- [x] The item detail modal includes a "Add note" input that appends a free-text entry to `## Activity`.
- [x] The `## Activity` section is rendered in the item detail view.
- [x] Entries are append-only — existing entries cannot be edited or deleted via the UI.
- [x] The activity section is preserved when items are edited via the edit modal.

## Edge Cases



## Implementation Notes

Implemented in the large backlog delivery pass on 2026-05-06. The pass added status workflow acceleration, quick add, keyboard shortcuts, validation safe fixes, full-text search, dependency/tag/sprint metadata, activity notes, release progress and effort summaries, CSV export, roadmap and sprint views, and dark mode support as applicable to this item.

## Testing Notes

Automated validation: npm test from app/ passed (93/93) on 2026-05-11. Partial code-level verification completed:
- AC1 (PASSED via test): "appendBacklogItemActivity adds an append-only Activity entry" passes — status changes and notes are appended as timestamped markdown entries.
- AC5 (PASSED via test): "updateBacklogItem supports tags dependencies sprint and activity warnings" passes — activity section is preserved through item edits.
- AC2, AC3, AC4 (REQUIRES BROWSER): "Add note" input visibility, `## Activity` section rendering in the detail view, and absence of edit/delete controls require UI inspection in the running app.

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

## Activity

- 2026-05-06T15:44:24.524Z - Status changed from New to Development Complete.
- 2026-05-06T15:44:24.552Z - Status changed from Development Complete to Ready for Testing.
- 2026-05-13T19:20:43.489Z - Note: Test note from automated testing
- 2026-05-13T19:27:28.125Z - Status changed from Needs Validation to Blocked.
- 2026-05-13T19:27:48.072Z - Status changed from Blocked to Needs Validation.
- 2026-05-13T20:38:48.524Z - Status changed from Needs Validation to Ready to Release.

## Links

- None.
