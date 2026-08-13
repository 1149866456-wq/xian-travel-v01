import { findBySubmissionToken, insertBooking, updateNotificationStatus } from "./supabase-rest";
import type { BookingRepository } from "./booking-service";

export const bookingRepository: BookingRepository = {
  findBySubmissionToken,
  insert: insertBooking,
};

export const notificationRepository = { updateNotificationStatus };
