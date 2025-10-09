// SpotifyEmbed.tsx
import React from "react";

type Props = {
  urlOrUri: string;
  theme?: "dark" | "light";
  width?: number | string; // '100%' default
  height?: number; // defaults per type
};

function toEmbedSrc(urlOrUri: string) {
  // Accept full URLs or spotify:* URIs
  if (urlOrUri.startsWith("spotify:")) {
    const [, type, id] = urlOrUri.split(":"); // spotify:track:ID
    return `https://open.spotify.com/embed/${type}/${id}`;
  }
  // URL form → swap to /embed/
  return urlOrUri.replace("open.spotify.com/", "open.spotify.com/embed/");
}

function guessHeight(embedSrc: string) {
  // track/episode small player is 152px; album/playlist/artist are taller
  if (/(track|episode)\//.test(embedSrc)) return 152;
  return 352;
}

export default function SpotifyEmbed({
  urlOrUri,
  theme = "dark",
  width = "100%",
  height,
}: Props) {
  const srcBase = toEmbedSrc(urlOrUri);
  const src = `${srcBase}?utm_source=generator&theme=${
    theme === "light" ? 0 : 1
  }`;

  return (
    <iframe
      title="Spotify Embed"
      src={src}
      width={typeof width === "number" ? String(width) : width}
      height={String(height ?? guessHeight(src))}
      frameBorder="0"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      style={{ borderRadius: 12, maxWidth: "100%" }}
    />
  );
}
