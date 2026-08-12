import assert from "node:assert/strict";
import test from "node:test";
import { readAttribution, attributionQuery } from "../src/lib/attribution";
import { validateBooking, type BookingInput, type BookingRecord } from "../src/lib/booking";
import { createBooking, type BookingRepository } from "../src/lib/booking-service";

function validInput(overrides: Partial<BookingInput> = {}): BookingInput {
  return {
    travel_date: "2026-09-20",
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
  const existing = { ...validInput(), id: "1", booking_reference: "XAT-20260812-ABC123", booking_status: "NEW", created_at: "now", updated_at: "now" } satisfies BookingRecord;
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
      if (attempts === 1) throw new Error("23505 duplicate key booking_reference");
      return { ...input, id: "2", booking_reference: bookingReference, booking_status: "NEW", created_at: "now", updated_at: "now" };
    },
  };
  const refs = ["XAT-20260812-AAAAAA", "XAT-20260812-BBBBBB"];
  const result = await createBooking(validInput(), repository, () => refs.shift()!);
  assert.equal(attempts, 2);
  assert.equal(result.booking.booking_reference, "XAT-20260812-BBBBBB");
});
