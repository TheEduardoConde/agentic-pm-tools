# Security Review Standard

Security review is normally recorded as a section inside the Agent Completion Report.

## Separate Security Review Required

A separate Security Review Report is required when:

- Prefix is `SEC`
- Authentication or authorization changes
- Secrets, tokens, API keys, or environment variables are involved
- Payment, trading, financial, or transaction execution behavior changes
- External API integration changes
- User data storage, export, deletion, or permissions change
- Deployment or infrastructure security changes
- Dependency updates with security implications

## Review Topics

When applicable, review:

- Secret exposure
- Authentication and authorization behavior
- Permission boundaries
- Input validation
- Output encoding
- Data retention and deletion
- External API trust boundaries
- Dependency and supply-chain risk
- Deployment and configuration risk

## Outcome Values

- Pass
- Needs Review
- Blocked
- Not Applicable
