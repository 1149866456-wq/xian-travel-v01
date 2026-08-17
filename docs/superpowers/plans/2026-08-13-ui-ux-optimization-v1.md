# Tang Atlas UI/UX Optimization V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing Tang Atlas booking-request experience clearer and more cohesive without changing booking or database behavior.

**Architecture:** Keep the current Next.js App Router routes and Server/Client boundaries. Make local page/component/CSS changes, plus one pure contact-link helper used by Server Components to conditionally render WhatsApp actions.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Node test runner, Playwright/agent-browser, Vercel.

## Global Constraints

- Preserve `Home -> Trip Detail -> Booking -> API -> Supabase -> Success`.
- Do not change the booking payload, database fields, submission token, attribution, validation, API route, or environment-variable names.
- Do not add payment, authentication, CRM, multilingual, blog, or backend features.
- Optimize and inspect 375px, 390px, 430px, 768px, and 1440px layouts.
- Do not invent a 24-48 hour response SLA or unconfirmed product services.

---

### Task 1: Safe contact action

**Files:**
- Create: `src/lib/contact.ts`
- Modify: `src/app/contact/page.tsx`
- Modify: `src/app/booking/success/page.tsx`
- Test: `tests/contact.test.ts`

**Interfaces:**
- Produces: `whatsappHref(number: string | undefined, message?: string): string | null`

- [ ] Write tests proving missing/invalid numbers return `null` and a configured number produces a normalized encoded `wa.me` URL.
- [ ] Run `node --test --import tsx tests/contact.test.ts` and confirm failure because the helper does not exist.
- [ ] Implement the minimal helper and conditionally render WhatsApp or `/contact` actions.
- [ ] Re-run the focused test and the full unit suite.

### Task 2: Copy and information hierarchy

**Files:**
- Modify: `src/app/trips/xian-tang-culture-2d1n/page.tsx`
- Modify: `src/app/booking/page.tsx`
- Modify: `src/components/booking-form.tsx`
- Modify: `src/app/booking/success/page.tsx`
- Modify: `src/app/privacy/page.tsx`
- Modify: `src/app/terms/page.tsx`
- Modify: `src/components/footer.tsx`

**Interfaces:**
- Consumes: the current attribution query and booking form contract unchanged.
- Produces: semantic page headings, lists, request-status copy, and footer navigation.

- [ ] Rebuild the Trip hierarchy around Product Intro, Your Journey, and four scan-friendly information cards.
- [ ] Replace Booking and Success copy with request/not-payment language and `Requested Travel Date`.
- [ ] Expand Privacy and Terms into labeled, natural-English sections.
- [ ] Replace the three-column Footer with brand plus one ordered navigation group.

### Task 3: Shared responsive and accessibility styling

**Files:**
- Modify: `src/app/globals.css`
- Modify: the page/component files in Task 2 only where semantic utility classes are needed.

**Interfaces:**
- Produces: consistent `.container-page`, `.card`, `.button-*`, `.field`, global focus-visible, and mobile overflow behavior.

- [ ] Standardize visual tokens without changing the brand palette.
- [ ] Ensure links/buttons have visible keyboard focus, form errors are announced, and controls meet touch-target requirements.
- [ ] Ensure day and information grids collapse to one column and long contact values wrap.

### Task 4: Build and browser verification

**Files:**
- Modify if needed: `tests/final-browser-acceptance.mjs`
- Create if needed: browser screenshots/results under ignored `.codex_work` only.

**Interfaces:**
- Consumes: existing API/Supabase integration and configured preview environment.
- Produces: command results, viewport screenshots, and one real booking reference.

- [ ] Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` independently.
- [ ] Start the built site and check all required viewport widths for horizontal overflow and content/layout requirements.
- [ ] Create a Vercel Preview deployment.
- [ ] Run Home -> Trip -> Booking -> Submit -> Success against Preview and record the reference.
- [ ] Re-read every requirement and report only verified completion or real gaps.

