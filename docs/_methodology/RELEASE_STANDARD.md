# Release Standard

Releases group approved backlog items into a deployable or publishable change set.

## Release Files

Project-specific release files live under:

```text
docs/project/releases/
```

Release IDs use app version format such as `v0.1.0`, `v0.2.0`, or `v1.0.0`.

## Required Contents

Release files should contain release-level information only:

- Release ID
- Title
- Status
- Created, developed, tested, and deployed dates
- Goal
- Included backlog item IDs
- Release status summary
- Development prompt when generated
- Human testing checklist when applicable
- Version-control prompt or recommendation when generated
- Release notes

Do not duplicate changed files in release files. Changed files belong in individual backlog item files.

## Front Matter

```yaml
---
id: v0.1.0
title: Release v0.1.0
status: Planning
created: YYYY-MM-DD
developed:
tested:
deployed:
---
```

## Status Values

- Planning
- In Progress
- Needs Validation
- Ready to Release
- Released
- Blocked
- Cancelled

## Readiness

A release can move to `Ready to Release` only when every included backlog item is in this backlog item status:

- `Ready to Release`: item passed automated validation and any required human, owner, security, policy, or release evidence review is complete.

A release can move to `Released` only after the approved version-control, deployment, publication, tag, or external release action is complete.

## Approval Gates

Gate 1, Approve Release Readiness: confirms release work is functionally acceptable.

Gate 2, Approve Version-Control or Deployment Action: confirms the exact Git, release, tag, deploy, or publish action to execute.

Agents may prepare release and version-control actions, but must not execute commit, push, PR, merge, deploy, release, tag, rebase, or force-push actions without explicit approval.
