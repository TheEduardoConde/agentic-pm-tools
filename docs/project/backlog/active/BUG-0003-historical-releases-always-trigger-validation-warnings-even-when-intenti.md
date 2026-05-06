---
id: BUG-0003
type: Bug
prefix: BUG
number: 0003
title: Historical releases always trigger validation warnings even when intentional
status: Ready for Testing
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

Confirmed the app follows the second accepted path: release creation rejects non-semver names, preserving validation warnings for non-semver references created outside the app workflow. Existing semver release behavior remains covered by tests.


## Testing Notes

Create a release named `historical-v1`, run validation, confirm no spurious warning appears. Then manually create a file `docs/project/releases/bad name.md` outside the app, run validation, and confirm the warning fires correctly.

Automated coverage already verifies non-semver app release creation is rejected and semver release creation succeeds.

## Human Testing Plan

Create a release through the UI with a non-semver name. Run validation. Confirm no warning is produced for that release.

## Owner Review Needed



## Codex Prompt



## Changed Files

- app/server.js
- app/test/readBacklog.test.js

## Links

- None.
