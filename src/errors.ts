export type ApiErrorCode =
  | "invalid_request"
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "payload_too_large"
  | "dependency_unavailable"
  | "timeout"
  | "cancelled"
  | "internal_error";

export interface ApiErrorBody {
  readonly schemaVersion: "1";
  readonly error: {
    readonly code: ApiErrorCode;
    readonly message: string;
    readonly requestId?: string;
    readonly retryable: boolean;
  };
}

const PUBLIC_MESSAGES: Readonly<Record<ApiErrorCode, string>> = {
  invalid_request: "The request is invalid.",
  unauthenticated: "Authentication is required.",
  forbidden: "The requested action is not permitted.",
  not_found: "The requested resource was not found.",
  conflict: "The request conflicts with the current resource state.",
  rate_limited: "Too many requests. Try again later.",
  payload_too_large: "The request payload is too large.",
  dependency_unavailable: "A required dependency is temporarily unavailable.",
  timeout: "The operation timed out.",
  cancelled: "The operation was cancelled.",
  internal_error: "An internal error occurred."
};

const RETRYABLE = new Set<ApiErrorCode>(["rate_limited", "dependency_unavailable", "timeout"]);

export function createApiError(
  code: ApiErrorCode,
  options: { readonly requestId?: string; readonly publicMessage?: string } = {}
): ApiErrorBody {
  const requestId = options.requestId;
  if (requestId !== undefined && !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(requestId)) {
    throw new TypeError("Invalid request ID.");
  }
  // Caller-supplied messages are deliberately not accepted: they could leak upstream errors/secrets.
  if (options.publicMessage !== undefined) throw new TypeError("Custom public messages are not supported.");
  return Object.freeze({
    schemaVersion: "1",
    error: Object.freeze({
      code,
      message: PUBLIC_MESSAGES[code],
      ...(requestId === undefined ? {} : { requestId }),
      retryable: RETRYABLE.has(code)
    })
  });
}

export function apiErrorHttpStatus(code: ApiErrorCode): number {
  switch (code) {
    case "invalid_request": return 400;
    case "unauthenticated": return 401;
    case "forbidden": return 403;
    case "not_found": return 404;
    case "conflict": return 409;
    case "rate_limited": return 429;
    case "payload_too_large": return 413;
    case "dependency_unavailable": return 503;
    case "timeout": return 504;
    case "cancelled": return 499;
    case "internal_error": return 500;
  }
}
