# Xi'an Travel V0.1 Stability Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the existing booking flow for reproducible builds, bounded and abuse-resistant submissions, safe Supabase behavior, test-data isolation, reliable Feishu notification, privacy-preserving success links, durable attribution, and Preview-verified desktop/mobile acceptance.

**Architecture:** Keep the current Next.js Route Handler and server-only Supabase REST design. Introduce small domain, request-guard, configuration, notification, logging, and attribution boundaries so external behavior can be tested without live services; persist schema protections and fixed-window rate limiting through additive Supabase migrations; use Vercel Preview plus Supabase evidence for final verification.

**Tech Stack:** Next.js 16.2.11, React 19.2, TypeScript 5.9, Node.js 22, Supabase PostgreSQL 17/REST, GitHub Actions, Playwright 1.54.2, Vercel.

## Global Constraints

- Continue from the existing repository; do not reinitialize, rewrite the architecture, or redesign the site.
- Keep Supabase access server-only; never expose `SUPABASE_SECRET_KEY` or add anonymous/authenticated booking policies.
- Every database schema change must be migration-backed and verified against project `gcdrbaerwrudbtjilipa`.
- Database writes and rate-limit consumption receive zero automatic retries; only safe reads may retry once.
- Test bookings must persist with `is_test=true` and must not notify Feishu.
- Production booking notification uses a Feishu group-robot webhook; do not invent or print its URL.
- Production must fail fast for missing/invalid WhatsApp, notification webhook, rate-limit hash secret, or Supabase configuration.
- Never log full email, full WhatsApp, notes, submission token, webhook URL, Supabase credentials/response body, E2E secret, or raw IP.
- Do not use `npm audit fix --force`.
- Required final commands are `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, Desktop Chromium E2E, and Mobile Chromium E2E.
- Validate a Vercel Preview before requesting separate authorization for Production promotion.

---

## File Responsibility Map

- `src/lib/booking.ts`: canonical booking types, limits, parsing, sanitization, and validation.
- `src/lib/request-guard.ts`: origin/content-type/body-size/honeypot/E2E-secret/IP-HMAC decisions.
- `src/lib/supabase-rest.ts`: bounded Supabase REST transport, read retry policy, booking/rate-limit/status operations.
- `src/lib/booking-service.ts`: idempotent booking creation and collision recovery only.
- `src/lib/booking-notification.ts`: Feishu payload, timeout, result mapping, and notification-state orchestration.
- `src/lib/config.ts`: environment parsing and WhatsApp/Feishu/Supabase/rate-limit configuration rules.
- `src/lib/log.ts`: allowlisted structured booking events.
- `src/lib/attribution.ts`: query parsing, first-touch merge, cookie encode/decode, and bounds.
- `src/app/api/bookings/route.ts`: thin HTTP orchestration with injectable external dependencies.
- `src/proxy.ts`: first-party attribution capture.
- `src/app/booking/page.tsx`: reads the attribution cookie and supplies it to the form.
- `src/components/booking-form.tsx`: bounded form controls and honeypot; keeps current API submission flow.
- `src/app/booking/success/page.tsx`: 24-hour token lookup and minimal non-PII result.
- `src/components/contact-cta.tsx`: shared valid-WhatsApp or unavailable state.
- `next.config.ts`: security headers and success-route privacy headers.
- `scripts/check-production-config.mjs`: Vercel production build gate without revealing secret values.
- `scripts/resolve-vercel-preview.mjs`: resolves the Vercel deployment URL for the current GitHub commit.
- `playwright.config.ts` and `tests/e2e/booking.spec.ts`: desktop/mobile Preview acceptance and API abuse coverage.
- `tests/*.test.ts`: Node unit/integration tests at real application boundaries with only network/database calls replaced.
- `supabase/migrations/*`: aligned baseline plus additive hardening migration.
- `.github/workflows/*.yml`: reproducible CI and Preview browser gates.
- `docs/security/*.md`: dependency/security audit evidence and external platform checklist.

---

### Task 1: Establish a Reproducible Node and Dependency Baseline

**Files:**
- Modify: `package.json`
- Create: `package-lock.json`
- Create: `docs/security/dependency-audit-2026-08-12.md`

**Interfaces:**
- Produces: Node engine `>=22 <23`, exact `@playwright/test` dev dependency `1.54.2`, immutable npm dependency tree.
- Consumes: Existing npm package definitions; no application interface.

- [ ] **Step 1: Record the clean source baseline and current audit output**

Run:

```powershell
git status --short --branch
npm install
npm run lint
npm run typecheck
npm test
npm run build:next
npm audit --omit=dev --json
npm audit --json
```

Expected: source checks report their real baseline; audit JSON is saved only as terminal evidence and no secret is printed. If a baseline command fails, stop and classify it before changing code.

- [ ] **Step 2: Pin the runtime and browser-test dependency**

Edit `package.json` to include these exact entries while preserving existing dependencies:

```json
{
  "engines": { "node": ">=22 <23" },
  "scripts": {
    "test": "node --test --import tsx tests/**/*.test.ts",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "1.54.2"
  }
}
```

- [ ] **Step 3: Generate and prove the lockfile is sufficient**

Run:

```powershell
npm install
Remove-Item -LiteralPath node_modules -Recurse -Force
npm ci
```

Expected: `package-lock.json` exists, `npm ci` exits 0, and `git diff -- package.json package-lock.json` contains no unrelated packages.

- [ ] **Step 4: Write the initial dependency audit record**

Create `docs/security/dependency-audit-2026-08-12.md` with separate tables for runtime and full-tree findings. Each high/critical row must contain package, advisory, dependency path, production reachability, chosen compatible version, and disposition. If there are no high/critical findings, write the commands, timestamp, and zero counts rather than an empty placeholder.

- [ ] **Step 5: Commit the reproducible baseline**

```powershell
git add package.json package-lock.json docs/security/dependency-audit-2026-08-12.md
git commit -m "build: lock Node dependencies"
```

---

### Task 2: Enforce the Booking Input Contract

**Files:**
- Modify: `src/lib/booking.ts`
- Modify: `tests/booking.test.ts`

**Interfaces:**
- Produces: `BOOKING_LIMITS`, `BookingInput`, `BookingCreateInput`, `BookingRecord`, `BookingValidationResult`, `validateBookingPayload(value, now)`.
- Consumes: `Attribution` from `src/lib/attribution.ts`.

- [ ] **Step 1: Write failing boundary and shape tests**

Add table-driven tests with literal expected errors for exact maximum+1 inputs, wrong primitive types, unknown `is_test`, control characters, malformed UUID/date/email, and WhatsApp normalization. Use this intended API:

```ts
const result = validateBookingPayload({
  travel_date: futureDate(new Date("2026-08-12T00:00:00Z"), 30),
  traveler_count: 2,
  full_name: "  Malaysia Guest  ",
  country: " Malaysia ",
  whatsapp: "+60 (12) 345-6789",
  email: " Guest@Example.com ",
  notes: "  Vegetarian  ",
  utm_source: " tiktok ",
  utm_medium: null,
  utm_campaign: null,
  ref_code: " creator_a ",
  submission_token: "550e8400-e29b-41d4-a716-446655440000",
  website: "",
}, new Date("2026-08-12T00:00:00Z"));

