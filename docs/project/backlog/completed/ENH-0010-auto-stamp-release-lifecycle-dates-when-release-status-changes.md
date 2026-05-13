---
id: ENH-0010
type: Enhancement
prefix: ENH
number: 0010
title: Auto-stamp release lifecycle dates when release status changes
status: Done
priority: Medium
effort: S
release: v0.2.0
tags: []
blocks: []
blocked_by: []
sprint:
created: 2026-04-29
developed: 2026-05-06
updated: 2026-05-11
tested: 2026-05-11
deployed:
archived:
archive_reason:
deferred:
defer_reason:
---

# ENH-0010: Auto-stamp release lifecycle dates when release status changes

## User Story



## Summary

Backlog items automatically stamp `developed`, `tested`, and `deployed` dates when their status reaches the corresponding lifecycle milestone. Releases have the same date fields (`developed`, `tested`, `deployed`) but they are never auto-stamped — they remain blank unless manually edited in the release file.

## Problem / Need

Release lifecycle dates are currently never set by the app, making them useless for tracking when a release entered each phase. The inconsistency with backlog item auto-stamping is surprising.

## Expected Outcome

When a release's status is changed through the app's release management UI, the corresponding lifecycle date is stamped automatically: `developed` when status becomes Active, `tested` when status becomes Testing, `deployed` when status becomes Released.

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [x] Changing a release status to Active stamps `developed` if it is not already set.
- [x] Changing a release status to Testing stamps `tested` if it is not already set.
- [x] Changing a release status to Released stamps `deployed` if it is not already set.
- [x] Dates are never overwritten once set.
- [x] The release file on disk is updated atomically.

## Edge Cases

## Implementation Notes

Implemented in the large backlog delivery pass on 2026-05-06. The pass added status workflow acceleration, quick add, keyboard shortcuts, validation safe fixes, full-text search, dependency/tag/sprint metadata, activity notes, release progress and effort summaries, CSV export, roadmap and sprint views, and dark mode support as applicable to this item.

## Testing Notes

Automated validation: npm test from app/ passed (93/93 tests). All 5 acceptance criteria verified via dedicated automated test "updateReleaseMetadata stamps release lifecycle dates once" on 2026-05-11:
- AC1: `Active` status stamps `developed` — verified.
- AC2: `Testing` status stamps `tested` — verified.
- AC3: `Released` status stamps `deployed` — verified.
- AC4: Re-setting status does not overwrite existing dates (`testing.release.developed === active.release.developed`) — verified.
- AC5: File write uses same atomic write path as all backlog operations — verified by code inspection.

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

- 2026-05-06T15:44:24.131Z - Status changed from New to Development Complete.
- 2026-05-06T15:44:24.185Z - Status changed from Development Complete to Ready for Testing.

## Links

- None.
