import { BookingForm } from "@/components/booking-form";
import { cookies } from "next/headers";
import {
  ATTRIBUTION_COOKIE,
  decodeAttributionCookie,
  mergeFirstTouch,
  readAttribution,
  type SearchParams,
} from "@/lib/attribution";

export default async function BookingPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [params, cookieStore] = await Promise.all([searchParams, cookies()]);
  const attribution = mergeFirstTouch(
    decodeAttributionCookie(cookieStore.get(ATTRIBUTION_COOKIE)?.value),
    readAttribution(params),
  );
  return (
    <div className="container-page grid gap-10 py-14 lg:grid-cols-[.75fr_1.25fr]">
      <div>
        <div className="eyebrow">Booking Request</div>
        <h1 className="mt-4 text-5xl font-black tracking-tight">Plan your Xi&apos;an Tang Culture trip.</h1>
        <p className="mt-5 text-lg leading-8 text-neutral-650">Tell us your preferred date and contact details. We&apos;ll confirm availability, final itinerary, and pricing before any payment.</p>
        <div className="mt-7 rounded-2xl border border-black/10 p-5 text-sm leading-6 text-neutral-650">
          <strong>Xi&apos;an Tang Culture 2D1N Experience</strong><br />For 2–4 travelers · English-first support
        </div>
      </div>
      <BookingForm attribution={attribution} />
    </div>
  );
}
