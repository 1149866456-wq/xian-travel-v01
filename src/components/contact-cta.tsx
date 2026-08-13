import React from "react";

export function ContactCta({ whatsappNumber, text }: { whatsappNumber: string | null; text?: string }) {
  if (!whatsappNumber) {
    return <p className="text-sm text-neutral-600">WhatsApp is temporarily unavailable. Please try again later.</p>;
  }
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return <a className="button-primary md:w-fit" href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}${query}`} target="_blank" rel="noreferrer">Contact on WhatsApp</a>;
}
