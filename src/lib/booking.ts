import type { Attribution } from "./attribution";

export const BOOKING_STATUSES = ["NEW", "CONTACTED", "CONFIRMED", "CANCELLED"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type BookingInput = Attribution & {
  travel_date: string;
  traveler_count: number;
  full_name: string;
  country: string;
  whatsapp: string;
  email: string;
  notes: string | null;
  submission_token: string;
};

export type BookingRecord = BookingInput & {
  id: string;
  booking_reference: string;
  booking_status: BookingStatus;
  created_at: string;
  updated_at: string;
};

export type BookingErrors = Partial<Record<keyof BookingInput, string>>;

export function todayIsoUtc(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function validateBooking(input: BookingInput, now = new Date()): BookingErrors {
  const errors: BookingErrors = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.travel_date)) errors.travel_date = "Choose a valid travel date.";
  else if (input.travel_date < todayIsoUtc(now)) errors.travel_date = "Travel date cannot be in the past.";
  if (!Number.isInteger(input.traveler_count) || input.traveler_count < 2 || input.traveler_count > 4) {
    errors.traveler_count = "This trip is designed for 2–4 travelers.";
  }
  if (!input.full_name.trim()) errors.full_name = "Full name is required.";
  if (!input.country.trim()) errors.country = "Country / Region is required.";
  if (!input.whatsapp.trim()) errors.whatsapp = "WhatsApp is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) errors.email = "Enter a valid email address.";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.submission_token)) {
    errors.submission_token = "Invalid submission token.";
  }
  return errors;
}

export function sanitizeBooking(input: BookingInput): BookingInput {
  const clean = (value: string | null) => value?.trim() || null;
  return {
    ...input,
    full_name: input.full_name.trim(),
    country: input.country.trim(),
    whatsapp: input.whatsapp.trim(),
    email: input.email.trim().toLowerCase(),
    notes: clean(input.notes),
    utm_source: clean(input.utm_source),
    utm_medium: clean(input.utm_medium),
    utm_campaign: clean(input.utm_campaign),
    ref_code: clean(input.ref_code),
  };
}

function randomSuffix(length = 6): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export function generateBookingReference(now = new Date()): string {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `XAT-${date}-${randomSuffix()}`;
}
