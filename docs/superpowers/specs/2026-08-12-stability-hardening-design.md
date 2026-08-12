# Xi'an Travel V0.1 Stability Hardening Design

**Date:** 2026-08-12  
**Status:** Approved design  
**Repository:** `1149866456-wq/xian-travel-v01`  
**Production Supabase project:** `gcdrbaerwrudbtjilipa`

## 1. Goal and Boundaries

Harden the existing V0.1 booking loop without changing its business scope or architecture:

`Home → Trip Detail → Booking → Next.js Route Handler → Supabase → Success`

The work covers reproducible builds, CI and E2E reliability, production/test separation, abuse protection, bounded inputs, upstream timeouts, security headers, success-link privacy, attribution persistence, booking notifications, structured logs, Supabase schema safety, and dependency audit remediation.

The work does not add payment, authentication, CRM, multi-product commerce, partner dashboards, commission automation, a blog, a redesign, or AI customer service.

## 2. Verified Baseline

The repository is a small Next.js 16 App Router application using React 19, TypeScript, Tailwind CSS, direct server-only Supabase REST calls, GitHub Actions, and a standalone Playwright acceptance script.

The following facts were verified from the repository and live Supabase project:

- There is no `package-lock.json`; both GitHub workflows use `npm install`.
- Node.js 22 is selected in CI but is not declared in `package.json`.
- Browser acceptance uses the fixed date `2026-09-20`, desktop Chromium only, and a fixed production URL.
- Browser acceptance runs only when its workflow or test file changes.
- Test submissions use the production booking path and cannot be distinguished in the database.
- `POST /api/bookings` parses JSON without a body-size limit, origin check, rate limit, or bot trap.
- Validation checks required fields but not bounded lengths or a meaningful WhatsApp format.
- Supabase fetches have no explicit timeout; upstream response bodies can enter thrown errors.
- Writes are idempotent by unique `submission_token`, but booking-reference collision handling can perform additional reads.
- WhatsApp links silently fall back to the placeholder `60123456789`.
- A success token does not expire and the success page displays the submitter's name and full email.
- Attribution survives only through manually decorated links; the global Header and Footer lose it.
- There are no custom `error.tsx`, `global-error.tsx`, or `not-found.tsx` pages.
- `next.config.ts` has no explicit security-header policy.
- Booking creation produces no team notification.
- Live Supabase is `ACTIVE_HEALTHY`, PostgreSQL 17, with five booking rows.
- Existing rows fit the proposed length and WhatsApp constraints.
- `public.booking_requests` has RLS enabled, no policies, and only the expected `rls_enabled_no_policy` INFO advisor. This is intentional for the server-only service-role model.
- The repository migration filename `202608120001_create_booking_requests.sql` does not match the live migration version `20260812062246_create_booking_requests`.
- Supabase security advisors report no warning/error findings; performance advisors report no findings.

## 3. Chosen Approach

Use a repository-contained hardening layer with Supabase-backed atomic rate limiting and Vercel Firewall as defense in depth.

This approach keeps the current Route Handler and server-only Supabase REST architecture. It does not introduce Redis, queues, CAPTCHA services, client-side Supabase, or a monitoring vendor. It provides deterministic behavior in code while documenting the Vercel Firewall rule that must be configured outside the repository.

## 4. Booking Request Pipeline

`POST /api/bookings` will process requests in this order:

1. Require `POST`, `application/json`, and an allowed same-origin request.
2. Reject a declared or actually read body larger than 16 KiB.
3. Derive the client IP from Vercel's overwritten `x-forwarded-for` header. In local tests, inject an explicit test IP through the handler dependency boundary rather than trusting a public header.
4. HMAC the IP with a server-only `RATE_LIMIT_HASH_SECRET`; never store or log the raw IP.
5. Atomically consume one Supabase rate-limit allowance.
6. Reject a filled honeypot field as an abuse request.
7. Parse the JSON into an unknown value, validate its shape, sanitize strings, and enforce field constraints.
8. Authenticate the optional E2E marker using the `x-booking-e2e-secret` header. Ignore any client-supplied `is_test` value and reject unknown privileged fields.
9. Create or recover the booking through the existing `submission_token` idempotency key.
10. Never retry the database write. Safe reads may retry once under the rules in section 8.
11. Skip notifications for test bookings. For real bookings, attempt one Feishu group-robot notification.
12. Return the stable booking reference and time-limited success URL.

