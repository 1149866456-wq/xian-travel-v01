import { ContactCta } from "@/components/contact-cta";
import { getWhatsAppNumber } from "@/lib/config";

export default function ContactPage() {
  return (
    <div className="container-page py-20">
      <div className="eyebrow">Contact</div>
      <h1 className="mt-4 text-5xl font-black tracking-tight">Questions before booking?</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-650">Message us about travel dates, group size, accessibility needs, or itinerary questions.</p>
      <div className="mt-8"><ContactCta whatsappNumber={getWhatsAppNumber()} /></div>
    </div>
  );
}
