"use client";
import type { CSSProperties } from "react";
import type { Artist, Neighborhood } from "@/types";
import Node from "./node";

export default function ArtistOrbit({
  neighborhood,
  loading,
  onSelect,
}: {
  neighborhood: Neighborhood;
  loading: boolean;
  onSelect: (artist: Artist) => void;
}) {
  const count = neighborhood.related.length;
  const points = neighborhood.related.map((artist, i) => {
    const angle = ((-90 + (i * 360) / Math.max(count, 1)) * Math.PI) / 180;
    return { artist, x: Math.cos(angle) * 33, y: Math.sin(angle) * 33 };
  });
  return (
    <div
      className={`graph-stage ${loading ? "is-loading" : ""}`}
      role="group"
      aria-label={`Artists connected to ${neighborhood.center.name}`}
      aria-busy={loading}
    >
      <div className="orbit-ring ring-one" />
      <div className="orbit-ring ring-two" />
      <svg className="graph-edges" viewBox="0 0 100 100" aria-hidden="true">
        {points.map(({ artist, x, y }) => (
          <path
            key={artist.name}
            d={`M 50 50 Q ${50 + x * 0.25 - y * 0.14} ${50 + y * 0.25 + x * 0.14} ${50 + x} ${50 + y}`}
            strokeWidth={0.17 + (artist.match ?? 0.5) * 0.12}
          />
        ))}
        <circle cx="50" cy="50" r="1" />
      </svg>
      <div className="graph-center">
        <Node a={neighborhood.center} center />
      </div>
      {points.map(({ artist, x, y }, i) => (
        <div
          key={`${neighborhood.center.name}-${artist.name}`}
          className="graph-leaf"
          style={
            {
              "--x": `${x}cqw`,
              "--y": `${y}cqw`,
              "--delay": `${i * 35}ms`,
            } as CSSProperties
          }
        >
          <Node a={artist} changeMiddleArtist={onSelect} disabled={loading} />
        </div>
      ))}
    </div>
  );
}
