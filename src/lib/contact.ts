export function whatsappHref(number: string | undefined, message?: string): string | null {
  if (!number || !/^\+?[\d\s()-]+$/.test(number)) return null;

  const digits = number.replace(/\D/g, "");
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;

  const url = `https://wa.me/${digits}`;
  return message ? `${url}?text=${encodeURIComponent(message)}` : url;
}
