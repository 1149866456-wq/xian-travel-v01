# Tang Atlas Editorial UI Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved Museum Editorial UI across Tang Atlas, with licensed local photography, complete responsive behavior, unchanged booking infrastructure, and verified Vercel Production deployment.

**Architecture:** Keep the existing Next.js App Router routes and Server/Client boundaries. Add optimized local image assets, apply one shared typography/token system through the root layout and global CSS, and rebuild each page with semantic JSX while preserving attribution propagation, the booking form payload, `/api/bookings`, Supabase, and success-token lookup.

**Tech Stack:** Next.js 16.2.11, React 19.2.0, TypeScript 5.9, Tailwind CSS 4, `next/font`, `next/image`, Node test runner, agent-browser/Playwright verification, GitHub, Vercel.

## Global Constraints

- Preserve `Home -> Trip Detail -> Booking -> POST /api/bookings -> Supabase booking_requests -> Success`.
- Do not change the booking payload, database schema, submission token, attribution fields, validation rules, API contract, or environment-variable names.
- Do not add payment, authentication, CRM, multilingual, admin, or other product features.
- Do not change the Vercel deployment architecture, DNS, or production database.
- Do not add a UI component library or upgrade Next.js, React, or other major dependencies.
- Do not introduce or imply a 24-48 hour response SLA.
- Availability, final itinerary, inclusions, price, and payment instructions remain subject to later confirmation.
- Only experiences explicitly confirmed in the final itinerary are product commitments.
- Use real, locally stored Xi'an photography with a verified license ledger; do not hotlink production images.
- Validate 1440px desktop, 768px tablet, and 390px mobile.
- Keep all navigation and primary controls keyboard-visible and at least 44px high.
- Work in the current repository and preserve all user changes; do not reset, reinitialize, or clean unrelated files.

---

## File map

**Create**

- `public/images/tang-atlas/xian-city-wall-hero.webp` — ultra-wide city-wall hero.
- `public/images/tang-atlas/giant-wild-goose-pagoda.webp` — Tang-era architectural anchor.
- `public/images/tang-atlas/xian-muslim-quarter.webp` — street and city-life visual.
- `public/images/tang-atlas/xian-yangrou-paomo.webp` — local food visual.
- `public/images/tang-atlas/xian-roujiamo.webp` — secondary local food visual.
- `public/images/tang-atlas/tang-sancai-woman.webp` — Tang aesthetics and material-culture visual.
- `public/images/tang-atlas/dacien-temple.webp` — Contact and closing visual.
- `docs/image-sources.md` — creator, source, license, and transformation ledger.
- `tests/assets.test.ts` — local WebP and attribution contract.

**Modify**

- `src/app/layout.tsx` — font variables and full-height application shell.
- `src/app/globals.css` — Museum Editorial tokens and shared primitives.
- `src/components/header.tsx` — responsive editorial header.
- `src/components/footer.tsx` — complete brand and navigation footer.
- `src/app/page.tsx` — image-led Home page.
- `src/app/trips/xian-tang-culture-2d1n/page.tsx` — photographic trip hierarchy and itinerary.
- `src/app/booking/page.tsx` — editorial booking introduction.
- `src/components/booking-form.tsx` — grouped form UI, empty country, Notes warning.
- `src/app/booking/success/page.tsx` — receipt hierarchy and exact request-confirmation copy.
- `src/app/privacy/page.tsx` — accurate, readable database/privacy copy.
- `src/app/terms/page.tsx` — editorial legal hierarchy without expanded liability.
- `src/app/contact/page.tsx` — image-led contact/fallback composition.
- `tests/final-browser-acceptance.mjs` — current visual and booking assertions.

---

### Task 1: Licensed local image assets and attribution contract

**Files:**

- Create: `public/images/tang-atlas/*.webp`
- Create: `docs/image-sources.md`
- Create: `tests/assets.test.ts`

**Interfaces:**

- Produces: stable public paths under `/images/tang-atlas/` consumed by all page tasks.
- Produces: `docs/image-sources.md` as the license authority for every committed photograph.

- [ ] **Step 1: Write the failing asset contract test**

Create `tests/assets.test.ts` with the exact asset list and assertions below:

