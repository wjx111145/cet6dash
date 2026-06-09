/* CET-6 突击站 — API 客户端 */
class Api {
  constructor() {
    this.token = localStorage.getItem('token') || null;
    this.base = '/api';
  }

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }

  async request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const res = await fetch(this.base + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '请求失败');
    return data;
  }

  get(path) { return this.request('GET', path); }
  post(path, body) { return this.request('POST', path, body); }

  // Auth
  register(username, password) { return this.post('/auth/register', { username, password }); }
  login(username, password) { return this.post('/auth/login', { username, password }); }
  me() { return this.get('/auth/me'); }

  // Words
  getChallenge(count = 20, mode = 'en2cn') {
    return this.get(`/words/challenge?count=${count}&mode=${mode}`);
  }
  getWords() { return this.get('/words'); }

  submitAnswer(wordId, answer, mode) {
    return this.post('/words/answer', { word_id: wordId, answer, mode });
  }

  getHints(wordId) { return this.get(`/words/${wordId}/hints`); }

  // Stats
  getStats() { return this.get('/stats'); }
}

const api = new Api();
