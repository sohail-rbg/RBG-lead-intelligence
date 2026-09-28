// Local SQLite persistence using sql.js (SQLite compiled to WASM, pure JS).
// The database is kept in memory while running and flushed to disk after writes.
const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "rbg.sqlite");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let db = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS smtp_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  port INTEGER NOT NULL,
  secure INTEGER NOT NULL DEFAULT 0,
  user TEXT NOT NULL,
  pass_encrypted TEXT NOT NULL,
  from_name TEXT DEFAULT '',
  from_email TEXT DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  company TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  group_name TEXT DEFAULT '',
  extra TEXT DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  subject TEXT DEFAULT '',
  html TEXT DEFAULT '',
  text TEXT DEFAULT '',
  signature TEXT DEFAULT '',
  variables TEXT DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  template_id INTEGER,
  smtp_profile_id INTEGER,
  status TEXT DEFAULT 'draft',
  total INTEGER DEFAULT 0,
  sent INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  opened INTEGER DEFAULT 0,
  clicked INTEGER DEFAULT 0,
  delay_min INTEGER DEFAULT 2000,
  delay_max INTEGER DEFAULT 8000,
  created_at TEXT NOT NULL,
  started_at TEXT
);
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  contact_id INTEGER,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  error TEXT DEFAULT '',
  sent_at TEXT,
  opened_at TEXT,
  clicked_at TEXT
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  campaign_id INTEGER,
  recipient_id INTEGER,
  at TEXT NOT NULL,
  meta TEXT DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_events_campaign ON events(campaign_id);
`;

async function init() {
  if (db) return db;
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, "..", "node_modules", "sql.js", "dist", file),
  });
  if (fs.existsSync(DB_FILE)) {
    const buffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  db.run(SCHEMA);
  persist();
  return db;
}

function persist() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_FILE, Buffer.from(data));
}

// Run a statement that mutates data; returns { lastID, changes } and persists afterwards.
// NOTE: sql.js resets last_insert_rowid() on export(), so read it *before* persist().
function run(sql, params = []) {
  db.run(sql, params);
  const info = get("SELECT last_insert_rowid() AS id, changes() AS changes", []);
  persist();
  return { lastID: info.id, changes: info.changes };
}

// Return all rows for a query as plain objects.
function all(sql, params = []) {
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    return rows;
  } finally {
    stmt.free();
  }
}

// Return the first row (or null).
function get(sql, params = []) {
  const rows = all(sql, params);
  return rows.length ? rows[0] : null;
}

const now = () => new Date().toISOString();

module.exports = { init, persist, run, all, get, now, DB_FILE };
