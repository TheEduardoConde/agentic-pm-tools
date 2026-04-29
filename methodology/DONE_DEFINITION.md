# Ready and Done Definitions

## Definition of Ready

A backlog item is Ready only when:

1. The problem or need is clear.
2. The expected outcome is clear.
3. Acceptance criteria are testable.
4. Priority is assigned.
5. Effort is estimated, even if approximate.
6. Dependencies or blockers are noted.
7. The item is small enough to build, or approved as a larger release item.

Codex should not begin normal development from `New` or `Clarifying` unless Eddie explicitly instructs it to do so.

Normal development should start from `Ready` or `Planned` items.

## Definition of Done

A backlog item is done only when:

1. Acceptance criteria are satisfied.
2. Code or documentation changes are complete.
3. Required automated tests were run, or skipped with a clear reason.
4. Human testing plan is completed when applicable.
5. Security check is completed when applicable.
6. Backlog item file is updated.
7. Changed files are recorded in the backlog item file.
8. Agent Completion Report is provided.
9. Version-control recommendation is prepared.
10. Commit, push, PR, merge, or deploy happens only after Eddie approves.

Human testing approval is required only when the Human Testing Plan is applicable.

If Human Testing Plan is not applicable, the item may move to `Ready to Deploy` after automated validation passes, with a written reason.