```ts
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const assets = [
  "xian-city-wall-hero.webp",
  "giant-wild-goose-pagoda.webp",
  "xian-muslim-quarter.webp",
  "xian-yangrou-paomo.webp",
  "xian-roujiamo.webp",
  "tang-sancai-woman.webp",
  "dacien-temple.webp",
];

test("editorial image assets are optimized local WebP files", async () => {
  for (const asset of assets) {
    const path = `public/images/tang-atlas/${asset}`;
    const bytes = await readFile(path);
    const metadata = await stat(path);

    assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP");
    assert.ok(metadata.size >= 20_000, `${asset} is unexpectedly small`);
    assert.ok(metadata.size <= 900_000, `${asset} is too large for the site`);
  }
});
```

- [ ] **Step 2: Run the asset test and verify it fails**

Run:

```powershell
npm test -- --test-name-pattern="editorial image assets"
```

Expected: FAIL because `docs/image-sources.md` and the WebP files do not exist.

- [ ] **Step 3: Download only these verified originals to a task-local temporary directory**

Use the following exact sources and retain all attribution fields in the ledger:

| Output | Commons file page | Original | Creator | License |
|---|---|---|---|---|
| `xian-city-wall-hero.webp` | `https://commons.wikimedia.org/wiki/File:1_xian_city_wall_2011.jpg` | `https://upload.wikimedia.org/wikipedia/commons/e/ef/1_xian_city_wall_2011.jpg` | chensiyuan | CC BY-SA 4.0 International |
| `giant-wild-goose-pagoda.webp` | `https://commons.wikimedia.org/wiki/File:2015-09-23-120348_-_Grosse_Wildgans_Pagode.jpg` | `https://upload.wikimedia.org/wikipedia/commons/3/38/2015-09-23-120348_-_Grosse_Wildgans_Pagode.jpg` | Zossolino | CC BY-SA 4.0 International |
| `xian-muslim-quarter.webp` | `https://commons.wikimedia.org/wiki/File:Xi%27an_Muslim_Quarter.jpg` | `https://upload.wikimedia.org/wikipedia/commons/7/76/Xi%27an_Muslim_Quarter.jpg` | Qianeal | CC BY-SA 4.0 International |
| `xian-yangrou-paomo.webp` | `https://commons.wikimedia.org/wiki/File:%E7%BE%8A%E8%82%89%E6%B3%A1%E9%A6%8D%EF%BC%88xi%E2%80%99an%EF%BC%89.jpg` | `https://upload.wikimedia.org/wikipedia/commons/1/18/%E7%BE%8A%E8%82%89%E6%B3%A1%E9%A6%8D%EF%BC%88xi%E2%80%99an%EF%BC%89.jpg` | Sandykkzk | CC BY-SA 4.0 International |
| `xian-roujiamo.webp` | `https://commons.wikimedia.org/wiki/File:Xi%27an_roujiamo_03.jpg` | `https://upload.wikimedia.org/wikipedia/commons/e/e3/Xi%27an_roujiamo_03.jpg` | KQuhen | CC BY-SA 4.0 International |
| `tang-sancai-woman.webp` | `https://commons.wikimedia.org/wiki/File:Sancai_woman_statue,_shaanxi_history_museum.jpg` | `https://upload.wikimedia.org/wikipedia/commons/e/e6/Sancai_woman_statue%2C_shaanxi_history_museum.jpg` | Deadkid dk | CC BY-SA 3.0 Unported |
| `dacien-temple.webp` | `https://commons.wikimedia.org/wiki/File:2015-01-04_Daci%27en_Temple.jpg` | `https://upload.wikimedia.org/wikipedia/commons/4/44/2015-01-04_Daci%27en_Temple.jpg` | Jan Bockaert | CC BY-SA 2.0 Generic |

Download into `D:\Program\Documents\第一阶段项目制作\.codex-tmp\tang-atlas-images\originals`; never commit the originals.

- [ ] **Step 4: Convert the originals to optimized WebP assets**

Use the bundled Python runtime and Pillow. Resize proportionally without enlarging, preserve sRGB, and save with `quality=84`, `method=6`. Use these maximum long edges:

