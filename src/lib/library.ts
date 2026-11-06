import { createHash } from "node:crypto";
import type { SavedItem } from "@/types";
import { artistKey } from "./cache";

export function itemKey(
  kind: "artist" | "track",
  name: string,
  artist: string,
) {
  return createHash("sha256")
    .update(JSON.stringify([kind, artistKey(name), artistKey(artist)]))
    .digest("hex")
    .slice(0, 32);
}

export function validateItem(value: unknown): Omit<SavedItem, "createdAt"> {
  if (!value || typeof value !== "object")
    throw new Error("Invalid library item");
  const item = value as Record<string, unknown>;
  if (item.kind !== "artist" && item.kind !== "track")
    throw new Error("Choose an artist or song");
  const text = (field: string, max: number) => {
    const v = item[field];
    if (typeof v !== "string" || !v.trim() || v.length > max)
      throw new Error(`Invalid ${field}`);
    return v.trim();
  };
  const name = text("name", 200);
  const artist = item.kind === "artist" ? name : text("artist", 200);
  const url = new URL(text("url", 2048));
  if (
    url.protocol !== "https:" ||
    !["open.spotify.com", "www.last.fm", "last.fm"].includes(url.hostname) ||
    url.username ||
    url.password
  )
    throw new Error("Invalid music link");
  const uri =
    typeof item.uri === "string" &&
    /^spotify:(artist|track):[a-zA-Z0-9]{22}$/.test(item.uri)
      ? item.uri
      : undefined;
  let pfp: string | undefined;
  if (typeof item.pfp === "string" && item.pfp.length < 2048) {
    try {
      const image = new URL(item.pfp);
      if (
        image.protocol === "https:" &&
        ["i.scdn.co", "lastfm.freetls.fastly.net"].includes(image.hostname)
      )
        pfp = image.href;
    } catch {
      /* Optional artwork may be omitted. */
    }
  }
  return {
    kind: item.kind,
    key: itemKey(item.kind, name, artist),
    name,
    artist,
    url: url.href,
    uri,
    pfp,
  };
}
