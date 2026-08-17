# Tang Atlas UI/UX Optimization V1 Design

## Scope

Optimize the existing Tang Atlas Next.js site without changing its routes, booking payload, API handler, Supabase schema, attribution fields, submission token, or deployment architecture.

## Page design

- Trip detail keeps a two-column desktop hero with the booking card on the right. The product introduction becomes a contained lead block. `Your Journey` introduces two equal day cards; the lower information becomes four clearly separated cards. Mobile collapses all grids to one column.
- Booking keeps the current form fields and submission behavior. Copy explicitly says the form is a request, not a payment, and describes English-speaking support without promising full-service support.
- Success keeps all lookup and booking data behavior. It labels the date as requested, clarifies that neither payment nor reservation is confirmed, and only renders a WhatsApp action when a real public number exists.
- Privacy and Terms use scannable section headings and natural English while preserving the current lightweight legal-page structure.
- Footer becomes a two-zone desktop layout and a single-column mobile layout with one ordered navigation group.

## Visual system

Reuse the warm background, jade brand color, dark text, rounded cards, and generous spacing. Standardize page width, card radius and shadow, focus rings, touch targets, heading line-height, body line-height, and mobile gutters in `globals.css`. Do not add images, dependencies, animations, or a new component library.

## Data flow and error handling

The booking flow remains `Home -> Trip -> Booking -> API -> Supabase -> Success`. A small pure contact helper returns a normalized `wa.me` URL only for a configured phone number; otherwise contact routes and buttons fall back to the internal Contact page or plain contact guidance. API/database behavior remains untouched.

## Verification

- Unit tests cover WhatsApp URL creation and the missing-number branch.
- Existing booking and attribution tests remain green.
- Run lint, typecheck, test, and production build.
- Browser-check 375, 390, 430, 768, and 1440 widths for overflow, hierarchy, focus, touch targets, and responsive stacking.
- Exercise the deployed Home -> Trip -> Booking -> Submit -> Success path and verify the returned booking reference and submitted details.