assert.equal(result.ok, true);
if (result.ok) {
  assert.equal(result.input.whatsapp, "+60123456789");
  assert.equal(result.input.email, "guest@example.com");
  assert.equal(result.honeypot, "");
}
```

Name the break caught by each test: accepting an oversized field, accepting an unexpected privileged key, accepting invalid WhatsApp, or failing to normalize stored values.

- [ ] **Step 2: Run tests and confirm RED**

Run: `npm test -- tests/booking.test.ts`

Expected: FAIL because `validateBookingPayload`, `BOOKING_LIMITS`, and the new result types do not exist.

- [ ] **Step 3: Implement the minimal domain parser**

Define exact bounds:

```ts
export const BOOKING_LIMITS = {
  full_name: 100,
  country: 80,
  whatsapp: 16,
  email: 254,
  notes: 2_000,
  attribution: 100,
} as const;

export type BookingCreateInput = BookingInput & {
  is_test: boolean;
  trip_id: "xian-tang-culture-2d1n";
};

export type BookingValidationResult =
  | { ok: true; input: BookingInput; honeypot: string }
  | { ok: false; errors: BookingErrors };
```

`validateBookingPayload` must accept only the listed booking fields plus `website`, normalize WhatsApp to E.164-like `+` plus 8–15 digits, reject unknown keys, and never coerce objects/arrays/booleans into strings.

- [ ] **Step 4: Verify GREEN and retain idempotency tests**

Run: `npm test -- tests/booking.test.ts`

Expected: all booking validation, attribution, duplicate, and reference-collision tests pass.

- [ ] **Step 5: Commit the input contract**

```powershell
git add src/lib/booking.ts tests/booking.test.ts
git commit -m "feat: enforce booking input limits"
```

---

### Task 3: Add HTTP Abuse Guards and Test Authentication

**Files:**
- Create: `src/lib/request-guard.ts`
- Create: `tests/request-guard.test.ts`

**Interfaces:**
- Produces: `readBoundedJson(request, 16_384)`, `validateBookingRequestHeaders(request)`, `hashRateLimitKey(ip, secret)`, `verifyE2ESecret(provided, expected)`.
- Consumes: Web `Request`, Node `crypto`; no framework-specific response.

- [ ] **Step 1: Write failing tests for actual request behavior**

Cover:

```ts
assert.deepEqual(validateBookingRequestHeaders(new Request("https://example.com/api/bookings", {
  method: "POST",
  headers: { origin: "https://example.com", "content-type": "application/json; charset=utf-8" },
})), { ok: true });

