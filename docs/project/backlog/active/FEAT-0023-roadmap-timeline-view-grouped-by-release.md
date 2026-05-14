---
id: FEAT-0023
type: Feature
prefix: FEAT
number: 0023
title: Roadmap timeline view grouped by release
status: Ready to Release
priority: Low
effort: XL
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

# FEAT-0023: Roadmap timeline view grouped by release

## User Story



## Summary

Add a read-only roadmap view that lays out releases horizontally by version, with items grouped under each release, sorted by priority. No dates or Gantt bars — just a clean columnar layout for discussing scope and sequencing with stakeholders.

## Problem / Need

The current Releases Workspace shows one release at a time. There is no view that shows the full release plan at once — which items are in v0.2.0, v0.3.0, v1.0.0, and Unassigned — in a single scannable layout. Product roadmap views in JIRA, Linear, and Aha! address this.

## Expected Outcome

A Roadmap view in the sidebar shows all releases as columns (or stacked cards), ordered by semver, with Unassigned at the end. Items in each release are listed by priority. The view is read-only (clicking an item opens its detail modal). Print-friendly CSS is a bonus.

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [x] A Roadmap view is accessible from the app sidebar.
- [x] All releases appear as columns or stacked panels ordered by semver.
- [x] Items in each release are listed ordered by priority (Critical → Parking Lot).
- [x] Unassigned items appear in a final "Unassigned" column.
- [x] Clicking an item opens the item detail modal.
- [x] The view updates when items are assigned to or removed from releases.

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

- 2026-05-06T15:44:24.794Z - Status changed from New to Development Complete.
- 2026-05-06T15:44:24.826Z - Status changed from Development Complete to Ready for Testing.
- 2026-05-13T19:27:28.179Z - Status changed from Needs Validation to Blocked.
- 2026-05-13T19:27:48.068Z - Status changed from Blocked to Needs Validation.
- 2026-05-13T20:38:48.611Z - Status changed from Needs Validation to Ready to Release.

## Links

- None.
