export default function PrivacyPage() {
  return <Legal title="Privacy Policy"><p>We collect booking-request details you submit, including contact information, travel preferences, and attribution fields such as UTM source or referral code.</p><p>Booking requests are stored in our database so we can respond to and manage your inquiry. We do not use this V0.1 website to take payment.</p><p>Do not submit sensitive identity documents or payment-card details through the notes field.</p></Legal>;
}

function Legal({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="container-page py-20"><div className="eyebrow">Legal</div><h1 className="mt-4 text-5xl font-black">{title}</h1><div className="mt-8 grid max-w-3xl gap-5 leading-8 text-neutral-700">{children}</div></div>;
}
