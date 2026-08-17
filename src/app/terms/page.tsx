export default function TermsPage() {
  return (
    <div className="container-page py-20">
      <div className="eyebrow">Legal</div>
      <h1 className="mt-4 text-5xl font-black">Terms</h1>
      <div className="mt-8 grid max-w-3xl gap-8 text-neutral-700">
        <section>
          <h2 className="text-xl font-black text-[var(--ink)]">Booking requests</h2>
          <p className="mt-3 leading-8">Submitting a booking request is an inquiry only. It does not create a paid booking and does not mean that payment has been made or successfully received.</p>
        </section>

        <section>
          <h2 className="text-xl font-black text-[var(--ink)]">Confirmation before payment</h2>
          <p className="mt-3 leading-8">Availability, the final itinerary, inclusions, price, and payment instructions will be confirmed with you before any payment is requested. Any confirmed booking will be communicated separately.</p>
        </section>

        <section>
          <h2 className="text-xl font-black text-[var(--ink)]">Traveler responsibilities</h2>
          <p className="mt-3 leading-8">Travelers are responsible for their own passports, visas, insurance and flights unless these are expressly included in the confirmed booking.</p>
        </section>
      </div>
    </div>
  );
}
