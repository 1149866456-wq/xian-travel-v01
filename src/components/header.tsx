import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="container-page flex min-h-16 items-center justify-between gap-6">
        <Link href="/" className="font-black tracking-tight text-xl">Tang Atlas</Link>
        <nav className="flex items-center gap-5 text-sm font-semibold text-neutral-700">
          <Link href="/trips/xian-tang-culture-2d1n">Trip</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/booking" className="button-primary !min-h-10 !px-4">Book Now</Link>
        </nav>
      </div>
    </header>
  );
}