The default application limit is 10 booking attempts per HMACed IP per rolling ten-minute bucket. A rejected request returns HTTP 429 with `Retry-After`; logs contain only the event, request ID, hashed rate-limit key prefix, and decision.

## 5. Input Contract

The application and database enforce the same maximum lengths:

| Field | Maximum | Rules |
|---|---:|---|
| `full_name` | 100 | trim; required; reject control characters |
| `country` | 80 | trim; required; reject control characters |
| `whatsapp` | 16 | remove spaces, hyphens, and parentheses; normalize to `+` plus 8–15 digits |
| `email` | 254 | trim; lowercase; existing structural email check; required |
| `notes` | 2,000 | trim; empty becomes `null`; reject control characters except line breaks/tabs |
| `utm_source` | 100 | trim; empty becomes `null` |
| `utm_medium` | 100 | trim; empty becomes `null` |
| `utm_campaign` | 100 | trim; empty becomes `null` |
| `ref_code` | 100 | trim; empty becomes `null` |

`travel_date` remains an ISO calendar date on or after the current UTC date. `traveler_count` remains an integer from two through four. `submission_token` remains a UUID v4. Unknown JSON keys are rejected so privileged flags cannot be smuggled through the payload.

HTML form controls mirror the server limits with `maxLength`, input modes, and autocomplete hints. Server validation remains authoritative.

## 6. Test and Production Separation

The database gains a non-null `is_test boolean default false` column.

Browser acceptance sends `x-booking-e2e-secret`. The server compares it to `BOOKING_E2E_SECRET` with a timing-safe comparison and sets `is_test=true` only after a match. A missing header creates a normal booking; an incorrect non-empty header is rejected. The payload cannot select test mode.

Test bookings:

- remain in the production table as explicit evidence of the real path;
- are clearly filterable by `is_test=true`;
- do not trigger Feishu notifications;
- must be excluded by future CRM, payment, and notification integrations;
- use names, emails, notes, and attribution values that visibly identify automated acceptance data.

The migration adds comments documenting this contract.

## 7. Database Design and Migration Safety

First rename the repository's baseline migration to match the live history version: `20260812062246_create_booking_requests.sql`. Its SQL content remains unchanged. Then generate a later migration for hardening changes.

`public.booking_requests` gains:

- `is_test boolean not null default false`;
- `trip_id text not null default 'xian-tang-culture-2d1n'` for minimal future product compatibility;
- `notification_status text not null default 'PENDING'`, constrained to `PENDING`, `SENT`, `FAILED`, or `SKIPPED`;
- `notification_attempted_at timestamptz`;
- `notification_error_code text` with a short bounded value;
- check constraints matching section 5;
- a partial index for real bookings still requiring operational follow-up, using `created_at` and filtering `is_test=false` plus active booking states;
- a partial index for failed real notifications.

Existing rows receive `is_test=false`, the current trip ID, and a notification status that truthfully indicates legacy notification state without sending retroactive messages.

A non-exposed `private` schema holds a compact rate-limit bucket table keyed by the HMAC digest and bucket start. The table is inaccessible to `anon` and `authenticated`. A narrowly scoped `public.consume_booking_rate_limit(...)` RPC uses `SECURITY INVOKER`, has an explicit empty/controlled `search_path`, and is executable only by `service_role`. Because it executes as `service_role`, no `SECURITY DEFINER` bypass is needed. The operation upserts and returns the allowance decision atomically.

Rate-limit rows are deleted opportunistically during consumption when expired, with bounded cleanup frequency; no scheduler or cron dependency is introduced.

RLS remains enabled on `public.booking_requests` with no anonymous/authenticated policies. The service-role key stays server-only. The `rls_enabled_no_policy` INFO notice is documented as intentional rather than silenced by an unsafe policy.

Before applying the hardening migration, query existing data for constraint compatibility. After applying it, verify columns, constraints, indexes, grants, function execution permissions, RLS state, migration history, and Supabase security/performance advisors.