const oversized = new Request("https://example.com/api/bookings", {
  method: "POST",
  headers: { origin: "https://example.com", "content-type": "application/json", "content-length": "10" },
  body: JSON.stringify({ notes: "x".repeat(17_000) }),
});
assert.equal((await readBoundedJson(oversized, 16_384)).status, 413);
```

Also assert missing/cross-origin `Origin`=403, wrong media type=415, malformed JSON=400, same IP+secret yields a stable 64-character hex HMAC, different secret changes it, and E2E comparison rejects missing/wrong values.

- [ ] **Step 2: Run and confirm RED**

Run: `npm test -- tests/request-guard.test.ts`

Expected: FAIL with missing module/functions.

- [ ] **Step 3: Implement minimal guards**

Use `request.text()` followed by `Buffer.byteLength(raw, "utf8")`; do not rely solely on `Content-Length`. Compare E2E secrets by SHA-256 digest plus `timingSafeEqual`, so differing input lengths do not bypass constant-time comparison. Return discriminated results carrying exact HTTP statuses rather than throwing raw parse errors.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- tests/request-guard.test.ts`

Expected: all guard tests pass with no logged request bodies.

- [ ] **Step 5: Commit guards**

```powershell
git add src/lib/request-guard.ts tests/request-guard.test.ts
git commit -m "feat: guard booking requests"
```

---

### Task 4: Bound Supabase Transport and Repository Operations

**Files:**
- Modify: `src/lib/supabase-rest.ts`
- Modify: `src/lib/repository.ts`
- Create: `tests/supabase-rest.test.ts`

**Interfaces:**
- Produces: `supabaseRequest<T>(path, init, policy, deps)`, `findBySubmissionToken`, `findRecentBySubmissionToken`, `insertBooking`, `consumeBookingRateLimit`, `updateNotificationStatus`.
- Consumes: `BookingCreateInput`, `BookingRecord`; environment from `config.ts` is deferred, so transport receives `{url, secret}` through a local `config()` until Task 8 centralizes it.

- [ ] **Step 1: Write failing timeout/retry tests**

Use a real `AbortSignal`-aware fake fetch and assert observable calls:

```ts
const result = await supabaseRequest<{ ok: true }>("health", undefined, {
  timeoutMs: 50,
  maxRetries: 1,
  retryable: true,
}, { fetch: fetchThatFailsOnceThenReturns({ ok: true }) });

assert.deepEqual(result, { ok: true });
assert.equal(callCount, 2);
```

Add tests proving a POST insert is called once on timeout/500, a safe GET is called twice, a rate-limit RPC is called once, `Retry-After` is bounded, and thrown errors contain `SUPABASE_TIMEOUT`/`SUPABASE_UNAVAILABLE` without upstream body text.

- [ ] **Step 2: Run and confirm RED**

Run: `npm test -- tests/supabase-rest.test.ts`

Expected: FAIL because the policy/dependency API and new repository methods are missing.

- [ ] **Step 3: Implement transport policies**

Use these exact policies:

```ts
const READ_POLICY = { timeoutMs: 5_000, maxRetries: 1, retryable: true } as const;
const WRITE_POLICY = { timeoutMs: 8_000, maxRetries: 0, retryable: false } as const;
const RATE_LIMIT_POLICY = { timeoutMs: 5_000, maxRetries: 0, retryable: false } as const;
```

`findBySubmissionToken` has no age filter for idempotency recovery. `findRecentBySubmissionToken(token, cutoffIso)` adds `created_at=gte.<cutoff>` for success-link expiry. `insertBooking` includes `is_test`, `trip_id`, and initial notification state. `consumeBookingRateLimit` calls `/rest/v1/rpc/consume_booking_rate_limit` once. `updateNotificationStatus` PATCHes by booking `id` once.

- [ ] **Step 4: Verify GREEN and existing service behavior**

Run:

```powershell
npm test -- tests/supabase-rest.test.ts
npm test -- tests/booking.test.ts
```

Expected: all tests pass; no error contains Supabase response text or credentials.

- [ ] **Step 5: Commit the bounded transport**

