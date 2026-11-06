"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  Compass,
  Disc3,
  Headphones,
  Library,
  Music2,
} from "lucide-react";
import { useState } from "react";
import { starterArtists } from "@/lib/catalog";
import { useLibrary } from "./LibraryProvider";
import ArtistAvatar from "./ArtistAvatar";
import SaveButton from "./SaveButton";

export default function MusicBoard() {
  const { data: session } = useSession();
  const { items, loading, error, reload } = useLibrary();
  const [filter, setFilter] = useState("all");
  const signedIn = !!session?.user?.id;
  const artists = items.filter((item) => item.kind === "artist");
  const tracks = items.filter((item) => item.kind === "track");
  const suggestions = starterArtists
    .filter((artist) => !artists.some((item) => item.name === artist.name))
    .slice(0, 3);
  return (
    <section id="library" className="collection-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">YOUR SOUND, TAKING SHAPE</span>
          <h2>
            {signedIn
              ? `${session.user.name?.split(" ")[0] || "Your"}’s listening room`
              : "A home for your next favorites."}
          </h2>
          <p>
            {signedIn
              ? "The artists and songs you’ve picked up along the way."
              : "Explore freely. Connect Spotify to start a collection that’s yours."}
          </p>
        </div>
        <Link href="/discover" className="text-link">
          Keep exploring <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="dashboard">
        <aside className="dashboard-sidebar">
          <div className="sidebar-brand">
            <span className="mini-logo">
              <Disc3 size={19} />
            </span>{" "}
            Your workspace
          </div>
          <span className="eyebrow sidebar-label">LIBRARY</span>
          {[
            ["all", "Overview", Compass],
            ["artist", "Saved artists", Bookmark],
            ["track", "Saved songs", Headphones],
          ].map(([key, label, Icon]) => {
            const C = Icon as typeof Compass;
            return (
              <button
                key={key as string}
                className={`sidebar-link ${filter === key ? "selected" : ""}`}
                onClick={() => setFilter(key as string)}
              >
                <C size={16} />
                {label as string}
                {key !== "all" && (
                  <span>
                    {key === "artist" ? artists.length : tracks.length}
                  </span>
                )}
              </button>
            );
          })}
          <div className="sidebar-note">
            <span className="status-dot" />
            <span>
              {signedIn
                ? "Your collection, saved to your account."
                : "Guest mode. Your next discovery is one click away."}
            </span>
          </div>
        </aside>
        <div className="dashboard-main">
          <div className="dashboard-title">
            <div>
              <span className="eyebrow">
                {signedIn ? "PERSONAL COLLECTION" : "MAKE YOURSELF AT HOME"}
              </span>
              <h3>
                {filter === "artist"
                  ? "Your saved artists"
                  : filter === "track"
                    ? "Your saved songs"
                    : "Your music, all connected."}
              </h3>
            </div>
            <span className="collection-count">
              <Library size={14} />
              {items.length} saved
            </span>
          </div>
          {error && (
            <div className="inline-alert" role="alert">
              {error}
              <button onClick={reload} className="text-link">
                Try again
              </button>
            </div>
          )}
          {loading ? (
            <div className="board-loading" role="status">
              Opening your collection…
            </div>
          ) : (
            <div
              className={`board-columns ${filter !== "all" ? "single-column" : ""}`}
            >
              {(filter === "all" || filter === "artist") && (
                <div className="board-column">
                  <div className="column-heading">
                    <span className="column-dot green" />
                    <h4>Saved artists</h4>
                    <span>{artists.length}</span>
                  </div>
                  {artists.slice(0, filter === "all" ? 3 : 30).map((item) => (
                    <div className="library-card" key={item.key}>
                      <Link
                        className="library-card-link"
                        href={`/discover?artist=${encodeURIComponent(item.name)}`}
                      >
                        <ArtistAvatar artist={{ ...item }} />
                        <div>
                          <strong>{item.name}</strong>
                          <span>Explore their connections</span>
                        </div>
                      </Link>
                      <SaveButton compact item={item} />
                    </div>
                  ))}
                  {!artists.length && (
                    <div className="empty-card">
                      <Bookmark size={24} />
                      <strong>A good place to start.</strong>
                      <p>Save an artist from the web and find them here.</p>
                      <Link href="/discover" className="text-link">
                        Find an artist <ArrowRight size={14} />
                      </Link>
                    </div>
                  )}
                  {filter === "all" && artists.length > 3 && (
                    <button
                      className="text-link"
                      onClick={() => setFilter("artist")}
                    >
                      View all {artists.length} artists <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              )}
              {(filter === "all" || filter === "track") && (
                <div className="board-column">
                  <div className="column-heading">
                    <span className="column-dot amber" />
                    <h4>Saved songs</h4>
                    <span>{tracks.length}</span>
                  </div>
                  {tracks.slice(0, filter === "all" ? 3 : 30).map((item) => (
                    <div className="library-card" key={item.key}>
                      <a
                        className="library-card-link"
                        href={`https://open.spotify.com/search/${encodeURIComponent(`${item.artist} ${item.name}`)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className="song-art">
                          <Music2 size={18} />
                        </span>
                        <div>
                          <strong>{item.name}</strong>
                          <span>{item.artist}</span>
                        </div>
                      </a>
                      <SaveButton compact item={item} />
                    </div>
                  ))}
                  {!tracks.length && (
                    <div className="empty-card">
                      <Headphones size={24} />
                      <strong>Worth another listen.</strong>
                      <p>
                        Keep the songs that catch your ear. They’ll be waiting
                        here.
                      </p>
                      <Link href="/discover" className="text-link">
                        Find your sound <ArrowRight size={14} />
                      </Link>
                    </div>
                  )}
                  {filter === "all" && tracks.length > 3 && (
                    <button
                      className="text-link"
                      onClick={() => setFilter("track")}
                    >
                      View all {tracks.length} songs <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              )}
              {filter === "all" && (
                <div className="board-column suggestions-column">
                  <div className="column-heading">
                    <span className="column-dot violet" />
                    <h4>Try a new direction</h4>
                    <Compass size={14} />
                  </div>
                  <p className="column-caption">
                    A few starting points for a fresh rabbit hole.
                  </p>
                  {suggestions.map((artist) => (
                    <Link
                      key={artist.name}
                      className="suggestion-card"
                      href={`/discover?artist=${encodeURIComponent(artist.name)}`}
                    >
                      <ArtistAvatar artist={artist} />
                      <div>
                        <strong>{artist.name}</strong>
                        <span>{artist.genres?.[0]}</span>
                      </div>
                      <ArrowUpRight size={16} />
                    </Link>
                  ))}
                  <div className="board-tip">
                    <Check size={15} />
                    <span>
                      {signedIn
                        ? "A small collection. A very personal soundtrack."
                        : "No sign-in needed to explore."}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          {!signedIn && (
            <div className="dashboard-connect">
              <span>
                <Bookmark size={16} /> Make the discoveries yours.
              </span>
              <Link href="/login" className="text-link">
                Connect Spotify to save <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
