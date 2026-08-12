import { findBySubmissionToken, insertBooking } from "./supabase-rest";
import type { BookingRepository } from "./booking-service";

export const bookingRepository: BookingRepository = {
  findBySubmissionToken,
  insert: insertBooking,
};
