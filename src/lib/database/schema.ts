// Additive initial schema, isolated from other applications sharing a database.
// Run while holding the musicweb advisory transaction lock (see db.ts).
export const schemaSql = `
  CREATE SCHEMA IF NOT EXISTS musicmap;
  CREATE TABLE IF NOT EXISTS musicmap.users (
    id TEXT PRIMARY KEY,
    name TEXT,
    image TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS musicmap.library (
    user_id TEXT NOT NULL REFERENCES musicmap.users(id) ON DELETE CASCADE,
    item_key TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('artist', 'track')),
    name TEXT NOT NULL,
    artist TEXT NOT NULL,
    url TEXT NOT NULL,
    uri TEXT,
    pfp TEXT,
    created_at BIGINT NOT NULL,
    PRIMARY KEY (user_id, item_key)
  );
  CREATE INDEX IF NOT EXISTS library_user_date
    ON musicmap.library (user_id, created_at DESC, item_key);
`;
