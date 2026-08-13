import assert from "node:assert/strict";
import test from "node:test";
import {
  hashRateLimitKey,
  readBoundedJson,
  validateBookingRequestHeaders,
  verifyE2ESecret,
} from "../src/lib/request-guard";

function request(headers: Record<string, string>, body = "{}") {
  return new Request("https://example.com/api/bookings", {
    method: "POST",
    headers,
    body,
  });
}

test("same-origin JSON request headers are accepted", () => {
  assert.deepEqual(validateBookingRequestHeaders(request({
    origin: "https://example.com",
    "content-type": "application/json; charset=utf-8",
  })), { ok: true });
});

test("missing or cross-origin Origin is rejected", () => {
  const missing = validateBookingRequestHeaders(request({ "content-type": "application/json" }));
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.status, 403);

  const crossOrigin = validateBookingRequestHeaders(request({
    origin: "https://attacker.example",
    "content-type": "application/json",
  }));
  assert.equal(crossOrigin.ok, false);
  if (!crossOrigin.ok) assert.equal(crossOrigin.status, 403);
});

test("non-JSON media type is rejected", () => {
  const result = validateBookingRequestHeaders(request({
    origin: "https://example.com",
    "content-type": "text/plain",
  }));
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 415);
});

test("actual UTF-8 body bytes are bounded even with misleading Content-Length", async () => {
  const oversized = request({
    origin: "https://example.com",
    "content-type": "application/json",
    "content-length": "10",
  }, JSON.stringify({ notes: "界".repeat(6_000) }));
  const result = await readBoundedJson(oversized, 16_384);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 413);
});

test("declared oversized body and malformed JSON are rejected distinctly", async () => {
  const declared = request({
    origin: "https://example.com",
    "content-type": "application/json",
    "content-length": "16385",
  });
  const tooLarge = await readBoundedJson(declared, 16_384);
  assert.equal(tooLarge.ok, false);
  if (!tooLarge.ok) assert.equal(tooLarge.status, 413);

  const malformed = await readBoundedJson(request({
    origin: "https://example.com",
    "content-type": "application/json",
  }, "{"), 16_384);
  assert.equal(malformed.ok, false);
  if (!malformed.ok) assert.equal(malformed.status, 400);
});

test("streaming body is cancelled as soon as it exceeds the byte limit", async () => {
  let cancelled = false;
  const streamed = new Request("https://example.com/api/bookings", {
    method: "POST",
    headers: { origin: "https://example.com", "content-type": "application/json" },
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("{\"notes\":\""));
        controller.enqueue(new Uint8Array(16_384));
      },
      cancel() { cancelled = true; },
    }),
    duplex: "half",
  } as RequestInit);
  const result = await readBoundedJson(streamed, 16_384);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 413);
  assert.equal(cancelled, true);
});

test("rate-limit key is stable HMAC without exposing the IP", () => {
  const first = hashRateLimitKey("203.0.113.10", "a".repeat(32));
  const second = hashRateLimitKey("203.0.113.10", "a".repeat(32));
  const changed = hashRateLimitKey("203.0.113.10", "b".repeat(32));
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.equal(first, second);
  assert.notEqual(first, changed);
  assert.equal(first.includes("203.0.113.10"), false);
});

test("E2E secret comparison accepts only the exact configured value", () => {
  assert.equal(verifyE2ESecret("acceptance-secret", "acceptance-secret"), true);
  assert.equal(verifyE2ESecret("wrong", "acceptance-secret"), false);
  assert.equal(verifyE2ESecret(null, "acceptance-secret"), false);
  assert.equal(verifyE2ESecret("acceptance-secret", null), false);
});