```powershell
git add src/lib/supabase-rest.ts src/lib/repository.ts tests/supabase-rest.test.ts
git commit -m "feat: bound Supabase requests"
```

---

### Task 5: Align and Apply the Supabase Hardening Migration

**Files:**
- Rename: `supabase/migrations/202608120001_create_booking_requests.sql` → `supabase/migrations/20260812062246_create_booking_requests.sql`
- Create: `supabase/migrations/<generated-version>_stability_hardening.sql`
- Create: `docs/security/supabase-verification-2026-08-12.md`

**Interfaces:**
- Produces: booking hardening columns/constraints/indexes and RPC `public.consume_booking_rate_limit(p_key_hash text, p_limit integer, p_window_seconds integer)`.
- Consumes: live migration history version `20260812062246` and project `gcdrbaerwrudbtjilipa`.

- [ ] **Step 1: Recheck live compatibility before DDL**

Run read-only SQL that returns counts/max lengths/noncanonical WhatsApp values and record the result. Expected for the verified baseline: five rows, zero WhatsApp violations, and no proposed maximum exceeded. Stop if live data changed incompatibly.

- [ ] **Step 2: Align baseline history and generate a migration filename**

Run:

```powershell
Move-Item -LiteralPath 'supabase/migrations/202608120001_create_booking_requests.sql' -Destination 'supabase/migrations/20260812062246_create_booking_requests.sql'
npm exec --package=supabase@2.81.3 -- supabase migration new stability_hardening
```

Expected: baseline SQL content is unchanged and the new migration has a CLI-generated later version.

- [ ] **Step 3: Write the additive migration**

The migration must:

```sql
alter table public.booking_requests
  add column is_test boolean not null default false,
  add column trip_id text not null default 'xian-tang-culture-2d1n',
  add column notification_status text not null default 'PENDING',
  add column notification_attempted_at timestamptz,
  add column notification_error_code text;

update public.booking_requests
set notification_status = 'SKIPPED'
where notification_status = 'PENDING';

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;
```

Add named check constraints matching Task 2, including normalized WhatsApp `^\+[1-9][0-9]{7,14}$`, notification status, and bounded error/trip IDs. Add partial indexes for active real bookings and failed real notifications.

Create `private.booking_rate_limits` with `(key_hash, bucket_start)` primary key, `request_count`, `expires_at`, RLS enabled, and only service-role table privileges. Create `public.consume_booking_rate_limit` as `SECURITY INVOKER SET search_path = ''`; calculate fixed windows from epoch, atomically upsert/increment, and delete at most 100 expired rows through a `ctid` CTE. Revoke function execution from `PUBLIC`, `anon`, and `authenticated`; grant it only to `service_role`.

- [ ] **Step 4: Apply through the Supabase migration interface**

Apply the exact generated migration SQL once to project `gcdrbaerwrudbtjilipa`. Do not edit the migration after successful application; a correction requires a new migration.

Expected: migration application succeeds and history contains the aligned baseline plus the new hardening version.

- [ ] **Step 5: Verify live schema, privileges, and advisors**

Query columns, constraints, indexes, `prosecdef=false`, function ACLs, private-table grants, RLS state, and a transactional rate-limit call. Run both Supabase security and performance advisors. Record exact results and remediation links in `docs/security/supabase-verification-2026-08-12.md`; retain `rls_enabled_no_policy` as documented intentional INFO.

- [ ] **Step 6: Commit migration and evidence**

```powershell
git add supabase/migrations docs/security/supabase-verification-2026-08-12.md
git commit -m "feat: harden booking schema"
```

---

### Task 6: Add Feishu Notification State and Delivery

**Files:**
- Create: `src/lib/booking-notification.ts`
- Modify: `src/lib/booking-service.ts`
- Modify: `src/lib/repository.ts`
- Create: `tests/booking-notification.test.ts`
- Modify: `tests/booking.test.ts`

**Interfaces:**
- Produces: `sendFeishuBookingNotification(booking, webhookUrl, deps)`, `notifyNewBooking(booking, repository, notifier)`.
- Consumes: `BookingRecord`; repository `updateNotificationStatus(id, update)`.

- [ ] **Step 1: Write failing notification behavior tests**

Assert the actual outbound JSON excludes email, WhatsApp, notes, token, raw ID, and secrets while containing booking reference/name/country/date/travelers/source. Add tests for 5-second abort, Feishu nonzero `code`, HTTP failure, `is_test` skip, and duplicate booking skip.

Use this contract:

