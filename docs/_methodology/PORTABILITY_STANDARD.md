# Portability Standard

`docs/_methodology` is a reusable methodology package. It must be safe to copy into any software project without carrying source-project data.

## Allowed Content

- Portable methodology and standards
- Reusable LLM prompts
- Markdown templates
- Generic examples that are clearly placeholders
- Schema definitions, if added later

## Prohibited Content

- Project-specific backlog items, requirements, decisions, release notes, or test results
- Secrets, credentials, tokens, API keys, or environment values
- Machine-local paths or app configuration
- Runtime state
- Repository-specific architecture, deployment, or domain decisions

## Project Data

Project-specific working data belongs outside `docs/_methodology`, normally under:

```text
docs/project/
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

## Source Of Truth

- Individual backlog item files are the source of truth for backlog content.
- `docs/project/BACKLOG.md` is a generated index.
- Individual release files are the source of truth for release planning.
- Project test commands live in `docs/project/TEST_COMMANDS.md`.

## Copy Rule

Before copying or publishing this package, scan `docs/_methodology` and remove project-specific references. Do not copy local app state as methodology.