```text
xian-city-wall-hero.webp       2400px
giant-wild-goose-pagoda.webp  1800px
xian-muslim-quarter.webp      1800px
xian-yangrou-paomo.webp       1600px
xian-roujiamo.webp            1400px
tang-sancai-woman.webp        1400px
dacien-temple.webp            1800px
```

Inspect all seven outputs with the local image viewer. Reject any corrupt, watermarked, or visibly poor conversion before continuing.

- [ ] **Step 5: Write the attribution ledger**

Create `docs/image-sources.md` with one section per output file containing:

```markdown
## xian-city-wall-hero.webp

- Subject: Xi'an city wall
- Creator: chensiyuan
- Source page: https://commons.wikimedia.org/wiki/File:1_xian_city_wall_2011.jpg
- Original asset: https://upload.wikimedia.org/wikipedia/commons/e/ef/1_xian_city_wall_2011.jpg
- License: CC BY-SA 4.0 International
- Changes: resized and converted to WebP; responsive crop is applied in CSS.
```

Repeat with the exact creator, source, asset, and license values from Step 3. Add a lead paragraph stating that the image derivatives retain their source licenses. Manually verify that all seven output filenames and licenses are present; this is a documentation review, not an automated source-text test.

- [ ] **Step 6: Re-run the asset test**

Run:

```powershell
npm test -- --test-name-pattern="editorial image assets"
```

Expected: PASS.

- [ ] **Step 7: Commit the asset task**

```powershell
git add -- public/images/tang-atlas docs/image-sources.md tests/assets.test.ts
git commit -m "feat: add licensed Tang Atlas travel imagery"
```

---

### Task 2: Shared Museum Editorial shell

**Files:**

- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/components/header.tsx`
- Modify: `src/components/footer.tsx`

**Interfaces:**

- Produces: `--font-display`, `--font-sans`, color tokens, layout primitives, buttons, form fields, image frames, legal layout, and a full-height page shell.
- Consumes: existing routes only; no new navigation destinations.

- [ ] **Step 1: Configure self-hosted build output through `next/font`**

In `src/app/layout.tsx`, import `Cormorant_Garamond` and `Inter` from `next/font/google` and configure:

```ts
const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sansFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
```

Apply both variables to `<body>` and preserve the current metadata, Header, main content, and Footer order.

- [ ] **Step 2: Replace the shared visual tokens and primitives**

Use these exact core tokens in `src/app/globals.css`:

```css
:root {
  --ink: #1d1a16;
  --muted: #6d655b;
  --paper: #f6f1e8;
  --paper-deep: #eadfce;
  --surface: #fffdf8;
  --jade: #245f51;
  --jade-dark: #153d34;
  --cinnabar: #a24030;
  --gold: #b58a4a;
  --line: rgba(29, 26, 22, 0.14);
  --card-radius: 20px;
  --card-shadow: 0 18px 48px rgba(50, 39, 24, 0.08);
  --section-space: clamp(4.5rem, 8vw, 7.5rem);
}
```

Set `html`, `body`, and the application shell to full height; set `body` to a flex column and `main` to `flex: 1`. Use `var(--font-sans)` for body and `var(--font-display)` for `.display-title` and selected headings. Keep focus-visible, reduced-motion, `.container-page`, `.eyebrow`, `.button-primary`, `.button-secondary`, `.card`, and `.field` interfaces stable while restyling them.

Add focused primitives for `.section-space`, `.display-title`, `.editorial-rule`, `.image-frame`, `.image-caption`, `.legal-page`, and `.legal-section`. Do not add animation beyond hover/focus transitions.

- [ ] **Step 3: Rebuild the Header without a new client menu**

Keep links to Trip, Contact, and Booking. Use a two-line-capable wordmark treatment only on wider screens, preserve a compact `Tang Atlas` label at 390px, and keep every destination visible without a hamburger.

Required behavior:

```text
1440px: wordmark left; Trip, Contact, Booking Request right.
768px: same navigation with reduced gaps.
390px: Tang Atlas, Trip, Contact, Book Now all fit without horizontal scroll.
```

- [ ] **Step 4: Rebuild the Footer as two link groups**

Render brand copy plus:

```ts
const exploreLinks = [
  { href: "/trips/xian-tang-culture-2d1n", label: "Xi'an Tang Culture 2D1N" },
  { href: "/booking", label: "Booking Request" },
  { href: "/contact", label: "Contact" },
];

const informationLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];
```

Use a three-column desktop footer and one-column mobile footer. Do not add unconfigured email, telephone, social, or office-hour claims.

- [ ] **Step 5: Verify the shared shell**

Run:

```powershell
npm run lint
npm run typecheck
```

Expected: both commands pass with zero warnings/errors.

- [ ] **Step 6: Commit the shell task**

```powershell
git add -- src/app/layout.tsx src/app/globals.css src/components/header.tsx src/components/footer.tsx
git commit -m "feat: establish Tang Atlas editorial design system"
```

---

### Task 3: Image-led Home page

**Files:**

- Modify: `src/app/page.tsx`

**Interfaces:**

- Consumes: existing `readAttribution()` and `attributionQuery()` unchanged.
- Consumes: local paths from Task 1 and shared classes from Task 2.
- Produces: the current attribution-preserving Trip and Booking links.

- [ ] **Step 1: Rebuild the hero and retain the current H1**

Import `Image` from `next/image`. Keep the H1 text:

```text
Meet ancient Xi'an with a modern traveler's pace.
```

Create a desktop split hero with editorial copy on the left and `xian-city-wall-hero.webp` on the right. Use `priority`, explicit `sizes`, `object-fit: cover`, and `object-position: 50% 45%`. On 390px, place the copy first and the image second with a controlled 4:5 crop.

Keep CTA destinations and attribution query propagation unchanged. Label the secondary CTA `Send a Booking Request` rather than implying direct confirmation.

- [ ] **Step 2: Build the featured-journey story**

Use `giant-wild-goose-pagoda.webp` with an editorial text block containing:

```text
Xi'an Tang Culture 2D1N Experience
History without rushing, cultural context without a lecture-room pace, and practical support for international guests.
```

Keep `Confirmed before payment` as status text, not a price amount.

- [ ] **Step 3: Build the cultural experience sequence**

Create three numbered narrative items without three equal white cards:

```text
01 — Read the old capital through walls, streets, and surviving landmarks.
02 — Meet Tang aesthetics through stories, material culture, and experiences confirmed in the final itinerary.
03 — Taste Xi'an through local food moments and a small-group pace.
```

Use `tang-sancai-woman.webp` and `xian-yangrou-paomo.webp` as content images with accurate alt text.

- [ ] **Step 4: Add a visual Xi'an mosaic and booking process**

Use `xian-muslim-quarter.webp`, `xian-roujiamo.webp`, and `dacien-temple.webp`. Add a three-step request process:

```text
Send your request -> We review date and availability -> We confirm itinerary, inclusions, price, and payment instructions
```

Do not state a response time.

- [ ] **Step 5: Verify Home locally at the component level**

Run:

```powershell
npm run lint
npm run typecheck
```

Expected: both pass. Inspect the file to confirm every booking/trip link still appends `query`.

- [ ] **Step 6: Commit the Home task**

```powershell
git add -- src/app/page.tsx
git commit -m "feat: rebuild Tang Atlas home as an editorial journey"
```

---

### Task 4: Trip detail editorial itinerary

**Files:**

- Modify: `src/app/trips/xian-tang-culture-2d1n/page.tsx`

**Interfaces:**

- Consumes: existing attribution helpers unchanged.
- Produces: the same `/booking${query}` CTA and no new product promise.

- [ ] **Step 1: Tighten the trip information contract**

Use these exact arrays:

```ts
const tripInformation = {
  highlights: [
    "Tang-inspired cultural immersion",
    "Xi'an city heritage and old-capital context",
    "Local food experiences",
    "A small-group pace for 2–4 travelers",
  ],
  included: [
    "A customized 2D1N final itinerary, confirmed before payment",
    "Curated experiences explicitly confirmed in your final itinerary",
    "Local coordination for the experiences confirmed in your final itinerary",
  ],
  excluded: [
    "International or domestic flights",
    "Visa costs",
    "Personal shopping",
    "Anything not expressly confirmed in your final booking",
  ],
  important: [
    "Designed for 2–4 travelers.",
    "Your final itinerary is customized for your travel date and confirmed availability.",
    "Price and payment instructions are confirmed before payment.",
    "Submitting a booking request does not create a paid or confirmed booking.",
  ],
};
```

Do not list Hanfu styling as an inclusion. It may be mentioned only as an example of an experience that would require final-itinerary confirmation.

- [ ] **Step 2: Build the photographic hero and essentials**

Use `giant-wild-goose-pagoda.webp` as the hero and retain the Trip H1. Present Duration, Group size, Style, and `Price confirmed before payment` as unequal editorial facts rather than four identical cards.

- [ ] **Step 3: Build the Day 1 / Day 2 itinerary**

Render semantic `<article>` blocks in reading order:

```text
Day 1 — Arrive, orient, enter the old capital
Day 2 — Tang culture in living detail
```

Use `xian-city-wall-hero.webp` for Day 1 and `tang-sancai-woman.webp` for Day 2. On desktop alternate image/text alignment; on mobile keep Day 1 before Day 2 and each image before its corresponding copy.

- [ ] **Step 4: Rebuild highlights and practical information**

Use one image-led Highlights band with `xian-yangrou-paomo.webp`, followed by compact Included, Not Included, and Important Information panels. Preserve semantic headings and lists.

Keep the booking card as an `<aside aria-labelledby="booking-title">`, sticky at desktop and normal-flow after content on mobile. Preserve the exact request-only disclaimer.

- [ ] **Step 5: Verify and commit the Trip task**

Run:

```powershell
npm run lint
npm run typecheck
```

Expected: pass.

```powershell
git add -- src/app/trips/xian-tang-culture-2d1n/page.tsx
git commit -m "feat: turn trip detail into an editorial itinerary"
```

---

### Task 5: Booking and Success conversion experience

**Files:**

- Modify: `src/app/booking/page.tsx`
- Modify: `src/components/booking-form.tsx`
- Modify: `src/app/booking/success/page.tsx`

**Interfaces:**

- Consumes: existing `BookingInput`, attribution object, `fetch("/api/bookings")`, returned `successUrl`, and `findBySubmissionToken()` unchanged.
- Produces: the same form field names and submission payload.

- [ ] **Step 1: Rebuild the Booking page introduction**

Use `xian-muslim-quarter.webp` as the supporting visual and retain the current route/page component boundary. Use the copy:

```text
Tell us your preferred date and contact details. We'll review availability for your travel date and confirm your final itinerary and pricing before any payment is requested.
```

Use `English-first communication during the booking process`; do not claim full English support throughout the trip unless confirmed.

- [ ] **Step 2: Improve the form without changing its data contract**

Keep every `name`, input type, validation/error ID, `FormData` mapping, UUID token, request body, and redirect unchanged.

Make these exact UI changes:

```tsx
<input id="travel_date" name="travel_date" type="date" lang="en" required ... />
<p className="field-help">Choose your preferred date; the displayed format follows your device.</p>

