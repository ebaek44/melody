"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Compass,
  GitBranch,
  Headphones,
  Link2,
  Loader2,
  Music2,
  RotateCcw,
} from "lucide-react";
import type { Artist, Neighborhood } from "@/types";
import { ArtistGraph } from "@/lib/graph";
import { artistKey } from "@/lib/cache";
import { starterArtists } from "@/lib/catalog";
import ArtistOrbit from "./NodeMapAnimation";
import SearchBar from "../ui/SearchBar";
import SpotifyEmbed from "../ui/SpotifyEmbed";
import SaveButton from "../SaveButton";
import ArtistAvatar from "../ArtistAvatar";
import { useLibrary } from "../LibraryProvider";

type History = { entries: Neighborhood[]; index: number };
export default function NodeMap({
  initialArtist,
  topArtists = [],
}: {
  initialArtist: string;
  topArtists?: Artist[];
}) {
  const { data: session } = useSession();
  const { error: libraryError } = useLibrary();
  const graph = useRef(new ArtistGraph());
  const [current, setCurrent] = useState<Neighborhood | null>(null);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(initialArtist);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<History>({ entries: [], index: -1 });
  const historyRef = useRef(history);
  const request = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialized = useRef(false);

  const navigate = useCallback(
    async (name: string, mode: "push" | "replace" | "pop" = "push") => {
      request.current?.abort();
      const controller = new AbortController();
      request.current = controller;
      const seq = ++sequence.current;
      setLoading(true);
      setError("");
      setTarget(name);
      try {
        const cached = graph.current.get(name);
        const dataRequest = cached
          ? Promise.resolve(cached)
          : fetch(`/api/discovery?artist=${encodeURIComponent(name)}`, {
              signal: controller.signal,
            }).then(async (response) => {
              const data = await response.json();
              if (!response.ok) throw new Error(data.error);
              return data as Neighborhood;
            });
        const [data] = await Promise.all([
          dataRequest,
          new Promise((resolve) =>
            setTimeout(
              resolve,
              window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? 0
                : 200,
            ),
          ),
        ]);
        if (seq !== sequence.current || controller.signal.aborted) return;
        graph.current.add(data);
        setCurrent(data);
        const prior = historyRef.current;
        const repeated =
          prior.entries[prior.index] &&
          artistKey(prior.entries[prior.index].center.name) ===
            artistKey(data.center.name);
        let next: History;
        if (mode === "pop") {
          const stateIndex = window.history.state?.musicmapIndex;
          const index =
            Number.isInteger(stateIndex) &&
            prior.entries[stateIndex] &&
            artistKey(prior.entries[stateIndex].center.name) ===
              artistKey(data.center.name)
              ? stateIndex
              : prior.entries.findLastIndex(
                  (entry) =>
                    artistKey(entry.center.name) ===
                    artistKey(data.center.name),
                );
          next =
            index >= 0 ? { ...prior, index } : { entries: [data], index: 0 };
        } else if (mode === "replace" || repeated) {
          next =
            prior.index < 0
              ? { entries: [data], index: 0 }
              : {
                  ...prior,
                  entries: prior.entries.map((entry, i) =>
                    i === prior.index ? data : entry,
                  ),
                };
        } else {
          const entries = [
            ...prior.entries.slice(0, prior.index + 1),
            data,
          ].slice(-50);
          next = { entries, index: entries.length - 1 };
        }
        historyRef.current = next;
        setHistory(next);
        const url = `/discover?artist=${encodeURIComponent(data.center.name)}`;
        if (mode === "push" && !repeated)
          window.history.pushState({ musicmapIndex: next.index }, "", url);
        else if (mode !== "pop")
          window.history.replaceState({ musicmapIndex: next.index }, "", url);
        document.title = `${data.center.name} · Discover · MusicMap`;
      } catch (error) {
        if (seq === sequence.current && !controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Couldn’t load this artist.",
          );
      } finally {
        if (seq === sequence.current && !controller.signal.aborted)
          setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      void navigate(initialArtist, "replace");
    }
    // React Strict Mode remounts effects; restart an aborted initial request.
    else if (request.current?.signal.aborted)
      void navigate(initialArtist, "replace");
    function pop() {
      const name =
        new URLSearchParams(window.location.search).get("artist") ||
        "Radiohead";
      void navigate(name, "pop");
    }
    window.addEventListener("popstate", pop);
    return () => {
      request.current?.abort();
      window.removeEventListener("popstate", pop);
    };
  }, [initialArtist, navigate]);

  useEffect(
    () => () => {
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
    },
    [],
  );

  function moveHistory(offset: number) {
    const prior = historyRef.current;
    const index = prior.index + offset;
    if (index < 0 || index >= prior.entries.length) return;
    request.current?.abort();
    ++sequence.current;
    const data = prior.entries[index];
    setCurrent(data);
    setLoading(false);
    setError("");
    const next = { ...prior, index };
    historyRef.current = next;
    setHistory(next);
    window.history.pushState(
      { musicmapIndex: index },
      "",
      `/discover?artist=${encodeURIComponent(data.center.name)}`,
    );
    document.title = `${data.center.name} · Discover · MusicMap`;
  }
  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
      copyTimeout.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy the page address from your browser to share this artist.");
    }
  }
  const seeds = topArtists.length ? topArtists.slice(0, 4) : starterArtists;
  return (
    <main className="discovery-page">
      <div className="discovery-heading">
        <div>
          <span className="eyebrow">
            <span className="status-dot" /> THE DISCOVERY STUDIO
          </span>
          <h1>
            Follow your curiosity<span>.</span>
          </h1>
          <p>Every artist is a doorway. See where the next one takes you.</p>
        </div>
        <span className="guest-badge">
          <span className="status-dot" />
          {session?.user?.id ? "Your personal session" : "Exploring as a guest"}
        </span>
      </div>
      <div className="search-row">
        <SearchBar onSelect={(artist) => void navigate(artist.name)} />
        <div className="seed-row">
          <span>{topArtists.length ? "Your favorites" : "Start with"}</span>
          {seeds.map((artist) => (
            <button
              key={artist.name}
              className={`seed-chip ${current?.center.name === artist.name ? "selected" : ""}`}
              onClick={() => void navigate(artist.name)}
            >
              {artist.name}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <div className="inline-alert discovery-alert" role="alert">
          <span>{error}</span>
          <button
            className="text-link"
            onClick={() => void navigate(target, current ? "push" : "replace")}
          >
            <RotateCcw size={14} />
            Try again
          </button>
        </div>
      )}
      {libraryError && (
        <div className="inline-alert discovery-alert" role="alert">
          {libraryError}
        </div>
      )}
      {session?.spotifyRefreshError && (
        <div className="inline-alert discovery-alert" role="status">
          Your Spotify connection has expired. Your collection is still
          available.
          <Link className="text-link" href="/login?callbackUrl=/discover">
            Reconnect Spotify <ArrowRight size={14} />
          </Link>
        </div>
      )}
      <div className="studio-layout">
        <section className="web-panel" aria-label="Artist discovery web">
          <div className="web-toolbar">
            <div className="history-controls">
              <button
                className="icon-button"
                aria-label="Previous artist"
                disabled={history.index <= 0 || loading}
                onClick={() => moveHistory(-1)}
              >
                <ArrowLeft size={17} />
              </button>
              <button
                className="icon-button"
                aria-label="Next artist"
                disabled={
                  history.index >= history.entries.length - 1 || loading
                }
                onClick={() => moveHistory(1)}
              >
                <ArrowRight size={17} />
              </button>
              <span className="toolbar-divider" />
              <span className="web-label">
                <GitBranch size={14} /> Artist web
              </span>
            </div>
            <button
              className="icon-button"
              aria-label={copied ? "Link copied" : "Copy artist link"}
              onClick={share}
              disabled={!current || loading}
            >
              {copied ? <Check size={16} /> : <Link2 size={16} />}
            </button>
          </div>
          <div className="web-canvas dotted">
            <div className="canvas-label">
              <span className="status-dot" />
              {current?.source === "curated"
                ? "CURATED CONNECTIONS"
                : "CONNECTED BY SOUND"}
            </div>
            {current ? (
              <ArtistOrbit
                neighborhood={current}
                loading={loading}
                onSelect={(artist) => void navigate(artist.name)}
              />
            ) : (
              <div className="graph-skeleton">
                <span className="skeleton-orbit" />
                <span className="skeleton-core">
                  <GitBranch size={30} />
                </span>
              </div>
            )}
            <div className="graph-status" role="status" aria-live="polite">
              {loading ? (
                <>
                  <Loader2 size={14} className="spin" /> Finding connections for{" "}
                  {target}…
                </>
              ) : current?.related.length ? (
                <>
                  <span className="status-dot" /> Click any artist to unfold
                  their world
                </>
              ) : current ? (
                <>
                  No related artists found. Search for another artist to keep
                  exploring.
                </>
              ) : (
                <>Choose a starting point above.</>
              )}
            </div>
            <span className="canvas-corner corner-tl" />
            <span className="canvas-corner corner-tr" />
            <span className="canvas-corner corner-bl" />
            <span className="canvas-corner corner-br" />
          </div>
          <div className="web-bottom">
            <span>
              <GitBranch size={14} />
              {current?.related.length ?? 0} connections
            </span>
            <span>
              {current?.source === "lastfm"
                ? "Similarity by Last.fm"
                : "Handpicked for exploration"}
              <span className="source-dot" />
            </span>
          </div>
        </section>
        <aside className="listening-panel" aria-label="Listen and save">
          <div className="listening-top">
            <span className="eyebrow">
              <Headphones size={14} /> THE LISTENING ROOM
            </span>
            <span className="live-indicator">
              <span className="status-dot" />
              {loading ? "Loading" : "Ready"}
            </span>
          </div>
          {current ? (
            <div className="listening-content" aria-busy={loading}>
              <div className="artist-summary">
                <ArtistAvatar artist={current.center} />
                <div>
                  <span className="eyebrow">IN THE SPOTLIGHT</span>
                  <h2>{current.center.name}</h2>
                  {current.center.genres?.length ? (
                    <p>{current.center.genres.slice(0, 2).join(" · ")}</p>
                  ) : (
                    <p>A new direction to explore.</p>
                  )}
                </div>
              </div>
              <div className="artist-actions">
                <SaveButton
                  item={{
                    kind: "artist",
                    name: current.center.name,
                    artist: current.center.name,
                    url: current.center.url,
                    uri: current.center.uri,
                    pfp: current.center.pfp,
                  }}
                />
                <a
                  className="icon-button"
                  href={current.center.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${current.center.name} on ${current.center.uri ? "Spotify" : "Last.fm"}`}
                >
                  <ArrowUpRight size={18} />
                </a>
              </div>
              {current.center.uri ? (
                <div className="player-wrap">
                  <SpotifyEmbed
                    key={current.center.uri}
                    urlOrUri={current.center.uri}
                  />
                  <span className="player-credit">
                    Listen on Spotify · Playback availability varies
                  </span>
                </div>
              ) : (
                <div className="player-fallback">
                  <Headphones size={25} />
                  <p>Find {current.center.name} on Spotify.</p>
                  <a
                    className="text-link"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://open.spotify.com/search/${encodeURIComponent(current.center.name)}`}
                  >
                    Open Spotify <ArrowUpRight size={14} />
                  </a>
                </div>
              )}
              <div className="track-section">
                <div className="track-heading">
                  <h3>A few to get you started</h3>
                  <span>
                    {current.source === "lastfm"
                      ? "LAST.FM TOP SONGS"
                      : "EDITOR’S PICKS"}
                  </span>
                </div>
                {current.tracks.map((track, index) => (
                  <div className="track-row" key={track.name}>
                    <span className="track-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={`https://open.spotify.com/search/${encodeURIComponent(`${track.artist} ${track.name}`)}`}
                    >
                      <strong>{track.name}</strong>
                      <span>
                        {track.artist}
                        <ArrowUpRight size={10} />
                      </span>
                    </a>
                    <SaveButton compact item={{ kind: "track", ...track }} />
                  </div>
                ))}
                {!current.tracks.length && (
                  <p className="empty-tracks">
                    No songs to show right now. Try the Spotify player or
                    another artist.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="listening-placeholder">
              <Music2 size={38} />
              <h2>
                Your next favorite
                <br />
                is out there.
              </h2>
              <p>
                Start with an artist. We’ll bring the listening room to life.
              </p>
            </div>
          )}
        </aside>
      </div>
      {current?.notice && (
        <p className="source-notice" role="status">
          <Compass size={15} />
          {current.notice}
        </p>
      )}
      <div className="discovery-bottom">
        <div>
          <span className="discovery-tip-number">01 — ∞</span>
          <p>
            There’s no wrong turn.
            <br />
            <strong>Just a different sound.</strong>
          </p>
        </div>
        <Link href="/#library" className="text-link">
          Visit your collection <ArrowRight size={16} />
        </Link>
      </div>
    </main>
  );
}
