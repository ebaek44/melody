// OrbitDynamic.tsx — dynamic count, Tailwind-only transforms
import Node from "./node";
import { Artist } from "@/types";
import type { CSSProperties } from "react";

interface props {
  center: Artist;
  orbit?: Artist[];
  state: string;
  radius?: string;
  changeMiddleArtist: (artist: Artist) => void;
  activeArtist: string;
}

export default function OrbitDynamic({
  center,
  orbit,
  state = "spread", // 'spread' | 'gather' (you toggle this)
  radius = "9rem", // ring radius (string like '9rem' or '140px')
  changeMiddleArtist,
  activeArtist,
}: props) {
  const n = orbit ? Math.max(orbit.length, 1) : 1;

  return (
    <div
      data-state={state}
      className="relative mx-auto h-[28rem] w-[28rem] select-none group"
      style={{ "--r": radius } as CSSProperties}
    >
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <Node a={center} />
      </div>
      {orbit &&
        orbit.map((a, i) => {
          const angle = (360 / n) * i;
          const spreadTransform = `translate(-50%, -50%) rotate(${angle}deg) translate(${radius}) rotate(${-angle}deg)`;
          const gatherTransform = `translate(-50%, -50%) rotate(${angle}deg) translate(0) rotate(${-angle}deg)`;

          return (
            <div
              key={i}
              style={{
                transform:
                  state === "spread" ? spreadTransform : gatherTransform,
              }}
              className={`
            absolute left-1/2 top-1/2
            transition-transform duration-500 ease-out transform-gpu will-change-transform
            ${a.name === activeArtist ? "z-50" : "z-10"}
          `}
            >
              <Node a={a} changeMiddleArtist={changeMiddleArtist} />
            </div>
          );
        })}
    </div>
  );
}
