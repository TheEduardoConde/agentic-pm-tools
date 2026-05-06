---
id: BUG-0004
type: Bug
prefix: BUG
number: 0004
title: Prompt Workspace generate button has no loading or error state
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

# BUG-0004: Prompt Workspace generate button has no loading or error state

## User Story



## Summary

Clicking "Generate" in the Prompt Workspace triggers an API call but provides no visual feedback. If the call takes more than a second (large item, slow disk), the button stays active and appears unresponsive. If the call fails, nothing indicates an error — the output area stays empty or stale.

## Problem / Need

Silent failures make users unsure whether they need to retry. Without a loading state, users may click Generate multiple times.

## Expected Outcome

The Generate button shows a loading indicator while the request is in flight, disables itself to prevent double-submits, and displays a visible error message if the request fails.

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [x] The Generate button is disabled and shows a loading state while the API call is pending.
- [x] On success, the prompt output is rendered as normal.
- [x] On failure, an error message is shown in the output area with enough detail to diagnose the problem.
- [x] The button re-enables after the call completes (success or failure).

## Edge Cases



## Implementation Notes

Prompt workspace generation now disables the active Generate/Save button while pending and changes the button text to `Generating...` or `Saving...`. Prompt and checklist generation catch network/API failures and render the error detail in the prompt output area before re-enabling controls.


## Testing Notes

Simulate a server error by temporarily returning a 500 from `POST /api/prompts/generate` and confirm the error is surfaced in the UI.

Static UI coverage verifies the loading-state text is present. Existing prompt generation tests continue to pass.

## Human Testing Plan

Open the Prompt Workspace, select a prompt type and item, click Generate, confirm a loading state is visible, and confirm the output appears (or an error message if the call fails).

## Owner Review Needed



## Codex Prompt



## Changed Files

- app/src/app.js
- app/test/readBacklog.test.js

## Links

- None.
