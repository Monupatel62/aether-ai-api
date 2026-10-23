import test from "node:test";
import assert from "node:assert/strict";
import { createApiServer } from "../src/index.js";

async function withServer(options, fn) {
  const server = createApiServer(options);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try { await fn(`http://127.0.0.1:${address.port}`); }
  finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
}
const payload = { model: "model-a", messages: [{ role: "user", content: "hello" }] };

test("health endpoint is live and includes request id", async () => {
  await withServer({ authenticate: async () => null, gateway: { complete: async () => ({ text: "ok" }) } }, async (base) => {
    const response = await fetch(`${base}/health/live`);
    assert.equal(response.status, 200);
    assert.ok(response.headers.get("x-request-id"));
  });
});

test("rejects missing and malformed authenticated principals", async () => {
  await withServer({ authenticate: async () => null, gateway: { complete: async () => ({ text: "ok" }) }, }, async (base) => {
    const response = await fetch(`${base}/v1/chat/completions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    assert.equal(response.status, 401);
  });
  await withServer({ authenticate: async () => ({ id: "user-1" }), gateway: { complete: async () => ({ text: "ok" }) } }, async (base) => {
    const response = await fetch(`${base}/v1/chat/completions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    assert.equal(response.status, 401);
  });
});

test("routes an authenticated request through the gateway", async () => {
  let received;
  await withServer({ authenticate: async () => ({ id: "user-1", tenantId: "tenant-a" }), gateway: { complete: async (input) => { received = input; return { text: "hello back", model: "model-a", finishReason: "stop" }; } } }, async (base) => {
    const response = await fetch(`${base}/v1/chat/completions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.choices[0].message.content, "hello back");
    assert.equal(received.principal.tenantId, "tenant-a");
  });
});

test("rejects wrong content type, malformed JSON, oversized bodies, and streaming", async () => {
  const options = { authenticate: async () => ({ id: "user-1", tenantId: "tenant-a" }), gateway: { complete: async () => ({ text: "ok" }) }, maxBodyBytes: 100 };
  await withServer(options, async (base) => {
    assert.equal((await fetch(`${base}/v1/chat/completions`, { method: "POST", headers: { "content-type": "text/plain" }, body: "hello" })).status, 415);
    assert.equal((await fetch(`${base}/v1/chat/completions`, { method: "POST", headers: { "content-type": "application/json" }, body: "{" })).status, 400);
    assert.equal((await fetch(`${base}/v1/chat/completions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model: "x", messages: [], padding: "x".repeat(200) }) })).status, 413);
    assert.equal((await fetch(`${base}/v1/chat/completions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload, stream: true }) })).status, 501);
  });
});

test("returns safe generic error when gateway fails", async () => {
  await withServer({ authenticate: async () => ({ id: "user-1", tenantId: "tenant-a" }), gateway: { complete: async () => { throw new Error("secret prompt"); } } }, async (base) => {
    const response = await fetch(`${base}/v1/chat/completions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const body = await response.json();
    assert.equal(response.status, 502);
    assert.equal(JSON.stringify(body).includes("secret prompt"), false);
  });
});
