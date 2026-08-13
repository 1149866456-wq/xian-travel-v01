import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import {
  ATTRIBUTION_COOKIE,
  decodeAttributionCookie,
  encodeAttributionCookie,
  mergeFirstTouch,
  readAttribution,
} from "../src/lib/attribution";
import { proxy } from "../src/proxy";

test("first-touch attribution keeps existing values and fills only missing fields", () => {
  assert.deepEqual(
    mergeFirstTouch(
      { utm_source: "tiktok", utm_medium: null, utm_campaign: null, ref_code: "creator_a" },
      { utm_source: "instagram", utm_medium: "social", utm_campaign: "autumn", ref_code: null },
    ),
    { utm_source: "tiktok", utm_medium: "social", utm_campaign: "autumn", ref_code: "creator_a" },
  );
});

test("attribution cookie round-trips only bounded values", () => {
  const encoded = encodeAttributionCookie({
    utm_source: "tiktok",
    utm_medium: "social",
    utm_campaign: "autumn",
    ref_code: "creator_a",
  });
  assert.deepEqual(decodeAttributionCookie(encoded), {
    utm_source: "tiktok",
    utm_medium: "social",
    utm_campaign: "autumn",
    ref_code: "creator_a",
  });
  assert.deepEqual(decodeAttributionCookie("not-json"), {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    ref_code: null,
  });
  assert.equal(decodeAttributionCookie(JSON.stringify({ utm_source: "x".repeat(101) })).utm_source, null);
});

test("attribution ignores control-character query values and polluted cookie values", () => {
  assert.deepEqual(readAttribution({ utm_source: " good\u0000value ", ref: " crea\ntor " }), { utm_source: null, utm_medium: null, utm_campaign: null, ref_code: null });
  assert.deepEqual(decodeAttributionCookie(JSON.stringify({ utm_source: "ba\td", ref_code: "ok" })), { utm_source: null, utm_medium: null, utm_campaign: null, ref_code: "ok" });
});

test("proxy captures attribution in a 90-day HttpOnly first-party cookie", () => {
  const response = proxy(new NextRequest("https://example.com/?utm_source=tiktok&ref=creator_a"));
  const cookie = response.cookies.get(ATTRIBUTION_COOKIE);
  assert.ok(cookie);
  assert.equal(cookie.httpOnly, true);
  assert.equal(cookie.sameSite, "lax");
  assert.equal(cookie.path, "/");
  assert.equal(cookie.maxAge, 90 * 24 * 60 * 60);
  assert.deepEqual(decodeAttributionCookie(cookie.value), {
    utm_source: "tiktok",
    utm_medium: null,
    utm_campaign: null,
    ref_code: "creator_a",
  });
});

test("proxy does not overwrite first-touch source on later visits", () => {
  const existing = encodeAttributionCookie({
    utm_source: "tiktok",
    utm_medium: null,
    utm_campaign: null,
    ref_code: "creator_a",
  });
  const request = new NextRequest("https://example.com/contact?utm_source=instagram&utm_medium=social", {
    headers: { cookie: `${ATTRIBUTION_COOKIE}=${encodeURIComponent(existing)}` },
  });
  const response = proxy(request);
  const cookie = response.cookies.get(ATTRIBUTION_COOKIE);
  assert.ok(cookie);
  assert.deepEqual(decodeAttributionCookie(cookie.value), {
    utm_source: "tiktok",
    utm_medium: "social",
    utm_campaign: null,
    ref_code: "creator_a",
  });
});

test("proxy leaves response cookie untouched when no attribution changes", () => {
  const existing = encodeAttributionCookie({
    utm_source: "tiktok",
    utm_medium: "social",
    utm_campaign: null,
    ref_code: "creator_a",
  });
  const request = new NextRequest("https://example.com/booking", {
    headers: { cookie: `${ATTRIBUTION_COOKIE}=${encodeURIComponent(existing)}` },
  });
  const response = proxy(request);
  assert.equal(response.cookies.get(ATTRIBUTION_COOKIE), undefined);
});
