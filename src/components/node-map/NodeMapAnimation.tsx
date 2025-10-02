// OrbitDynamic.tsx — dynamic count, Tailwind-only transforms
import Node from "./node";
import { Artist } from "@/types";

export default function OrbitDynamic({
  center,
  orbit,
  state = "spread", // 'spread' | 'gather' (you toggle this)
  radius = "9rem", // ring radius (string like '9rem' or '140px')
}: {
  center: Artist;
  orbit: Artist[];
  state?: "spread" | "gather";
  radius?: string;
}) {
  const n = Math.max(orbit.length, 1);

  return (
    <div
      data-state={state}
      className="relative mx-auto h-[28rem] w-[28rem] select-none group"
      style={{ ["--r" as any]: radius }}
    >
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <Node {...center} />
      </div>
      {orbit.map((a, i) => {
        const angle = (360 / n) * i;
        const spreadTransform = `translate(-50%, -50%) rotate(${angle}deg) translate(${radius}) rotate(${-angle}deg)`;
        const gatherTransform = `translate(-50%, -50%) rotate(${angle}deg) translate(0) rotate(${-angle}deg)`;

        return (
          <div
            key={i}
            style={{
              transform: state === "spread" ? spreadTransform : gatherTransform,
            }}
            className="
            absolute left-1/2 top-1/2
            transition-transform duration-500 ease-out transform-gpu will-change-transform
          "
          >
            <Node {...a} />
          </div>
        );
      })}
    </div>
  );
}
