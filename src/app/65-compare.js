  /* ---------- compare ---------- */
  const CMP_COLORS = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)'];
  function cmpEntries() {
    const all = [{ key: 'cur', name: `Current: ${currentName()}${dirty ? ' (edited)' : ''}`, state }].concat(saved.filter(x => x.id !== state.savedId || dirty).map(x => ({ key: 's:' + x.id, name: x.name, state: x.state })));
    if (!ui.cmp) ui.cmp = all.slice(0, 4).map(e => e.key);
    ui.cmp = ui.cmp.filter(k => all.some(e => e.key === k));
    if (!ui.cmp.length) ui.cmp = ['cur'];
    return all;
  }
  function metricsFor(st, exit) {
    const m = E.buildStages(st), stages = m.stages, L = stages[stages.length - 1];
    const firstP = stages[1];
    const fsh = sum(L.rows.filter(r => r.group === 'founder'), r => r.shares);
    const w = E.waterfall(L.rows, exit, st.seniority || 'standard');
    const fp = sum(w.parts.filter(r => r.group === 'founder'), r => w.pay[r.id]);
    const post = L.round ? L.round.preMoney + L.round.raise : null;
    const R = E.runway(st.runway);
    return {
      stages, L,
      raised: sum(st.instruments, x => x.amount || 0) + sum(st.rounds.filter(r => r.preMoney > 0), r => r.raise || 0),
      fToday: founderShare(stages[0]), fFirst: firstP ? founderShare(firstP) : null, fEnd: founderShare(L),
      fValue: post ? fsh * L.pps : null, post, pps: L.pps,
      investors: sum(L.rows.filter(r => r.group === 'investor' || r.group === 'safe'), r => r.shares) / L.total,
      takeHome: fp, takeShare: exit > 0 ? fp / exit : 0,
      runway: R.base.runway, alive: R.alive, endName: L.name
    };
  }
  function compareChart(list) {
    const W = 640, H = 260, ml = 44, mr = 16, mt = 16, mb = 30;
    const iw = W - ml - mr, ih = H - mt - mb;
    const n = Math.max(...list.map(e => e.m.stages.length));
    const x = i => ml + (n > 1 ? (i / (n - 1)) * iw : iw / 2), y = v => mt + ih - v * ih;
    const id = 'h' + (++hid);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Founder ownership by stage for each scenario"><g class="grid">`;
    [0, .25, .5, .75, 1].forEach(v => { s += `<line x1="${ml}" x2="${W - mr}" y1="${y(v)}" y2="${y(v)}"/><text x="${ml - 8}" y="${y(v) + 4}" text-anchor="end">${v * 100}%</text>`; });
    for (let i = 0; i < n; i++) s += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${i === 0 ? 'Today' : 'Round ' + i}</text>`;
    s += '</g>';
    list.forEach((e, k) => {
      const pts = e.m.stages.map((st, i) => [x(i), y(founderShare(st))]);
      s += `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${e.color}" stroke-width="2" stroke-linejoin="round"/>`;
      pts.forEach((p, i) => { s += `<circle cx="${p[0]}" cy="${p[1]}" r="4.5" fill="${e.color}" stroke="var(--sheet)" stroke-width="2" data-hover="${id}" data-k="${k}" data-i="${i}" style="cursor:pointer"/>`; });
    });
    s += '</svg>';
    reg(id, (ev, t) => {
      const e = list[+t.dataset.k], st = e.m.stages[+t.dataset.i];
      return `<div class="t">${esc(e.name)}</div>` + tipLine(e.color, st.name, pct(founderShare(st)) + (st.pps ? ' · ' + price(st.pps) + '/sh' : ''));
    });
    return s;
  }
  function viewCompare() {
    const all = cmpEntries();
    if (ui.cmpExit == null) { const m = metricsFor(state, 0); ui.cmpExit = m.post ? Math.round(m.post * 2 / 1e6) * 1e6 : 50e6; }
    const ex = ui.cmpExit;
    let h = `<div class="chart-card"><h3>Pick up to four scenarios</h3><p class="hint">Save variations of your plan (another SAFE first, a bigger seed, a higher cap) and line them up here.</p>
      <div class="cmp-pick">${all.map(e => { const on = ui.cmp.includes(e.key); const ci = ui.cmp.indexOf(e.key); return `<label><input type="checkbox" data-cmp="${esc(e.key)}"${on ? ' checked' : ''}${!on && ui.cmp.length >= 4 ? ' disabled' : ''}>${on ? `<span class="sw" style="background:${CMP_COLORS[ci]}"></span>` : ''}${esc(e.name)}</label>`; }).join('')}</div>
      ${saved.length ? '' : '<p class="hint" style="margin-top:10px">You have no saved scenarios yet. Edit the numbers, press Save scenario, then change something and save again as new.</p>'}</div>`;
    const list = ui.cmp.map((k, i) => { const e = all.find(a => a.key === k); return { name: e.name, color: CMP_COLORS[i], m: metricsFor(e.state, ex) }; });
    h += `<div class="chart-card"><h3>Founder ownership, stage by stage</h3><p class="hint">Hover a point for the round name and price.</p>${compareChart(list)}<ul class="legend">${list.map(e => `<li><span class="sw" style="background:${e.color}"></span>${esc(e.name)}</li>`).join('')}</ul></div>`;
    h += `<div class="exit-ctl" style="grid-template-columns:1fr"><label class="field" style="max-width:240px"><span>Compare take-home at an exit of</span><input class="num" type="text" id="cmpExit" inputmode="decimal" value="${esc(moneyInput(ex))}" autocomplete="off"></label></div>`;
    const rowsDef = [
      ['Total raised', e => money(e.m.raised), null],
      ['Priced rounds', e => String(e.m.stages.length - 1), null],
      ['Founders after first round', e => e.m.fFirst == null ? '—' : pct(e.m.fFirst), e => e.m.fFirst],
      ['Founders at the end', e => `${pct(e.m.fEnd)} <span class="note" style="display:inline;margin:0">after ${esc(e.m.endName)}</span>`, e => e.m.fEnd],
      ['Founder stake on paper', e => money(e.m.fValue), e => e.m.fValue],
      ['Last post-money', e => money(e.m.post), null],
      ['Last price per share', e => price(e.m.pps), null],
      ['Investors own', e => pct(e.m.investors), null],
      [`Founders take home at ${money(ex)}`, e => money(e.m.takeHome), e => e.m.takeHome],
      ['Founders’ share of that exit', e => pct(e.m.takeShare), e => e.m.takeShare],
      ['Runway without raising', e => e.m.runway == null ? '60+ mo' : e.m.runway.toFixed(1) + ' mo', e => e.m.runway == null ? 999 : e.m.runway],
      ['Default alive?', e => e.m.alive ? 'Yes' : 'No', null]
    ];
    h += `<div class="table-wrap"><table class="ledger cmp"><thead><tr><th>Metric</th>${list.map(e => `<th class="sc"><span class="who" style="justify-content:flex-end"><span class="sw" style="background:${e.color}"></span>${esc(e.name.length > 28 ? e.name.slice(0, 27) + '…' : e.name)}</span></th>`).join('')}</tr></thead><tbody>`;
    rowsDef.forEach(([label, fmt, score]) => {
      let best = -1;
      if (score && list.length > 1) { const sc = list.map(e => score(e)); const mx = Math.max(...sc.map(v => v == null ? -Infinity : v)); if (sc.filter(v => v === mx).length < list.length) best = sc.indexOf(mx); }
      h += `<tr><td>${esc(label)}</td>${list.map((e, i) => `<td class="${i === best ? 'best' : ''}">${fmt(e)}</td>`).join('')}</tr>`;
    });
    h += `</tbody></table></div><p class="hint" style="margin:0;font-size:12px;color:var(--muted)">Green marks the founder-friendliest value in each row.</p>`;
    if (saved.length) {
      h += `<div class="chart-card"><h3>Your saved scenarios</h3><p class="hint">Stored in this browser. Open one from the scenario menu at the top.</p><ul class="saved-list">${saved.map(x => `<li><span>${esc(x.name)} <span class="meta">· saved ${new Date(x.updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></span><span><button class="btn small" type="button" data-open="${x.id}">Open</button> <button class="btn small ghost" type="button" data-del="${x.id}">Delete</button></span></li>`).join('')}</ul></div>`;
    }
    return h;
  }