<input id="country" name="country" autoComplete="country-name" required ... />

<p id="notes-help" className="field-help">
  Optional: dietary needs, room preferences, or arrival details. Please do not include passport details, ID documents, or bank card information.
</p>
```

Remove `defaultValue="Malaysia"`. Connect Notes to `notes-help` with `aria-describedby`. Keep the request-not-payment notice immediately before `Submit Booking Request`.

- [ ] **Step 3: Rebuild the Success receipt**

Keep token parsing, lookup, no-token state, WhatsApp normalization, booking details, and dynamic rendering unchanged.

Use the exact lead copy:

```text
Booking Request Submitted
This is a booking request confirmation, not a payment confirmation.
We'll review availability for your travel date, confirm what can be included in your final itinerary, and then contact you with pricing and next steps.
```

Use this exact next-step copy:

```text
We'll review your request and check what's available for your preferred date. If you follow up, please share your booking reference so we can match your request quickly.
```

Do not add a 24-48 hour promise.

- [ ] **Step 4: Run booking regression tests**

Run:

```powershell
npm run lint
npm run typecheck
npm test
```

Expected: zero lint/type errors and all existing plus asset tests pass.

- [ ] **Step 5: Commit the Booking task**

```powershell
git add -- src/app/booking/page.tsx src/components/booking-form.tsx src/app/booking/success/page.tsx
git commit -m "feat: refine booking request and success UX"
```

---

### Task 6: Privacy, Terms, and Contact presentation

**Files:**

- Modify: `src/app/privacy/page.tsx`
- Modify: `src/app/terms/page.tsx`
- Modify: `src/app/contact/page.tsx`

**Interfaces:**

- Consumes: `whatsappHref()` and existing contact fallback unchanged.
- Produces: accurate legal and contact UI without new data collection.

- [ ] **Step 1: Apply the shared legal layout to Privacy**

Keep four sections and use this exact factual language for the data-specific paragraphs:

```text
When you send a booking request, we collect the contact details you provide, your requested travel date, traveler count, and any travel preferences or trip details you choose to share in Notes. We may also collect attribution details such as UTM parameters or a referral code.