```ts
const result = await sendFeishuBookingNotification(booking, "https://open.feishu.cn/open-apis/bot/v2/hook/test", { fetch });
assert.deepEqual(result, { ok: true });

await notifyNewBooking(testBooking, repository, notifier);
assert.deepEqual(updates, [{ id: testBooking.id, status: "SKIPPED", errorCode: null }]);
assert.equal(notifierCalls, 0);
```

- [ ] **Step 2: Run and confirm RED**

Run: `npm test -- tests/booking-notification.test.ts`

Expected: FAIL with missing module/functions.

- [ ] **Step 3: Implement one-shot delivery and state updates**

Send one Feishu request with `AbortSignal.timeout(5_000)`. Return `{ok:false,errorCode}` rather than an upstream message. `notifyNewBooking` accepts a webhook URL or `null`: test bookings become `SKIPPED`; a real booking without Preview/local webhook becomes `FAILED` with `NOTIFICATION_UNCONFIGURED`; configured delivery becomes `SENT` or `FAILED`. It never throws after the booking has been durably inserted. Update `createBooking` types to carry `BookingCreateInput` without moving notification into its idempotency loop.

- [ ] **Step 4: Verify GREEN and duplicate protection**

Run:

```powershell
npm test -- tests/booking-notification.test.ts
npm test -- tests/booking.test.ts
```

Expected: test bookings and duplicate submissions produce zero Feishu calls; real newly created booking produces one.

- [ ] **Step 5: Commit notification support**

```powershell
git add src/lib/booking-notification.ts src/lib/booking-service.ts src/lib/repository.ts tests/booking-notification.test.ts tests/booking.test.ts
git commit -m "feat: notify new bookings in Feishu"
```

---

### Task 7: Orchestrate the Hardened Booking API and Structured Logs

**Files:**
- Create: `src/lib/log.ts`
- Modify: `src/app/api/bookings/route.ts`
- Modify: `src/components/booking-form.tsx`
- Create: `tests/booking-route.test.ts`

**Interfaces:**
- Produces: `createBookingPostHandler(deps)` and default `POST`; `bookingLog(event, fields)` allowlist.
- Consumes: Tasks 2–6 parsers, guards, rate limiter, repository, booking service, notifier.

- [ ] **Step 1: Write failing route integration tests**

Build real `Request` objects and call the handler. Cover 201/200 duplicate, 400 malformed JSON, 403 origin/honeypot/wrong E2E secret, 413 body, 415 media type, 422 field errors, 429 plus `Retry-After`, Supabase timeout 503, and notification failure that still returns success.

The desired API is:

```ts
const POST = createBookingPostHandler({
  consumeRateLimit: async () => ({ allowed: true, remaining: 9, retryAfterSeconds: 600 }),
  createBooking,
  notifyNewBooking,
  now: () => new Date("2026-08-12T00:00:00Z"),
  getConfig: () => testConfig,
  log: events.push.bind(events),
});

const response = await POST(validRequest());
assert.equal(response.status, 201);
```

Assert logs contain allowed keys and do not contain submitted email, WhatsApp, notes, token, raw IP, or secrets.

- [ ] **Step 2: Run and confirm RED**

Run: `npm test -- tests/booking-route.test.ts`

Expected: FAIL because the injectable handler and structured log helper are missing.

- [ ] **Step 3: Implement the thin orchestrator**

Follow the approved order exactly. Derive IP from Vercel-overwritten `x-forwarded-for`, HMAC before storage/logging, authenticate E2E mode only by header, set `trip_id="xian-tang-culture-2d1n"`, and return this success shape:

```ts
{
  ok: true,
  duplicated,
  bookingReference,
  successUrl,
  testEvidence: isTest ? { is_test: true, utm_source, ref_code } : undefined
}
```

Only newly created bookings call `notifyNewBooking`. Use status 201 for new and 200 for duplicate. Do not include the submission token in logs or test artifacts.

- [ ] **Step 4: Add the honeypot and form limits**

In `BookingForm`, add `maxLength` values from `BOOKING_LIMITS` and an off-screen `website` field with `tabIndex={-1}`, `autoComplete="off"`, and `aria-hidden="true"`. Preserve current accessible error feedback and duplicate-click guard.

- [ ] **Step 5: Verify GREEN**

Run:

```powershell
npm test -- tests/booking-route.test.ts
npm run typecheck
```

Expected: all response/status/logging cases pass and TypeScript finds no unsafe payload cast.

- [ ] **Step 6: Commit the API hardening**

```powershell
git add src/app/api/bookings/route.ts src/components/booking-form.tsx src/lib/log.ts tests/booking-route.test.ts
git commit -m "feat: harden booking API"
```

---

### Task 8: Persist First-Touch Attribution

