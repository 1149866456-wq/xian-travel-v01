import assert from "node:assert/strict";
import test from "node:test";
import { readAttribution, attributionQuery } from "../src/lib/attribution";
import {
  BOOKING_LIMITS,
  validateBooking,
  validateBookingPayload,
  type BookingInput,
  type BookingRecord,
} from "../src/lib/booking";
import { createBooking, type BookingRepository } from "../src/lib/booking-service";
import { SupabaseRequestError } from "../src/lib/supabase-rest";

function validInput(overrides: Partial<BookingInput> = {}): BookingInput {
  return {
    travel_date: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
    traveler_count: 2,
    full_name: "Malaysia Guest",
    country: "Malaysia",
    whatsapp: "+60123456789",
    email: "guest@example.com",
    notes: null,
    utm_source: "tiktok",
    utm_medium: null,
    utm_campaign: null,
    ref_code: "influencer_A",
    submission_token: "550e8400-e29b-41d4-a716-446655440000",
    ...overrides,
  };
}

function record(input: BookingInput, overrides: Partial<BookingRecord> = {}): BookingRecord {
  return {
    ...input,
    id: "1",
    booking_reference: "XAT-20260812-ABC123",
    booking_status: "NEW",
    is_test: false,
    trip_id: "xian-tang-culture-2d1n",
    notification_status: "PENDING",
    notification_attempted_at: null,
    notification_error_code: null,
    created_at: "now",
    updated_at: "now",
    ...overrides,
  };
}

test("valid Malaysia booking passes validation", () => {
  assert.deepEqual(validateBooking(validInput(), new Date("2026-08-12T00:00:00Z")), {});
});

test("email, traveler count, past date and required fields are rejected", () => {
  const errors = validateBooking(validInput({ travel_date: "2026-08-01", traveler_count: 5, email: "bad", full_name: "" }), new Date("2026-08-12T00:00:00Z"));
  assert.ok(errors.travel_date);
  assert.ok(errors.traveler_count);
  assert.ok(errors.email);
  assert.ok(errors.full_name);
});

test("attribution reads utm_source and ref alias", () => {
  assert.deepEqual(readAttribution({ utm_source: "tiktok", ref: "influencer_A" }), { utm_source: "tiktok", utm_medium: null, utm_campaign: null, ref_code: "influencer_A" });
});

test("attribution can be preserved across Home → Trip → Booking links", () => {
  assert.equal(attributionQuery(readAttribution({ utm_source: "tiktok", ref: "influencer_A" })), "?utm_source=tiktok&ref=influencer_A");
});

test("duplicate submission returns existing booking instead of inserting twice", async () => {
  const existing = record(validInput());
  const repository: BookingRepository = { findBySubmissionToken: async () => existing, insert: async () => { throw new Error("should not insert"); } };
  const result = await createBooking(validInput(), repository, () => "XAT-20260812-XYZ999");
  assert.equal(result.duplicated, true);
  assert.equal(result.booking.booking_reference, existing.booking_reference);
});

test("booking reference collision retries", async () => {
  let attempts = 0;
  const repository: BookingRepository = {
    findBySubmissionToken: async () => null,
    insert: async (input, bookingReference) => {
      attempts += 1;
      if (attempts === 1) throw new SupabaseRequestError("SUPABASE_CONFLICT", "BOOKING_REFERENCE");
      return record(input, { id: "2", booking_reference: bookingReference });
    },
  };
  const refs = ["XAT-20260812-AAAAAA", "XAT-20260812-BBBBBB"];
  const result = await createBooking(validInput(), repository, () => refs.shift()!);
  assert.equal(attempts, 2);
  assert.equal(result.booking.booking_reference, "XAT-20260812-BBBBBB");
});

test("impossible calendar dates are rejected before persistence", () => {
  assert.ok(validateBooking(validInput({ travel_date: "2026-99-99" }), new Date("2026-08-12T00:00:00Z")).travel_date);
});

