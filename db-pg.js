/**
 * PostgreSQL 数据库适配器（与 db.js 同款 API）
 * 用于 Railway 持久化存储，自动替代 SQLite
 */
const { Pool } = require('pg');

let pool = null;
let paramCounter = 1;

function convert(sql) {
  paramCounter = 1;
  return sql.replace(/\?/g, function() { return '$' + (paramCounter++); });
}

function convertDates(sql) {
  return sql
    .replace(/datetime\('now','localtime','start of day'\)/g, "DATE_TRUNC('day', NOW())")
    .replace(/datetime\('now','localtime'\)/g, "NOW()")
    .replace(/datetime\('now','\+(\d+) days'\)/g, "NOW() + INTERVAL '$1 days'")
    .replace(/datetime\('now','\+(\d+) hours'\)/g, "NOW() + INTERVAL '$1 hours'");
}

function fixSql(sql) {
  return convertDates(convert(sql));
}

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function initDb() {
  var p = getPool();
  await p.query('CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW())');
  await p.query('CREATE TABLE IF NOT EXISTS words (id SERIAL PRIMARY KEY, word TEXT NOT NULL, phonetic TEXT, pos TEXT, definition_cn TEXT NOT NULL, definition_en TEXT, frequency INTEGER DEFAULT 1, difficulty INTEGER DEFAULT 3, sentence_en TEXT, sentence_cn TEXT)');
  await p.query('CREATE TABLE IF NOT EXISTS progress (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, word_id INTEGER NOT NULL, correct_count INTEGER DEFAULT 0, wrong_count INTEGER DEFAULT 0, last_reviewed TIMESTAMP, streak INTEGER DEFAULT 0, next_review TIMESTAMP DEFAULT NOW(), UNIQUE(user_id, word_id))');
  await p.query('CREATE TABLE IF NOT EXISTS mistakes (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, word_id INTEGER NOT NULL, wrong_answer TEXT, mode TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW())');
  await p.query('CREATE TABLE IF NOT EXISTS passages (id SERIAL PRIMARY KEY, title TEXT, passage_en TEXT NOT NULL, passage_cn TEXT NOT NULL, word_ids TEXT, difficulty INTEGER DEFAULT 3)');
  await p.query('CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id)');
  await p.query('CREATE INDEX IF NOT EXISTS idx_progress_review ON progress(next_review)');
  await p.query('CREATE INDEX IF NOT EXISTS idx_mistakes_user ON mistakes(user_id)');
  console.log('✅ PostgreSQL 已就绪');
}

async function all(sql, params) {
  if (!params) params = [];
  var p = getPool();
  var res = await p.query(fixSql(sql), params);
  return res.rows;
}

async function get(sql, params) {
  if (!params) params = [];
  var p = getPool();
  var res = await p.query(fixSql(sql), params);
  return res.rows[0] || null;
}

async function run(sql, params) {
  if (!params) params = [];
  var p = getPool();
  var res = await p.query(fixSql(sql), params);
  return { changes: res.rowCount, lastInsertRowid: null };
}

async function saveDb() { /* PostgreSQL auto-saves */ }
function getDb() { return getPool(); }

module.exports = { initDb, getDb, all, get, run, saveDb };
