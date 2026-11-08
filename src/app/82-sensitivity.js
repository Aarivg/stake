  /* ---------- sensitivity table (Pro) ---------- */
  const RAMP = ['#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95'];
  function sensValues(vdef) {
    const t = seekTarget(state, vdef.key); const cur = t ? +t.obj[t.field] || 0 : 0;
    if (vdef.kind === 'pct') return [...new Set([-6, -4, -2, 0, 2, 4, 6].map(d => Math.max(0, Math.round((cur + d) * 10) / 10)))];
    const base = cur > 0 ? cur : 1e6;
    return [0.5, 0.67, 0.8, 1, 1.25, 1.5, 2].map(f => { const v = base * f; const p = Math.pow(10, Math.floor(Math.log10(v)) - 1); return Math.round(v / p) * p; }).map((v, i) => (i === 3 && cur > 0 ? cur : v));
  }
  function sensCard() {
    if (!state.rounds.length) return '';
    const vars = seekVars(); if (vars.length < 2) return '';
    const sn = ui.sens || (ui.sens = {});
    const firstR = state.rounds[0];
    if (!vars.some(v => v.key === sn.row)) sn.row = (vars.find(v => v.key.startsWith('i:') && v.key.endsWith(':cap')) || vars[0]).key;
    if (!vars.some(v => v.key === sn.col) || sn.col === sn.row) sn.col = (vars.find(v => v.key === `r:${firstR.id}:preMoney` && v.key !== sn.row) || vars.find(v => v.key !== sn.row)).key;
    const rid = sn.roundId != null && state.rounds.some(r => String(r.id) === String(sn.roundId)) ? String(sn.roundId) : String(state.rounds[state.rounds.length - 1].id);
    const metric = sn.metric || 'own';
    const vr = vars.find(v => v.key === sn.row), vc = vars.find(v => v.key === sn.col);
    const rows = sensValues(vr), cols = sensValues(vc);
    const tr = seekTarget(state, vr.key), tc = seekTarget(state, vc.key);
    const curR = tr ? +tr.obj[tr.field] || 0 : 0, curC = tc ? +tc.obj[tc.field] || 0 : 0;
    const fmtV = (v, d) => d.kind === 'pct' ? trim(v, 1) + '%' : money(v);
    const grid = rows.map(rv => cols.map(cv => {
      const st = clone(state); const a = seekTarget(st, vr.key), b = seekTarget(st, vc.key);
      a.obj[a.field] = rv; b.obj[b.field] = cv;
      const m = E.buildStages(st); const stg = m.stages.find(x => x.round && String(x.round.id) === rid);
      if (!stg) return NaN;
      if (metric === 'value') return sum(stg.rows.filter(r => r.group === 'founder'), r => r.shares) * stg.pps;
      return founderShare(stg);
    }));
    const flat = grid.flat().filter(isFinite);
    const lo = Math.min(...flat), hi = Math.max(...flat);
    const color = v => { if (!isFinite(v)) return 'background:var(--band);color:var(--muted)'; const k = hi > lo ? Math.round((v - lo) / (hi - lo) * (RAMP.length - 1)) : 5; return `background:${RAMP[k]};color:${k >= 6 ? '#fff' : '#0b0b0b'}`; };
    const fmtCell = v => !isFinite(v) ? '—' : metric === 'value' ? money(v) : pct(v);
    const rname = (state.rounds.find(r => String(r.id) === rid) || {}).name;
    const opt = (sel) => vars.map(v => `<option value="${v.key}"${v.key === sel ? ' selected' : ''}>${esc(v.label)}</option>`).join('');
    let h = `<div class="chart-card pro-only" id="sensCard"><h3>Sensitivity table</h3><p class="hint">See how two terms move founder outcomes together. Your current numbers are outlined; darker means better for founders.</p>
      <div class="sens-ctl">
        <label class="field"><span>Show</span><select id="sensM"><option value="own"${metric === 'own' ? ' selected' : ''}>Founder ownership</option><option value="value"${metric === 'value' ? ' selected' : ''}>Founder stake on paper</option></select></label>
        <label class="field"><span>After the</span><select id="sensRound">${state.rounds.map(r => `<option value="${r.id}"${String(r.id) === rid ? ' selected' : ''}>${esc(r.name)}</option>`).join('')}</select></label>
        <label class="field"><span>Rows</span><select id="sensRow">${opt(sn.row)}</select></label>
        <label class="field"><span>Columns</span><select id="sensCol">${opt(sn.col)}</select></label>
      </div>
      <div class="table-wrap" style="border:0;background:none"><table class="sens"><caption class="sr">${esc(metric === 'value' ? 'Founder stake value' : 'Founder ownership')} after the ${esc(rname)} by ${esc(vr.label)} and ${esc(vc.label)}</caption>
      <thead><tr><th class="rowh"><span class="sens-axis">${esc(vr.label)} ↓ · ${esc(vc.label)} →</span></th>${cols.map(c => `<th scope="col">${fmtV(c, vc)}</th>`).join('')}</tr></thead><tbody>`;
    rows.forEach((rv, i) => {
      h += `<tr><th scope="row" class="rowh">${fmtV(rv, vr)}</th>${cols.map((cv, j) => `<td class="${Math.abs(rv - curR) < 1e-9 && Math.abs(cv - curC) < 1e-9 ? 'cur' : ''}" style="${color(grid[i][j])}">${fmtCell(grid[i][j])}</td>`).join('')}</tr>`;
    });
    h += '</tbody></table></div></div>';
    return h;
  }