test("only a classified booking-reference conflict is retried", async () => {
  let attempts = 0;
  const repository: BookingRepository = { findBySubmissionToken: async () => null, insert: async () => {
    attempts += 1;
    throw new SupabaseRequestError("SUPABASE_CONFLICT", "BOOKING_REFERENCE");
  } };
  await assert.rejects(createBooking(validInput(), repository), /SUPABASE_CONFLICT/);
  assert.equal(attempts, 5);
});

test("submission-token conflict is recovered idempotently without retrying the insert", async () => {
  let inserts = 0;
  const existing = record(validInput());
  const repository: BookingRepository = { findBySubmissionToken: async () => inserts === 0 ? null : existing, insert: async () => {
    inserts += 1;
    throw new SupabaseRequestError("SUPABASE_CONFLICT", "SUBMISSION_TOKEN");
  } };
  const result = await createBooking(validInput(), repository);
  assert.equal(result.duplicated, true);
  assert.equal(inserts, 1);
});

test("booking payload is normalized before persistence", () => {
  const result = validateBookingPayload({
    ...validInput(),
    full_name: "  Malaysia Guest  ",
    country: " Malaysia ",
    whatsapp: "+60 (12) 345-6789",
    email: " Guest@Example.com ",
    notes: "  Vegetarian  ",
    utm_source: " tiktok ",
    ref_code: " creator_a ",
    website: "",
  }, new Date("2026-08-12T00:00:00Z"));

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.input.full_name, "Malaysia Guest");
    assert.equal(result.input.country, "Malaysia");
    assert.equal(result.input.whatsapp, "+60123456789");
    assert.equal(result.input.email, "guest@example.com");
    assert.equal(result.input.notes, "Vegetarian");
    assert.equal(result.input.utm_source, "tiktok");
    assert.equal(result.input.ref_code, "creator_a");
    assert.equal(result.honeypot, "");
  }
});

test("booking payload rejects fields above their exact limits", () => {
  const cases: Array<[keyof BookingInput, string, number]> = [
    ["full_name", "x", BOOKING_LIMITS.full_name],
    ["country", "x", BOOKING_LIMITS.country],
    ["email", "a", BOOKING_LIMITS.email],
    ["notes", "x", BOOKING_LIMITS.notes],
    ["utm_source", "x", BOOKING_LIMITS.attribution],
    ["utm_medium", "x", BOOKING_LIMITS.attribution],
    ["utm_campaign", "x", BOOKING_LIMITS.attribution],
    ["ref_code", "x", BOOKING_LIMITS.attribution],
  ];

  for (const [field, character, maximum] of cases) {
    const result = validateBookingPayload({ ...validInput(), website: "", [field]: character.repeat(maximum + 1) });
    assert.equal(result.ok, false, `${field} should be rejected above ${maximum} characters`);
    if (!result.ok) assert.ok(result.errors[field]);
  }
});

test("booking payload rejects invalid WhatsApp and control characters", () => {
  const whatsapp = validateBookingPayload({ ...validInput({ whatsapp: "0060-call-me" }), website: "" });
  assert.equal(whatsapp.ok, false);
  if (!whatsapp.ok) assert.ok(whatsapp.errors.whatsapp);

  const control = validateBookingPayload({ ...validInput({ full_name: "Guest\u0000Name" }), website: "" });
  assert.equal(control.ok, false);
  if (!control.ok) assert.ok(control.errors.full_name);
});

test("booking payload rejects wrong primitive types and privileged fields", () => {
  const wrongType = validateBookingPayload({ ...validInput(), traveler_count: "2", website: "" });
  assert.equal(wrongType.ok, false);
  if (!wrongType.ok) assert.ok(wrongType.errors.traveler_count);

  const privileged = validateBookingPayload({ ...validInput(), website: "", is_test: true });
  assert.equal(privileged.ok, false);
  if (!privileged.ok) assert.ok(privileged.errors.payload);
});
