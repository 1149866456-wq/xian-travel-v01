# Vercel Production Checklist

Use this checklist after a matching Vercel Preview passes Desktop and Mobile acceptance. It does not authorize a Production promotion; request separate approval immediately before promotion.

## Environment variables

Configure values only in Vercel/GitHub secret stores. Never paste values into source, logs, screenshots, artifacts, PR text, or support messages.

| Variable | Preview | Production | Check |
|---|---:|---:|---|
| `SUPABASE_URL` | Required | Required | HTTPS project URL for the intended Supabase project |
| `SUPABASE_SECRET_KEY` | Required | Required | Server-only; never use a `NEXT_PUBLIC_` name |
| `RATE_LIMIT_HASH_SECRET` | Required | Required | Different random value per environment, at least 32 characters |
| `BOOKING_E2E_SECRET` | Required in Vercel Preview and as the GitHub Actions secret | Do not set | Preview values match; never expose it to page JavaScript |
| `BOOKING_NOTIFICATION_WEBHOOK_URL` | Optional until an explicitly authorized notification test | Required | HTTPS Feishu/Lark group-robot webhook; Production only in steady state |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Recommended | Required | Valid E.164 form, for example `+` plus 8–15 digits |

After changing variables, redeploy the affected environment; an existing deployment does not receive new build-time values automatically.

## Vercel Firewall

Add a scoped rate-limit rule for the booking endpoint:

- Method: `POST`
- Path: `/api/bookings`
- Key: source IP
- Limit: 10 requests per 600 seconds
- Initial action: log/count only

Observe legitimate and rejected traffic first. Confirm the rule matches only the booking `POST`, then switch it to enforce/block. The application-level Supabase limiter remains enabled as the durable second layer.

Enable Vercel managed bot protection only when the active plan supports it and after confirming it does not challenge or block the Preview acceptance flow. It is optional and does not replace the endpoint rule or application limiter.

## Preview gate

- Confirm the Preview deployment commit equals the Draft PR head commit.
- Run Desktop Chromium and Mobile Chromium end to end.
- Confirm the returned evidence is `is_test=true`, preserves the expected attribution, and the Supabase row is unique with `notification_status=SKIPPED`.
- Verify Home and Success response headers, success-page `no-store`/`no-referrer`, browser console CSP output, and Vercel runtime logs.
- Confirm uploaded CI artifacts contain only explicitly allowlisted, redacted evidence fields—no contact data, notes, token, success URL, webhook, or E2E secret.
- Send a real Feishu message only after the webhook is configured and the user explicitly authorizes one labelled test.

## Promotion and rollback

- No DNS change is needed for this hardening release.
- Obtain separate user authorization immediately before promoting to Production.
- Promote only the exact Preview commit that passed acceptance; do not rebuild from an unverified commit.
- Keep the previously healthy Vercel deployment available for instant rollback.
- Roll back the Vercel deployment first if booking submissions or headers regress. Do not attempt to reverse the additive Supabase migration during an incident; disable the affected release path and investigate with the prior deployment.
- If Firewall enforcement blocks legitimate traffic, return the rule to log-only or disable that rule while leaving the application limiter active.
