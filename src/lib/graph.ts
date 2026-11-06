import type { Neighborhood } from "@/types";
import { artistKey, LruCache } from "./cache";

/** Directed, weighted adjacency lists: one center and its strongest neighbors.
 * No global layout simulation or MST recomputation on navigation.
 * A bounded snapshot cache makes back/forward exact and repeat visits instant.
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
