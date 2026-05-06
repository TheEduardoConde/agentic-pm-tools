# Codex Release Prompt

You are working in this repository.

First read:

- `docs/_methodology/STARTUP.md`
- `docs/_methodology/BACKLOG_STANDARD.md`
- `docs/_methodology/DELIVERY_STANDARD.md`
- `docs/_methodology/RELEASE_STANDARD.md`

Read this release file:

```text
./docs/project/releases/v0.1.0.md
```

Then read every included backlog item file.

Implement all and only the backlog items included in the release.

Important scope rule:
Do not redesign, refactor, restructure, or expand scope unless the included backlog items explicitly require it. If scope expansion is necessary, stop and ask the requester.

Testing rule:
Read `./docs/project/TEST_COMMANDS.md` before running tests. Run the required commands when applicable. If the file is missing, infer likely commands, label them as inferred, and recommend creating `TEST_COMMANDS.md`.

Backlog rule:
Update each related backlog item file with status, lifecycle dates, implementation notes, testing notes, changed files, and links when applicable.

Release rule:
Update the release file summary, Codex development prompt, and human testing checklist as needed. Do not duplicate changed files in the release file.

Completion rule:
After implementation, provide an Agent Completion Report.

Version-control rule:
Do not commit, push, merge, rebase, force push, tag, release, or deploy without explicit approval from the project owner or authorized reviewer.
