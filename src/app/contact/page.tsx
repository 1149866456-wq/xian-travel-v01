import Link from "next/link";
import { whatsappHref } from "@/lib/contact";

export default function ContactPage() {
  const whatsapp = whatsappHref(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER);
  return (
    <div className="container-page py-20">
      <div className="eyebrow">Contact</div>
      <h1 className="mt-4 text-5xl font-black tracking-tight">Questions before booking?</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-650">Message us about travel dates, group size, accessibility needs, or itinerary questions.</p>
      {whatsapp ? (
        <a className="button-primary mt-8" href={whatsapp} target="_blank" rel="noreferrer">Chat on WhatsApp</a>
      ) : (
        <>
          <p className="mt-4 max-w-2xl leading-7 text-neutral-600">WhatsApp contact is not currently available. You can still send a booking request, and we&apos;ll follow up using the contact details you provide.</p>
          <Link className="button-primary mt-8" href="/booking">Send Booking Request</Link>
        </>
      )}
    </div>
  );
}
