import { chromium } from "@playwright/test";
import fs from "node:fs/promises";

const baseUrl = process.env.BASE_URL;
if (!baseUrl) throw new Error("BASE_URL is required");

const travelDate = "2026-09-20";
const country = "Malaysia";
const travelers = "2";
const fullName = "Company Migration Acceptance Test";
const email = "company.migration.acceptance@example.com";
const whatsapp = "+60123456789";
const notes = "Company environment migration acceptance test";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

try {
  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
  await page.getByRole("heading", { name: /Meet ancient Xi'an/i }).waitFor();

  await page.getByRole("link", { name: "View Trip", exact: true }).click();
  await page.waitForURL(/\/trips\/xian-tang-culture-2d1n/, { timeout: 30_000 });

  await page.getByRole("complementary").getByRole("link", { name: "Book Now", exact: true }).click();
  await page.waitForURL(/\/booking/, { timeout: 30_000 });

  await page.locator('#travel_date').fill(travelDate);
  await page.locator('#traveler_count').selectOption(travelers);
  await page.locator('#full_name').fill(fullName);
  await page.locator('#country').fill(country);
  await page.locator('#whatsapp').fill(whatsapp);
  await page.locator('#email').fill(email);
  await page.locator('#notes').fill(notes);

  await Promise.all([
    page.waitForURL(/\/booking\/success\?token=/, { timeout: 60_000 }),
    page.getByRole("button", { name: "Submit Booking Request", exact: true }).click(),
  ]);

  await page.getByRole("heading", { name: "Booking Request Submitted", exact: true }).waitFor({ timeout: 30_000 });
  const body = await page.locator("body").innerText();
  const match = body.match(/XAT-\d{8}-[A-Z0-9]{4,12}/);
  if (!match) throw new Error(`Booking Reference not found on Success page. Body: ${body.slice(0, 2000)}`);
  const bookingReference = match[0];

  if (!body.includes(travelDate)) throw new Error(`Success page missing travel date ${travelDate}`);
  if (!body.includes(fullName) || !body.includes(email)) throw new Error("Success page missing submitted contact details");

  await page.screenshot({ path: "final-acceptance-success.png", fullPage: true });
  const result = {
    base_url: baseUrl,
    success_url: page.url(),
    booking_reference: bookingReference,
    travel_date: travelDate,
    traveler_count: Number(travelers),
    country,
    email,
    full_name: fullName,
    notes,
  };
  await fs.writeFile("final-acceptance-result.json", JSON.stringify(result, null, 2));
  console.log(`FINAL_ACCEPTANCE_RESULT=${JSON.stringify(result)}`);
} catch (error) {
  await page.screenshot({ path: "final-acceptance-failure.png", fullPage: true }).catch(() => {});
  throw error;
} finally {
  await browser.close();
}
