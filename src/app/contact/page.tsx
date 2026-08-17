import Image from "next/image";
import Link from "next/link";
import { whatsappHref } from "@/lib/contact";

export default function ContactPage() {
  const whatsapp = whatsappHref(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER);

  return (
    <div className="bg-[var(--paper)] py-10 sm:py-16">
      <div className="container-page grid min-h-[620px] overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--surface)] lg:grid-cols-[.9fr_1.1fr]">
        <section className="flex flex-col justify-center p-8 sm:p-12 lg:p-16" aria-labelledby="contact-title">
          <p className="eyebrow">Contact</p>
          <h1 id="contact-title" className="mt-5 text-6xl font-semibold tracking-[-.045em] sm:text-7xl">Questions before booking?</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">Message us about travel dates, group size, accessibility needs, or itinerary questions.</p>

          {whatsapp ? (
            <div className="mt-8">
              <a className="button-primary" href={whatsapp} target="_blank" rel="noreferrer">Chat on WhatsApp</a>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">Opening WhatsApp starts a conversation. It does not create a confirmed booking.</p>
            </div>
          ) : (
            <div className="mt-8">
              <p className="max-w-xl text-sm leading-7 text-[var(--muted)]">WhatsApp contact is not currently available. You can still send a booking request, and we&apos;ll follow up using the contact details you provide.</p>
              <Link className="button-primary mt-6" href="/booking">Send Booking Request</Link>
            </div>
          )}

          <div className="mt-12 border-t border-[var(--line)] pt-5 text-xs font-bold uppercase tracking-[.15em] text-[var(--muted)]">Xi&apos;an · Small-group cultural travel</div>
        </section>

        <figure className="relative min-h-[450px] lg:min-h-full">
          <Image
            src="/images/tang-atlas/dacien-temple.webp"
            alt="Daci'en Temple courtyard and pagoda in Xi'an"
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 55vw"
            className="object-cover object-[50%_42%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--jade-dark)]/70 via-transparent to-transparent" />
          <figcaption className="absolute inset-x-0 bottom-0 p-6 text-sm text-white/75 sm:p-8">Daci&apos;en Temple · A quieter frame for a city of many layers</figcaption>
        </figure>
      </div>
    </div>
  );
}