**Files:**
- Modify: `src/lib/attribution.ts`
- Create: `src/proxy.ts`
- Modify: `src/app/booking/page.tsx`
- Modify: `tests/booking.test.ts`
- Create: `tests/attribution.test.ts`

**Interfaces:**
- Produces: `ATTRIBUTION_COOKIE`, `mergeFirstTouch`, `encodeAttributionCookie`, `decodeAttributionCookie`, `proxy(request)`.
- Consumes: existing `readAttribution`; async Next.js `cookies()`.

- [ ] **Step 1: Write failing first-touch tests**

Assert query capture, 100-character bounds, malformed-cookie recovery, fill-only behavior, and non-overwrite:

```ts
assert.deepEqual(
  mergeFirstTouch(
    { utm_source: "tiktok", utm_medium: null, utm_campaign: null, ref_code: "creator_a" },
    { utm_source: "instagram", utm_medium: "social", utm_campaign: null, ref_code: null },
  ),
  { utm_source: "tiktok", utm_medium: "social", utm_campaign: null, ref_code: "creator_a" },
);
```

Invoke `proxy` with a real `NextRequest` and assert a 90-day HttpOnly, SameSite=Lax cookie is set only when attribution changes.

- [ ] **Step 2: Run and confirm RED**

Run: `npm test -- tests/attribution.test.ts`

Expected: FAIL with missing cookie/merge/proxy behavior.

- [ ] **Step 3: Implement cookie capture and server read**

Use `ATTRIBUTION_COOKIE="tang_attribution"`. Encode only four bounded nullable strings; reject malformed/oversized cookie JSON. In `src/proxy.ts`, export `proxy` and:

```ts
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

Booking page awaits `cookies()`, merges cookie attribution with current query under first-touch rules, and passes the result to `BookingForm`.

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npm test -- tests/attribution.test.ts
npm test -- tests/booking.test.ts
npm run typecheck
```

Expected: all attribution behavior passes; global Header `Book Now` no longer needs decorated links for correctness.

- [ ] **Step 5: Commit attribution persistence**

```powershell
git add src/lib/attribution.ts src/proxy.ts src/app/booking/page.tsx tests/attribution.test.ts tests/booking.test.ts
git commit -m "feat: persist first-touch attribution"
```

---

### Task 9: Fail Fast on Configuration and Protect User-Facing Pages

**Files:**
- Create: `src/lib/config.ts`
- Create: `scripts/check-production-config.mjs`
- Create: `tests/config.test.ts`
- Create: `src/components/contact-cta.tsx`
- Modify: `src/app/contact/page.tsx`
- Modify: `src/app/booking/success/page.tsx`
- Create: `src/app/error.tsx`
- Create: `src/app/global-error.tsx`
- Create: `src/app/not-found.tsx`
- Modify: `next.config.ts`
- Modify: `package.json`
- Modify: `.env.example`

**Interfaces:**
- Produces: `getRuntimeConfig(env)`, `getWhatsAppNumber(env)`, shared `ContactCta`, 24-hour success lookup, production configuration build gate.
- Consumes: `findRecentBySubmissionToken` and Next.js metadata/error conventions.

- [ ] **Step 1: Write failing configuration tests**

Assert production rejects missing/invalid Supabase URL/key, Feishu webhook, rate-limit secret under 32 characters, and WhatsApp. Assert Production does not require `BOOKING_E2E_SECRET`; Preview acceptance validates that secret separately in CI. Preview/local returns `whatsapp:null` rather than a fake number. Assert a valid Feishu URL must use HTTPS and host `open.feishu.cn` or `open.larksuite.com` with `/open-apis/bot/v2/hook/` path.

- [ ] **Step 2: Run and confirm RED**

Run: `npm test -- tests/config.test.ts`

Expected: FAIL with missing config module.

- [ ] **Step 3: Implement configuration and build gate**

`getRuntimeConfig` returns values or stable configuration errors without echoing values. `scripts/check-production-config.mjs` exits nonzero only when `VERCEL_ENV=production` and a required value is absent/invalid. Add:

```json
{
  "scripts": {
    "check:config": "node scripts/check-production-config.mjs",
    "build": "npm run check:config && npm run lint && npm run typecheck && npm test && npm run build:next"
  }
}
```

Document variable names and safe examples in `.env.example`; never include a real webhook or secret.

- [ ] **Step 4: Protect Success and contact CTAs**

Success computes `cutoff = now - 24h`, calls `findRecentBySubmissionToken`, and shows only reference/date/travelers. Export robots metadata with `index:false, follow:false`. `ContactCta` renders a `wa.me` link only for a validated number; otherwise visible unavailable text.

- [ ] **Step 5: Add safe error pages and headers**