## 8. Supabase Timeout, Retry, and Error Contract

The Supabase REST wrapper receives a typed request policy:

- booking writes: 8-second timeout, zero automatic retries;
- safe token/rate-limit reads: 5-second timeout, at most one retry;
- retry only network errors, timeouts, HTTP 408, 429, and HTTP 5xx;
- use a short bounded delay and honor a small valid `Retry-After` value;
- never retry non-idempotent writes;
- continue relying on unique `submission_token` for duplicate write recovery.

Upstream response text is never embedded in logs or user responses. Errors are mapped to stable internal codes such as `SUPABASE_TIMEOUT`, `SUPABASE_UNAVAILABLE`, `SUPABASE_REJECTED`, and `SUPABASE_PROTOCOL_ERROR`. The user receives a generic retry/contact message.

The success-page lookup applies the same safe-read policy and treats upstream failure differently from a genuinely missing/expired token so an outage renders a comprehensible error boundary rather than a false "not found" result.

## 9. Feishu Booking Notification

`BOOKING_NOTIFICATION_WEBHOOK_URL` is a server-only Vercel environment variable containing the Feishu group-robot webhook URL.

For each newly created real booking, the server sends one text or interactive-card message containing only:

- booking reference;
- full name;
- country/region;
- travel date;
- traveler count;
- source/referral when present;
- an explicit statement that contact details remain in Supabase.

The webhook payload excludes full email, WhatsApp, notes, submission token, Supabase identifiers, secrets, and raw IP data.

The call has a five-second timeout and no automatic retry to avoid duplicate group messages. A successful Feishu response updates the booking to `SENT`. Failure updates it to `FAILED`, stores a short non-sensitive error code, and emits a structured error log. The booking remains successfully saved and the customer still receives the success page. Duplicate booking submissions do not send another notification.

Test bookings receive `SKIPPED` without calling Feishu. Legacy rows receive `SKIPPED` with a migration comment explaining that no historical notification was attempted.

When `VERCEL_ENV=production`, a prebuild configuration check fails if the webhook is missing or not a valid Feishu webhook URL. Preview and local builds may omit it; runtime logs then report `notification_unconfigured`, and Preview acceptance uses test bookings that intentionally skip notifications.

## 10. WhatsApp Fail-Fast Behavior

Remove all placeholder-number fallbacks. A single server-only configuration helper validates `NEXT_PUBLIC_WHATSAPP_NUMBER` after normalization.

When `VERCEL_ENV=production`, the prebuild check fails if the number is missing or invalid. In local and Preview environments, pages render without a WhatsApp link and show a visible "WhatsApp is temporarily unavailable" contact state. No CTA may point to a fabricated number.

The number remains public by nature because it is placed in `wa.me` links; no secret classification is implied by the `NEXT_PUBLIC_` name.

## 11. Success-Link Privacy

A success token is accepted only when its booking `created_at` is no more than 24 hours old. The token remains unguessable and is never replaced by the booking reference as a lookup credential.

The success page displays only:

- booking reference;
- travel date;
- traveler count;
- next-step guidance;
- WhatsApp CTA only when validly configured.

It no longer displays the customer's name or email. The route exports `noindex, nofollow` metadata and sends `Cache-Control: private, no-store, max-age=0` and `Referrer-Policy: no-referrer`. The global policy also limits referrers, while the success route applies the stricter value.

Expired, malformed, or unknown tokens render the same non-disclosing unavailable-link state.

## 12. First-Party Attribution

Next.js 16 `proxy.ts` captures the first valid `utm_source`, `utm_medium`, `utm_campaign`, and `ref`/`ref_code` values on any page. It stores a bounded JSON attribution object in a 90-day, `HttpOnly`, `Secure` in production, `SameSite=Lax`, first-party cookie.

First-touch attribution wins: later query parameters do not overwrite a complete existing attribution cookie. Missing fields may be filled from a later visit without replacing existing fields. Values use the same 100-character limits and sanitization as booking input.

The Booking page reads the cookie server-side and passes it to the form. The global Header and Footer need no decorated URLs, and existing manually decorated links may remain for shareability but are no longer required for correctness.

Tests cover initial capture, ordinary navigation through Header `Book Now`, cookie persistence, non-overwrite behavior, and final database values.

