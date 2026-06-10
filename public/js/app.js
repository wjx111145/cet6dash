/* CET-6 突击站 — 主应用逻辑 */
(function() {
  'use strict';

  var state = {
    words: [], passages: [], mode: 'en2cn',
    currentIndex: 0, totalCount: 0,
    correctStreak: 0, correctCount: 0, wrongCount: 0,
    hintLevel: 0, answered: false, testComplete: false,
  };

  var $ = function(id) { return document.getElementById(id); };

  // Cache DOM refs
  var D = {};
  var ids = ['auth-screen','main-screen','auth-username','auth-password','auth-error',
    'btn-login','btn-register','btn-logout','btn-start-test',
    'view-dashboard','view-test','view-stats',
    'test-question','test-phonetic','test-sentence','test-input','btn-submit-answer',
    'test-result','test-count','test-streak','test-progress-fill','test-mode-label',
    'btn-hint','hint-content',
    'result-overlay','result-icon','result-word','result-answer',
    'rd-pos','rd-phonetic','rd-def','rd-sentence','btn-next',
    'progress-text','streak-display',
    'wrong-list-container','wrong-word-list',
    'extra-progress','extra-correct','extra-wrong'];

  ids.forEach(function(id) { D[id] = $(id); });

  var modeCards = document.querySelectorAll('.mode-card');
  var navItems = document.querySelectorAll('.nav-item');

  // ── Helpers ──
  function show(el) { if (el) el.classList.remove('hidden'); }
  function hide(el) { if (el) el.classList.add('hidden'); }

  function switchScreen(screen) {
    hide(D['auth-screen']);
    hide(D['main-screen']);
    show(screen);
  }

  function switchView(viewId) {
    hide(D['view-dashboard']);
    hide(D['view-test']);
    hide(D['view-stats']);
    var v = document.getElementById('view-' + viewId);
    if (v) show(v);
    navItems.forEach(function(n) { n.classList.toggle('active', n.dataset.view === viewId); });
  }

  function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Auth ──
  function doLogin() {
    var u = D['auth-username'].value.trim(), p = D['auth-password'].value.trim();
    if (!u || !p) return setAuthError('用户名和密码不能为空');
    api.login(u, p).then(function(d) { api.setToken(d.token); enterApp(); }).catch(function(e) { setAuthError(e.message); });
  }
  function doRegister() {
    var u = D['auth-username'].value.trim(), p = D['auth-password'].value.trim();
    if (!u || !p) return setAuthError('用户名和密码不能为空');
    if (p.length < 3) return setAuthError('密码至少3位');
    api.register(u, p).then(function(d) { api.setToken(d.token); enterApp(); }).catch(function(e) { setAuthError(e.message); });
  }
  function setAuthError(m) { if (D['auth-error']) { D['auth-error'].textContent = m; show(D['auth-error']); } }
  function logout() {
    api.setToken(null);
    if (D['auth-error']) hide(D['auth-error']);
    switchScreen(D['auth-screen']);
    if (D['auth-username']) D['auth-username'].focus();
  }

  // ── Enter App ──
  function enterApp() {
    if (D['auth-error']) hide(D['auth-error']);
    switchScreen(D['main-screen']);
    switchView('dashboard');
    loadDashboard();
  }

  // ── Dashboard ──
  function loadDashboard() {
    api.getStats().then(function(s) {
      state.stats = s;
      renderDashboard(s);
    }).catch(function(e) {
      if (e.message.indexOf('未登录') >= 0 || e.message.indexOf('过期') >= 0) logout();
    });
  }

  function renderDashboard(s) {
    var set = function(id, val) { var el = $(id); if (el) el.textContent = val; };
    set('stat-learned', s.learned); set('stat-mastered', s.mastered);
    set('stat-today', s.todayDone); set('stat-accuracy', s.accuracy + '%');
    set('count-en2cn', (s.totalWords || s.total) + ' 词');
    set('count-cn2en', (s.totalWords || s.total) + ' 词');
    set('count-sentence', (s.sentencesCount || 0) + ' 句');
    set('count-passage', (s.passageCount || 0) + ' 段');
    set('count-mistakes', s.mistakes + ' 个');

    if (D['progress-text']) D['progress-text'].textContent = s.learned + '/' + s.total + ' · ' + s.accuracy + '%';
    if (D['streak-display']) { D['streak-display'].textContent = '🔥 ' + s.maxStreak; show(D['streak-display']); }

    if (s.wrongWords && s.wrongWords.length > 0) {
      show(D['wrong-word-list']);
      if (D['wrong-list-container']) {
        D['wrong-list-container'].innerHTML = s.wrongWords.slice(0, 10).map(function(w) {
          return '<div class="wrong-item"><span class="wrong-word">' + esc(w.word) + '</span><span class="wrong-cn">' + esc(w.definition_cn) + '</span><span class="wrong-times">错' + w.times + '次</span></div>';
        }).join('');
      }
    } else {
      hide(D['wrong-word-list']);
    }
  }

  // ── Start Test ──
  function startTest() {
    var active = document.querySelector('.mode-card.active');
    state.mode = active ? active.dataset.mode : 'en2cn';
    state.testComplete = false;
    switchView('test');
    if (D['test-result']) { D['test-result'].textContent = ''; D['test-result'].className = 'test-result-area'; }
    hide(D['result-overlay']); hide(D['hint-content']);

    if (state.mode === 'passage') {
      loadPassages();
    } else if (state.mode === 'sentence') {
      loadSentences();
    } else {
      loadWordChallenge();
    }
  }

  function loadWordChallenge() {
    api.getChallenge(60, state.mode).then(function(words) {
      if (!words || words.length === 0) {
        if (D['test-result']) { D['test-result'].textContent = '⚠️ 没有单词可测'; D['test-result'].className = 'test-result-area'; }
        return;
      }
      state.words = words; state.passages = [];
      startSession(words.length);
      setTestQuestion();
      if (D['test-input']) D['test-input'].focus();
    }).catch(function(e) {
      if (D['test-result']) { D['test-result'].textContent = '⚠️ ' + e.message; D['test-result'].className = 'test-result-area'; }
    });
  }

  function loadSentences() {
    api.get('/sentences/challenge?count=15').then(function(sentences) {
      if (!sentences || sentences.length === 0) {
        if (D['test-result']) { D['test-result'].textContent = '⚠️ 没有句子可测'; D['test-result'].className = 'test-result-area'; }
        return;
      }
      // 每个句子随机分配方向：英→中 或 中→英
      sentences.forEach(function(s) {
        s.sentenceDir = Math.random() < 0.5 ? 'en2cn' : 'cn2en';
      });
      state.words = sentences; state.passages = [];
      startSession(sentences.length);
      setTestQuestion();
      if (D['test-input']) D['test-input'].focus();
    }).catch(function(e) {
      if (D['test-result']) { D['test-result'].textContent = '⚠️ ' + e.message; D['test-result'].className = 'test-result-area'; }
    });
  }

  function loadPassages() {
    api.get('/passages/challenge?count=10').then(function(passages) {
      if (!passages || passages.length === 0) {
        if (D['test-result']) { D['test-result'].textContent = '⚠️ 没有段落可测'; D['test-result'].className = 'test-result-area'; }
        return;
      }
      passages.forEach(function(p) { p.passageDir = 'cn2en'; });
      state.passages = passages; state.words = [];
      startSession(passages.length);
      setTestQuestion();
      if (D['test-input']) D['test-input'].focus();
    }).catch(function(e) {
      if (D['test-result']) { D['test-result'].textContent = '⚠️ ' + e.message; D['test-result'].className = 'test-result-area'; }
    });
  }

  function startSession(total) {
    state.currentIndex = 0; state.totalCount = total;
    state.correctCount = 0; state.wrongCount = 0; state.correctStreak = 0;
    state.hintLevel = 0; state.answered = false;
    updateTestMeta();
  }

  function setTestQuestion() {
    var word = state.words[state.currentIndex];
    var passage = state.passages[state.currentIndex];
    var mode = state.mode;
    state.answered = false; state.hintLevel = 0;
    hide(D['hint-content']);

    // 单词模式不换行，句子/段落换行
    if (D['test-question']) {
      if (mode === 'en2cn' || mode === 'cn2en' || mode === 'mistakes') {
        D['test-question'].classList.add('nowrap');
        D['test-question'].style.fontSize = '';
      } else {
        D['test-question'].classList.remove('nowrap');
      }
    }

    // Reset UI elements
    if (D['test-phonetic']) D['test-phonetic'].style.display = '';
    if (D['test-sentence']) D['test-sentence'].style.display = '';
    if (D['btn-hint']) show(D['btn-hint']);

    if (mode === 'sentence' && word) {
      var sDir = word.sentenceDir || 'en2cn';
      if (D['test-mode-label']) D['test-mode-label'].textContent = sDir === 'en2cn' ? '📝 英→中 句子' : '📝 中→英 句子';
      if (D['test-question']) D['test-question'].textContent = sDir === 'en2cn' ? (word.sentence_en || word.word) : (word.sentence_cn || word.definition_cn);
      if (D['test-phonetic']) {
        D['test-phonetic'].textContent = sDir === 'en2cn'
          ? ('包含单词: ' + word.word)
          : ('参考单词: ' + word.word + ' (' + (word.definition_cn || '') + ')');
      }
      if (D['test-sentence']) D['test-sentence'].style.display = 'none';
      if (D['test-input']) D['test-input'].placeholder = sDir === 'en2cn' ? '翻译成中文...' : 'Translate into English...';
    } else if (mode === 'passage' && passage) {
      var pDir = passage.passageDir || 'en2cn';
      if (D['test-mode-label']) D['test-mode-label'].textContent = pDir === 'en2cn' ? '📖 英→中 段落' : '📖 中→英 段落';
      if (D['test-question']) D['test-question'].textContent = passage.title || '段落' + (state.currentIndex + 1);
      if (D['test-question']) D['test-question'].style.fontSize = '1.2rem';
      if (D['test-phonetic']) D['test-phonetic'].style.display = 'none';
      if (D['test-sentence']) {
        D['test-sentence'].style.display = 'block';
        D['test-sentence'].textContent = pDir === 'en2cn' ? passage.passage_en : passage.passage_cn;
        D['test-sentence'].style.fontStyle = 'normal';
        D['test-sentence'].style.whiteSpace = 'pre-wrap';
        D['test-sentence'].style.maxHeight = '240px';
        D['test-sentence'].style.overflowY = 'auto';
      }
      if (D['test-input']) D['test-input'].placeholder = pDir === 'en2cn' ? '翻译上面的段落...' : 'Translate the passage into English...';
      hide(D['btn-hint']);
    } else if (word) {
      // Word modes — 错词按原始方向，否则按当前模式
      if (D['test-sentence']) D['test-sentence'].style.display = '';
      if (D['test-question']) D['test-question'].style.fontSize = '';
      if (D['test-phonetic']) D['test-phonetic'].style.display = '';
      if (D['btn-hint']) show(D['btn-hint']);

      var wordMode = mode === 'mistakes' && word.mistake_mode ? word.mistake_mode : mode;
      if (wordMode === 'en2cn') {
        if (D['test-mode-label']) D['test-mode-label'].textContent = mode === 'mistakes' ? '🔁 错词 EN → 中文' : 'EN → 中文';
        if (D['test-question']) D['test-question'].textContent = word.word;
        if (D['test-phonetic']) D['test-phonetic'].textContent = word.phonetic || '';
        if (D['test-sentence']) D['test-sentence'].textContent = word.sentence_en ? '"' + word.sentence_en + '"' : '';
        if (D['test-input']) D['test-input'].placeholder = '输入中文翻译...';
      } else {
        if (D['test-mode-label']) D['test-mode-label'].textContent = mode === 'mistakes' ? '🔁 错词 中文 → EN' : '中文 → EN';
        if (D['test-question']) D['test-question'].textContent = word.definition_cn;
        if (D['test-phonetic']) D['test-phonetic'].textContent = '(打英文) ' + (word.pos || '');
        if (D['test-sentence']) D['test-sentence'].textContent = word.sentence_cn ? '"' + word.sentence_cn + '"' : '';
        if (D['test-input']) D['test-input'].placeholder = '输入英文单词...';
      }
    }

    if (D['test-input']) { D['test-input'].value = ''; D['test-input'].disabled = false; }
    if (D['btn-submit-answer']) D['btn-submit-answer'].disabled = false;
    if (D['test-result']) { D['test-result'].textContent = ''; D['test-result'].className = 'test-result-area'; }
    updateTestMeta();
    if (D['test-input']) D['test-input'].focus();
  }

  function updateTestMeta() {
    var i = state.currentIndex + 1, n = state.totalCount;
    if (D['test-count']) D['test-count'].textContent = i + '/' + n;
    if (D['test-streak']) D['test-streak'].textContent = '🔥 ' + state.correctStreak;
    if (D['test-progress-fill']) D['test-progress-fill'].style.width = (i / n * 100) + '%';
    if (D['extra-progress']) D['extra-progress'].textContent = i + '/' + n;
    if (D['extra-correct']) D['extra-correct'].textContent = state.correctCount;
    if (D['extra-wrong']) D['extra-wrong'].textContent = state.wrongCount;
  }

  // ── Submit ──
  function submitAnswer() {
    if (state.answered || state.testComplete) return;
    var word = state.words[state.currentIndex];
    var passage = state.passages[state.currentIndex];
    var answer = D['test-input'] ? D['test-input'].value.trim() : '';
    if (!answer) {
      if (D['test-result']) { D['test-result'].textContent = '请先输入答案'; D['test-result'].className = 'test-result-area'; }
      if (D['test-input']) D['test-input'].focus();
      return;
    }

    if (D['test-input']) D['test-input'].disabled = true;
    if (D['btn-submit-answer']) D['btn-submit-answer'].disabled = true;
    state.answered = true;

    if (state.mode === 'passage' && passage) {
      api.post('/passages/answer', { passage_id: passage.id, answer: answer, direction: passage.passageDir || 'en2cn' }).then(function(result) {
        var pass = result.score >= 60;
        if (pass) { state.correctCount++; state.correctStreak++; }
        else { state.wrongCount++; state.correctStreak = 0; }

        var grade = result.score >= 80 ? '优秀' : result.score >= 60 ? '良好' : result.score >= 40 ? '及格' : '需改进';
        if (D['test-result']) {
          D['test-result'].innerHTML = '<strong>' + (pass ? '✓ ' : '✗ ') + grade + '</strong> — 得分 ' + result.score + '%（关键词 ' + result.keywordsFound + '/' + result.totalKeywords + '）';
          D['test-result'].className = 'test-result-area ' + (pass ? 'correct' : result.score >= 40 ? 'partial' : 'wrong');
        }
        if (D['test-sentence']) {
          var fb = '<div style="margin-top:0.5rem;padding:0.6rem;background:#f0fdf4;border-radius:6px;font-size:0.85rem;line-height:1.6">';
          fb += '<div style="font-weight:600;margin-bottom:0.3rem">📊 评分明细</div>';
          fb += '<div>• 关键词覆盖率：' + result.keywordsFound + '/' + result.totalKeywords + '</div>';
          fb += '<div>• 长度匹配度：根据译文长短评估</div>';
          if (result.keyWords && result.keyWords.length > 0) {
            fb += '<div style="margin-top:0.3rem;font-weight:600">📝 关键词对照</div>';
            result.keyWords.forEach(function(k) {
              fb += '<div style="margin-left:0.5rem">• <strong>' + k.word + '</strong> → ' + k.definition + '</div>';
            });
          }
          fb += '<div style="margin-top:0.4rem;padding-top:0.4rem;border-top:1px solid #d1d5db">';
          fb += '💡 <strong>参考译文：</strong><br>' + result.reference;
          fb += '</div></div>';
          D['test-sentence'].innerHTML = fb;
          D['test-sentence'].style.background = '#f8fafc';
          D['test-sentence'].style.borderLeftColor = '#10b981';
        }
        updateTestMeta();
        showResultOverlay({ isCorrect: pass, word: { word: '段落 ' + (state.currentIndex + 1), definition_cn: grade + ' — ' + result.score + '%', pos: '', phonetic: '', definition_en: '', sentence_en: '' } });
      }).catch(function(e) {
        if (D['test-input']) D['test-input'].disabled = false;
        if (D['btn-submit-answer']) D['btn-submit-answer'].disabled = false;
        state.answered = false;
        if (D['test-result']) { D['test-result'].textContent = '⚠️ ' + e.message; D['test-result'].className = 'test-result-area'; }
      });
    } else if (word) {
      var answerMode = state.mode === 'sentence' && word.sentenceDir ? word.sentenceDir : state.mode === 'mistakes' && word.mistake_mode ? word.mistake_mode : state.mode;
      api.submitAnswer(word.id, answer, answerMode).then(function(result) {
        if (result.isCorrect) { state.correctCount++; state.correctStreak++; }
        else { state.wrongCount++; state.correctStreak = 0; }
        if (D['test-result']) {
          if (result.isCorrect) { D['test-result'].textContent = '✓ 正确！'; D['test-result'].className = 'test-result-area correct'; }
          else if (result.partial) { D['test-result'].textContent = '~ 接近了！正确: ' + result.correctAnswer; D['test-result'].className = 'test-result-area partial'; }
          else { D['test-result'].textContent = '✗ 错误，正确: ' + result.correctAnswer; D['test-result'].className = 'test-result-area wrong'; }
        }
        updateTestMeta();
        showResultOverlay(result);
      }).catch(function(e) {
        if (D['test-input']) D['test-input'].disabled = false;
        if (D['btn-submit-answer']) D['btn-submit-answer'].disabled = false;
        state.answered = false;
        if (D['test-result']) { D['test-result'].textContent = '⚠️ ' + e.message; D['test-result'].className = 'test-result-area'; }
      });
    }
  }

  function showResultOverlay(result) {
    var icon = D['result-icon'];
    if (icon) {
      icon.textContent = result.isCorrect ? '✓' : result.partial ? '~' : '✗';
      icon.className = 'result-icon ' + (result.isCorrect ? 'correct' : result.partial ? 'partial' : 'wrong');
    }
    if (D['result-word']) D['result-word'].textContent = result.word.word;
    if (D['result-answer']) D['result-answer'].textContent = result.word.definition_cn;
    if (D['rd-pos']) D['rd-pos'].textContent = result.word.pos || '-';
    if (D['rd-phonetic']) D['rd-phonetic'].textContent = result.word.phonetic || '-';
    if (D['rd-def']) D['rd-def'].textContent = result.word.definition_en || '-';
    if (D['rd-sentence']) D['rd-sentence'].textContent = result.word.sentence_en || '-';
    show(D['result-overlay']);
    if (D['btn-next']) D['btn-next'].focus();
  }

  function nextWord() {
    hide(D['result-overlay']);
    state.currentIndex++;
    if (state.currentIndex >= state.totalCount) {
      state.testComplete = true;
      if (D['test-result']) {
        D['test-result'].textContent = '🎉 完成！正确 ' + state.correctCount + '/' + state.totalCount;
        D['test-result'].className = 'test-result-area correct';
      }
      if (D['test-input']) D['test-input'].disabled = true;
      if (D['btn-submit-answer']) D['btn-submit-answer'].disabled = true;
      // Auto back to dashboard
      if (D['btn-next']) {
        D['btn-next'].textContent = '📊 回看板';
        var ret = function() {
          hide(D['result-overlay']);
          switchView('dashboard');
          loadDashboard();
          D['btn-next'].textContent = '下一个 ↵';
          D['btn-next'].removeEventListener('click', ret);
        };
        D['btn-next'].addEventListener('click', ret);
      }
      loadDashboard();
      return;
    }
    setTestQuestion();
  }

  // ── Hints ──
  function getHint() {
    if (state.answered || state.mode === 'passage') return;
    var word = state.words[state.currentIndex];
    if (!word) return;
    state.hintLevel++;

    var hint = '';
    var level = Math.min(state.hintLevel - 1, 4);

    if (state.mode === 'en2cn') {
      var hints = [
        '🔤 词性: ' + word.pos + (word.phonetic ? ' · 音标: ' + word.phonetic : ''),
        '📖 英文释义: ' + (word.definition_en || '无'),
        '📝 原句: ' + ((word.sentence_en || '').replace(new RegExp(word.word, 'gi'), '____') || '无例句'),
        '💡 这个词的意思是: ' + word.definition_cn.slice(0, Math.ceil(word.definition_cn.length / 2)) + '…',
        '✅ ' + word.definition_cn,
      ];
      hint = hints[level];
    } else {
      // cn2en
      var first = word.word[0];
      var len = word.word.length;
      var blanked = (word.sentence_en || '').replace(new RegExp(word.word, 'gi'), '_'.repeat(Math.min(len, 8)));
      var hints = [
        '🔤 词性: ' + word.pos + ' · 共 ' + len + ' 个字母',
        '🔤 首字母: ' + first + ' _'.repeat(len - 1),
        '📝 原句: ' + (blanked || '无例句'),
        '💡 中文提示: ' + (word.definition_cn || ''),
        '✅ ' + word.word + ' ' + (word.phonetic || ''),
      ];
      hint = hints[level];
    }

    if (D['hint-content']) {
      D['hint-content'].textContent = '💡 ' + hint;
      show(D['hint-content']);
    }
  }

  // ── Stats ──
  function loadStats() {
    api.getStats().then(function(s) {
      var set = function(id, v) { var el = $(id); if (el) el.textContent = v; };
      set('s-learned', s.learned); set('s-mastered', s.mastered); set('s-total', s.total);
      set('s-today', s.todayDone); set('s-due', s.dueReview);
      set('s-accuracy', s.accuracy + '%'); set('s-mistakes-count', s.mistakes);
      set('s-streak', s.maxStreak);
      var list = document.getElementById('s-mistakes-list');
      if (list) {
        if (s.wrongWords && s.wrongWords.length > 0) {
          list.innerHTML = s.wrongWords.map(function(w) {
            return '<li><span class="word">' + esc(w.word) + '</span> <span class="times">错' + w.times + '次</span></li>';
          }).join('');
        } else {
          list.innerHTML = '<li style="color:#94a3b8">暂无错词记录</li>';
        }
      }
    }).catch(function(e) { console.error(e); });
  }

  // ── Init ──
  function init() {
    if (api.token) {
      enterApp();
    } else {
      switchScreen(D['auth-screen']);
      if (D['auth-username']) D['auth-username'].focus();
    }

    if (D['btn-login']) D['btn-login'].addEventListener('click', doLogin);
    if (D['btn-register']) D['btn-register'].addEventListener('click', doRegister);
    if (D['btn-logout']) D['btn-logout'].addEventListener('click', logout);
    if (D['auth-password']) D['auth-password'].addEventListener('keydown', function(e) { if (e.key === 'Enter') doLogin(); });
    if (D['auth-username']) D['auth-username'].addEventListener('keydown', function(e) { if (e.key === 'Enter' && D['auth-password']) D['auth-password'].focus(); });

    navItems.forEach(function(item) {
      item.addEventListener('click', function() {
        var v = item.dataset.view;
        switchView(v);
        if (v === 'dashboard') loadDashboard();
        if (v === 'stats') loadStats();
        if (v === 'test') startTest();
      });
    });

    modeCards.forEach(function(c) {
      c.addEventListener('click', function() {
        modeCards.forEach(function(x) { x.classList.remove('active'); });
        c.classList.add('active');
      });
    });
    if (modeCards.length > 0) modeCards[0].classList.add('active');
    if (D['btn-start-test']) D['btn-start-test'].addEventListener('click', startTest);

    // Submit
    if (D['btn-submit-answer']) D['btn-submit-answer'].addEventListener('click', submitAnswer);
    if (D['test-input']) D['test-input'].addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !state.answered && !state.testComplete) {
        e.preventDefault();
        submitAnswer();
      }
    });
    if (D['btn-hint']) D['btn-hint'].addEventListener('click', getHint);

    // Next
    if (D['btn-next']) D['btn-next'].addEventListener('click', nextWord);
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && D['result-overlay'] && !D['result-overlay'].classList.contains('hidden')) {
        e.preventDefault();
        nextWord();
      }
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        var active = document.querySelector('.mode-card.active');
        if (active) {
          var idx = Array.from(modeCards).indexOf(active);
          var dir = e.key === 'ArrowRight' ? 1 : -1;
          var next = (idx + dir + modeCards.length) % modeCards.length;
          modeCards.forEach(function(c) { c.classList.remove('active'); });
          modeCards[next].classList.add('active');
        }
      }
    });
  }

  if (document.readyState !== 'loading') { init(); }
  else { document.addEventListener('DOMContentLoaded', init); }
})();
