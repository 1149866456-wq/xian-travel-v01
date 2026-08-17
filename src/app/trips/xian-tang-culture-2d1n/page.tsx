import Link from "next/link";
import { attributionQuery, readAttribution, type SearchParams } from "@/lib/attribution";

const tripInformation = {
  highlights: [
    "Tang-inspired cultural immersion",
    "Xi'an city heritage and old-capital context",
    "Local food experiences",
    "A small-group pace for 2–4 travelers",
  ],
  included: [
    "A planned 2D1N itinerary",
    "Local coordination and English-speaking support",
    "Curated experiences confirmed in your final itinerary",
  ],
  excluded: [
    "International or domestic flights",
    "Visa costs",
    "Personal shopping",
    "Anything not confirmed in your final booking",
  ],
  important: [
    "Designed for 2–4 travelers.",
    "Final itinerary depends on travel date and confirmed availability.",
    "Price is confirmed before payment.",
    "This is a booking request only; no online payment is taken.",
  ],
};

export default async function TripDetail({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = attributionQuery(readAttribution(await searchParams));

  return (
    <div className="container-page py-14">
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <section aria-labelledby="trip-title">
            <p className="eyebrow">Xi&apos;an · 2 Days / 1 Night</p>
            <h1 id="trip-title" className="mt-4 text-5xl font-black tracking-tight md:text-6xl">Xi&apos;an Tang Culture 2D1N Experience</h1>
            <div className="card mt-6 bg-[#f8f4ec] p-6 md:p-7">
              <p className="max-w-3xl text-lg leading-8 text-neutral-700">A focused cultural journey through Xi&apos;an for 2–4 travelers. Discover the city&apos;s Tang heritage through its streets, flavors, and stories, with time to understand the old capital at a comfortable pace.</p>

              <dl className="mt-6 grid gap-4 sm:grid-cols-3" aria-label="Trip essentials">
                <div className="rounded-2xl border border-black/10 bg-white/65 p-4">
                  <dt className="text-sm font-bold text-neutral-600">Duration</dt>
                  <dd className="mt-1 font-bold">2 days / 1 night</dd>
                </div>
                <div className="rounded-2xl border border-black/10 bg-white/65 p-4">
                  <dt className="text-sm font-bold text-neutral-600">Group size</dt>
                  <dd className="mt-1 font-bold">2–4 travelers</dd>
                </div>
                <div className="rounded-2xl border border-black/10 bg-white/65 p-4">
                  <dt className="text-sm font-bold text-neutral-600">Style</dt>
                  <dd className="mt-1 font-bold">Cultural immersion</dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="mt-14" aria-labelledby="journey-title">
            <p className="eyebrow">Two-day outline</p>
            <h2 id="journey-title" className="mt-3 text-3xl font-black tracking-tight">Your Journey</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <article className="card min-h-60 !bg-[#233c35] p-7 text-white">
                <p className="eyebrow !text-[#e7c47f]">Day 1</p>
                <h3 className="mt-3 text-2xl font-black">Arrive, orient, enter the old capital</h3>
                <p className="mt-4 leading-7 text-white/75">Begin with Xi&apos;an&apos;s urban story, old-city texture, local flavors, and the context needed to understand the Tang capital.</p>
              </article>
              <article className="card min-h-60 !bg-[#f2e5d2] p-7">
                <p className="eyebrow">Day 2</p>
                <h3 className="mt-3 text-2xl font-black">Tang culture in living detail</h3>
                <p className="mt-4 leading-7 text-neutral-700">Spend the second day with deeper Tang-era storytelling and cultural experiences before the journey closes.</p>
              </article>
            </div>
          </section>

          <section className="mt-14" aria-label="Trip information">
            <div className="grid gap-5 md:grid-cols-2">
              <Info title="Highlights" items={tripInformation.highlights} />
              <Info title="What&apos;s Included" items={tripInformation.included} />
              <Info title="What&apos;s Not Included" items={tripInformation.excluded} />
              <Info title="Important Information" items={tripInformation.important} />
            </div>
          </section>
        </div>

        <aside className="card h-fit p-6 lg:sticky lg:top-6" aria-labelledby="booking-title">
          <p className="text-sm font-bold text-neutral-500">For 2–4 travelers</p>
          <h2 id="booking-title" className="mt-2 text-2xl font-black">Price confirmed before payment</h2>
          <p className="mt-4 text-sm leading-6 text-neutral-600">Send your preferred date and contact details to make a request. We&apos;ll confirm availability and the price before any payment step.</p>
          <Link className="button-primary mt-6 w-full" href={`/booking${query}`}>Book Now</Link>
          <p className="mt-3 text-center text-xs leading-5 text-neutral-500">Booking request only — no payment is taken now.</p>
        </aside>
      </div>
    </div>
  );
}

function Info({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="card p-6">
      <h2 className="text-2xl font-black">{title}</h2>
      <ul className="mt-4 grid list-disc gap-3 pl-5 leading-7 text-neutral-700 marker:text-[#a33d2e]">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </article>
  );
}
