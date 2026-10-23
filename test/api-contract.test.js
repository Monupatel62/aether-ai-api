import test from "node:test";
import assert from "node:assert/strict";
import { createApiError, validateRequestContext, validateIdempotencyKey, validatePagination, getExecutionRoute, getApiSecurityRequirements } from "../src/index.js";

test("creates stable bounded API error envelopes", () => {
  const result = createApiError({ code: "RATE_LIMITED", message: "Try again later", status: 429, retryable: true, details: { limit: 20, token: "must-not-leak", "bad key": "drop" } });
  assert.equal(result.error.code, "RATE_LIMITED");
  assert.equal(result.error.retryable, true);
  assert.deepEqual(result.error.details, { limit: 20 });
  assert.throws(() => createApiError({ code: "UNKNOWN", message: "x", status: 400 }), /unsupported/);
  assert.throws(() => createApiError({ code: "INVALID_REQUEST", message: "x", status: 200 }), /HTTP error/);
});

test("requires request and correlation identifiers without trusting client authority", () => {
  const context = validateRequestContext({ requestId: "req-123", correlationId: "corr-123", tenantId: "tenant-a" });
  assert.equal(context.apiVersion, "v1");
  assert.equal(context.tenantId, "tenant-a");
  assert.throws(() => validateRequestContext({ requestId: "req-123" }), /correlationId/);
  assert.throws(() => validateRequestContext({ requestId: "req-123", correlationId: "corr", tenantId: "bad tenant" }), /tenantId/);
});

test("validates idempotency keys and pagination bounds", () => {
  assert.equal(validateIdempotencyKey("request-key-123"), "request-key-123");
  assert.throws(() => validateIdempotencyKey("short"), /8-128/);
  assert.deepEqual(validatePagination({ limit: 25, cursor: "opaque-cursor" }), { limit: 25, cursor: "opaque-cursor" });
  assert.throws(() => validatePagination({ limit: 101 }), /between 1 and 100/);
  assert.throws(() => validatePagination({ cursor: "bad\nvalue" }), /opaque token/);
});

test("routes durable lifecycle through orchestration", () => {
  assert.equal(getExecutionRoute({ durable: true }).owner, "aether-ai-orchestration");
  assert.equal(getExecutionRoute({ durable: false }).owner, "aether-ai-gateway");
});

test("security contract requires authorization per action and rejects client authority", () => {
  const policy = getApiSecurityRequirements();
  assert.equal(policy.authorizeEachResourceAction, true);
  assert.equal(policy.trustClientWorkspaceHeaders, false);
});