## 13. Bot and Abuse Defense

The repository-contained protection consists of:

- strict method/content type/origin rules;
- 16 KiB body limit based on both header and actual bytes;
- bounded schema validation and unknown-key rejection;
- an off-screen, accessibility-safe honeypot field;
- HMACed-IP atomic rate limiting;
- unique submission-token idempotency;
- stable 400, 403, 413, 415, 422, and 429 responses without implementation details.

Vercel Firewall is the second layer. Configure a custom rule for method `POST` and path `/api/bookings`, keyed by IP, initially matching the application's 10 requests per 10 minutes. Start in log mode for observation, then publish as rate limiting after confirming ordinary traffic is unaffected. If the account supports managed bot protection, enable it as an independent platform setting; do not claim it is active until verified.

The code does not add BotID or CAPTCHA because these create an additional client integration and product dependency not justified by current traffic or scope.

## 14. Security Headers and Error Pages

`next.config.ts` applies these headers across the site:

- `Content-Security-Policy` restricted to this application, with only the minimum inline allowances required by the current Next.js runtime;
- `Referrer-Policy: strict-origin-when-cross-origin` globally;
- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'`;
- a restrictive `Permissions-Policy` disabling camera, microphone, geolocation, payment, USB, and other unused capabilities;
- a conservative cross-origin resource policy where compatible;
- no obsolete `X-XSS-Protection` header.

The CSP is verified against the built application and both E2E viewports before deployment. It must not block Next.js boot scripts, styles, navigation to WhatsApp, or booking requests.

Add user-facing `error.tsx`, `global-error.tsx`, and `not-found.tsx`. They provide a retry action where meaningful, a Home link, and a validated WhatsApp link or unavailable-contact message. They never render exception messages, stack traces, secrets, or upstream details.

## 15. Structured Monitoring

Use Vercel runtime logs rather than adding a monitoring vendor. Emit one-line JSON events with a generated request ID and duration:

- `booking_submission_started`;
- `booking_validation_failed` with field names only;
- `booking_rate_limited`;
- `booking_created`;
- `booking_duplicate_recovered`;
- `booking_upstream_failed` with stable code;
- `booking_notification_sent`;
- `booking_notification_failed` with stable code.

Logs may include booking reference after creation, `is_test`, HTTP status, duration, and non-sensitive attribution source. Logs must not include full email, full WhatsApp, notes, submission token, webhook URL, Supabase URL/key, E2E secret, raw IP, request body, or Supabase response body.

After Preview deployment, scan Vercel runtime logs for errors from the tested interval and correlate by request/booking reference.

## 16. Reproducible Build and Dependency Security

Declare Node.js 22 in `package.json` `engines`, keep GitHub Actions on Node 22, generate `package-lock.json`, and use `npm ci` everywhere. Add a pinned Playwright test dependency to `devDependencies` instead of installing it ad hoc in CI.

Run both:

- `npm audit --omit=dev` for production reachability;
- `npm audit` for the complete dependency tree.

High and critical findings receive package-by-package analysis. Apply only compatible upgrades proven by the full test/build/E2E suite. Do not run `npm audit fix --force`. Record any deferred finding with package, advisory, dependency path, runtime/dev classification, exploitability in this application, deferral reason, and next action.

Scan tracked files and Git history for recognizable Supabase, Vercel, webhook, and future payment-secret patterns without printing matched secret values.

## 17. CI and Browser Acceptance

The standard GitHub workflow runs on pushes to `main` and pull requests. It uses `npm ci`, then separately runs lint, typecheck, unit/integration tests, and the Next.js build.

Browser acceptance runs when any of these change:

- `src/app/**`;
- `src/components/**`;
- `src/lib/**`;
- `supabase/migrations/**`;
- `tests/**`;
- `package.json` or `package-lock.json`;
- `next.config.ts`;
- the browser workflow itself.

It targets the Vercel Preview corresponding to the current commit, not a fixed production alias. The workflow fails explicitly when the Preview URL or `BOOKING_E2E_SECRET` is unavailable.

Playwright uses a dynamic UTC travel date 30 days in the future and covers the complete route on:

