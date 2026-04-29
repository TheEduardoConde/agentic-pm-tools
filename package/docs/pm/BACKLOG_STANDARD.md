# Backlog Standard

Backlog items are individual markdown files. Individual files are the source of truth. The generated backlog index is:

```text
./docs/project/BACKLOG.md
```

`BACKLOG.md` is generated from individual backlog item files and must not be treated as the source of truth.

## Folder Structure

```text
./docs/project/backlog/
  active/
  completed/
  deferred/
  archived/
```

Status determines folder location. The future PM Tools app should move files automatically when status changes.

## Folder Rules

`active/` contains:

- New
- Clarifying
- Ready
- Planned
- In Development
- Development Complete
- Needs Review
- Changes Requested
- Ready for Testing
- In Testing
- Failed Testing
- Passed Testing
- Ready to Deploy
- Blocked

`completed/` contains:

- Deployed

`deferred/` contains:

- Deferred

`archived/` contains:

- Archived
- Rejected
- Duplicate

## IDs

- Use a global sequence from `0000` to `9999`.
- Prefix determines item intention.
- Number sequence is global across all prefixes.
- Do not reuse deleted, archived, deferred, or completed numbers.

Examples:

```text
FEAT-0001
BUG-0002
TEST-0003
```

## Prefixes

Core prefixes:

- `FEAT`: Feature
- `BUG`: Bug fix
- `ENH`: Enhancement
- `REQ`: Requirement
- `TEST`: Testing
- `SEC`: Security
- `API`: API or integration
- `DATA`: Data
- `OPS`: Operations
- `DOC`: Documentation
- `ARCH`: Architecture
- `REFA`: Refactor
- `REL`: Release
- `AI`: AI agent behavior
- `PM`: Project management

Optional supported prefixes:

- `UX`: User experience
- `UI`: Interface polish
- `PERF`: Performance
- `RISK`: Risk
- `SPIKE`: Research spike

## Status Values

- New
- Clarifying
- Ready
- Planned
- In Development
- Development Complete
- Needs Review
- Changes Requested
- Ready for Testing
- In Testing
- Failed Testing
- Passed Testing
- Ready to Deploy
- Deployed
- Blocked
- Deferred
- Rejected
- Duplicate
- Archived

## Priority Values

- Critical
- High
- Medium
- Low
- Someday
- Parking Lot

## Effort Values

- XS
- S
- M
- L
- XL
- Unknown

## Required Lifecycle Dates

Every backlog item supports these lifecycle fields:

- `created`
- `developed`
- `updated`
- `tested`
- `deployed`

Archival and deferral fields:

- `archived`
- `archive_reason`
- `deferred`
- `defer_reason`

Do not include owner or agent fields. Status indicates workflow stage.

## Release Field

Use `release`, not milestone.

Examples:

```yaml
release: Unassigned
release: v0.1.0
release: v0.2.0
release: v1.0.0
```

Release values use app version format.

## Required Front Matter

```yaml
---
id: FEAT-0001
prefix: FEAT
number: 0001
title: Short title
status: New
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
