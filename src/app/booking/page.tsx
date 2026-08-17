import Image from "next/image";
import { BookingForm } from "@/components/booking-form";
import { readAttribution, type SearchParams } from "@/lib/attribution";

export default async function BookingPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const attribution = readAttribution(await searchParams);

  return (
    <div className="bg-[var(--paper)] py-10 sm:py-16">
      <div className="container-page grid items-start gap-10 lg:grid-cols-[.78fr_1.22fr] lg:gap-16">
        <section className="lg:sticky lg:top-6" aria-labelledby="booking-page-title">
          <p className="eyebrow">Booking Request</p>
          <h1 id="booking-page-title" className="mt-5 text-6xl font-semibold tracking-[-.045em] sm:text-7xl">Plan your Xi&apos;an Tang Culture trip.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">
            Tell us your preferred date and contact details. We&apos;ll review availability for your travel date and confirm your final itinerary and pricing before any payment is requested.
          </p>

          <figure className="mt-8">
            <div className="image-frame aspect-[4/3]">
              <Image
                src="/images/tang-atlas/xian-muslim-quarter.webp"
                alt="Street life in Xi'an's Muslim Quarter"
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 38vw"
                className="object-[52%_38%]"
              />
            </div>
            <figcaption className="image-caption">Xi&apos;an Muslim Quarter · A city experienced at street level</figcaption>
          </figure>

          <div className="mt-7 border-y border-[var(--line)] py-5 text-sm leading-7 text-[var(--muted)]">
            <strong className="block font-[var(--font-display)] text-2xl font-semibold text-[var(--ink)]">Xi&apos;an Tang Culture 2D1N Experience</strong>
            For 2–4 travelers · English-first communication during the booking process
          </div>
        </section>

        <BookingForm attribution={attribution} />
      </div>
    </div>
  );
}
