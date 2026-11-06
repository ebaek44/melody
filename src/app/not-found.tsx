import Link from "next/link";
import Header from "@/components/Header";
export default function NotFound() {
  return (
    <>
      <Header />
      <main className="route-loading">
        <span className="eyebrow">OFF THE BEATEN TRACK</span>
        <h1>This page wandered off.</h1>
        <Link className="button button-primary" href="/discover">
          Find your next favorite
        </Link>
      </main>
    </>
  );
}
