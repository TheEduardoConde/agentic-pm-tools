# Portable Project Management Methodology

`./docs/pm` contains reusable methodology, standards, templates, and prompts for agentic project management. It is designed to be copied into future development projects without carrying project-specific backlog, requirements, test results, release notes, architecture decisions, or secrets.

## Portability Rule

Keep all project-specific working data outside `./docs/pm`. Use `./docs/project/` for the current project's backlog, release files, test commands, logs, decisions, and notes.

Recommended project structure:

```text
./docs/project/
  CURRENT_STATE.md
  BACKLOG.md
  TEST_COMMANDS.md
  REQUIREMENTS.md
  TEST_LOG.md
  DECISION_LOG.md
  RELEASE_NOTES.md
  .pm-meta.json

  backlog/
    active/
    completed/
    deferred/
    archived/

  releases/
```

## How to Use With ChatGPT or Codex

Use these standards to create backlog cards, plan releases, generate Codex implementation prompts, validate work, conduct human QA, prepare security review, and prepare version-control recommendations.

Typical workflow:

1. Capture an idea or problem.
2. Convert it into one or more approved backlog cards.
3. Mark cards `Ready` or assign them to a release as `Planned`.
4. Generate an item-level or release-level Codex prompt.
5. Codex implements only the approved scope.
6. Codex runs or documents automated validation.
7. Human testing is completed when applicable.
8. Codex provides an Agent Completion Report.
9. Version-control action is prepared.
10. Eddie approves any commit, push, PR, merge, deploy, tag, or release action before it happens.

## Standards

Core standards live in the root of this folder, including:

- Backlog structure and lifecycle
- Scrum card writing
- Requirements writing
- Release workflow
- Codex prompting
- Testing
- Human QA
- Security review
- Version control
- Definition of Ready and Done
- Agent Completion Reports

## Templates

Reusable templates live under:

```text
./docs/pm/templates/
```

Use them to create backlog items, releases, test plans, completion reports, security reports, and Codex prompts.

## Prompts

Reusable agent prompts live under:

```text
./docs/pm/prompts/
```

Use them to assign focused roles to ChatGPT, Codex, or other agents.

## Future PM Tools App

The PM Tools app is future scope and is not implemented yet. When built, it must live under:

```text
./docs/pm/app
```

It must be standalone, with its own `package.json`, `npm install`, and `npm start` workflow, and must remain portable across projects.
