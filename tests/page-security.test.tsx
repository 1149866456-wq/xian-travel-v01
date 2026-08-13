import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BookingSuccessDetails, successTokenCutoff } from "../src/app/booking/success/booking-success-details";
import { isSuccessToken } from "../src/app/booking/success/page";
import { ContactCta } from "../src/components/contact-cta";
import type { BookingRecord } from "../src/lib/booking";

const booking: BookingRecord = {
  id: "row-id",
  booking_reference: "XAT-20260813-ABC123",
  booking_status: "NEW",
  travel_date: "2026-09-12",
  traveler_count: 2,
  full_name: "Private Guest Name",
  country: "Malaysia",
  whatsapp: "+60123456789",
  email: "private@example.com",
  notes: "Private dietary note",
  utm_source: "tiktok",
  utm_medium: null,
  utm_campaign: null,
  ref_code: "creator_a",
  submission_token: "550e8400-e29b-41d4-a716-446655440000",
  is_test: false,
  trip_id: "xian-tang-culture-2d1n",
  notification_status: "SENT",
  notification_attempted_at: "2026-08-13T00:00:01Z",
  notification_error_code: null,
  created_at: "2026-08-13T00:00:00Z",
  updated_at: "2026-08-13T00:00:01Z",
};

test("success-token cutoff is exactly 24 hours before now", () => {
  assert.equal(
    successTokenCutoff(new Date("2026-08-13T12:00:00.000Z")),
    "2026-08-12T12:00:00.000Z",
  );
});

test("success lookup accepts only UUID v4 tokens", () => {
  assert.equal(isSuccessToken("550e8400-e29b-41d4-a716-446655440000"), true);
  assert.equal(isSuccessToken("550e8400-e29b-11d4-a716-446655440000"), false);
  assert.equal(isSuccessToken("not-a-token"), false);
});

test("WhatsApp CTA uses digits-only wa.me path", () => {
  const html = renderToStaticMarkup(<ContactCta whatsappNumber="+60123456789" />);
  assert.match(html, /href="https:\/\/wa\.me\/60123456789"/);
  assert.doesNotMatch(html, /wa\.me\/\+/);
});

test("success details render only reference, date, and traveler count", () => {
  const html = renderToStaticMarkup(<BookingSuccessDetails booking={booking} whatsappNumber={null} />);
  assert.match(html, /XAT-20260813-ABC123/);
  assert.match(html, /2026-09-12/);
  assert.match(html, />2</);
  assert.doesNotMatch(html, /Private Guest Name/);
  assert.doesNotMatch(html, /private@example\.com/);
  assert.doesNotMatch(html, /60123456789/);
  assert.doesNotMatch(html, /Private dietary note/);
  assert.doesNotMatch(html, /550e8400/);
  assert.match(html, /WhatsApp is temporarily unavailable/);
});
