# Supabase Stability Hardening Verification — 2026-08-13

## Project

- Project ref: `gcdrbaerwrudbtjilipa`
- Region: `us-west-2`
- PostgreSQL: 17
- Status before migration: `ACTIVE_HEALTHY`

## Pre-migration compatibility

- Booking rows observed: 6.
- Existing values were within all proposed text limits.
- Three WhatsApp values already matched E.164 storage format.
- Three contained only 8–15 digits and were safely normalized by adding the missing `+`.
- Zero values were unsafe to normalize.
- No raw contact value was retrieved or printed during this classification.

## Migration history

- `20260812062246_create_booking_requests`
- `20260813013052_stability_hardening`

The repository baseline migration was renamed to the live history version without changing its Git blob. The hardening migration was applied once through the Supabase migration API and returned `success: true`.

## Schema and access verification

- `public.booking_requests` has `is_test`, `trip_id`, and all notification columns.
- Length, email, control-character, WhatsApp, trip, and notification constraints are present.
- Existing WhatsApp rows now all match `^\+[1-9][0-9]{7,14}$`.
- Legacy rows are all `notification_status='SKIPPED'`; no retroactive message was sent.
- Partial indexes exist for real follow-up and failed real notifications.
- `private.booking_rate_limits` has RLS enabled and only `postgres`/`service_role` table grants.
- `public.consume_booking_rate_limit` is `SECURITY INVOKER` (`prosecdef=false`), uses an empty `search_path`, and has execute ACL only for `postgres` and `service_role`.
- A controlled call returned `allowed=true`, `remaining=9`, and a bounded retry interval.
- The controlled HMAC test row was deleted afterward; verification row count is zero.
- `public.booking_requests` retains RLS with no anonymous/authenticated policies and its existing unique constraints.

## Advisors

Security advisors report INFO only:

- `rls_enabled_no_policy` for `public.booking_requests` — intentional server-only service-role model. [Remediation reference](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
- `rls_enabled_no_policy` for `private.booking_rate_limits` — intentional private-schema service-role model. [Remediation reference](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)

Performance advisors report INFO only:

- The two newly created partial indexes are not yet used because no qualifying production query has run since creation. [Remediation reference](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)

No security or performance warning/error was reported.
