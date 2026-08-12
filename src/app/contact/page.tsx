export default function ContactPage() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "60123456789";
  return (
    <div className="container-page py-20">
      <div className="eyebrow">Contact</div>
      <h1 className="mt-4 text-5xl font-black tracking-tight">Questions before booking?</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-650">Message us about travel dates, group size, accessibility needs, or itinerary questions.</p>
      <a className="button-primary mt-8" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">Chat on WhatsApp</a>
    </div>
  );
}
