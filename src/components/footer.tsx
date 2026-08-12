import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-black/10 bg-[#1d2925] text-white">
      <div className="container-page grid gap-8 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="text-xl font-black">Tang Atlas</div>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/70">
            Thoughtful small-group cultural travel in Xi&apos;an for international visitors.
          </p>
        </div>
        <div className="grid content-start gap-2 text-sm text-white/75">
          <Link href="/trips/xian-tang-culture-2d1n">Xi&apos;an Tang Culture 2D1N</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <div className="grid content-start gap-2 text-sm text-white/75">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <span>Xi&apos;an, China</span>
        </div>
      </div>
    </footer>
  );
}
