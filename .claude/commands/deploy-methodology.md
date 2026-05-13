Deploy the PM Tools methodology and project scaffold to a target project. The target project folder path is: $ARGUMENTS

Follow these steps exactly:

## 1. Safety gates
- Confirm the current working directory is the PM Tools repo root, not the target project.
- If $ARGUMENTS is empty, ask the user for the target project folder path before continuing.
- Run `git remote -v` in the target folder if it is a git repo. Show the remote identity and ask the user to confirm it is the correct target before making any changes.
- Run `git status --short` in the target folder. Identify any uncommitted user work. Do not overwrite, reset, or delete uncommitted changes.

## 2. Detect project state
- Check whether the target folder exists. If it does not exist, offer to create it.
- Check whether the target is a git repo (`git rev-parse --git-dir`). If not, offer to run `git init`.
- Check whether `docs/_methodology/` already exists in the target. Note if this is a first deploy or an update.
- Check whether `docs/project/` already exists. Note which required subfolders and files are missing.

## 3. Copy methodology (always overwrite)
Copy from PM Tools into the target, overwriting any existing versions:
- `docs/_methodology/` → target `docs/_methodology/`
- `.claude/commands/` → target `.claude/commands/`

## 4. Scaffold project data (only create missing files — never overwrite existing)
Create missing items only:
- `docs/project/` folder
- `docs/project/backlog/active/`, `completed/`, `deferred/`, `archived/`
- `docs/project/releases/`
- `docs/project/operations/`
- `docs/project/BACKLOG.md` (generated index stub)
- `docs/project/CURRENT_STATE.md` (from template or minimal stub)
- `docs/project/TEST_COMMANDS.md` (stub)
- `docs/project/.pm-meta.json` (empty metadata stub)

## 5. Create CLAUDE.md
If `CLAUDE.md` does not exist in the target root, create a minimal one describing:
- Project name (derived from folder name).
- That this project uses the PM Tools methodology.
- How to start the PM Tools app pointed at this project.

## 6. Register in PM Tools
Add the target project's `docs/project` path to `app/pm-tools-config.json` in the PM Tools repo:
- Use the target folder name as the label.
- Assign a random hex color if none is set.
- Do not duplicate if already registered.

## 7. Update deployment runbook
Add or update the target project's entry in `docs/project/operations/multi-project-pm-deployment.md`:
- Add the target path to the Scope section if not present.
- Add the target to the App Registration table if not present.

## 8. Validate
Call `GET /api/validate` via the PM Tools server pointed at the target project and report:
- All errors (must fix).
- All warnings (review).
- Confirmation of clean structure or list of remaining issues.

## 9. Report
Produce a deployment report including:
- Target project path and git remote (if applicable).
- First deploy or update.
- Files and folders created.
- Files overwritten (methodology).
- Files skipped (existing project data).
- App registration status.
- Validation result.
- Recommended next steps for the project owner.
