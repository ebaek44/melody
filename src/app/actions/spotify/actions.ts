"use server";
import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";
import { mapSpotifyArtist, spotifyRequest } from "@/lib/music";

export async function fetchArtist(artistId: string) {
  if (!/^[a-zA-Z0-9]{22}$/.test(artistId)) throw new Error("Invalid artist");
  return spotifyRequest(`artists/${artistId}`);
}
export async function searchArtist(artistName: string) {
  return spotifyRequest(
    `search?${new URLSearchParams({ q: artistName.slice(0, 120), type: "artist", limit: "5", market: "US" })}`,
  );
}
// Provider tokens are read only on the server, never supplied by a client action.
export async function getTopArtists() {
  const h = await headers();
  const token = await getToken({
    req: { headers: { cookie: h.get("cookie") ?? "" } } as Parameters<
      typeof getToken
    >[0]["req"],
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (
    !token?.spotifyAccessToken ||
    (token.spotifyExpiresAt ?? 0) * 1000 < Date.now()
  )
    return [];
  try {
    const data = await spotifyRequest(
      "me/top/artists?time_range=medium_term&limit=6",
      token.spotifyAccessToken,
    );
    return data.items.map(mapSpotifyArtist);
  } catch {
    return [];
  }
}
