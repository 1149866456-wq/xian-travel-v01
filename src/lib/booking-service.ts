import { generateBookingReference, sanitizeBooking, type BookingCreateInput, type BookingInput, type BookingRecord } from "./booking";
import { SupabaseRequestError } from "./supabase-rest";

export type BookingRepository = {
  findBySubmissionToken(token: string): Promise<BookingRecord | null>;
  insert(input: BookingCreateInput, bookingReference: string): Promise<BookingRecord>;
};

function isBookingReferenceConflict(error: unknown): boolean {
  return error instanceof SupabaseRequestError && error.code === "SUPABASE_CONFLICT" && error.conflict === "BOOKING_REFERENCE";
}

export async function createBooking(
  rawInput: BookingInput,
  repository: BookingRepository,
  makeReference: () => string = () => generateBookingReference(),
  flags: Pick<BookingCreateInput, "is_test" | "trip_id"> = { is_test: false, trip_id: "xian-tang-culture-2d1n" },
): Promise<{ booking: BookingRecord; duplicated: boolean }> {
  const input = { ...sanitizeBooking(rawInput), ...flags };
  const existing = await repository.findBySubmissionToken(input.submission_token);
  if (existing) return { booking: existing, duplicated: true };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return { booking: await repository.insert(input, makeReference()), duplicated: false };
    } catch (error) {
      const raced = await repository.findBySubmissionToken(input.submission_token);
      if (raced) return { booking: raced, duplicated: true };
      if (!isBookingReferenceConflict(error) || attempt === 4) throw error;
    }
  }
  throw new Error("Unable to generate a unique booking reference.");
}