Booking requests are stored in our database so we can respond to and manage your inquiry. A booking request is not a payment and does not create a confirmed reservation.

Please do not submit passport details, ID documents, bank card information, or other sensitive personal or financial information through Notes.
```

Do not add cookies, retention periods, processors, or rights not established by the project.

- [ ] **Step 2: Apply the shared legal layout to Terms**

Retain the existing three responsibility sections and their meaning. Keep:

```text
Submitting a booking request is an inquiry only. It does not create a paid booking and does not mean that payment has been made or successfully received.

Availability, the final itinerary, inclusions, price, and payment instructions will be confirmed with you before any payment is requested.

Travelers are responsible for their own passports, visas, insurance and flights unless these are expressly included in the confirmed booking.
```

- [ ] **Step 3: Rebuild Contact with a licensed local image**

Use `dacien-temple.webp` in a split composition. Preserve conditional behavior:

```text
valid NEXT_PUBLIC_WHATSAPP_NUMBER -> external Chat on WhatsApp action
missing/invalid number -> internal Send Booking Request action
```

Do not add an email address, phone number, operating hours, or response SLA.

- [ ] **Step 4: Verify and commit legal/contact pages**

Run:

```powershell
npm run lint
npm run typecheck
npm test
```

Expected: pass.

```powershell
git add -- src/app/privacy/page.tsx src/app/terms/page.tsx src/app/contact/page.tsx
git commit -m "feat: polish Tang Atlas legal and contact pages"
```

---

### Task 7: Local production build and browser acceptance

**Files:**

- Modify: `tests/final-browser-acceptance.mjs`
- Create outside repository: `D:\Program\Documents\第一阶段项目制作\.codex-tmp\tang-atlas-ui-after-local\*`

**Interfaces:**

- Consumes: built Next.js app and existing environment variables.
- Produces: local desktop/tablet/mobile screenshots, console/network reports, and a booking-flow acceptance result.

- [ ] **Step 1: Update the existing final acceptance script**

Replace the fixed date with a date 120 days ahead:

```js
const travelDate = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
```

Add these assertions before filling the form:

```js
if ((await page.locator("img").count()) < 1) throw new Error("Home page is missing editorial imagery");

await page.goto(`${baseUrl}/booking`, { waitUntil: "networkidle", timeout: 60_000 });
if ((await page.locator("#country").inputValue()) !== "") {
  throw new Error("Country / Region must not be prefilled");
}
const notesHelp = await page.locator("#notes-help").innerText();
if (!notesHelp.includes("passport") || !notesHelp.includes("bank card")) {
  throw new Error("Notes sensitive-information guidance is missing");
}
```

After success, assert:

```js
if (!body.includes("This is a booking request confirmation, not a payment confirmation.")) {
  throw new Error("Success page request/payment clarification is missing");
}
```

Preserve attribution checks and booking-reference checks.

- [ ] **Step 2: Run all static and build gates independently**

Run exactly:

```powershell
npm run lint
npm run typecheck
npm test
npm run build:next
npm run build
```

Expected: every command exits 0. Record the test count and Next.js route/build summary.

- [ ] **Step 3: Start the production build locally**

Run `npm run start` in a persistent terminal session with the real local environment already configured. Verify `http://127.0.0.1:3000` returns 200 before browser checks.

