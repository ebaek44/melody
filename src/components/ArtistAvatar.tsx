/* Artist artwork comes from Spotify; initials keep the graph legible without it. */
import type { Artist } from "@/types";
import Image from "next/image";
import { artistKey } from "@/lib/cache";

export default function ArtistAvatar({
  artist,
  className = "",
}: {
  artist: Artist;
  className?: string;
}) {
  const hue =
    [...artistKey(artist.name)].reduce((n, c) => n + c.charCodeAt(0), 0) % 5;
  const initials = artist.name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("");
  return (
    <span className={`artist-avatar avatar-tone-${hue} ${className}`}>
      <span aria-hidden="true">{initials}</span>
      {artist.pfp && (
        <Image
          src={artist.pfp}
          alt=""
          fill
          sizes="(max-width: 600px) 68px, 106px"
          referrerPolicy="no-referrer"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      )}
    </span>
  );
}
