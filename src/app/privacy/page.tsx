export default function PrivacyPage() {
  return (
    <div className="container-page py-20">
      <div className="eyebrow">Legal</div>
      <h1 className="mt-4 text-5xl font-black">Privacy Policy</h1>
      <div className="mt-8 grid max-w-3xl gap-8 text-neutral-700">
        <section>
          <h2 className="text-xl font-black text-[var(--ink)]">Information we collect</h2>
          <p className="mt-3 leading-8">When you send a booking request, we collect the contact details you provide, your travel preferences, requested travel date, and traveler count. We may also collect attribution details such as UTM parameters or a referral source.</p>
          <p className="mt-3 leading-8">The Notes field is optional. Any information you choose to share there is provided voluntarily.</p>
        </section>

        <section>
          <h2 className="text-xl font-black text-[var(--ink)]">How we use your information</h2>
          <p className="mt-3 leading-8">We use this information to respond to your request, check whether the trip can be arranged, prepare relevant travel information, and improve how visitors find and use Tang Atlas.</p>
        </section>

        <section>
          <h2 className="text-xl font-black text-[var(--ink)]">Booking request data</h2>
          <p className="mt-3 leading-8">We keep booking-request information in the systems we use to manage inquiries and communicate with prospective travelers. A booking request is not a payment and does not create a confirmed reservation.</p>
        </section>

        <section>
          <h2 className="text-xl font-black text-[var(--ink)]">Sensitive information</h2>
          <p className="mt-3 leading-8">Please do not submit passport details, payment card information or other sensitive identity documents through Notes.</p>
        </section>
      </div>
    </div>
  );
}
