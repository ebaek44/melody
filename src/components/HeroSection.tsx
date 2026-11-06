"use client";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  GitBranch,
  Headphones,
  Bookmark,
} from "lucide-react";
import { useSession } from "next-auth/react";
import MusicBoard from "./MusicBoard";

export default function HeroSection() {
  const { data: session } = useSession();
  return (
    <main>
      <section className="hero dotted">
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-content">
          <span className="eyebrow pill">
            <span className="status-dot" /> FOR THE LOVE OF FINDING SOMETHING
            NEW
          </span>
          <h1>
            Good music leads to
            <br />
            <span>more good music.</span>
          </h1>
          <p>
            Start with an artist you love. Follow the connections.
            <br className="desktop-break" /> Find the sound you didn’t know you
            were looking for.
          </p>
          <div className="hero-actions">
            <Link href="/discover" className="button button-primary">
              Start discovering <ArrowRight size={18} />
            </Link>
            <Link
              href={session?.user?.id ? "/#library" : "/login"}
              className="button button-secondary"
            >
              {session?.user?.id ? "Open your collection" : "Connect Spotify"}{" "}
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="hero-note">
            A little curiosity is all you need. No account required.
          </div>
          <div className="hero-features">
            <span>
              <GitBranch size={15} /> Explore connected artists
            </span>
            <span>
              <Headphones size={15} /> Listen as you go
            </span>
            <span>
              <Bookmark size={15} /> Keep your favorites
            </span>
          </div>
        </div>
        <a
          className="scroll-cue"
          href="#library"
          aria-label="View your music collection"
        >
          <ArrowDown size={17} />
        </a>
      </section>
      <MusicBoard />
      <footer className="site-footer">
        <span>Made for the endlessly curious.</span>
        <span>Discovery by Last.fm · Listening with Spotify</span>
      </footer>
    </main>
  );
}
