(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const GI = (window.GALLERY_IMAGES && window.GALLERY_IMAGES.images) || [];
  const GV = (window.GALLERY_VIDEOS && window.GALLERY_VIDEOS.clips) || [];
  function seg(root, items, cur, onPick) {
    root.innerHTML = items.map(([k, l]) => `<button data-k="${k}" class="${k === cur ? 'on' : ''}">${l}</button>`).join('');
    $$('button', root).forEach((b) => b.addEventListener('click', () => { $$('button', root).forEach((x) => x.classList.remove('on')); b.classList.add('on'); onPick(b.dataset.k); }));
  }
  /* ---- shift strips ---- */
  const strips = GI.filter((x) => x.group === 'shifts');
  if (strips.length) {
    const tasks = Array.from(new Set(strips.map((x) => x.task)));
    let task = tasks[0], k = 0;
    const show = () => { const L = strips.filter((x) => x.task === task); k = (k + L.length) % L.length; $('#stripImg').src = 'static/images/gallery/' + L[k].file; };
    seg($('#shiftTaskSeg'), tasks.map((t) => [t, t]), task, (t) => { task = t; k = 0; show(); });
    $('#stripPrev').addEventListener('click', () => { k -= 1; show(); });
    $('#stripNext').addEventListener('click', () => { k += 1; show(); });
    show();
  } else { const c = $('#stripImg'); if (c) c.closest('.video-card').style.display = 'none'; }
  /* ---- mask gallery ---- */
  const mg = GI.filter((x) => x.group === 'mask_lewm' || x.group === 'mask_gawm');
  if (mg.length) {
    const keys = []; mg.forEach((x) => { const key = x.group + '|' + x.task; if (!keys.includes(key)) keys.push(key); });
    const label = (key) => { const [g, t] = key.split('|'); return (g === 'mask_lewm' ? 'LeWM · ' : 'GAWM · ') + t; };
    const foot = {
      mask_lewm: 'LeWM + LeNS-JEPA, training-time scorer (same checkpoints and frame rule as Figure 3: no masked object patch, 40–85% coverage). Left: input; right: masked patches in amber.',
      mask_gawm: 'GAWM + LeNS-JEPA at the reported checkpoint: frames whose mask covers at least 5% of the patches and none of the agent. Left: input; right: masked patches in amber.'};
    const show = (key) => {
      const L = mg.filter((x) => x.group + '|' + x.task === key);
      $('#maskGrid').innerHTML = L.map((x) => `<figure><img src="static/images/gallery/${x.file}" alt="mask"><figcaption><span>frame ${x.cohort_index}</span><span>${x.coverage_pct !== undefined ? 'mask ' + Number(x.coverage_pct).toFixed(1) + '%' : ''}</span></figcaption></figure>`).join('');
      $$('#maskGrid img').forEach((im) => im.addEventListener('click', () => { const lb = $('#lightbox'); lb.querySelector('img').src = im.src; lb.classList.add('open'); }));
      const g = key.split('|')[0], t = key.split('|')[1];
      $('#maskGalFoot').textContent = foot[g] + (t === 'Reacher' ? ' The Reacher arm is orange; the amber tint marks only background patches here.' : '');
    };
    seg($('#maskGalSeg'), keys.map((k) => [k, label(k)]), keys[0], show);
    show(keys[0]);
  }
  /* ---- video gallery ---- */
  const grid = $('#galGrid');
  if (!grid) return;
  if (!GV.length) { grid.innerHTML = '<div class="demo-empty" style="grid-column:1/-1;color:#8f8aa8">Videos are being rendered.</div>'; return; }
  const MODELS = [['all', 'All models'], ['lewm', 'LeWM'], ['gawm', 'GAWM'], ['smwm', 'SMWM']].filter(([k]) => k === 'all' || GV.some((c) => c.base === k));
  const TASKS = [['all', 'All tasks'], ['tworoom', 'TwoRoom'], ['pusht', 'PushT'], ['reacher', 'Reacher']];
  const KINDS = [['success', 'Successes'], ['severity', 'Stronger shifts'], ['clean', 'InD'], ['failure', 'Failure cases']].filter(([k]) => GV.some((c) => c.kind === k));
  const st = { model: 'all', task: 'all', kind: 'success' };
  const NAME = { lewm: 'LeWM', gawm: 'GAWM', smwm: 'SMWM' };
  const TN = { tworoom: 'TwoRoom', pusht: 'PushT', reacher: 'Reacher' };
  const SN = { gray: 'Gray', hue: 'Hue', blur: 'Blur', noise: 'Noise', cb: 'Color–brightness', clean: 'InD' };
  function render() {
    const L = GV.filter((c) => (st.model === 'all' || c.base === st.model) && (st.task === 'all' || c.task === st.task) && c.kind === st.kind);
    $('#galCount').textContent = `${L.length} clip${L.length === 1 ? '' : 's'}`;
    grid.innerHTML = L.map((c, i) => {
      const cond = c.strength ? c.strength : (SN[c.shift] || c.shift || '');
      const ok = c.ours_success ? `<span class="tag ok">+ LeNS-JEPA ✓${c.ours_step ? ' ' + c.ours_step : ''}</span>` : '<span class="tag bad">+ LeNS-JEPA ✗</span>';
      const bk = c.base_success ? `<span class="tag ok">${NAME[c.base]} ✓${c.base_step ? ' ' + c.base_step : ''}</span>` : `<span class="tag bad">${NAME[c.base]} ✗</span>`;
      return `<div class="gtile" data-i="${i}"><div class="media"><img loading="lazy" src="${c.poster}" alt=""><div class="play"><span>▶</span></div></div>` +
        `<div class="meta"><b>${TN[c.task] || c.task} · ${cond}</b><span class="tag model">${NAME[c.base]}</span>${bk}${ok}</div></div>`;
    }).join('') || '<div class="demo-empty" style="grid-column:1/-1;color:#8f8aa8">No clip for this filter.</div>';
    $$('.gtile', grid).forEach((t) => {
      const c = L[+t.dataset.i], media = $('.media', t);
      t.addEventListener('mouseenter', () => { if (!$('video', media)) { const v = document.createElement('video'); v.src = c.src; v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true; media.appendChild(v); v.play().catch(() => {}); } });
      t.addEventListener('mouseleave', () => { const v = $('video', media); if (v) v.remove(); });
      t.addEventListener('click', () => openModal(c));
    });
  }
  function openModal(c) {
    const m = $('#vmodal'), v = $('#vplayer');
    v.src = c.src; v.poster = c.poster; m.classList.add('open'); v.play().catch(() => {});
    const sr = (c.sr_base !== undefined && c.sr_base !== null) ? `<span class="tag model">All 50 queries: ${NAME[c.base]} ${c.sr_base}% · + LeNS-JEPA ${c.sr_ours}%</span>` : '';
    $('#vinfo').innerHTML = `<b>${TN[c.task] || c.task} · ${c.strength || SN[c.shift] || ''}</b> ${sr} <span style="opacity:.75">test query #${c.test_index}${c.rule ? ' · ' + c.rule : ''}</span>`;
  }
  const close = () => { $('#vmodal').classList.remove('open'); $('#vplayer').pause(); };
  $('#vclose').addEventListener('click', close);
  $('#vmodal').addEventListener('click', (e) => { if (e.target.id === 'vmodal') close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  seg($('#galModel'), MODELS, st.model, (k) => { st.model = k; render(); });
  seg($('#galTask'), TASKS, st.task, (k) => { st.task = k; render(); });
  seg($('#galKind'), KINDS, st.kind, (k) => { st.kind = k; render(); });
  render();
})();
