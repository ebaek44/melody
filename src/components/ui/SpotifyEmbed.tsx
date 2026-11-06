import React from "react";

export function spotifyEmbedSrc(input: string) {
  const uri = input.match(
    /^spotify:(artist|track|album|playlist):([a-zA-Z0-9]{22})$/,
  );
  if (uri)
    return `https://open.spotify.com/embed/${uri[1]}/${uri[2]}?utm_source=generator&theme=0`;
  try {
    const url = new URL(input);
    const match = url.pathname.match(
      /^\/(artist|track|album|playlist)\/([a-zA-Z0-9]{22})\/?$/,
    );
    if (
      url.protocol === "https:" &&
      url.hostname === "open.spotify.com" &&
      match
    )
      return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
  } catch {
    /* Reject invalid or untrusted iframe URLs. */
  }
  return null;
}
export default function SpotifyEmbed({
  urlOrUri,
  height = 352,
}: {
  urlOrUri: string;
  height?: number;
}) {
  const src = spotifyEmbedSrc(urlOrUri);
  if (!src) return null;
  return (
    <iframe
      className="spotify-player"
      title="Listen to this artist’s popular songs on Spotify"
      src={src}
      width="100%"
      height={height}
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
    />
  );
}
