  const exitIdx = () => (ui.exitStage == null || ui.exitStage >= model.stages.length ? model.stages.length - 1 : ui.exitStage);
  function exitScale(st) {
    const post = st.round ? st.round.preMoney + st.round.raise : st.total;
    const totalPref = sum(st.rows, r => r.pref);
    const cp = E.conversionPoint(st.rows, state.seniority, Math.max(post, totalPref) * 50);
    const xmax = niceCeil(Math.max(post * 2.5, totalPref * 3, cp ? cp * 1.25 : 0, 1e6));
    return { post, totalPref, cp, xmax };
  }
  function viewExit() {
    const stages = model.stages, si = exitIdx(), st = stages[si];
    const sc = exitScale(st);
    if (ui.exit == null || !isFinite(ui.exit)) ui.exit = Math.round(sc.post * 1.5 / 1e6) * 1e6 || 1e6;
    const ex = ui.exit;
    const pos = Math.round(Math.sqrt(Math.min(1, ex / sc.xmax)) * 1000);
    let h = stages.length > 1 ? stageChips(si, 'xstage', 1) : '';
    h += `<div class="exit-ctl"><div><label class="field" for="exitRange"><span>Exit value ${q('exit')}</span></label>
        <input type="range" id="exitRange" min="0" max="1000" step="1" value="${pos}">
        <div class="scale"><span>$0</span><span>${money(sc.xmax / 4)}</span><span>${money(sc.xmax)}</span></div></div>
      <div><div class="big2" id="exitBig">${money(ex)}</div><label class="field" style="margin-top:6px"><span>Type an exit</span><input class="num" type="text" id="exitInput" inputmode="decimal" value="${esc(moneyInput(ex))}" autocomplete="off"></label></div></div>`;
    h += `<div id="exitBody" style="display:flex;flex-direction:column;gap:18px">${exitBody(st, sc)}</div>`;
    return h;
  }
  function exitBody(st, sc) {
    const rows = st.rows, sen = state.seniority, ex = ui.exit;
    const w = E.waterfall(rows, ex, sen);
    const keys = ORDER.filter(k => k !== 'pool' && rows.some(r => gkey(r) === k && r.shares > 0));
    let h = `<div class="chart-card"><h3>Who gets what share of the proceeds</h3><p class="hint">Each band is a holder group's slice of the exit. Where investor bands swell on the left, preferences pay them ahead of ownership. Hover for dollars.</p>
      ${shareChart(rows, sc.xmax, sen, ex, sc.cp, keys)}${legendFor(keys)}</div>`;
    const parts = w.parts;
    const totSh = sum(parts, r => r.shares);
    const sorted = [...parts].sort((a, b) => ORDER.indexOf(gkey(a)) - ORDER.indexOf(gkey(b)));
    h += `<div class="table-wrap"><table class="ledger"><thead><tr><th>Holder</th><th>As-converted</th><th>Payout</th><th>Share of exit</th><th>vs ownership</th><th>Multiple</th><th>Treatment</th></tr></thead><tbody>`;
    sorted.forEach(r => {
      const p = w.pay[r.id], f = r.shares / totSh, sh = ex > 0 ? p / ex : 0, d = sh - f;
      const m = r.rank >= 0 && state.rounds[r.rank] ? +state.rounds[r.rank].multiple || 1 : 1;
      const treat = r.pref > 0 ? (r.part ? (w.converted.has(r.id) ? 'Converts to common (above cap)' : `${m}x pref, then participates${r.capAmt > 0 ? ' to a ' + trim(r.capAmt / (r.inst ? r.inst.convAmount : r.invested), 1) + 'x cap' : ''}`) : w.converted.has(r.id) ? 'Converts to common' : `Takes ${m}x preference`) : 'Common';
      h += `<tr><td><span class="who"><span class="sw" style="background:${COLOR[gkey(r)]}"></span>${esc(r.label)}</span></td><td>${pct(f, 2)}</td><td>${money(p)}</td><td>${pct(sh, 2)}</td>
        <td>${Math.abs(d) < 5e-5 ? '0.0' : `<span class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : '−'}${(Math.abs(d) * 100).toFixed(1)}</span>`}</td>
        <td>${r.invested ? (p / r.invested).toFixed(2) + 'x' : ''}</td><td style="font-family:var(--font-body)">${treat}</td></tr>`;
    });
    h += `</tbody><tfoot><tr><td>Total</td><td>100.00%</td><td>${money(ex)}</td><td>100.00%</td><td></td><td></td><td></td></tr></tfoot></table></div>`;
    h += '<div class="insights">' + exitInsights(st, w, ex, sc.totalPref, sc.cp) + '</div>';
    return h;
  }
  function refreshExitBody() {
    clearScope('view'); scope = 'view';
    const st = model.stages[exitIdx()];
    $('#exitBody').innerHTML = exitBody(st, exitScale(st));
    $('#exitBig').textContent = money(ui.exit);
    courseCheck();
  }

  function exitInsights(st, w, ex, totalPref, cp) {
    const out = [], rows = st.rows, parts = w.parts;
    const totSh = sum(parts, r => r.shares);
    const fr = parts.filter(r => r.group === 'founder');
    const fp = sum(fr, r => w.pay[r.id]), fown = sum(fr, r => r.shares) / totSh;
    if (ex > 0) out.push(ins(`At a ${money(ex)} exit, founders take home <b>${money(fp)}</b>: ${pct(fp / ex)} of proceeds against ${pct(fown)} as-converted ownership.`, fp / ex < fown - 0.005 ? 'warn' : '', '$'));
    if (totalPref > 0) {
      const common = sum(parts.filter(r => r.pref === 0), r => w.pay[r.id]);
      out.push(ins(ex < totalPref
        ? `Investors hold <b>${money(totalPref)}</b> in liquidation preferences, more than this exit. Common shareholders, including founders and employees, get ${money(common)}.${state.seniority !== 'pari' ? ' Newest money is paid first, so the earliest investors, often SAFE holders, are last in line.' : ''}`
        : `Investors hold <b>${money(totalPref)}</b> in liquidation preferences. ${w.converted.size ? `At this exit ${w.converted.size} of ${parts.filter(r => r.pref > 0 && !r.part).length} preferred holdings would rather convert to common.` : 'At this exit every preferred holder takes its preference instead of converting.'}`, ex < totalPref ? 'crit' : '', 'L'));
    }
    if (cp) out.push(ins(`Above <b>${money(cp)}</b>, every investor is better off converting to common and payouts match ownership. Below it, preferences tilt proceeds toward investors.`, '', '→'));
    const partRows = parts.filter(r => r.part && r.pref > 0 && !w.converted.has(r.id));
    if (partRows.length) {
      const alt = rows.map(r => Object.assign({}, r, r.part ? { part: false, capAmt: 0, pref: r.inst ? r.inst.convAmount : r.invested } : {}));
      const wa = E.waterfall(alt, ex, state.seniority);
      const diff = sum(partRows, r => w.pay[r.id] - wa.pay[r.id]);
      out.push(ins(`${partRows.some(r => r.capAmt > 0) ? 'Capped participating preferred only converts once its cap is hit.' : 'Uncapped participating preferred never converts.'} ${[...new Set(partRows.map(r => esc(r.roundName)))].join(', ')} investors take their preference and then a pro-rata share on top. At this exit that moves <b>${money(diff)}</b> from everyone else to them, compared with standard 1x non-participating terms.`, 'crit', '!'));
    }
    const opt = parts.filter(r => r.group === 'options');
    if (opt.length && ex > 0) out.push(ins(`Employees with granted options receive ${money(sum(opt, r => w.pay[r.id]))} before paying their strike prices. The unallocated pool gets nothing, which is why it counts in ownership but not in payouts.`, '', 'E'));
    return out.join('');
  }
