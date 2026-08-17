import { NextResponse } from "next/server";
import { createBooking } from "@/lib/booking-service";
import { bookingRepository } from "@/lib/repository";
import { validateBooking, type BookingInput } from "@/lib/booking";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as BookingInput;
    const errors = validateBooking(input);
    if (Object.keys(errors).length) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    const { booking, duplicated } = await createBooking(input, bookingRepository);
    return NextResponse.json({
      ok: true,
      duplicated,
      bookingReference: booking.booking_reference,
      successUrl: `/booking/success?token=${encodeURIComponent(booking.submission_token)}`,
    });
  } catch (error) {
    console.error("booking_submission_failed", error);
    return NextResponse.json(
      { ok: false, message: "We couldn't submit your booking request. Please try again or contact us for help." },
      { status: 500 },
    );
  }
}
