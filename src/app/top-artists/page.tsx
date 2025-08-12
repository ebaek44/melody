"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";

type Artist = {
  id: string;
  name: string;
  images?: { url: string }[];
  external_urls?: { spotify?: string };
  genres?: string[];
  popularity?: number;
};

export default function TopArtistsPage() {
  const { data: session, status } = useSession();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"short_term" | "medium_term" | "long_term">("short_term");

  useEffect(() => {
    if (status !== "authenticated") return;
    setErr(null);
    fetch(`/api/top-artists?time_range=${timeRange}&limit=20`)
      .then(async r => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.error || `HTTP ${r.status}`);
        }
        const data = await r.json();
        setArtists(data.items || []);
      })
      .catch(e => setErr(String(e)));
  }, [status, timeRange]);

  if (status === "loading") return <main className="p-6">Loading…</main>;

  if (status !== "authenticated") {
    return (
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Top Artists</h1>
        <p>Sign in with Spotify to view your top artists.</p>
        <button onClick={() => signIn("spotify")} className="px-4 py-2 rounded-2xl shadow border">
          Sign in with Spotify
        </button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Your Top Artists</h1>
        <select
          value={timeRange}
          onChange={e => setTimeRange(e.target.value as any)}
          className="border rounded-lg px-2 py-1"
          aria-label="Time range"
        >
          <option value="short_term">Last 4 weeks</option>
          <option value="medium_term">Last 6 months</option>
          <option value="long_term">All time</option>
        </select>
      </div>

      {err && <p className="text-red-600">Failed to load. {err}</p>}

      {!artists.length ? (
        <p>No data yet. Try a different time range or listen more on Spotify.</p>
      ) : (
        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {artists.map(a => (
            <li key={a.id} className="rounded-2xl shadow p-4">
              {a.images?.[0]?.url && (
                <img src={a.images[0].url} alt={a.name} className="rounded-xl mb-3" />
              )}
              <div className="font-medium">{a.name}</div>
              {a.external_urls?.spotify && (
                <a
                  className="text-sm underline mt-2 inline-block"
                  href={a.external_urls.spotify}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Spotify
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
