---
id: ENH-0012
type: Enhancement
prefix: ENH
number: 0012
title: Full-text search across backlog item body content
status: Ready to Release
priority: Medium
effort: M
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

# ENH-0012: Full-text search across backlog item body content

## User Story



## Summary

The current search bar only matches against item title and ID. Add a server-side full-text search endpoint so users can find items by content in their Summary, Acceptance Criteria, Problem, or any other section.

## Problem / Need

As a backlog grows, users often remember a detail from an item's description but not its title or ID. Title-only search forces them to scroll through many results manually.

## Expected Outcome

The search bar (or a dedicated "full-text" toggle) sends the query to a new server endpoint that scans item body content using Node's `fs.readFile` and returns matching items with a highlighted excerpt.

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [x] A full-text search mode or toggle is available in the backlog view.
- [x] The server endpoint `GET /api/backlog/search?q=...` returns items whose body contains the query string (case-insensitive).
- [x] Results include a short excerpt showing the match in context.
- [x] Search is scoped to the active project.
- [x] Results load within 2 seconds for a backlog of 200 items.

## Edge Cases



## Implementation Notes

Implemented in the large backlog delivery pass on 2026-05-06. The pass added status workflow acceleration, quick add, keyboard shortcuts, validation safe fixes, full-text search, dependency/tag/sprint metadata, activity notes, release progress and effort summaries, CSV export, roadmap and sprint views, and dark mode support as applicable to this item.

## Testing Notes

Automated validation: npm test from app/ passed (93/93) on 2026-05-11. Partial code-level verification completed:
- AC2 (PASSED via test): "searchBacklogItems returns body matches with excerpts" passes — `GET /api/backlog/search?q=...` returns matching items case-insensitively.
- AC3 (PASSED via test): Same test confirms `excerpt` field is present and contains the matched phrase.
- AC4 (PASSED via code): `searchBacklogItems` in server.js scans `readBacklogItems(projectPath)` — search is scoped to the active project path.
- AC1 (REQUIRES BROWSER): Full-text search toggle visibility in the backlog view requires UI inspection.
- AC5 (REQUIRES BROWSER): 2-second performance threshold with 200 items requires a live test run.

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

- 2026-05-06T15:44:24.280Z - Status changed from New to Development Complete.
- 2026-05-06T15:44:24.316Z - Status changed from Development Complete to Ready for Testing.
- 2026-05-13T20:38:48.376Z - Status changed from Needs Validation to Ready to Release.

## Links

- None.
