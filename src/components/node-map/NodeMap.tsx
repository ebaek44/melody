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
import {
  DiscoveryJourney,
  needsFreshConnections,
  RECENT_ARTISTS_STORAGE_KEY,
  type JourneyState,
} from "@/lib/discovery";
import { starterArtists } from "@/lib/catalog";
import ArtistOrbit from "./NodeMapAnimation";
import SearchBar from "../ui/SearchBar";
import SpotifyEmbed from "../ui/SpotifyEmbed";
import SaveButton from "../SaveButton";
import ArtistAvatar from "../ArtistAvatar";
import { useLibrary } from "../LibraryProvider";

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
  const journey = useRef(new DiscoveryJourney());
  const [current, setCurrent] = useState<Neighborhood | null>(null);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(initialArtist);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState({ index: -1, length: 0 });
  const request = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialized = useRef(false);

  const applyJourney = useCallback(
    (state: JourneyState, mode: "push" | "replace" | "pop") => {
      setCurrent(state.neighborhood);
      setHistory({ index: state.index, length: state.length });
      try {
        sessionStorage.setItem(
          RECENT_ARTISTS_STORAGE_KEY,
          JSON.stringify(journey.current.recent.names),
        );
      } catch {
        /* Storage restrictions never block discovery. */
      }
      const name = state.neighborhood.center.name;
      const url = `/discover?artist=${encodeURIComponent(name)}`;
      if (mode === "push" && !state.repeated)
        window.history.pushState({ musicwebVisit: state.visitId }, "", url);
      else if (mode !== "pop")
        window.history.replaceState({ musicwebVisit: state.visitId }, "", url);
      document.title = `${name} · Discover · musicweb.`;
    },
    [],
  );

  const navigate = useCallback(
    async (name: string, mode: "push" | "replace" | "pop" = "push") => {
      request.current?.abort();
      const controller = new AbortController();
      request.current = controller;
      const seq = ++sequence.current;
      setLoading(true);
      setError("");
      setTarget(name);
      if (mode === "pop") {
        const restored = journey.current.restore(
          name,
          window.history.state?.musicwebVisit,
        );
        if (restored) {
          applyJourney(restored, "pop");
          setLoading(false);
          return;
        }
      }
      try {
        const recent = journey.current.recent;
        const cached = graph.current.get(name);
        const dataRequest =
          cached && !needsFreshConnections(cached, recent)
            ? Promise.resolve(cached)
            : fetch("/api/discovery", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ artist: name, exclude: recent.names }),
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
        applyJourney(journey.current.commit(data, mode), mode);
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
    [applyJourney],
  );

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      try {
        const saved = sessionStorage.getItem(RECENT_ARTISTS_STORAGE_KEY);
        if (saved && saved.length <= 16_000)
          journey.current.recent.restore(JSON.parse(saved));
      } catch {
        /* Ignore unavailable or malformed per-tab storage. */
      }
      void navigate(initialArtist, "replace");
    } else if (request.current?.signal.aborted) {
      void navigate(initialArtist, "replace");
    }
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
    const restored = journey.current.move(offset);
    if (!restored) return;
    request.current?.abort();
    ++sequence.current;
    setLoading(false);
    setError("");
    setTarget(restored.neighborhood.center.name);
    applyJourney(restored, "push");
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
  const canFindFresh =
    !!current &&
    current.related.length < 6 &&
    needsFreshConnections(current, journey.current.recent);
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
                disabled={history.index >= history.length - 1 || loading}
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
              ) : canFindFresh ? (
                <button
                  className="text-link"
                  onClick={() => void navigate(current!.center.name, "replace")}
                >
                  <RotateCcw size={14} /> Find fresh connections
                </button>
              ) : current?.related.length ? (
                <>
                  <span className="status-dot" /> Click any artist to unfold
                  their world
                </>
              ) : current ? (
                <>
                  No fresh connections here. Search for another artist or use
                  Back to revisit your trail.
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
