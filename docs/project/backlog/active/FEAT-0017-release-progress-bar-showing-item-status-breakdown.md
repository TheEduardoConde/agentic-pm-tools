---
id: FEAT-0017
type: Feature
prefix: FEAT
number: 0017
title: Release progress bar showing item status breakdown
status: Needs Validation
priority: Medium
effort: S
release: Unassigned
tags: []
blocks: []
blocked_by: []
sprint:
created: 2026-04-29
developed: 2026-05-06
updated: 2026-05-06
tested:
deployed:
archived:
archive_reason:
deferred:
defer_reason:
---

# FEAT-0017: Release progress bar showing item status breakdown

## User Story



## Summary

Add a horizontal progress bar to the release detail panel that visualizes the distribution of included items by lifecycle stage (Planning, Build, Test, Done). No charting library required — pure CSS segments using existing data.

## Problem / Need

The release detail panel lists items in a table but gives no at-a-glance sense of release health or completeness. A simple progress bar makes it immediately obvious how many items are done vs. in flight vs. not started.

## Expected Outcome

The release detail panel shows a segmented horizontal bar above the items table. Each segment represents a lifecycle group (e.g., Not Started in gray, In Progress in blue, In Testing in yellow, Done in green) with item counts. A legend identifies each segment.

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [x] The release detail panel shows a segmented progress bar for releases with at least one item.
- [x] Segments correspond to the simplified lifecycle groups: Intake (`Backlog`, `Ready`), Build (`In Progress`, `Blocked`), Validation (`Needs Validation`, `Ready to Release`), Closed (`Done`, `Deferred`, `Archived`).
- [x] Each segment shows a count and percentage.
- [x] The bar updates when items are added or their status changes.
- [x] An empty release shows no bar or a placeholder.

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

- 2026-05-06T15:44:24.577Z - Status changed from New to Development Complete.
- 2026-05-06T15:44:24.607Z - Status changed from Development Complete to Ready for Testing.

## Links

- None.
