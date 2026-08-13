import { NextResponse } from "next/server";
import { createBooking as createBookingService } from "@/lib/booking-service";
import { notifyNewBooking as notifyBooking, sendFeishuBookingNotification } from "@/lib/booking-notification";
import { validateBookingPayload, type BookingInput, type BookingRecord } from "@/lib/booking";
import { getRuntimeConfig } from "@/lib/config";
import { bookingLog, type BookingLogEntry } from "@/lib/log";
import { bookingRepository, notificationRepository } from "@/lib/repository";
import { hashRateLimitKey, readBoundedBody, validateBookingRequestHeaders, verifyE2ESecret } from "@/lib/request-guard";
import { consumeBookingRateLimit, SupabaseRequestError } from "@/lib/supabase-rest";

export const runtime = "nodejs";
export const maxDuration = 15;

type RateLimitDecision = { allowed: boolean; remaining: number; retryAfterSeconds: number };
type RouteConfig = {
  rateLimitHashSecret: string;
  bookingE2ESecret: string | null;
  bookingNotificationWebhookUrl: string | null;
};

export type BookingRouteDependencies = {
  consumeRateLimit(keyHash: string): Promise<RateLimitDecision>;
  createBooking(
    input: BookingInput,
    flags: { is_test: boolean; trip_id: "xian-tang-culture-2d1n" },
  ): Promise<{ booking: BookingRecord; duplicated: boolean }>;
  notifyNewBooking(booking: BookingRecord, webhookUrl: string | null): Promise<{ ok: boolean; errorCode?: string }>;
  now(): Date;
  getConfig(): RouteConfig;
  log(entry: BookingLogEntry): void;
};

export function createBookingPostHandler(dependencies: BookingRouteDependencies) {
  return async function POST(request: Request) {
    const startedAt = Date.now();
    const requestId = crypto.randomUUID();
    dependencies.log({ event: "booking_submission_started", requestId });

    const headers = validateBookingRequestHeaders(request);
    if (!headers.ok) return NextResponse.json({ ok: false, message: headers.message }, { status: headers.status });

    const body = await readBoundedBody(request, 16_384);
    if (!body.ok) return NextResponse.json({ ok: false, message: body.message }, { status: body.status });

    let config: RouteConfig;
    try {
      config = dependencies.getConfig();
    } catch {
      dependencies.log({ event: "booking_upstream_failed", requestId, code: "CONFIGURATION_ERROR", status: 503 });
      return unavailable();
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",", 1)[0].trim();
    if (!ip) return NextResponse.json({ ok: false, message: "Request source unavailable." }, { status: 403 });
    const keyHash = hashRateLimitKey(ip, config.rateLimitHashSecret);

    try {
      const decision = await dependencies.consumeRateLimit(keyHash);
      if (!decision.allowed) {
        dependencies.log({
          event: "booking_rate_limited",
          requestId,
          status: 429,
          rateLimitKeyPrefix: keyHash.slice(0, 12),
        });
        return NextResponse.json(
          { ok: false, message: "Too many booking attempts. Please try again later." },
          { status: 429, headers: { "Retry-After": String(decision.retryAfterSeconds) } },
        );
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(body.value) as unknown;
      } catch {
        return NextResponse.json({ ok: false, message: "Booking request contains invalid JSON." }, { status: 400 });
      }

      const providedE2ESecret = request.headers.get("x-booking-e2e-secret");
      const isTest = verifyE2ESecret(providedE2ESecret, config.bookingE2ESecret);
      if (providedE2ESecret && !isTest) {
        return NextResponse.json({ ok: false, message: "Test authentication failed." }, { status: 403 });
      }

      const validation = validateBookingPayload(parsed, dependencies.now());
      if (!validation.ok) {
        dependencies.log({ event: "booking_validation_failed", requestId, status: 422, fields: Object.keys(validation.errors) });
        return NextResponse.json({ ok: false, errors: validation.errors }, { status: 422 });
      }
      if (validation.honeypot) return NextResponse.json({ ok: false, message: "Request rejected." }, { status: 403 });

      const { booking, duplicated } = await dependencies.createBooking(validation.input, {
        is_test: isTest,
        trip_id: "xian-tang-culture-2d1n",
      });

      if (!duplicated) {
        try {
          const notification = await dependencies.notifyNewBooking(booking, config.bookingNotificationWebhookUrl);
          dependencies.log({
            event: notification.ok ? "booking_notification_sent" : "booking_notification_failed",
            requestId,
            bookingReference: booking.booking_reference,
            isTest: booking.is_test,
            code: notification.errorCode,
          });
        } catch {
          dependencies.log({
            event: "booking_notification_failed",
            requestId,
            bookingReference: booking.booking_reference,
            isTest: booking.is_test,
            code: "NOTIFICATION_STATE_UPDATE_FAILED",
          });
        }
      }

      dependencies.log({
        event: duplicated ? "booking_duplicate_recovered" : "booking_created",
        requestId,
        bookingReference: booking.booking_reference,
        isTest: booking.is_test,
        durationMs: Date.now() - startedAt,
      });
      return NextResponse.json({
        ok: true,
        duplicated,
        bookingReference: booking.booking_reference,
        successUrl: `/booking/success?token=${encodeURIComponent(booking.submission_token)}`,
        testEvidence: isTest ? {
          is_test: true,
          utm_source: booking.utm_source,
          ref_code: booking.ref_code,
        } : undefined,
      }, { status: duplicated ? 200 : 201 });
    } catch (error) {
      const code = error instanceof SupabaseRequestError ? error.code : "BOOKING_UPSTREAM_FAILED";
      dependencies.log({ event: "booking_upstream_failed", requestId, code, status: 503, durationMs: Date.now() - startedAt });
      return unavailable();
    }
  };
}

const productionDependencies: BookingRouteDependencies = {
  consumeRateLimit: async (keyHash) => {
    const result = await consumeBookingRateLimit(keyHash, 10, 600);
    return {
      allowed: result.allowed,
      remaining: result.remaining,
      retryAfterSeconds: result.retry_after_seconds,
    };
  },
  createBooking: async (input, flags) => await createBookingService(input, bookingRepository, undefined, flags),
  notifyNewBooking: async (booking, webhookUrl) => await notifyBooking(
    booking,
    notificationRepository,
    (value, url) => sendFeishuBookingNotification(value, url),
    webhookUrl,
  ),
  now: () => new Date(),
  getConfig: () => {
    const config = getRuntimeConfig();
    if (!config.rateLimitHashSecret) throw new Error("invalid configuration");
    return {
      rateLimitHashSecret: config.rateLimitHashSecret,
      bookingE2ESecret: config.bookingE2ESecret,
      bookingNotificationWebhookUrl: config.bookingNotificationWebhookUrl,
    };
  },
  log: bookingLog,
};

export const POST = createBookingPostHandler(productionDependencies);

function unavailable() {
  return NextResponse.json(
    { ok: false, message: "We couldn't submit your booking request. Please try again or contact us." },
    { status: 503 },
  );
}
