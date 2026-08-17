import Image from "next/image";
import Link from "next/link";
import { attributionQuery, readAttribution, type SearchParams } from "@/lib/attribution";

const culturalChapters = [
  ["01", "Read the old capital", "Trace Xi'an through its walls, streets, surviving landmarks, and the scale of a city that once looked outward to the world."],
  ["02", "Meet Tang aesthetics", "Use stories and material culture to make the period vivid, with any hands-on experience confirmed in your final itinerary."],
  ["03", "Taste the city slowly", "Make room for local food moments and conversation, following a small-group pace instead of a packaged checklist."],
];

const bookingSteps = [
  ["01", "Send your request", "Share a preferred date, group size, and the best way to reach you."],
  ["02", "We review availability", "We check what can be arranged for your dates and small group."],
  ["03", "Confirm before payment", "We confirm the final itinerary, inclusions, price, and payment instructions with you."],
];

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const attribution = readAttribution(await searchParams);
  const query = attributionQuery(attribution);

  return (
    <>
      <section className="overflow-hidden bg-[var(--paper)]">
        <div className="container-page grid gap-10 py-10 lg:min-h-[720px] lg:grid-cols-[.82fr_1.18fr] lg:items-stretch lg:gap-16 lg:py-14">
          <div className="flex flex-col justify-center py-6 lg:py-16">
            <p className="eyebrow">Xi&apos;an · Tang Culture · Small Group</p>
            <h1 className="display-title mt-6 max-w-3xl">Meet ancient Xi&apos;an with a modern traveler&apos;s pace.</h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-[var(--muted)] sm:text-lg">
              A carefully paced cultural journey for 2–4 travelers, shaped for international guests who want local context, clear communication, and time to look closer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="button-primary" href={`/trips/xian-tang-culture-2d1n${query}`}>View the Trip</Link>
              <Link className="button-secondary" href={`/booking${query}`}>Send a Booking Request</Link>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-4 border-t border-[var(--line)] pt-5 text-sm">
              <HeroFact value="2D1N" label="Journey" />
              <HeroFact value="2–4" label="Travelers" />
              <HeroFact value="Xi'an" label="One city, deeply" />
            </div>
          </div>

          <figure className="min-w-0">
            <div className="image-frame min-h-[470px] h-full lg:min-h-[620px]">
              <Image
                src="/images/tang-atlas/xian-city-wall-hero.webp"
                alt="View from Xi'an city wall toward the modern city beyond"
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 58vw"
                className="object-[50%_45%]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-6 pt-24 text-white sm:p-8">
                <p className="max-w-md font-[var(--font-display)] text-3xl font-semibold leading-none sm:text-4xl">An old capital, read at human pace.</p>
              </div>
            </div>
            <figcaption className="image-caption">Xi&apos;an city wall · A living line between the historic core and the city today</figcaption>
          </figure>
        </div>
      </section>

      <section className="container-page section-space">
        <div className="grid gap-10 lg:grid-cols-[1.12fr_.88fr] lg:items-center lg:gap-20">
          <figure>
            <div className="image-frame aspect-[4/3]">
              <Image
                src="/images/tang-atlas/giant-wild-goose-pagoda.webp"
                alt="Giant Wild Goose Pagoda in Xi'an seen across the temple courtyard"
                fill
                sizes="(max-width: 1023px) 100vw, 56vw"
                className="object-[50%_38%]"
              />
            </div>
            <figcaption className="image-caption">Giant Wild Goose Pagoda · A landmark rooted in Tang-era Xi&apos;an</figcaption>
          </figure>

          <div>
            <p className="eyebrow">Featured journey</p>
            <h2 className="mt-5 text-5xl font-semibold tracking-[-.035em] sm:text-6xl">Xi&apos;an Tang Culture 2D1N Experience</h2>
            <p className="mt-6 text-lg leading-8 text-[var(--muted)]">
              History without rushing, cultural context without a lecture-room pace, and practical support for international guests.
            </p>
            <div className="mt-8 border-y border-[var(--line)] py-5">
              <div className="text-xs font-bold uppercase tracking-[.16em] text-[var(--muted)]">Price status</div>
              <div className="mt-1 font-[var(--font-display)] text-3xl font-semibold">Confirmed before payment</div>
            </div>
            <Link className="button-primary mt-7" href={`/trips/xian-tang-culture-2d1n${query}`}>Explore the Journey</Link>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[var(--jade-dark)] py-[var(--section-space)] text-white">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-end lg:gap-20">
            <div>
              <p className="eyebrow !text-[var(--jade-gold)]">A cultural journey in three chapters</p>
              <h2 className="mt-5 max-w-2xl text-5xl font-semibold tracking-[-.035em] sm:text-6xl">Culture becomes memorable when it has texture.</h2>
            </div>
            <p className="max-w-xl text-base leading-8 text-[var(--jade-muted)] lg:justify-self-end">
              Places, objects, food, and stories work together. The result is not a themed checklist, but a clearer way to understand the city around you.
            </p>
          </div>

          <div className="mt-14 grid gap-10 lg:grid-cols-[.82fr_1.18fr] lg:gap-20">
            <div className="grid grid-cols-[.75fr_1.25fr] gap-3">
              <div className="image-frame min-h-[430px] rounded-none">
                <Image
                  src="/images/tang-atlas/tang-sancai-woman.webp"
                  alt="Tang dynasty sancai-glazed woman figurine in the Shaanxi History Museum"
                  fill
                  sizes="(max-width: 1023px) 38vw, 24vw"
                  className="object-[50%_28%]"
                />
              </div>
              <div className="image-frame min-h-[430px] rounded-none">
                <Image
                  src="/images/tang-atlas/xian-yangrou-paomo.webp"
                  alt="A bowl of Xi'an yangrou paomo served in a patterned ceramic bowl"
                  fill
                  sizes="(max-width: 1023px) 62vw, 34vw"
                  className="object-[50%_58%]"
                />
              </div>
            </div>

            <ol className="grid content-center">
              {culturalChapters.map(([number, title, body]) => (
                <li className="grid grid-cols-[44px_1fr] gap-4 border-t border-white/15 py-6 sm:grid-cols-[64px_1fr]" key={number}>
                  <div className="font-[var(--font-display)] text-2xl font-semibold text-[var(--jade-gold)]">{number}</div>
                  <div>
                    <h3 className="text-3xl font-semibold">{title}</h3>
                    <p className="mt-3 max-w-xl leading-7 text-[var(--jade-muted)]">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="container-page section-space">
        <div className="grid gap-8 md:grid-cols-[1.2fr_.8fr] md:items-end">
          <div>
            <p className="eyebrow">Xi&apos;an in layers</p>
            <h2 className="mt-5 max-w-3xl text-5xl font-semibold tracking-[-.035em] sm:text-6xl">Monuments are only the beginning.</h2>
          </div>
          <p className="max-w-lg leading-8 text-[var(--muted)] md:justify-self-end">Street life, local kitchens, and quieter temple spaces keep the journey grounded in the city as it is lived now.</p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-12 md:grid-rows-2">
          <figure className="md:col-span-7 md:row-span-2">
            <div className="image-frame min-h-[430px] h-full md:min-h-[620px]">
              <Image src="/images/tang-atlas/xian-muslim-quarter.webp" alt="Street scene in Xi'an's Muslim Quarter" fill sizes="(max-width: 767px) 100vw, 58vw" className="object-[52%_38%]" />
            </div>
            <figcaption className="image-caption">Muslim Quarter · Everyday movement, food, and neighborhood texture</figcaption>
          </figure>
          <figure className="md:col-span-5">
            <div className="image-frame aspect-[4/3] md:h-full md:aspect-auto">
              <Image src="/images/tang-atlas/xian-roujiamo.webp" alt="Roujiamo being prepared at a Xi'an food stall" fill sizes="(max-width: 767px) 100vw, 42vw" className="object-[50%_52%]" />
            </div>
          </figure>
          <figure className="md:col-span-5">
            <div className="image-frame aspect-[4/3] md:h-full md:aspect-auto">
              <Image src="/images/tang-atlas/dacien-temple.webp" alt="Daci'en Temple courtyard and pagoda in Xi'an" fill sizes="(max-width: 767px) 100vw, 42vw" className="object-[50%_42%]" />
            </div>
          </figure>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--paper)] py-[var(--section-space)]">
        <div className="container-page">
          <p className="eyebrow">How booking works</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
            <h2 className="text-5xl font-semibold tracking-[-.035em] sm:text-6xl">Clear before any payment.</h2>
            <ol className="grid gap-0 sm:grid-cols-3">
              {bookingSteps.map(([number, title, body]) => (
                <li className="border-t border-[var(--line)] py-5 sm:border-l sm:border-t-0 sm:px-6 sm:py-0" key={number}>
                  <div className="text-xs font-bold tracking-[.16em] text-[var(--cinnabar)]">{number}</div>
                  <h3 className="mt-4 text-2xl font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="container-page pt-[var(--section-space)]">
        <div className="grid overflow-hidden rounded-[28px] bg-[var(--cinnabar)] text-white md:grid-cols-[1fr_auto] md:items-center">
          <div className="p-8 sm:p-12">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-white/65">Your Xi&apos;an story can start here</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-.03em] sm:text-5xl">Tell us when you would like to travel.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-white/72">Send a request now. Availability, itinerary, inclusions, and price are confirmed with you before payment.</p>
          </div>
          <div className="px-8 pb-8 md:px-12 md:pb-0">
            <Link className="button-secondary !border-white/20 !bg-white !text-[var(--cinnabar)]" href={`/booking${query}`}>Send a Booking Request</Link>
          </div>
        </div>
      </section>
    </>
  );
}

function HeroFact({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-[var(--font-display)] text-2xl font-semibold sm:text-3xl">{value}</div>
      <div className="mt-1 text-[.67rem] font-bold uppercase tracking-[.12em] text-[var(--muted)]">{label}</div>
    </div>
  );
}
