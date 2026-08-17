import Image from "next/image";
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
    "A customized 2D1N final itinerary, confirmed before payment",
    "Curated experiences explicitly confirmed in your final itinerary",
    "Local coordination for the experiences confirmed in your final itinerary",
  ],
  excluded: [
    "International or domestic flights",
    "Visa costs",
    "Personal shopping",
    "Anything not expressly confirmed in your final booking",
  ],
  important: [
    "Designed for 2–4 travelers.",
    "Your final itinerary is customized for your travel date and confirmed availability.",
    "Price and payment instructions are confirmed before payment.",
    "Submitting a booking request does not create a paid or confirmed booking.",
  ],
};

export default async function TripDetail({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = attributionQuery(readAttribution(await searchParams));

  return (
    <>
      <section className="bg-[var(--paper)] pb-12 pt-10 sm:pb-16 sm:pt-14">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-[.82fr_1.18fr] lg:items-end lg:gap-16">
            <div className="pb-2">
              <p className="eyebrow">Xi&apos;an · 2 Days / 1 Night</p>
              <h1 className="mt-6 text-6xl font-semibold tracking-[-.045em] sm:text-7xl lg:text-[6.4rem]">Xi&apos;an Tang Culture 2D1N Experience</h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--muted)]">
                A focused cultural journey through Xi&apos;an for 2–4 travelers, connecting the old capital&apos;s landmarks, everyday streets, local flavors, and Tang-era context.
              </p>
            </div>

            <figure>
              <div className="image-frame aspect-[4/3] min-h-[420px] lg:min-h-[590px]">
                <Image
                  src="/images/tang-atlas/giant-wild-goose-pagoda.webp"
                  alt="Giant Wild Goose Pagoda and temple courtyard in Xi'an"
                  fill
                  priority
                  sizes="(max-width: 1023px) 100vw, 58vw"
                  className="object-[50%_38%]"
                />
              </div>
              <figcaption className="image-caption">Giant Wild Goose Pagoda · A Tang-era landmark within the city&apos;s longer story</figcaption>
            </figure>
          </div>

          <dl className="mt-10 grid border-y border-[var(--line)] sm:grid-cols-2 lg:grid-cols-4" aria-label="Trip essentials">
            <TripFact label="Duration" value="2 days / 1 night" />
            <TripFact label="Group size" value="2–4 travelers" />
            <TripFact label="Style" value="Cultural immersion" />
            <TripFact label="Price status" value="Confirmed before payment" />
          </dl>
        </div>
      </section>

      <div className="container-page grid items-start gap-12 py-[var(--section-space)] lg:grid-cols-[minmax(0,1fr)_350px] lg:gap-16">
        <div className="min-w-0">
          <section aria-labelledby="experience-title" className="grid gap-8 md:grid-cols-[.65fr_1.35fr] md:gap-12">
            <div>
              <p className="eyebrow">The experience</p>
              <h2 id="experience-title" className="mt-4 text-4xl font-semibold tracking-[-.03em] sm:text-5xl">A city best understood in layers.</h2>
            </div>
            <div className="text-lg leading-8 text-[var(--muted)]">
              <p>Begin with the city&apos;s scale and urban story, then move closer: into surviving architecture, neighborhood texture, food, and the material culture that gives the Tang period a human dimension.</p>
              <p className="mt-5">The outline below sets the journey&apos;s rhythm. The final itinerary is customized for your travel date and confirmed availability before payment.</p>
            </div>
          </section>

          <section className="mt-[var(--section-space)]" aria-labelledby="journey-title">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="eyebrow">Two-day outline</p>
                <h2 id="journey-title" className="mt-4 text-5xl font-semibold tracking-[-.035em] sm:text-6xl">Your Journey</h2>
              </div>
              <div className="hidden h-px flex-1 bg-[var(--line)] sm:block" />
            </div>

            <div className="mt-10 grid gap-14">
              <ItineraryDay
                day="Day 1"
                title="Arrive, orient, enter the old capital"
                body="Begin with Xi'an's urban story, the scale of its historic core, street-level detail, and local flavors. The goal is orientation with context, not a race through landmarks."
                image="/images/tang-atlas/xian-city-wall-hero.webp"
                alt="Cyclist traveling along Xi'an city wall"
                position="50% 45%"
              />
              <ItineraryDay
                day="Day 2"
                title="Tang culture in living detail"
                body="Go deeper through stories, surviving material culture, and curated experiences. Any hands-on element, including styling or cultural activities, is included only when confirmed in your final itinerary."
                image="/images/tang-atlas/tang-sancai-woman.webp"
                alt="Tang dynasty sancai-glazed woman figurine in the Shaanxi History Museum"
                position="50% 28%"
                reverse
              />
            </div>
          </section>

          <section className="mt-[var(--section-space)] overflow-hidden rounded-[28px] bg-[var(--jade-dark)] text-white" aria-labelledby="highlights-title">
            <div className="grid md:grid-cols-[.92fr_1.08fr]">
              <div className="image-frame min-h-[360px] rounded-none md:min-h-[500px]">
                <Image
                  src="/images/tang-atlas/xian-yangrou-paomo.webp"
                  alt="A bowl of Xi'an yangrou paomo"
                  fill
                  sizes="(max-width: 767px) 100vw, 45vw"
                  className="object-[50%_58%]"
                />
              </div>
              <div className="p-7 sm:p-10 md:p-12">
                <p className="eyebrow !text-[var(--gold)]">Experience notes</p>
                <h2 id="highlights-title" className="mt-4 text-4xl font-semibold sm:text-5xl">Highlights</h2>
                <ul className="mt-8 grid gap-0">
                  {tripInformation.highlights.map((item, index) => (
                    <li className="grid grid-cols-[36px_1fr] gap-3 border-t border-white/15 py-4" key={item}>
                      <span className="font-[var(--font-display)] text-xl text-[var(--gold)]">0{index + 1}</span>
                      <span className="leading-7 text-white/72">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="mt-[var(--section-space)]" aria-label="Trip information">
            <div className="grid gap-5 md:grid-cols-2">
              <InfoPanel number="01" title="What's Included" items={tripInformation.included} />
              <InfoPanel number="02" title="What's Not Included" items={tripInformation.excluded} />
              <InfoPanel number="03" title="Important Information" items={tripInformation.important} wide />
            </div>
          </section>
        </div>

        <aside className="card h-fit overflow-hidden lg:sticky lg:top-6" aria-labelledby="booking-title">
          <div className="bg-[var(--paper)] p-6 sm:p-7">
            <p className="eyebrow">For 2–4 travelers</p>
            <h2 id="booking-title" className="mt-4 text-4xl font-semibold">Price confirmed before payment</h2>
          </div>
          <div className="p-6 sm:p-7">
            <p className="text-sm leading-7 text-[var(--muted)]">Send your preferred date and contact details. We&apos;ll review availability and confirm your final itinerary and price before any payment step.</p>
            <Link className="button-primary mt-6 w-full" href={`/booking${query}`}>Send a Booking Request</Link>
            <p className="mt-4 text-center text-xs leading-5 text-[var(--muted)]">Booking request only — no payment is taken now.</p>
          </div>
        </aside>
      </div>
    </>
  );
}

function TripFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[var(--line)] py-5 last:border-b-0 sm:border-r sm:px-6 sm:last:border-r-0 lg:border-b-0 first:sm:pl-0">
      <dt className="text-[.68rem] font-bold uppercase tracking-[.15em] text-[var(--muted)]">{label}</dt>
      <dd className="mt-2 font-[var(--font-display)] text-2xl font-semibold leading-none">{value}</dd>
    </div>
  );
}

