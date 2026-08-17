const sections = [
  {
    title: "Booking requests",
    body: "Submitting a booking request is an inquiry only. It does not create a paid booking and does not mean that payment has been made or successfully received.",
  },
  {
    title: "Confirmation before payment",
    body: "Availability, the final itinerary, inclusions, price, and payment instructions will be confirmed with you before any payment is requested. Any confirmed booking will be communicated separately.",
  },
  {
    title: "Traveler responsibilities",
    body: "Travelers are responsible for their own passports, visas, insurance and flights unless these are expressly included in the confirmed booking.",
  },
];

export default function TermsPage() {
  return (
    <div className="container-page legal-page lg:grid-cols-[.72fr_1.28fr] lg:items-start">
      <header className="lg:sticky lg:top-10">
        <p className="eyebrow">Legal · Terms</p>
        <h1 className="mt-5 text-6xl font-semibold tracking-[-.045em] sm:text-7xl">Terms</h1>
        <p className="mt-6 max-w-md leading-8 text-[var(--muted)]">The practical boundaries of a Tang Atlas booking request, confirmation, and traveler responsibility.</p>
      </header>

      <div>
        {sections.map((section, index) => (
          <section className="legal-section" key={section.title}>
            <div className="legal-section-number">0{index + 1}</div>
            <div>
              <h2 className="text-3xl font-semibold">{section.title}</h2>
              <p className="mt-4 leading-8 text-[var(--muted)]">{section.body}</p>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
