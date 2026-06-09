const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.db');
let db = null;

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');
  initSchema();
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function initSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL,
      phonetic TEXT,
      pos TEXT,
      definition_cn TEXT NOT NULL,
      definition_en TEXT,
      frequency INTEGER DEFAULT 1,
      difficulty INTEGER DEFAULT 3,
      sentence_en TEXT,
      sentence_cn TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      word_id INTEGER NOT NULL,
      correct_count INTEGER DEFAULT 0,
      wrong_count INTEGER DEFAULT 0,
      last_reviewed TEXT,
      streak INTEGER DEFAULT 0,
      next_review TEXT DEFAULT (datetime('now','localtime')),
      UNIQUE(user_id, word_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (word_id) REFERENCES words(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS mistakes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      word_id INTEGER NOT NULL,
      wrong_answer TEXT,
      mode TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (word_id) REFERENCES words(id)
    )
  `);
  db.run('CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_progress_review ON progress(next_review)');
  db.run('CREATE INDEX IF NOT EXISTS idx_mistakes_user ON mistakes(user_id)');
  db.run(`
    CREATE TABLE IF NOT EXISTS passages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      passage_en TEXT NOT NULL,
      passage_cn TEXT NOT NULL,
      word_ids TEXT,
      difficulty INTEGER DEFAULT 3
    )
  `);
  saveDb();
}

// Convenience wrappers
function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
}

function run(sql, params = []) {
  db.run(sql, params);
  const lastId = db.exec("SELECT last_insert_rowid() as id")[0]?.values?.[0]?.[0];
  const changes = db.getRowsModified();
  saveDb();
  return { changes, lastInsertRowid: lastId };
}

module.exports = { initDb, getDb, saveDb, all, get, run };
