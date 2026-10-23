export const API_CONTRACT_VERSION = "1.0";
export const API_VERSION = "v1";

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const IDEMPOTENCY_RE = /^[A-Za-z0-9._:-]{8,128}$/;
const CORRELATION_RE = /^[A-Za-z0-9._:-]{1,128}$/;

export const API_ERROR_CODES = Object.freeze([
  "AUTHENTICATION_REQUIRED",
  "FORBIDDEN",
  "RESOURCE_NOT_FOUND",
  "INVALID_REQUEST",
  "PAYLOAD_TOO_LARGE",
  "RATE_LIMITED",
  "IDEMPOTENCY_CONFLICT",
  "DEPENDENCY_UNAVAILABLE",
  "REQUEST_TIMEOUT",
  "INTERNAL_ERROR",
]);

export function createApiError({ code, message, status, retryable = false, details } = {}) {
  if (!API_ERROR_CODES.includes(code)) throw new TypeError("unsupported API error code");
  if (typeof message !== "string" || !message.trim() || message.length > 500) throw new TypeError("message must be a non-empty string of at most 500 characters");
  if (!Number.isInteger(status) || status < 400 || status > 599) throw new TypeError("status must be an HTTP error status");
  const safeDetails = details && typeof details === "object" && !Array.isArray(details)
    ? Object.fromEntries(Object.entries(details).filter(([key, value]) => /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(key) && !/(token|secret|password|authorization|cookie|credential|api.?key)/i.test(key) && ["string", "number", "boolean"].includes(typeof value)).slice(0, 20))
    : undefined;
  return Object.freeze({
    contractVersion: API_CONTRACT_VERSION,
    error: Object.freeze({
      code,
      message: message.trim(),
      status,
      retryable: retryable === true,
      ...(safeDetails && Object.keys(safeDetails).length ? { details: Object.freeze(safeDetails) } : {}),
    }),
  });
}

export function validateRequestContext(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("request context must be an object");
  const correlationId = input.correlationId;
  if (typeof correlationId !== "string" || !CORRELATION_RE.test(correlationId)) throw new TypeError("valid correlationId is required");
  const requestId = input.requestId;
  if (typeof requestId !== "string" || !ID_RE.test(requestId)) throw new TypeError("valid requestId is required");
  if (input.principalId !== undefined && (typeof input.principalId !== "string" || !ID_RE.test(input.principalId))) throw new TypeError("principalId is invalid");
  if (input.tenantId !== undefined && (typeof input.tenantId !== "string" || !ID_RE.test(input.tenantId))) throw new TypeError("tenantId is invalid");
  return Object.freeze({
    contractVersion: API_CONTRACT_VERSION,
    apiVersion: API_VERSION,
    requestId,
    correlationId,
    ...(input.principalId ? { principalId: input.principalId } : {}),
    ...(input.tenantId ? { tenantId: input.tenantId } : {}),
  });
}

/** Validation only; this does not authenticate the caller or authorize tenant/resource access. */
export function validateIdempotencyKey(value) {
  if (typeof value !== "string" || !IDEMPOTENCY_RE.test(value)) throw new TypeError("Idempotency-Key must contain 8-128 permitted characters");
  return value;
}

export function validatePagination(input = {}, { maxLimit = 100, defaultLimit = 20 } = {}) {
  if (!Number.isInteger(maxLimit) || maxLimit < 1 || maxLimit > 500) throw new TypeError("maxLimit must be between 1 and 500");
  if (!Number.isInteger(defaultLimit) || defaultLimit < 1 || defaultLimit > maxLimit) throw new TypeError("defaultLimit must be between 1 and maxLimit");
  const limit = input.limit === undefined ? defaultLimit : input.limit;
  if (!Number.isInteger(limit) || limit < 1 || limit > maxLimit) throw new RangeError(`limit must be an integer between 1 and ${maxLimit}`);
  const cursor = input.cursor;
  if (cursor !== undefined && (typeof cursor !== "string" || cursor.length < 1 || cursor.length > 512 || /[\r\n]/.test(cursor))) throw new TypeError("cursor must be a non-empty opaque token of at most 512 characters");
  return Object.freeze({ limit, ...(cursor !== undefined ? { cursor } : {}) });
}

/** Durable work is routed to orchestration; this descriptor does not execute a request. */
export function getExecutionRoute({ durable = false } = {}) {
  if (typeof durable !== "boolean") throw new TypeError("durable must be boolean");
  return durable
    ? Object.freeze({ owner: "aether-ai-orchestration", lifecycle: "durable", supportsRecovery: true })
    : Object.freeze({ owner: "aether-ai-gateway", lifecycle: "bounded-synchronous", supportsRecovery: false });
}

export function getApiSecurityRequirements() {
  return Object.freeze({
    authenticateBeforeResourceAccess: true,
    authorizeEachResourceAction: true,
    tenantContextMustBeServerValidated: true,
    trustClientWorkspaceHeaders: false,
    redactCredentialsAndRawSecrets: true,
  });
}
