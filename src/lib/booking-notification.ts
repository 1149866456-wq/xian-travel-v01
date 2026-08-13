import type { BookingRecord } from "./booking";

export type NotificationResult =
  | { ok: true }
  | { ok: false; errorCode: "FEISHU_TIMEOUT" | "FEISHU_UNAVAILABLE" | "FEISHU_REJECTED" };

export type NotificationRepository = {
  updateNotificationStatus(
    id: string,
    update: { status: "SENT" | "FAILED" | "SKIPPED"; errorCode: string | null },
  ): Promise<void>;
};

type SendDependencies = {
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
};

export async function sendFeishuBookingNotification(
  booking: BookingRecord,
  webhookUrl: string,
  dependencies: SendDependencies = {},
): Promise<NotificationResult> {
  const fetchImpl = dependencies.fetch ?? fetch;
  const text = [
    "New Tang Atlas booking request",
    `Reference: ${booking.booking_reference}`,
    `Guest: ${booking.full_name}`,
    `Country: ${booking.country}`,
    `Travel date: ${booking.travel_date}`,
    `Travelers: ${booking.traveler_count}`,
    booking.utm_source ? `Source: ${booking.utm_source}` : null,
    booking.ref_code ? `Referral: ${booking.ref_code}` : null,
    "Contact details remain in Supabase.",
  ].filter(Boolean).join("\n");

  try {
    const response = await fetchImpl(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ msg_type: "text", content: { text } }),
      signal: AbortSignal.timeout(dependencies.timeoutMs ?? 5_000),
    });
    if (!response.ok) return { ok: false, errorCode: "FEISHU_UNAVAILABLE" };
    const result = await response.json() as { code?: unknown };
    return result.code === 0
      ? { ok: true }
      : { ok: false, errorCode: "FEISHU_REJECTED" };
  } catch (error) {
    return {
      ok: false,
      errorCode: isAbortError(error) ? "FEISHU_TIMEOUT" : "FEISHU_UNAVAILABLE",
    };
  }
}

export async function notifyNewBooking(
  booking: BookingRecord,
  repository: NotificationRepository,
  notifier: (booking: BookingRecord, webhookUrl: string) => Promise<NotificationResult>,
  webhookUrl: string | null,
): Promise<NotificationResult | { ok: false; errorCode: "NOTIFICATION_UNCONFIGURED" } | { ok: true; skipped: true }> {
  if (booking.is_test) {
    await repository.updateNotificationStatus(booking.id, { status: "SKIPPED", errorCode: null });
    return { ok: true, skipped: true };
  }
  if (!webhookUrl) {
    await repository.updateNotificationStatus(booking.id, {
      status: "FAILED",
      errorCode: "NOTIFICATION_UNCONFIGURED",
    });
    return { ok: false, errorCode: "NOTIFICATION_UNCONFIGURED" };
  }

  const result = await notifier(booking, webhookUrl);
  await repository.updateNotificationStatus(booking.id, result.ok
    ? { status: "SENT", errorCode: null }
    : { status: "FAILED", errorCode: result.errorCode });
  return result;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError");
}
