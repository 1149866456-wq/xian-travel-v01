export type BookingLogEvent =
  | "booking_submission_started"
  | "booking_validation_failed"
  | "booking_rate_limited"
  | "booking_created"
  | "booking_duplicate_recovered"
  | "booking_upstream_failed"
  | "booking_notification_sent"
  | "booking_notification_failed";

export type BookingLogEntry = {
  event: BookingLogEvent;
  requestId: string;
  bookingReference?: string;
  isTest?: boolean;
  code?: string;
  status?: number;
  durationMs?: number;
  fields?: string[];
  rateLimitKeyPrefix?: string;
};

export function bookingLog(entry: BookingLogEntry): void {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), ...entry });
  if (entry.event.endsWith("failed")) console.error(line);
  else console.info(line);
}
