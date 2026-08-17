# Tang Atlas Editorial UI Rebuild Design

## Objective

Transform the existing Tang Atlas site from a functional text-and-card demo into an editorial, cultural, premium Xi'an travel brand while preserving the current Next.js, Vercel, Supabase, attribution, and booking-request architecture.

The approved visual direction is **Museum Editorial**: documentary travel photography, an ivory paper base, deep jade surfaces, restrained cinnabar accents, serif-led display typography, modern sans-serif body copy, asymmetric editorial composition, and limited card/shadow usage.

## Global constraints

- Preserve the route and data flow: `Home -> Trip Detail -> Booking -> POST /api/bookings -> Supabase booking_requests -> Success`.
- Do not change the booking payload, database schema, submission token, attribution fields, validation rules, API contract, or environment-variable names.
- Do not add payment, authentication, CRM, multilingual, admin, or other product features.
- Do not change the Vercel deployment architecture, DNS, or production database.
- Do not add a UI component library or upgrade Next.js, React, or other major dependencies.
- Do not introduce or imply a 24-48 hour response SLA.
- Availability, final itinerary, inclusions, price, and payment instructions remain subject to later confirmation.
- Only experiences explicitly confirmed in the final itinerary are product commitments.

## Visual system

### Palette

- Paper: warm ivory for the primary background.
- Ink: near-black brown for headings and body text.
- Jade: deep green for primary actions, dark surfaces, and brand framing.
- Cinnabar: restrained red accent for eyebrows, dividers, and small cultural signals.
- Aged gold: limited secondary accent; never used as a dominant luxury effect.

Avoid gradients as primary page structure, glassmorphism, heavy shadows, excessive red-and-gold decoration, and decorative cultural motifs that resemble a generic Chinese-theme template.

### Typography

- Use a serif display face for large editorial headings and selected pull quotes.
- Use a legible sans-serif face for navigation, body copy, labels, forms, and legal content.
- Load fonts through `next/font` so production does not rely on third-party font requests.
- Maintain a compact display line-height, comfortable body line-height, balanced text wrapping, and readable legal-page measure.

### Layout and components

- Increase the desktop content canvas while preserving consistent mobile gutters.
- Replace repeated equal-weight cards with editorial image/text compositions, bordered information panels, and selective dark surfaces.
- Keep buttons and form controls consistent, keyboard-visible, and at least 44px high.
- Use minimal elevation. Prefer borders, background contrast, spacing, and typography for hierarchy.
- Make the root layout a flex column with `main` growing to fill the viewport so short pages do not leave empty space below the footer.

## Image strategy

- Use real Xi'an and travel photography with clear reuse rights as the primary imagery.
- Prefer locally stored project assets from sources with explicit licenses, such as Wikimedia Commons or Unsplash, and record the creator, source URL, asset URL, and license in `docs/image-sources.md`.
- Do not hotlink production images or rely on remote image availability.
- Use project-owned generated imagery only for a non-factual supporting visual when no suitable licensed image is available; record the generation method and prompt source in the same ledger.
- Every image must have an intentional content role, correct aspect ratio, responsive crop, useful alt text, and no visible watermark or embedded text.
- Optimize large images to WebP/AVIF-sized project assets before committing; do not ship raw multi-megabyte originals.

## Page designs

### Shared header and footer

- Header: calm editorial bar, stronger wordmark treatment, current three destinations retained, and a clear but restrained Book Now action. Keep the complete navigation usable at 390px without adding an unnecessary menu system.
- Footer: dark editorial brand block with short positioning copy, Explore and Information link groups, Contact, Trip, Booking, Privacy, and Terms. Do not add social links or contact details that are not configured.

### Home

- Replace the CSS-only hero card with a strong photographic hero that participates in the story.
- Use an editorial title block, short positioning paragraph, primary View Trip CTA, and secondary Booking Request CTA.
- Follow with an image-led featured journey introduction, a three-part cultural experience narrative, a visual Xi'an mosaic, a concise trust/booking-process explanation, and a final CTA.
- Reduce repeated white cards and let imagery, captions, spacing, and type create hierarchy.

### Trip detail

- Start with a split photographic hero and clear essentials: duration, group size, style, and request-only price status.
- Organize the experience as introduction -> visual -> itinerary -> highlights -> included -> not included -> important information -> booking CTA.
- Present Day 1 and Day 2 as an editorial itinerary with distinct images and timeline cues rather than equal text cards.
- Keep the desktop booking panel sticky and visually prominent. It becomes a normal block after the information sections on mobile.
- Tighten commitments: describe a customized 2D1N final itinerary and curated experiences only when confirmed before payment. Hanfu styling may appear only as conditional or illustrative content, never as a guaranteed inclusion.

### Booking

- Keep the existing form fields and `/api/bookings` submission behavior.
- Use a two-column desktop composition with an image-backed editorial introduction and a clearly grouped form.
- Remove the default `Malaysia` country value to prevent accidental incorrect submissions.
- Keep the native travel-date field, apply English language metadata where supported, and add concise format guidance rather than introducing a date-picker dependency.
- Add Notes guidance prohibiting passport, identity-document, and bank-card information.
- Keep the request-not-payment notice immediately before the CTA.

### Booking success

- Preserve token lookup and dynamic booking data.
- Lead with `Booking Request Submitted` and the exact clarification: `This is a booking request confirmation, not a payment confirmation.`
- Present booking reference, requested travel date, travelers, and contact as a clearly scannable receipt.
- Explain the next step without a response-time promise and render WhatsApp only when a valid public number exists.
- Retain a trustworthy no-token/not-found state without changing route semantics in this UI task.

### Privacy and Terms

- Keep legal pages restrained and readable, with an editorial title band, narrow text measure, section numbering or small labels, and no marketing-heavy layout.
- Privacy must accurately reflect the real booking fields, attribution data, database storage, inquiry management, and sensitive-information warning.
- Terms must preserve request-versus-paid-booking boundaries and traveler responsibilities for passports, visas, insurance, and flights unless expressly included in a confirmed booking.

### Contact

- Use an editorial split layout with one relevant supporting image, concise contact guidance, and either a real WhatsApp action or the current booking-request fallback.
- Do not invent email addresses, phone numbers, operating hours, or response-time promises.

## Responsive behavior

- Validate 1440px desktop, 768px tablet, and 390px mobile as first-class layouts.
- Define deliberate `object-position` values for each hero and itinerary crop.
- Collapse asymmetric grids without changing the semantic reading order.
- Prevent horizontal overflow, clipped navigation, oversized headings, text/image overlap, card overflow, inaccessible CTAs, and large accidental blank regions.
- Long booking references and contact values must wrap safely.

## Accessibility and performance

- Preserve semantic headings, list structure, form labels, error announcements, and keyboard focus rings.
- Provide meaningful alt text for content images and empty alt text only for genuinely decorative imagery.
- Maintain sufficient color contrast and honor reduced-motion preferences.
- Use `next/image` with explicit sizes and responsive `sizes` attributes for project imagery.
- Do not add autoplay video, parallax, or animation required to understand content.

## Verification

- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build:next` independently, then run the aggregate `npm run build` gate.
- Start the production build locally and use agent-browser for all core routes at desktop, tablet, and mobile widths.
- Check horizontal overflow, image loading/cropping, navigation, focus, form grouping, legal readability, footer placement, console errors, failed requests, and static-resource 404s.
- Deploy the verified commit to the existing Vercel Production project.
- Re-run the same browser matrix against Production.
- Submit one real Production booking request, verify the API response and Success page, confirm request-only copy, and check production logs without modifying the booking architecture or production data outside that single acceptance record.

