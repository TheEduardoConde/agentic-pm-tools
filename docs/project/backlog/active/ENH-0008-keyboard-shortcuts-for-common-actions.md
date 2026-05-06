---
id: ENH-0008
type: Enhancement
prefix: ENH
number: 0008
title: Keyboard shortcuts for common backlog actions
status: New
priority: Medium
effort: M
release: Unassigned
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

# ENH-0008: Keyboard shortcuts for common backlog actions

## Summary

Add keyboard shortcuts for the most common backlog operations so power users can navigate and triage without reaching for the mouse.

## Problem / Need

The current UI is entirely pointer-driven. Triaging a backlog — opening items, changing status, navigating between rows — requires many clicks. JIRA and Linear both offer keyboard navigation as a core productivity feature.

## Expected Outcome

A defined set of keyboard shortcuts is available and discoverable via a help overlay (`?`). At minimum: navigate rows with arrow keys, open the focused item with `Enter` or `O`, change status with `S`, close modals with `Escape`.

## Acceptance Criteria

- [ ] Arrow keys move focus between rows in the backlog table.
- [ ] `Enter` or `O` opens the focused item's detail modal.
- [ ] `S` opens the inline status picker for the focused row.
- [ ] `Escape` closes any open modal or picker.
- [ ] `?` opens a keyboard shortcut help overlay listing all available shortcuts.
- [ ] Shortcuts do not fire when focus is inside a text input or textarea.

## Testing Notes

Test each shortcut in sequence. Confirm shortcuts are disabled when typing in the search box or item description fields.

## Human Testing Plan

Load the backlog. Press the down arrow to move row focus, press `O` to open the item, press `Escape` to close. Press `?` and confirm the help overlay appears.

## Codex Prompt

## Changed Files

- None yet.

## Links

- None.
