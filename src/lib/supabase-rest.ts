import type { BookingInput, BookingRecord } from "./booking";

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Booking service is not configured in this environment.");
  return { url, secret };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { url, secret } = config();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: secret,
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${detail}`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function findBySubmissionToken(token: string): Promise<BookingRecord | null> {
  const rows = await request<BookingRecord[]>(`booking_requests?submission_token=eq.${encodeURIComponent(token)}&limit=1`);
  return rows[0] ?? null;
}

export async function insertBooking(input: BookingInput, bookingReference: string): Promise<BookingRecord> {
  const rows = await request<BookingRecord[]>("booking_requests", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...input, booking_reference: bookingReference, booking_status: "NEW" }),
  });
  if (!rows[0]) throw new Error("Supabase insert returned no row.");
  return rows[0];
}
