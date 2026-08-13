import type { Metadata } from "next";
import Link from "next/link";
import { BookingSuccessDetails, successTokenCutoff } from "./booking-success-details";
import { getWhatsAppNumber } from "@/lib/config";
import { findRecentBySubmissionToken, SupabaseRequestError } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

type SuccessParams = { token?: string | string[] };
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function isSuccessToken(token: string | undefined): token is string { return Boolean(token && UUID_V4.test(token)); }

export default async function BookingSuccess({ searchParams }: { searchParams: Promise<SuccessParams> }) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  let booking = null;
  let unavailable = false;
  if (isSuccessToken(token)) {
    try {
      booking = await findRecentBySubmissionToken(token, successTokenCutoff());
    } catch (error) {
      if (error instanceof SupabaseRequestError) unavailable = true;
      else throw error;
    }
  }

  if (!booking) return <Unavailable upstream={unavailable} />;
  return <div className="container-page py-20"><BookingSuccessDetails booking={booking} whatsappNumber={getWhatsAppNumber()} /></div>;
}

function Unavailable({ upstream }: { upstream: boolean }) {
  return (
    <div className="container-page py-20">
      <div className="card mx-auto max-w-2xl p-8 text-center">
        <h1 className="text-3xl font-black">{upstream ? "Booking details temporarily unavailable" : "Booking link unavailable"}</h1>
        <p className="mt-4 text-neutral-600">{upstream
          ? "Your request may still be safely stored. Please try this page again shortly."
          : "This link may be incomplete, expired, or no longer available."}</p>
        <Link className="button-primary mt-6" href="/contact">Contact Us</Link>
      </div>
    </div>
  );
}