- [ ] **Step 4: Run agent-browser across all routes and viewports**

Check these routes:

```text
/
/trips/xian-tang-culture-2d1n
/booking
/booking/success
/privacy
/terms
/contact
```

Check these viewports:

```text
1440 x 1000
768 x 1000
390 x 844
```

For every route/viewport, save a full-page screenshot and record:

```js
({
  title: document.title,
  horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  imageCount: document.images.length,
  brokenImages: [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src),
})
```

Inspect console errors, failed requests, image crops, navigation, headings, itinerary order, form grouping, legal measure, CTA visibility, long-value wrapping, and footer placement.

- [ ] **Step 5: Run one local booking flow if the local Supabase environment is configured**

Use the existing acceptance script or agent-browser. Confirm POST `/api/bookings` returns 200, Success renders the submitted date/contact/reference, and the exact not-payment clarification is visible. If local Supabase is intentionally unavailable, do not change environment or repository code; reserve the real submission for Production in Task 8.

- [ ] **Step 6: Fix any browser regression and repeat the complete affected matrix**

Make only scope-linked fixes. Re-run lint, typecheck, tests, build, and the affected desktop/tablet/mobile browser checks after the final fix.

- [ ] **Step 7: Commit verification-script changes**

```powershell
git add -- tests/final-browser-acceptance.mjs
git commit -m "test: extend Tang Atlas production acceptance"
```

---

### Task 8: Production deployment and final acceptance

**Files:**

- No source changes unless Production exposes a deployment-specific UI bug.
- Create outside repository: `D:\Program\Documents\第一阶段项目制作\.codex-tmp\tang-atlas-ui-after-production\*`

**Interfaces:**

- Consumes: the verified final commit on `main` and the existing GitHub/Vercel integration.
- Produces: the current Vercel Production deployment at `https://xian-travel-v0111.vercel.app`.

- [ ] **Step 1: Review the complete branch diff**

Run:

```powershell
git status --short --branch
git diff 4c1318ba578c521a81532a2d7a4b0c0a5e1b1a3e...HEAD --stat
git diff --check 4c1318ba578c521a81532a2d7a4b0c0a5e1b1a3e...HEAD
```

Confirm there are no unrelated changes and no `.codex-tmp` artifacts staged.

- [ ] **Step 2: Push the verified `main` commit**

Push `main` to `origin` and record the exact commit SHA:

```powershell
git push origin main
git rev-parse HEAD
```

The existing GitHub/Vercel integration should create the Production deployment for the project serving `xian-travel-v0111.vercel.app`. Do not relink or deploy the separate `xian-travel-v01` project.

- [ ] **Step 3: Wait for and identify the new Production deployment**

Use the existing Vercel account/browser session or Vercel deployment API. Record deployment ID, source commit, state, environment, project, created time, and the current alias. Do not report success until state is `READY` and the production alias resolves to the new deployment.

- [ ] **Step 4: Verify HTTP/TLS and all core routes**

Request the Production URL and all core routes. Record status, redirect behavior, content type, and failed static resources. Confirm HTTPS is valid and no route returns a blocking 4xx/5xx.

- [ ] **Step 5: Repeat the full Production browser matrix**

Use agent-browser at 1440x1000, 768x1000, and 390x844. Save full-page screenshots for Home, Trip, Booking, Success/no-token, Privacy, Terms, and Contact. Confirm no horizontal overflow, broken images, core console errors, failed requests, or footer blank tail.

- [ ] **Step 6: Submit one real Production booking request**

Use a future date and unique acceptance identity. Follow Home -> Trip -> Booking -> POST `/api/bookings` -> Success. Record:

```text
booking reference
success token/URL
requested travel date
traveler count
HTTP status for POST /api/bookings
visible request-not-payment confirmation
```

Do not delete or alter any production booking data.

- [ ] **Step 7: Inspect production logs and deployment health**

Check Vercel runtime/build logs after the browser and booking flow. Confirm there is no sustained core error, booking API 5xx, image 404, or Server Component failure.

- [ ] **Step 8: Final verification gate**

Re-run locally against the exact deployed commit:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
git status --short --branch
```

Only report `完成并可验收` when every Production requirement and this final gate passes.
