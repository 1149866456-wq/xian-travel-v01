import Link from "next/link";

const footerLinks = [
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/trips/xian-tang-culture-2d1n", label: "Xi'an Tang Culture 2D1N" },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-[#1d2925] text-white">
      <div className="container-page grid gap-8 py-12 md:grid-cols-[1.4fr_1fr] md:gap-16">
        <div>
          <div className="text-xl font-black">Tang Atlas</div>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/70">
            Thoughtful small-group cultural travel in Xi&apos;an for international visitors.
          </p>
        </div>
        <nav aria-label="Footer navigation" className="grid content-start gap-1 text-sm text-white/75">
          {footerLinks.map((link) => (
            <Link
              className="flex min-h-11 items-center rounded-md px-2 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
