# aether-ai-api

> **Status: Documentation phase.** No application code or production deployment has been started in this repository.

## Purpose

Application backend and stable product API for identity-aware users, conversations, runs, files, usage, and admin operations.

## Responsibility boundary

Product API/BFF; validates identity and permissions and delegates domain work.

## Dependencies

aether-ai-auth, aether-ai-gateway, aether-ai-agents, aether-ai-files, aether-ai-database, aether-ai-observability.

## Project rules

- Keep WoHoTech separate; this repository belongs to the new Aether AI project.
- Treat the existing [WoHo AI DevKit](https://github.com/Monupatel62/woho-ai-devkit) as a separate dependency. Do not copy or rewrite it without a reviewed technical reason.
- No implementation starts until the documentation and cross-repository contracts are reviewed.
- Do not commit secrets, API keys, user data, or production credentials.
- Public interfaces, security decisions, and non-obvious implementation choices must be documented.

## Documentation

- [Project specification](docs/PROJECT_SPEC.md)
- [Architecture and connections](docs/ARCHITECTURE.md)
- [Dependencies and contracts](docs/DEPENDENCIES_AND_CONTRACTS.md)
- [Implementation plan and acceptance criteria](docs/IMPLEMENTATION_PLAN.md)
- [Research and license notes](docs/RESEARCH_AND_LICENSES.md)
- [Work log and decisions](docs/WORKLOG.md)
- [Master 33-repository catalog](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/REPOSITORY_CATALOG.md)

## Before coding

Read the project specification, architecture, contracts, implementation plan, and work log. Update the docs in the same change whenever behavior, an API contract, a dependency, or a security boundary changes.
