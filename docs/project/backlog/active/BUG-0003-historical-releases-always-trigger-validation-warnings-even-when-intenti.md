---
id: BUG-0003
type: Bug
prefix: BUG
number: 0003
title: Historical releases always trigger validation warnings even when intentional
status: Needs Validation
priority: Medium
effort: S
release: v0.3.0
created: 2026-04-29
developed: 2026-04-29
updated: 2026-04-29
tested:
deployed:
archived:
archive_reason:
deferred:
defer_reason:
---

# BUG-0003: Historical releases always trigger validation warnings even when intentional

## User Story



## Summary

The app supports "historical" releases with non-semver names (e.g., `release-checklist`, `initial-setup`). When created, they work correctly, but every subsequent validation run flags them as warnings. There is no way to mark a non-semver release as intentional so validation stops warning about it.

## Problem / Need

Projects that legitimately use named milestones or historical reference releases see noisy, repetitive validation warnings they cannot resolve. This erodes trust in the validation results.

## Expected Outcome

Non-semver release names are either explicitly supported without warnings, or the release creation flow prevents non-semver names and removes the ambiguity.

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [ ] A release created with a non-semver name does not produce a validation warning if it was created through the app's release creation flow.
- [x] OR the release creation form rejects non-semver names and the validation warning is reserved for files created outside the app.
- [x] Existing semver releases are unaffected.

## Edge Cases

## Implementation Notes

Implemented in the large backlog delivery pass on 2026-05-06. The pass added status workflow acceleration, quick add, keyboard shortcuts, validation safe fixes, full-text search, dependency/tag/sprint metadata, activity notes, release progress and effort summaries, CSV export, roadmap and sprint views, and dark mode support as applicable to this item.

## Testing Notes

Automated validation: npm test from app/ passed (93/93) on 2026-05-11. Partial code-level verification completed:
- AC2 (PASSED via code): `isValidReleaseVersion` in server.js enforces semver-only format (`/^v\d+\.\d+\.\d+$/`). Non-semver names are rejected at the API level by `assignItemsToRelease`. Test "isValidReleaseVersion validates Unassigned and semantic versions" passes.
- AC3 (PASSED via test): "getReleasePlanner lists historical non-version releases as reference" passes — existing semver releases unaffected.
- AC1 (REQUIRES BROWSER): Whether a non-semver release created through the UI avoids validation warnings requires manual testing in the running app.

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
