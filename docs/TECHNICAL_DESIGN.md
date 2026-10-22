# Technical design — aether-ai-api

**Status:** design proposal; not implemented.

## Role

The API is a backend-for-frontend and product boundary; the frontend never talks to model providers directly.

## Proposed internal structure

Proposed domains: auth context, conversations, model catalog, completions, agent runs, approvals, files, knowledge, usage, admin, health. Define versioned routes and OpenAPI before implementation. Controllers validate DTOs and delegate to services; services use public contracts, not private tables owned by other repos.

## Connections and ownership

API -> auth for identity primitives; API -> gateway for direct model calls; API -> orchestration/agents for run creation/status; API -> files/knowledge for scoped data; usage events -> billing; all requests -> observability with redaction.

## Failure cases to design explicitly

- Invalid or unauthorized input.
- Dependency unavailable or responds with malformed/partial data.
- Timeout, cancellation, duplicate delivery/request, and retry exhaustion.
- Tenant or permission mismatch.
- Sensitive data accidentally entering logs or client-visible errors.

## Verification plan

Contract tests for OpenAPI, tenant isolation, permission denials, payload/rate limits, idempotent run creation, streaming disconnect/cancel, stable error codes, and dependency outage behavior.

## Open decisions

- Final language/framework and packaging model.
- Runtime deployment boundary (repository does not imply a separate service).
- Selected dependency versions and license review.
- Production observability/retention limits and release criteria.

## Change-comment policy

When implementation begins, explain security invariants, state transitions, retry/idempotency constraints, and non-obvious integration behavior in comments. Keep the comment standard at [the project-wide guide](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/ENGINEERING_AND_COMMENTING_STANDARD.md).

## Related docs

- [Project specification](PROJECT_SPEC.md)
- [Architecture](ARCHITECTURE.md)
- [Dependencies and contracts](DEPENDENCIES_AND_CONTRACTS.md)
- [Implementation plan](IMPLEMENTATION_PLAN.md)
- [Research and licenses](RESEARCH_AND_LICENSES.md)
- [Work log](WORKLOG.md)
- [Master repository spec](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/repositories/aether-ai-api.md)
