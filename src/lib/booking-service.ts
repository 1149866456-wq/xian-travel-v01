import { generateBookingReference, sanitizeBooking, type BookingInput, type BookingRecord } from "./booking";

export type BookingRepository = {
  findBySubmissionToken(token: string): Promise<BookingRecord | null>;
  insert(input: BookingInput, bookingReference: string): Promise<BookingRecord>;
};

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && (error.message.includes("23505") || error.message.toLowerCase().includes("duplicate key"));
}

export async function createBooking(
  rawInput: BookingInput,
  repository: BookingRepository,
  makeReference: () => string = () => generateBookingReference(),
): Promise<{ booking: BookingRecord; duplicated: boolean }> {
  const input = sanitizeBooking(rawInput);
  const existing = await repository.findBySubmissionToken(input.submission_token);
  if (existing) return { booking: existing, duplicated: true };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return { booking: await repository.insert(input, makeReference()), duplicated: false };
    } catch (error) {
      const raced = await repository.findBySubmissionToken(input.submission_token);
      if (raced) return { booking: raced, duplicated: true };
      if (!isUniqueViolation(error) || attempt === 4) throw error;
    }
  }
  throw new Error("Unable to generate a unique booking reference.");
}
