"use server";
import { lastfmRequest } from "@/lib/music";
export async function fetchRelatedArtists(artistName: string) {
  if (!artistName.trim() || artistName.length > 120)
    throw new Error("Invalid artist name");
  return lastfmRequest("artist.getSimilar", {
    artist: artistName,
    limit: "12",
  });
}
