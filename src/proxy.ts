import { NextRequest, NextResponse } from "next/server";
import {
  ATTRIBUTION_COOKIE,
  decodeAttributionCookie,
  encodeAttributionCookie,
  mergeFirstTouch,
  readAttribution,
} from "@/lib/attribution";

export function proxy(request: NextRequest) {
  const existing = decodeAttributionCookie(request.cookies.get(ATTRIBUTION_COOKIE)?.value);
  const incoming = readAttribution(Object.fromEntries(request.nextUrl.searchParams.entries()));
  const merged = mergeFirstTouch(existing, incoming);
  const encodedExisting = encodeAttributionCookie(existing);
  const encodedMerged = encodeAttributionCookie(merged);
  const response = NextResponse.next();

  if (encodedExisting !== encodedMerged) {
    response.cookies.set(ATTRIBUTION_COOKIE, encodedMerged, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 90 * 24 * 60 * 60,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
