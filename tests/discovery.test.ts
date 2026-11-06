import test from "node:test";
import assert from "node:assert/strict";
import type { Artist, Neighborhood } from "../src/types";
import { ArtistGraph } from "../src/lib/graph";
import {
  RecentArtists,
  DiscoveryJourney,
  discoveryInput,
  DiscoveryInputError,
  unexploredArtists,
  visibleNeighborhood,
  needsFreshConnections,
  RECENT_ARTIST_LIMIT,
} from "../src/lib/discovery";

const artist = (name: string): Artist => ({
  name,
  url: "https://www.last.fm/music/" + encodeURIComponent(name),
});
const neighborhood = (
  name: string,
  leaves: string[],
  pool = leaves,
): Neighborhood => ({
  center: artist(name),
  related: leaves.map(artist),
  candidates: pool.map(artist),
  tracks: [],
  source: "lastfm",
});
const names = (artists: Artist[]) => artists.map((a) => a.name);

test("recent centers use exactly 20 unique LRU entries, with normalized promotion", () => {
  const recent = new RecentArtists();
  for (let i = 0; i < 20; i++) recent.visit("Artist " + i);
  recent.visit(" ARTIST 0 ");
  assert.equal(recent.names.length, RECENT_ARTIST_LIMIT);
  assert.equal(recent.names.at(-1), "ARTIST 0");
  recent.visit("Artist 20");
  assert.ok(recent.has("artist 0"));
  assert.ok(
    !recent.has("Artist 1"),
    "Least-recently visited, not first-ever visited, is evicted",
  );
  assert.ok(recent.has("Artist 20"));
  assert.equal(recent.names.length, 20);
  assert.throws(() => new RecentArtists(0));
});

test("filter fills six leaves past twenty blocked candidates and removes self/duplicates", () => {
  const excluded = Array.from({ length: 20 }, (_, i) => "Visited " + i);
  const pool = [
    "Center",
    ...excluded,
    "Fresh A",
    " fresh a ",
    "Fresh B",
    "Fresh C",
    "Fresh D",
    "Fresh E",
    "Fresh F",
    "Fresh G",
  ].map(artist);
  const before = structuredClone(pool);
  assert.deepEqual(
    names(
      unexploredArtists(
        pool,
        "CENTER",
        excluded.map((n) => n.toUpperCase()),
      ),
    ),
    ["Fresh A", "Fresh B", "Fresh C", "Fresh D", "Fresh E", "Fresh F"],
  );
  assert.deepEqual(pool, before, "Shared candidates are never mutated");
});

test("an exhausted pool stays empty instead of falling back to visited artists", () => {
  const recent = new RecentArtists();
  recent.visit("A");
  recent.visit("B");
  const data = neighborhood("C", ["A", "B", "C"]);
  assert.deepEqual(visibleNeighborhood(data, recent).related, []);
  assert.equal(needsFreshConnections(data, recent), false);
  assert.deepEqual(names(data.related), ["A", "B", "C"]);
});

test("back and forward restore the center instantly but keep recent centers out of leaves", () => {
  const journey = new DiscoveryJourney();
  const graph = new ArtistGraph();
  const a = neighborhood("A", ["B", "C", "D"]);
  graph.add(a);
  const first = journey.commit(a);
  const second = journey.commit(neighborhood("B", ["A", "C", "E"]));
  assert.deepEqual(names(second.neighborhood.related), ["C", "E"]);
  const back = journey.move(-1)!;
  assert.equal(back.neighborhood.center.name, "A");
  assert.deepEqual(names(back.neighborhood.related), ["C", "D"]);
  assert.equal(back.visitId, first.visitId);
  const forward = journey.move(1)!;
  assert.equal(forward.neighborhood.center.name, "B");
  assert.deepEqual(names(forward.neighborhood.related), ["C", "E"]);
  assert.deepEqual(
    names(graph.get("A")!.related),
    ["B", "C", "D"],
    "View filtering leaves cached neighborhoods intact",
  );
  assert.deepEqual(journey.recent.names, ["A", "B"]);
});

test("a new branch clears forward navigation but retains its centers in the recent window", () => {
  const journey = new DiscoveryJourney();
  journey.commit(neighborhood("A", ["B"]));
  journey.commit(neighborhood("B", ["C"]));
  const discarded = journey.commit(neighborhood("C", ["D"]));
  journey.move(-1);
  const branch = journey.commit(neighborhood("D", ["A", "B", "C", "E"]));
  assert.deepEqual(names(branch.neighborhood.related), ["E"]);
  assert.equal(journey.move(1), null);
  assert.equal(journey.restore("C", discarded.visitId), null);
  assert.equal(journey.recent.has("C"), true);
  assert.notEqual(
    branch.visitId,
    discarded.visitId,
    "Discarded browser IDs cannot resolve to a new visit",
  );
});