Create user-readable `error.tsx`, `global-error.tsx`, and `not-found.tsx` without rendering `error.message`. Add global `Content-Security-Policy`, `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, and `Permissions-Policy` headers and route-specific `/booking/success` `Cache-Control: private, no-store, max-age=0` plus `Referrer-Policy: no-referrer`.

- [ ] **Step 6: Verify GREEN, build, and header syntax**

Run:

```powershell
npm test -- tests/config.test.ts
npm run typecheck
npm run build
```

Expected: local build succeeds without production-only values, rendered pages have no placeholder `60123456789`, and Next build accepts the header configuration.

- [ ] **Step 7: Commit user-facing reliability**

```powershell
git add src/lib/config.ts scripts/check-production-config.mjs tests/config.test.ts src/components/contact-cta.tsx src/app/contact/page.tsx src/app/booking/success/page.tsx src/app/error.tsx src/app/global-error.tsx src/app/not-found.tsx next.config.ts package.json package-lock.json .env.example
git commit -m "feat: protect booking follow-up pages"
```

---

### Task 10: Replace Fixed Browser Acceptance with Preview Desktop/Mobile E2E

**Files:**
- Delete: `tests/final-browser-acceptance.mjs`
- Create: `playwright.config.ts`
- Create: `tests/e2e/booking.spec.ts`
- Create: `scripts/resolve-vercel-preview.mjs`
- Modify: `.github/workflows/acceptance.yml`
- Modify: `.github/workflows/browser-acceptance.yml`
- Modify: `.gitignore`

**Interfaces:**
- Produces: Playwright projects `desktop-chromium` and `mobile-chromium`; masked JSON evidence; PR Preview resolver.
- Consumes: `BASE_URL`, `BOOKING_E2E_SECRET`, GitHub deployment API, Vercel Git deployment.

- [ ] **Step 1: Write the new E2E spec before changing application behavior further**

Use `new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10)`. Route-intercept `/api/bookings` to add `x-booking-e2e-secret` without exposing it to page JavaScript. Start at `/?utm_source=tiktok&ref=stability_test`, navigate Home → Trip → another ordinary page or Header → Booking → Success, intercept the response, and assert `testEvidence` equals:

```ts
{ is_test: true, utm_source: "tiktok", ref_code: "stability_test" }
```

Submit the same payload/token twice through an API request context and assert the second response reports `duplicated:true`. Add oversized, invalid origin/content type, and honeypot cases. Evidence JSON may contain base URL, booking reference, date, viewport project, attribution, and `is_test`; it must not contain email, WhatsApp, notes, success URL, token, or E2E secret.

- [ ] **Step 2: Configure two required projects**

`playwright.config.ts` defines:

```ts
projects: [
  { name: "desktop-chromium", use: { browserName: "chromium", viewport: { width: 1440, height: 1000 } } },
  { name: "mobile-chromium", use: { ...devices["iPhone 13"], browserName: "chromium" } },
]
```

Set retries to 1 only in CI, capture trace on first retry, and write artifacts under `test-results/`.

- [ ] **Step 3: Run locally against a controlled local server and confirm failures are meaningful**

Start the built app with local non-production Supabase test configuration, then run `npm run test:e2e`. If live Supabase configuration is unavailable locally, run only the non-submission guard cases and reserve full submission for Preview; do not claim full local E2E.

- [ ] **Step 4: Make CI reproducible and complete its path filters**

Both workflows use `npm ci`. Acceptance runs on `push main` and `pull_request`. Browser acceptance runs on `pull_request`, `push` to `main`, and `workflow_dispatch`, with the exact approved paths. Add `permissions: deployments: read, contents: read`.

`scripts/resolve-vercel-preview.mjs` polls GitHub deployments for the current commit, selects a successful Vercel Preview for pull requests or the matching deployment for `main`, validates an HTTPS `vercel.app` URL, masks it, and writes `base_url` to `$GITHUB_OUTPUT`. It exits nonzero on timeout/missing deployment. Browser CI installs Chromium from the pinned project dependency and runs both projects.

- [ ] **Step 5: Verify workflow and E2E syntax**

Run:

```powershell
npm ci
npm run lint
npm run typecheck
npm test
npx playwright test --list
npm run build
```

Expected: two Playwright projects are listed; no fixed `2026-09-20`, no fixed production alias, and no `npm install --no-save` remains.

- [ ] **Step 6: Commit CI and E2E replacement**

```powershell
git add tests/e2e playwright.config.ts scripts/resolve-vercel-preview.mjs .github/workflows .gitignore package.json package-lock.json
git rm tests/final-browser-acceptance.mjs
git commit -m "test: run booking acceptance on Preview"
```

---

### Task 11: Complete Security Audit, Preview Verification, and Handoff

**Files:**
- Modify: `README.md`
- Create: `docs/security/vercel-production-checklist.md`
- Finalize: `docs/security/dependency-audit-2026-08-12.md`
- Finalize: `docs/security/supabase-verification-2026-08-12.md`

**Interfaces:**
- Produces: operator documentation, verified Preview URL/evidence, external configuration checklist, final completion classification.
- Consumes: all prior tasks and connected GitHub/Supabase/Vercel services.

- [ ] **Step 1: Re-run dependency audits and remediate safely**

Run:

```powershell
npm audit --omit=dev
npm audit
```

For each high/critical finding, identify dependency path and runtime reachability. Apply only compatible version changes, then repeat `npm ci`, tests, and build. Record deferred items exactly; never use `--force`.

- [ ] **Step 2: Scan tracked files and Git history without printing secrets**

Search for recognized key prefixes and variable assignments, returning only file/commit identifiers and match categories. Inspect `.env*`, workflow YAML, Git blobs, and docs. Redact matched values in all output. If a real secret is found, stop, report rotation as required, and do not reproduce it.

- [ ] **Step 3: Update operator documentation**

README must use `npm ci`, Node 22, migration order, local/Preview/Production config behavior, test-booking meaning, and verification commands. `vercel-production-checklist.md` must specify:

- `BOOKING_NOTIFICATION_WEBHOOK_URL` Production only;
- `BOOKING_E2E_SECRET` Preview/GitHub secret;
- `RATE_LIMIT_HASH_SECRET` Preview/Production;
- valid `NEXT_PUBLIC_WHATSAPP_NUMBER`;
- Vercel Firewall `POST /api/bookings`, IP key, 10 requests/600 seconds, log-first then enforce;
- optional managed bot protection only if the plan supports it;
- rollback and no-DNS-change notes.

- [ ] **Step 4: Run the fresh full local verification gate**

Run in this order and capture exact counts/exits:

```powershell
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: all exit 0. Any failure blocks completion and must be diagnosed with `superpowers:systematic-debugging`.

