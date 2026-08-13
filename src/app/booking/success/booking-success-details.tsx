import React from "react";
import type { BookingRecord } from "@/lib/booking";
import { ContactCta } from "@/components/contact-cta";

export function successTokenCutoff(now = new Date()): string {
  return new Date(now.getTime() - 24 * 60 * 60 * 1_000).toISOString();
}

export function BookingSuccessDetails({
  booking,
  whatsappNumber,
}: {
  booking: BookingRecord;
  whatsappNumber: string | null;
}) {
  return (
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
        <div className="md:col-span-2 rounded-2xl bg-[#f6f1e8] p-5">
          <div className="font-black">What happens next?</div>
          <p className="mt-2 text-sm leading-6 text-neutral-650">We&apos;ll review availability and contact you using the details you submitted. Keep your booking reference for follow-up.</p>
        </div>
        <ContactCta
          whatsappNumber={whatsappNumber}
          text={`Hi Tang Atlas, I'd like to follow up on booking ${booking.booking_reference}.`}
        />
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><div className="text-xs font-bold uppercase tracking-[.12em] text-neutral-500">{label}</div><div className="mt-2 break-words text-lg font-black">{value}</div></div>;
}
