import Link from "next/link";
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

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "60123456789";
  const waText = encodeURIComponent(`Hi Tang Atlas, I'd like to follow up on booking ${booking.booking_reference}.`);

  return (
    <div className="container-page py-20">
      <div className="card mx-auto max-w-3xl overflow-hidden">
        <div className="bg-[#275d52] p-8 text-white md:p-10">
          <div className="text-sm font-bold uppercase tracking-[.16em] text-white/70">Request received</div>
          <h1 className="mt-3 text-4xl font-black">Booking Request Submitted</h1>
          <p className="mt-4 text-white/75">This is not a payment confirmation. We&apos;ll contact you to confirm details and price before payment.</p>
        </div>
        <div className="grid gap-6 p-8 md:grid-cols-2 md:p-10">
          <Detail label="Booking Reference" value={booking.booking_reference} />
          <Detail label="Travel Date" value={booking.travel_date} />
          <Detail label="Travelers" value={`${booking.traveler_count}`} />
          <Detail label="Contact" value={`${booking.full_name} · ${booking.email}`} />
          <div className="md:col-span-2 rounded-2xl bg-[#f6f1e8] p-5">
            <div className="font-black">What happens next?</div>
            <p className="mt-2 text-sm leading-6 text-neutral-650">We&apos;ll review availability and contact you using the details above. Keep your booking reference for follow-up.</p>
          </div>
          <a className="button-primary md:w-fit" href={`https://wa.me/${whatsapp}?text=${waText}`} target="_blank" rel="noreferrer">Contact on WhatsApp</a>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><div className="text-xs font-bold uppercase tracking-[.12em] text-neutral-500">{label}</div><div className="mt-2 font-black text-lg break-words">{value}</div></div>;
}
