# Backlog Standard

Backlog items are individual markdown files under `docs/project/backlog/`. Individual item files are the source of truth. `docs/project/BACKLOG.md` is a generated index.

## LLM Intake

When backlog intake happens through an LLM, the LLM acts as a business analyst before creating or changing cards.

Clarify when the request is incomplete, vague, conflicting, risky, or multi-part:

- Business goal
- Stakeholder or user
- Current problem or need
- Expected outcome
- Constraints and non-goals
- Priority or urgency
- Acceptance criteria
- Dependencies, blockers, and impacted systems
- Success evidence or validation method

If the request is broad or multi-part, propose a split and wait for approval before writing cards. If the request is clear and low risk, create the smallest useful card and record assumptions.

## Folder Structure

```text
docs/project/backlog/
  active/
  completed/
  deferred/
  archived/
```

Status determines folder location:

- `active/`: Backlog, Ready, In Progress, Needs Validation, Ready to Release, Blocked
- `completed/`: Done
- `deferred/`: Deferred
- `archived/`: Archived

## IDs And Prefixes

- Use a global sequence from `0000` to `9999`.
- Prefix describes work intent; number sequence is global across prefixes.
- Do not reuse deleted, archived, deferred, or completed numbers.

Core prefixes:

- `FEAT`: feature
- `BUG`: bug fix
- `ENH`: enhancement
- `REQ`: requirement clarification or capture
- `TEST`: testing
- `SEC`: security
- `API`: API or integration
- `DATA`: data
- `OPS`: operations
- `DOC`: documentation
- `ARCH`: architecture
- `REFA`: refactor
- `REL`: release
- `AI`: AI agent behavior
- `PM`: project management

Optional prefixes: `UX`, `UI`, `PERF`, `RISK`, `SPIKE`.

## Status, Priority, And Effort

Allowed statuses:

- Backlog
- Ready
- In Progress
- Needs Validation
- Ready to Release
- Done
- Blocked
- Deferred
- Archived

Allowed priorities: Critical, High, Medium, Low, Someday, Parking Lot.

Allowed effort values: XS, S, M, L, XL, Unknown.

## Card Writing

Start from the need. A good card states what is wrong or valuable, what outcome should exist, and how success will be verified.

Use simple cards for bugs, docs, small changes, refactors, tests, and low-complexity work.

Use detailed cards for user-facing work, complex behavior, workflows, data changes, integrations, or work needing explicit functional requirements.

User stories are required for `FEAT`, `ENH`, `UX`, and `UI`; optional for `API`, `DATA`, `OPS`, and `AI`; usually unnecessary for `BUG`, `TEST`, `SEC`, `DOC`, `ARCH`, `REFA`, `REL`, `PM`, and `SPIKE`.

Functional requirements are required only when needed to make the work clear and testable.

## Acceptance Criteria

Every backlog item must include acceptance criteria.

Write criteria as observable pass/fail statements. Avoid vague quality words without measurable meaning.

Preferred:

```text
- Given an unauthenticated user, when they request a protected route, then the system returns the configured unauthorized response.
```

Avoid:

```text
- Auth should work well.
```

## Definition Of Ready

A backlog item is Ready only when:

1. The problem or need is clear.
2. The expected outcome is clear.
3. Acceptance criteria are testable.
4. Priority is assigned.
5. Effort is estimated, even if approximate.
6. Dependencies or blockers are noted.
7. The item is small enough to build, or explicitly approved as larger work.

Normal implementation should start from `Ready`. Starting from `Backlog` requires explicit requester approval.

## Required Front Matter

```yaml
---
id: FEAT-0001
prefix: FEAT
number: 0001
title: Short title
status: Backlog
priority: Medium
effort: Unknown
release: Unassigned
created: YYYY-MM-DD
developed:
updated: YYYY-MM-DD
tested:
deployed:
archived:
archive_reason:
deferred:
defer_reason:
---
```

Use `release`, not milestone. Release values use app version format such as `v0.1.0`, or `Unassigned`.
