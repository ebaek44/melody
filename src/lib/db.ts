import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { SavedItem } from "@/types";

const globalDb = globalThis as typeof globalThis & {
  musicmapDb?: DatabaseSync;
};
function database() {
  if (globalDb.musicmapDb) return globalDb.musicmapDb;
  const path = resolve(process.env.MUSICMAP_DB_PATH ?? "data/musicmap.sqlite");
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT, image TEXT,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS library (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      item_key TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('artist', 'track')),
      name TEXT NOT NULL, artist TEXT NOT NULL, url TEXT NOT NULL,
      uri TEXT, pfp TEXT, created_at INTEGER NOT NULL,
      PRIMARY KEY(user_id, item_key)
    );
    CREATE INDEX IF NOT EXISTS library_user_date ON library(user_id, created_at DESC);
  `);
  globalDb.musicmapDb = db;
  return db;
}

export function upsertUser(
  id: string,
  name?: string | null,
  image?: string | null,
) {
  const now = Date.now();
  database()
    .prepare(
      `INSERT INTO users (id, name, image, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name, image=excluded.image, updated_at=excluded.updated_at`,
    )
    .run(id, name ?? null, image ?? null, now, now);
}

export function getLibrary(userId: string): SavedItem[] {
  return database()
    .prepare(
      `SELECT item_key AS key, kind, name, artist, url, uri, pfp, created_at AS createdAt
    FROM library WHERE user_id = ? ORDER BY created_at DESC LIMIT 1000`,
    )
    .all(userId) as unknown as SavedItem[];
}

export function saveItem(userId: string, item: Omit<SavedItem, "createdAt">) {
  database()
    .prepare(
      `INSERT INTO library (user_id, item_key, kind, name, artist, url, uri, pfp, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, item_key) DO NOTHING`,
    )
    .run(
      userId,
      item.key,
      item.kind,
      item.name,
      item.artist,
      item.url,
      item.uri ?? null,
      item.pfp ?? null,
      Date.now(),
    );
}

export function removeItem(userId: string, key: string) {
  database()
    .prepare("DELETE FROM library WHERE user_id = ? AND item_key = ?")
    .run(userId, key);
}
