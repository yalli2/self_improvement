/* 데이터 저장소: Firebase Realtime Database(REST 폴링) 또는 localStorage 데모 모드 */
(function () {
  const cfg = window.REWIRE_CONFIG || {};
  const DB = (cfg.firebaseDatabaseURL || '').replace(/\/+$/, '');
  const ROOT = (cfg.root || 'mind-rewire').replace(/[^A-Za-z0-9_-]/g, '');
  const N = window.Days.list.length;
  const DAYS = Array.from({ length: N }, (_, i) => i + 1);
  const NAMES = ['하늘', '지후', '민서', '도윤', '서연', '현우', '유나', '태오'];

  const S = {
    remote: !!DB, room: null, uid: null, name: null,
    state: { users: {}, days: {} }, subs: [], timer: null, error: null
  };

  const cleanRoom = s => (s || '').trim().toLowerCase().replace(/[^a-z0-9가-힣_-]/g, '').slice(0, 30) || 'public';
  const lsKey = () => 'rewire:room:' + S.room;
  const rid = () => 'u' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const base = () => `${DB}/${ROOT}/rooms/${encodeURIComponent(S.room)}`;

  function emptyRaw() { const r = { users: {} }; DAYS.forEach(d => r['d' + d] = {}); return r; }
  function normalize(raw) {
    raw = raw || {};
    const st = { users: raw.users || {}, days: {} };
    DAYS.forEach(d => st.days[d] = raw['d' + d] || {});
    return st;
  }
  function notify() { S.subs.forEach(fn => { try { fn(S.state); } catch (e) { console.error(e); } }); }

  /* ---------- local ---------- */
  function readLocal() { try { return JSON.parse(localStorage.getItem(lsKey())) || null; } catch (e) { return null; } }
  function writeLocal(raw) { try { localStorage.setItem(lsKey(), JSON.stringify(raw)); } catch (e) { S.error = '저장 공간이 부족합니다.'; } }
  function seedLocal() {
    const raw = emptyRaw();
    NAMES.forEach((n, i) => {
      const id = 'sample' + i;
      raw.users[id] = { name: n, ts: Date.now() - (i + 1) * 60000, sample: true };
      DAYS.forEach(d => { if (d <= N - (i % 3)) raw['d' + d][id] = window.Days.sample(d, i); });
    });
    return raw;
  }
  function loadLocal() {
    let raw = readLocal();
    if (!raw) { raw = seedLocal(); writeLocal(raw); }
    S.state = normalize(raw);
  }

  /* ---------- remote ---------- */
  async function fetchRemote() {
    try {
      const r = await fetch(`${base()}.json`, { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      S.state = normalize(await r.json());
      S.error = null; notify();
    } catch (e) { S.error = '서버에 연결할 수 없습니다 (' + e.message + ')'; notify(); }
  }
  async function putRemote(path, value) {
    const r = await fetch(`${base()}/${path}.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
  }

  /* ---------- public API ---------- */
  S.join = async function (room, name) {
    S.room = cleanRoom(room);
    S.name = (name || '').trim().slice(0, 16) || '참가자';
    const key = 'rewire:uid:' + S.room;
    try { S.uid = localStorage.getItem(key); } catch (e) { }
    if (!S.uid) { S.uid = rid(); try { localStorage.setItem(key, S.uid); } catch (e) { } }
    try { localStorage.setItem('rewire:last', JSON.stringify({ room: S.room, name: S.name })); } catch (e) { }
    const me = { name: S.name, ts: Date.now() };
    if (S.remote) {
      await fetchRemote();
      try { await putRemote('users/' + S.uid, me); } catch (e) { S.error = '참가 등록 실패: ' + e.message; }
      S.state.users[S.uid] = me;
      clearInterval(S.timer);
      S.timer = setInterval(fetchRemote, Math.max(2, cfg.pollSeconds || 4) * 1000);
    } else {
      loadLocal();
      const raw = readLocal(); raw.users[S.uid] = me; writeLocal(raw);
      S.state = normalize(raw);
    }
    notify();
  };

  S.leave = function () { clearInterval(S.timer); S.room = S.uid = S.name = null; S.state = { users: {}, days: {} }; };
  S.myData = function (day) { return (S.state.days[day] || {})[S.uid] || null; };

  S.save = function (day, data) {
    const payload = Object.assign({}, data, { _ts: Date.now() });
    S.state.days[day] = S.state.days[day] || {};
    S.state.days[day][S.uid] = payload;
    if (S.remote) {
      putRemote('d' + day + '/' + S.uid, payload).catch(e => { S.error = '저장 실패: ' + e.message; notify(); });
      if (S.state.users[S.uid]) putRemote('users/' + S.uid, Object.assign({}, S.state.users[S.uid], { name: S.name, ts: Date.now() })).catch(() => { });
    } else {
      const raw = readLocal() || emptyRaw();
      raw['d' + day] = raw['d' + day] || {};
      raw['d' + day][S.uid] = payload;
      raw.users[S.uid] = raw.users[S.uid] || { name: S.name, ts: Date.now() };
      writeLocal(raw);
    }
    notify();
  };

  S.resetMine = function () {
    DAYS.forEach(d => { if (S.state.days[d]) delete S.state.days[d][S.uid]; });
    if (S.remote) DAYS.forEach(d => fetch(`${base()}/d${d}/${S.uid}.json`, { method: 'DELETE' }));
    else { const raw = readLocal(); if (raw) { DAYS.forEach(d => delete (raw['d' + d] || {})[S.uid]); writeLocal(raw); } }
    notify();
  };

  S.resetDemo = function () {
    if (!S.remote) { try { localStorage.removeItem(lsKey()); } catch (e) { } loadLocal(); const raw = readLocal(); raw.users[S.uid] = { name: S.name, ts: Date.now() }; writeLocal(raw); S.state = normalize(raw); notify(); }
  };

  S.subscribe = function (fn) { S.subs.push(fn); return () => { S.subs = S.subs.filter(f => f !== fn); }; };

  window.addEventListener('storage', e => {
    if (!S.remote && S.room && e.key === lsKey()) { const raw = readLocal(); if (raw) { S.state = normalize(raw); notify(); } }
  });

  window.Store = S;
})();
