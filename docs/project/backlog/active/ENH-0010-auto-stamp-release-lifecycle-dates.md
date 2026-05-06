---
id: ENH-0010
type: Enhancement
prefix: ENH
number: 0010
title: Auto-stamp release lifecycle dates when release status changes
status: New
priority: Medium
effort: S
release: v0.2.0
created: 2026-04-29
developed:
updated: 2026-04-29
tested:
deployed:
archived:
archive_reason:
deferred:
defer_reason:
---

# ENH-0010: Auto-stamp release lifecycle dates when release status changes

## Summary

Backlog items automatically stamp `developed`, `tested`, and `deployed` dates when their status reaches the corresponding lifecycle milestone. Releases have the same date fields (`developed`, `tested`, `deployed`) but they are never auto-stamped — they remain blank unless manually edited in the release file.

## Problem / Need

Release lifecycle dates are currently never set by the app, making them useless for tracking when a release entered each phase. The inconsistency with backlog item auto-stamping is surprising.

## Expected Outcome

When a release's status is changed through the app's release management UI, the corresponding lifecycle date is stamped automatically: `developed` when status becomes Active, `tested` when status becomes Testing, `deployed` when status becomes Released.

## Acceptance Criteria

- [ ] Changing a release status to Active stamps `developed` if it is not already set.
- [ ] Changing a release status to Testing stamps `tested` if it is not already set.
- [ ] Changing a release status to Released stamps `deployed` if it is not already set.
- [ ] Dates are never overwritten once set.
- [ ] The release file on disk is updated atomically.

## Testing Notes

Create a release, advance it through Planning → Active → Testing → Released, and confirm the date fields are stamped at each transition.

## Human Testing Plan

Create a release via the Releases Workspace. Change the release status to Active. Open the release `.md` file in a text editor and confirm `developed` is now set to today's date.

## Codex Prompt

## Changed Files

- None yet.

## Links

- None.
