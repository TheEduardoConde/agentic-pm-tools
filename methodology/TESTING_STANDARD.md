# Testing Standard

Codex must validate implemented functionality against backlog requirements.

## Test Command Source

Project-specific testing commands live at:

```text
./docs/project/TEST_COMMANDS.md
```

Codex must check that file before running tests.

If the file is missing:

- Infer likely commands from `package.json`, `README`, or project structure
- Label inferred commands as inferred
- Recommend creating `./docs/project/TEST_COMMANDS.md`
- Do not treat inferred commands as permanent standards until approved

## Evidence Rule

Codex must not claim tests passed without evidence.

Record:

- Command run
- Result
- Relevant output
- Skipped tests
- Known limitations

## Testing Loop

Codex must automatically test implemented functionality against the backlog requirements. If tests fail, Codex must fix and rerun tests until the requirement passes or a legitimate blocker is reached.

Legitimate blockers include:

- Missing credentials
- Unavailable external service
- Missing environment setup
- Unclear requirement
- Scope decision needed from Eddie

## Status Outcomes

After Codex finishes:

- `Development Complete`: code is written, but automated tests were not completed or could not confirm the requirement
- `Blocked` or `Changes Requested`: automated tests fail and Codex cannot fix without guidance
- `Ready for Testing`: automated tests pass, but human testing is required
- `Ready to Deploy`: automated tests pass and human testing is not applicable
- `Passed Testing`: human testing was required and Eddie approved it
- `Deployed`: release, version-control, or deployment action is completed
