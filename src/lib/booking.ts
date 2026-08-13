import type { Attribution } from "./attribution";

export const BOOKING_STATUSES = ["NEW", "CONTACTED", "CONFIRMED", "CANCELLED"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_LIMITS = {
  full_name: 100,
  country: 80,
  whatsapp: 16,
  email: 254,
  notes: 2_000,
  attribution: 100,
} as const;

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

export type BookingCreateInput = BookingInput & {
  is_test: boolean;
  trip_id: "xian-tang-culture-2d1n";
};

export type BookingRecord = BookingCreateInput & {
  id: string;
  booking_reference: string;
  booking_status: BookingStatus;
  notification_status: "PENDING" | "SENT" | "FAILED" | "SKIPPED";
  notification_attempted_at: string | null;
  notification_error_code: string | null;
  created_at: string;
  updated_at: string;
};

export type BookingErrors = Partial<Record<keyof BookingInput | "payload", string>>;

export type BookingValidationResult =
  | { ok: true; input: BookingInput; honeypot: string }
  | { ok: false; errors: BookingErrors };

const INPUT_KEYS = new Set([
  "travel_date",
  "traveler_count",
  "full_name",
  "country",
  "whatsapp",
  "email",
  "notes",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "ref_code",
  "submission_token",
  "website",
]);

const DISALLOWED_CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const WHATSAPP = /^\+[1-9][0-9]{7,14}$/;

export function todayIsoUtc(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function validateBooking(input: BookingInput, now = new Date()): BookingErrors {
  const errors: BookingErrors = {};
  if (!isCalendarDate(input.travel_date)) errors.travel_date = "Choose a valid travel date.";
  else if (input.travel_date < todayIsoUtc(now)) errors.travel_date = "Travel date cannot be in the past.";
  if (!Number.isInteger(input.traveler_count) || input.traveler_count < 2 || input.traveler_count > 4) {
    errors.traveler_count = "This trip is designed for 2–4 travelers.";
  }
  if (!input.full_name.trim()) errors.full_name = "Full name is required.";
  if (!input.country.trim()) errors.country = "Country / Region is required.";
  if (!WHATSAPP.test(input.whatsapp)) errors.whatsapp = "Enter a valid WhatsApp number with country code.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) errors.email = "Enter a valid email address.";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.submission_token)) {
    errors.submission_token = "Invalid submission token.";
  }
  return errors;
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function validateBookingPayload(value: unknown, now = new Date()): BookingValidationResult {
  if (!isRecord(value)) return { ok: false, errors: { payload: "Booking details must be a JSON object." } };
  if (Object.keys(value).some((key) => !INPUT_KEYS.has(key))) {
    return { ok: false, errors: { payload: "Booking details contain unsupported fields." } };
  }

  const errors: BookingErrors = {};
  const travelDate = requiredString(value.travel_date, "travel_date", errors);
  const fullName = boundedRequired(value.full_name, "full_name", BOOKING_LIMITS.full_name, errors);
  const country = boundedRequired(value.country, "country", BOOKING_LIMITS.country, errors);
  const email = boundedRequired(value.email, "email", BOOKING_LIMITS.email, errors).toLowerCase();
  const notes = boundedOptional(value.notes, "notes", BOOKING_LIMITS.notes, errors);
  const utmSource = boundedOptional(value.utm_source, "utm_source", BOOKING_LIMITS.attribution, errors);
  const utmMedium = boundedOptional(value.utm_medium, "utm_medium", BOOKING_LIMITS.attribution, errors);
  const utmCampaign = boundedOptional(value.utm_campaign, "utm_campaign", BOOKING_LIMITS.attribution, errors);
  const refCode = boundedOptional(value.ref_code, "ref_code", BOOKING_LIMITS.attribution, errors);
  const submissionToken = requiredString(value.submission_token, "submission_token", errors);
  const honeypot = typeof value.website === "string" ? value.website.trim() : "";

  let whatsapp = "";
  if (typeof value.whatsapp !== "string") errors.whatsapp = "WhatsApp is required.";
  else {
    whatsapp = value.whatsapp.trim().replace(/[\s()\-]/g, "");
    if (whatsapp.length > BOOKING_LIMITS.whatsapp || !WHATSAPP.test(whatsapp)) {
      errors.whatsapp = "Enter a valid WhatsApp number with country code.";
    }
  }

  const travelerCount = value.traveler_count;
  if (typeof travelerCount !== "number" || !Number.isInteger(travelerCount)) {
    errors.traveler_count = "This trip is designed for 2–4 travelers.";
  }

  const input: BookingInput = {
    travel_date: travelDate,
    traveler_count: typeof travelerCount === "number" ? travelerCount : Number.NaN,
    full_name: fullName,
    country,
    whatsapp,
    email,
    notes,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    ref_code: refCode,
    submission_token: submissionToken,
  };

  Object.assign(errors, validateBooking(input, now));
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, input, honeypot };
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, field: keyof BookingInput, errors: BookingErrors): string {
  if (typeof value !== "string") {
    errors[field] = `${field} must be text.`;
    return "";
  }
  return value.trim();
}

function boundedRequired(
  value: unknown,
  field: keyof BookingInput,
  maximum: number,
  errors: BookingErrors,
): string {
  const result = requiredString(value, field, errors);
  if (result.length > maximum) errors[field] = `${field} must be ${maximum} characters or fewer.`;
  else if (DISALLOWED_CONTROL.test(result)) errors[field] = `${field} contains unsupported characters.`;
  return result;
}

function boundedOptional(
  value: unknown,
  field: keyof BookingInput,
  maximum: number,
  errors: BookingErrors,
): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") {
    errors[field] = `${field} must be text.`;
    return null;
  }
  const result = value.trim();
  if (!result) return null;
  if (result.length > maximum) errors[field] = `${field} must be ${maximum} characters or fewer.`;
  else if (DISALLOWED_CONTROL.test(result)) errors[field] = `${field} contains unsupported characters.`;
  return result;
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
