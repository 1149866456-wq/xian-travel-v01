import Link from "next/link";

export function Header() {
  return (
    <header className="relative z-20 border-b border-[var(--line)] bg-[rgba(255,253,248,.94)] backdrop-blur-md">
      <div className="container-page flex min-h-[72px] items-center justify-between gap-2 sm:min-h-20 sm:gap-8">
        <Link href="/" className="flex min-h-11 items-center gap-2 whitespace-nowrap" aria-label="Tang Atlas home">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--cinnabar)]" />
          <span className="font-[var(--font-display)] text-[1.45rem] font-bold tracking-[-.03em] sm:text-[1.75rem]">Tang Atlas</span>
        </Link>
        <nav className="flex items-center gap-0.5 text-[.78rem] font-semibold text-[var(--muted)] sm:gap-4 sm:text-sm" aria-label="Primary navigation">
          <Link className="flex min-h-11 items-center px-1.5 transition-colors hover:text-[var(--ink)] sm:px-2" href="/trips/xian-tang-culture-2d1n">Trip</Link>
          <Link className="flex min-h-11 items-center px-1.5 transition-colors hover:text-[var(--ink)] sm:px-2" href="/contact">Contact</Link>
          <Link href="/booking" className="button-primary !min-h-11 !px-3 sm:!px-5">
            <span className="sm:hidden">Book Now</span>
            <span className="hidden sm:inline">Booking Request</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
