const isProduction = process.env.VERCEL_ENV === "production";

if (isProduction) {
  const required = [
    "SUPABASE_URL",
    "SUPABASE_SECRET_KEY",
    "RATE_LIMIT_HASH_SECRET",
    "BOOKING_NOTIFICATION_WEBHOOK_URL",
    "NEXT_PUBLIC_WHATSAPP_NUMBER",
  ];
  const missing = required.filter((name) => !process.env[name]?.trim());
  const validRateSecret = (process.env.RATE_LIMIT_HASH_SECRET?.length ?? 0) >= 32;
  const validWhatsApp = /^\+[1-9][0-9]{7,14}$/.test(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "");
  const validSupabase = validUrl(process.env.SUPABASE_URL, [".supabase.co"], "/");
  const validWebhook = validUrl(
    process.env.BOOKING_NOTIFICATION_WEBHOOK_URL,
    ["open.feishu.cn", "open.larksuite.com"],
    "/open-apis/bot/v2/hook/",
  );

  if (missing.length || !validRateSecret || !validWhatsApp || !validSupabase || !validWebhook) {
    console.error("Production configuration is missing or invalid. Review required environment variable names.");
    process.exit(1);
  }
}

function validUrl(value, hosts, pathPrefix) {
  try {
    const url = new URL(value ?? "");
    const hostValid = hosts.some((host) => host.startsWith(".") ? url.hostname.endsWith(host) : url.hostname === host);
    return url.protocol === "https:" && hostValid && url.pathname.startsWith(pathPrefix);
  } catch {
    return false;
  }
}
