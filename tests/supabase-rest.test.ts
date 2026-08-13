import assert from "node:assert/strict";
import test from "node:test";
import { SupabaseRequestError, supabaseRequest } from "../src/lib/supabase-rest";

const credentials = { url: "https://project.supabase.co", secret: "server-secret" };

test("safe Supabase read retries one transient failure", async () => {
  let calls = 0;
  const fetch: typeof globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) throw new TypeError("temporary network failure");
    return Response.json({ ok: true });
  };

  const result = await supabaseRequest<{ ok: true }>("health", undefined, {
    timeoutMs: 100,
    maxRetries: 1,
    retryable: true,
  }, { fetch, credentials, sleep: async () => {} });

  assert.deepEqual(result, { ok: true });
  assert.equal(calls, 2);
});

test("Supabase write never retries a 500 response", async () => {
  let calls = 0;
  const fetch: typeof globalThis.fetch = async () => {
    calls += 1;
    return new Response("sensitive upstream detail", { status: 500 });
  };

  await assert.rejects(
    supabaseRequest("booking_requests", { method: "POST" }, {
      timeoutMs: 100,
      maxRetries: 0,
      retryable: false,
    }, { fetch, credentials, sleep: async () => {} }),
    (error: unknown) => error instanceof SupabaseRequestError
      && error.code === "SUPABASE_UNAVAILABLE"
      && !error.message.includes("sensitive upstream detail"),
  );
  assert.equal(calls, 1);
});

test("rate-limit RPC timeout is mapped and never retried", async () => {
  let calls = 0;
  const fetch: typeof globalThis.fetch = async (_input, init) => {
    calls += 1;
    return await new Promise<Response>((_resolve, reject) => {
      const abortGuard = setTimeout(() => reject(new Error("abort signal did not fire")), 1_000);
      init?.signal?.addEventListener("abort", () => {
        clearTimeout(abortGuard);
        reject(init.signal?.reason);
      }, { once: true });
    });
  };

  await assert.rejects(
    supabaseRequest("rpc/consume_booking_rate_limit", { method: "POST" }, {
      timeoutMs: 10,
      maxRetries: 0,
      retryable: false,
    }, { fetch, credentials, sleep: async () => {} }),
    (error: unknown) => error instanceof SupabaseRequestError && error.code === "SUPABASE_TIMEOUT",
  );
  assert.equal(calls, 1);
});

test("safe read retries 429 with a bounded Retry-After delay", async () => {
  let calls = 0;
  const delays: number[] = [];
  const fetch: typeof globalThis.fetch = async () => {
    calls += 1;
    return calls === 1
      ? new Response("busy", { status: 429, headers: { "Retry-After": "9999" } })
      : Response.json([]);
  };

  await supabaseRequest("booking_requests", undefined, {
    timeoutMs: 100,
    maxRetries: 1,
    retryable: true,
  }, { fetch, credentials, sleep: async (milliseconds) => { delays.push(milliseconds); } });

  assert.equal(calls, 2);
  assert.deepEqual(delays, [1_000]);
});

test("non-retryable Supabase response maps to a stable rejection code", async () => {
  const fetch: typeof globalThis.fetch = async () => new Response("database policy details", { status: 400 });
  await assert.rejects(
    supabaseRequest("booking_requests", undefined, {
      timeoutMs: 100,
      maxRetries: 1,
      retryable: true,
    }, { fetch, credentials, sleep: async () => {} }),
    (error: unknown) => error instanceof SupabaseRequestError
      && error.code === "SUPABASE_REJECTED"
      && !error.message.includes("database policy details"),
  );
});
