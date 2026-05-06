# Agentic PM Tools

Agentic PM Tools is a portable markdown-based project management toolkit for software projects that use humans and AI coding agents together. It includes reusable PM methodology, backlog and release templates, agent prompts, and a standalone local app for managing project PM files.

## Who It Is For

- Solo developers
- AI-assisted developers
- Codex users
- Small teams
- Project owners who prefer markdown-based PM

## What's Included

- `app/`: standalone local PM Tools app
- `docs/_methodology/`: reusable read-only methodology, standards, templates, and prompts
- `examples/project/`: fake sample project data for trying the app
- `docs/project/`: this repository's project-specific PM data

## Quick Start

```powershell
cd app
npm install
npm start
```

By default, the standalone export reads from:

```text
../examples/project
```

Open the local URL printed by the server.

## Configure a Target Project

You can point the app at another project PM folder with either an environment variable or CLI flag:

```powershell
$env:PM_TOOLS_PROJECT_PATH="C:\path\to\repo\docs\project"
npm start
```

```powershell
npm start -- --project "C:\path\to\repo\docs\project"
```

The target project should follow the structure documented in `docs/_methodology/PORTABILITY_STANDARD.md`.

## Use With Other Projects

The recommended setup is to run this app once and point it at each target repository's PM data folder:

```text
C:\path\to\target-repo\docs\project
```

Each target repository should contain:

```text
docs/
  _methodology/
  project/
```

`docs/_methodology` contains portable read-only methodology, prompts, and templates. `docs/project` contains the target repository's backlog, requirements, test logs, release files, and other project-specific data.

## Initialize an Existing Project

To add the methodology to another repository, copy:

```text
docs/_methodology
```

into the target repository as:

```text
docs/_methodology
```

Then create project-specific working data under:

```text
docs/project
```

Recommended initial structure:

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

## App Mode

Copying the app into every project is optional. The methodology package should not contain app source code; keep the app outside `docs/_methodology` and point it at the target repository's `docs/project` folder.

Do not copy local app state as project methodology. `app/pm-tools-config.json` stores machine-local project paths and should be treated as user-specific configuration.

## Project Folder Standard

See `docs/_methodology/PORTABILITY_STANDARD.md`.

## Backlog Item Format

See `docs/_methodology/BACKLOG_STANDARD.md` and the templates in `docs/_methodology/templates/`.

## Release Workflow

See `docs/_methodology/RELEASE_STANDARD.md`.

## Codex Prompt Workflow

Every LLM session should read `docs/_methodology/STARTUP.md` first, then load task-specific standards and prompts from `docs/_methodology/`.

## Validation Workflow

Validation is manual. The app does not run full backlog validation automatically on load.

## Known Limitations

- Safe-fix validation buttons are future scope.
- Git/version-control actions are never performed by the app.
- The app is a local filesystem tool and should be run only against trusted project folders.
- Desktop layout is the primary target.

## Roadmap

- Safe-fix validation buttons
- Configurable project paths UI
- Dark mode
- Import existing docs wizard
- GitHub issue export
- Installer/copy script
- Packaged desktop app

## License

MIT
