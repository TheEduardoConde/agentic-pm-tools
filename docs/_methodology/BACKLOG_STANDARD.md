# Backlog Standard

Backlog items are individual markdown files under `docs/project/backlog/`. Item files are the source of truth.

## LLM Intake

When backlog intake happens through an LLM, clarify before creating cards:

- Business goal and stakeholder
- Current problem or need
- Expected outcome
- Acceptance criteria
- Dependencies and blockers

If the request is broad, propose a split and wait for approval. If clear and low-risk, create the smallest useful card.

## Folder Structure

```text
docs/project/backlog/
  active/       ← Inbox, Ready, In Progress, Review
  completed/    ← Done
  archived/     ← Explicitly archived
  releases/     ← Release files and dispatched work packages
```

Status determines folder location. The `status` field is authoritative; folder is derived on every write.

## Item Types

| Type | Prefix |
|------|--------|
| Feature | FEAT |
| Bug | BUG |
| Enhancement | ENH |
| Refactor | REFA |
| Documentation | DOC |
| Spike | SPIKE |
| Security | SEC |
| Task | TASK |

## Status

| Status | Meaning |
|--------|---------|
| Inbox | Captured, not yet groomed |
| Ready | Groomed and prioritized, next up |
| In Progress | Dispatched in a release — Claude Code is working on it |
| Review | Claude delivered, human reviewing |
| Done | Accepted and closed |

Items move to `completed/` when status becomes Done.

## Priority and Effort

Allowed priorities: `Critical`, `High`, `Medium`, `Low`, `Someday`

Allowed effort: `XS`, `S`, `M`, `L`, `XL`, `Unknown`

## Card Schema (10 fields)

```yaml
---
id: FEAT-0042
type: Feature
title: Add CSV export
status: Ready
priority: High
effort: M
tags: []
blocked_by: []
created: 2026-05-14
updated: 2026-05-14
---
```

## Body Sections

```markdown
## Summary
(required — what this is and why it matters)

## Acceptance Criteria
(required — checklist items Claude Code uses to verify completion)

## Implementation Notes
(optional — technical context, constraints, approach hints)

## Notes
(optional — free-form: links, decisions, scratch)
```

## Readiness Criteria

An item is Ready when:
1. Summary clearly states the problem and outcome
2. Acceptance Criteria are specific and verifiable
3. Effort is estimated
4. No unresolved blockers

## IDs

- Global sequence from `0000` to `9999`
- Do not reuse numbers from deleted or archived items
- IDs are immutable once created

## Release / Dispatch Flow

A **Release** is a named group of backlog items dispatched together as a Claude Code work package.

1. Select items on the Board (checkbox mode)
2. Click "New Release" → name the release
3. Click "Dispatch to Claude Code" on the release detail page
4. The app generates a markdown work package, copies it to the clipboard, and marks all included items "In Progress"
5. Paste the work package into a Claude Code session
6. After review, mark items Done individually

Work packages are saved alongside release files at `backlog/releases/REL-XXXX-work-package.md`.
