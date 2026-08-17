import assert from "node:assert/strict";
import test from "node:test";
import { whatsappHref } from "../src/lib/contact";

test("missing WhatsApp configuration does not create a contact URL", () => {
  assert.equal(whatsappHref(undefined), null);
  assert.equal(whatsappHref(""), null);
  assert.equal(whatsappHref("not-a-phone"), null);
});

test("configured WhatsApp number creates a normalized URL with an encoded message", () => {
  assert.equal(
    whatsappHref("+60 12-345 6789", "Booking XAT-123"),
    "https://wa.me/60123456789?text=Booking%20XAT-123",
  );
});

test("WhatsApp URLs reject malformed or non-E.164-style phone numbers", () => {
  for (const number of [
    "+60 12-call 6789",
    "+00 12-345 6789",
    "+00 000-000 0000",
    "012-345-6789",
    "+60 12-345 ext 6789",
    "+60 12345678901234",
  ]) {
    assert.equal(whatsappHref(number), null, number);
  }
});
