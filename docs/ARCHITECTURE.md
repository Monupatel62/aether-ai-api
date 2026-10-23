# Architecture: aether-ai-api

**Status:** proposed design, not implemented.

## Role in the system

Owns product-level request validation, authorization enforcement, and API versioning; delegates model and durable job execution to the appropriate contract owner.

## Dependencies

- `aether-ai-auth`: principal/session and authentication contract.
- `aether-ai-gateway`: bounded synchronous model requests only.
- `aether-ai-orchestration`: durable run create/status/cancel/approval operations.
- `aether-ai-files` and `aether-ai-knowledge`: scoped data through public contracts.
- `aether-ai-billing`: read-only entitlement/plan contract; trusted usage events are emitted asynchronously.
- `aether-ai-security`: policy request/decision contract.
- `aether-ai-observability`: redacted telemetry.
- Generated/public database/domain contracts only where explicitly required; no private-table access or dependency on database implementation internals.

The API MUST NOT depend directly on `aether-ai-agents` for durable execution. Orchestration owns durable run state and invokes Agents. Direct API → Gateway calls are a separate bounded synchronous path.

## Data and control flow

1. A user or upstream service initiates an operation through an authenticated, documented boundary.
2. This component validates shape, scope, limits, and required permissions before work begins.
3. It delegates provider-, storage-, identity-, or durable-execution-specific work to the named contract owner rather than copying that responsibility.
4. It emits a correlation/run identifier and structured lifecycle events with sensitive fields redacted.
5. It returns a stable result/error contract; partial, cancelled, timed-out, and retried outcomes are distinguishable.

## Boundary rules

- No circular imports or runtime dependency on downstream consumers.
- Cross-repository communication uses versioned HTTP/OpenAPI, typed package contracts, or documented event envelopes; no direct reads of another service's private tables.
- Secrets remain server-side and are passed only to the component that needs them.
- Treat model output, uploaded files, external connector output, MCP metadata, and workflow definitions as untrusted data.
- Enforce least privilege and tenant isolation at every data access and tool-execution boundary.

## Proposed deployment shape

The first milestone should be a small, testable service/library with one responsibility. Do not split into a separate network service just because a repository exists. Package boundaries and deployment boundaries are different decisions. Prefer a modular runtime first; extract a service only when scaling, isolation, ownership, or operational needs justify it.

## Failure behavior

Document and test timeout, cancellation, retry, duplicate request, dependency outage, malformed upstream response, permission denial, and partial-result cases before production use.

## Diagrams

The master end-to-end component graph lives in [the repository catalog](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/REPOSITORY_CATALOG.md). Keep that graph and this document synchronized whenever a dependency changes.
