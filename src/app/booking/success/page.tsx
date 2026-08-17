import Link from "next/link";
import { whatsappHref } from "@/lib/contact";
import { findBySubmissionToken } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

type SuccessParams = { token?: string | string[] };

export default async function BookingSuccess({ searchParams }: { searchParams: Promise<SuccessParams> }) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const booking = token ? await findBySubmissionToken(token) : null;

  if (!booking) {
    return (
      <div className="container-page py-16 sm:py-24">
        <div className="mx-auto max-w-2xl border-y border-[var(--line)] py-12 text-center sm:py-16">
          <p className="eyebrow">Booking request</p>
          <h1 className="mt-5 text-5xl font-semibold tracking-[-.035em] sm:text-6xl">Booking request not found</h1>
          <p className="mx-auto mt-5 max-w-xl leading-8 text-[var(--muted)]">The success link may be incomplete. Please contact us if you already submitted a booking request.</p>
          <Link className="button-primary mt-7" href="/contact">Contact Us</Link>
        </div>
      </div>
    );
  }

  const whatsapp = whatsappHref(
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    `Hi Tang Atlas, I'd like to follow up on booking ${booking.booking_reference}.`,
  );

  return (
    <div className="bg-[var(--paper)] py-12 sm:py-20">
      <div className="container-page max-w-5xl">
        <div className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--card-shadow)]">
          <header className="grid gap-8 bg-[var(--jade-dark)] p-7 text-white sm:p-10 md:grid-cols-[1fr_auto] md:items-end md:p-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--jade-gold)]">Request received</p>
              <h1 className="mt-4 text-5xl font-semibold tracking-[-.035em] sm:text-6xl">Booking Request Submitted</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/74">This is a booking request confirmation, not a payment confirmation.</p>
              <p className="mt-2 max-w-2xl leading-7 text-[var(--jade-muted)]">We&apos;ll review availability for your travel date, confirm what can be included in your final itinerary, and then contact you with pricing and next steps.</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/8 text-2xl" aria-hidden="true">✓</div>
          </header>

          <div className="grid gap-10 p-7 sm:p-10 md:grid-cols-[1.2fr_.8fr] md:p-12">
            <section aria-labelledby="request-details-title">
              <div className="flex items-center gap-4">
                <h2 id="request-details-title" className="text-3xl font-semibold">Request details</h2>
                <div className="h-px flex-1 bg-[var(--line)]" />
              </div>
              <dl className="mt-7 grid gap-x-8 gap-y-7 sm:grid-cols-2">
                <Detail label="Booking Reference" value={booking.booking_reference} />
                <Detail label="Requested Travel Date" value={booking.travel_date} />
                <Detail label="Travelers" value={`${booking.traveler_count}`} />
                <Detail label="Contact" value={`${booking.full_name} · ${booking.email}`} />
              </dl>
            </section>

            <aside className="border-l-2 border-[var(--cinnabar)] bg-[var(--paper)] p-6" aria-labelledby="next-step-title">
              <p className="eyebrow">Next step</p>
              <h2 id="next-step-title" className="mt-3 text-3xl font-semibold">What happens next?</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">We&apos;ll review your request and check what&apos;s available for your preferred date. If you follow up, please share your booking reference so we can match your request quickly.</p>
              {whatsapp ? (
                <a className="button-primary mt-6 w-full" href={whatsapp} target="_blank" rel="noreferrer">Contact on WhatsApp</a>
              ) : (
                <Link className="button-secondary mt-6 w-full" href="/contact">Contact Us</Link>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-t border-[var(--line)] pt-4">
      <dt className="text-[.67rem] font-bold uppercase tracking-[.15em] text-[var(--muted)]">{label}</dt>
      <dd className="mt-2 break-words font-[var(--font-display)] text-2xl font-semibold leading-tight">{value}</dd>
    </div>
  );
}
