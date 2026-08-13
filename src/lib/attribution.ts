export type SearchParams = Record<string, string | string[] | undefined>;

export type Attribution = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  ref_code: string | null;
};

export const ATTRIBUTION_COOKIE = "tang_attribution";
export const ATTRIBUTION_MAX_LENGTH = 100;
const DISALLOWED_CONTROL = /[\u0000-\u001F\u007F]/;

export const EMPTY_ATTRIBUTION: Attribution = {
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  ref_code: null,
};

function one(value: string | string[] | undefined): string | null {
  const text = Array.isArray(value) ? value[0]?.trim() : value?.trim();
  return text && text.length <= ATTRIBUTION_MAX_LENGTH && !DISALLOWED_CONTROL.test(text) ? text : null;
}

export function readAttribution(params: SearchParams): Attribution {
  return {
    utm_source: one(params.utm_source),
    utm_medium: one(params.utm_medium),
    utm_campaign: one(params.utm_campaign),
    ref_code: one(params.ref_code) ?? one(params.ref),
  };
}

export function mergeFirstTouch(existing: Attribution, incoming: Attribution): Attribution {
  return {
    utm_source: existing.utm_source ?? incoming.utm_source,
    utm_medium: existing.utm_medium ?? incoming.utm_medium,
    utm_campaign: existing.utm_campaign ?? incoming.utm_campaign,
    ref_code: existing.ref_code ?? incoming.ref_code,
  };
}

export function encodeAttributionCookie(attribution: Attribution): string {
  return JSON.stringify(attribution);
}

export function decodeAttributionCookie(value: string | undefined): Attribution {
  if (!value || value.length > 1_000) return { ...EMPTY_ATTRIBUTION };
  try {
    const parsed = JSON.parse(value) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return { ...EMPTY_ATTRIBUTION };
    const record = parsed as Record<string, unknown>;
    return {
      utm_source: cookieValue(record.utm_source),
      utm_medium: cookieValue(record.utm_medium),
      utm_campaign: cookieValue(record.utm_campaign),
      ref_code: cookieValue(record.ref_code),
    };
  } catch {
    return { ...EMPTY_ATTRIBUTION };
  }
}

export function attributionQuery(attribution: Attribution): string {
  const query = new URLSearchParams();
  if (attribution.utm_source) query.set("utm_source", attribution.utm_source);
  if (attribution.utm_medium) query.set("utm_medium", attribution.utm_medium);
  if (attribution.utm_campaign) query.set("utm_campaign", attribution.utm_campaign);
  if (attribution.ref_code) query.set("ref", attribution.ref_code);
  const value = query.toString();
  return value ? `?${value}` : "";
}

function cookieValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const result = value.trim();
  return result && result.length <= ATTRIBUTION_MAX_LENGTH && !DISALLOWED_CONTROL.test(result) ? result : null;
}
