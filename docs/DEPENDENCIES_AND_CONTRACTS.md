# Dependencies and contracts — aether-ai-api

**Status:** proposed contract; no API implementation exists yet.

## Contract area

Product REST API/OpenAPI and internal service contracts

## Direct dependencies

auth; gateway for bounded synchronous model requests; orchestration for durable agent runs; files; knowledge; billing entitlement contract; security policy contract; observability. Use only public database/domain contracts where explicitly required; do not import database implementation internals or call agents directly for durable runs.

## Required rules

Define auth context, trusted tenant resolution, per-resource authorization, rate limits, request size, idempotency keys, stable error schema, API versioning and OpenAPI compatibility tests. Durable runs flow API → orchestration → agents; API must not bypass orchestration for durable execution. Any direct gateway request must be bounded and documented separately.

## Contract governance

- The [master catalog](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/REPOSITORY_CATALOG.md) is the canonical dependency map.
- Public REST endpoints require OpenAPI definitions, versioning, stable error codes, and compatibility tests.
- Events require a schema version, event/run ID, timestamp, correlation ID, tenant/principal scope where appropriate, and explicit retry/idempotency semantics.
- Package interfaces must distinguish public stable exports from internal implementation details.
- No service may read another service's private tables or import downstream application internals.
- Any breaking change must include consumer inventory, migration notes, staged rollout/rollback plan, and an update to affected repository specs.
- Provider/model differences must be surfaced as capabilities; do not claim all models support the same features.
- Never expose provider credentials or raw sensitive upstream errors to browsers or ordinary logs.

## Review checklist

- [ ] Inputs, outputs, errors, payload limits, timeout and rate-limit behavior defined.
- [ ] Authentication, authorization, and tenant boundary defined.
- [ ] Retries, cancellation, duplicate requests, and side effects defined.
- [ ] Correlation IDs and redaction rules defined.
- [ ] Unit and contract tests planned.
- [ ] Direct and transitive dependency licenses checked before reuse.
