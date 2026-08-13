import assert from "node:assert/strict";
import test from "node:test";
import { getRuntimeConfig, getWhatsAppNumber } from "../src/lib/config";

const production = {
  VERCEL_ENV: "production",
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_SECRET_KEY: "server-secret",
  RATE_LIMIT_HASH_SECRET: "r".repeat(32),
  BOOKING_NOTIFICATION_WEBHOOK_URL: "https://open.feishu.cn/open-apis/bot/v2/hook/example",
  NEXT_PUBLIC_WHATSAPP_NUMBER: "+60123456789",
};

test("valid production configuration is accepted without requiring E2E secret", () => {
  const config = getRuntimeConfig(production);
  assert.equal(config.whatsappNumber, "+60123456789");
  assert.equal(config.bookingE2ESecret, null);
});

test("production rejects each missing critical configuration value", () => {
  for (const key of [
    "SUPABASE_URL",
    "SUPABASE_SECRET_KEY",
    "RATE_LIMIT_HASH_SECRET",
    "BOOKING_NOTIFICATION_WEBHOOK_URL",
    "NEXT_PUBLIC_WHATSAPP_NUMBER",
  ] as const) {
    assert.throws(() => getRuntimeConfig({ ...production, [key]: undefined }), /CONFIGURATION_INVALID/);
  }
});

test("production rejects invalid service URLs, rate secret, and WhatsApp", () => {
  assert.throws(() => getRuntimeConfig({ ...production, SUPABASE_URL: "http://localhost" }), /CONFIGURATION_INVALID/);
  assert.throws(() => getRuntimeConfig({ ...production, RATE_LIMIT_HASH_SECRET: "short" }), /CONFIGURATION_INVALID/);
  assert.throws(() => getRuntimeConfig({ ...production, BOOKING_NOTIFICATION_WEBHOOK_URL: "https://example.com/hook" }), /CONFIGURATION_INVALID/);
  assert.throws(() => getRuntimeConfig({ ...production, NEXT_PUBLIC_WHATSAPP_NUMBER: "6012-call" }), /CONFIGURATION_INVALID/);
});

test("Preview and local environments disable invalid WhatsApp instead of using a fallback", () => {
  assert.equal(getWhatsAppNumber({ VERCEL_ENV: "preview" }), null);
  assert.equal(getWhatsAppNumber({ VERCEL_ENV: "development", NEXT_PUBLIC_WHATSAPP_NUMBER: "60123456789" }), null);
  assert.equal(getWhatsAppNumber({ VERCEL_ENV: "preview", NEXT_PUBLIC_WHATSAPP_NUMBER: "+60123456789" }), "+60123456789");
});
