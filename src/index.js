import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const DEFAULT_MAX_BODY_BYTES = 1_048_576;

function isRecord(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function sendJson(response, status, payload, requestId) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "x-request-id": requestId,
  });
  response.end(body);
}
async function readJson(request, maxBodyBytes) {
  const contentType = String(request.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    const error = new Error("Unsupported content type"); error.code = "unsupported_media_type"; throw error;
  }
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > maxBodyBytes) {
      const error = new Error("Request body too large"); error.code = "payload_too_large"; throw error;
    }
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { const error = new Error("Invalid JSON"); error.code = "invalid_json"; throw error; }
}
function validPrincipal(principal) {
  return isRecord(principal)
    && typeof principal.id === "string" && principal.id.length > 0
    && typeof principal.tenantId === "string" && principal.tenantId.length > 0;
}

/**
 * Build an HTTP API boundary. Authentication must resolve identity from a
 * trusted server-side verifier; this server never accepts a principal in JSON.
 */
export function createApiServer({ authenticate, gateway, maxBodyBytes = DEFAULT_MAX_BODY_BYTES, upstreamTimeoutMs = 30_000, maxResponseTextChars = 1_000_000 }) {
  if (typeof authenticate !== "function") throw new TypeError("authenticate callback is required");
  if (!gateway || typeof gateway.complete !== "function") throw new TypeError("gateway is required");
  if (!Number.isSafeInteger(maxBodyBytes) || maxBodyBytes < 1 || maxBodyBytes > 10_485_760) {
    throw new TypeError("maxBodyBytes must be between 1 and 10485760");
  }
  if (!Number.isSafeInteger(upstreamTimeoutMs) || upstreamTimeoutMs < 1 || upstreamTimeoutMs > 120_000) throw new TypeError("upstreamTimeoutMs must be between 1 and 120000");
  if (!Number.isSafeInteger(maxResponseTextChars) || maxResponseTextChars < 1 || maxResponseTextChars > 10_000_000) throw new TypeError("maxResponseTextChars must be between 1 and 10000000");

  const server = createServer(async (request, response) => {
    const requestId = randomUUID();
    try {
      const url = new URL(request.url ?? "/", "http://localhost");
      if (request.method === "GET" && url.pathname === "/health/live") {
        return sendJson(response, 200, { status: "ok" }, requestId);
      }
      if (request.method !== "POST" || url.pathname !== "/v1/chat/completions") {
        return sendJson(response, 404, { error: { code: "not_found", message: "Route not found" } }, requestId);
      }

      let principal;
      try { principal = await authenticate({ headers: request.headers, requestId }); }
      catch { return sendJson(response, 401, { error: { code: "unauthenticated", message: "Authentication required" } }, requestId); }
      if (!validPrincipal(principal)) {
        return sendJson(response, 401, { error: { code: "unauthenticated", message: "Authentication required" } }, requestId);
      }

      let input;
      try { input = await readJson(request, maxBodyBytes); }
      catch (error) {
        const mapping = {
          unsupported_media_type: [415, "unsupported_media_type", "Content-Type must be application/json"],
          payload_too_large: [413, "payload_too_large", "Request body exceeds the configured limit"],
          invalid_json: [400, "invalid_json", "Request body must be valid JSON"],
        };
        const [status, code, message] = mapping[error.code] ?? [400, "invalid_request", "Invalid request"];
        return sendJson(response, status, { error: { code, message } }, requestId);
      }
      if (!isRecord(input) || typeof input.model !== "string" || !input.model.trim() || input.model.length > 200 || !Array.isArray(input.messages) || input.messages.length === 0 || input.messages.length > 100) {
        return sendJson(response, 400, { error: { code: "invalid_request", message: "A valid model and between 1 and 100 messages are required" } }, requestId);
      }
      const validRoles = new Set(["system", "user", "assistant", "tool"]);
      const invalidMessage = input.messages.some((message) => !isRecord(message)
        || !validRoles.has(message.role)
        || typeof message.content !== "string"
        || message.content.length > 100_000);
      if (invalidMessage) {
        return sendJson(response, 400, { error: { code: "invalid_request", message: "Each message must have a supported role and text content within the configured limit" } }, requestId);
      }
      if (input.stream === true) {
        return sendJson(response, 501, { error: { code: "streaming_not_implemented", message: "Streaming is not enabled on this endpoint yet" } }, requestId);
      }

      const controller = new AbortController();
      let timeoutHandle;
      const timeoutPromise = new Promise((_, reject) => {
        const timeoutError = () => { const error = new Error("Upstream timed out"); error.code = "timeout"; reject(error); };
        if (controller.signal.aborted) timeoutError();
        else controller.signal.addEventListener("abort", timeoutError, { once: true });
        timeoutHandle = setTimeout(() => controller.abort(), upstreamTimeoutMs);
      });
      let result;
      try {
        result = await Promise.race([
          Promise.resolve().then(() => gateway.complete({ principal, request: input, signal: controller.signal })),
          timeoutPromise,
        ]);
      } finally {
        clearTimeout(timeoutHandle);
      }
      if (!isRecord(result) || typeof result.text !== "string" || result.text.length > maxResponseTextChars) {
        const error = new Error("Invalid upstream response"); error.code = "invalid_upstream_response"; throw error;
      }
      return sendJson(response, 200, { id: requestId, object: "chat.completion", model: typeof result.model === "string" ? result.model : input.model, choices: [{ index: 0, message: { role: "assistant", content: result.text }, finish_reason: typeof result.finishReason === "string" ? result.finishReason : "stop" }], usage: result.usage ?? null }, requestId);
    } catch (error) {
      const status = error?.code === "forbidden" ? 403
        : error?.code === "model_not_routed" || error?.code === "unsupported" ? 400
        : error?.code === "timeout" ? 504
        : error?.code === "unauthenticated" ? 401
        : 502;
      const code = status === 403 ? "forbidden"
        : status === 400 ? "model_not_available"
        : status === 504 ? "upstream_timeout"
        : status === 401 ? "unauthenticated"
        : "upstream_failure";
      return sendJson(response, status, { error: { code, message: status === 403 ? "Request is not authorized" : status === 400 ? "Requested model is not available" : status === 504 ? "Model request timed out" : status === 401 ? "Authentication required" : "Model request failed" } }, requestId);
    }
  });
  server.requestTimeout = 30_000;
  server.headersTimeout = 10_000;
  return server;
}
