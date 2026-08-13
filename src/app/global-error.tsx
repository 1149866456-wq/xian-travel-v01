"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main style={{ padding: "48px", textAlign: "center", fontFamily: "Arial, sans-serif" }}>
          <h1>Something went wrong</h1>
          <p>Please try again or return to the home page.</p>
          <button onClick={reset}>Try Again</button>{" "}
          <Link href="/">Return Home</Link>
        </main>
      </body>
    </html>
  );
}
