/**
 * SQLite access via Node's built-in `node:sqlite` module (Node 22.5+/24).
 * No native dependency to compile — the database lives in ./data/pcbuilder.db.
 *
 * The connection is opened lazily (on the first query, never at import time) so
 * that `next build`, which imports every route module up front, does not open
 * the database file from several workers at once.
 */
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'pcbuilder.db');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS builds (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_path  TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vendors (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  name    TEXT NOT NULL UNIQUE,
  website TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS parts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  build_id    INTEGER NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,
  brand       TEXT NOT NULL DEFAULT '',
  model       TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  perf_score  REAL,
  perf_label  TEXT NOT NULL DEFAULT '',
  is_selected INTEGER NOT NULL DEFAULT 0,
  quantity    INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS offers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  part_id       INTEGER NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  vendor_id     INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  url           TEXT NOT NULL DEFAULT '',
  price         REAL NOT NULL DEFAULT 0,
  delivery_days INTEGER,
  is_preferred  INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_parts_build ON parts(build_id);
CREATE INDEX IF NOT EXISTS idx_offers_part ON offers(part_id);
`;

/** Adds a column to a table if it is missing — safe to run on every startup. */
function ensureColumn(
  connection: DatabaseSync,
  table: string,
  column: string,
  definition: string,
): void {
  const columns = connection
    .prepare(`PRAGMA table_info('${table}')`)
    .all() as { name: string }[];
  if (!columns.some((entry) => entry.name === column)) {
    connection.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

/** Idempotent migrations for databases created by an earlier schema version. */
function migrate(connection: DatabaseSync): void {
  ensureColumn(connection, 'builds', 'image_path', "TEXT NOT NULL DEFAULT ''");
  ensureColumn(connection, 'parts', 'quantity', 'INTEGER NOT NULL DEFAULT 1');
}

function createConnection(): DatabaseSync {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const connection = new DatabaseSync(DB_PATH);
  connection.exec('PRAGMA journal_mode = WAL;');
  connection.exec('PRAGMA busy_timeout = 5000;');
  connection.exec('PRAGMA foreign_keys = ON;');
  connection.exec(SCHEMA);
  migrate(connection);
  return connection;
}

const globalForDb = globalThis as typeof globalThis & {
  __pcbuilderDb?: DatabaseSync;
};

function getConnection(): DatabaseSync {
  if (!globalForDb.__pcbuilderDb) {
    globalForDb.__pcbuilderDb = createConnection();
  }
  return globalForDb.__pcbuilderDb;
}

/** Lazy proxy: the SQLite file is opened on the first property access. */
export const db: DatabaseSync = new Proxy({} as DatabaseSync, {
  get(_target, prop) {
    const real = getConnection() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(real)
      : value;
  },
});
