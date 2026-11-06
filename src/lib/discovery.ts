import type { Artist, Neighborhood } from "@/types";
import { artistKey } from "./cache";

export const RECENT_ARTIST_LIMIT = 20;
export const VISIBLE_ARTIST_LIMIT = 6;
export const CANDIDATE_ARTIST_LIMIT = 36;
export const RECENT_ARTISTS_STORAGE_KEY = "musicweb-recent-artists:v1";

export class DiscoveryInputError extends Error {}
export function discoveryInput(value: unknown): {
  artist: string;
  exclude: string[];
} {
  if (!value || typeof value !== "object")
    throw new DiscoveryInputError("Enter an artist name.");
  const { artist, exclude = [] } = value as Record<string, unknown>;
  if (
    typeof artist !== "string" ||
    !artist.trim() ||
    artist.trim().length > 120
  ) {
    throw new DiscoveryInputError(
      "Enter an artist name (up to 120 characters).",
    );
  }
  if (
    !Array.isArray(exclude) ||
    exclude.length > RECENT_ARTIST_LIMIT ||
    exclude.some(
      (name) => typeof name !== "string" || !name.trim() || name.length > 200,
    )
  ) {
    throw new DiscoveryInputError(
      `Supply up to ${RECENT_ARTIST_LIMIT} recent artist names.`,
    );
  }
  return { artist: artist.trim(), exclude: exclude as string[] };
}

/** Preserve provider ranking, while excluding self-links, repeats and recent centers. */
export function unexploredArtists(
  candidates: readonly Artist[],
  center: string,
  excluded: readonly string[],
  limit = VISIBLE_ARTIST_LIMIT,
): Artist[] {
  const blocked = new Set([artistKey(center), ...excluded.map(artistKey)]);
  const result: Artist[] = [];
  for (const artist of candidates) {
    const key = artistKey(artist.name);
    if (!key || blocked.has(key)) continue;
    blocked.add(key);
    result.push(artist);
    if (result.length === limit) break;
  }
  return result;
}

/** Bounded ordered set: O(1) membership, promotion and least-recent eviction.
 * Unlike metadata cache entries, visits do not expire on a timer.
 */
export class RecentArtists {
  private entries = new Map<string, string>();
  constructor(private capacity = RECENT_ARTIST_LIMIT) {
    if (!Number.isInteger(capacity) || capacity < 1)
      throw new Error("Visit capacity must be positive");
  }
  visit(name: string) {
    const key = artistKey(name);
    if (!key) return;
    this.entries.delete(key);
    this.entries.set(key, name.trim());
    if (this.entries.size > this.capacity)
      this.entries.delete(this.entries.keys().next().value!);
  }
  has(name: string) {
    return this.entries.has(artistKey(name));
  }
  get names() {
    return [...this.entries.values()];
  }
  restore(value: unknown) {
    if (!Array.isArray(value)) return;
    for (const name of value.slice(-this.capacity)) {
      if (typeof name === "string" && name.trim() && name.length <= 200)
        this.visit(name);
    }
  }
}

export function visibleNeighborhood(
  data: Neighborhood,
  recent: RecentArtists,
): Neighborhood {
  return {
    ...data,
    related: unexploredArtists(data.related, data.center.name, recent.names),
  };
}

/** A cached visit can be reused if it already contains all eligible visible artists.
 * Otherwise the server reuses the raw candidate cache and enriches only replacement leaves.
 */
export function needsFreshConnections(
  data: Neighborhood,
  recent: RecentArtists,
): boolean {
  const rendered = new Set(
    data.related.map((artist) => artistKey(artist.name)),
  );
  return unexploredArtists(
    data.candidates ?? data.related,
    data.center.name,
    recent.names,
  ).some((artist) => !rendered.has(artistKey(artist.name)));
}

export type JourneyState = {
  neighborhood: Neighborhood;
  index: number;
  length: number;
  visitId: number;
  repeated: boolean;
};
type Visit = { id: number; data: Neighborhood };
export class DiscoveryJourney {
  readonly recent: RecentArtists;
  private visits: Visit[] = [];
  private index = -1;
  private nextId = 0;
  constructor(
    private capacity = 50,
    recentCapacity = RECENT_ARTIST_LIMIT,
  ) {
    if (!Number.isInteger(capacity) || capacity < 1)
      throw new Error("History capacity must be positive");
    this.recent = new RecentArtists(recentCapacity);
  }
  private state(repeated = false): JourneyState {
    const visit = this.visits[this.index];
    return {
      neighborhood: visibleNeighborhood(visit.data, this.recent),
      index: this.index,
      length: this.visits.length,
      visitId: visit.id,
      repeated,
    };
  }
  commit(
    data: Neighborhood,
    mode: "push" | "replace" | "pop" = "push",
  ): JourneyState {
    const previous = this.visits[this.index];
    const repeated =
      !!previous &&
      artistKey(previous.data.center.name) === artistKey(data.center.name);
    if (mode === "pop") {
      // An entry beyond the bounded trail was loaded from browser history.
      this.visits = [{ id: this.nextId++, data }];
      this.index = 0;
    } else if (previous && (mode === "replace" || repeated)) {
      this.visits[this.index] = { id: previous.id, data };
    } else {
      this.visits = [
        ...this.visits.slice(0, this.index + 1),
        { id: this.nextId++, data },
      ].slice(-this.capacity);
      this.index = this.visits.length - 1;
    }
    this.recent.visit(data.center.name);
    return this.state(repeated);
  }
  move(offset: number): JourneyState | null {
    const next = this.index + offset;
    if (!Number.isInteger(next) || next < 0 || next >= this.visits.length)
      return null;
    this.index = next;
    this.recent.visit(this.visits[next].data.center.name);
    return this.state();
  }
  restore(name: string, visitId?: unknown): JourneyState | null {
    const matches = (visit: Visit) =>
      artistKey(visit.data.center.name) === artistKey(name);
    // IDs remain stable when history is trimmed or a forward branch is replaced.
    const index =
      typeof visitId === "number"
        ? this.visits.findIndex(
            (visit) => visit.id === visitId && matches(visit),
          )
        : this.visits.findLastIndex(matches);
    if (index < 0) return null;
    this.index = index;
    this.recent.visit(this.visits[index].data.center.name);
    return this.state();
  }
}