function ItineraryDay({ day, title, body, image, alt, position, reverse = false }: {
  day: string;
  title: string;
  body: string;
  image: string;
  alt: string;
  position: string;
  reverse?: boolean;
}) {
  return (
    <article className="grid gap-7 md:grid-cols-2 md:items-center md:gap-10">
      <div className={`image-frame aspect-[4/3] min-h-[320px] ${reverse ? "md:order-2" : ""}`}>
        <Image src={image} alt={alt} fill sizes="(max-width: 767px) 100vw, 40vw" style={{ objectPosition: position }} />
      </div>
      <div className={reverse ? "md:order-1" : ""}>
        <p className="eyebrow">{day}</p>
        <h3 className="mt-4 text-4xl font-semibold tracking-[-.03em] sm:text-5xl">{title}</h3>
        <p className="mt-5 leading-8 text-[var(--muted)]">{body}</p>
      </div>
    </article>
  );
}

function InfoPanel({ number, title, items, wide = false }: { number: string; title: string; items: string[]; wide?: boolean }) {
  return (
    <article className={`border-t border-[var(--line)] pt-6 ${wide ? "md:col-span-2" : ""}`}>
      <div className={wide ? "grid gap-6 md:grid-cols-[.65fr_1.35fr]" : ""}>
        <div>
          <div className="text-xs font-bold tracking-[.16em] text-[var(--cinnabar)]">{number}</div>
          <h2 className="mt-3 text-3xl font-semibold">{title}</h2>
        </div>
        <ul className="mt-5 grid gap-3 pl-5 leading-7 text-[var(--muted)] marker:text-[var(--cinnabar)] md:mt-0">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
    </article>
  );
}
