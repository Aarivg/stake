  /* ---------- groups & colors ---------- */
  const ORDER = ['founder', 'safe', 'r0', 'r1', 'r2', 'rL', 'options', 'common', 'pool'];
  const ROUND_NAMES = ['Seed', 'Series A', 'Series B', 'Series C', 'Series D', 'Series E', 'Series F', 'Series G'];
  const MAX_ROUNDS = 8;
  const COLOR = { founder: 'var(--s1)', safe: 'var(--s2)', r0: 'var(--s3)', r1: 'var(--s4)', r2: 'var(--s5)', rL: 'var(--s8)', options: 'var(--s6)', common: 'var(--s7)', pool: 'var(--pool)' };
  const rkey = i => (i < 3 ? 'r' + i : 'rL');
  const gkey = r => r.group === 'investor' ? rkey(r.rank) : r.group;
  function glabel(k) {
    if (k === 'rL') { const r = state.rounds[3]; return (r && r.name ? r.name : 'Later round') + (state.rounds.length > 4 ? '+ investors' : ' investors'); }
    if (k[0] === 'r' && k.length === 2) { const r = state.rounds[+k.slice(1)]; return (r && r.name ? r.name : 'Round') + ' investors'; }
    return { founder: 'Founders', safe: 'SAFEs & notes', options: 'Employee options', common: 'Other common', pool: 'Unallocated pool' }[k];
  }
  function agg(stage) {
    const m = {};
    stage.rows.forEach(r => { const k = gkey(r); m[k] = (m[k] || 0) + r.shares; });
    return m;
  }
  const founderShare = st => sum(st.rows.filter(r => r.group === 'founder'), r => r.shares) / st.total;
  const roundColor = i => COLOR[rkey(i)];

  /* ---------- tooltip & hover ---------- */
  const tip = $('#tip');
  const hovers = {};
  let hid = 0, scope = 'view';
  const reg = (id, fn) => { fn.scope = scope; hovers[id] = fn; };
  const clearScope = sc => { for (const k in hovers) if (hovers[k].scope === sc) delete hovers[k]; };
  function showTip(html, x, y) {
    tip.innerHTML = html; tip.classList.add('on');
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let L = x + 16, T = y + 16;
    if (L + w > innerWidth - 8) L = x - w - 16;
    if (T + h > innerHeight - 8) T = y - h - 16;
    tip.style.left = Math.max(8, L) + 'px'; tip.style.top = Math.max(8, T) + 'px';
  }
  function hideTip() {
    tip.classList.remove('on');
    document.querySelectorAll('.xh').forEach(l => l.setAttribute('opacity', 0));
  }
  document.addEventListener('pointermove', e => {
    const t = e.target.closest && e.target.closest('[data-hover]');
    if (!t || !hovers[t.dataset.hover]) { hideTip(); return; }
    const html = hovers[t.dataset.hover](e, t);
    if (html) showTip(html, e.clientX, e.clientY); else hideTip();
  });
  addEventListener('scroll', hideTip, { passive: true });
  const tipLine = (color, label, val) => `<div class="l"><span class="sw" style="background:${color}"></span><span>${esc(label)}</span><span>${val}</span></div>`;
