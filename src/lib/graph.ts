import type { Neighborhood } from "@/types";
import { artistKey, LruCache } from "./cache";

/** Directed, weighted adjacency lists: one center and its strongest neighbors.
 * No global layout simulation or MST recomputation on navigation.
 * Raw snapshots stay independent of the recent-artist filter and navigation trail.
 */
export class ArtistGraph {
  private neighborhoods = new LruCache<Neighborhood>(80, 15 * 60 * 1000);
  get(name: string) {
    return this.neighborhoods.get(artistKey(name));
  }
  add(neighborhood: Neighborhood) {
    this.neighborhoods.set(artistKey(neighborhood.center.name), neighborhood);
  }
}
