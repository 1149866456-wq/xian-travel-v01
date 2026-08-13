import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type GuardFailure = { ok: false; status: 400 | 403 | 413 | 415; message: string };

export function validateBookingRequestHeaders(request: Request): { ok: true } | GuardFailure {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    return { ok: false, status: 415, message: "Content-Type must be application/json." };
  }

  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return { ok: false, status: 403, message: "Request origin is not allowed." };
  }
  return { ok: true };
}

export async function readBoundedJson(
  request: Request,
  maximumBytes: number,
): Promise<{ ok: true; value: unknown } | GuardFailure> {
  const body = await readBoundedBody(request, maximumBytes);
  if (!body.ok) return body;
  try {
    return { ok: true, value: JSON.parse(body.value) as unknown };
  } catch {
    return { ok: false, status: 400, message: "Booking request contains invalid JSON." };
  }
}

export async function readBoundedBody(
  request: Request,
  maximumBytes: number,
): Promise<{ ok: true; value: string } | GuardFailure> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > maximumBytes) {
    return { ok: false, status: 413, message: "Booking request is too large." };
  }

  const reader = request.body?.getReader();
  if (!reader) return { ok: true, value: "" };
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maximumBytes) {
        await reader.cancel();
        return { ok: false, status: 413, message: "Booking request is too large." };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return { ok: true, value: new TextDecoder().decode(Buffer.concat(chunks)) };
}

export function hashRateLimitKey(ip: string, secret: string): string {
  return createHmac("sha256", secret).update(ip).digest("hex");
}

export function verifyE2ESecret(provided: string | null, expected: string | null): boolean {
  if (!provided || !expected) return false;
  const providedDigest = createHash("sha256").update(provided).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();
  return timingSafeEqual(providedDigest, expectedDigest);
}
