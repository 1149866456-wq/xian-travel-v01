import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.BASE_URL;
if (!baseUrl) throw new Error("BASE_URL is required");

const travelDate = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const country = "Malaysia";
const travelers = "2";
const utmSource = "tiktok";
const refCode = "final_acceptance";
const unique = Date.now();
const fullName = `Final Acceptance ${unique}`;
const email = `final.acceptance.${unique}@example.com`;
const whatsapp = "+60123456789";
const outputDir = process.env.ACCEPTANCE_OUTPUT_DIR ?? process.cwd();

await fs.mkdir(outputDir, { recursive: true });

async function assertAllImagesLoaded(page, pageName) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(() => window.scrollY === 0);

  const brokenImages = await page.evaluate(() => [...document.images]
    .filter((image) => !image.complete || image.naturalWidth === 0)
    .map((image) => image.src));
  if (brokenImages.length > 0) throw new Error(`${pageName} has broken images: ${brokenImages.join(", ")}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

try {
  await page.goto(`${baseUrl}/?utm_source=${utmSource}&ref=${refCode}`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.getByRole("heading", { name: /Meet ancient Xi'an/i }).waitFor();
  if ((await page.locator("img").count()) < 1) throw new Error("Home page is missing editorial imagery");
  await assertAllImagesLoaded(page, "Home");

  await page.getByRole("link", { name: "View the Trip", exact: true }).click();
  await page.waitForURL(/\/trips\/xian-tang-culture-2d1n/, { timeout: 30_000 });
  let url = new URL(page.url());
  if (url.searchParams.get("utm_source") !== utmSource || url.searchParams.get("ref") !== refCode) {
    throw new Error(`Attribution lost on Trip URL: ${page.url()}`);
  }
  await assertAllImagesLoaded(page, "Trip");

  await page.getByRole("complementary").getByRole("link", { name: "Send a Booking Request", exact: true }).click();
  await page.waitForURL(/\/booking/, { timeout: 30_000 });
  url = new URL(page.url());
  if (url.searchParams.get("utm_source") !== utmSource || url.searchParams.get("ref") !== refCode) {
    throw new Error(`Attribution lost on Booking URL: ${page.url()}`);
  }

  if ((await page.locator("#country").inputValue()) !== "") {
    throw new Error("Country / Region must not be prefilled");
  }
  const notesHelp = await page.locator("#notes-help").innerText();
  if (!notesHelp.includes("passport") || !notesHelp.includes("bank card")) {
    throw new Error("Notes sensitive-information guidance is missing");
  }
  await assertAllImagesLoaded(page, "Booking");

  await page.locator('#travel_date').fill(travelDate);
  await page.locator('#traveler_count').selectOption(travelers);
  await page.locator('#full_name').fill(fullName);
  await page.locator('#country').fill(country);
  await page.locator('#whatsapp').fill(whatsapp);
  await page.locator('#email').fill(email);
  await page.locator('#notes').fill("Automated final acceptance through real Chromium on deployed Vercel production.");

  const [bookingResponse] = await Promise.all([
    page.waitForResponse(
      (response) => new URL(response.url()).pathname === "/api/bookings" && response.request().method() === "POST",
      { timeout: 60_000 },
    ),
    page.waitForURL(/\/booking\/success\?token=/, { timeout: 60_000 }),
    page.getByRole("button", { name: "Submit Booking Request", exact: true }).click(),
  ]);
  const bookingPostStatus = bookingResponse.status();
  if (bookingPostStatus !== 200) throw new Error(`POST /api/bookings returned ${bookingPostStatus}`);

  await page.getByRole("heading", { name: "Booking Request Submitted", exact: true }).waitFor({ timeout: 30_000 });
  await assertAllImagesLoaded(page, "Success");
  const body = await page.locator("body").innerText();
  const match = body.match(/XAT-\d{8}-[A-Z0-9]{4,12}/);
  if (!match) throw new Error(`Booking Reference not found on Success page. Body: ${body.slice(0, 2000)}`);
  const bookingReference = match[0];

  if (!body.includes(travelDate)) throw new Error(`Success page missing travel date ${travelDate}`);
  if (!body.includes(fullName) || !body.includes(email)) throw new Error("Success page missing submitted contact details");
  if (!body.includes("This is a booking request confirmation, not a payment confirmation.")) {
    throw new Error("Success page request/payment clarification is missing");
  }

  await page.screenshot({ path: path.join(outputDir, "final-acceptance-success.png"), fullPage: true });
  const result = {
    base_url: baseUrl,
    success_url: page.url(),
    booking_reference: bookingReference,
    travel_date: travelDate,
    traveler_count: Number(travelers),
    country,
    utm_source: utmSource,
    ref_code: refCode,
    email,
    full_name: fullName,
    booking_post_status: bookingPostStatus,
  };
  await fs.writeFile(path.join(outputDir, "final-acceptance-result.json"), JSON.stringify(result, null, 2));
  console.log(`FINAL_ACCEPTANCE_RESULT=${JSON.stringify(result)}`);
} catch (error) {
  await page.screenshot({ path: path.join(outputDir, "final-acceptance-failure.png"), fullPage: true }).catch(() => {});
  throw error;
} finally {
  await browser.close();
}
