(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const GI = (window.GALLERY_IMAGES && window.GALLERY_IMAGES.images) || [];
  const allClips = (window.GALLERY_VIDEOS && window.GALLERY_VIDEOS.clips) || [];
  const GV = allClips.filter((clip) => clip.kind !== 'failure' && clip.ours_success);
  let previousModalFocus = null;
  function seg(root, items, cur, onPick) {
    root.innerHTML = items.map(([k, l]) => `<button type="button" data-k="${k}" aria-pressed="${k === cur}" class="${k === cur ? 'on' : ''}">${l}</button>`).join('');
    $$('button', root).forEach((b) => b.addEventListener('click', () => { $$('button', root).forEach((x) => { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); }); b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); onPick(b.dataset.k); }));
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
  const mg = GI.filter((x) => x.group === 'mask_lewm');
  if (mg.length && $('#maskGalSeg')) {
    const keys = []; mg.forEach((x) => { const key = x.group + '|' + x.task; if (!keys.includes(key)) keys.push(key); });
    const label = (key) => key.split('|')[1];
    const caption = 'Selected validation-frame examples from LeWM + LeNS-JEPA. The input is on the left. Masked patches appear in amber on the right.';
    const show = (key) => {
      const L = mg.filter((x) => x.group + '|' + x.task === key);
      $('#maskGrid').innerHTML = L.map((x) => `<figure><img src="static/images/gallery/${x.file}" alt="mask"><figcaption><span>frame ${x.cohort_index}</span><span>${x.coverage_pct !== undefined ? 'mask ' + Number(x.coverage_pct).toFixed(1) + '%' : ''}</span></figcaption></figure>`).join('');
      $$('#maskGrid img').forEach((im) => im.addEventListener('click', () => { const lb = $('#lightbox'); lb.querySelector('img').src = im.src; lb.classList.add('open'); }));
      $('#maskGalFoot').textContent = caption;
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
  const KINDS = [['success', 'Successes'], ['severity', 'Stronger shifts'], ['clean', 'InD']].filter(([k]) => GV.some((c) => c.kind === k));
  const pageSize = 18;
  const st = { model: 'all', task: 'all', kind: 'success', limit: pageSize };
  const NAME = { lewm: 'LeWM', gawm: 'GAWM', smwm: 'SMWM' };
  const TN = { tworoom: 'TwoRoom', pusht: 'PushT', reacher: 'Reacher' };
  const SN = { gray: 'Gray', hue: 'Hue', blur: 'Blur', noise: 'Noise', cb: 'Color–brightness', clean: 'InD' };
  const playback = window.LENS_PLAYBACK;
  function makeTile(c, featured) {
    const cond = c.strength || SN[c.shift] || c.shift || '';
    const tile = document.createElement('div');
    tile.className = 'gtile';
    tile.tabIndex = 0;
    tile.setAttribute('role', 'button');
    tile.setAttribute('aria-label', `Open ${NAME[c.base]} and LeNS-JEPA comparison on ${TN[c.task]} under ${cond}`);
    tile.dataset.src = c.src;
    const ours = `<span class="tag ok">+ LeNS-JEPA: goal${c.ours_step ? ' at ' + c.ours_step : ''}</span>`;
    const base = `<span class="tag ${c.base_success ? 'ok' : 'bad'}">${NAME[c.base]}: ${c.base_success ? 'goal' + (c.base_step ? ' at ' + c.base_step : '') : 'no goal'}</span>`;
    tile.innerHTML = `<div class="media"><video data-src="${c.src}" poster="${c.poster}" muted loop playsinline preload="none" aria-hidden="true"></video><span class="open-label">Open video</span></div>` +
      `<div class="meta"><b>${TN[c.task]} · ${cond}</b>${featured ? '' : `<span class="tag model">${NAME[c.base]}</span>`}${base}${ours}</div>`;
    playback.observe($('video', tile));
    tile.addEventListener('click', () => openModal(c));
    tile.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openModal(c); } });
    return tile;
  }
  function renderFeatured() {
    const host = $('#featuredComparisons');
    if (!host) return;
    ['lewm', 'smwm', 'gawm'].forEach((base) => {
      const row = document.createElement('div');
      row.className = 'featured-base';
      row.innerHTML = `<h3>${NAME[base]} <span>with and without LeNS-JEPA</span></h3><div class="gal-grid featured-grid"></div>`;
      TASKS.filter(([task]) => task !== 'all').forEach(([task]) => {
        // Use the first existing success entry, preserving the recorded query and clip.
        const clip = GV.find((c) => c.base === base && c.task === task && c.kind === 'success');
        if (clip) $('.featured-grid', row).appendChild(makeTile(clip, true));
      });
      host.appendChild(row);
    });
  }
  function render() {
    $$('video', grid).forEach((video) => playback.unobserve(video));
    const L = GV.filter((c) => (st.model === 'all' || c.base === st.model) && (st.task === 'all' || c.task === st.task) && c.kind === st.kind);
    const visible = L.slice(0, st.limit);
    $('#galCount').textContent = `${visible.length} of ${L.length} selected clip${L.length === 1 ? '' : 's'}`;
    $('#galleryMore').hidden = visible.length >= L.length;
    grid.replaceChildren();
    visible.forEach((clip) => grid.appendChild(makeTile(clip, false)));
    if (!visible.length) grid.innerHTML = '<div class="demo-empty" style="grid-column:1/-1;color:#8f8aa8">No clip for this filter.</div>';
  }
  function openModal(c) {
    const m = $('#vmodal'), v = $('#vplayer');
    previousModalFocus = document.activeElement;
    m.setAttribute('aria-hidden', 'false');
    $$('video').forEach((video) => video.pause());
    v.src = c.src; v.poster = c.poster; m.classList.add('open'); v.play().catch(() => {});
    v.setAttribute('aria-label', `${NAME[c.base]} and LeNS-JEPA planning on ${TN[c.task]} under ${SN[c.shift] || c.strength || ''}`);
    $('#vclose').focus();
    const sr = (c.sr_base !== undefined && c.sr_base !== null) ? `<span class="tag model">All 50 queries: ${NAME[c.base]} ${c.sr_base}% · + LeNS-JEPA ${c.sr_ours}%</span>` : '';
    $('#vinfo').innerHTML = `<b>${TN[c.task] || c.task} · ${c.strength || SN[c.shift] || ''}</b> ${sr}<details class="clip-details"><summary>Recorded rollout details</summary><span>Test query #${c.test_index}${c.rule ? ' · ' + c.rule : ''}. Recorded actions replayed in the simulator.</span></details>`;
  }
  const close = () => { if (!$('#vmodal.open')) return; $('#vmodal').classList.remove('open'); $('#vmodal').setAttribute('aria-hidden', 'true'); $('#vplayer').pause(); playback.resumeVisible(); if (previousModalFocus && previousModalFocus.isConnected) previousModalFocus.focus(); };
  $('#vclose').addEventListener('click', close);
  $('#vmodal').addEventListener('click', (e) => { if (e.target.id === 'vmodal') close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  $('#galleryMore').addEventListener('click', () => { st.limit += pageSize; render(); });
  seg($('#galModel'), MODELS, st.model, (k) => { st.model = k; st.limit = pageSize; render(); });
  seg($('#galTask'), TASKS, st.task, (k) => { st.task = k; st.limit = pageSize; render(); });
  seg($('#galKind'), KINDS, st.kind, (k) => { st.kind = k; st.limit = pageSize; render(); });
  renderFeatured();
  render();
})();
