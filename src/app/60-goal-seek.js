  /* ---------- goal seek ---------- */
  function seekVars() {
    const v = [];
    state.rounds.forEach(r => {
      v.push({ key: `r:${r.id}:preMoney`, label: `${r.name} pre-money`, kind: 'money' });
      v.push({ key: `r:${r.id}:raise`, label: `${r.name} amount raised`, kind: 'money' });
      v.push({ key: `r:${r.id}:poolPct`, label: `${r.name} pool target`, kind: 'pct' });
    });
    state.instruments.forEach(x => {
      if (x.kind !== 'mfn') v.push({ key: `i:${x.id}:cap`, label: `${x.name} cap`, kind: 'money' });
      v.push({ key: `i:${x.id}:amount`, label: `${x.name} amount`, kind: 'money' });
    });
    return v;
  }
  function seekTarget(st, key) {
    const [t, id, field] = key.split(':');
    const obj = (t === 'r' ? st.rounds : st.instruments).find(x => String(x.id) === id);
    return obj ? { obj, field } : null;
  }
  function solveSeek() {
    const sk = ui.seek, vars = seekVars();
    const vdef = vars.find(v => v.key === sk.varKey) || vars[0];
    if (!vdef) return { msg: 'Add a round or a SAFE first.' };
    const rid = sk.roundId != null && state.rounds.some(r => String(r.id) === String(sk.roundId)) ? String(sk.roundId) : String(state.rounds[state.rounds.length - 1].id);
    const f = val => {
      const st = clone(state); const t = seekTarget(st, vdef.key); if (!t) return NaN;
      t.obj[t.field] = val;
      const m = E.buildStages(st);
      const stg = m.stages.find(x => x.round && String(x.round.id) === rid);
      return stg ? founderShare(stg) : NaN;
    };
    const isPct = vdef.kind === 'pct';
    const lo = isPct ? 0 : 1e4, hi = isPct ? 40 : 1e11;
    const map = u => isPct ? lo + (hi - lo) * u : Math.exp(Math.log(lo) + (Math.log(hi) - Math.log(lo)) * u);
    const target = sk.target / 100;
    const fl = f(map(0)), fh = f(map(1));
    if (!isFinite(fl) || !isFinite(fh)) return { msg: 'That round is skipped; give it a pre-money valuation first.' };
    const rname = (state.rounds.find(r => String(r.id) === rid) || {}).name;
    if (Math.abs(fh - fl) < 1e-6) return { msg: `Changing ${esc(vdef.label)} doesn't move founder ownership after the ${esc(rname)}. Pick a term from that round or earlier.` };
    const minF = Math.min(fl, fh), maxF = Math.max(fl, fh);
    if (target < minF || target > maxF) return { msg: `Changing ${esc(vdef.label)} alone can only land founders between ${pct(minF)} and ${pct(maxF)} after the ${esc(rname)}.` };
    let a = 0, b = 1;
    const inc = fh > fl;
    for (let i = 0; i < 70; i++) { const m = (a + b) / 2; if ((f(map(m)) < target) === inc) a = m; else b = m; }
    let val = map(inc ? b : a);
    const sig = (v, up) => { if (isPct) return (up ? Math.ceil(v * 10) : Math.floor(v * 10)) / 10; const p = Math.pow(10, Math.floor(Math.log10(v)) - 2); return (up ? Math.ceil(v / p) : Math.floor(v / p)) * p; };
    val = sig(val, inc);
    const fmt = isPct ? trim(val, 1) + '%' : money(val);
    return { val, vdef, html: `Set <b>${esc(vdef.label)}</b> ${inc ? 'to at least' : 'to at most'} <b>${fmt}</b> to keep founders at ${pct(f(val))} after the ${esc(rname)}.` };
  }
  function seekCard() {
    if (!state.rounds.length) return '';
    const vars = seekVars();
    const sk = ui.seek;
    if (!vars.some(v => v.key === sk.varKey)) sk.varKey = (vars.find(v => v.key.endsWith(':cap')) || vars[0]).key;
    const rid = sk.roundId != null && state.rounds.some(r => String(r.id) === String(sk.roundId)) ? String(sk.roundId) : String(state.rounds[state.rounds.length - 1].id);
    return `<div class="chart-card seek"><h3>Goal seek</h3><p class="hint">Work backwards from the ownership you want to keep.</p>
      <div class="seek-row">
        <label class="field w-pct"><span>Founders keep</span><input class="num" type="text" id="seekT" inputmode="decimal" value="${trim(sk.target, 2)}%" autocomplete="off"></label>
        <label class="field w-sel"><span>After the</span><select id="seekR">${state.rounds.map(r => `<option value="${r.id}"${String(r.id) === rid ? ' selected' : ''}>${esc(r.name)}</option>`).join('')}</select></label>
        <label class="field w-sel"><span>By changing</span><select id="seekV">${vars.map(v => `<option value="${v.key}"${v.key === sk.varKey ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}</select></label>
        <button class="btn solid" type="button" id="seekGo">Solve</button>
      </div><div class="seek-out" id="seekOut"></div></div>`;
  }
  let lastSeek = null;
  function runSeek() {
    const r = solveSeek(); lastSeek = r;
    const out = $('#seekOut'); if (!out) return;
    out.innerHTML = r.html ? `<span>${r.html}</span><button class="btn small" type="button" id="seekApply">Apply this</button>` : `<span>${r.msg}</span>`;
  }
