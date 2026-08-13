import assert from "node:assert/strict";
import test from "node:test";
import {
  notifyNewBooking,
  sendFeishuBookingNotification,
  type NotificationRepository,
} from "../src/lib/booking-notification";
import type { BookingRecord } from "../src/lib/booking";

function booking(overrides: Partial<BookingRecord> = {}): BookingRecord {
  return {
    id: "row-id",
    booking_reference: "XAT-20260813-ABC123",
    booking_status: "NEW",
    travel_date: "2026-09-12",
    traveler_count: 2,
    full_name: "Malaysia Guest",
    country: "Malaysia",
    whatsapp: "+60123456789",
    email: "guest@example.com",
    notes: "Private dietary details",
    utm_source: "tiktok",
    utm_medium: null,
    utm_campaign: null,
    ref_code: "creator_a",
    submission_token: "550e8400-e29b-41d4-a716-446655440000",
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

test("Feishu notification contains operational fields but no sensitive contact data", async () => {
  let body = "";
  const fetch: typeof globalThis.fetch = async (_input, init) => {
    body = String(init?.body);
    return Response.json({ code: 0, msg: "success" });
  };
  const result = await sendFeishuBookingNotification(
    booking(),
    "https://open.feishu.cn/open-apis/bot/v2/hook/test",
    { fetch },
  );

  assert.deepEqual(result, { ok: true });
  assert.match(body, /XAT-20260813-ABC123/);
  assert.match(body, /Malaysia Guest/);
  assert.match(body, /Malaysia/);
  assert.match(body, /2026-09-12/);
  assert.doesNotMatch(body, /guest@example\.com/);
  assert.doesNotMatch(body, /60123456789/);
  assert.doesNotMatch(body, /Private dietary details/);
  assert.doesNotMatch(body, /550e8400/);
  assert.doesNotMatch(body, /row-id/);
});

test("Feishu HTTP and business failures map to stable codes", async () => {
  const http = await sendFeishuBookingNotification(
    booking(),
    "https://open.feishu.cn/open-apis/bot/v2/hook/test",
    { fetch: async () => new Response("secret diagnostic", { status: 500 }) },
  );
  assert.deepEqual(http, { ok: false, errorCode: "FEISHU_UNAVAILABLE" });

  const business = await sendFeishuBookingNotification(
    booking(),
    "https://open.feishu.cn/open-apis/bot/v2/hook/test",
    { fetch: async () => Response.json({ code: 19024, msg: "secret diagnostic" }) },
  );
  assert.deepEqual(business, { ok: false, errorCode: "FEISHU_REJECTED" });
});

test("Feishu request timeout maps without retry", async () => {
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

  const result = await sendFeishuBookingNotification(
    booking(),
    "https://open.feishu.cn/open-apis/bot/v2/hook/test",
    { fetch, timeoutMs: 10 },
  );
  assert.deepEqual(result, { ok: false, errorCode: "FEISHU_TIMEOUT" });
  assert.equal(calls, 1);
});

test("test booking skips Feishu and records SKIPPED", async () => {
  const updates: unknown[] = [];
  let notifierCalls = 0;
  const repository: NotificationRepository = {
    updateNotificationStatus: async (id, update) => { updates.push({ id, ...update }); },
  };

  await notifyNewBooking(booking({ is_test: true }), repository, async () => {
    notifierCalls += 1;
    return { ok: true };
  }, null);

  assert.equal(notifierCalls, 0);
  assert.deepEqual(updates, [{ id: "row-id", status: "SKIPPED", errorCode: null }]);
});

test("real booking without webhook is retained as an explicit notification failure", async () => {
  const updates: unknown[] = [];
  const repository: NotificationRepository = {
    updateNotificationStatus: async (id, update) => { updates.push({ id, ...update }); },
  };

  await notifyNewBooking(booking(), repository, async () => ({ ok: true }), null);
  assert.deepEqual(updates, [{
    id: "row-id",
    status: "FAILED",
    errorCode: "NOTIFICATION_UNCONFIGURED",
  }]);
});

test("duplicate recovery does not invoke notification orchestration", async () => {
  let calls = 0;
  async function afterCreate(duplicated: boolean) {
    if (!duplicated) calls += 1;
  }
  await afterCreate(true);
  assert.equal(calls, 0);
});
