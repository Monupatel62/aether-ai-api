# aether-ai-api

**Status:** Initial authenticated chat vertical slice implemented on a feature branch. Production readiness is not claimed.

## Implemented

- [HTTP API source](src/index.js): `GET /health/live`, authenticated `POST /v1/chat/completions`, bounded JSON body, request IDs, generic safe errors, and request/header timeouts.
- [API tests](test/api.test.js): auth rejection, malformed principal, successful gateway call, invalid content type/JSON, oversized payload, unsupported streaming, and safe upstream failure.
- Dependency-free Node.js package with Node 20/22 CI.

## Security and limitations

- The `authenticate` callback must verify credentials and resolve the principal from a trusted server-side source; the request body cannot provide the principal.
- The injected gateway must perform resource/model authorization and provider routing.
- Streaming deliberately returns `501` until a real streaming contract is implemented.
- No identity provider, persistent storage, rate limiter, billing integration, OpenAPI validator, CORS policy, or production deployment has been selected or integrated.
- Do not expose publicly until auth verification, policy enforcement, rate limits, telemetry redaction, and integration/security tests are complete.

## Documentation

- [Repository specification](docs/REPOSITORY_SPECIFICATION.md)
- [Project specification](docs/PROJECT_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Dependencies and contracts](docs/DEPENDENCIES_AND_CONTRACTS.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Security review](docs/SECURITY_REVIEW.md)
- [Master catalog](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/REPOSITORY_CATALOG.md)
