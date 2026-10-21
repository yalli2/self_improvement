/* 마인드 리와이어 — 6스텝 커리큘럼: 실습 필드 · 실시간 차트 · 공유 월(wall) · 데모 샘플 · 종합 지표
 * 교재: The Science of Self-Improvement (Steven Handel). 문항은 교재의 개념을 바탕으로 새로 구성했습니다. */
(function () {
  const C = () => window.CH;
  const num = v => { if (v === '' || v === null || v === undefined) return null; const n = parseFloat(v); return isFinite(n) ? n : null; };
  const txt = v => (typeof v === 'string' ? v.trim() : '');
  const avg = a => { a = a.filter(x => x !== null && x !== undefined && isFinite(x)); return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null; };
  const r1 = x => x === null || x === undefined ? 0 : Math.round(x * 10) / 10;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rowsOf = (d, id) => ((d && d[id]) || []).filter(r => r && Object.values(r).some(v => String(v).trim() !== ''));
  const meColors = (all, base) => all.map(p => p.isMe ? C().COLORS.me : (base || C().COLORS.grey));
  const short = (s, n) => { s = String(s); return s.length > n ? s.slice(0, n) + '…' : s; };

  /* ---------- 폼 헬퍼 ---------- */
  const ta = (id, label, hint, extra) => Object.assign({ id, type: 'area', label, hint }, extra || {});
  const tx = (id, label, hint, extra) => Object.assign({ id, type: 'text', label, hint }, extra || {});
  const nm = (id, label, hint, extra) => Object.assign({ id, type: 'num', label, hint, min: 0, max: 999 }, extra || {});
  const rg = (id, label, o) => Object.assign({ id, type: 'range', label, min: 1, max: 5, lo: '거의 아니다', hi: '매우 그렇다' }, o || {});
  const ch = (id, label, options, extra) => Object.assign({ id, type: 'choice', label, options }, extra || {});
  const ml = (id, label, options, extra) => Object.assign({ id, type: 'multi', label, options, max: 3 }, extra || {});
  const rows = (id, label, cols, o) => Object.assign({ id, type: 'rows', label, cols, min: 4, max: 8 }, o || {});
  const grp = label => ({ type: 'group', label });
  const opts = a => a.map(([v, l]) => ({ v, l }));

  /* ---------- 차트 헬퍼 ---------- */
  const labelOf = (options, v) => (options.find(o => o.v === v) || {}).l || v;
  const cntChoice = (x, id, options) => options.map(o => x.all.filter(p => p.data[id] === o.v).length);
  const cntMulti = (x, id, options) => options.map(o => x.all.filter(p => Array.isArray(p.data[id]) && p.data[id].includes(o.v)).length);
  const doughnutOf = (id, options, colors) => x => {
    const c = cntChoice(x, id, options); if (!c.some(Boolean)) return null;
    return C().doughnut(options.map(o => o.l), c, colors || C().PALETTE);
  };
  const hbarOf = (id, options, color, multi) => x => {
    const c = (multi ? cntMulti : cntChoice)(x, id, options); if (!c.some(Boolean)) return null;
    const e = options.map((o, i) => ({ l: o.l, c: c[i] })).filter(a => a.c > 0).sort((a, b) => b.c - a.c);
    return C().bar(e.map(a => a.l), [{ label: '명', data: e.map(a => a.c), color: color || C().COLORS.teal }], { horizontal: true });
  };
  const radarOf = (labels, ids, max, mul) => x => {
    if (!x.n) return null; mul = mul || 1;
    return C().radar(labels, [
      { label: '나', data: ids.map(k => (num(x.me[k]) || 0) * mul), color: C().COLORS.me },
      { label: '참가자 평균', data: ids.map(k => r1(x.avg(d => { const v = num(d[k]); return v === null ? null : v * mul; }))), color: C().COLORS.grp }
    ], max);
  };
  const barMA = (labels, ids, max, horizontal) => x => {
    if (!x.n) return null;
    return C().bar(labels, [
      { label: '나', data: ids.map(k => num(x.me[k]) || 0), color: C().COLORS.me },
      { label: '참가자 평균', data: ids.map(k => r1(x.avg(d => num(d[k])))), color: C().COLORS.grp }
    ], { max, horizontal });
  };
  const allRows = (x, id) => x.all.flatMap(p => rowsOf(p.data, id).map(r => ({ r, p })));

  /* =====================================================================
   * STEP 1. 믿음과 현실 지도
   * ===================================================================== */
  const BIAS = [
    { k: 'blind', s: '편향 맹점', l: '나는 남들보다 편향이 적다고 생각한다' },
    { k: 'confirm', s: '확증 편향', l: '내 생각을 지지하는 정보만 눈에 잘 들어온다' },
    { k: 'framing', s: '프레이밍', l: '같은 내용도 표현에 따라 선택이 달라진다' },
    { k: 'planning', s: '계획 오류', l: '일정·비용을 늘 낙관적으로 잡는다' },
    { k: 'halo', s: '후광 효과', l: '한 가지를 잘하는 사람은 다른 것도 믿게 된다' },
    { k: 'avail', s: '가용성', l: '쉽게 떠오르는 사례를 흔한 일이라고 느낀다' },
    { k: 'band', s: '밴드왜건', l: '다들 하니까 나도 따라 한다' },
    { k: 'neg', s: '부정성', l: '좋은 일보다 나쁜 일에 훨씬 오래 머문다' },
    { k: 'opt', s: '낙관 편향', l: '나쁜 일은 남에게만 생길 것 같다' },
    { k: 'stereo', s: '고정관념', l: '집단 이미지로 사람을 미리 판단한다' },
    { k: 'status', s: '현상 유지', l: '익숙한 방식을 바꾸는 것이 싫다' },
    { k: 'bw', s: '흑백 사고', l: '모 아니면 도, 중간이 잘 보이지 않는다' }
  ];
  const SRC = opts([['auth', '권위자(부모·교사·상사)'], ['cult', '문화(미디어·종교·사회)'], ['model', '롤모델'], ['exp', '과거의 강렬한 경험'], ['know', '배움과 새로운 지식'], ['refl', '성찰과 사색'], ['conv', '대화와 토론']]);
  const REFRAME = opts([['fail', '실패는 배움'], ['ctx', '맥락 바꾸기'], ['big', '큰 그림 보기'], ['sol', '문제→해결 초점'], ['worse', '더 나쁠 수도 있었다'], ['who', '그 사람이라면?']]);

  /* =====================================================================
   * STEP 2. 감정 지능
   * ===================================================================== */
  const EMO = opts([['anger', '분노'], ['disgust', '혐오'], ['fear', '두려움'], ['joy', '기쁨'], ['sad', '슬픔'], ['surp', '놀람']]);
  const EMO_COLOR = [C().COLORS.red, C().COLORS.green, C().COLORS.violet, C().COLORS.sand, '#5B8DEF', C().COLORS.teal];
  const TRIG = opts([['thought', '생각·믿음'], ['habit', '행동·습관'], ['place', '환경·상황'], ['body', '몸·생물학적 요인'], ['rel', '사람·관계'], ['health', '수면·운동·식사'], ['media', '영화·음악·예술']]);
  const EI = [
    ['ei_self', '자기 인식', '내 감정이 무엇인지 그때그때 알아차린다'],
    ['ei_name', '감정 구분', '비슷한 감정을 구분해서 이름을 붙인다'],
    ['ei_other', '타인 인식', '다른 사람의 감정 상태를 잘 읽는다'],
    ['ei_use', '감정 활용', '감정이 주는 정보를 생각과 행동의 안내로 쓴다'],
    ['ei_exp', '건설적 표현', '감정을 해롭지 않은 방식으로 표현한다']
  ];
  const TOOLS = [
    ['trigger', '트리거 찾기', '무엇이 이 감정을 촉발했는지 찾는다'],
    ['observe', '관찰하기', '한 걸음 물러나 몸과 마음의 반응을 지켜본다'],
    ['nonjudge', '비판단 서술', '좋다·나쁘다 없이 사실만 말해 본다'],
    ['inquire', '탐구 질문', '“왜 이렇게 느끼지?”를 물어본다'],
    ['flux', '무상함 인식', '감정은 계속 변한다는 것을 떠올린다'],
    ['channel', '건설적 표현', '글·그림·음악·대화로 풀어낸다'],
    ['move', '운동', '몸을 움직여 기분을 바꾼다'],
    ['breath', '호흡 명상', '호흡에 주의를 모아 차분해진다'],
    ['avoid', '트리거 피하기', '강한 자극이 되는 상황을 피한다'],
    ['switch', '긍정 활동 전환', '웃긴 영상·좋은 책으로 흐름을 바꾼다']
  ];
  const EXPRESS = opts([['write', '글쓰기'], ['talk', '믿을 만한 사람과 대화'], ['art', '그림·음악 등 예술'], ['move', '몸 움직이기'], ['breath', '호흡·명상'], ['fun', '즐거운 활동으로 전환']]);

  /* =====================================================================
   * STEP 3. 습관 바꾸기
   * ===================================================================== */
  const CUE = opts([['loc', '장소'], ['time', '시간'], ['mood', '감정 상태'], ['thought', '생각'], ['people', '주변 사람'], ['prev', '직전 행동']]);
  const REWARD = opts([['hunger', '허기·몸의 욕구'], ['bored', '지루함 달래기'], ['social', '사람과의 연결'], ['stress', '스트레스 해소'], ['energy', '기분 전환·각성'], ['achieve', '성취·보상감']]);
  const NHAB = opts([['1', '1개'], ['2', '2개'], ['3', '3개'], ['4', '4개 이상']]);
  const SUPPORT = opts([['buddy', '함께 하는 친구·동료'], ['coach', '코치·멘토'], ['group', '모임·온라인 커뮤니티'], ['none', '아직 없음']]);
  const KEEP = opts([['yes', '계속한다'], ['mod', '조금 고쳐서 계속'], ['stop', '그만두고 다른 걸 시도']]);

  /* =====================================================================
   * STEP 4. 일과 여가
   * ===================================================================== */
  const WORKQ = [
    ['w_str', '강점 활용', '내가 잘하는 것을 일에서 쓴다'],
    ['w_flow', '몰입', '시간 가는 줄 모르고 일에 빠져드는 때가 있다'],
    ['w_grow', '성장', '일하면서 새로운 한계를 발견하고 넘어선다'],
    ['w_own', '내 의지', '남이 시켜서가 아니라 내가 원해서 한다'],
    ['w_purpose', '의미', '내 일이 누군가에게 쓸모 있다고 느낀다'],
    ['w_env', '환경', '내 일터 환경이 나를 편안하게 한다'],
    ['w_people', '동료', '함께 일하는 사람들과 관계가 좋다'],
    ['w_care', '몸 돌봄', '일하는 중에도 물·식사·휴식을 챙긴다']
  ];
  const TIMET = opts([['work', '일·업무'], ['chore', '집안일·잡무'], ['rest', '휴식·여가'], ['other', '그 외']]);
  const TIME_COLOR = [C().COLORS.me, C().COLORS.sand, C().COLORS.teal, C().COLORS.grey];
  const TIRED = opts([['am', '오전 중반'], ['noon', '점심 직전'], ['after', '점심 직후'], ['pm', '오후 중반'], ['eve', '저녁']]);
  const BREAKS = opts([['med', '명상'], ['read', '독서'], ['music', '음악 듣기'], ['people', '친구·가족과 시간'], ['walk', '산책'], ['nap', '짧은 낮잠'], ['gym', '운동'], ['movie', '영화'], ['game', '게임'], ['create', '그림·악기 등 창작']]);
  const WTYPE = opts([['mind', '머리 쓰는 일이 많다'], ['body', '몸 쓰는 일이 많다'], ['both', '반반이다']]);

  /* =====================================================================
   * STEP 5. 긍정적 관계
   * ===================================================================== */
  const RELGIVE = [
    ['r_grow', '성장 자극', '내 관계들은 내가 성장하도록 격려한다'],
    ['r_sup', '어려울 때의 지지', '힘든 때 기댈 사람이 있다'],
    ['r_collab', '협력', '서로의 재능을 합쳐 더 큰 것을 만든다'],
    ['r_joy', '즐거움', '함께 있으면 즐겁고 웃음이 난다'],
    ['r_mean', '삶의 의미', '누군가에게 좋은 영향을 준다고 느낀다']
  ];
  const COMM = [
    ['c_listen', '경청', '끝까지 듣고 상대 입장을 이해하려 한다'],
    ['c_ask', '질문', '궁금한 것을 진심으로 묻는다'],
    ['c_word', '언어 선택', '상대와 상황에 맞게 말을 고른다'],
    ['c_tone', '말투·목소리', '톤·속도·크기를 의식한다'],
    ['c_body', '몸짓·표정', '말과 표정·자세가 일치한다'],
    ['c_eye', '눈 맞춤', '대화할 때 자연스럽게 눈을 맞춘다'],
    ['c_thread', '대화 이어가기', '대화의 갈래를 찾아 자연스럽게 잇는다']
  ];
  const PRIN = [
    ['p_equal', '모두를 동등하게', '직업·지위로 사람을 위아래로 나누지 않는다'],
    ['p_str', '강점 보기', '상대의 장점을 먼저 보고 말해 준다'],
    ['p_bound', '경계 존중', '상대를 바꾸려 하지 않고 거리를 존중한다'],
    ['p_fun', '웃음과 즐거움', '함께 웃고 즐기는 시간을 만든다'],
    ['p_share', '나를 나누기', '내 이야기를 적당히 열어 보인다'],
    ['p_forgive', '용서와 내려놓기', '묵은 감정을 오래 붙들지 않는다'],
    ['p_auth', '진실함', '꾸미지 않고 솔직하게 대한다']
  ];
  const ENERGY = opts([['give', '에너지를 주는 사이'], ['mid', '보통인 사이'], ['drain', '에너지를 빼앗는 사이']]);
  const LETGO = opts([['done', '이미 내려놓았다'], ['going', '조금씩 내려놓는 중'], ['hard', '아직 어렵다'], ['na', '해당 없음']]);
  const ENERGY_COLOR = [C().COLORS.teal, C().COLORS.grey, C().COLORS.red];

  /* =====================================================================
   * STEP 6. 몸과 마음
   * ===================================================================== */
  const FOOD = [
    ['f_fish', '생선·달걀·방목육', '오메가-3 공급'],
    ['f_nuts', '견과류·씨앗', '오메가-3·단백질·섬유'],
    ['f_grain', '통곡물·콩류', '뇌의 에너지원(포도당)'],
    ['f_veg', '다양한 채소·과일', '항산화·비타민'],
    ['f_water', '충분한 물', '뇌의 70%는 수분'],
    ['f_tea', '커피·차(적당히)', '각성과 항산화'],
    ['f_junk', '가공식품·튀김·단 간식', '적을수록 좋음']
  ];
  const HEALTHPICK = opts([['water', '탄산음료 → 물'], ['walk', '매일 아침 걷기'], ['portion', '작은 그릇으로 덜 먹기'], ['mindful', '집중해서 먹기'], ['hand', '비우세 손으로 먹기'], ['buddy', '함께 운동할 친구 만들기'], ['doctor', '건강검진 예약하기']]);
  const PRINCIPLES = opts([
    ['resp', '내 삶의 책임은 나에게'], ['diff', '사람마다 통하는 방법이 다르다'], ['value', '남이 아닌 내 가치를 따른다'], ['cost', '단기 비용이 장기 이익이 된다'],
    ['now', '현재가 힘의 자리'], ['past', '과거에서 배운다'], ['hope', '미래에 대해 낙관한다'], ['grow', '완벽보다 성장'],
    ['change', '나는 계속 변하고 있다'], ['forgive', '나를 용서한다'], ['control', '통제 밖의 것을 인정한다'], ['act', '배운 것은 실행한다']
  ]);
  const EXTYPE = opts([['aero', '유산소'], ['str', '근력'], ['both', '둘 다'], ['none', '거의 안 한다']]);

  /* ---------- 데모 샘플 생성 ---------- */
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const DEF_TXT = ['작게 시작해서 꾸준히 해 보기', '한 걸음 물러나 다시 보기', '오늘 할 수 있는 한 가지부터', '함께 하는 사람과 나누기', '천천히, 그러나 멈추지 않기'];
  function autoSample(def, i) {
    const R = rng(def.n * 131 + i * 17 + 7);
    const ri = (a, b) => Math.floor(R() * (b - a + 1)) + a;
    const pick = a => a[Math.floor(R() * a.length)];
    const bias = 0.3 + 0.55 * (((i * 37) % 11) / 10);
    const d = {};
    def.sections.forEach(s => s.fields.forEach(f => {
      if (f.type === 'group') return;
      if (f.smpFn) { const v = f.smpFn({ R, ri, pick, i, d }); if (v !== undefined) d[f.id] = v; return; }
      if (f.type === 'area' || f.type === 'text') d[f.id] = '(샘플) ' + pick(f.smp || DEF_TXT);
      else if (f.type === 'num') d[f.id] = ri((f.smpR || [0, 10])[0], (f.smpR || [0, 10])[1]);
      else if (f.type === 'range') {
        const st = f.step || 1, span = f.max - f.min;
        d[f.id] = clamp(Math.round((f.min + span * (bias * 0.65 + R() * 0.35)) / st) * st, f.min, f.max);
      }
      else if (f.type === 'choice') d[f.id] = pick(f.options).v;
      else if (f.type === 'multi') {
        const pool = f.options.map(o => o.v), out = [], k = ri(1, f.max || 3);
        while (out.length < k && pool.length) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
        d[f.id] = out;
      }
      else if (f.type === 'rows') {
        const n = ri(f.min, Math.min(f.max, f.min + 2)); const rs = [];
        for (let k = 0; k < n; k++) {
          const r = {};
          f.cols.forEach(c => {
            if (c.type === 'select') r[c.id] = pick(c.options).v;
            else if (c.type === 'number') r[c.id] = ri((c.smpR || [1, 8])[0], (c.smpR || [1, 8])[1]);
            else r[c.id] = (c.smp ? c.smp[(k + i) % c.smp.length] : (c.ph || '항목'));
          });
          rs.push(r);
        }
        d[f.id] = rs;
      }
    }));
    d._ts = Date.now() - (i + 1) * 90000;
    return d;
  }

  /* ---------- 단계 정의 ---------- */
  const list = [];

  /* ===== STEP 1 ===== */
  list.push({
    n: 1, icon: '🗺️', part: '생각', title: '믿음과 현실 지도', en: 'Beliefs and Your Map of Reality',
    sub: '환경 → 감각 → 생각 → 믿음 → 행동 → 결과. 내 믿음을 꺼내 점검하고, 편향을 알아차리고, 다르게 바라보는 날',
    concept: [
      '믿음은 현실을 안내하는 “내 머릿속 지도”입니다. 지도는 영토 자체가 아니므로 늘 불완전합니다.',
      '믿음은 권위자·문화·경험·대화 등에서 만들어집니다. 출처를 알면 걸러 내고 바꿀 수 있습니다.',
      '편향을 아는 것만으로도 판단이 나아지고, 리프레임(다른 각도로 보기)은 믿음을 유연하게 만듭니다.'
    ],
    sections: [
      { title: '① 내 믿음 하나를 꺼내 점검하기', desc: '나 자신이나 일에 대해 “사실처럼 굳어진” 믿음 하나를 골라 질문을 던져 봅니다.', fields: [
        ta('belief', '지금 내가 가진 믿음 하나', '예: 나는 사람들 앞에서 말을 잘 못한다 / 나는 새로운 일에 늦다', { share: true, smp: ['나는 발표를 잘하지 못한다', '나는 실수하면 끝이라고 생각한다', '나는 바쁘지 않으면 불안하다', '나는 새로운 것에 서툴다'] }),
        ch('src', '이 믿음이 만들어진 가장 큰 출처는?', SRC),
        ta('act', '이 믿음은 내 행동과 선택을 어떻게 이끄나요?', ''),
        ta('ex', '이 믿음이 들어맞지 않았던 순간이 있나요?', '반례를 하나만 찾아도 지도가 달라집니다.'),
        rg('b_before', '지금 이 믿음이 얼마나 “사실”처럼 느껴지나요?', { min: 0, max: 100, step: 5, lo: '전혀 아님', hi: '100% 사실', smpFn: ({ ri }) => ri(12, 19) * 5 }),
        rg('b_after', '위 질문들을 거친 뒤에는 얼마나 사실처럼 느껴지나요?', { min: 0, max: 100, step: 5, lo: '전혀 아님', hi: '100% 사실', smpFn: ({ d, ri }) => Math.max(0, (d.b_before || 70) - ri(2, 7) * 5) }),
        ta('alt', '더 도움이 되는 대안 믿음 한 문장', '', { share: true, smp: ['연습하면 나아지는 기술이다', '한 번의 실수가 나를 정의하지 않는다', '쉬는 것도 일의 일부다', '모르는 것은 배우면 된다'] }),
        rg('flex', '나는 새 증거를 만나면 내 믿음을 고칠 준비가 되어 있다', { min: 1, max: 10, lo: '고집이 센 편', hi: '유연한 편' })
      ] },
      { title: '② 리프레임 — 같은 일을 다르게 보기', desc: '위의 믿음이나 최근 속상했던 일을 하나의 리프레임으로 다시 써 봅니다.', fields: [
        ch('rtype', '이번에 쓸 리프레임 유형', REFRAME),
        ta('reframe', '선택한 유형으로 다시 쓴 문장', '예(실패는 배움): 이번 발표는 망쳤지만, 무엇이 부족한지 알게 됐다.', { share: true, smp: ['이번 실수로 무엇을 보완할지 알게 됐다', '10년 뒤에는 기억도 못 할 일이다', '어떻게 하면 더 나아질까?로 질문을 바꿔 본다'] })
      ] },
      { title: '③ 편향 자가진단', desc: '12가지 사고 편향이 나에게 얼마나 자주 나타나는지 솔직하게 표시해 보세요. (1 = 거의 아니다 · 5 = 매우 자주)', fields: BIAS.map(b => rg('bias_' + b.k, `${b.s} — ${b.l}`, { lo: '거의 아니다', hi: '자주 그렇다' })) },
      { title: '④ 프레이밍 실험', desc: '직관대로 먼저 고르세요. 600명이 걸린 질병 대응 시나리오입니다.', fields: [
        ch('frame_gain', '[문제 1] A) 200명을 확실히 살린다 · B) 1/3 확률로 600명 모두 살리고, 2/3 확률로 아무도 못 살린다', opts([['A', 'A 선택'], ['B', 'B 선택']])),
        ch('frame_loss', '[문제 2] C) 400명이 확실히 사망한다 · D) 1/3 확률로 아무도 사망하지 않고, 2/3 확률로 600명 모두 사망한다', opts([['C', 'C 선택'], ['D', 'D 선택']]))
      ] },
      { title: '⑤ 오늘의 긍정 : 부정 & 성찰', desc: '오늘 떠올린 일들을 세어 보세요. 연구에서는 긍정 3 : 부정 1 정도의 비율이 건강하다고 봅니다.', fields: [
        nm('pos', '오늘 마음에 남은 긍정적인 일의 수', '', { min: 0, max: 30, smpR: [2, 9] }),
        nm('neg', '오늘 마음에 남은 부정적인 일의 수', '', { min: 0, max: 30, smpR: [0, 5] }),
        ta('reflect', '오늘의 성찰 한 줄 — 오늘 가장 값진 배움은?', '하루 15–20분의 성찰이 정보를 “변화”로 바꿔 줍니다.', { share: true, smp: ['생각을 바꾸면 반응이 달라진다', '내 걱정의 절반은 상상이었다', '작은 성공을 알아차렸다'] })
      ] }
    ],
    charts: [
      { title: '나의 편향 레이더', note: '12가지 편향 · 나 vs 참가자 평균 (5 = 매우 자주)', tall: true, build: radarOf(BIAS.map(b => b.s), BIAS.map(b => 'bias_' + b.k), 5) },
      { title: '우리가 가장 자주 겪는 편향 Top 6', note: '참가자 평균 점수 순위', build: x => {
        const e = BIAS.map(b => ({ s: b.s, v: x.avg(d => num(d['bias_' + b.k])) })).filter(a => a.v !== null).sort((a, b) => b.v - a.v).slice(0, 6);
        if (!e.length) return null;
        return C().bar(e.map(a => a.s), [{ label: '평균', data: e.map(a => r1(a.v)), color: C().COLORS.sand }], { horizontal: true, max: 5 });
      } },
      { title: '믿음의 “사실처럼 느껴지는 정도”', note: '질문 전·후 변화 (%) · 나 vs 참가자 평균', build: x => {
        if (!x.n) return null;
        return C().bar(['점검 전', '점검 후'], [
          { label: '나', data: [num(x.me.b_before) || 0, num(x.me.b_after) || 0], color: C().COLORS.me },
          { label: '참가자 평균', data: [Math.round(x.avg(d => num(d.b_before)) || 0), Math.round(x.avg(d => num(d.b_after)) || 0)], color: C().COLORS.grp }
        ], { max: 100 });
      } },
      { title: '믿음은 어디서 왔을까', note: '참가자가 꼽은 가장 큰 출처', build: doughnutOf('src', SRC) },
      { title: '선택한 리프레임 유형', note: '어떤 시선 전환이 가장 인기일까요?', build: hbarOf('rtype', REFRAME, C().COLORS.me) },
      { title: '프레이밍 효과 — 교재 실험 vs 우리', note: '확실한 쪽(A·C)을 고른 비율(%). 두 문제는 같은 내용인데 표현만 다릅니다.', build: x => {
        const g = x.all.filter(p => p.data.frame_gain), l = x.all.filter(p => p.data.frame_loss);
        if (!g.length && !l.length) return null;
        const pa = g.length ? Math.round(g.filter(p => p.data.frame_gain === 'A').length / g.length * 100) : 0;
        const pc = l.length ? Math.round(l.filter(p => p.data.frame_loss === 'C').length / l.length * 100) : 0;
        return C().bar(['이득 프레임 (A 선택)', '손실 프레임 (C 선택)'], [
          { label: '교재 속 실험', data: [72, 22], color: C().COLORS.grey },
          { label: '우리 참가자', data: [pa, pc], color: C().COLORS.me }
        ], { max: 100 });
      } },
      { title: '긍정 : 부정 비율', note: '긍정 ÷ 부정 (빨간 점선 = 3 : 1 기준) · 부정이 0이면 6으로 표시', build: x => {
        const ratio = d => { const p = num(d.pos), n = num(d.neg); if (p === null || n === null) return null; return n === 0 ? 6 : Math.min(6, p / n); };
        const mine = ratio(x.me), others = avg(x.all.map(p => ratio(p.data)));
        if (mine === null && others === null) return null;
        return C().barRef(['나', '참가자 평균'], [{ label: '긍정÷부정', data: [r1(mine), r1(others)], colors: [C().COLORS.me, C().COLORS.grp] }], 3, '3 : 1 기준선', { max: 6 });
      } }
    ],
    wall: [{ id: 'belief', title: '내가 점검한 믿음' }, { id: 'alt', title: '대안 믿음' }, { id: 'reframe', title: '리프레임 문장' }, { id: 'reflect', title: '오늘의 배움' }]
  });

  /* ===== STEP 2 ===== */
  list.push({
    n: 2, icon: '💓', part: '감정', title: '감정 지능', en: 'Emotional Intelligence',
    sub: '감정을 억누르지 않고, 알아차리고, 배우고, 건강하게 흘려보내는 기술',
    concept: [
      '감정은 주의·학습·행동·관계를 돕는 신호입니다. “부정적” 감정도 정상적이고 필요한 신호입니다.',
      '편도체(감정)와 전전두엽(사고)의 연결이 강할수록 감정 조절이 쉬워지고, 훈련으로 이 회로를 바꿀 수 있습니다.',
      '관찰 → 비판단 서술 → 탐구 → 건설적 표현. 직관은 작고 안전한 방식으로 연습하세요.'
    ],
    sections: [
      { title: '① 감정 지능 5축 자가진단', desc: '1 = 거의 아니다 · 5 = 매우 그렇다', fields: EI.map(e => rg(e[0], `${e[1]} — ${e[2]}`, {})) },
      { title: '② 오늘의 감정 기록', desc: '오늘(또는 최근 며칠) 느낀 감정을 3개 이상 기록해 보세요. 이름을 붙이는 것만으로도 거리가 생깁니다.', fields: [
        rows('emos', '감정 기록', [
          { id: 'emo', label: '감정', type: 'select', options: EMO },
          { id: 'int', label: '강도(1~10)', type: 'number', ph: '5', smpR: [2, 9] },
          { id: 'trig', label: '영향 요인', type: 'select', options: TRIG },
          { id: 'note', label: '메모', type: 'text', ph: '무슨 일이었나', smp: ['회의에서 의견이 묵살됐다', '친구가 깜짝 선물을 줬다', '마감이 겹쳤다', '오랜만에 산책을 했다', '뉴스를 보다가'] }
        ], { min: 3, max: 8 })
      ] },
      { title: '③ 한 장면을 비판단으로 살펴보기', desc: '최근 강하게 느낀 감정 하나를 골라 “좋다·나쁘다” 없이 관찰합니다.', fields: [
        tx('scene', '그 장면을 한 줄로', ''),
        tx('bodysig', '몸에서 느껴지는 신호는?', '예: 가슴이 조인다, 어깨가 굳는다'),
        ta('fact', '판단 없이 사실만 서술하기', '“화가 나서 짜증 났다” 대신 “가슴이 뜨겁고 말이 빨라졌다”처럼.', { share: true, smp: ['가슴이 뛰고 말이 빨라졌다', '어깨가 굳고 숨이 얕아졌다', '손에 땀이 나고 시선이 아래로 향했다'] }),
        ta('why', '이 감정이 나에게 알려 주려는 것은?', ''),
        rg('i_before', '관찰하기 전 감정의 강도', { min: 0, max: 10, lo: '약함', hi: '매우 강함', smpFn: ({ ri }) => ri(5, 9) }),
        rg('i_after', '1~2분 관찰한 뒤 감정의 강도', { min: 0, max: 10, lo: '약함', hi: '매우 강함', smpFn: ({ d, ri }) => Math.max(0, (d.i_before || 7) - ri(1, 4)) }),
        ch('express', '이 감정을 건설적으로 풀어낼 방법', EXPRESS),
        tx('express_plan', '구체적으로 오늘 할 한 가지', '', { share: true, smp: ['퇴근 후 10분 일기 쓰기', '믿을 만한 친구에게 전화하기', '점심 때 20분 걷기', '호흡 100번 세기'] })
      ] },
      { title: '④ 머리 vs 가슴 — 직관 연습', desc: '직관은 무의식이 계산한 “정보의 요약”일 수 있지만, 틀릴 때도 있습니다.', fields: [
        ch('decide', '중요한 결정을 할 때 나는 주로', opts([['head', '분석과 생각'], ['heart', '느낌과 직관'], ['both', '둘의 균형']])),
        rg('gut_trust', '내 직관을 얼마나 믿나요?', { min: 1, max: 10, lo: '거의 안 믿음', hi: '많이 믿음' }),
        tx('gut_exp', '이번 주 안전하고 작은 직관 실험 하나', '예: 점심 메뉴를 3초 안에 고르기, 끌리는 길로 퇴근하기', { share: true, smp: ['끌리는 책 먼저 읽기', '첫 느낌으로 메뉴 고르기', '마음 가는 길로 산책하기'] })
      ] },
      { title: '⑤ 나에게 맞는 감정 조절 도구', desc: '써 보았거나 써 보고 싶은 도구에 얼마나 끌리는지 표시하세요. (1~5)', fields: TOOLS.map(t => rg('t_' + t[0], `${t[1]} — ${t[2]}`, { lo: '끌리지 않음', hi: '꼭 써 보고 싶음' })) }
    ],
    charts: [
      { title: '감정 지능 레이더', note: '5축 자가진단 · 나 vs 참가자 평균', tall: true, build: radarOf(EI.map(e => e[1]), EI.map(e => e[0]), 5) },
      { title: '우리가 느낀 감정의 분포', note: '모든 참가자의 감정 기록 · 6가지 기본 감정', build: x => {
        const rs = allRows(x, 'emos'); if (!rs.length) return null;
        const c = EMO.map(e => rs.filter(a => a.r.emo === e.v).length);
        return C().doughnut(EMO.map(e => e.l), c, EMO_COLOR);
      } },
      { title: '감정별 평균 강도', note: '나 vs 참가자 전체 (1~10)', build: x => {
        const mine = rowsOf(x.me, 'emos'), all = allRows(x, 'emos'); if (!mine.length && !all.length) return null;
        const f = (rs, k) => r1(avg(rs.filter(r => r.emo === k).map(r => num(r.int))));
        return C().bar(EMO.map(e => e.l), [
          { label: '나', data: EMO.map(e => f(mine, e.v)), color: C().COLORS.me },
          { label: '참가자 평균', data: EMO.map(e => f(all.map(a => a.r), e.v)), color: C().COLORS.grp }
        ], { max: 10 });
      } },
      { title: '감정에 영향을 준 요인', note: '기록된 감정의 촉발 요인 횟수', build: x => {
        const rs = allRows(x, 'emos'); if (!rs.length) return null;
        const e = TRIG.map(t => ({ l: t.l, c: rs.filter(a => a.r.trig === t.v).length })).filter(a => a.c).sort((a, b) => b.c - a.c);
        return C().bar(e.map(a => a.l), [{ label: '건', data: e.map(a => a.c), color: C().COLORS.teal }], { horizontal: true });
      } },
      { title: '관찰하면 감정이 달라질까?', note: '관찰 전·후 감정 강도 (0~10) · 나 vs 참가자 평균', build: x => {
        if (!x.n) return null;
        return C().bar(['관찰 전', '관찰 후'], [
          { label: '나', data: [num(x.me.i_before) || 0, num(x.me.i_after) || 0], color: C().COLORS.me },
          { label: '참가자 평균', data: [r1(x.avg(d => num(d.i_before))), r1(x.avg(d => num(d.i_after)))], color: C().COLORS.grp }
        ], { max: 10 });
      } },
      { title: '건설적으로 풀어내는 방법', note: '참가자가 고른 표현 방식', build: doughnutOf('express', EXPRESS) },
      { title: '머리형 · 가슴형 · 균형형', note: '결정 스타일 분포', build: doughnutOf('decide', opts([['head', '분석과 생각'], ['heart', '느낌과 직관'], ['both', '둘의 균형']]), [C().COLORS.grp, C().COLORS.sand, C().COLORS.me]) },
      { title: '감정 조절 도구 선호 레이더', note: '10가지 도구 · 나 vs 참가자 평균 (5 = 꼭 써 보고 싶음)', tall: true, build: radarOf(TOOLS.map(t => t[1]), TOOLS.map(t => 't_' + t[0]), 5) }
    ],
    wall: [{ id: 'fact', title: '비판단 서술' }, { id: 'express_plan', title: '오늘 풀어내는 방법' }, { id: 'gut_exp', title: '직관 실험' }]
  });

  /* ===== STEP 3 ===== */
  list.push({
    n: 3, icon: '🔁', part: '습관', title: '습관 바꾸기', en: 'Changing Habits',
    sub: '신호 → 행동 → 보상, 습관 루프를 해부하고 한 주짜리 작은 실험으로 바꾸는 날',
    concept: [
      '습관은 “신호(cue) → 루틴 → 보상”의 반복으로 자동화됩니다. 신호와 진짜 보상을 알면 루프를 바꿀 수 있습니다.',
      '“만약 X이면 Y를 한다”는 if-then 계획이 실행 확률을 높입니다. 의지력은 한정되어 있으니 한 번에 하나만 바꿉니다.',
      '함께하는 사람·기록·영감 자료·점진적 노출·과정 시각화가 변화를 도와줍니다.'
    ],
    sections: [
      { title: '① 습관 루프 해부', desc: '바꾸고 싶은 습관 하나를 정하고, 그 안의 신호와 보상을 찾아보세요.', fields: [
        tx('habit', '바꾸고 싶은 습관 하나', '예: 퇴근 후 폰으로 SNS 두 시간 보기', { share: true, smp: ['밤마다 야식 먹기', '아침에 알람을 계속 미루기', '퇴근 후 유튜브 몰아보기', '회의 때 말 안 하고 넘어가기'] }),
        ch('cue', '이 습관을 일으키는 가장 큰 신호는?', CUE),
        tx('cue_d', '그 신호를 구체적으로', '예: 저녁 8시 소파에 앉는 순간'),
        tx('routine', '지금의 루틴(실제로 하는 행동)', ''),
        ch('reward', '이 습관으로 내 뇌가 얻으려는 보상은? (가설)', REWARD),
        tx('reward_test', '보상을 알아보려고 해 볼 다른 행동 실험', '예: 야식 대신 가족과 보드게임 → 허기인가, 연결인가?', { share: true, smp: ['야식 대신 따뜻한 차 마시기', '간식 대신 5분 통화', '폰 대신 스트레칭'] })
      ] },
      { title: '② if-then 실행 계획', desc: '“만약 [신호]가 오면, [새 행동]을 한다.”', fields: [
        tx('if_x', '만약(신호)', '예: 저녁 8시에 소파에 앉으면'),
        tx('then_y', '그러면(새 행동)', '예: 스트레칭 5분 후 책 한 장 읽는다', { share: true, smp: ['물 한 잔 마시고 산책한다', '10분 일기를 쓴다', '책을 한 장 펼친다'] })
      ] },
      { title: '③ 의지력 점검', desc: '의지력은 한정된 자원이지만 근육처럼 키울 수 있습니다.', fields: [
        rg('will', '나는 의지력이 충분하다고 믿는다', { min: 1, max: 10, lo: '부족하다고 믿음', hi: '충분하다고 믿음' }),
        ch('nhab', '지금 동시에 바꾸려고 애쓰는 습관은?', NHAB),
        tx('small', '먼저 연습할 아주 작은 습관', '예: 아침에 물 한 잔 마시기')
      ] },
      { title: '④ 사람 · 기록 · 영감', fields: [
        ch('support', '나를 지켜봐 줄 사람이나 모임이 있나요?', SUPPORT),
        tx('inspire', '힘이 나는 문장·영상·음악 하나', '', { share: true, smp: ['“나는 천 가지 안 되는 방법을 찾았을 뿐”', '아침을 여는 재즈 플레이리스트', '내가 좋아하는 강연 클립'] }),
        ta('viz', '과정 시각화 — 일어나는 순간부터 습관을 해내기까지 단계별로', '결과가 아니라 과정을 감각(소리·촉감 등)과 함께 그려 보세요.')
      ] },
      { title: '⑤ 불안 사다리 (점진적 노출)', desc: '도전하고 싶은 일을 쉬운 것부터 어려운 것까지 쪼개고, 각 단계의 불안(0~100)을 적어 보세요.', fields: [
        rows('ladder', '불안 사다리', [
          { id: 'step', label: '단계(행동)', type: 'text', ph: '예: 팀원에게 먼저 인사하기', smp: ['동료에게 먼저 인사', '회의에서 한 문장 말하기', '팀 앞에서 5분 발표', '임원에게 의견 전달'] },
          { id: 'anx', label: '불안(0~100)', type: 'number', ph: '30', smpR: [10, 90] }
        ], { min: 4, max: 8 })
      ] },
      { title: '⑥ 한 주 습관 실험 & 평가', desc: '작은 습관 하나를 일주일 해 보고 돌아봅니다.', fields: [
        tx('week', '이번 주 실험할 한 가지 습관', '예: 매일 아침 물 한 잔 · 10분 걷기', { share: true, smp: ['매일 아침 물 한 잔', '자기 전 10분 독서', '점심 후 10분 걷기'] }),
        rg('days', '일주일 중 며칠 해냈나요?', { min: 0, max: 7, lo: '0일', hi: '7일' }),
        rg('ev1', '이 변화는 해 볼 만한 가치가 있었다', {}),
        rg('ev2', '생각과 감정이 좋은 쪽으로 달라졌다', {}),
        rg('ev3', '행동이 실제로 달라졌다', {}),
        rg('ev4', '삶의 질이 조금 나아졌다', {}),
        ch('keep', '앞으로 이 변화를 계속할까요?', KEEP)
      ] }
    ],
    charts: [
      { title: '습관을 일으키는 신호', note: '6가지 신호 유형 · 참가자 분포', build: doughnutOf('cue', CUE) },
      { title: '습관이 채워 주는 보상', note: '참가자가 세운 “진짜 보상” 가설', build: hbarOf('reward', REWARD, C().COLORS.me) },
      { title: '동시에 바꾸려는 습관 수', note: '한 번에 하나가 원칙입니다. 우리는 몇 개일까요?', build: x => {
        const c = cntChoice(x, 'nhab', NHAB); if (!c.some(Boolean)) return null;
        return C().bar(NHAB.map(o => o.l), [{ label: '명', data: c, colors: [C().COLORS.green, C().COLORS.teal, C().COLORS.sand, C().COLORS.red] }], {});
      } },
      { title: '나를 지켜봐 줄 사람', note: '지원 체계 분포', build: doughnutOf('support', SUPPORT, [C().COLORS.me, C().COLORS.teal, C().COLORS.violet, C().COLORS.grey]) },
      { title: '나의 불안 사다리', note: '낮은 단계부터 오르기 · 초록(낮음) · 노랑(중간) · 빨강(높음)', tall: true, build: x => {
        const rs = rowsOf(x.me, 'ladder').map(r => ({ s: txt(r.step) || '(단계)', a: num(r.anx) })).filter(r => r.a !== null).sort((a, b) => a.a - b.a);
        if (!rs.length) return null;
        return C().bar(rs.map(r => short(r.s, 16)), [{ label: '불안', data: rs.map(r => r.a), colors: rs.map(r => r.a < 34 ? C().COLORS.green : r.a < 67 ? C().COLORS.sand : C().COLORS.red) }], { horizontal: true, max: 100 });
      } },
      { title: '일주일 중 해낸 날', note: '참가자별 달성일 · 내 막대는 파란색', build: x => {
        const rs = x.all.map(p => ({ p, v: num(p.data.days) })).filter(r => r.v !== null);
        if (!rs.length) return null;
        return C().bar(rs.map(r => r.p.name), [{ label: '일', data: rs.map(r => r.v), colors: meColors(rs.map(r => r.p)) }], { horizontal: true, max: 7 });
      } },
      { title: '한 주 실험 평가', note: '4가지 평가 · 나 vs 참가자 평균 (5점)', build: radarOf(['가치 있었다', '생각·감정 변화', '행동 변화', '삶의 질'], ['ev1', 'ev2', 'ev3', 'ev4'], 5) },
      { title: '이 습관, 계속할까?', note: '참가자 결정', build: doughnutOf('keep', KEEP, [C().COLORS.me, C().COLORS.sand, C().COLORS.grey]) }
    ],
    wall: [
      { id: 'then_y', title: 'if-then 계획', fmt: d => (txt(d.if_x) || '…') + ' → ' + (txt(d.then_y) || '…') },
      { id: 'reward_test', title: '보상 실험' }, { id: 'inspire', title: '힘이 나는 한 가지' }, { id: 'week', title: '이번 주 습관 실험' }
    ]
  });

  /* ===== STEP 4 ===== */
  list.push({
    n: 4, icon: '⚖️', part: '일과 쉼', title: '일과 여가', en: 'Work and Leisure',
    sub: '일을 더 의미 있고 즐겁게 만들고, 일과 쉼의 균형을 설계하는 날',
    concept: [
      '강점·몰입·호기심·내적 동기가 느껴지는 활동이 내가 즐길 수 있는 일의 힌트입니다.',
      '일터에서도 좋은 점 보기·목적 찾기·성과 인정·환경 꾸미기·놀이 더하기·관계 풀기로 통제감을 키울 수 있습니다.',
      '쉼은 게으름이 아니라 생산성의 일부입니다. 내 일과 반대되는 방식의 휴식이 회복에 더 도움이 됩니다.'
    ],
    sections: [
      { title: '① 일 만족 8축 진단', desc: '지금 하고 있는 일(직무·학업·가사 포함)을 떠올리며 답하세요. (1~5)', fields: WORKQ.map(q => rg(q[0], `${q[1]} — ${q[2]}`, {})) },
      { title: '② 내 일을 더 좋게 만드는 6가지', fields: [
        ta('like', '내 일에서 좋아하는 점 (처음 이 일에 끌렸던 이유·좋아하는 시간대·사람)', '', { share: true, smp: ['동료와 점심 먹는 시간', '결과물이 눈에 보일 때의 뿌듯함', '배울 거리가 계속 생긴다는 점'] }),
        ta('purpose', '내 일이 사회에서 하는 역할은?', '“큰 그림”에서 내 일이 어디에 쓰이는지 적어 보세요.'),
        ta('ach', '지금까지 일에서 자랑스러웠던 성과 1~3가지', ''),
        tx('env', '책상·일터 환경에서 이번 주 바꿀 한 가지', '예: 화분 놓기, 책상 정리, 조명 바꾸기', { share: true, smp: ['책상 위에 작은 화분 두기', '자리 배치 바꾸기', '좋아하는 사진 한 장 붙이기'] }),
        tx('play', '지루한 일에 놀이 요소를 더하는 아이디어', '예: 타이머 대결, 음악, 보상 정하기', { share: true, smp: ['25분 타이머 대결', '일 끝나면 좋아하는 차 한 잔', '동료와 함께 미션처럼 해 보기'] }),
        ch('cowork', '불편한 동료·상사와의 긴장을 풀기 위해 해 볼 것', opts([['joke', '유머로 받아넘기기'], ['buddy', '마음 맞는 동료와 더 가까워지기'], ['mend', '먼저 사과하고 다시 시작'], ['biz', '업무적으로만 대하기'], ['mgr', '관리자와 상의하기'], ['none', '지금은 해당 없음']]))
      ] },
      { title: '③ 나의 일주일 시간 지도', desc: '최근 일주일의 주요 활동을 시간 단위로 적어 보세요. 일·집안일·휴식·그 외로 구분합니다.', fields: [
        rows('acts', '주간 활동', [
          { id: 'name', label: '활동', type: 'text', ph: '예: 업무', smp: ['업무', '출퇴근', '집안일', '운동', '친구 만남', '독서', '유튜브'] },
          { id: 'hours', label: '시간/주', type: 'number', ph: '10', smpR: [2, 40] },
          { id: 'type', label: '구분', type: 'select', options: TIMET }
        ], { min: 5, max: 10, smpFn: ({ R, ri, i }) => {
          const base = [['업무', 'work', ri(30, 48)], ['집안일', 'chore', ri(4, 14)], ['휴식·취미', 'rest', ri(4, 20)], ['운동', 'rest', ri(1, 5)], ['출퇴근·이동', 'other', ri(3, 8)], ['SNS·영상', 'rest', ri(2, 10)]];
          return base.map(b => ({ name: b[0], hours: b[2], type: b[1] }));
        } })
      ] },
      { title: '④ 나만의 휴식 처방', fields: [
        ch('wtype', '내 일은 주로', WTYPE),
        ch('tired', '나는 주로 언제 지치거나 집중이 흐트러지나요?', TIRED),
        ml('breaks', '나에게 잘 맞는 휴식 3가지를 고르세요', BREAKS),
        tx('flowact', '시간 가는 줄 모르고 몰입하는 활동', '', { share: true, smp: ['글쓰기', '요리', '러닝', '그림 그리기', '코딩'] }),
        rg('wlb', '지금 일과 쉼의 균형에 얼마나 만족하나요?', { min: 1, max: 10, lo: '불만족', hi: '매우 만족' })
      ] }
    ],
    charts: [
      { title: '일 만족 레이더', note: '8축 · 나 vs 참가자 평균 (5점)', tall: true, build: radarOf(WORKQ.map(q => q[1]), WORKQ.map(q => q[0]), 5) },
      { title: '나의 일주일 시간 배분', note: '일·집안일·휴식·그 외 (시간)', build: x => {
        const rs = rowsOf(x.me, 'acts'); if (!rs.length) return null;
        const c = TIMET.map(t => rs.filter(r => r.type === t.v).reduce((s, r) => s + (num(r.hours) || 0), 0));
        if (!c.some(Boolean)) return null;
        return C().doughnut(TIMET.map(t => t.l), c, TIME_COLOR);
      } },
      { title: '휴식·여가 비율 (%)', note: '(휴식·여가 ÷ 일+집안일+휴식) · 참가자별, 내 막대는 파란색', build: x => {
        const share = d => { let w = 0, r = 0; rowsOf(d, 'acts').forEach(a => { const h = num(a.hours) || 0; if (a.type === 'rest') r += h; else if (a.type === 'work' || a.type === 'chore') w += h; }); return (w + r) ? Math.round(r / (w + r) * 100) : null; };
        const rs = x.all.map(p => ({ p, v: share(p.data) })).filter(r => r.v !== null);
        if (!rs.length) return null;
        return C().bar(rs.map(r => r.p.name), [{ label: '%', data: rs.map(r => r.v), colors: meColors(rs.map(r => r.p)) }], { horizontal: true, max: 100 });
      } },
      { title: '휴식 비율 vs 균형 만족도', note: '가로: 휴식·여가 비율(%) · 세로: 균형 만족도(1~10)', build: x => {
        const share = d => { let w = 0, r = 0; rowsOf(d, 'acts').forEach(a => { const h = num(a.hours) || 0; if (a.type === 'rest') r += h; else if (a.type === 'work' || a.type === 'chore') w += h; }); return (w + r) ? Math.round(r / (w + r) * 100) : null; };
        const pts = x.all.map(p => ({ x: share(p.data), y: num(p.data.wlb), name: p.name, me: p.isMe })).filter(p => p.x !== null && p.y !== null);
        if (!pts.length) return null;
        return C().scatter(pts, { xmax: 100, ymax: 10, xl: '휴식·여가 비율 (%)', yl: '균형 만족도' });
      } },
      { title: '지치는 시간대', note: '참가자별 집중이 흐트러지는 때 — 이때가 쉬어야 할 신호', build: x => {
        const c = cntChoice(x, 'tired', TIRED); if (!c.some(Boolean)) return null;
        return C().bar(TIRED.map(t => t.l), [{ label: '명', data: c, color: C().COLORS.sand }], {});
      } },
      { title: '우리가 고른 휴식', note: '가장 잘 맞는 휴식 3가지 선택 합계', build: hbarOf('breaks', BREAKS, C().COLORS.teal, true) }
    ],
    wall: [{ id: 'like', title: '내 일의 좋은 점' }, { id: 'env', title: '환경 바꾸기' }, { id: 'play', title: '놀이 더하기' }, { id: 'flowact', title: '몰입하는 활동' }]
  });

  /* ===== STEP 5 ===== */
  list.push({
    n: 5, icon: '🤝', part: '관계', title: '긍정적 관계', en: 'Positive Relationships',
    sub: '효과적인 소통과 건강한 관계의 원칙을 점검하고 대화를 연습하는 날',
    concept: [
      '좋은 관계는 성장·지지·협력·즐거움·의미를 줍니다. 소속 욕구는 인간의 본능입니다.',
      '경청·질문·말투·몸짓·눈 맞춤, 그리고 대화의 “갈래(thread)”를 잡는 것이 소통의 기본기입니다.',
      '모두를 동등하게, 강점 보기, 경계 존중, 웃음, 나를 나누기, 내려놓기, 진실함. 때로는 관계를 정리하는 용기도 필요합니다.'
    ],
    sections: [
      { title: '① 내 관계가 나에게 주는 것', desc: '가족·친구·동료를 모두 떠올리며 답하세요. (1~5)', fields: RELGIVE.map(q => rg(q[0], `${q[1]} — ${q[2]}`, {})) },
      { title: '② 소통 7가지 점검', fields: COMM.map(q => rg(q[0], `${q[1]} — ${q[2]}`, {})) },
      { title: '③ 관계 원칙 7가지 점검', fields: PRIN.map(q => rg(q[0], `${q[1]} — ${q[2]}`, {})) },
      { title: '④ 대화 스레딩 연습', desc: '한 문장 안에는 여러 갈래(thread)가 있습니다. 상대가 이렇게 말했다고 가정해 보세요: “일요일에 민수가 영화 ‘머니볼’을 봤대.”', fields: [
        tx('th1', '“일요일”에 이어갈 말', '', { share: true, smp: ['나는 일요일에 집 정리하느라 하루가 갔어', '일요일엔 보통 뭐 해?'] }),
        tx('th2', '“민수”에 이어갈 말', '', { share: true, smp: ['민수는 요즘 어떻게 지내?', '민수 본 지 오래됐네, 잘 지낸대?'] }),
        tx('th3', '“머니볼”에 이어갈 말', '', { share: true, smp: ['나도 그 영화 좋아해, 야구 좋아하는 편이야?', '요즘 볼만한 영화 뭐 있어?'] }),
        tx('openq', '열린 질문(왜·어떻게) 하나 만들기', '“예/아니오”로 끝나지 않는 질문을 써 보세요.', { share: true, smp: ['그 일을 하게 된 계기가 뭐였어요?', '어떻게 그렇게 생각하게 됐어요?', '가장 기억에 남는 장면이 뭐였어요?'] })
      ] },
      { title: '⑤ 관계 에너지 지도', desc: '주변 사람을 이름 대신 별칭·관계로 적어 보세요. 함께 있을 때 에너지가 어떤지, 주당 시간은 얼마인지 표시합니다. 안전을 위협받는 관계라면 전문가·기관의 도움을 받으세요.', fields: [
        rows('rels', '관계 목록', [
          { id: 'who', label: '관계(별칭)', type: 'text', ph: '예: 대학 친구 A', smp: ['가족', '직장 동료 A', '오랜 친구', '팀장님', '이웃', '동호회 사람'] },
          { id: 'energy', label: '에너지', type: 'select', options: ENERGY },
          { id: 'hours', label: '시간/주', type: 'number', ph: '5', smpR: [1, 20] }
        ], { min: 4, max: 8 })
      ] },
      { title: '⑥ 이번 주 실천', fields: [
        tx('praise', '이번 주 누군가에게 건넬 강점 칭찬 한 문장', '', { share: true, smp: ['설명을 쉽게 해 주셔서 큰 도움이 됐어요', '늘 끝까지 챙겨 줘서 고마워', '아이디어가 정말 좋았어요'] }),
        ch('letgo', '마음에 품은 묵은 감정을 내려놓을 준비는?', LETGO),
        tx('kind', '자애 명상 문구: “모든 존재가 ____하기를”', '', { share: true, smp: ['평온하기를', '건강하기를', '고통에서 벗어나기를', '행복하기를'] })
      ] }
    ],
    charts: [
      { title: '내 관계가 주는 것', note: '5축 · 나 vs 참가자 평균 (5점)', tall: true, build: radarOf(RELGIVE.map(q => q[1]), RELGIVE.map(q => q[0]), 5) },
      { title: '소통 7가지 점검', note: '나 vs 참가자 평균 (5점)', build: barMA(COMM.map(q => q[1]), COMM.map(q => q[0]), 5, true) },
      { title: '관계 원칙 레이더', note: '7원칙 · 나 vs 참가자 평균 (5점)', tall: true, build: radarOf(PRIN.map(q => q[1]), PRIN.map(q => q[0]), 5) },
      { title: '나의 관계 에너지 지도', note: '주당 시간 기준 · 에너지를 주는/보통/빼앗는 관계', build: x => {
        const rs = rowsOf(x.me, 'rels'); if (!rs.length) return null;
        const c = ENERGY.map(e => rs.filter(r => r.energy === e.v).reduce((s, r) => s + (num(r.hours) || 0), 0));
        if (!c.some(Boolean)) return null;
        return C().doughnut(ENERGY.map(e => e.l), c, ENERGY_COLOR);
      } },
      { title: '함께 보는 관계 에너지', note: '참가자별 주당 시간 (쌓은 막대) · 내 이름은 맨 위', tall: true, build: x => {
        const rs = x.all.map(p => ({ p, c: ENERGY.map(e => rowsOf(p.data, 'rels').filter(r => r.energy === e.v).reduce((s, r) => s + (num(r.hours) || 0), 0)) }))
          .filter(r => r.c.some(Boolean)).sort((a, b) => (b.p.isMe ? 1 : 0) - (a.p.isMe ? 1 : 0)).slice(0, 12);
        if (!rs.length) return null;
        return C().bar(rs.map(r => r.p.isMe ? r.p.name + '(나)' : r.p.name), ENERGY.map((e, k) => ({ label: e.l, data: rs.map(r => r.c[k]), color: ENERGY_COLOR[k] })), { horizontal: true, stacked: true, legend: true });
      } },
      { title: '묵은 감정 내려놓기', note: '참가자 응답 분포', build: doughnutOf('letgo', LETGO, [C().COLORS.teal, C().COLORS.sand, C().COLORS.red, C().COLORS.grey]) }
    ],
    wall: [
      { id: 'th1', title: '“일요일” 갈래' }, { id: 'th2', title: '“민수” 갈래' }, { id: 'th3', title: '“머니볼” 갈래' },
      { id: 'openq', title: '열린 질문' }, { id: 'praise', title: '강점 칭찬' }, { id: 'kind', title: '자애 문구' }
    ]
  });

  /* ===== STEP 6 ===== */
  list.push({
    n: 6, icon: '🥗', part: '몸과 마음', title: '몸과 마음의 연결', en: 'Physical and Mental Health & Conclusion',
    sub: '식사·운동·몸 신호를 점검하고, 12가지 원칙으로 나의 리와이어를 마무리하는 날',
    concept: [
      '마음과 몸은 하나의 시스템입니다. 식사와 운동은 우리가 바꿀 수 있는 가장 확실한 뇌 건강 요인입니다.',
      '오메가-3, 복합 탄수화물, 채소·과일, 물이 뇌에 좋고, 규칙적인 운동은 기분·인지·신경가소성을 돕습니다.',
      '작게 시작하세요. 큰 변화나 약·질환 관련 결정은 전문가와 상의하세요. 마지막으로 나에게 필요한 원칙을 고릅니다.'
    ],
    sections: [
      { title: '① 뇌 식단 주간 체크', desc: '지난 7일 중 며칠 먹었는지 표시하세요. (0~7일) 가공식품·단 간식은 적을수록 좋습니다.', fields: FOOD.map(f => rg(f[0], `${f[1]} — ${f[2]}`, { min: 0, max: 7, lo: '0일', hi: '7일' })) },
      { title: '② 움직임 점검', fields: [
        rg('ex_days', '일주일에 운동한 날', { min: 0, max: 7, lo: '0일', hi: '7일' }),
        rg('ex_min', '한 번 할 때 평균 운동 시간(분)', { min: 0, max: 120, step: 10, lo: '0분', hi: '120분' }),
        rg('sit', '하루에 앉아 있는 시간(시간)', { min: 0, max: 14, lo: '0시간', hi: '14시간', smpFn: ({ ri }) => ri(4, 12) }),
        ch('extype', '주로 하는 운동', EXTYPE)
      ] },
      { title: '③ 지금 몸과 마음의 신호', desc: '오늘 컨디션을 1~10으로 표시하세요.', fields: [
        rg('mood', '기분', { min: 1, max: 10, lo: '가라앉음', hi: '아주 좋음' }),
        rg('energy', '에너지', { min: 1, max: 10, lo: '바닥', hi: '충만' }),
        rg('focus', '집중력', { min: 1, max: 10, lo: '산만', hi: '또렷' }),
        rg('sleep', '수면의 질', { min: 1, max: 10, lo: '나쁨', hi: '아주 좋음' })
      ] },
      { title: '④ 한 주 건강 실험', desc: '한 번에 하나만 고르세요. 큰 식단·운동 변화나 건강 문제는 의사와 상의하세요.', fields: [
        ch('hpick', '이번 주 시도할 한 가지', HEALTHPICK),
        tx('hdetail', '언제·어떻게 할지 한 줄로', '', { share: true, smp: ['출근길에 한 정거장 먼저 내려 걷기', '저녁 식사 때 작은 그릇 쓰기', '점심 후 물 한 컵', '동료와 주 2회 스트레칭'] })
      ] },
      { title: '⑤ 마무리 — 12가지 원칙에서 3가지 고르기', desc: '이 프로그램이 끝난 뒤에도 붙들고 싶은 원칙 3가지를 고르고, 한 문장으로 선언해 보세요.', fields: [
        ml('prin', '나에게 가장 필요한 원칙 3가지', PRINCIPLES),
        ta('declare', '나의 리와이어 선언문 한 문장', '예: 나는 완벽보다 성장을 택하고, 오늘 한 가지를 실행한다.', { share: true, smp: ['나는 완벽보다 성장을 택한다', '나는 오늘 배운 것 하나를 바로 실행한다', '나는 나를 용서하고 다시 걷는다'] }),
        tx('commit', '내일 바로 시작할 가장 작은 행동 하나', '', { share: true, smp: ['아침에 물 한 잔 마시기', '10분 걷기', '일기 세 줄 쓰기'] })
      ] }
    ],
    charts: [
      { title: '나의 뇌 식단', note: '지난 7일 중 먹은 날 수 · 나 vs 참가자 평균 (마지막 항목은 적을수록 좋음)', tall: true, build: barMA(FOOD.map(f => f[1]), FOOD.map(f => f[0]), 7, true) },
      { title: '앉아 있는 시간 vs 운동한 날', note: '왼쪽 위(적게 앉고 자주 움직임)일수록 이상적 · 내 점은 파란색', build: x => {
        const pts = x.all.map(p => ({ x: num(p.data.sit), y: num(p.data.ex_days), name: p.name, me: p.isMe })).filter(p => p.x !== null && p.y !== null);
        if (!pts.length) return null;
        return C().scatter(pts, { xmax: 14, ymax: 7, xl: '하루 앉아 있는 시간(h)', yl: '주당 운동한 날', xmid: 8, ymid: 3 });
      } },
      { title: '몸과 마음의 신호', note: '기분·에너지·집중·수면 · 나 vs 참가자 평균 (10점)', build: radarOf(['기분', '에너지', '집중력', '수면'], ['mood', 'energy', 'focus', 'sleep'], 10) },
      { title: '이번 주 건강 실험', note: '참가자가 고른 한 가지', build: hbarOf('hpick', HEALTHPICK, C().COLORS.green) },
      { title: '우리가 붙잡을 원칙 Top', note: '12가지 원칙 중 선택 합계 (한 사람당 3가지)', tall: true, build: hbarOf('prin', PRINCIPLES, C().COLORS.me, true) }
    ],
    wall: [{ id: 'declare', title: '리와이어 선언문' }, { id: 'commit', title: '내일 시작할 한 가지' }, { id: 'hdetail', title: '건강 실험 계획' }]
  });

  list.forEach(def => { def.sample = i => autoSample(def, i); });

  /* ---------- 진행도 ---------- */
  function completion(day, data) {
    if (!data) return 0;
    const def = list[day - 1];
    let total = 0, done = 0;
    def.sections.forEach(s => s.fields.forEach(f => {
      if (f.type === 'group') return;
      total++;
      const v = data[f.id];
      if (f.type === 'rows') { const n = rowsOf(data, f.id).length; if (n >= 3) done++; else if (n) done += 0.5; }
      else if (f.type === 'multi') { if (Array.isArray(v) && v.length) done++; }
      else if (v !== undefined && v !== null && String(v).trim() !== '') done++;
    }));
    return total ? done / total : 0;
  }

  /* ---------- 종합 지표 (리와이어 지수) ---------- */
  const METRICS = [
    { key: 'mind', label: '사고 유연성', tip: 'Step 1 · 믿음의 유연성과 긍정:부정 비율(3:1 기준)' },
    { key: 'emotion', label: '감정 지능', tip: 'Step 2 · 자기 인식·구분·타인 인식·활용·표현' },
    { key: 'habit', label: '습관 실행', tip: 'Step 3 · 한 주 실험 달성일과 평가' },
    { key: 'work', label: '일·쉼 균형', tip: 'Step 4 · 일 만족, 휴식 비율, 균형 만족도' },
    { key: 'rel', label: '관계', tip: 'Step 5 · 관계가 주는 것·소통·관계 원칙' },
    { key: 'body', label: '몸 돌봄', tip: 'Step 6 · 뇌 식단, 운동, 컨디션' }
  ];
  const mean5 = (d, ids) => { const v = avg(ids.map(k => num(d[k]))); return v === null ? null : v * 20; };
  function metrics(dd) {
    const out = {};
    const [d1, d2, d3, d4, d5, d6] = [1, 2, 3, 4, 5, 6].map(k => dd[k]);
    if (d1) {
      const flex = num(d1.flex), p = num(d1.pos), n = num(d1.neg);
      const ratio = (p !== null && n !== null) ? (n === 0 ? 100 : Math.min(100, p / n / 3 * 100)) : null;
      out.mind = avg([flex === null ? null : flex * 10, ratio]);
    }
    if (d2) out.emotion = mean5(d2, EI.map(e => e[0]));
    if (d3) { const days = num(d3.days); out.habit = avg([days === null ? null : days / 7 * 100, mean5(d3, ['ev1', 'ev2', 'ev3', 'ev4'])]); }
    if (d4) {
      let w = 0, r = 0; rowsOf(d4, 'acts').forEach(a => { const h = num(a.hours) || 0; if (a.type === 'rest') r += h; else if (a.type === 'work' || a.type === 'chore') w += h; });
      const share = (w + r) ? Math.min(100, (r / (w + r)) / 0.25 * 100) : null;
      const wlb = num(d4.wlb);
      out.work = avg([mean5(d4, WORKQ.map(q => q[0])), share, wlb === null ? null : wlb * 10]);
    }
    if (d5) out.rel = avg([mean5(d5, RELGIVE.map(q => q[0])), mean5(d5, COMM.map(q => q[0])), mean5(d5, PRIN.map(q => q[0]))]);
    if (d6) {
      const good = avg(['f_fish', 'f_nuts', 'f_grain', 'f_veg', 'f_water', 'f_tea'].map(k => num(d6[k])));
      const junk = num(d6.f_junk);
      const food = (good === null && junk === null) ? null : avg([good === null ? null : good / 7 * 100, junk === null ? null : (7 - junk) / 7 * 100]);
      const ex = num(d6.ex_days);
      const feel = avg(['mood', 'energy', 'focus', 'sleep'].map(k => num(d6[k])));
      out.body = avg([food, ex === null ? null : Math.min(100, ex / 4 * 100), feel === null ? null : feel * 10]);
    }
    METRICS.forEach(m => { if (out[m.key] === undefined) out[m.key] = null; });
    return out;
  }

  window.Days = { list, sample: (d, i) => list[d - 1].sample(i), completion, metrics, METRICS, rowsOf, num, txt, avg, PRINCIPLES };
})();
