# Tang Atlas — Xi'an Travel V0.1

V0.1 implements the booking-request loop:

`Home → Trip Detail → Booking → Next.js Route Handler → Supabase booking_requests → Success`

The site accepts booking requests only; it does not take payment.

## Runtime and installation

- Use Node.js 22.x. The package engine declares Node 23+ unsupported; npm may only warn unless `engine-strict` is enabled.
- Install exactly the committed dependency tree with `npm ci`; do not use `npm install` for CI or releases.

```powershell
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Open `http://localhost:3000` after configuring the required local variables.

## Environment configuration

All Supabase credentials, rate-limit material, notification URLs, and E2E secrets are server-only. Never prefix them with `NEXT_PUBLIC_` or commit `.env.local`.

| Variable | Local | Vercel Preview | Production |
|---|---|---|---|
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | Required to submit/read bookings | Required | Required; build checks the URL and rejects a missing/blank secret; runtime access verifies the credential |
| `RATE_LIMIT_HASH_SECRET` | Required for booking API; at least 32 characters | Required | Required; build fails if absent/invalid |
| `BOOKING_E2E_SECRET` | Optional; only for controlled acceptance | Required together with the GitHub Actions secret | Not required and should not be set |
| `BOOKING_NOTIFICATION_WEBHOOK_URL` | Optional; missing notification is recorded as failed for a real booking | Optional; test bookings never notify | Required Feishu/Lark group-robot webhook; build fails if absent/invalid |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Optional; invalid/missing value hides the link | Optional but recommended | Required valid E.164 number; build fails if absent/invalid |

Production builds fail fast when required configuration is missing. Local and Preview builds remain possible without WhatsApp or Feishu, but those features show an unavailable/failed state instead of using fake fallbacks.

## Supabase migrations

Apply migrations in filename order through the Supabase migration workflow:

1. `supabase/migrations/20260812062246_create_booking_requests.sql`
2. `supabase/migrations/20260813013052_stability_hardening.sql`

Do not reapply an already-recorded migration or edit an applied migration's SQL. Production project verification is recorded in `docs/security/supabase-verification-2026-08-13.md`.

## Test-booking isolation

A booking is marked `is_test=true` only when the server validates the `BOOKING_E2E_SECRET` request header. Test bookings remain in Supabase as acceptance evidence, but must be excluded from CRM/payment/real follow-up and always use `notification_status=SKIPPED`; they never send a Feishu notification.

## Verification

Run the local gate with Node.js 22:

```powershell
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npx playwright test --list
```

Full Desktop/Mobile booking submission acceptance requires a configured Vercel Preview and matching `BOOKING_E2E_SECRET`; listing the tests is not equivalent to running the deployed flow. Production promotion requires separate authorization after Preview acceptance passes.
