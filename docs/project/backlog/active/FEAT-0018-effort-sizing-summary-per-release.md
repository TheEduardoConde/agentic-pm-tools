---
id: FEAT-0018
type: Feature
prefix: FEAT
number: 0018
title: Effort sizing summary per release
status: Ready to Release
priority: Medium
effort: S
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

# FEAT-0018: Effort sizing summary per release

## User Story



## Summary

Display a breakdown of effort sizes (XS, S, M, L, XL, Unknown) for the items included in a release, so planners can assess load at a glance without opening each item.

## Problem / Need

Release planning currently requires opening individual items or the items table to see effort values. There is no summary showing whether a release is overloaded (too many L/XL items) or whether effort estimates are missing (Unknown). This is a standard capacity view in any sprint planner.

## Expected Outcome

The release detail panel shows a compact effort summary below or beside the progress bar. Each effort tier shows a count and optionally a simple icon or chip (XS ×3, S ×5, M ×2, L ×1, Unknown ×2).

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [x] The release detail panel shows an effort breakdown for releases with at least one item.
- [x] Each effort tier (XS, S, M, L, XL, Unknown) shows the count of included items with that effort.
- [x] Tiers with zero items are either hidden or shown as 0.
- [x] The breakdown updates when items are added/removed or their effort changes.

## Edge Cases



## Implementation Notes

Implemented in the large backlog delivery pass on 2026-05-06. The pass added status workflow acceleration, quick add, keyboard shortcuts, validation safe fixes, full-text search, dependency/tag/sprint metadata, activity notes, release progress and effort summaries, CSV export, roadmap and sprint views, and dark mode support as applicable to this item.

## Testing Notes

Automated validation: npm test from app/ passed after implementation. Human testing is still required for user-facing workflow confirmation.

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

- 2026-05-06T15:44:24.628Z - Status changed from New to Development Complete.
- 2026-05-06T15:44:24.654Z - Status changed from Development Complete to Ready for Testing.
- 2026-05-13T20:38:48.526Z - Status changed from Needs Validation to Ready to Release.

## Links

- None.
