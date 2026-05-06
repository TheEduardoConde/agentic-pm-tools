---
id: BUG-0001
type: Bug
prefix: BUG
number: 0001
title: archive_reason/defer_reason field naming mismatch between API and front matter
status: Ready for Testing
priority: Low
effort: XS
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

# BUG-0001: archive_reason/defer_reason field naming mismatch between API and front matter

## User Story



## Summary

The edit form sends `archiveReason` and `deferReason` (camelCase) to the server, but the server writes `archive_reason` and `defer_reason` (snake_case) to the front matter. The server correctly translates between the two, but the API contract is inconsistent — one side is camelCase and the other is snake_case with no documented convention.

## Problem / Need

The inconsistency makes the API contract harder to reason about and could cause silent data loss if a future client sends snake_case directly (bypassing the camelCase translation path in the server).

## Expected Outcome

Field names are consistent between the HTTP API payload, the server handler, and the markdown front matter, or the translation is explicitly documented in code.

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [x] The API consistently uses one casing convention for archive/defer reason fields.
- [x] The server handler and front matter writer use the same field names.
- [x] Existing items with `archive_reason` / `defer_reason` in front matter continue to load correctly after the fix.

## Edge Cases



## Implementation Notes

Implemented `archive_reason` and `defer_reason` as the canonical edit API payload fields. The server still accepts legacy `archiveReason` and `deferReason` payloads for compatibility, but the form and front matter writer now use the snake_case field names consistently.


## Testing Notes

Verify via the edit modal: archive or defer an item, then reload and confirm the reason persists correctly.

Automated coverage updated for canonical snake_case archive/defer reason payloads and legacy camelCase compatibility.

## Human Testing Plan

Open an item, set status to Archived with a reason, save, reload the page, reopen the item and confirm the archive reason is still shown.

## Owner Review Needed



## Codex Prompt



## Changed Files

- app/src/app.js
- app/server.js
- app/test/readBacklog.test.js

## Links

- None.
