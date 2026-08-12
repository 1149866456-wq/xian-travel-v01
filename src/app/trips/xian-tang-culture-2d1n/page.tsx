import Link from "next/link";
import { attributionQuery, readAttribution, type SearchParams } from "@/lib/attribution";

const bullets = {
  highlights: ["Tang-era cultural context", "Xi&apos;an city heritage", "Local food experiences", "Small-group pace for 2–4 travelers"],
  included: ["Planned 2D1N itinerary", "Local coordination and English-first support", "Experiences specifically confirmed in your final itinerary"],
  excluded: ["International / domestic flights", "Visa costs", "Personal shopping", "Anything not confirmed in your final booking"],
};

export default async function TripDetail({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = attributionQuery(readAttribution(await searchParams));
  return (
    <div className="container-page py-14">
      <div className="eyebrow">Xi&apos;an · 2 Days / 1 Night</div>
      <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="text-5xl font-black tracking-tight md:text-6xl">Xi&apos;an Tang Culture 2D1N Experience</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-650">A focused cultural journey through Xi&apos;an for 2–4 travelers. The experience connects the city&apos;s Tang heritage with the places, tastes, and stories that make the history easier to feel.</p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="card min-h-60 bg-[#233c35] p-7 text-white"><div className="eyebrow !text-[#e7c47f]">Day 1</div><h2 className="mt-3 text-2xl font-black">Arrive, orient, enter the old capital</h2><p className="mt-4 leading-7 text-white/75">Begin with Xi&apos;an&apos;s urban story, old city texture, local flavors, and the context needed to understand the Tang capital.</p></div>
            <div className="card min-h-60 bg-[#f2e5d2] p-7"><div className="eyebrow">Day 2</div><h2 className="mt-3 text-2xl font-black">Tang culture in living detail</h2><p className="mt-4 leading-7 text-neutral-700">Spend the second day with deeper Tang-era storytelling and cultural experiences before the journey closes.</p></div>
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-2">
            <Info title="Highlights" items={bullets.highlights} />
            <Info title="What's Included" items={bullets.included} />
            <Info title="What's Not Included" items={bullets.excluded} />
            <div><h2 className="text-2xl font-black">Important Information</h2><ul className="mt-4 grid gap-3 leading-7 text-neutral-700"><li>• Designed for 2–4 travelers.</li><li>• Final itinerary depends on travel date and confirmed availability.</li><li>• Price is confirmed before payment.</li><li>• V0.1 accepts booking requests only; no online payment is taken.</li></ul></div>
          </div>
        </div>

        <aside className="card h-fit p-6 lg:sticky lg:top-6">
          <div className="text-sm font-bold text-neutral-500">For 2–4 travelers</div>
          <div className="mt-2 text-2xl font-black">Price confirmed before payment</div>
          <p className="mt-4 text-sm leading-6 text-neutral-600">Send your preferred date and contact details. We&apos;ll follow up before any payment step.</p>
          <Link className="button-primary mt-6 w-full" href={`/booking${query}`}>Book Now</Link>
        </aside>
      </div>
    </div>
  );
}

function Info({ title, items }: { title: string; items: string[] }) {
  return <div><h2 className="text-2xl font-black">{title}</h2><ul className="mt-4 grid gap-3 leading-7 text-neutral-700">{items.map((item) => <li key={item}>• {item.replaceAll("&apos;", "'")}</li>)}</ul></div>;
}
