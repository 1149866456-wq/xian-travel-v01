import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const e2eSecret = process.env.BOOKING_E2E_SECRET;
const travelDate = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

test.beforeEach(() => {
  test.skip(!e2eSecret, "BOOKING_E2E_SECRET is required for deployed booking acceptance");
});

test("Home to Success preserves attribution and isolates test data", async ({ page, request }, testInfo) => {
  const unique = `${Date.now()}-${testInfo.project.name}`;
  const fullName = `Stability Acceptance ${unique}`;
  const email = `stability.${unique}@example.com`;
  let submittedPayload: Record<string, unknown> | null = null;
  let bookingResponse: Record<string, unknown> | null = null;

  await page.route("**/api/bookings", async (route) => {
    submittedPayload = route.request().postDataJSON() as Record<string, unknown>;
    const response = await route.fetch({
      headers: { ...route.request().headers(), "x-booking-e2e-secret": e2eSecret! },
    });
    bookingResponse = await response.json() as Record<string, unknown>;
    await route.fulfill({ response });
  });

  await page.goto("/?utm_source=tiktok&ref=stability_test", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /Meet ancient Xi'an/i })).toBeVisible();
  await page.getByRole("link", { name: "View Trip", exact: true }).click();
  await expect(page).toHaveURL(/\/trips\/xian-tang-culture-2d1n/);
  await page.getByRole("link", { name: "Contact", exact: true }).first().click();
  await expect(page).toHaveURL(/\/contact$/);
  await page.getByRole("link", { name: "Book Now", exact: true }).click();
  await expect(page).toHaveURL(/\/booking$/);

  await page.locator("#travel_date").fill(travelDate);
  await page.locator("#traveler_count").selectOption("2");
  await page.locator("#full_name").fill(fullName);
  await page.locator("#country").fill("Malaysia");
  await page.locator("#whatsapp").fill("+60123456789");
  await page.locator("#email").fill(email);
  await page.locator("#notes").fill("Automated stability acceptance. This is test data.");
  await page.getByRole("button", { name: "Submit Booking Request", exact: true }).click();

  await expect(page).toHaveURL(/\/booking\/success\?token=/, { timeout: 60_000 });
  await expect(page.getByRole("heading", { name: "Booking Request Submitted", exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(fullName);
  await expect(page.locator("body")).not.toContainText(email);

  expect(bookingResponse).not.toBeNull();
  expect(bookingResponse!.testEvidence).toEqual({
    is_test: true,
    utm_source: "tiktok",
    ref_code: "stability_test",
  });
  expect(submittedPayload).not.toBeNull();

  const duplicate = await request.post("/api/bookings", {
    headers: {
      origin: new URL(testInfo.project.use.baseURL as string).origin,
      "content-type": "application/json",
      "x-booking-e2e-secret": e2eSecret!,
    },
    data: submittedPayload!,
  });
  expect(duplicate.status()).toBe(200);
  expect((await duplicate.json()).duplicated).toBe(true);

  const evidence = {
    base_url: new URL(testInfo.project.use.baseURL as string).origin,
    booking_reference: bookingResponse!.bookingReference,
    travel_date: travelDate,
    project: testInfo.project.name,
    utm_source: "tiktok",
    ref_code: "stability_test",
    is_test: true,
    duplicate_recovered: true,
  };
  await fs.mkdir("test-results", { recursive: true });
  await fs.writeFile(
    path.join("test-results", `booking-evidence-${testInfo.project.name}.json`),
    JSON.stringify(evidence, null, 2),
  );
});

test("booking API rejects abusive request shapes", async ({ request }, testInfo) => {
  const origin = new URL(testInfo.project.use.baseURL as string).origin;
  const oversized = await request.post("/api/bookings", {
    headers: { origin, "content-type": "application/json" },
    data: { notes: "x".repeat(17_000) },
  });
  expect(oversized.status()).toBe(413);

  const wrongType = await request.post("/api/bookings", {
    headers: { origin, "content-type": "text/plain" },
    data: "{}",
  });
  expect(wrongType.status()).toBe(415);

  const honeypot = await request.post("/api/bookings", {
    headers: { origin, "content-type": "application/json" },
    data: {
      travel_date: travelDate,
      traveler_count: 2,
      full_name: "Bot Test",
      country: "Malaysia",
      whatsapp: "+60123456789",
      email: "bot@example.com",
      notes: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      ref_code: null,
      submission_token: crypto.randomUUID(),
      website: "filled-by-bot",
    },
  });
  expect(honeypot.status()).toBe(403);
});
