# Version Control Standard

Agents may prepare version-control work, but Eddie must approve execution.

## Agents May

- Inspect Git status
- Summarize changed files
- Identify unrelated changes
- Check for secrets
- Prepare commit messages
- Prepare Git commands
- Prepare PR title and body
- Recommend next steps

## Agents Must Not Without Approval

- Commit
- Push
- Merge
- Rebase
- Force push
- Deploy
- Create or update production releases

## Approval Package

Before asking approval, present:

1. Current branch
2. Changed files
3. Files proposed for commit
4. Files excluded from commit
5. Test commands run and results
6. Backlog items included
7. Proposed commit message
8. Proposed push or PR command/workflow
9. Risks, skipped tests, or warnings

## Commit Strategy

Allowed strategies:

1. One commit per backlog item, when work is large or logically separate.
2. One release commit, when the release contains a small or coherent group of related items.

Commit body must list every included backlog item ID.

Default guidance:

- Small release: one release commit
- Large release: multiple commits grouped by logical scope
- Complex or risky item: one dedicated commit

## Example Release Commit

```text
feat: deliver release v0.2.0

Backlog items:
- FEAT-0001: Add release assignment flow
- BUG-0002: Fix backlog save issue
- TEST-0003: Add regression tests for release prompt generation

Testing:
- npm test, passed
- npm run build, passed
- Human testing plan generated

Notes:
- No push, merge, or deployment performed without approval.
```
