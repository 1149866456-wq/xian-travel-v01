# Tang Atlas — Xi'an Travel V0.1

V0.1 source implements the intended booking-request loop:

`Home → Trip Detail → Booking → Next.js Route Handler → Supabase booking_requests → Success`

## Source status

The complete Next.js source tree is persisted in this directory. Runtime verification is intentionally separate from source restoration.

## Local setup

1. Install Node.js 22+ and npm.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and set `SUPABASE_URL` and server-only `SUPABASE_SECRET_KEY`.
4. Apply `supabase/migrations/202608120001_create_booking_requests.sql` to the target Supabase project.
5. Run `npm run dev` and open `http://localhost:3000`.

## Verification commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Real booking scenario

Open `http://localhost:3000/?utm_source=tiktok&ref=influencer_A`, then follow Home → View Trip → Book Now and submit a Malaysia booking for 2 travelers.

The V0.1 site takes booking requests only. It does not implement payment.
