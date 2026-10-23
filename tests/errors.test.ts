import { describe, expect, it } from "vitest";
import { apiErrorHttpStatus, createApiError, validateRequestMetadata } from "../src/index.js";

describe("versioned API error contracts", () => {
  it("returns stable safe messages and retryability metadata", () => {
    expect(createApiError("dependency_unavailable", { requestId: "req-123" })).toEqual({
      schemaVersion: "1",
      error: {
        code: "dependency_unavailable",
        message: "A required dependency is temporarily unavailable.",
        requestId: "req-123",
        retryable: true
      }
    });
    expect(createApiError("internal_error").error.message).not.toContain("stack");
    expect(createApiError("internal_error").error.retryable).toBe(false);
  });

  it("maps error codes to stable HTTP statuses", () => {
    expect(apiErrorHttpStatus("unauthenticated")).toBe(401);
    expect(apiErrorHttpStatus("forbidden")).toBe(403);
    expect(apiErrorHttpStatus("rate_limited")).toBe(429);
    expect(apiErrorHttpStatus("dependency_unavailable")).toBe(503);
  });

  it("does not allow arbitrary messages that could leak upstream details", () => {
    expect(() => createApiError("internal_error", { publicMessage: "secret provider body" })).toThrow();
    expect(() => createApiError("invalid_request", { requestId: "../private" })).toThrow();
  });

  it("requires both bounded request and correlation IDs", () => {
    expect(validateRequestMetadata({ requestId: "req-1", correlationId: "corr-1" })).toEqual({ requestId: "req-1", correlationId: "corr-1" });
    expect(validateRequestMetadata({ requestId: "req-1" })).toBeUndefined();
    expect(validateRequestMetadata({ requestId: "bad id", correlationId: "corr-1" })).toBeUndefined();
  });
});
