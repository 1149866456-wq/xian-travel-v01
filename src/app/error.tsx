"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page py-20 text-center">
      <h1 className="text-4xl font-black">Something went wrong</h1>
      <p className="mt-4 text-neutral-600">We couldn&apos;t load this page. Your private details have not been shown.</p>
      <div className="mt-6 flex justify-center gap-3">
        <button className="button-primary" onClick={reset}>Try Again</button>
        <Link className="button-secondary" href="/">Return Home</Link>
      </div>
    </div>
  );
}
