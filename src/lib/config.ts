type Environment = Record<string, string | undefined>;

export type RuntimeConfig = {
  supabaseUrl: string | null;
  supabaseSecretKey: string | null;
  rateLimitHashSecret: string | null;
  bookingNotificationWebhookUrl: string | null;
  bookingE2ESecret: string | null;
  whatsappNumber: string | null;
};

export function getRuntimeConfig(environment: Environment = process.env): RuntimeConfig {
  const production = environment.VERCEL_ENV === "production";
  const supabaseUrl = validSupabaseUrl(environment.SUPABASE_URL) ? environment.SUPABASE_URL!.replace(/\/$/, "") : null;
  const supabaseSecretKey = nonEmpty(environment.SUPABASE_SECRET_KEY);
  const rateLimitHashSecret = environment.RATE_LIMIT_HASH_SECRET && environment.RATE_LIMIT_HASH_SECRET.length >= 32
    ? environment.RATE_LIMIT_HASH_SECRET
    : null;
  const bookingNotificationWebhookUrl = validFeishuWebhook(environment.BOOKING_NOTIFICATION_WEBHOOK_URL)
    ? environment.BOOKING_NOTIFICATION_WEBHOOK_URL!
    : null;
  const whatsappNumber = getWhatsAppNumber(environment);

  if (production && (!supabaseUrl || !supabaseSecretKey || !rateLimitHashSecret || !bookingNotificationWebhookUrl || !whatsappNumber)) {
    throw new Error("CONFIGURATION_INVALID");
  }

  return {
    supabaseUrl,
    supabaseSecretKey,
    rateLimitHashSecret,
    bookingNotificationWebhookUrl,
    bookingE2ESecret: nonEmpty(environment.BOOKING_E2E_SECRET),
    whatsappNumber,
  };
}

export function getWhatsAppNumber(environment: Environment = process.env): string | null {
  const value = environment.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ?? "";
  return /^\+[1-9][0-9]{7,14}$/.test(value) ? value : null;
}

function nonEmpty(value: string | undefined): string | null {
  return value?.trim() || null;
}

function validSupabaseUrl(value: string | undefined): boolean {
  try {
    const url = new URL(value ?? "");
    return url.protocol === "https:" && url.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

function validFeishuWebhook(value: string | undefined): boolean {
  try {
    const url = new URL(value ?? "");
    return url.protocol === "https:"
      && ["open.feishu.cn", "open.larksuite.com"].includes(url.hostname)
      && url.pathname.startsWith("/open-apis/bot/v2/hook/")
      && url.pathname.length > "/open-apis/bot/v2/hook/".length;
  } catch {
    return false;
  }
}
