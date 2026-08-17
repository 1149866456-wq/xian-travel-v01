import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="container-page flex min-h-16 items-center justify-between gap-2 sm:gap-6">
        <Link href="/" className="flex min-h-11 items-center whitespace-nowrap font-black tracking-tight text-lg sm:text-xl">Tang Atlas</Link>
        <nav className="flex items-center gap-1 text-sm font-semibold text-neutral-700 sm:gap-5" aria-label="Primary navigation">
          <Link className="flex min-h-11 items-center px-1" href="/trips/xian-tang-culture-2d1n">Trip</Link>
          <Link className="flex min-h-11 items-center px-1" href="/contact">Contact</Link>
          <Link href="/booking" className="button-primary !min-h-11 !px-3 sm:!px-4">Book Now</Link>
        </nav>
      </div>
    </header>
  );
}
