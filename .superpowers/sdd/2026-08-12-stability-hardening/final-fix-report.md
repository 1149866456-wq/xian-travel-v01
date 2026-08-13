# Final fix report — stability hardening

## Scope and safety

All changes are local to this worktree. No Supabase operation, Feishu message, Vercel/GitHub external change, or Production promotion was performed. Test fixtures use synthetic values only. The existing live migration received only the required EOF blank-line deletion.

## Findings

1. **Sensitive Playwright artifacts** — Root cause: failure tracing, screenshots, video, HTML report, and whole result directories could retain request data. RED: review identified CI uploads of `test-results/` and `playwright-report/`; no safe artifact boundary existed. Change: disable trace/screenshot/video and upload only `test-results/booking-evidence-*.json`, whose generated evidence excludes token, secret, PII, and request payload. GREEN: `npx playwright test --list` lists the expected four tests.
2. **Unbounded request buffering** — Root cause: `request.text()` completed before byte enforcement. RED: `streaming body is cancelled as soon as it exceeds the byte limit` failed because no cancellation occurred. Change: incremental reader, byte counter, cancellation on overflow, then decode/parse. GREEN: focused regression passed.
3. **Early validation bypassed limiter** — Root cause: JSON, E2E secret, schema, and honeypot checks occurred before limiter consumption. RED: four-case rate-limit regression observed zero consumption. Change: bounded read, config/IP availability, then one limiter consumption before parsing/validation. GREEN: regression passed; rate-limit writes retain zero retry.
4. **Success Referrer-Policy precedence** — Root cause: global matcher was later than the success rule. RED: merged-order regression resolved `strict-origin-when-cross-origin`. Change: put global rule first and specific success rule last. GREEN: effective merged policy is `no-referrer`.
5. **PR Preview SHA** — Root cause: resolver consumed only `GITHUB_SHA`, which is a pull-request merge SHA. RED: workflow review showed no PR-head SHA input. Change: workflow passes `github.event.pull_request.head.sha || github.sha` as `GITHUB_DEPLOYMENT_SHA`; resolver queries this explicit value. GREEN: script contract remains deterministic; no deployment API invoked locally.
6. **Attribution controls** — Root cause: query and cookie paths trimmed/length-checked but admitted control characters. RED: query/cookie regression retained polluted strings. Change: shared trim/length/full-C0-control rejection in both capture and decode. GREEN: regression passed.
7. **Conflict classification** — Root cause: string matching against upstream error text coupled retry to untrusted/upstream formatting. RED: classified reference conflict did not retry. Change: transport classifies HTTP 409 JSON code `23505` details as booking-reference or submission-token, never exposes response bodies; service retries only reference conflicts and recovers a raced submission token idempotently. GREEN: integration-level repository-boundary regressions passed.
8. **Impossible dates** — Root cause: format comparison accepted impossible dates. RED: `2026-99-99` had no error. Change: compare parsed UTC calendar components. GREEN: validation regression passed.
9. **Success token UUID v4** — Root cause: loose 36-character hex/hyphen matcher admitted non-v4 IDs. RED: v4 predicate was absent. Change: strict UUID v4 matcher; invalid/missing/unknown/expired tokens retain normal unavailable state. GREEN: page regression passed.
10. **Migration EOF** — Root cause: one trailing blank line. Change: delete only that blank line; SQL semantics unchanged. GREEN: `git diff --check` exits zero.
11. **WhatsApp wa.me path** — Root cause: E.164 `+` was included in path. RED: rendered-link regression included `wa.me/+`. Change: preserve configured E.164 number but remove non-digits when forming the path. GREEN: rendered-link regression passed.

## TDD record

RED command: `npm test -- --test-name-pattern="streaming body|bounded malformed|attribution ignores|impossible calendar|classified booking|submission-token conflict|success lookup|WhatsApp CTA|global security"`.

Expected RED summary: 8 failures demonstrated the missing stream cancellation, rate consumption, control filtering, calendar validation, conflict retry classification, UUID v4 predicate, digits-only CTA, and effective header order. The existing submission-token recovery was already green; its new test protects that behavior while classification was added at the transport boundary.

GREEN commands/results:

- `npm test` — 57 passed, 0 failed.
- `npm run typecheck` — passed.
- `npx playwright test --list` — 4 expected tests listed.
- `git diff --check` — passed.

## Changed files

`.github/workflows/browser-acceptance.yml`, `playwright.config.ts`, `scripts/resolve-vercel-preview.mjs`, `next.config.ts`, `src/app/api/bookings/route.ts`, `src/app/booking/success/page.tsx`, `src/components/contact-cta.tsx`, `src/lib/attribution.ts`, `src/lib/booking-service.ts`, `src/lib/booking.ts`, `src/lib/request-guard.ts`, `src/lib/supabase-rest.ts`, `supabase/migrations/20260813013052_stability_hardening.sql`, and focused test files.

## Self-review

- No secret, raw IP, submission token, PII, upstream response body, or webhook value is logged or added to test artifacts.
- No automatic retry was added to database writes or rate-limit consumption; safe read policy is unchanged.
- No migration SQL semantics changed.
- Changes are limited to findings 1–11 and their regression coverage.

## Controller verification note

The first verification above used the machine-default Node 24 runtime. Fresh execution with the project target Node 22.16.0 found that two timeout fakes were cancelled because an `AbortSignal.timeout()` timer alone does not keep Node 22's event loop alive.

The timeout fakes now keep the event loop alive with a one-second test-only guard. The production timeout implementation is unchanged. If the abort signal does not fire, the guard rejects and the asserted timeout classification fails instead of allowing the test parent to cancel later cases.

Fresh Node 22.16.0 evidence after the fixture fix:

- focused timeout regression — 11 passed, 0 failed, 0 cancelled;
- `npm ci` — 366 packages installed from the committed lockfile;
- `npm run lint` — exit 0;
- `npm run typecheck` — exit 0;
- `npm test` — 57 passed, 0 failed, 0 cancelled;
- `npm run build` — exit 0, including production config check, lint, typecheck, all tests, and Next.js 16.3.0 production build;
- `npx playwright test --list` — four expected Desktop/Mobile tests listed;
- built production server smoke — Home and malformed-token Success returned HTTP 200; global security headers were present and Success resolved to `no-referrer`, `private, no-store, max-age=0`, and `noindex, nofollow`;
- runtime and full-tree `npm audit --audit-level=high` against the official npm registry — 0 vulnerabilities in both runs.

The built production server had to be started from the repository's resolved `D:\Program\Documents\...` path because this Windows workspace is also exposed through a `C:\Users\...\Documents\...` path and Next.js records its resolved build path. This is a local path-alias condition, not an application change.

The deployed Preview booking flow was not run because this workspace has no linked Vercel project or configured Preview secrets. Listing Playwright tests and the local header smoke are not substitutes for deployed E2E evidence.
