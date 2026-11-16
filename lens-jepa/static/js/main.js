(function () {
  'use strict';
  const D = window.PAPER_DATA;
  const VM = window.VIDEO_MANIFEST || null;
  const MM = window.MASK_MANIFEST || null;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const fmt = (v, d = 1) => (v === null || v === undefined ? '–' : Number(v).toFixed(d));
  const rel = (b, o) => (b === 0 ? null : ((o - b) / b) * 100);
  const GRAD = '<defs><linearGradient id="gOurs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#5b21b6"/></linearGradient></defs>';
  function pill(svg, cx, cy, txt, d, fs) {
    const col = d > 0.05 ? '#16a34a' : (d < -0.05 ? '#fee2e2' : '#a1a1aa'); const tc = d < -0.05 ? '#b91c1c' : '#fff';
    const w = txt.length * fs * 0.62 + 12, h = fs + 8;
    el('rect', { x: cx - w / 2, y: cy - h + 4, width: w, height: h, rx: h / 2, fill: col }, svg);
    el('text', { x: cx, y: cy - 1, 'text-anchor': 'middle', 'font-size': fs, 'font-weight': 800, fill: tc }, svg).textContent = txt;
  }

  /* ---------- KaTeX for inline math ---------- */
  function renderMath() {
    if (!window.katex) return;
    $$('.m').forEach((s) => {
      try { window.katex.render(s.textContent, s, { throwOnError: false }); } catch (e) { /* keep text */ }
    });
  }

  /* ---------- nav ---------- */
  const nav = $('#nav');
  const sections = $$('section[id]');
  function onScroll() {
    nav.classList.toggle('solid', window.scrollY > 40);
    let cur = '';
    sections.forEach((s) => { if (s.getBoundingClientRect().top < 120) cur = s.id; });
    $$('.nav .links a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- reveal + count-up ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      if (en.target.dataset.onreveal) window[en.target.dataset.onreveal] && window[en.target.dataset.onreveal]();
      io.unobserve(en.target);
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach((e) => io.observe(e));

  function countUp() {
    $$('.count').forEach((c) => {
      const to = parseFloat(c.dataset.to), dec = parseInt(c.dataset.dec || '0', 10);
      const t0 = performance.now(), dur = 1400;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        c.textContent = (to * e).toFixed(dec);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }
  setTimeout(countUp, 350);

  /* ---------- lightbox ---------- */
  const lb = $('#lightbox');
  $$('.zoomable').forEach((img) => img.addEventListener('click', () => { lb.querySelector('img').src = img.src; lb.classList.add('open'); }));
  lb.addEventListener('click', () => lb.classList.remove('open'));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lb.classList.remove('open'); });

  /* ---------- main table ---------- */
  function buildTable() {
    const t = $('#mainTable');
    const cols = D.tasks.concat(['Mean']);
    let h = '<thead><tr><th rowspan="2">Method</th>' + cols.map((c) => `<th colspan="2">${c}</th>`).join('') + '</tr><tr>' +
      cols.map(() => '<th>InD ↑</th><th>OoD Avg. ↑</th>').join('') + '</tr></thead><tbody>';
    const vals = D.main.map((r) => D.tasks.map((_, i) => [r.ind[i], r.ood[i]]).flat().concat([r.mean[0], r.mean[1]]));
    const best = [], second = [];
    for (let j = 0; j < vals[0].length; j++) {
      const u = Array.from(new Set(vals.map((v) => v[j]))).sort((a, b) => b - a);
      best.push(u[0]); second.push(u[1]);
    }
    const groups = {}; D.main.forEach((r, i) => { if (i === 0) groups[i] = 'Latent world models'; if (['LeWM', 'GAWM', 'SMWM'].includes(r.name)) groups[i] = r.name + ' base'; });
    D.main.forEach((r, i) => {
      if (groups[i]) h += `<tr class="group"><td colspan="${1 + 2 * cols.length}">${groups[i]}</td></tr>`;
      const ours = r.name.endsWith('+ Ours');
      const label = ours ? r.name.replace('+ Ours', '+ LeNS-JEPA') : (r.name === 'GAWM (public)' ? 'GAWM' : r.name);
      h += `<tr class="${ours ? 'ours' : ''}"><td>${label}</td>`;
      vals[i].forEach((v, j) => {
        const cls = v === best[j] ? 'best' : (v === second[j] ? 'second' : '');
        let g = '';
        if (ours) {
          const d = rel(vals[i - 1][j], v);
          if (d !== null) g = `<span class="gain ${d < -0.05 ? 'neg' : (Math.abs(d) < 0.05 ? 'zero' : (d >= 20 ? 'big' : ''))}">${d < -0.05 ? '▼ ' : (Math.abs(d) < 0.05 ? '' : '▲ ')}${d >= 0 ? '+' : ''}${d.toFixed(1)}%</span>`;
        }
        h += `<td class="${cls}"><span class="v">${fmt(v, 2)}</span>${g}</td>`;
      });
      h += '</tr>';
    });
    t.innerHTML = h + '</tbody>';
  }

  /* ---------- headline delta cards ---------- */
  function deltaCards() {
    const lw = D.main.find((r) => r.name === 'LeWM'), ou = D.main.find((r) => r.name === 'LeWM + Ours');
    const items = D.tasks.map((t, i) => [t, lw.ood[i], ou.ood[i], false]).concat([['Mean', lw.mean[1], ou.mean[1], true]]);
    $('#deltaCards').innerHTML = items.map(([t, b, o, m]) => {
      const d = rel(b, o);
      return `<div class="delta ${m ? 'mean' : ''}"><div class="t">${t} · OoD</div><div class="p">${d >= 0 ? '+' : ''}${d.toFixed(1)}<small>%</small></div>` +
        `<div class="ba">${b.toFixed(1)} → <b>${o.toFixed(1)}</b></div><div class="bars"><div class="bar2 b"><i data-w="${b}"></i></div><div class="bar2 o"><i data-w="${o}"></i></div></div>` +
        `<div class="lg"><span>LeWM</span><span>+ LeNS-JEPA</span></div></div>`;
    }).join('');
    const ob = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { $$('#deltaCards i').forEach((x) => (x.style.width = x.dataset.w + '%')); ob.disconnect(); } }), { threshold: 0.3 });
    ob.observe($('#deltaCards'));
  }

  /* ---------- per-shift chart ---------- */
  function shiftChart() {
    const svg = $('#shiftChart');
    svg.innerHTML = GRAD;
    const tasks = D.tasks, shifts = D.shifts;
    const avg = (name) => shifts.map((_, k) => tasks.reduce((s, t) => s + D.conditions[t][name][k], 0) / tasks.length);
    const a = avg('LeWM'), b = avg('LeWM + Ours');
    const W = 900, H = 300, L = 46, R = 10, T = 24, B = 40, ph = H - T - B;
    for (let y = 0; y <= 100; y += 25) {
      const yy = T + ph * (1 - y / 100);
      el('line', { x1: L, x2: W - R, y1: yy, y2: yy, stroke: '#eeebf5' }, svg);
      el('text', { x: L - 8, y: yy + 4, 'text-anchor': 'end', 'font-size': 12, fill: '#8a879a' }, svg).textContent = y;
    }
    const gw = (W - L - R) / shifts.length, bw = Math.min(46, gw * 0.3);
    shifts.forEach((s, k) => {
      const cx = L + gw * (k + 0.5);
      [[a[k], '#cbd5e1', -1], [b[k], 'url(#gOurs)', 1]].forEach(([v, c, side]) => {
        const x = cx + (side < 0 ? -bw - 3 : 3), h = ph * v / 100;
        const r = el('rect', { x, y: T + ph, width: bw, height: 0, rx: 5, fill: c, class: 'bar' }, svg);
        requestAnimationFrame(() => setTimeout(() => { r.setAttribute('y', T + ph - h); r.setAttribute('height', h); }, 80 * k));
        el('text', { x: x + bw / 2, y: T + ph - h - 6, 'text-anchor': 'middle', 'font-size': 12.5, 'font-weight': 700, fill: side > 0 ? '#6d28d9' : '#64748b' }, svg).textContent = v.toFixed(1);
      });
      const d = rel(a[k], b[k]);
      el('text', { x: cx, y: H - 18, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: '#14121c' }, svg).textContent = s;
      pill(svg, cx, H + 16, `${d > 0.05 ? '▲ +' : (d < -0.05 ? '▼ ' : '')}${d.toFixed(1)}%`, d, 13);
    });
  }

  /* ---------- plug-in chart ---------- */
  let metric = 'ood';
  function pluginChart() {
    const svg = $('#pluginChart');
    svg.innerHTML = GRAD;
    const bases = [['LeWM', 'LeWM + Ours'], ['GAWM', 'GAWM + Ours'], ['SMWM', 'SMWM + Ours']];
    const row = (n) => D.main.find((r) => r.name === n);
    const W = 1000, H = 360, L = 40, R = 8, T = 34, B = 56, ph = H - T - B;
    for (let y = 0; y <= 100; y += 25) {
      const yy = T + ph * (1 - y / 100);
      el('line', { x1: L, x2: W - R, y1: yy, y2: yy, stroke: '#eeebf5' }, svg);
      el('text', { x: L - 8, y: yy + 4, 'text-anchor': 'end', 'font-size': 12, fill: '#8a879a' }, svg).textContent = y;
    }
    const gw = (W - L - R) / D.tasks.length;
    D.tasks.forEach((task, ti) => {
      const g0 = L + gw * ti;
      if (ti) el('line', { x1: g0, x2: g0, y1: T - 10, y2: T + ph, stroke: '#e3dff0', 'stroke-dasharray': '4 4' }, svg);
      el('text', { x: g0 + gw / 2, y: T - 14, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: '#14121c' }, svg).textContent = task;
      const sw = gw / 3, bw = Math.min(26, sw * 0.32);
      bases.forEach(([bn, on], bi) => {
        const cx = g0 + sw * (bi + 0.5);
        const bv = row(bn)[metric][ti], ov = row(on)[metric][ti];
        [[bv, '#cbd5e1', -1], [ov, 'url(#gOurs)', 1]].forEach(([v, c, side]) => {
          const x = cx + (side < 0 ? -bw - 2 : 2), h = ph * v / 100;
          const r = el('rect', { x, y: T + ph, width: bw, height: 0, rx: 4, fill: c, class: 'bar' }, svg);
          requestAnimationFrame(() => setTimeout(() => { r.setAttribute('y', T + ph - h); r.setAttribute('height', h); }, 40 * (ti * 3 + bi)));
          el('text', { x: x + bw / 2, y: T + ph - h - 5, 'text-anchor': 'middle', 'font-size': 10.5, 'font-weight': 600, fill: '#5d5a6d' }, svg).textContent = v.toFixed(1);
        });
        const d = rel(bv, ov);
        el('text', { x: cx, y: H - 30, 'text-anchor': 'middle', 'font-size': 12.5, 'font-weight': 600, fill: '#3c3a48' }, svg).textContent = bn;
        pill(svg, cx, H - 4, `${d > 0.05 ? '▲ +' : (d < -0.05 ? '▼ ' : '')}${d.toFixed(1)}%`, d, 11.5);
      });
    });
  }
  $$('#metricSeg button').forEach((b) => b.addEventListener('click', () => {
    $$('#metricSeg button').forEach((x) => x.classList.remove('on'));
    b.classList.add('on'); metric = b.dataset.m; pluginChart();
  }));

  /* ---------- demo player ---------- */
  const TASKS = [['tworoom', 'TwoRoom'], ['pusht', 'PushT'], ['reacher', 'Reacher']];
  const SHIFTS = [['gray', 'Gray'], ['hue', 'Hue'], ['blur', 'Blur'], ['noise', 'Noise'], ['cb', 'Color–brightness'], ['clean', 'InD']];
  const state = { task: 'tworoom', shift: 'gray', fail: false };
  const clips = (VM && VM.clips) || [];
  const find = (task, shift, kind) => clips.find((c) => c.task === task && c.shift === shift && c.kind === kind);
  const firstShift = (task, kind) => (SHIFTS.find(([s]) => find(task, s, kind)) || [null])[0];

  function buildSeg(root, items, key, onPick) {
    root.innerHTML = '';
    items.forEach(([k, lab]) => {
      const b = document.createElement('button');
      b.textContent = lab; b.dataset.k = k;
      b.addEventListener('click', () => { if (!b.disabled) onPick(k); });
      root.appendChild(b);
    });
  }
  function renderDemo() {
    const stage = $('#demoStage'), info = $('#demoInfo');
    const kind = state.shift === 'clean' ? 'clean' : (state.fail ? 'failure' : 'demo');
    $$('#taskSeg button').forEach((b) => b.classList.toggle('on', b.dataset.k === state.task));
    $$('#shiftSeg button').forEach((b) => {
      const k = b.dataset.k, kk = k === 'clean' ? 'clean' : (state.fail ? 'failure' : 'demo');
      b.disabled = !find(state.task, k, kk);
      b.classList.toggle('on', k === state.shift);
    });
    const c = find(state.task, state.shift, kind);
    if (!c) {
      stage.innerHTML = `<div class="demo-empty">${clips.length ? 'No clip for this combination under the fixed selection rule.' : 'Videos are being rendered.'}</div>`;
      info.innerHTML = '';
      return;
    }
    stage.innerHTML = `<video src="${c.src}" poster="${c.poster || ''}" autoplay muted loop playsinline controls></video>`;
    const dv = stage.querySelector('video');
    dv.addEventListener('error', () => { stage.innerHTML = `<img src="${c.poster}" alt="demo">`; }, true);
    const tag = (ok, who, st) => `<span class="pill ${ok ? 'ok' : 'bad'}">${who}: ${ok ? 'goal at step ' + st : 'fails within 50 steps'}</span>`;
    const sr = (c.sr_lewm !== undefined && c.sr_ours !== undefined) ?
      `<span class="pill neutral">All 50 queries of this condition: LeWM ${c.sr_lewm}% · LeNS-JEPA ${c.sr_ours}%</span>` : '';
    const rule = kind === 'failure' ? 'first test query where LeWM succeeds and LeNS-JEPA fails' :
      (kind === 'clean' ? 'first test query where both succeed (no shift)' : 'first test query where LeNS-JEPA succeeds and LeWM fails');
    info.innerHTML = `${tag(c.lewm_success, 'LeWM', c.lewm_step)}${tag(c.ours_success, 'LeNS-JEPA', c.ours_step)}${sr}<span style="color:#8a879a">Test query #${c.test_index} · ${rule}</span>`;
  }
  function initDemo() {
    buildSeg($('#taskSeg'), TASKS, 'task', (k) => {
      state.task = k;
      const kind = state.fail ? 'failure' : 'demo';
      if (!find(k, state.shift, state.shift === 'clean' ? 'clean' : kind)) state.shift = firstShift(k, kind) || 'clean';
      renderDemo();
    });
    buildSeg($('#shiftSeg'), SHIFTS, 'shift', (k) => { state.shift = k; renderDemo(); });
    $('#failToggle').addEventListener('change', (e) => {
      state.fail = e.target.checked;
      const kind = state.fail ? 'failure' : 'demo';
      if (state.shift !== 'clean' && !find(state.task, state.shift, kind)) state.shift = firstShift(state.task, kind) || state.shift;
      renderDemo();
    });
    if (clips.length && !find(state.task, state.shift, 'demo')) state.shift = firstShift(state.task, 'demo') || 'clean';
    renderDemo();
  }

  /* ---------- hero mosaic ---------- */
  function initMosaic() {
    const m = $('#heroMosaic');
    const picks = TASKS.map(([t, lab]) => {
      const s = firstShift(t, 'demo');
      return s ? [find(t, s, 'demo'), lab + ' · ' + SHIFTS.find((x) => x[0] === s)[1]] : null;
    }).filter(Boolean);
    if (!picks.length) { m.style.display = 'none'; return; }
    m.innerHTML = picks.map(([c, lab]) => `<a class="mosaic-tile" href="#demo" data-task="${c.task}" data-shift="${c.shift}"><video src="${c.src}" poster="${c.poster || ''}" autoplay muted loop playsinline></video><span class="lbl">${lab}</span></a>`).join('');
    $$('.mosaic-tile', m).forEach((a) => a.addEventListener('click', () => { state.task = a.dataset.task; state.shift = a.dataset.shift; state.fail = false; $('#failToggle').checked = false; renderDemo(); }));
  }

  /* ---------- mask videos ---------- */
  function initMask() {
    const items = [['tworoom', 'TwoRoom'], ['pusht', 'PushT'], ['reacher', 'Reacher'], ['all', 'All']];
    const avail = MM && MM.clips ? MM.clips : null;
    const has = (k) => !avail || avail.some((c) => c.key === k);
    const seg = $('#maskSeg');
    let cur = avail ? (avail[0] && avail[0].key) : 'tworoom';
    buildSeg(seg, items.filter(([k]) => has(k)), 'mask', (k) => { cur = k; show(); });
    function show() {
      $$('#maskSeg button').forEach((b) => b.classList.toggle('on', b.dataset.k === cur));
      const c = avail ? avail.find((x) => x.key === cur) : null;
      const src = c ? c.src : `static/videos/mask/${cur}_mask_evolution.mp4`;
      const poster = c ? (c.poster || '') : `static/videos/mask/${cur}_mask_evolution.jpg`;
      $('#maskStage').innerHTML = `<video src="${src}" poster="${poster}" autoplay muted loop playsinline controls></video>`;
      const v = $('#maskStage video');
      v.addEventListener('error', () => { $('#maskStage').innerHTML = `<img src="${poster}" alt="mask evolution">`; }, true);
      if (c && c.note) $('#maskFoot').textContent = c.note;
    }
    show();
  }

  /* ---------- bibtex ---------- */
  $('#copyBib').addEventListener('click', () => {
    const t = $('#bibText').textContent;
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => { $('#copyBib').textContent = 'Copied'; setTimeout(() => ($('#copyBib').textContent = 'Copy'), 1500); }).catch(() => {});
  });

  /* ---------- go ---------- */
  renderMath();
  buildTable();
  deltaCards();
  initDemo();
  initMosaic();
  initMask();
  const r1 = $('#results .reveal') || $('#results .wrap');
  const charts = new IntersectionObserver((en) => en.forEach((e) => {
    if (e.isIntersecting) { if (e.target.id === 'shiftChart') shiftChart(); else pluginChart(); charts.unobserve(e.target); }
  }), { threshold: 0.3 });
  charts.observe($('#shiftChart'));
  charts.observe($('#pluginChart'));
})();
