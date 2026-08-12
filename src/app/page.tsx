import Link from "next/link";
import { attributionQuery, readAttribution, type SearchParams } from "@/lib/attribution";

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const attribution = readAttribution(await searchParams);
  const query = attributionQuery(attribution);

  return (
    <>
      <section className="hero-pattern overflow-hidden">
        <div className="container-page grid min-h-[670px] items-center gap-12 py-16 md:grid-cols-[1.08fr_.92fr]">
          <div>
            <div className="eyebrow">Xi&apos;an · Tang Culture · Small Group</div>
            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[1.03] tracking-[-0.045em] md:text-7xl">
              Meet ancient Xi&apos;an with a modern traveler&apos;s pace.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-700">
              A carefully paced 2-day cultural experience for 2–4 travelers, built for international guests who want context, comfort, and memorable local moments.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="button-primary" href={`/trips/xian-tang-culture-2d1n${query}`}>View Trip</Link>
              <Link className="button-secondary" href={`/booking${query}`}>Book Now</Link>
            </div>
          </div>
          <div className="relative min-h-[430px] rounded-[34px] border border-white/60 bg-[#243d35] p-7 text-white shadow-2xl">
            <div className="absolute inset-5 rounded-[26px] border border-white/15" />
            <div className="relative flex h-full min-h-[376px] flex-col justify-between">
              <div className="text-sm font-bold uppercase tracking-[.18em] text-[#edc98d]">Tang Dynasty Echoes</div>
              <div>
                <div className="text-4xl font-black">2 Days / 1 Night</div>
                <div className="mt-2 text-white/75">Designed for 2–4 travelers</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white/10 p-4">City walls & old quarters</div>
                <div className="rounded-2xl bg-white/10 p-4">Tang culture storytelling</div>
                <div className="rounded-2xl bg-white/10 p-4">Local food moments</div>
                <div className="rounded-2xl bg-white/10 p-4">Private-paced experience</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="eyebrow">Featured Journey</div>
        <div className="mt-4 grid gap-8 md:grid-cols-[1fr_.7fr] md:items-end">
          <div>
            <h2 className="text-4xl font-black tracking-tight md:text-5xl">Xi&apos;an Tang Culture 2D1N Experience</h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-neutral-600">History without rushing, culture without the lecture-room feeling, and practical support for overseas guests.</p>
          </div>
          <div className="card p-6">
            <div className="text-sm text-neutral-500">Price</div>
            <div className="mt-1 text-xl font-black">Confirmed before payment</div>
            <Link className="button-primary mt-5" href={`/trips/xian-tang-culture-2d1n${query}`}>Explore the Trip</Link>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f2e9] py-20">
        <div className="container-page">
          <div className="eyebrow">Experience Highlights</div>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {[
              ["Tang culture, made vivid", "Understand the era through places, stories, dress, food, and the shape of the city."],
              ["Built for international guests", "Clear English-first communication, practical pre-trip guidance, and WhatsApp follow-up."],
              ["A small-group rhythm", "Designed for 2–4 travelers so the pace can feel personal rather than packaged."],
            ].map(([title, body]) => <div className="card p-6" key={title}><h3 className="text-xl font-black">{title}</h3><p className="mt-3 leading-7 text-neutral-600">{body}</p></div>)}
          </div>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="grid gap-8 md:grid-cols-2">
          <div><div className="eyebrow">Why Travel With Us</div><h2 className="mt-4 text-4xl font-black">Local depth. International clarity.</h2></div>
          <div className="grid gap-4 text-neutral-700">
            <p>We focus on one strong Xi&apos;an experience first instead of pretending to be a giant marketplace.</p>
            <p>Booking starts as a request. We confirm availability, itinerary details, and price before any future payment step.</p>
            <p>Your booking request receives a unique reference so follow-up remains clear from the first contact.</p>
          </div>
        </div>
      </section>

      <section className="container-page pb-6">
        <div className="rounded-[30px] bg-[#a33d2e] p-8 text-white md:flex md:items-center md:justify-between md:p-12">
          <div><div className="text-sm font-bold uppercase tracking-[.16em] text-white/70">Your Xi&apos;an story can start here</div><h2 className="mt-3 text-3xl font-black md:text-4xl">Send a booking request in a few minutes.</h2></div>
          <Link className="button-secondary mt-6 !border-white/25 !bg-white !text-[#7c291f] md:mt-0" href={`/booking${query}`}>Book Now</Link>
        </div>
      </section>
    </>
  );
}
