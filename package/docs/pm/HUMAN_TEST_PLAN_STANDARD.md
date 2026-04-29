# Human Test Plan Standard

Human testing validates behavior that automated tests cannot fully prove or where human approval is required.

## Human Testing Is Required When Work Affects

- User behavior
- UI or UX
- Workflow
- API behavior
- Data creation, update, deletion, import, or export
- Security
- Authentication or permissions
- Release readiness
- Automation behavior
- Trading, payments, money movement, or external integrations

## Human Testing May Be Not Applicable When Work Is Low Risk

Human testing may be marked `Not Applicable` when the work is truly internal and low risk:

- Typo fix
- Minor documentation update
- Internal refactor with no behavior change
- Formatting-only change
- Test-only improvement
- Dependency cleanup with passing automated tests

When human testing is not applicable, include a reason.

## Test Plan Contents

A human testing plan should include:

- Scope being tested
- Preconditions or setup
- Step-by-step checks
- Expected result for each check
- Pass/fail recording area
- Notes or evidence links
