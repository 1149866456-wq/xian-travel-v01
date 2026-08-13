import type { BookingCreateInput, BookingRecord } from "./booking";

export type SupabaseErrorCode =
  | "SUPABASE_TIMEOUT"
  | "SUPABASE_UNAVAILABLE"
  | "SUPABASE_REJECTED"
  | "SUPABASE_CONFLICT"
  | "SUPABASE_PROTOCOL_ERROR";

export class SupabaseRequestError extends Error {
  constructor(public readonly code: SupabaseErrorCode, public readonly conflict?: "BOOKING_REFERENCE" | "SUBMISSION_TOKEN") {
    super(code);
    this.name = "SupabaseRequestError";
  }
}

export type SupabaseRequestPolicy = {
  timeoutMs: number;
  maxRetries: number;
  retryable: boolean;
};

type RequestDependencies = {
  fetch?: typeof globalThis.fetch;
  credentials?: { url: string; secret: string };
  sleep?: (milliseconds: number) => Promise<void>;
};

const READ_POLICY = { timeoutMs: 5_000, maxRetries: 1, retryable: true } as const;
const WRITE_POLICY = { timeoutMs: 8_000, maxRetries: 0, retryable: false } as const;
const RATE_LIMIT_POLICY = { timeoutMs: 5_000, maxRetries: 0, retryable: false } as const;

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new SupabaseRequestError("SUPABASE_REJECTED");
  return { url, secret };
}

export async function supabaseRequest<T>(
  path: string,
  init: RequestInit = {},
  policy: SupabaseRequestPolicy,
  dependencies: RequestDependencies = {},
): Promise<T> {
  const credentials = dependencies.credentials ?? config();
  const fetchImpl = dependencies.fetch ?? fetch;
  const sleep = dependencies.sleep ?? ((milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));

  for (let attempt = 0; attempt <= policy.maxRetries; attempt += 1) {
    try {
      const response = await fetchImpl(`${credentials.url}/rest/v1/${path}`, {
        ...init,
        signal: AbortSignal.timeout(policy.timeoutMs),
        headers: {
          apikey: credentials.secret,
          Authorization: `Bearer ${credentials.secret}`,
          "Content-Type": "application/json",
          ...(init.headers ?? {}),
        },
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new SupabaseRequestError("SUPABASE_CONFLICT", await conflictTarget(response));
        }
        const code = response.status === 408 || response.status === 429 || response.status >= 500
          ? "SUPABASE_UNAVAILABLE"
          : "SUPABASE_REJECTED";
        if (policy.retryable && attempt < policy.maxRetries && code === "SUPABASE_UNAVAILABLE") {
          await sleep(retryDelay(response.headers.get("retry-after")));
          continue;
        }
        throw new SupabaseRequestError(code);
      }

      if (response.status === 204) return undefined as T;
      try {
        return await response.json() as T;
      } catch {
        throw new SupabaseRequestError("SUPABASE_PROTOCOL_ERROR");
      }
    } catch (error) {
      if (error instanceof SupabaseRequestError) throw error;
      const timedOut = isAbortError(error);
      if (policy.retryable && attempt < policy.maxRetries) {
        await sleep(100);
        continue;
      }
      throw new SupabaseRequestError(timedOut ? "SUPABASE_TIMEOUT" : "SUPABASE_UNAVAILABLE");
    }
  }
  throw new SupabaseRequestError("SUPABASE_UNAVAILABLE");
}

async function conflictTarget(response: Response): Promise<"BOOKING_REFERENCE" | "SUBMISSION_TOKEN" | undefined> {
  try {
    const body = await response.json() as { code?: unknown; details?: unknown };
    if (body.code !== "23505" || typeof body.details !== "string") return undefined;
    if (/\bbooking_reference\b/.test(body.details)) return "BOOKING_REFERENCE";
    if (/\bsubmission_token\b/.test(body.details)) return "SUBMISSION_TOKEN";
  } catch {
    return undefined;
  }
  return undefined;
}

export async function findBySubmissionToken(token: string): Promise<BookingRecord | null> {
  const rows = await supabaseRequest<BookingRecord[]>(
    `booking_requests?submission_token=eq.${encodeURIComponent(token)}&limit=1`,
    undefined,
    READ_POLICY,
  );
  return rows[0] ?? null;
}

export async function findRecentBySubmissionToken(token: string, cutoffIso: string): Promise<BookingRecord | null> {
  const rows = await supabaseRequest<BookingRecord[]>(
    `booking_requests?submission_token=eq.${encodeURIComponent(token)}&created_at=gte.${encodeURIComponent(cutoffIso)}&limit=1`,
    undefined,
    READ_POLICY,
  );
  return rows[0] ?? null;
}

export async function insertBooking(input: BookingCreateInput, bookingReference: string): Promise<BookingRecord> {
  const rows = await supabaseRequest<BookingRecord[]>("booking_requests", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      ...input,
      booking_reference: bookingReference,
      booking_status: "NEW",
      notification_status: input.is_test ? "SKIPPED" : "PENDING",
    }),
  }, WRITE_POLICY);
  if (!rows[0]) throw new SupabaseRequestError("SUPABASE_PROTOCOL_ERROR");
  return rows[0];
}

export type RateLimitResult = { allowed: boolean; remaining: number; retry_after_seconds: number };

export async function consumeBookingRateLimit(
  keyHash: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  return await supabaseRequest<RateLimitResult>("rpc/consume_booking_rate_limit", {
    method: "POST",
    body: JSON.stringify({ p_key_hash: keyHash, p_limit: limit, p_window_seconds: windowSeconds }),
  }, RATE_LIMIT_POLICY);
}

export async function updateNotificationStatus(
  id: string,
  update: { status: "SENT" | "FAILED" | "SKIPPED"; errorCode: string | null },
): Promise<void> {
  await supabaseRequest<void>(`booking_requests?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      notification_status: update.status,
      notification_attempted_at: new Date().toISOString(),
      notification_error_code: update.errorCode,
    }),
  }, WRITE_POLICY);
}

function retryDelay(retryAfter: string | null): number {
  const seconds = retryAfter ? Number(retryAfter) : Number.NaN;
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1_000, 1_000);
  return 100;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError");
}
