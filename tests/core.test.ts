import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LruCache, artistKey } from "../src/lib/cache";
import { validateItem } from "../src/lib/library";
import { ArtistGraph } from "../src/lib/graph";
import { curatedNeighborhood } from "../src/lib/catalog";
import { spotifyEmbedSrc } from "../src/components/ui/SpotifyEmbed";

test("LRU access updates recency and eviction stays bounded", () => {
  const cache = new LruCache<number>(2);
  cache.set("a", 1);
  cache.set("b", 2);
  assert.equal(cache.get("a"), 1);
  cache.set("c", 3);
  assert.equal(cache.get("b"), undefined);
  assert.equal(cache.get("a"), 1);
  assert.equal(cache.get("c"), 3);
});
test("expired entries are reloaded rather than reused", async () => {
  const cache = new LruCache<number>(2, 1);
  cache.set("a", 1);
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(cache.get("a"), undefined);
  assert.equal(await cache.remember("a", async () => 2), 2);
});
test("concurrent misses share a request, failures are retryable", async () => {
  const cache = new LruCache<number>();
  let calls = 0;
  const load = async () => {
    calls++;
    await new Promise((resolve) => setTimeout(resolve, 5));
    return 7;
  };
  assert.deepEqual(
    await Promise.all([cache.remember("a", load), cache.remember("a", load)]),
    [7, 7],
  );
  assert.equal(calls, 1);
  await assert.rejects(
    cache.remember("b", async () => {
      throw Error("offline");
    }),
  );
  assert.equal(await cache.remember("b", async () => 9), 9);
});
test("graph preserves independent neighborhoods, including cycles and short leaves", () => {
  const graph = new ArtistGraph();
  const radiohead = curatedNeighborhood("Radiohead")!;
  const portishead = curatedNeighborhood("Portishead")!;
  graph.add(radiohead);
  graph.add({ ...portishead, related: [radiohead.center] });
  assert.deepEqual(graph.get(" RADIOHEAD "), radiohead);
  assert.equal(graph.get("portishead")?.related[0].name, "Radiohead");
  assert.equal(graph.get("portishead")?.related.length, 1);
  assert.equal(graph.get("missing"), undefined);
  assert.equal(artistKey(" Björk "), artistKey("BJÖRK"));
});
test("saved items use canonical identities and reject invalid links", () => {
  const base = {
    kind: "track",
    name: "Creep",
    artist: "Radiohead",
    url: "https://www.last.fm/music/Radiohead/_/Creep",
  };
  assert.equal(
    validateItem(base).key,
    validateItem({ ...base, name: " creep ", artist: "RADIOHEAD" }).key,
  );
  assert.notEqual(
    validateItem(base).key,
    validateItem({ ...base, artist: "Someone else" }).key,
  );
  for (const url of [
    "javascript:alert(1)",
    "https://evil.example/song",
    "http://open.spotify.com/track/test",
    "https://user:secret@open.spotify.com/artist/test",
  ]) {
    assert.throws(() => validateItem({ ...base, url }));
  }
  assert.throws(() => validateItem({ ...base, kind: "playlist" }));
  assert.throws(() => validateItem({ ...base, name: "" }));
});
test("Spotify embeds accept only trusted, valid catalog identities", () => {
  const id = "4Z8W4fKeB5YxbusRsdQVPb";
  assert.match(spotifyEmbedSrc(`spotify:artist:${id}`)!, /embed\/artist/);
  assert.equal(spotifyEmbedSrc("https://evil.example/artist/" + id), null);
  assert.equal(spotifyEmbedSrc("javascript:alert(1)"), null);
  assert.equal(spotifyEmbedSrc("spotify:artist:bad"), null);
});
test("SQLite persists account libraries, deduplicates saves and isolates users", async () => {
  const directory = mkdtempSync(join(tmpdir(), "musicmap-core-"));
  process.env.MUSICMAP_DB_PATH = join(directory, "library.sqlite");
  const { upsertUser, saveItem, getLibrary, removeItem } =
    await import("../src/lib/db");
  try {
    upsertUser("test-a", "Listener A");
    upsertUser("test-b", "Listener B");
    upsertUser("test-a", "Updated name");
    const item = validateItem({
      kind: "artist",
      name: "Radiohead",
      url: "https://open.spotify.com/artist/4Z8W4fKeB5YxbusRsdQVPb",
    });
    saveItem("test-a", item);
    saveItem("test-a", item);
    assert.equal(getLibrary("test-a").length, 1);
    assert.equal(getLibrary("test-b").length, 0);
    removeItem("test-b", item.key);
    assert.equal(getLibrary("test-a").length, 1);
    // Reopen the same file with an independent connection to verify disk persistence.
    const { DatabaseSync } = await import("node:sqlite");
    const disk = new DatabaseSync(process.env.MUSICMAP_DB_PATH);
    assert.equal(
      (disk.prepare("SELECT COUNT(*) AS n FROM library").get() as { n: number })
        .n,
      1,
    );
    disk.close();
    removeItem("test-a", item.key);
    assert.equal(getLibrary("test-a").length, 0);
    const { authOptions } = await import("../src/lib/auth");
    const jwt = authOptions.callbacks!.jwt!;
    const token = await jwt({
      token: {},
      user: { id: "fixture", name: "OAuth fixture" },
      account: {
        provider: "spotify",
        providerAccountId: "test-oauth",
        access_token: "private-access",
        refresh_token: "private-refresh",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      },
    } as Parameters<typeof jwt>[0]);
    assert.equal(token.spotifyUserId, "test-oauth");
    const sessionCallback = authOptions.callbacks!.session!;
    const session = await sessionCallback({
      session: { user: { name: "OAuth fixture" }, expires: "2099-01-01" },
      token,
    } as Parameters<typeof sessionCallback>[0]);
    assert.ok(session.user && "id" in session.user);
    assert.equal(session.user.id, "test-oauth");
    assert.ok(!JSON.stringify(session).includes("private-access"));
    assert.ok(!JSON.stringify(session).includes("private-refresh"));
    saveItem("test-oauth", item);
    assert.equal(getLibrary("test-oauth").length, 1);
  } finally {
    const globalDb = globalThis as typeof globalThis & {
      musicmapDb?: { close: () => void };
    };
    globalDb.musicmapDb?.close();
    delete globalDb.musicmapDb;
    rmSync(directory, { recursive: true, force: true });
  }
});
