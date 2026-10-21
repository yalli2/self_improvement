/* 마인드 리와이어 — 화면 렌더링과 상호작용 */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const D = window.Days, CH = window.CH, S = window.Store;
  const N = D.list.length;
  const app = $('#app');
  let charts = {};
  let unsub = null;
  let saveTimer = null, refreshTimer = null;
  let view = { type: 'login' };

  const LOGO = '<svg viewBox="0 0 64 64" width="30" height="30" aria-hidden="true"><rect x="2" y="2" width="60" height="60" rx="16" fill="currentColor"/><path d="M13 42 L25 27 L34 37 L51 17" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="13" cy="42" r="4.5" fill="#fff"/><circle cx="25" cy="27" r="3.5" fill="#fff" opacity=".85"/><circle cx="34" cy="37" r="3.5" fill="#fff" opacity=".85"/><circle cx="51" cy="17" r="4.5" fill="#fff"/></svg>';
  const NAME = '마인드 리와이어';
  const BOOK = 'The Science of Self-Improvement';

  function destroyCharts() { Object.values(charts).forEach(c => { try { c.destroy(); } catch (e) { } }); charts = {}; }

  /* ---------- 라우팅 ---------- */
  function route() {
    const h = location.hash || '';
    destroyCharts();
    if (unsub) { unsub(); unsub = null; }
    if (!S.room) { renderLogin(); return; }
    const m = h.match(/^#\/step\/(\d)$/);
    if (m && +m[1] >= 1 && +m[1] <= N) { renderStep(+m[1]); return; }
    if (h === '#/dash') { renderDash(); return; }
    location.hash = '#/step/1';
  }
  window.addEventListener('hashchange', route);

  /* ---------- 로그인 ---------- */
  function renderLogin() {
    const q = new URLSearchParams(location.search);
    let last = {}; try { last = JSON.parse(localStorage.getItem('rewire:last')) || {}; } catch (e) { }
    const room = q.get('room') || last.room || '';
    const minis = D.list.map(d => `<div class="mini"><span class="mini-ic">${d.icon}</span><b>STEP ${d.n} · ${esc(d.part)}</b><span>${esc(d.title)}</span></div>`).join('');
    app.innerHTML = `
    <main class="login">
      <section class="login-hero">
        <div class="brand big">${LOGO}<span>${NAME}</span></div>
        <h1>생각·감정·습관·일·관계·몸,<br>뇌를 다시 배선하는 <em>6스텝</em></h1>
        <p class="lead">${BOOK} · 믿음을 점검하고, 감정을 다루고, 습관을 바꾸고, 일과 쉼의 균형을 잡고, 관계를 가꾸고, 몸을 돌보는 실시간 워크숍.<br>내 답을 쓰면 차트가 바로 그려지고, 함께하는 사람들의 결과도 같은 화면에서 만나요.</p>
        <div class="minis">${minis}</div>
      </section>
      <section class="login-card">
        <h2>입장하기</h2>
        <form id="loginForm" autocomplete="off">
          <label>세션 코드<small>진행자가 알려 준 코드 (같은 코드를 쓴 사람끼리 결과를 공유합니다)</small>
            <input id="room" required maxlength="30" placeholder="예: hr-rewire-1" value="${esc(room)}"></label>
          <label>닉네임<small>다른 참가자에게 보이는 이름 (실명 대신 별명을 권장합니다)</small>
            <input id="nick" required maxlength="16" placeholder="예: 부연" value="${esc(last.name || '')}"></label>
          <button class="btn primary" type="submit">시작하기</button>
        </form>
        <p class="mode ${S.remote ? 'live' : 'demo'}">${S.remote ? '● 실시간 공유 모드: 같은 세션 코드의 참가자와 결과가 공유됩니다.' : '● 데모 모드: 이 브라우저에만 저장되며 샘플 참가자 8명이 함께 표시됩니다. (실시간 공유는 README의 Firebase 설정 참고)'}</p>
        <p class="privacy">개인 정보나 민감한 내용은 적지 마세요. 입력한 내용 중 <b>공유 표시가 있는 항목</b>은 같은 세션 참가자에게 보입니다.</p>
      </section>
    </main>`;
    $('#loginForm').addEventListener('submit', async e => {
      e.preventDefault();
      const btn = $('button', e.target); btn.disabled = true; btn.textContent = '입장 중…';
      await S.join($('#room').value, $('#nick').value);
      location.hash = '#/step/1';
      route();
    });
  }

  /* ---------- 공통 셸 ---------- */
  function participants() { return Object.keys(S.state.users).length; }

  function shell(active, inner) {
    const chips = D.list.map(d => {
      const p = D.completion(d.n, S.myData(d.n));
      return `<a class="chip ${active === d.n ? 'on' : ''}" href="#/step/${d.n}" title="${esc(d.title)}"><span>${d.icon} ${d.n}</span><i style="--p:${Math.round(p * 100)}%"></i></a>`;
    }).join('');
    app.innerHTML = `
    <header class="top">
      <a class="brand" href="#/step/1">${LOGO}<span>${NAME}</span></a>
      <nav class="chips">${chips}<a class="chip dash ${active === 'dash' ? 'on' : ''}" href="#/dash"><span>종합</span></a></nav>
      <div class="who"><span class="badge" title="세션 코드">#${esc(S.room)}</span><span class="badge ppl" id="ppl">👥 ${participants()}</span><span class="me">${esc(S.name)}</span><button class="btn ghost sm" id="leave">나가기</button></div>
    </header>
    ${S.remote ? '' : '<div class="banner">데모 모드 — 결과는 이 브라우저에만 저장됩니다. 샘플 참가자와 함께 표시됩니다.</div>'}
    <div class="banner err" id="err" hidden></div>
    <div id="page">${inner}</div>
    <footer class="foot">교재: <i>${BOOK}</i> — Steven Handel · 프로그램 디자인 ${NAME}</footer>`;
    $('#leave').onclick = () => { S.leave(); location.hash = ''; route(); };
  }

  function refreshChrome() {
    const p = $('#ppl'); if (p) p.textContent = '👥 ' + participants();
    const e = $('#err'); if (e) { e.hidden = !S.error; e.textContent = S.error || ''; }
    D.list.forEach((d, i) => {
      const chip = $$('.chips .chip')[i]; if (chip) { const bar = $('i', chip); if (bar) bar.style.setProperty('--p', Math.round(D.completion(d.n, S.myData(d.n)) * 100) + '%'); }
    });
  }

  /* ---------- 폼 렌더링 ---------- */
  function fieldHTML(f, data) {
    const v = data[f.id];
    const share = f.share ? '<span class="sharetag" title="이 답변은 함께 나눈 답변에 표시됩니다">공유</span>' : '';
    const head = `<div class="fl">${esc(f.label)}${share}</div>${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ''}`;
    if (f.type === 'group') return `<h3 class="grp">${esc(f.label)}</h3>`;
    if (f.type === 'area') return `<div class="field">${head}<textarea data-f="${f.id}" rows="3" placeholder="여기에 적어 보세요">${esc(v || '')}</textarea></div>`;
    if (f.type === 'text') return `<div class="field">${head}<input type="text" data-f="${f.id}" value="${esc(v || '')}" maxlength="120"></div>`;
    if (f.type === 'num') return `<div class="field">${head}<input type="number" data-f="${f.id}" value="${esc(v == null ? '' : v)}" min="${f.min}" max="${f.max}" step="1" inputmode="numeric" class="narrow"></div>`;
    if (f.type === 'range') {
      const has = v !== undefined && v !== null && v !== '';
      const val = has ? v : Math.round((f.min + f.max) / 2 / (f.step || 1)) * (f.step || 1);
      return `<div class="field">${head}<div class="rng">
        <input type="range" data-f="${f.id}" min="${f.min}" max="${f.max}" step="${f.step || 1}" value="${val}" data-touched="${has ? 1 : 0}" class="${has ? '' : 'untouched'}">
        <output>${has ? val : '–'}</output><div class="ends"><span>${esc(f.lo)}</span><span>${esc(f.hi)}</span></div></div></div>`;
    }
    if (f.type === 'choice') return `<div class="field">${head}<div class="pills" data-f="${f.id}" data-choice="1">${f.options.map(o => `<label class="pill"><input type="radio" name="${f.id}" value="${o.v}" ${v === o.v ? 'checked' : ''}><span>${esc(o.l)}</span></label>`).join('')}</div></div>`;
    if (f.type === 'multi') {
      const sel = Array.isArray(v) ? v : [];
      return `<div class="field">${head}<div class="pills" data-f="${f.id}" data-multi="1" data-max="${f.max}">${f.options.map(o => `<label class="pill"><input type="checkbox" value="${o.v}" ${sel.includes(o.v) ? 'checked' : ''}><span>${esc(o.l)}</span></label>`).join('')}</div><div class="hint mcount">최대 ${f.max}개까지 고를 수 있어요.</div></div>`;
    }
    if (f.type === 'rows') {
      const rs = (data[f.id] && data[f.id].length ? data[f.id] : []).slice();
      while (rs.length < f.min) rs.push({});
      return `<div class="field">${head}<div class="rows" data-f="${f.id}" data-rows="1" data-max="${f.max}" style="--n:${f.cols.length - 1}">
        <div class="rhead">${f.cols.map(c => `<span class="c-${c.id}">${esc(c.label)}</span>`).join('')}<span></span></div>
        ${rs.map(r => rowHTML(f, r)).join('')}
        <button type="button" class="btn ghost sm addrow">+ 행 추가</button></div></div>`;
    }
    return '';
  }
  function rowHTML(f, r) {
    return `<div class="row">${f.cols.map(c => {
      const v = r[c.id] == null ? '' : r[c.id];
      if (c.type === 'select') return `<select data-c="${c.id}" class="c-${c.id}"><option value="">선택</option>${c.options.map(o => `<option value="${o.v}" ${v === o.v ? 'selected' : ''}>${esc(o.l)}</option>`).join('')}</select>`;
      return `<input data-c="${c.id}" class="c-${c.id}" type="${c.type === 'number' ? 'number' : 'text'}" ${c.type === 'number' ? 'min="0" step="any" inputmode="decimal"' : 'maxlength="60"'} placeholder="${esc(c.ph || '')}" value="${esc(v)}">`;
    }).join('')}<button type="button" class="x" title="삭제" aria-label="행 삭제">×</button></div>`;
  }

  function collect(def, root) {
    const out = {};
    def.sections.forEach(s => s.fields.forEach(f => {
      if (f.type === 'group') return;
      const el = $(`[data-f="${f.id}"]`, root);
      if (!el) return;
      if (f.type === 'area' || f.type === 'text') { out[f.id] = el.value; }
      else if (f.type === 'num') { if (el.value !== '') out[f.id] = +el.value; }
      else if (f.type === 'range') { if (el.dataset.touched === '1') out[f.id] = +el.value; }
      else if (f.type === 'choice') { const c = $('input:checked', el); if (c) out[f.id] = c.value; }
      else if (f.type === 'multi') { out[f.id] = $$('input:checked', el).map(i => i.value); }
      else if (f.type === 'rows') {
        out[f.id] = $$('.row', el).map(r => { const o = {}; $$('[data-c]', r).forEach(i => o[i.dataset.c] = i.value); return o; })
          .filter(o => Object.values(o).some(v => String(v).trim() !== ''));
      }
    }));
    return out;
  }

  /* ---------- Step 페이지 ---------- */
  function renderStep(n) {
    view = { type: 'step', n };
    const def = D.list[n - 1];
    const data = S.myData(n) || {};
    const sections = def.sections.map(s => `
      <section class="card sec">
        <h2>${esc(s.title)}</h2>${s.desc ? `<p class="desc">${esc(s.desc)}</p>` : ''}
        ${s.fields.map(f => fieldHTML(f, data)).join('')}
      </section>`).join('');
    const prev = n > 1 ? `<a class="btn ghost" href="#/step/${n - 1}">← STEP ${n - 1}</a>` : '<span></span>';
    const next = n < N ? `<a class="btn primary" href="#/step/${n + 1}">STEP ${n + 1} →</a>` : `<a class="btn primary" href="#/dash">종합 결과 보기 →</a>`;
    shell(n, `
    <section class="hero">
      <div class="hero-in">
        <div class="eyebrow">STEP ${n} / ${N} · ${esc(def.part)}</div>
        <h1><span class="ic">${def.icon}</span> ${esc(def.title)}</h1>
        <p class="sub">${esc(def.sub)}</p>
        <ul class="concept">${def.concept.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
      </div>
    </section>
    <div class="layout">
      <div class="formcol" id="form">${sections}<div class="savebar"><span id="saved">입력하면 자동 저장됩니다</span></div><div class="pager">${prev}${next}</div></div>
      <aside class="rescol"><div class="res-head"><h2>실시간 결과</h2><span class="live"><i></i> <b id="resN">0</b>명 참여</span></div><div id="results"></div></aside>
    </div>`);
    const form = $('#form');

    form.addEventListener('input', e => {
      const t = e.target;
      if (t.type === 'range') { t.dataset.touched = '1'; t.classList.remove('untouched'); const o = t.parentElement.querySelector('output'); if (o) o.textContent = t.value; }
      queueSave(n, def, form);
    });
    form.addEventListener('change', e => {
      const t = e.target;
      if (t.type === 'checkbox') {
        const box = t.closest('[data-multi]');
        if (box) {
          const max = +box.dataset.max;
          if ($$('input:checked', box).length > max) { t.checked = false; const m = $('.mcount', box.parentElement); if (m) { m.classList.add('warn'); setTimeout(() => m.classList.remove('warn'), 1200); } return; }
        }
      }
      queueSave(n, def, form);
    });
    form.addEventListener('click', e => {
      const t = e.target;
      if (t.classList.contains('x')) { const rows = t.closest('.rows'); const row = t.closest('.row'); if ($$('.row', rows).length > 1) { row.remove(); } else { $$('[data-c]', row).forEach(i => i.value = ''); } queueSave(n, def, form); }
      if (t.classList.contains('addrow')) {
        const rows = t.closest('.rows'); const fdef = def.sections.flatMap(s => s.fields).find(f => f.id === rows.dataset.f);
        if ($$('.row', rows).length >= +rows.dataset.max) return;
        t.insertAdjacentHTML('beforebegin', rowHTML(fdef, {}));
      }
    });

    unsub = S.subscribe(() => { clearTimeout(refreshTimer); refreshTimer = setTimeout(() => { refreshChrome(); drawResults(n, false); }, 250); });
    refreshChrome();
    drawResults(n, true);
    window.scrollTo(0, 0);
  }

  function queueSave(n, def, form) {
    const s = $('#saved'); if (s) { s.textContent = '저장 중…'; s.className = ''; }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      S.save(n, collect(def, form));
      const s2 = $('#saved'); if (s2) { s2.textContent = '✓ 저장됨 · ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); s2.className = 'ok'; }
    }, 500);
  }

  function ctxFor(n) {
    const rawAll = Object.entries(S.state.days[n] || {}).map(([uid, data]) => {
      const u = S.state.users[uid] || {};
      return { uid, data, name: u.name || '참가자', isMe: uid === S.uid, sample: !!u.sample };
    }).filter(p => p.data && Object.keys(p.data).length > 1);
    const all = rawAll.sort((a, b) => (b.data._ts || 0) - (a.data._ts || 0));
    return { me: S.myData(n) || {}, all, n: all.length, avg: fn => D.avg(all.map(p => fn(p.data))) };
  }

  function drawResults(n, first) {
    const def = D.list[n - 1];
    const box = $('#results'); if (!box) return;
    const x = ctxFor(n);
    $('#resN').textContent = x.n;
    if (first) {
      box.innerHTML = def.charts.map((c, i) => `<section class="card chart"><h3>${esc(c.title)}</h3><p class="note">${esc(c.note || '')}</p>
        <div class="cwrap ${c.tall ? 'tall' : ''}"><canvas id="ch${i}"></canvas><div class="empty" id="em${i}">아직 데이터가 없어요.<br>왼쪽 실습을 입력하면 차트가 그려집니다.</div></div></section>`).join('') +
        (def.wall && def.wall.length ? `<section class="card wall"><h3>💬 함께 나눈 답변</h3><div class="wtabs">${def.wall.map((w, i) => `<button class="wtab ${i === 0 ? 'on' : ''}" data-w="${i}">${esc(w.title)}</button>`).join('')}</div><div id="wallList"></div></section>` : '');
      $$('.wtab', box).forEach(b => b.onclick = () => { $$('.wtab', box).forEach(o => o.classList.remove('on')); b.classList.add('on'); view.wall = +b.dataset.w; drawWall(n, ctxFor(n)); });
      view.wall = 0;
    }
    def.charts.forEach((c, i) => {
      const cv = $('#ch' + i), em = $('#em' + i); if (!cv) return;
      let cfg = null; try { cfg = c.build(x); } catch (e) { console.error(e); }
      const key = n + ':' + i;
      if (charts[key]) { charts[key].destroy(); delete charts[key]; }
      if (!cfg) { em.style.display = 'flex'; cv.style.display = 'none'; return; }
      em.style.display = 'none'; cv.style.display = 'block';
      cfg.options = Object.assign({ responsive: true, maintainAspectRatio: false }, cfg.options || {});
      if (!first) cfg.options.animation = false;
      charts[key] = new Chart(cv, cfg);
    });
    if (def.wall && def.wall.length) drawWall(n, x);
  }

  function drawWall(n, x) {
    const def = D.list[n - 1]; const w = def.wall[view.wall || 0]; const el = $('#wallList'); if (!el) return;
    const get = p => { if (w.fmt) { const raw = String(p.data[w.id] == null ? '' : p.data[w.id]).trim(); return raw ? w.fmt(p.data) : ''; } return String(p.data[w.id] == null ? '' : p.data[w.id]).trim(); };
    const items = x.all.map(p => ({ p, v: get(p) })).filter(i => i.v);
    el.innerHTML = items.length ? items.slice(0, 40).map(i => `<div class="note-card ${i.p.isMe ? 'mine' : ''}"><div class="by">${esc(i.p.isMe ? i.p.name + ' (나)' : i.p.name)}${i.p.sample ? ' <small>샘플</small>' : ''}</div><div class="tx">${esc(i.v)}</div></div>`).join('')
      : '<div class="empty2">아직 공유된 답변이 없어요. 첫 번째로 남겨 보세요!</div>';
  }

  /* ---------- 종합 대시보드 ---------- */
  function renderDash() {
    view = { type: 'dash' };
    shell('dash', `
    <section class="hero small"><div class="hero-in"><div class="eyebrow">REWIRE INDEX</div><h1>🧠 나의 리와이어 지수 · 함께한 ${N}스텝</h1>
      <p class="sub">교재의 “통합적 접근”처럼, 생각·감정·습관·일·관계·몸은 서로 이어져 있습니다. 여섯 개의 축으로 지금의 나를 보고, 함께하는 사람들과 나란히 비교해 보세요.</p></div></section>
    <div class="dash">
      <section class="card big"><div class="idx"><div class="idx-n" id="idxN">–</div><div class="idx-l">내 리와이어 지수<br><small>6개 지표의 평균 · 100점 만점</small></div></div>
        <div class="cwrap tall"><canvas id="dRadar"></canvas><div class="empty" id="dRadarEm">실습을 진행하면 레이더가 그려집니다.</div></div></section>
      <section class="card"><h3>지표별 점수</h3><div id="tiles"></div></section>
      <section class="card"><h3>스텝별 완성도</h3><p class="note">나 vs 참가자 평균 (%)</p><div class="cwrap"><canvas id="dProg"></canvas></div></section>
      <section class="card wide" id="myPrin"></section>
      <section class="card wide"><h3>함께하는 사람들 — 진행 현황</h3><p class="note">● 색이 진할수록 그 스텝의 실습을 많이 채웠다는 뜻입니다.</p><div id="matrix"></div></section>
      <section class="card wide tools"><h3>내 결과 가져가기</h3><div class="btnrow">
        <button class="btn primary" id="dlMd">내 답변 저장 (.md)</button>
        <button class="btn ghost" id="print">인쇄 / PDF</button>
        <button class="btn ghost danger" id="resetMine">내 입력 지우기</button>
        ${S.remote ? '' : '<button class="btn ghost" id="resetDemo">데모 초기화</button>'}</div></section>
    </div>`);
    $('#dlMd').onclick = downloadMd;
    $('#print').onclick = () => window.print();
    $('#resetMine').onclick = () => { if (confirm('내 ' + N + '스텝 입력을 모두 지울까요? 되돌릴 수 없습니다.')) { S.resetMine(); renderDash(); } };
    const rd = $('#resetDemo'); if (rd) rd.onclick = () => { if (confirm('데모 데이터를 처음 상태로 되돌릴까요? (내 입력도 지워집니다)')) { S.resetDemo(); renderDash(); } };
    unsub = S.subscribe(() => { clearTimeout(refreshTimer); refreshTimer = setTimeout(() => { refreshChrome(); drawDash(false); }, 300); });
    refreshChrome(); drawDash(true); window.scrollTo(0, 0);
  }

  const STEPS = Array.from({ length: N }, (_, i) => i + 1);
  function userDays(uid) { const o = {}; STEPS.forEach(d => o[d] = (S.state.days[d] || {})[uid] || null); return o; }

  function drawDash(first) {
    const uids = Object.keys(S.state.users);
    const mine = D.metrics(userDays(S.uid));
    const others = uids.map(u => ({ u, m: D.metrics(userDays(u)) }));
    const gavg = k => D.avg(others.map(o => o.m[k]));
    const mv = D.METRICS.map(m => mine[m.key]);
    const have = mv.filter(v => v !== null);
    $('#idxN').textContent = have.length ? Math.round(D.avg(have)) : '–';

    ['dRadar', 'dProg'].forEach(k => { if (charts[k]) { charts[k].destroy(); delete charts[k]; } });
    const rcfg = CH.radar(D.METRICS.map(m => m.label), [
      { label: '나', data: mv.map(v => v === null ? 0 : Math.round(v)), color: CH.COLORS.me },
      { label: '참가자 평균', data: D.METRICS.map(m => Math.round(gavg(m.key) || 0)), color: CH.COLORS.grp }
    ], 100);
    rcfg.options.animation = first ? undefined : false;
    $('#dRadarEm').style.display = have.length ? 'none' : 'flex';
    charts.dRadar = new Chart($('#dRadar'), rcfg);

    $('#tiles').innerHTML = D.METRICS.map(m => {
      const v = mine[m.key], g = gavg(m.key);
      return `<div class="tile" title="${esc(m.tip)}"><div class="tl"><b>${esc(m.label)}</b><span>${v === null ? '–' : Math.round(v)}<small> / 평균 ${g === null ? '–' : Math.round(g)}</small></span></div>
        <div class="bar"><i style="width:${v === null ? 0 : Math.round(v)}%"></i><u style="left:${g === null ? 0 : Math.round(g)}%"></u></div><div class="tip">${esc(m.tip)}</div></div>`;
    }).join('');

    const myP = [], avgP = [];
    STEPS.forEach(d => {
      myP.push(Math.round(D.completion(d, S.myData(d)) * 100));
      avgP.push(Math.round(D.avg(uids.map(u => D.completion(d, (S.state.days[d] || {})[u]))) * 100) || 0);
    });
    const pcfg = CH.bar(STEPS.map(d => 'S' + d), [{ label: '나', data: myP, color: CH.COLORS.me }, { label: '참가자 평균', data: avgP, color: CH.COLORS.grp }], { max: 100 });
    pcfg.options.animation = first ? undefined : false;
    charts.dProg = new Chart($('#dProg'), pcfg);

    // 내가 고른 원칙
    const d6 = S.myData(N) || {};
    const picks = Array.isArray(d6.prin) ? d6.prin : [];
    const label = v => (D.PRINCIPLES.find(o => o.v === v) || {}).l || v;
    $('#myPrin').innerHTML = `<h3>내가 붙잡을 원칙</h3>` + (picks.length
      ? `<div class="chipline">${picks.map(p => `<span class="pchip">${esc(label(p))}</span>`).join('')}</div>${D.txt(d6.declare) ? `<blockquote class="decl">“${esc(D.txt(d6.declare))}”</blockquote>` : ''}${D.txt(d6.commit) ? `<p class="note">내일 시작할 한 가지 · <b>${esc(D.txt(d6.commit))}</b></p>` : ''}`
      : '<p class="note">STEP 6의 마무리에서 원칙 3가지와 선언문을 남기면 여기에 표시됩니다.</p>');

    const rows = uids.map(u => {
      const user = S.state.users[u];
      const ps = STEPS.map(d => D.completion(d, (S.state.days[d] || {})[u]));
      return { u, name: user.name, sample: user.sample, ps, tot: D.avg(ps) };
    }).sort((a, b) => (a.u === S.uid ? -1 : b.u === S.uid ? 1 : b.tot - a.tot));
    const dot = p => `<td><span class="dot" style="--a:${p.toFixed(2)}" title="${Math.round(p * 100)}%"></span></td>`;
    $('#matrix').innerHTML = `<div class="tscroll"><table class="mx"><thead><tr><th>참가자</th>${STEPS.map(d => `<th>S${d}</th>`).join('')}<th>전체</th></tr></thead><tbody>
      ${rows.map(r => `<tr class="${r.u === S.uid ? 'me' : ''}"><td class="nm">${esc(r.name)}${r.u === S.uid ? ' (나)' : ''}${r.sample ? ' <small>샘플</small>' : ''}</td>${r.ps.map(dot).join('')}<td class="tot">${Math.round(r.tot * 100)}%</td></tr>`).join('')}
      </tbody></table></div>`;
  }

  function downloadMd() {
    let md = `# ${NAME} — ${S.name}의 ${N}스텝 기록\n\n교재: ${BOOK} · 세션: ${S.room} · ${new Date().toLocaleDateString('ko-KR')}\n\n`;
    D.list.forEach(def => {
      const data = S.myData(def.n) || {};
      md += `## STEP ${def.n}. ${def.title}\n\n`;
      def.sections.forEach(s => {
        md += `### ${s.title}\n\n`;
        s.fields.forEach(f => {
          if (f.type === 'group') { md += `**${f.label}**\n\n`; return; }
          const v = data[f.id];
          let out = '';
          if (f.type === 'rows') {
            const rs = D.rowsOf(data, f.id);
            if (rs.length) out = '\n' + rs.map(r => '  - ' + f.cols.map(c => { let x = r[c.id]; if (c.options) { const o = c.options.find(o => o.v === x); x = o ? o.l : x; } return x; }).filter(x => x !== '' && x != null).join(' · ')).join('\n');
          } else if (f.type === 'choice') { const o = f.options.find(o => o.v === v); out = o ? o.l : ''; }
          else if (f.type === 'multi') { out = (Array.isArray(v) ? v : []).map(k => (f.options.find(o => o.v === k) || {}).l || k).join(', '); }
          else if (v !== undefined && v !== null) out = String(v).trim();
          md += `- **${f.label}**: ${out || '(미작성)'}\n`;
        });
        md += '\n';
      });
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([md], { type: 'text/markdown;charset=utf-8' }));
    a.download = 'mind-rewire-' + S.name + '.md'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  S.subscribe(() => { const e = $('#err'); if (e) { e.hidden = !S.error; e.textContent = S.error || ''; } });
  route();
})();
