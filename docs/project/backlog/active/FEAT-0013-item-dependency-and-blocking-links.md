---
id: FEAT-0013
type: Feature
prefix: FEAT
number: 0013
title: Item dependency and blocking links
status: Ready to Release
priority: Medium
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

# FEAT-0013: Item dependency and blocking links

## User Story



## Summary

Add support for `blocks` and `blocked_by` relationships between backlog items, stored as front matter arrays. Validation should detect broken links. The UI should display dependency info on item detail views and optionally warn when a blocked item is moved to `In Progress`.

## Problem / Need

Complex projects have items that cannot start until other items are complete. Without dependency tracking, the backlog gives no visibility into sequencing constraints. JIRA's "blocks/is blocked by" links are one of its most-used features.

## Expected Outcome

A backlog item's front matter can contain:
```yaml
blocks: [FEAT-0005, BUG-0002]
blocked_by: [FEAT-0001]
```
The item detail view shows these relationships. Validation flags broken links. The lifecycle board optionally shows a chain icon on items with open blockers.

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [x] `blocks` and `blocked_by` are supported front matter arrays.
- [x] The item edit modal allows adding/removing dependency links.
- [x] The item detail view displays linked items with their current status.
- [x] Validation flags references to non-existent item IDs as errors.
- [x] Moving a `blocked_by` item to `In Progress` when the blocker is not `Done` shows a warning.

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

- 2026-05-06T15:44:24.341Z - Status changed from New to Development Complete.
- 2026-05-06T15:44:24.385Z - Status changed from Development Complete to Ready for Testing.
- 2026-05-13T20:38:48.378Z - Status changed from Needs Validation to Ready to Release.

## Links

- None.
