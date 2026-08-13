import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-20 text-center">
      <h1 className="text-4xl font-black">Page not found</h1>
      <p className="mt-4 text-neutral-600">The page may have moved or the address may be incomplete.</p>
      <Link className="button-primary mt-6" href="/">Return Home</Link>
    </div>
  );
}
