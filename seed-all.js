/**
 * 一键导入所有数据（在 server.js 启动时自动调用）
 */
const { initDb, get, run } = require('./db');

// 基础 226 词
const baseWords = require('./seed-words.js').words || [];

// 额外 78 词
const extraWords = require('./seed-extra.js').words || [];

// 417 个六级难词
const hardWords = require('./seed-hard-words.js').words || [];

// 8 篇段落
const passages = require('./seed-extra.js').passages || [];

async function seedAll() {
  await initDb();
  const count = get('SELECT COUNT(*) as c FROM words');
  if (count && count.c > 0) {
    console.log('数据库已有数据，跳过导入');
    return;
  }

  // 导入所有词
  const allWords = [...(baseWords || []), ...(extraWords || []), ...(hardWords || [])];
  // baseWords 是 [{w, ph, pos, cn, en, se, sc, f, d}] 格式
  // extraWords 是 [{w, ph, pos, cn, en, se, sc, f, d}] 格式
  // hardWords 是 [word, phonetic, pos, cn] 格式（数组）

  for (const w of allWords) {
    if (Array.isArray(w)) {
      // hard word 格式
      run('INSERT INTO words (word, phonetic, pos, definition_cn, frequency, difficulty) VALUES (?,?,?,?,?,?)',
        [w[0], w[1], w[2], w[3], 3, 4]);
    } else {
      // 标准对象格式
      run(`INSERT INTO words (word, phonetic, pos, definition_cn, definition_en, frequency, difficulty, sentence_en, sentence_cn)
        VALUES (?,?,?,?,?,?,?,?,?)`,
        [w.w || '', w.ph || '', w.pos || '', w.cn || '', w.en || '', w.f || 3, w.d || 3, w.se || '', w.sc || '']);
    }
  }

  // 导入段落
  if (passages && passages.length > 0) {
    for (const p of passages) {
      run('INSERT INTO passages (title, passage_en, passage_cn, word_ids, difficulty) VALUES (?,?,?,?,?)',
        [p.title, p.passage_en, p.passage_cn, p.words, p.difficulty || 3]);
    }
  }

  const total = get('SELECT COUNT(*) as c FROM words');
  const totalP = get('SELECT COUNT(*) as c FROM passages');
  console.log(`✅ 导入完成：${total ? total.c : 0} 词，${totalP ? totalP.c : 0} 段落`);
}

module.exports = { seedAll };
