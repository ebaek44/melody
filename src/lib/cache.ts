/** Bounded O(1) LRU with TTL and in-flight request coalescing. */
export class LruCache<T> {
  private entries = new Map<string, { value: T; expires: number }>();
  private pending = new Map<string, Promise<T>>();

  constructor(
    private capacity = 200,
    private ttl = 60 * 60 * 1000,
  ) {
    if (capacity < 1 || ttl < 1)
      throw new Error("Cache limits must be positive");
  }

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return;
    this.entries.delete(key);
    if (entry.expires <= Date.now()) return;
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, ttl = this.ttl) {
    this.entries.delete(key);
    this.entries.set(key, { value, expires: Date.now() + ttl });
    if (this.entries.size > this.capacity) {
      this.entries.delete(this.entries.keys().next().value!);
    }
    return value;
  }

  async remember(key: string, load: () => Promise<T>): Promise<T> {
    const hit = this.get(key);
    if (hit !== undefined) return hit;
    const existing = this.pending.get(key);
    if (existing) return existing;
    const request = load()
      .then((value) => this.set(key, value))
      .finally(() => this.pending.delete(key));
    this.pending.set(key, request);
    return request;
  }
}

export const artistKey = (name: string) =>
  name.normalize("NFKC").trim().toLocaleLowerCase("en-US");