- [ ] **Step 5: Publish the implementation branch and create a Preview**

Use the repository publish workflow to push the non-main branch and open a draft PR, or use the connected Vercel deployment API if Git integration cannot produce the Preview. Never push directly to `main`. Confirm the Preview commit matches local HEAD.

- [ ] **Step 6: Configure Preview secrets and run browser acceptance**

Set `BOOKING_E2E_SECRET`, `RATE_LIMIT_HASH_SECRET`, Supabase server credentials, and valid WhatsApp only through Vercel/GitHub secret stores. Run:

```powershell
$env:BASE_URL='<validated-preview-url>'
$env:BOOKING_E2E_SECRET='<injected-secret>'
npx playwright test --project=desktop-chromium
npx playwright test --project=mobile-chromium
```

Do not echo the values. Expected: both projects pass the complete Home → Trip → Booking → API → Supabase → Success flow.

- [ ] **Step 7: Verify live database evidence and failure cases**

Through the Supabase connector, query by the returned booking reference and confirm `is_test=true`, `utm_source='tiktok'`, `ref_code='stability_test'`, `notification_status='SKIPPED'`, and exactly one row. Run controlled oversized/invalid/duplicate/rate-limit tests. Simulate Supabase unavailability through injected test dependencies in automated tests, not by disabling the production project.

- [ ] **Step 8: Verify response headers, CSP, and runtime logs**

Fetch Preview Home and Success responses, assert all designed headers, and inspect browser console for CSP errors. Scan Vercel runtime logs for the acceptance interval; correlate by booking reference/request ID and confirm logs contain no PII/token/secret.

- [ ] **Step 9: Validate one Feishu message only with explicit send authorization**

After the user configures the real webhook and authorizes a labelled test message, submit one controlled non-test booking to Preview and confirm one Feishu message plus `notification_status='SENT'`. Without that authorization/configuration, mark this external verification as the single blocker and do not fabricate success.

- [ ] **Step 10: Run final diff and requirement review**

Run:

```powershell
git diff --check origin/main...HEAD
git status --short
git log --oneline origin/main..HEAD
```

Re-read the approved design section-by-section and map every requirement to code, migration, test, or documented external setting. Remove only artifacts created by these tests; preserve user files.

- [ ] **Step 11: Commit documentation and prepare the final report**

```powershell
git add README.md docs/security
git commit -m "docs: document production hardening"
```

Use the requested final headings and classify as `已完成` only if all required local/Preview/Supabase/desktop/mobile evidence passes. Otherwise use `阶段完成` and state only unresolved risks plus one next step. Request separate authorization before any Production promotion.
