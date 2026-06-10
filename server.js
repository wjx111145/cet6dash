const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const { initDb, getDb, all, get, run } = require('./db');
const { seedAll } = require('./seed-all');

const app = express();
const JWT_SECRET = 'cet6-dash-secret-2024';
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Auth middleware ---
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: '登录已过期' });
  }
}

function now() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}
function addDays(dateStr, days) {
  const d = new Date(dateStr.replace(' ', 'T') + 'Z');
  d.setDate(d.getDate() + days);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}
function addHours(dateStr, hours) {
  const d = new Date(dateStr.replace(' ', 'T') + 'Z');
  d.setHours(d.getHours() + hours);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

// --- Auth routes ---
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });
  const exists = get('SELECT id FROM users WHERE username = ?', [username]);
  if (exists) return res.status(400).json({ error: '用户名已存在' });
  const hash = await bcrypt.hash(password, 10);
  const result = run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash]);
  const token = jwt.sign({ id: result.lastInsertRowid, username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = get('SELECT * FROM users WHERE username = ?', [username]);
  if (!user) return res.status(400).json({ error: '用户不存在' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(400).json({ error: '密码错误' });
  const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username });
});

app.get('/api/auth/me', auth, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username });
});

// --- Word challenge ---
app.get('/api/words/challenge', auth, (req, res) => {
  const userId = req.user.id;
  const { count = 30, mode = 'en2cn' } = req.query;
  const n = parseInt(count);

  // 错词模式：直接从 mistakes 表读取（保留原始答题方向）
  if (mode === 'mistakes') {
    const mistakeWords = all(`
      SELECT w.*, mm.mistake_mode,
             COALESCE(p.correct_count,0) as correct_count,
             COALESCE(p.wrong_count,0) as wrong_count, COALESCE(p.streak,0) as streak
      FROM words w
      JOIN (
        SELECT word_id, mode as mistake_mode, MAX(created_at) as max_c
        FROM mistakes WHERE user_id = ? GROUP BY word_id
      ) mm ON w.id = mm.word_id
      LEFT JOIN progress p ON w.id = p.word_id AND p.user_id = ?
      ORDER BY mm.max_c DESC LIMIT ?`, [userId, userId, n]);
    return res.json(mistakeWords);
  }

  // Due review (skip mastered words: streak >= 3)
  const dueWords = all(`
    SELECT w.*, COALESCE(p.correct_count,0) as correct_count,
           COALESCE(p.wrong_count,0) as wrong_count, COALESCE(p.streak,0) as streak
    FROM words w
    LEFT JOIN progress p ON w.id = p.word_id AND p.user_id = ?
    WHERE p.word_id IS NOT NULL AND p.next_review <= datetime('now','localtime')
      AND (p.streak IS NULL OR p.streak < 3)
    ORDER BY p.next_review ASC LIMIT ?`, [userId, n]);

  // New words
  const newWords = all(`
    SELECT w.*, 0 as correct_count, 0 as wrong_count, 0 as streak
    FROM words w
    LEFT JOIN progress p ON w.id = p.word_id AND p.user_id = ?
    WHERE p.word_id IS NULL
    ORDER BY w.frequency DESC, RANDOM() LIMIT ?`, [userId, n]);

  // Weak words
  const weakWords = all(`
    SELECT w.*, COALESCE(p.correct_count,0) as correct_count,
           COALESCE(p.wrong_count,0) as wrong_count, COALESCE(p.streak,0) as streak
    FROM words w
    JOIN progress p ON w.id = p.word_id AND p.user_id = ?
    WHERE p.wrong_count > p.correct_count
      AND p.next_review > datetime('now','localtime')
    ORDER BY (p.wrong_count - p.correct_count) DESC, RANDOM() LIMIT ?`, [userId, n]);

  const seen = new Set();
  const combined = [...dueWords, ...newWords, ...weakWords].filter(w => {
    if (seen.has(w.id)) return false;
    seen.add(w.id);
    return true;
  }).sort(() => Math.random() - 0.5).slice(0, n);

  res.json(combined);
});

// --- Sentence challenge (use word sentences) ---
app.get('/api/sentences/challenge', auth, (req, res) => {
  const userId = req.user.id;
  const { count = 10 } = req.query;
  const n = parseInt(count);

  // Get words that have proper sentence data
  const sentences = all(`
    SELECT w.id, w.word, w.sentence_en, w.sentence_cn, w.definition_cn
    FROM words w
    WHERE w.sentence_en IS NOT NULL AND w.sentence_en != ''
    ORDER BY RANDOM() LIMIT ?`, [n]);

  res.json(sentences);
});

