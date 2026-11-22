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
  const watchedVideos = new Map();
  function updatePlayback(video, visible) {
    watchedVideos.set(video, visible);
    if (visible && !document.hidden && !$('#vmodal.open')) {
      if (video.dataset.src && !video.getAttribute('src')) video.src = video.dataset.src;
      video.play().catch(() => {});
    } else video.pause();
  }
  const playbackObserver = new IntersectionObserver((entries) => {
    entries.forEach(({ target, intersectionRatio, isIntersecting }) => {
      updatePlayback(target, isIntersecting && intersectionRatio >= 0.3);
    });
  }, { threshold: [0, 0.3] });
  function watchPlayback(video) {
    watchedVideos.set(video, false);
    playbackObserver.observe(video);
  }
  function stopWatching(video) {
    video.pause();
    playbackObserver.unobserve(video);
    watchedVideos.delete(video);
  }
  function resumeVisible() {
    watchedVideos.forEach((visible, video) => updatePlayback(video, visible));
  }
  window.LENS_PLAYBACK = { observe: watchPlayback, unobserve: stopWatching, resumeVisible };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) $$('video').forEach((video) => video.pause());
    else resumeVisible();
  });
  const GRAD = '<defs><linearGradient id="gOurs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9488BA"/><stop offset="1" stop-color="#9488BA"/></linearGradient></defs>';
  function pill(svg, cx, cy, txt, d, fs) {
    const col = d > 0.05 ? '#16a34a' : '#f1f0f5';
    const tc = d > 0.05 ? '#fff' : '#6c6a79';
    const w = txt.length * fs * 0.62 + 12, h = fs + 8;
    el('rect', { x: cx - w / 2, y: cy - h + 4, width: w, height: h, rx: h / 2, fill: col }, svg);
    el('text', { x: cx, y: cy - 1, 'text-anchor': 'middle', 'font-size': fs, 'font-weight': 800, fill: tc }, svg).textContent = txt;
  }

  /* ---------- KaTeX for inline math ---------- */
  function renderMath() {
    if (!window.katex) return;
    $$('.m').forEach((s) => {
      try { window.katex.render(s.textContent, s, { throwOnError: false }); } catch (e) { /* keep text */ }
      const following = s.nextSibling;
      const punctuation = following && following.nodeType === Node.TEXT_NODE && /^[.,:!?]/.exec(following.textContent);
      if (punctuation) {
        const phrase = document.createElement('span');
        phrase.className = 'keep-together';
        s.before(phrase);
        phrase.append(s, document.createTextNode(punctuation[0]));
        following.textContent = following.textContent.slice(punctuation[0].length);
      }
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
    const groups = {}; D.main.forEach((r, i) => { if (i === 0) groups[i] = 'Latent world models'; if (['LeWM', 'GAWM', 'SMWM'].includes(r.name)) groups[i] = r.name + ' base'; });
    D.main.forEach((r, i) => {
      if (groups[i]) h += `<tr class="group"><td colspan="${1 + 2 * cols.length}">${groups[i]}</td></tr>`;
      const ours = r.name.endsWith('+ Ours');
      const label = ours ? r.name.replace('+ Ours', '+ LeNS-JEPA') : (r.name === 'GAWM (public)' ? 'GAWM' : r.name);
      h += `<tr class="${ours ? 'ours' : ''}"><td>${label}</td>`;
      vals[i].forEach((v, j) => {
        const pairIndex = ours ? i - 1 : (['LeWM', 'SMWM', 'GAWM'].includes(r.name) ? i + 1 : null);
        const cls = pairIndex !== null && v >= vals[pairIndex][j] ? 'best' : '';
        let g = '';
        if (ours) {
          const arm = j === 6 ? 'ind' : 'ood';
          const d = j < 6 ? rel(vals[i - 1][j], v) : rel(D.main[i - 1][arm].reduce((s, x) => s + x, 0), r[arm].reduce((s, x) => s + x, 0));
          if (d !== null) g = `<span class="gain ${d < -0.05 ? 'neg' : (Math.abs(d) < 0.05 ? 'zero' : (d >= 20 ? 'big' : ''))}">${d >= 0 ? '+' : ''}${d.toFixed(1)}%</span>`;
        }
        h += `<td class="${cls}"><span class="v">${fmt(v, 2)}</span>${g}</td>`;
      });
      h += '</tr>';
    });
    t.innerHTML = h + '</tbody>';
  }

  function buildConditions() {
    $('#conditionTables').innerHTML = D.tasks.map((task) => {
      const rows = D.main.map((r) => {
        const ours = r.name.endsWith('+ Ours');
        const label = r.name.replace('+ Ours', '+ LeNS-JEPA');
        const values = D.conditions[task][r.name];
        return `<tr class="${ours ? 'ours' : ''}"><td>${label}</td>` +
          values.map((v) => `<td>${fmt(v, 2)}</td>`).join('') + '</tr>';
      }).join('');
      return `<h3>${task}</h3><div class="table-wrap"><table class="res"><thead><tr><th>Method</th>` +
        D.shifts.concat(['OoD Avg.']).map((s) => `<th>${s} ↑</th>`).join('') +
        `</tr></thead><tbody>${rows}</tbody></table></div>`;
    }).join('');
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
      [[a[k], '#D9D5E8', -1], [b[k], 'url(#gOurs)', 1]].forEach(([v, c, side]) => {
        const x = cx + (side < 0 ? -bw - 3 : 3), h = ph * v / 100;
        const r = el('rect', { x, y: T + ph, width: bw, height: 0, rx: 5, fill: c, class: 'bar' }, svg);
        requestAnimationFrame(() => setTimeout(() => { r.setAttribute('y', T + ph - h); r.setAttribute('height', h); }, 80 * k));
        el('text', { x: x + bw / 2, y: T + ph - h - 6, 'text-anchor': 'middle', 'font-size': 12.5, 'font-weight': 700, fill: side > 0 ? '#6d28d9' : '#64748b' }, svg).textContent = v.toFixed(1);
      });
      const d = rel(a[k], b[k]);
      el('text', { x: cx, y: H - 18, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: '#14121c' }, svg).textContent = s;
      pill(svg, cx, H + 16, `${d > 0.05 ? '+' : ''}${d.toFixed(1)}%`, d, 13);
    });
  }

  /* ---------- plug-in chart ---------- */
  let metric = 'ood';
  function pluginChart() {
    const svg = $('#pluginChart');
    svg.innerHTML = GRAD;
    const bases = [['LeWM', 'LeWM + Ours'], ['SMWM', 'SMWM + Ours'], ['GAWM', 'GAWM + Ours']];
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
        [[bv, '#D9D5E8', -1], [ov, 'url(#gOurs)', 1]].forEach(([v, c, side]) => {
          const x = cx + (side < 0 ? -bw - 2 : 2), h = ph * v / 100;
          const r = el('rect', { x, y: T + ph, width: bw, height: 0, rx: 4, fill: c, class: 'bar' }, svg);
          requestAnimationFrame(() => setTimeout(() => { r.setAttribute('y', T + ph - h); r.setAttribute('height', h); }, 40 * (ti * 3 + bi)));
          el('text', { x: x + bw / 2, y: T + ph - h - 5, 'text-anchor': 'middle', 'font-size': 10.5, 'font-weight': 600, fill: '#5d5a6d' }, svg).textContent = v.toFixed(1);
        });
        const d = rel(bv, ov);
        el('text', { x: cx, y: H - 30, 'text-anchor': 'middle', 'font-size': 12.5, 'font-weight': 600, fill: '#3c3a48' }, svg).textContent = bn;
        pill(svg, cx, H - 4, `${d > 0.05 ? '+' : ''}${d.toFixed(1)}%`, d, 11.5);
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
      b.type = 'button'; b.textContent = lab; b.dataset.k = k;
      b.addEventListener('click', () => { if (!b.disabled) onPick(k); });
      root.appendChild(b);
    });
  }
  function renderDemo() {
    const stage = $('#demoStage'), info = $('#demoInfo');
    const previous = stage.querySelector('video');
    if (previous) stopWatching(previous);
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
    stage.innerHTML = `<video src="${c.src}" poster="${c.poster || ''}" muted loop playsinline controls preload="metadata" data-visible-autoplay></video>`;
    const dv = stage.querySelector('video');
    dv.setAttribute('aria-label', `${TASKS.find(([key]) => key === state.task)[1]} ${SHIFTS.find(([key]) => key === state.shift)[1]} planning comparison`);
    watchPlayback(dv);
    dv.addEventListener('error', () => { stage.innerHTML = `<img src="${c.poster}" alt="demo">`; }, true);
    const tag = (ok, who, st) => `<span class="pill ${ok ? 'ok' : 'bad'}">${who}: ${ok ? 'goal at step ' + st : 'fails within 50 steps'}</span>`;
    const sr = (c.sr_lewm !== undefined && c.sr_ours !== undefined) ?
      `<span class="pill neutral">All 50 queries of this condition: LeWM ${c.sr_lewm}% · LeNS-JEPA ${c.sr_ours}%</span>` : '';
    const rule = kind === 'failure' ? 'first test query where LeWM succeeds and LeNS-JEPA fails' :
      (kind === 'clean' ? 'first test query where both succeed (no shift)' : 'first test query where LeNS-JEPA succeeds and LeWM fails');
    info.innerHTML = `${tag(c.lewm_success, 'LeWM', c.lewm_step)}${tag(c.ours_success, 'LeNS-JEPA', c.ours_step)}${sr}<details class="clip-details"><summary>Clip details</summary><span>Test query #${c.test_index} · ${rule}. Recorded actions replayed in the simulator.</span></details>`;
  }
  function initDemo() {
    $('#replayDemo').addEventListener('click', () => {
      const video = $('#demoStage video');
      if (video) { video.currentTime = 0; video.play().catch(() => {}); }
    });
    buildSeg($('#taskSeg'), TASKS, 'task', (k) => {
      state.task = k;
      const kind = state.fail ? 'failure' : 'demo';
      if (!find(k, state.shift, state.shift === 'clean' ? 'clean' : kind)) state.shift = firstShift(k, kind) || 'clean';
      renderDemo();
    });
    buildSeg($('#shiftSeg'), SHIFTS, 'shift', (k) => { state.shift = k; renderDemo(); });
    if (clips.length && !find(state.task, state.shift, 'demo')) state.shift = firstShift(state.task, 'demo') || 'clean';
    renderDemo();
  }

  /* ---------- hero mosaic ---------- */
  function initMosaic() {
    const m = $('#heroMosaic');
    if (!m) return;
    const picks = TASKS.map(([t, lab]) => {
      const s = firstShift(t, 'demo');
      return s ? [find(t, s, 'demo'), lab + ' · ' + SHIFTS.find((x) => x[0] === s)[1]] : null;
    }).filter(Boolean);
    if (!picks.length) { m.style.display = 'none'; return; }
    m.innerHTML = picks.map(([c, lab]) => `<a class="mosaic-tile" href="#demo" data-task="${c.task}" data-shift="${c.shift}" aria-label="Explore ${lab} planning comparison"><video data-src="${c.src}" poster="${c.poster || ''}" muted loop playsinline preload="none" aria-hidden="true"></video><span class="lbl">${lab}</span></a>`).join('');
    $$('video', m).forEach(watchPlayback);
    $$('.mosaic-tile', m).forEach((a) => a.addEventListener('click', () => { state.task = a.dataset.task; state.shift = a.dataset.shift; state.fail = false; renderDemo(); }));
  }

  /* ---------- selected mask excerpts ---------- */
  function initMask() {
    const items = [['all', 'All three tasks'], ['tworoom', 'TwoRoom'], ['pusht', 'PushT'], ['reacher', 'Reacher']];
    const seg = $('#maskSeg');
    if (!seg) return;
    let cur = 'all';
    buildSeg(seg, items, 'mask', (k) => { cur = k; show(); });
    function show() {
      const previous = $('#maskStage video');
      if (previous) stopWatching(previous);
      $$('#maskSeg button').forEach((b) => {
        b.classList.toggle('on', b.dataset.k === cur);
        b.setAttribute('aria-pressed', String(b.dataset.k === cur));
      });
      const name = items.find(([key]) => key === cur)[1];
      const prefix = `static/videos/mask/selected/${cur}_mask_excerpt`;
      $('#maskStage').innerHTML = `<video src="${prefix}.mp4" poster="${prefix}.jpg" muted loop playsinline controls preload="metadata" aria-label="${name} selected learned-mask excerpt"></video>`;
      const video = $('#maskStage video');
      watchPlayback(video);
      video.addEventListener('error', () => { $('#maskFoot').textContent = 'This video could not be loaded. Reload the page to try again.'; }, { once: true });
      $('#maskFoot').textContent = 'Selected excerpts of learned masks on three fixed validation frames per task. Amber marks masked patches. Masking is used only during training.' + (cur === 'all' ? ' Top to bottom: TwoRoom, PushT, Reacher.' : '');
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
  buildConditions();
  deltaCards();
  initDemo();
  initMosaic();
  $$('#heroHighlight video').forEach(watchPlayback);
  initMask();
  const r1 = $('#results .reveal') || $('#results .wrap');
  const charts = new IntersectionObserver((en) => en.forEach((e) => {
    if (e.isIntersecting) { if (e.target.id === 'shiftChart') shiftChart(); else pluginChart(); charts.unobserve(e.target); }
  }), { threshold: 0.3 });
  charts.observe($('#shiftChart'));
  charts.observe($('#pluginChart'));
})();
