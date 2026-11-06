"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="route-loading">
      <h1>A little pause in the music.</h1>
      <p>Something couldn’t load. Give it another try.</p>
      <button className="button button-primary" onClick={reset}>
        Try again
      </button>
      <Link href="/" className="text-link">
        Return home
      </Link>
    </main>
  );
}