// --- Passage routes ---
app.get('/api/passages/challenge', auth, (req, res) => {
  const { count = 5 } = req.query;
  const n = parseInt(count);
  const passages = all('SELECT * FROM passages ORDER BY RANDOM() LIMIT ?', [n]);
  res.json(passages);
});

app.post('/api/passages/answer', auth, (req, res) => {
  const userId = req.user.id;
  const { passage_id, answer, direction } = req.body;
  const isEn2Cn = direction !== 'cn2en';

  const passage = get('SELECT * FROM passages WHERE id = ?', [passage_id]);
  if (!passage) return res.status(404).json({ error: '段落不存在' });

  const userAnswer = answer.trim();
  const reference = isEn2Cn ? passage.passage_cn : passage.passage_en;

  const wordTexts = (passage.word_ids || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean);
  var placeholders = wordTexts.map(function() { return '?'; }).join(',');
  var keyWords = wordTexts.length > 0
    ? all('SELECT id, word, definition_cn FROM words WHERE word IN (' + placeholders + ')', wordTexts)
    : [];

  var keywordsFound = 0;
  if (isEn2Cn) {
    keywordsFound = keyWords.filter(function(kw) {
      var parts = kw.definition_cn.split(/[，,、；;：:]/).map(function(s) { return s.replace(/[。！？\s]/g,'').trim(); }).filter(Boolean);
      return parts.some(function(p) { return p.length > 1 && userAnswer.includes(p.slice(0, Math.min(2, p.length))); });
    }).length;
  } else {
    keywordsFound = keyWords.filter(function(kw) {
      var w = kw.word.toLowerCase();
      return userAnswer.toLowerCase().includes(w.slice(0, Math.min(4, w.length)));
    }).length;
  }

  var keywordScore = keyWords.length > 0 ? keywordsFound / keyWords.length : 0;
  var lenRatio = Math.min(userAnswer.length, reference.length) / Math.max(userAnswer.length, reference.length, 1);
  var score = Math.round((keywordScore * 0.6 + lenRatio * 0.4) * 100);

  // Save progress
  const n = now();
  const existingP = get('SELECT * FROM progress WHERE user_id = ? AND word_id = ?', [userId, -passage_id]);
  if (existingP) {
    run(`UPDATE progress SET correct_count = correct_count + ?,
      wrong_count = wrong_count + ?, streak = ?,
      last_reviewed = ?, next_review = ?
      WHERE user_id = ? AND word_id = ?`,
      [score >= 60 ? 1 : 0, score < 60 ? 1 : 0, score >= 60 ? existingP.streak + 1 : 0, n, addDays(n, score >= 60 ? 3 : 1), userId, -passage_id]);
  } else {
    run(`INSERT INTO progress (user_id, word_id, correct_count, wrong_count, streak, last_reviewed, next_review)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, -passage_id, score >= 60 ? 1 : 0, score < 60 ? 1 : 0, score >= 60 ? 1 : 0, n, addDays(n, score >= 60 ? 3 : 1)]);
  }

  // Record mistakes
  if (isEn2Cn) {
    keyWords.filter(function(kw) {
      var parts = kw.definition_cn.split(/[，,、；;：:]/).map(function(s) { return s.replace(/[。！？\s]/g,'').trim(); }).filter(Boolean);
      return !parts.some(function(p) { return p.length > 1 && userAnswer.includes(p.slice(0, 2)); });
    }).forEach(function(kw) {
      run('INSERT INTO mistakes (user_id, word_id, wrong_answer, mode) VALUES (?, ?, ?, ?)',
        [userId, kw.id, '', 'passage']);
    });
  }

  res.json({
    score,
    reference: reference,
    keywordsFound,
    totalKeywords: keyWords.length,
    keyWords: keyWords.map(k => ({ word: k.word, definition: k.definition_cn })),
  });
});

// --- Submit answer ---
app.post('/api/words/answer', auth, (req, res) => {
  const userId = req.user.id;
  const { word_id, answer, mode } = req.body;

  const word = get('SELECT * FROM words WHERE id = ?', [word_id]);
  if (!word) return res.status(404).json({ error: '单词不存在' });

  let isCorrect = false;
  let correctAnswer = '';
  let partial = false;

  if (mode === 'sentence') {
    // 句子翻译：对比用户译文与参考译文
    correctAnswer = word.sentence_cn || word.definition_cn;
    const ref = (word.sentence_cn || '').replace(/[，。、；：！？…\s—\-"']/g, '');
    const userAns = answer.trim().replace(/[，。、；：！？…\s—\-"']/g, '');

    if (ref && userAns) {
      // 字符集重叠度（不计位置）
      const refChars = {}; for (const c of ref) refChars[c] = (refChars[c] || 0) + 1;
      const userChars = {}; for (const c of userAns) userChars[c] = (userChars[c] || 0) + 1;
      let shared = 0, total = 0;
      const allChars = new Set([...Object.keys(refChars), ...Object.keys(userChars)]);
      for (const c of allChars) {
        shared += Math.min(refChars[c] || 0, userChars[c] || 0);
        total += Math.max(refChars[c] || 0, userChars[c] || 0);
      }
      const charOverlap = total > 0 ? shared / total : 0;

      // 检查参考译文的关键片段是否出现在用户译文中
      const minSeg = Math.min(5, ref.length);
      let segMatch = false;
      for (let i = 0; i <= ref.length - minSeg && !segMatch; i++) {
        if (userAns.includes(ref.slice(i, i + minSeg))) segMatch = true;
      }

      // 长度合理性
      const lenRatio = Math.min(userAns.length, ref.length) / Math.max(userAns.length, ref.length, 1);

      isCorrect = charOverlap >= 0.5 || (segMatch && lenRatio >= 0.4);
      partial = !isCorrect && (charOverlap >= 0.3 || (segMatch && lenRatio >= 0.3) || lenRatio >= 0.7);
    } else {
      isCorrect = false; partial = false;
    }
  } else if (mode === 'en2cn') {
    correctAnswer = word.definition_cn;
    const userCn = answer.trim().replace(/[，。、；：！？\s]/g, '');
    const acceptable = word.definition_cn
      .replace(/\[.*?\]/g, '')
      .split(/[，,、；;：:]/)
      .map(s => s.replace(/[。！？\s]/g, '').trim())
      .filter(Boolean);

    isCorrect = acceptable.some(a => userCn.includes(a) || a.includes(userCn));
    partial = !isCorrect && acceptable.some(a => {
      const minLen = Math.min(a.length, userCn.length);
      if (minLen < 2) return false;
      let same = 0;
      for (let i = 0; i < minLen; i++) if (a[i] === userCn[i]) same++;
      return same / minLen >= 0.5;
    });
  } else if (mode === 'cn2en') {
    correctAnswer = word.word;
    // 句子中译英模式
    if (word.sentence_en && answer.length > 10) {
      correctAnswer = word.sentence_en || word.word;
      const ref = (word.sentence_en || '').toLowerCase().replace(/[^a-z\s]/g, '').trim();
      const userAns = answer.trim().toLowerCase().replace(/[^a-z\s]/g, '').trim();
      // 关键词检查：看目标单词是否出现 + 长度比
      const hasKeyWord = userAns.includes(word.word.toLowerCase().slice(0, 4));
      const wordMatches = (userAns.match(/\S+/g) || []).length;
      const refWords = (ref.match(/\S+/g) || []).length;
      const lenRatio = refWords > 0 ? Math.min(wordMatches, refWords) / Math.max(wordMatches, refWords, 1) : 0;
      isCorrect = hasKeyWord && lenRatio >= 0.4;
      partial = !isCorrect && (hasKeyWord || lenRatio >= 0.5);
    } else {
      // 单词中译英
      const normalizedAnswer = answer.trim().toLowerCase().replace(/[^a-z]/g, '');
      const target = word.word.toLowerCase().replace(/[^a-z]/g, '');
      isCorrect = normalizedAnswer === target;
      if (!isCorrect && answer.length > 2) {
        if (Math.abs(target.length - normalizedAnswer.length) <= 1) {
          const sameChars = [...normalizedAnswer].filter(c => target.includes(c)).length;
          partial = sameChars / target.length >= 0.7;
        }
      }
    }
  }

  // Update progress
  const progress = get('SELECT * FROM progress WHERE user_id = ? AND word_id = ?', [userId, word_id]);
  const n = now();
  if (progress) {
    if (isCorrect) {
      const nextDays = Math.min(7, Math.max(1, progress.streak + 1));
      run(`UPDATE progress SET correct_count = correct_count + 1,
        streak = streak + 1, last_reviewed = ?, next_review = ?
        WHERE user_id = ? AND word_id = ?`,
        [n, addDays(n, nextDays), userId, word_id]);
    } else {
      run(`UPDATE progress SET wrong_count = wrong_count + 1,
        streak = 0, last_reviewed = ?, next_review = ?
        WHERE user_id = ? AND word_id = ?`,
        [n, addHours(n, 1), userId, word_id]);
    }
  } else {
    const nextReview = isCorrect ? addDays(n, 1) : addHours(n, 1);
    run(`INSERT INTO progress (user_id, word_id, correct_count, wrong_count, streak, last_reviewed, next_review)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, word_id, isCorrect ? 1 : 0, isCorrect ? 0 : 1, isCorrect ? 1 : 0, n, nextReview]);
  }

  if (!isCorrect) {
    run('INSERT INTO mistakes (user_id, word_id, wrong_answer, mode) VALUES (?, ?, ?, ?)',
      [userId, word_id, answer, mode]);
  }

  res.json({
    isCorrect, partial, correctAnswer,
    word: {
      word: word.word, phonetic: word.phonetic, pos: word.pos,
      definition_cn: word.definition_cn, definition_en: word.definition_en,
      sentence_en: word.sentence_en, sentence_cn: word.sentence_cn,
    }
  });
});

