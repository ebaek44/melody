"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import type { Artist } from "@/types";

export default function SearchBar({
  onSelect,
}: {
  onSelect: (artist: Artist) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Artist[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState(-1);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    setActive(-1);
    setResults([]);
    setError("");
    if (query.trim().length < 2) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setResults(data.artists);
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error ? error.message : "Search unavailable",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 280);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query]);
  useEffect(() => {
    function close(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  function select(artist: Artist) {
    setOpen(false);
    setQuery("");
    onSelect(artist);
  }
  return (
    <div className="artist-search" ref={root}>
      <Search size={18} aria-hidden="true" />
      <input
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && query.trim().length >= 2}
        aria-controls={id}
        aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined}
        aria-label="Search for an artist"
        placeholder="An artist you love. Or one you’re curious about…"
        maxLength={120}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            return;
          }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            setActive((n) =>
              event.key === "ArrowDown"
                ? Math.min(n + 1, results.length - 1)
                : Math.max(n - 1, 0),
            );
          }
          if (event.key === "Enter" && open && results.length) {
            event.preventDefault();
            select(results[Math.max(0, active)]);
          }
        }}
      />
      {loading ? (
        <Loader2 size={16} className="spin" />
      ) : query ? (
        <button
          className="icon-button"
          aria-label="Clear search"
          onClick={() => {
            setQuery("");
            setOpen(false);
          }}
        >
          <X size={15} />
        </button>
      ) : (
        <kbd>Search</kbd>
      )}
      {open && query.trim().length >= 2 && (
        <div
          className="search-results"
          id={id}
          role="listbox"
          aria-label="Artist results"
        >
          {loading ? (
            <p role="status">Finding artists…</p>
          ) : error ? (
            <p role="status">{error}</p>
          ) : !results.length ? (
            <p role="status">No artists found. Try another name.</p>
          ) : (
            results.map((artist, index) => (
              <button
                type="button"
                role="option"
                aria-selected={active === index}
                id={`${id}-${index}`}
                key={artist.name}
                onClick={() => select(artist)}
                className={active === index ? "highlighted" : ""}
              >
                <span className="search-result-icon">
                  <Search size={14} />
                </span>
                <span>{artist.name}</span>
                <span className="result-action">Explore ↗</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
