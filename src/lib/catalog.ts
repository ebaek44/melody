import type { Artist, Neighborhood } from "@/types";
import { artistKey } from "./cache";

// A small, explicitly curated fallback keeps the demo usable during API outages.
// These are editorial connections, never presented as live similarity scores.
const entries = [
  [
    "Radiohead",
    "4Z8W4fKeB5YxbusRsdQVPb",
    "art rock",
    ["Karma Police", "No Surprises", "Weird Fishes / Arpeggi"],
  ],
  [
    "Thom Yorke",
    "4CvTDPKA6W06DRfBnZKZlt",
    "experimental",
    ["Dawn Chorus", "Hearing Damage", "The Eraser"],
  ],
  [
    "Portishead",
    "6liAMWkVf5LH7YR9yfFy1Y",
    "trip hop",
    ["Glory Box", "Roads", "Sour Times"],
  ],
  [
    "Massive Attack",
    "6FXMGgJwohJLUSr5nVlf9X",
    "trip hop",
    ["Teardrop", "Angel", "Unfinished Sympathy"],
  ],
  [
    "Björk",
    "7w29UYBi0qsHi5RTcv3lmA",
    "art pop",
    ["Jóga", "Army of Me", "Hyperballad"],
  ],
  [
    "James Blake",
    "53KwLdlmrlCelAZMaLVZqU",
    "electronic",
    ["Retrograde", "Limit to Your Love", "Life Round Here"],
  ],
  [
    "Bon Iver",
    "4LEiUm1SRbFMgfqnQTwUbQ",
    "indie folk",
    ["Holocene", "Skinny Love", "Hey, Ma"],
  ],
  [
    "Tame Impala",
    "5INjqkS1o8h1imAzPqGZBb",
    "psychedelic pop",
    ["The Less I Know the Better", "Let It Happen", "Eventually"],
  ],
  [
    "Frank Ocean",
    "2h93pZq0e7k5yf4dywlkpM",
    "alternative R&B",
    ["Pink + White", "Nights", "Ivy"],
  ],
  [
    "Beach House",
    "56ZTgzPBDge0OvCGgMO3OY",
    "dream pop",
    ["Space Song", "Myth", "Silver Soul"],
  ],
  [
    "The National",
    "2cCUtGK9sDU2EoElnk0GNB",
    "indie rock",
    ["I Need My Girl", "Bloodbuzz Ohio", "About Today"],
  ],
  [
    "Phoebe Bridgers",
    "1r1uxoy19fzMxunt3ONAkG",
    "indie folk",
    ["Motion Sickness", "Kyoto", "Scott Street"],
  ],
] as const;

export const curatedArtists: Artist[] = entries.map(([name, id, genre]) => ({
  name,
  id,
  genres: [genre],
  url: `https://open.spotify.com/artist/${id}`,
  uri: `spotify:artist:${id}`,
}));
export const starterArtists = [
  curatedArtists[0],
  curatedArtists[7],
  curatedArtists[8],
  curatedArtists[6],
];

const connections: Record<string, number[]> = {
  radiohead: [1, 2, 3, 4, 5, 6],
  "thom yorke": [0, 5, 4, 3, 2, 10],
  portishead: [3, 0, 4, 5, 1, 9],
  "massive attack": [2, 5, 4, 0, 1, 8],
  björk: [1, 2, 5, 3, 0, 9],
  "james blake": [8, 6, 3, 1, 4, 2],
  "bon iver": [11, 10, 5, 0, 9, 8],
  "tame impala": [9, 8, 0, 5, 6, 4],
  "frank ocean": [5, 7, 6, 9, 3, 11],
  "beach house": [7, 11, 10, 0, 6, 2],
  "the national": [6, 11, 0, 1, 9, 5],
  "phoebe bridgers": [6, 10, 9, 8, 0, 7],
};

export function curatedNeighborhood(name: string): Neighborhood | undefined {
  const index = entries.findIndex(
    (entry) => artistKey(entry[0]) === artistKey(name),
  );
  if (index < 0) return;
  const center = curatedArtists[index];
  return {
    center,
    related: connections[artistKey(center.name)].map((i) => curatedArtists[i]),
    tracks: entries[index][3].map((name) => ({
      name,
      artist: center.name,
      url: `https://open.spotify.com/search/${encodeURIComponent(`${center.name} ${name}`)}`,
    })),
    source: "curated",
    notice:
      "Live discovery is temporarily unavailable. Explore these curated connections instead.",
  };
}