- Desktop Chromium at 1440 × 1000;
- Mobile Chromium using an iPhone-class viewport and touch/mobile context.

WebKit is optional only after the required two profiles are stable; it is not a completion requirement.

Acceptance starts at `/?utm_source=tiktok&ref=stability_test`, navigates through ordinary links including the global Header path, submits, reaches Success, and verifies the resulting database row contains `utm_source=tiktok`, `ref_code=stability_test`, and `is_test=true`. The evidence output masks contact details and never stores the success token.

Additional automated cases verify oversized input, invalid content type/origin, honeypot rejection, rate-limit behavior, idempotent duplicate submission, Supabase timeout/unavailability feedback, expired success links, and security headers.

## 18. Test Strategy

All behavior changes follow red-green-refactor development. Tests use dependency injection at external boundaries and assert user-visible or persisted behavior rather than source text.

Coverage includes:

- every input boundary and normalization rule;
- body-size enforcement with misleading and absent `Content-Length`;
- origin, content type, and honeypot decisions;
- allowed and rejected rate-limit consumption;
- timing-safe E2E secret handling and server-owned `is_test`;
- duplicate submission without duplicate notification;
- Supabase safe-read retry and write non-retry;
- abort timeout mapping;
- Feishu success/failure/timeout/test-skip states;
- WhatsApp production fail-fast and Preview/local disabled CTA;
- success-token 24-hour boundary and PII minimization;
- first-touch attribution cookie behavior;
- desktop and mobile end-to-end booking;
- migration structure and live post-migration verification.

The full local gate is:

```text
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

## 19. Deployment Sequence

1. Work on a non-main isolated branch/worktree.
2. Align the baseline migration filename with live history.
3. Implement and locally verify the hardening migration and application tests.
4. Apply the migration to the linked Supabase project and run post-migration SQL/advisors.
5. Configure Preview environment variables: `BOOKING_E2E_SECRET`, `RATE_LIMIT_HASH_SECRET`, and a valid WhatsApp number. The Feishu webhook may remain absent in Preview because E2E bookings skip notifications, but a separate controlled non-test notification check requires it.
6. Deploy the current commit as a Vercel Preview.
7. Run desktop/mobile acceptance, API abuse cases, database evidence queries, header checks, and runtime-log scan against Preview.
8. Confirm the Feishu webhook with one clearly labelled controlled real-notification test only after the user supplies/configures the webhook URL and authorizes sending that test message.
9. Present Preview evidence and unresolved external settings.
10. Request explicit authorization before promoting the validated artifact or deploying to Production.

Production is never promoted automatically as part of implementation because it changes the behavior of the live booking system.

## 20. External Configuration

The implementation creates code and documentation for these external values/settings but does not fabricate their activation:

- Vercel environment: `BOOKING_NOTIFICATION_WEBHOOK_URL` for Production;
- Vercel environment: `BOOKING_E2E_SECRET` for Preview/CI;
- Vercel environment: `RATE_LIMIT_HASH_SECRET` for Preview and Production;
- Vercel environment: valid `NEXT_PUBLIC_WHATSAPP_NUMBER`;
- GitHub Actions secret: `BOOKING_E2E_SECRET`;
- Vercel Firewall custom rule for `POST /api/bookings`;
- optional managed bot protection if supported by the Vercel plan.

No DNS change is expected.

## 21. Completion Evidence

Completion requires fresh evidence for:

- `package-lock.json` present and `npm ci` successful;
- lint, typecheck, tests, and build successful;
- Desktop Chromium and Mobile Chromium booking flows successful;
- live Supabase migration/history/advisor verification;
- test row persisted with correct attribution and `is_test=true`;
- oversized/invalid/rate-limited requests rejected;
- repeated submission creates no duplicate booking or notification;
- simulated Supabase timeout gives a useful error without a blank page;
- Success hides PII and expired tokens no longer reveal booking data;
- security headers present without browser CSP violations;
- tracked files and Git history contain no detected real secrets;
- runtime dependency audit has no unhandled high/critical finding;
- Preview runtime logs contain no unexpected errors during acceptance.

If live credentials or platform permissions prevent a required check, the result is "阶段完成", not "已完成", and the final report names the single external blocker without claiming the configuration is active.
