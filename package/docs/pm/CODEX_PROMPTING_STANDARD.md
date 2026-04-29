# Codex Prompting Standard

Generated implementation prompts must constrain scope, testing, backlog updates, completion reporting, and version-control behavior.

## Required Scope Rule

Every generated Codex implementation prompt must include:

```text
Do not redesign, refactor, restructure, or expand scope unless the backlog item explicitly requires it. If you believe redesign, refactor, restructuring, or scope expansion is necessary, stop and ask Eddie first.
```

## Required Testing Rule

Every generated prompt must include:

```text
Read ./docs/project/TEST_COMMANDS.md before running tests. Run the required commands when applicable. If the file is missing, infer likely commands, label them as inferred, and recommend creating TEST_COMMANDS.md.
```

## Required Backlog Rule

Every generated prompt must include:

```text
Update related backlog item files with status, lifecycle dates, implementation notes, testing notes, changed files, and links when applicable.
```

## Required Completion Rule

Every generated prompt must include:

```text
After implementation, provide an Agent Completion Report.
```

## Required Version-Control Rule

Every generated prompt must include:

```text
Do not commit, push, merge, rebase, force push, deploy, or create a release without Eddie's explicit approval.
```

## Item-Level Prompt Behavior

The item-level prompt must:

- Read one backlog item
- Implement only that item
- Validate acceptance criteria
- Update that item
- Provide an Agent Completion Report

## Release-Level Prompt Behavior

The release-level prompt must:

- Read the release file
- Read included backlog item files
- Implement all included items
- Validate acceptance criteria
- Update each item
- Update release file summary, prompt, and checklist as needed
- Provide an Agent Completion Report
- Stop before version-control actions