// --- Hints ---
app.get('/api/words/:id/hints', auth, (req, res) => {
  const word = get('SELECT * FROM words WHERE id = ?', [req.params.id]);
  if (!word) return res.status(404).json({ error: '单词不存在' });
  res.json({
    level1: '词性: ' + word.pos,
    level2: '释义: ' + (word.definition_en || word.definition_cn.slice(0, 3) + '...'),
    level3: '例句: ' + (word.sentence_en || '').replace(new RegExp(word.word, 'gi'), '_'.repeat(word.word.length)),
    level4: '中文: ' + word.definition_cn,
  });
});

// --- Stats ---
app.get('/api/stats', auth, (req, res) => {
  const userId = req.user.id;

  const total = get('SELECT COUNT(*) as c FROM words').c;
  const sentencesCount = get(`SELECT COUNT(*) as c FROM words WHERE sentence_en IS NOT NULL AND sentence_en != ''`).c;
  const learned = get('SELECT COUNT(*) as c FROM progress WHERE user_id = ? AND correct_count > 0 AND word_id > 0', [userId]).c;
  const mastered = get('SELECT COUNT(*) as c FROM progress WHERE user_id = ? AND streak >= 3', [userId]).c;
  const dueReview = get(`SELECT COUNT(*) as c FROM progress WHERE user_id = ?
    AND next_review <= datetime('now','localtime') AND word_id > 0`, [userId]).c;
  const mistakes = get('SELECT COUNT(DISTINCT word_id) as c FROM mistakes WHERE user_id = ? AND word_id > 0', [userId]).c;
  const todayDone = get(`SELECT COUNT(*) as c FROM progress WHERE user_id = ?
    AND last_reviewed >= datetime('now','localtime','start of day')`, [userId]).c;
  const maxStreak = get('SELECT COALESCE(MAX(streak),0) as c FROM progress WHERE user_id = ?', [userId]).c;

  const agg = get(`SELECT COALESCE(SUM(correct_count),0) as total_correct,
    COALESCE(SUM(wrong_count),0) as total_wrong FROM progress WHERE user_id = ? AND word_id > 0`, [userId]);
  const accuracy = agg.total_correct + agg.total_wrong > 0
    ? Math.round(agg.total_correct / (agg.total_correct + agg.total_wrong) * 100) : 0;

  const wrongWords = all(`
    SELECT w.word, w.definition_cn, COUNT(m.id) as times
    FROM mistakes m JOIN words w ON m.word_id = w.id
    WHERE m.user_id = ?
    GROUP BY m.word_id ORDER BY times DESC LIMIT 10`, [userId]);

  const passageCount = get('SELECT COUNT(*) as c FROM passages').c;
  const totalWords = get('SELECT COUNT(*) as c FROM words').c;

  res.json({ total, totalWords, sentencesCount, learned, mastered, dueReview, mistakes, todayDone, accuracy, maxStreak, wrongWords, passageCount });
});

// --- SPA fallback ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Start ---
async function start() {
  await initDb();
  await seedAll();
  app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 CET-6 突击站已启动 → http://localhost:' + PORT);
  });
}

start().catch(err => { console.error('启动失败:', err); process.exit(1); });
