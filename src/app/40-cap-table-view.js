  /* ---------- views ---------- */
  function stageChips(sel, act, fromIdx = 0) {
    return `<div class="chips"><span class="lbl">${act === 'stage' ? 'Show cap table' : 'Waterfall after'}</span>` + model.stages.map((s, i) => i < fromIdx ? '' : `<button class="chip" type="button" data-${act}="${i}" aria-pressed="${i === sel}">${esc(s.name)}</button>`).join('') + '</div>';
  }
  const ins = (html, cls = '', ic = 'i') => `<div class="ins ${cls}"><span class="ic" aria-hidden="true">${ic}</span><p>${html}</p></div>`;

  function viewCap() {
    const stages = model.stages;
    const si = ui.stage == null || ui.stage >= stages.length ? stages.length - 1 : ui.stage;
    const st = stages[si], prev = stages[si - 1];
    let h = stageChips(si, 'stage');
    // tiles
    if (st.res) {
      const r = st.round;
      h += `<div class="tiles">
        <div class="tile"><div class="k">Price per share</div><div class="v">${price(st.pps)}</div><div class="d">${shares(st.res.nNew)} new shares</div></div>
        <div class="tile"><div class="k">Pre → post</div><div class="v">${money(r.preMoney)} → ${money(r.preMoney + r.raise)}</div><div class="d">${money(r.raise)} raised</div></div>
        <div class="tile"><div class="k">Fully diluted</div><div class="v">${shares(st.total)}</div><div class="d">shares after the round</div></div>
        <div class="tile"><div class="k">Founders</div><div class="v">${pct(founderShare(st))}</div><div class="d">${prev ? '−' + pts(founderShare(prev) - founderShare(st)) + ' this round' : ''}</div></div></div>`;
    } else {
      const tot = sum(state.instruments, x => x.amount || 0);
      h += `<div class="tiles">
        <div class="tile"><div class="k">Fully diluted</div><div class="v">${shares(st.total)}</div><div class="d">shares and options</div></div>
        <div class="tile"><div class="k">Founders</div><div class="v">${pct(founderShare(st))}</div><div class="d">before conversions</div></div>
        <div class="tile"><div class="k">SAFEs &amp; notes</div><div class="v">${money(tot)}</div><div class="d">${state.instruments.length} outstanding, not yet shares</div></div></div>`;
    }
    // table
    const rows = [...st.rows].sort((a, b) => ORDER.indexOf(gkey(a)) - ORDER.indexOf(gkey(b)));
    const maxF = Math.max(...rows.map(r => r.shares / st.total));
    h += `<div class="table-wrap"><table class="ledger"><thead><tr><th>Holder</th><th>Shares</th><th>Ownership</th><th>Change</th>${st.pps ? '<th>Value</th><th>Invested</th><th>Multiple</th>' : ''}</tr></thead><tbody>`;
    rows.forEach(r => {
      const f = r.shares / st.total;
      const pr = prev && prev.rows.find(x => x.id === r.id);
      const dlt = !prev ? '' : pr ? (f - pr.shares / prev.total) : null;
      let note = '';
      if (r.group === 'safe') note = `${({ post: 'post-money SAFE', pre: 'pre-money SAFE', note: 'convertible note' })[r.inst.kind] || 'SAFE'}${r.inst.mfn ? ' (MFN)' : ''} · ${r.method === 'round' ? 'round price' : 'via ' + r.method} at ${price(r.price)}`;
      else if (r.group === 'investor') note = `bought at ${price(r.price)}`;
      else if (r.group === 'pool') note = 'reserved for future hires';
      const val = st.pps ? r.shares * st.pps : 0;
      h += `<tr><td><span class="who"><span class="sw" style="background:${COLOR[gkey(r)]}"></span>${esc(r.label)}</span>${note ? `<span class="note">${note}</span>` : ''}</td>
        <td>${shares(r.shares)}</td>
        <td>${pct(f, 2)}<span class="bar-cell" aria-hidden="true"><i style="width:${(f / maxF * 100).toFixed(1)}%;background:${COLOR[gkey(r)]}"></i></span></td>
        <td>${dlt === '' ? '' : dlt === null ? '<span class="up">new</span>' : Math.abs(dlt) < 5e-5 ? '0.0' : `<span class="${dlt > 0 ? 'up' : 'down'}">${dlt > 0 ? '+' : '−'}${(Math.abs(dlt) * 100).toFixed(1)}</span>`}</td>
        ${st.pps ? `<td>${money(val)}</td><td>${r.invested ? money(r.invested) : ''}</td><td>${r.invested ? (val / r.invested).toFixed(1) + 'x' : ''}</td>` : ''}</tr>`;
    });
    h += `</tbody><tfoot><tr><td>Total</td><td>${shares(st.total)}</td><td>100.00%</td><td></td>${st.pps ? `<td>${money(st.total * st.pps)}</td><td>${money(sum(rows, r => r.invested || 0))}</td><td></td>` : ''}</tr></tfoot></table></div>`;

    // decomposition
    if (st.res && (st.res.dPool > 0 || st.res.conv.length)) {
      const r = st.res, P = r.P;
      const ex = (r.base - r.dPool) * P, pl = r.dPool * P, cv = sum(r.conv, c => c.shares) * P;
      const tot = ex + pl + cv;
      const seg = (v, c, l) => v > 0 ? `<div style="flex:${v / tot};background:${c}" title="${esc(l)}">${v / tot > 0.14 ? esc(l) + ' ' + money(v) : ''}</div>` : '';
      h += `<div class="chart-card"><h3>Where the ${money(st.round.preMoney)} pre-money goes</h3><p class="hint">The headline pre-money pays for more than the existing shares.</p>
        <div class="decomp">${seg(ex, 'var(--s1)', 'Existing holders')}${seg(pl, 'var(--s6)', 'Pool top-up')}${seg(cv, 'var(--s2)', 'Conversions')}</div>
        <ul class="legend"><li><span class="sw" style="background:var(--s1)"></span>Existing holders ${money(ex)}</li>${pl > 0 ? `<li><span class="sw" style="background:var(--s6)"></span>Pool top-up ${money(pl)}</li>` : ''}${cv > 0 ? `<li><span class="sw" style="background:var(--s2)"></span>SAFE &amp; note conversions ${money(cv)}</li>` : ''}</ul></div>`;
    }
    h += '<div class="insights">' + capInsights(si) + '</div>';
    h += `<div class="adv" style="display:flex;flex-direction:column;gap:18px">${seekCard()}${sensCard()}</div>`;
    return h;
  }

  function noAdFounders(si) {
    const c = JSON.parse(JSON.stringify(state));
    c.rounds.forEach(r => { r.antiDilution = 'none'; });
    const m = E.buildStages(c);
    return founderShare(m.stages[si]);
  }
  function capInsights(si) {
    const stages = model.stages, st = stages[si], prev = stages[si - 1];
    const out = [];
    if (!st.res) {
      const posts = model.resolved.filter(s => s.kind === 'post' && s.cap > 0 && !s.mfn);
      const promised = sum(posts, s => s.convAmount / s.cap);
      if (promised > 0) out.push(ins(`Your post-money SAFEs already promise <b>${pct(promised)}</b> of the company to their holders. That slice is fixed, so each new SAFE dilutes the founders and leaves earlier SAFE holders untouched.`, '', '%'));
      const unc = model.resolved.filter(s => !(s.cap > 0));
      if (unc.length) out.push(ins(`${unc.map(s => esc(s.name)).join(', ')} ${unc.length > 1 ? 'have' : 'has'} no cap, so ${unc.length > 1 ? 'they convert' : 'it converts'} at the next round's price${unc.some(s => s.discount > 0) ? ' less any discount' : ''}. You don't know the dilution until that round is priced.`, '', '?'));
      model.resolved.filter(s => s.kind === 'note').forEach(s => out.push(ins(`${esc(s.name)} has accrued ${money(s.convAmount - s.amount)} of interest. ${money(s.convAmount)} converts, not the ${money(s.amount)} principal.`, '', '+')));
      if (!state.rounds.length) out.push(ins('Add a priced round to see conversion prices, the pool shuffle and the exit waterfall.'));
      return out.join('');
    }
    const r = st.res, round = st.round, fo = founderShare;
    out.push(ins(`Founders go from <b>${pct(fo(prev))}</b> to <b>${pct(fo(st))}</b> in the ${esc(round.name)}, a drop of ${pts(fo(prev) - fo(st))}. ${esc(round.name)} investors pay ${money(round.raise)} for ${pct(r.nNew / r.total)}.`, '', '↓'));
    if (r.dPool > 0) out.push(ins(`<b>Pool shuffle.</b> Investors want a ${trim(round.poolPct, 2)}% unallocated pool after the round, so ${shares(r.dPool)} new options (${money(r.dPool * r.P)} at the round price) are created inside the pre-money. Existing holders absorb all of that dilution. The new investors absorb none of it.`, 'warn', 'P'));
    if (r.conv.length || r.dPool > 0) {
      const effPre = (r.base - r.dPool) * r.P, cv = sum(r.conv, c => c.shares) * r.P;
      out.push(ins(`<b>Effective pre-money: ${money(effPre)}.</b> The headline is ${money(round.preMoney)}, but ${[cv > 0 ? money(cv) + ' of it pays for SAFE and note conversions' : '', r.dPool > 0 ? money(r.dPool * r.P) + (cv > 0 ? ' pays' : ' of it pays') + ' for the pool top-up' : ''].filter(Boolean).join(' and ')}. Existing shareholders' stake is valued at the smaller number.`, '', '$'));
    }
    if (r.conv.length) {
      const cp = sum(r.conv, c => c.shares) / r.total, lp = r.nNew / r.total, amt = sum(r.conv, c => c.inst.amount);
      out.push(ins(`SAFEs and notes (${money(amt)} in) convert into <b>${pct(cp)}</b> of the company${cp > lp ? `, more than the ${esc(round.name)} investors' ${pct(lp)} for ${money(round.raise)}` : `, against ${pct(lp)} for the ${esc(round.name)} investors`}.`, cp > lp ? 'warn' : '', 'S'));
      const best = r.conv.reduce((a, b) => (b.shares * r.P / b.inst.amount > a.shares * r.P / a.inst.amount ? b : a));
      out.push(ins(`Best deal on the table: ${esc(best.inst.name)} turns ${money(best.inst.amount)} into ${money(best.shares * r.P)} at the ${esc(round.name)} price, <b>${(best.shares * r.P / best.inst.amount).toFixed(1)}x</b> before the company has done anything else.`, '', '★'));
      r.conv.filter(c => c.inst.mfn).forEach(c => out.push(ins(c.inst.mfnFrom ? `${esc(c.inst.name)} is an uncapped MFN, so it inherited the ${money(c.inst.cap)} cap from ${esc(c.inst.mfnFrom)}. Raising later SAFEs at a low cap reprices it too.` : `${esc(c.inst.name)} found no later capped SAFE to copy, so it converted at the round price.`, '', '=')));
    }
    if (prev.pps && st.pps < prev.pps) {
      const adj = r.adj || [];
      const extra = sum(adj, a => a.extra);
      out.push(ins(`<b>Down round.</b> The ${esc(round.name)} prices at ${price(st.pps)} a share, below the ${esc(prev.name)}'s ${price(prev.pps)}.${adj.length ? ` Anti-dilution protection issues ${shares(extra)} extra shares to ${[...new Set(adj.map(a => esc((st.rows.find(x => x.id === a.id) || {}).roundName || 'earlier') + ' holders'))].join(' and ')}, worth ${money(extra * st.pps)}. Common holders pay for it: founders end at ${pct(fo(st))} instead of ${pct(noAdFounders(si))} without the protection.` : ' Earlier investors here have no anti-dilution protection, so they simply take the dilution.'}`, 'crit', '!'));
    }
    if (r.warn) out.push(ins(esc(r.warn), 'crit', '!'));
    if (round.participating || round.multiple > 1) out.push(ins(`${esc(round.name)} terms: ${round.multiple}x liquidation preference${round.participating ? ', participating' : ''}. Ownership looks the same, but founders take home less in modest exits. Check the exit waterfall.`, 'crit', '!'));
    return out.join('');
  }
