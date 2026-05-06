---
id: BUG-0005
type: Bug
prefix: BUG
number: 0005
title: Project color picker value is not surfaced in main UI
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

# BUG-0005: Project color picker value is not surfaced in main UI

## User Story



## Summary

The project registration form includes a color picker, and the color is stored in `pm-tools-config.json`. However, the color is never applied anywhere in the main UI — not on the project picker dropdown, the sidebar, or the header. The feature is invisible to users after registration.

## Problem / Need

Users who configure a color to distinguish between projects get no visual benefit from doing so in the main workflow. The color picker sets an expectation that the color will appear somewhere prominent.

## Expected Outcome

The project color is applied as a visual indicator on the project picker dropdown entry (and optionally a subtle accent in the header or sidebar) so users can immediately identify the active project.

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [x] The project picker dropdown shows each project's color as a swatch next to the label.
- [x] The active project's color is visible somewhere in the header or sidebar.
- [x] Changing a project's color in Settings takes effect without requiring an app restart.

## Edge Cases



## Implementation Notes

Replaced the header's native project select presentation with a project picker button/menu that shows color swatches for each saved project. The active project swatch is visible in the header, and the existing sidebar project color theme continues to update immediately after settings changes.


## Testing Notes

Register two projects with distinct colors, switch between them, and confirm the color indicator updates in the header/picker.

Static UI coverage verifies the header swatch/menu hooks are present.

## Human Testing Plan

Open Settings, edit a project's color, save, and confirm the color swatch appears in the project picker dropdown.

## Owner Review Needed



## Codex Prompt



## Changed Files

- app/index.html
- app/src/app.js
- app/src/styles.css
- app/test/readBacklog.test.js

## Links

- None.
