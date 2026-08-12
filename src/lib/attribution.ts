export type SearchParams = Record<string, string | string[] | undefined>;

export type Attribution = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  ref_code: string | null;
};

function one(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0]?.trim() || null;
  return value?.trim() || null;
}

export function readAttribution(params: SearchParams): Attribution {
  return {
    utm_source: one(params.utm_source),
    utm_medium: one(params.utm_medium),
    utm_campaign: one(params.utm_campaign),
    ref_code: one(params.ref_code) ?? one(params.ref),
  };
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
