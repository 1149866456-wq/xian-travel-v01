const sections = [
  {
    title: "Information we collect",
    paragraphs: [
      "When you send a booking request, we collect the contact details you provide, your requested travel date, traveler count, and any travel preferences or trip details you choose to share in Notes. We may also collect attribution details such as UTM parameters or a referral code.",
      "The Notes field is optional. Any information you choose to share there is provided voluntarily.",
    ],
  },
  {
    title: "How we use your information",
    paragraphs: [
      "We use this information to respond to your request, check whether the trip can be arranged, prepare relevant travel information, manage your inquiry, and understand how visitors find Tang Atlas.",
    ],
  },
  {
    title: "Booking request data",
    paragraphs: [
      "Booking requests are stored in our database so we can respond to and manage your inquiry. A booking request is not a payment and does not create a confirmed reservation.",
    ],
  },
  {
    title: "Sensitive information",
    paragraphs: [
      "Please do not submit passport details, ID documents, bank card information, or other sensitive personal or financial information through Notes.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="container-page legal-page lg:grid-cols-[.72fr_1.28fr] lg:items-start">
      <header className="lg:sticky lg:top-10">
        <p className="eyebrow">Legal · Privacy</p>
        <h1 className="mt-5 text-6xl font-semibold tracking-[-.045em] sm:text-7xl">Privacy Policy</h1>
        <p className="mt-6 max-w-md leading-8 text-[var(--muted)]">A clear account of the information used to respond to and manage a Tang Atlas booking request.</p>
      </header>

      <div>
        {sections.map((section, index) => (
          <section className="legal-section" key={section.title}>
            <div className="legal-section-number">0{index + 1}</div>
            <div>
              <h2 className="text-3xl font-semibold">{section.title}</h2>
              <div className="mt-4 grid gap-4 leading-8 text-[var(--muted)]">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
