import Link from "next/link";

const exploreLinks = [
  { href: "/trips/xian-tang-culture-2d1n", label: "Xi'an Tang Culture 2D1N" },
  { href: "/booking", label: "Booking Request" },
  { href: "/contact", label: "Contact" },
];

const informationLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-[var(--jade-dark)] text-white sm:mt-28">
      <div className="container-page grid gap-12 py-14 md:grid-cols-[1.5fr_.8fr_.7fr] md:gap-10 md:py-20">
        <div>
          <div className="font-[var(--font-display)] text-3xl font-bold tracking-[-.03em]">Tang Atlas</div>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/66">
            Thoughtful small-group cultural travel in Xi&apos;an, shaped for international visitors who value context, clarity, and time well spent.
          </p>
          <div className="mt-8 flex items-center gap-3 text-[.68rem] font-bold uppercase tracking-[.18em] text-white/45">
            <span className="h-px w-10 bg-[var(--gold)]" />
            Xi&apos;an · China
          </div>
        </div>

        <FooterGroup title="Explore" links={exploreLinks} />
        <FooterGroup title="Information" links={informationLinks} />
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex min-h-14 items-center text-xs text-white/45">
          Tang Atlas · Booking requests only; no online payment is taken.
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({ title, links }: { title: string; links: Array<{ href: string; label: string }> }) {
  return (
    <nav aria-label={`${title} links`}>
      <div className="text-[.68rem] font-bold uppercase tracking-[.18em] text-[var(--gold)]">{title}</div>
      <div className="mt-4 grid gap-1 text-sm text-white/72">
        {links.map((link) => (
          <Link
            className="flex min-h-11 items-center rounded-md px-2 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
