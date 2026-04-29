# Project Structure Standard

This standard separates reusable PM methodology from project-specific execution data.

## Portable Methodology

Reusable standards, prompts, templates, and future PM tooling live under:

```text
./docs/pm/
```

Nothing in this folder may depend on a specific application, business domain, repository name, architecture, deployment target, or backlog.

## Project Data

Project-specific data should live under:

```text
./docs/project/
```

Recommended structure:

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

## Source of Truth

- Individual backlog item files are the source of truth for backlog content.
- `./docs/project/BACKLOG.md` is a generated index.
- Individual release files are the source of truth for release-level planning.
- Project test command standards live in `./docs/project/TEST_COMMANDS.md`.
