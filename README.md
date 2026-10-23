# aether-ai-api

> **Status: Initial API error/request-metadata contracts in review.** No product routes, authentication middleware, domain orchestration, or production deployment are implemented.

## Purpose

Application backend and stable product API for identity-aware users, conversations, runs, files, usage, and admin operations.

## Responsibility boundary

Product API/BFF; validates identity and permissions and delegates domain work.

## Dependencies

aether-ai-auth, aether-ai-gateway, aether-ai-orchestration, aether-ai-files, aether-ai-knowledge, aether-ai-billing, aether-ai-security, and aether-ai-observability.

## Project rules

- No implementation starts until the documentation and cross-repository contracts are reviewed.
- Do not commit secrets, API keys, user data, or production credentials.
- Public interfaces, security decisions, and non-obvious implementation choices must be documented.

## Documentation

- [Project specification](docs/PROJECT_SPEC.md)
- [Architecture and connections](docs/ARCHITECTURE.md)
- [Dependencies and contracts](docs/DEPENDENCIES_AND_CONTRACTS.md)
- [Implementation plan and acceptance criteria](docs/IMPLEMENTATION_PLAN.md)
- [Research and license notes](docs/RESEARCH_AND_LICENSES.md)
- [Repository-specific technical design and test plan](docs/TECHNICAL_DESIGN.md)
- [Repository-specific security review checklist](docs/SECURITY_REVIEW.md)
- [Engineering and commenting standard](docs/ENGINEERING_STANDARD.md)
- [Work log and decisions](docs/WORKLOG.md)
- [Master 33-repository catalog](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/REPOSITORY_CATALOG.md)
- [Continuity handoff for new chats](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/WORK_HANDOFF.md)

## Initial implementation

The draft `@aether-ai/api` package provides stable public error codes/messages, HTTP status mapping, retryability metadata, and bounded request/correlation ID validation. It intentionally rejects arbitrary error messages to reduce upstream data leakage. It does not authenticate users, authorize tenants/resources, implement routes, or orchestrate domain services; those remain mandatory and are not replaced by these helpers.

## Before coding

Read the project specification, architecture, contracts, implementation plan, and work log. Update the docs in the same change whenever behavior, an API contract, a dependency, or a security boundary changes.
