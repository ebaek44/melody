import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { encode } from "next-auth/jwt";
import { startTestPostgres } from "./helpers/postgres";

test(
  "production routes enforce authentication, ownership, CSRF and persistence",
  { timeout: 60_000 },
  async () => {
    const pg = await startTestPostgres();
    const secret = "isolated-integration-test-secret-never-use-in-production";
    const base = "http://127.0.0.1:3107";
    let logs = "";
    let server: ReturnType<typeof spawn> | undefined;
    async function stopServer() {
      if (!server || server.exitCode !== null) return;
      const child = server;
      child.kill("SIGTERM");
      await new Promise<void>((resolve) => child.once("exit", () => resolve()));
    }
    async function startServer(databaseUrl: string) {
      logs = "";
      server = spawn(
        process.execPath,
        [
          "node_modules/next/dist/bin/next",
          "start",
          "--hostname",
          "127.0.0.1",
          "--port",
          "3107",
        ],
        {
          env: {
            ...process.env,
            NEXTAUTH_SECRET: secret,
            NEXTAUTH_URL: base,
            DATABASE_URL: databaseUrl,
            POSTGRES_URL: "",
            VERCEL: undefined,
            SPOTIFY_CLIENT_ID: "",
            SPOTIFY_CLIENT_SECRET: "",
            LASTFM_API_KEY: "",
          },
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
      server.stdout!.on("data", (data) => {
        logs += data.toString();
      });
      server.stderr!.on("data", (data) => {
        logs += data.toString();
      });
      let ready = false;
      for (let i = 0; i < 80; i++) {
        try {
          if ((await fetch(base + "/api/auth/session")).ok) {
            ready = true;
            break;
          }
        } catch {
          /* Starting. */
        }
        if (server?.exitCode !== null)
          throw Error("Test server failed: " + logs);
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      assert.ok(ready, "Production server became ready");
    }
    try {
      await startServer("");
      const cookie = async (id: string) =>
        "next-auth.session-token=" +
        (await encode({
          secret,
          token: {
            sub: id,
            spotifyUserId: id,
            name: id,
            spotifyAccessToken: "private-access-token",
            spotifyRefreshToken: "private-refresh-token",
            spotifyExpiresAt: Math.floor(Date.now() / 1000) + 3600,
          },
        }));
      const a = await cookie("test-a");
      const b = await cookie("test-b");
      const request = (
        path: string,
        method = "GET",
        auth?: string,
        body?: unknown,
        origin = base,
      ) =>
        fetch(base + path, {
          method,
          headers: {
            ...(auth ? { Cookie: auth } : {}),
            ...(method !== "GET"
              ? { Origin: origin, "Content-Type": "application/json" }
              : {}),
          },
          body: body === undefined ? undefined : JSON.stringify(body),
          redirect: "manual",
        });
      const session = await request("/api/auth/session", "GET", a).then((r) =>
        r.json(),
      );
      assert.equal(session.user.id, "test-a");
      assert.ok(!JSON.stringify(session).includes("private-access-token"));
      assert.ok(!JSON.stringify(session).includes("private-refresh-token"));
      // Missing cloud configuration returns a clear service failure, never local storage.
      assert.equal((await request("/api/library", "GET", a)).status, 503);
      assert.equal((await request("/discover")).status, 200);
      await stopServer();
      await startServer(pg.url);
      assert.equal((await request("/api/library", "GET", a)).status, 200);
      // The preceding request initializes the schema; fixtures stay in this test's Postgres.
      for (const id of ["test-a", "test-b"]) {
        await pg.db.query(
          "INSERT INTO musicmap.users VALUES ($1, $1, NULL, 0, 0)",
          [id],
        );
      }
      assert.equal((await request("/api/library")).status, 401);
      assert.equal(
        (await request("/api/library", "PUT", undefined, {})).status,
        401,
      );
      assert.equal(
        (await request("/api/library", "PUT", a, {}, "https://evil.example"))
          .status,
        403,
      );
      const artist = {
        kind: "artist",
        name: "Radiohead",
        url: "https://open.spotify.com/artist/4Z8W4fKeB5YxbusRsdQVPb",
      };
      const song = {
        kind: "track",
        name: "Creep",
        artist: "Radiohead",
        url: "https://www.last.fm/music/Radiohead/_/Creep",
      };
      assert.equal(
        (
          await request("/api/library", "PUT", a, {
            ...artist,
            url: "javascript:alert(1)",
          })
        ).status,
        400,
      );
      assert.equal(
        (await request("/api/library", "PUT", a, artist)).status,
        200,
      );
      await request("/api/library", "PUT", a, artist);
      const saved = await request("/api/library", "PUT", a, song).then((r) =>
        r.json(),
      );
      assert.equal(saved.items.length, 2);
      assert.equal(
        (await request("/api/library", "GET", b).then((r) => r.json())).items
          .length,
        0,
      );
      await request("/api/library", "DELETE", b, { key: saved.items[0].key });
      assert.equal(
        (await request("/api/library", "GET", a).then((r) => r.json())).items
          .length,
        2,
      );
      // A fresh function/server process must read the existing external database.
      await stopServer();
      await startServer(pg.url);
      assert.equal(
        (await request("/api/library", "GET", a).then((r) => r.json())).items
          .length,
        2,
      );
      await request("/api/library", "DELETE", a, { key: saved.items[0].key });
      assert.equal(
        (await request("/api/library", "GET", a).then((r) => r.json())).items
          .length,
        1,
      );
      const persisted = await pg.db.query<{ n: number }>(
        "SELECT COUNT(*)::integer AS n FROM musicmap.library WHERE user_id = 'test-a'",
      );
      assert.equal(persisted.rows[0].n, 1);
      const fallback = await request("/api/discovery?artist=Radiohead").then(
        (r) => r.json(),
      );
      assert.equal(fallback.center.name, "Radiohead");
      assert.equal(fallback.source, "curated");
      assert.equal(fallback.related.length, 6);
      assert.ok(fallback.notice);
      const excluded = fallback.related[0].name;
      const filtered = await request("/api/discovery", "POST", undefined, {
        artist: "Radiohead",
        exclude: [excluded],
      });
      assert.equal(filtered.status, 200);
      assert.equal(filtered.headers.get("cache-control"), "private, no-store");
      const filteredData = await filtered.json();
      assert.ok(
        !filteredData.related.some(
          (artist: { name: string }) => artist.name === excluded,
        ),
      );
      assert.equal(filteredData.candidates.length, 6);
      const exhausted = await request("/api/discovery", "POST", undefined, {
        artist: "Radiohead",
        exclude: fallback.related.map(
          (artist: { name: string }) => artist.name,
        ),
      }).then((r) => r.json());
      assert.deepEqual(exhausted.related, []);
      const independent = await request("/api/discovery?artist=Radiohead").then(
        (r) => r.json(),
      );
      assert.equal(
        independent.related.length,
        6,
        "One visitor's history does not pollute the shared cache",
      );
      assert.equal(
        (
          await request("/api/discovery", "POST", undefined, {
            artist: "Radiohead",
            exclude: Array(21).fill("A"),
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await request("/api/discovery", "POST", undefined, {
            artist: "Radiohead",
            exclude: ["x".repeat(70_000)],
          })
        ).status,
        413,
      );

      assert.equal(
        (await request("/api/discovery?artist=unknown-musicmap-test-name"))
          .status,
        503,
      );
      assert.equal((await request("/api/discovery")).status, 400);
      assert.equal((await request("/api/search?q=radio")).status, 200);
      assert.equal((await request("/api/search?q=x")).status, 400);
      assert.equal(
        (await request("/home")).headers.get("location"),
        "/discover",
      );
      assert.equal((await request("/discover")).status, 200);
      assert.match(await (await request("/")).text(), /Start discovering/);
    } finally {
      await stopServer();
      await pg.close();
    }
  },
);
