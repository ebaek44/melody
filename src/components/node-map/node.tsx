"use client";
import { Artist } from "@/types";
import ArtistAvatar from "../ArtistAvatar";

export default function Node({
  a,
  changeMiddleArtist,
  center = false,
  disabled = false,
}: {
  a: Artist;
  changeMiddleArtist?: (artist: Artist) => void;
  center?: boolean;
  disabled?: boolean;
}) {
  if (center)
    return (
      <div className="graph-node center-node">
        <span className="center-halo" />
        <ArtistAvatar artist={a} />
        <strong>{a.name}</strong>
        <span className="center-caption">NOW EXPLORING</span>
      </div>
    );
  return (
    <button
      className="graph-node leaf-node"
      onClick={() => changeMiddleArtist?.(a)}
      disabled={disabled}
      aria-label={`Explore artists connected to ${a.name}`}
    >
      <ArtistAvatar artist={a} />
      <strong>{a.name}</strong>
      <span className="leaf-caption">Explore artist ↗</span>
    </button>
  );
}