test("browser visit IDs survive trimming and disambiguate repeat artist visits", () => {
  const journey = new DiscoveryJourney(3);
  const original = journey.commit(neighborhood("A", ["Original"]));
  journey.commit(neighborhood("B", ["Other"]));
  const revisit = journey.commit(neighborhood("A", ["Revisited"]));
  journey.commit(neighborhood("C", ["Next"]));
  assert.equal(
    journey.restore("A", original.visitId),
    null,
    "Evicted snapshot is not mistaken for the later A visit",
  );
  const restored = journey.restore("A", revisit.visitId)!;
  assert.deepEqual(names(restored.neighborhood.related), ["Revisited"]);
  assert.equal(restored.index, 1);
  assert.equal(restored.length, 3);
  assert.equal(journey.restore("Wrong name", revisit.visitId), null);
});

test("explicit revisits and refreshes work without creating duplicate adjacent history entries", () => {
  const journey = new DiscoveryJourney();
  const first = journey.commit(neighborhood("A", ["X"]));
  const refreshed = journey.commit(neighborhood(" a ", ["Y"]));
  assert.equal(refreshed.repeated, true);
  assert.equal(refreshed.visitId, first.visitId);
  assert.equal(refreshed.length, 1);
  assert.deepEqual(names(refreshed.neighborhood.related), ["Y"]);
  journey.commit(neighborhood("B", ["A", "Z"]));
  const revisit = journey.commit(neighborhood("A", ["B", "Fresh"]));
  assert.deepEqual(names(revisit.neighborhood.related), ["Fresh"]);
  assert.equal(revisit.length, 3);
});

test("back/forward visits refresh recency and older-than-window artists become eligible again", () => {
  const journey = new DiscoveryJourney(10, 3);
  const a = journey.commit(neighborhood("A", ["E"]));
  journey.commit(neighborhood("B", ["E"]));
  journey.commit(neighborhood("C", ["E"]));
  journey.commit(neighborhood("D", ["E"]));
  assert.ok(!journey.recent.has("A"));
  journey.restore("A", a.visitId);
  assert.deepEqual(journey.recent.names, ["C", "D", "A"]);
  const next = journey.commit(neighborhood("E", ["A", "B", "C", "D", "F"]));
  assert.ok(!names(next.neighborhood.related).includes("A"));
  assert.ok(
    names(next.neighborhood.related).includes("B"),
    "Old artists are not banned forever",
  );
});

test("per-tab recent history can be restored safely and stays bounded", () => {
  const recent = new RecentArtists();
  recent.restore(null);
  recent.restore("bad value");
  recent.restore([null, 123, "", "x".repeat(201), "Björk", " BJÖRK "]);
  assert.deepEqual(recent.names, ["BJÖRK"]);
  const saved = JSON.parse(
    JSON.stringify(Array.from({ length: 100 }, (_, i) => "Artist " + i)),
  );
  recent.restore(saved);
  assert.equal(recent.names.length, 20);
  assert.equal(recent.names[0], "Artist 80");
  assert.equal(recent.names.at(-1), "Artist 99");
});

test("cached views only request a refill when unseen replacements are missing", () => {
  const recent = new RecentArtists();
  const data = neighborhood(
    "A",
    ["B", "C", "D", "E", "F", "G"],
    ["B", "C", "D", "E", "F", "G", "H", "I"],
  );
  assert.equal(needsFreshConnections(data, recent), false);
  recent.visit("B");
  assert.equal(needsFreshConnections(data, recent), true);
  assert.equal(
    needsFreshConnections(
      neighborhood(
        "A",
        ["C", "D", "E", "F", "G", "H"],
        names(data.candidates!),
      ),
      recent,
    ),
    false,
  );
  assert.equal(
    needsFreshConnections(neighborhood("A", ["B", "C"]), recent),
    false,
  );
});

test("personal exclusion input is bounded, typed and independent of shared metadata", () => {
  assert.deepEqual(discoveryInput({ artist: " A ", exclude: ["B"] }), {
    artist: "A",
    exclude: ["B"],
  });
  assert.deepEqual(discoveryInput({ artist: "A" }).exclude, []);
  for (const input of [
    null,
    {},
    { artist: "" },
    { artist: "x".repeat(121) },
    { artist: "A", exclude: "B" },
    { artist: "A", exclude: [null] },
    { artist: "A", exclude: Array(21).fill("B") },
  ]) {
    assert.throws(() => discoveryInput(input), DiscoveryInputError);
  }
});
