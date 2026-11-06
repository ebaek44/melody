import "server-only";
import { Pool, type QueryResultRow } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import type { SavedItem } from "@/types";
import { databaseConfig, DatabaseConfigurationError } from "./database/config";
import { schemaSql } from "./database/schema";

type DatabaseState = {
  pool: Pool;
  connectionString: string;
  ready?: Promise<void>;
};
const globalDb = globalThis as typeof globalThis & {
  musicmapPostgres?: DatabaseState;
};

export class DatabaseUnavailableError extends Error {
  constructor() {
    super("Your collection is temporarily unavailable. Please try again.");
    this.name = "DatabaseUnavailableError";
  }
}

function database(): DatabaseState {
  const config = databaseConfig();
  const current = globalDb.musicmapPostgres;
  if (current && current.connectionString === config.connectionString)
    return current;
  if (current) void current.pool.end().catch(() => {});
  const pool = new Pool(config);
  // Never print pg error objects: they can contain connection details.
  pool.on("error", () =>
    console.error("[musicmap-db] An idle connection closed."),
  );
  if (process.env.VERCEL === "1") attachDatabasePool(pool);
  const state = { pool, connectionString: config.connectionString! };
  globalDb.musicmapPostgres = state;
  return state;
}

async function prepare(state: DatabaseState): Promise<void> {
  if (!state.ready) {
    state.ready = (async () => {
      const client = await state.pool.connect();
      try {
        await client.query("BEGIN");
        // Serialize first-use schema creation across concurrent Vercel instances.
        await client.query("SELECT pg_advisory_xact_lock(1769621350)");
        await client.query(schemaSql);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    })().catch((error) => {
      state.ready = undefined; // An unavailable database must be retryable.
      throw error;
    });
  }
  return state.ready;
}

async function query<Row extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
) {
  try {
    const state = database();
    await prepare(state);
    return await state.pool.query<Row>(text, values);
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) throw error;
    console.error("[musicmap-db] Database operation failed.");
    throw new DatabaseUnavailableError();
  }
}

/** Explicit setup/check command; the same idempotent setup also runs on first use. */
export async function initializeDatabase() {
  await query("SELECT 1");
}

/** Close this process's pool, used by CLI scripts and isolated tests. */
export async function closeDatabase() {
  const current = globalDb.musicmapPostgres;
  delete globalDb.musicmapPostgres;
  await current?.pool.end();
}

export async function upsertUser(
  id: string,
  name?: string | null,
  image?: string | null,
) {
  const now = Date.now();
  await query(
    `INSERT INTO musicmap.users (id, name, image, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $4)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name, image=excluded.image,
       updated_at=excluded.updated_at`,
    [id, name ?? null, image ?? null, now],
  );
}

type LibraryRow = Omit<SavedItem, "createdAt" | "uri" | "pfp"> & {
  createdAt: string;
  uri: string | null;
  pfp: string | null;
};
export async function getLibrary(userId: string): Promise<SavedItem[]> {
  const result = await query<LibraryRow>(
    `SELECT item_key AS key, kind, name, artist, url, uri, pfp,
       created_at AS "createdAt"
     FROM musicmap.library WHERE user_id = $1
     ORDER BY created_at DESC, item_key LIMIT 1000`,
    [userId],
  );
  return result.rows.map((row) => ({
    ...row,
    createdAt: Number(row.createdAt),
    uri: row.uri ?? undefined,
    pfp: row.pfp ?? undefined,
  }));
}

export async function saveItem(
  userId: string,
  item: Omit<SavedItem, "createdAt">,
) {
  await query(
    `INSERT INTO musicmap.library (user_id, item_key, kind, name, artist, url, uri, pfp, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT(user_id, item_key) DO NOTHING`,
    [
      userId,
      item.key,
      item.kind,
      item.name,
      item.artist,
      item.url,
      item.uri ?? null,
      item.pfp ?? null,
      Date.now(),
    ],
  );
}

export async function removeItem(userId: string, key: string) {
  await query(
    "DELETE FROM musicmap.library WHERE user_id = $1 AND item_key = $2",
    [userId, key],
  );
}
