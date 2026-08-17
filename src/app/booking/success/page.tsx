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
      <div className="container-page py-20">
        <div className="card mx-auto max-w-2xl p-8 text-center">
          <h1 className="text-3xl font-black">Booking request not found</h1>
          <p className="mt-4 text-neutral-600">The success link may be incomplete. Please contact us if you already submitted a booking request.</p>
          <Link className="button-primary mt-6" href="/contact">Contact Us</Link>
        </div>
      </div>
    );
  }

  const whatsapp = whatsappHref(
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    `Hi Tang Atlas, I'd like to follow up on booking ${booking.booking_reference}.`,
  );

  return (
    <div className="container-page py-20">
      <div className="card mx-auto max-w-3xl overflow-hidden">
        <div className="bg-[#275d52] p-8 text-white md:p-10">
          <div className="text-sm font-bold uppercase tracking-[.16em] text-white/70">Request received</div>
          <h1 className="mt-3 text-4xl font-black">Booking Request Submitted</h1>
          <p className="mt-4 text-white/75">This confirms your booking request, not a payment or confirmed reservation.</p>
          <p className="mt-2 text-white/75">We&apos;ll check availability, your final itinerary and pricing, then contact you using the details above.</p>
        </div>
        <div className="grid gap-6 p-8 md:grid-cols-2 md:p-10">
          <Detail label="Booking Reference" value={booking.booking_reference} />
          <Detail label="Requested Travel Date" value={booking.travel_date} />
          <Detail label="Travelers" value={`${booking.traveler_count}`} />
          <Detail label="Contact" value={`${booking.full_name} · ${booking.email}`} />
          <div className="md:col-span-2 rounded-2xl bg-[#f6f1e8] p-5">
            <div className="font-black">What happens next?</div>
            <p className="mt-2 text-sm leading-6 text-neutral-650">We&apos;ll check availability and review your request. Please keep your booking reference for follow-up. We&apos;ll contact you as soon as we&apos;ve reviewed your trip details.</p>
          </div>
          {whatsapp ? (
            <a className="button-primary md:w-fit" href={whatsapp} target="_blank" rel="noreferrer">Contact on WhatsApp</a>
          ) : (
            <Link className="button-secondary md:w-fit" href="/contact">Contact Us</Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><div className="text-xs font-bold uppercase tracking-[.12em] text-neutral-500">{label}</div><div className="mt-2 break-words font-black text-lg">{value}</div></div>;
}
