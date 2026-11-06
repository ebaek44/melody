import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { encode } from "next-auth/jwt";
import { DatabaseSync } from "node:sqlite";

test(
  "production routes enforce authentication, ownership, CSRF and persistence",
  { timeout: 60_000 },
  async () => {
    const dir = mkdtempSync(join(tmpdir(), "musicmap-integration-"));
    const dbPath = join(dir, "test.sqlite");
    const secret = "isolated-integration-test-secret-never-use-in-production";
    const base = "http://127.0.0.1:3107";
    let logs = "";
    const server = spawn(
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
          MUSICMAP_DB_PATH: dbPath,
          SPOTIFY_CLIENT_ID: "",
          SPOTIFY_CLIENT_SECRET: "",
          LASTFM_API_KEY: "",
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    server.stdout.on("data", (data) => {
      logs += data.toString();
    });
    server.stderr.on("data", (data) => {
      logs += data.toString();
    });
    try {
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
        if (server.exitCode !== null)
          throw Error("Test server failed: " + logs);
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      assert.ok(ready, "Production server became ready");
      const db = new DatabaseSync(dbPath);
      // Authentication callback normally creates these; use isolated fixtures here.
      db.exec(
        "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT, image TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)",
      );
      for (const id of ["test-a", "test-b"])
        db.prepare("INSERT INTO users VALUES (?, ?, NULL, 0, 0)").run(id, id);
      db.close();
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
      await request("/api/library", "DELETE", a, { key: saved.items[0].key });
      assert.equal(
        (await request("/api/library", "GET", a).then((r) => r.json())).items
          .length,
        1,
      );
      const persisted = new DatabaseSync(dbPath);
      assert.equal(
        (
          persisted
            .prepare(
              "SELECT COUNT(*) AS n FROM library WHERE user_id = 'test-a'",
            )
            .get() as { n: number }
        ).n,
        1,
      );
      persisted.close();
      const fallback = await request("/api/discovery?artist=Radiohead").then(
        (r) => r.json(),
      );
      assert.equal(fallback.center.name, "Radiohead");
      assert.equal(fallback.source, "curated");
      assert.equal(fallback.related.length, 6);
      assert.ok(fallback.notice);
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
      server.kill("SIGTERM");
      await new Promise<void>((resolve) => {
        if (server.exitCode !== null) resolve();
        else server.once("exit", () => resolve());
      });
      rmSync(dir, { recursive: true, force: true });
    }
  },
);
