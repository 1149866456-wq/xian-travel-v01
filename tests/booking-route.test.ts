import assert from "node:assert/strict";
import test from "node:test";
import { createBookingPostHandler, type BookingRouteDependencies } from "../src/app/api/bookings/route";
import { SupabaseRequestError } from "../src/lib/supabase-rest";
import type { BookingInput, BookingRecord } from "../src/lib/booking";

const body: BookingInput & { website: string } = {
  travel_date: "2026-09-12",
  traveler_count: 2,
  full_name: "Malaysia Guest",
  country: "Malaysia",
  whatsapp: "+60123456789",
  email: "guest@example.com",
  notes: "Private note",
  utm_source: "tiktok",
  utm_medium: null,
  utm_campaign: null,
  ref_code: "stability_test",
  submission_token: "550e8400-e29b-41d4-a716-446655440000",
  website: "",
};

function booking(overrides: Partial<BookingRecord> = {}): BookingRecord {
  return {
    ...body,
    id: "row-id",
    booking_reference: "XAT-20260813-ABC123",
    booking_status: "NEW",
    is_test: false,
    trip_id: "xian-tang-culture-2d1n",
    notification_status: "PENDING",
    notification_attempted_at: null,
    notification_error_code: null,
    created_at: "2026-08-13T00:00:00Z",
    updated_at: "2026-08-13T00:00:00Z",
    ...overrides,
  };
}

function request(overrides: {
  body?: string;
  origin?: string | null;
  contentType?: string;
  headers?: Record<string, string>;
} = {}) {
  const headers = new Headers({
    "content-type": overrides.contentType ?? "application/json",
    "x-forwarded-for": "203.0.113.10",
    ...overrides.headers,
  });
  if (overrides.origin !== null) headers.set("origin", overrides.origin ?? "https://example.com");
  return new Request("https://example.com/api/bookings", {
    method: "POST",
    headers,
    body: overrides.body ?? JSON.stringify(body),
  });
}

function dependencies(overrides: Partial<BookingRouteDependencies> = {}) {
  const events: Array<Record<string, unknown>> = [];
  let notificationCalls = 0;
  const deps: BookingRouteDependencies = {
    consumeRateLimit: async () => ({ allowed: true, remaining: 9, retryAfterSeconds: 600 }),
    createBooking: async (_input, flags) => ({ booking: booking({ is_test: flags.is_test }), duplicated: false }),
    notifyNewBooking: async () => { notificationCalls += 1; return { ok: true }; },
    now: () => new Date("2026-08-13T00:00:00Z"),
    getConfig: () => ({
      rateLimitHashSecret: "r".repeat(32),
      bookingE2ESecret: "e2e-secret",
      bookingNotificationWebhookUrl: null,
    }),
    log: (event) => { events.push(event); },
    ...overrides,
  };
  return { deps, events, getNotificationCalls: () => notificationCalls };
}

test("new booking returns 201, E2E evidence, and one notification orchestration", async () => {
  const setup = dependencies();
  const POST = createBookingPostHandler(setup.deps);
  const response = await POST(request({ headers: { "x-booking-e2e-secret": "e2e-secret" } }));
  const result = await response.json();

  assert.equal(response.status, 201);
  assert.equal(result.ok, true);
  assert.equal(result.duplicated, false);
  assert.equal(result.bookingReference, "XAT-20260813-ABC123");
  assert.match(result.successUrl, /^\/booking\/success\?token=/);
  assert.deepEqual(result.testEvidence, { is_test: true, utm_source: "tiktok", ref_code: "stability_test" });
  assert.equal(setup.getNotificationCalls(), 1);
});

test("duplicate booking returns 200 and skips notification", async () => {
  const setup = dependencies({
    createBooking: async () => ({ booking: booking(), duplicated: true }),
  });
  const response = await createBookingPostHandler(setup.deps)(request());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).duplicated, true);
  assert.equal(setup.getNotificationCalls(), 0);
});

test("request guard failures use stable statuses", async () => {
  const POST = createBookingPostHandler(dependencies().deps);
  assert.equal((await POST(request({ body: "{" }))).status, 400);
  assert.equal((await POST(request({ origin: null }))).status, 403);
  assert.equal((await POST(request({ contentType: "text/plain" }))).status, 415);
  assert.equal((await POST(request({ body: JSON.stringify({ ...body, notes: "x".repeat(17_000) }) }))).status, 413);
  assert.equal((await POST(request({ body: JSON.stringify({ ...body, website: "bot" }) }))).status, 403);
  assert.equal((await POST(request({ headers: { "x-booking-e2e-secret": "wrong" } }))).status, 403);
});

test("invalid booking payload returns 422 field errors", async () => {
  const response = await createBookingPostHandler(dependencies().deps)(request({
    body: JSON.stringify({ ...body, full_name: "" }),
  }));
  assert.equal(response.status, 422);
  const result = await response.json();
  assert.ok(result.errors.full_name);
});

test("bounded malformed, invalid, unauthenticated, and honeypot requests consume one rate-limit slot", async () => {
  const cases = [request({ body: "{" }), request({ body: JSON.stringify({ ...body, full_name: "" }) }), request({ headers: { "x-booking-e2e-secret": "wrong" } }), request({ body: JSON.stringify({ ...body, website: "bot" }) })];
  for (const input of cases) {
    let calls = 0;
    const setup = dependencies({ consumeRateLimit: async () => {
      calls += 1;
      return { allowed: true, remaining: 9, retryAfterSeconds: 600 };
    } });
    await createBookingPostHandler(setup.deps)(input);
    assert.equal(calls, 1);
  }
});

test("rate-limit rejection returns 429 and Retry-After", async () => {
  const setup = dependencies({
    consumeRateLimit: async () => ({ allowed: false, remaining: 0, retryAfterSeconds: 321 }),
  });
  const response = await createBookingPostHandler(setup.deps)(request());
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "321");
});

test("Supabase timeout returns 503 without upstream detail", async () => {
  const setup = dependencies({
    createBooking: async () => { throw new SupabaseRequestError("SUPABASE_TIMEOUT"); },
  });
  const response = await createBookingPostHandler(setup.deps)(request());
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /Supabase|server-secret|guest@example/);
});

test("notification failure after insert does not fail customer booking", async () => {
  const setup = dependencies({
    notifyNewBooking: async () => ({ ok: false, errorCode: "NOTIFICATION_UNCONFIGURED" }),
  });
  const response = await createBookingPostHandler(setup.deps)(request());
  assert.equal(response.status, 201);
  assert.equal((await response.json()).ok, true);
});

test("notification state update exception after insert does not fail customer booking", async () => {
  const setup = dependencies({
    notifyNewBooking: async () => { throw new Error("notification state update failed"); },
  });
  const response = await createBookingPostHandler(setup.deps)(request());
  assert.equal(response.status, 201);
  assert.equal((await response.json()).ok, true);
  assert.match(JSON.stringify(setup.events), /booking_notification_failed/);
});

test("structured logs never contain submitted PII, token, IP, or secrets", async () => {
  const setup = dependencies();
  await createBookingPostHandler(setup.deps)(request());
  const serialized = JSON.stringify(setup.events);
  assert.doesNotMatch(serialized, /guest@example\.com/);
  assert.doesNotMatch(serialized, /60123456789/);
  assert.doesNotMatch(serialized, /Private note/);
  assert.doesNotMatch(serialized, /550e8400/);
  assert.doesNotMatch(serialized, /203\.0\.113\.10/);
  assert.doesNotMatch(serialized, /e2e-secret/);
  assert.match(serialized, /booking_submission_started/);
  assert.match(serialized, /booking_created/);
});
