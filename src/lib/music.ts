import "server-only";
import type { Artist, Neighborhood, Track } from "@/types";
import { artistKey, LruCache } from "./cache";
import { curatedArtists, curatedNeighborhood } from "./catalog";

type SpotifyArtist = {
  id: string;
  name: string;
  images?: { url: string }[];
  genres?: string[];
};
type SimilarArtist = { name: string; match?: string; url?: string };
const metadata = new LruCache<Artist>(500, 6 * 60 * 60 * 1000);
const neighborhoods = new LruCache<Neighborhood>(150, 60 * 60 * 1000);
const searches = new LruCache<Artist[]>(100, 10 * 60 * 1000);
const tokens = new LruCache<string>(1, 50 * 60 * 1000);
let spotifyRetryAt = 0;

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok)
    throw new Error(`Music service unavailable (${response.status})`);
  return response.json();
}

export async function spotifyToken() {
  if (
    !process.env.SPOTIFY_CLIENT_ID ||
    !process.env.SPOTIFY_CLIENT_SECRET ||
    Date.now() < spotifyRetryAt
  ) {
    throw new Error("Spotify catalog unavailable");
  }
  return tokens.remember("app", async () => {
    try {
      const data = await fetchJson("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
        },
        body: "grant_type=client_credentials",
      });
      return data.access_token as string;
    } catch {
      spotifyRetryAt = Date.now() + 30_000;
      throw new Error("Spotify catalog unavailable");
    }
  });
}

export async function spotifyRequest(path: string, userToken?: string) {
  return fetchJson(`https://api.spotify.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${userToken ?? (await spotifyToken())}` },
  });
}

export async function lastfmRequest(
  method: string,
  params: Record<string, string>,
) {
  if (!process.env.LASTFM_API_KEY) throw new Error("Last.fm is not configured");
  const query = new URLSearchParams({
    method,
    ...params,
    api_key: process.env.LASTFM_API_KEY,
    format: "json",
    autocorrect: "1",
  });
  const data = await fetchJson(`https://ws.audioscrobbler.com/2.0/?${query}`);
  if (data.error) throw new Error("Last.fm is temporarily unavailable");
  return data;
}

export const mapSpotifyArtist = (item: SpotifyArtist): Artist => ({
  id: item.id,
  name: item.name,
  pfp: item.images?.[0]?.url,
  genres: item.genres,
  uri: `spotify:artist:${item.id}`,
  url: `https://open.spotify.com/artist/${item.id}`,
});

export async function resolveArtist(name: string): Promise<Artist> {
  const key = artistKey(name);
  const cached = metadata.get(key);
  if (cached) return cached;
  const known = curatedArtists.find((item) => artistKey(item.name) === key);
  try {
    if (known?.id) {
      const data = await spotifyRequest(`artists/${known.id}`);
      return metadata.set(key, mapSpotifyArtist(data));
    }
    const data = await spotifyRequest(
      `search?${new URLSearchParams({ q: `artist:${name}`, type: "artist", limit: "5", market: "US" })}`,
    );
    const exact = (data.artists?.items as SpotifyArtist[] | undefined)?.find(
      (item) => artistKey(item.name) === key,
    );
    if (exact) return metadata.set(key, mapSpotifyArtist(exact));
  } catch {
    /* Last.fm discovery still works without Spotify metadata. */
  }
  const fallback = known ?? {
    name,
    url: `https://www.last.fm/music/${encodeURIComponent(name)}`,
  };
  return metadata.set(key, fallback, 60_000);
}

async function enrichRelated(artists: SimilarArtist[]): Promise<Artist[]> {
  const result: Artist[] = [];
  // Three requests at a time avoids a burst of catalog calls on every expansion.
  for (let i = 0; i < artists.length; i += 3) {
    result.push(
      ...(await Promise.all(
        artists.slice(i, i + 3).map(async (artist) => ({
          ...(await resolveArtist(artist.name)),
          match:
            artist.match === undefined
              ? undefined
              : Math.max(0, Math.min(1, Number(artist.match))) || undefined,
        })),
      )),
    );
  }
  return result;
}

export async function discoverArtist(name: string): Promise<Neighborhood> {
  const key = artistKey(name);
  const cached = neighborhoods.get(key);
  if (cached) return cached;
  // Only successful live responses enter the hour-long cache.
  try {
    return await neighborhoods.remember(key, async () => {
      const [similar, top, center] = await Promise.all([
        lastfmRequest("artist.getSimilar", { artist: name, limit: "12" }),
        lastfmRequest("artist.getTopTracks", {
          artist: name,
          limit: "5",
        }).catch(() => null),
        resolveArtist(name),
      ]);
      const seen = new Set([key]);
      const distinct = (
        (similar.similarartists?.artist ?? []) as SimilarArtist[]
      )
        .filter((artist) => {
          const id = artistKey(artist.name);
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        })
        .slice(0, 6);
      const tracks: Track[] = (top?.toptracks?.track ?? []).map(
        (track: { name: string; url: string }) => ({
          name: track.name,
          artist: center.name,
          url: track.url,
        }),
      );
      return {
        center,
        related: await enrichRelated(distinct),
        tracks,
        source: "lastfm",
        notice: top
          ? undefined
          : "The song list is temporarily unavailable. You can still explore artists.",
      };
    });
  } catch {
    const fallback = curatedNeighborhood(name);
    if (fallback) return neighborhoods.set(key, fallback, 30_000);
    throw new Error(
      "We couldn’t load this artist’s connections. Please try again in a moment.",
    );
  }
}

export async function searchArtists(query: string): Promise<Artist[]> {
  return searches.remember(artistKey(query), async () => {
    try {
      const data = await lastfmRequest("artist.search", {
        artist: query,
        limit: "6",
      });
      const seen = new Set<string>();
      return (
        (data.results?.artistmatches?.artist ?? []) as {
          name: string;
          url: string;
        }[]
      )
        .filter((item) => {
          const key = artistKey(item.name);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((item) => ({ name: item.name, url: item.url }));
    } catch {
      const matches = curatedArtists.filter((item) =>
        artistKey(item.name).includes(artistKey(query)),
      );
      if (matches.length) return matches;
      throw new Error(
        "Artist search is temporarily unavailable. Try one of the suggested starting points.",
      );
    }
  });
}
