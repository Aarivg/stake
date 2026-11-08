  function viewRun() {
    const rw = state.runway, R = E.runway(rw);
    const N = 48;
    const seed = state.rounds[0];
    const f = (l, k, kind) => numField(l, 'runway.' + k, rw[k], kind);
    let h = `<div class="run-in" id="runIn">${f('Cash in bank', 'cash', 'money')}${f('Monthly expenses', 'burn', 'money')}${numField('Expense growth / mo', 'runway.burnGrowth', rw.burnGrowth, 'pct', '', false, 'burnGrowth')}${f('Monthly revenue (MRR)', 'mrr', 'money')}${f('Revenue growth / mo', 'growth', 'pct')}${f('Raise amount', 'raise', 'money')}${f('Raise closes in month', 'raiseMonth', 'int')}
      ${seed ? `<div class="field" style="justify-content:end"><button class="btn small" type="button" id="useSeed">Use ${esc(seed.name)} raise (${money(seed.raise)})</button></div>` : ''}</div>`;
    h += `<div id="runBody" style="display:flex;flex-direction:column;gap:18px">${runBody()}</div>`;
    return h;
  }
  function runBody() {
    const rw = state.runway, R = E.runway(rw), N = 48;
    let h = '';
    const b = R.base, fu = R.funded;
    const out = b.runway, outIdx = b.outIdx, be = b.breakEven;
    const mo = v => v.toFixed(1).replace(/\.0$/, '');
    h += `<div class="pills">${R.alive ? '<span class="pill good">✓ Default alive</span>' : '<span class="pill crit">✕ Default dead</span>'} ${q('alive')}
      <span class="pill ${out == null ? 'good' : out < 9 ? 'crit' : out < 18 ? 'warn' : 'good'}">${out == null ? 'Cash lasts 5+ years' : `${mo(out)} months of runway`}</span>
      <span class="pill ${be == null ? 'warn' : 'good'}">${be == null ? 'No break-even within 5 years' : `Break-even ${monthLabel(be)}`}</span></div>`;
    const r18 = R.raiseFor(18), r24 = R.raiseFor(24);
    h += `<div class="tiles">
      <div class="tile"><div class="k">Runway, no raise</div><div class="v">${out == null ? '60+ mo' : mo(out) + ' mo'}</div><div class="d">${out == null ? 'never runs out' : 'runs out in ' + monthLabel(outIdx)}</div></div>
      <div class="tile"><div class="k">With the raise</div><div class="v">${fu.runway == null ? '60+ mo' : mo(fu.runway) + ' mo'}</div><div class="d">${money(rw.raise)} in ${monthLabel(rw.raiseMonth)}</div></div>
      <div class="tile"><div class="k">Growth to be alive</div><div class="v">${R.alive ? '—' : R.reqGrowth ? (R.reqGrowth * 100).toFixed(1) + '%/mo' : '100%+'}</div><div class="d">${R.alive ? 'already default alive' : 'vs ' + trim(rw.growth, 1) + '% today'}</div></div>
      <div class="tile"><div class="k">Raise for 18 / 24 mo</div><div class="v">${money(r18.amount)} / ${money(r24.amount)}</div><div class="d">runway after closing</div></div></div>`;
    const cut = a => a.slice(0, N + 1);
    h += `<div class="chart-card"><h3>Cash in the bank</h3><p class="hint">Month by month, with and without the raise.</p>
      ${lineChart({ label: 'Cash balance by month', series: [{ name: 'With raise', color: 'var(--s1)', values: cut(fu.cash), area: true }, { name: 'Without raise', color: 'var(--s2)', values: cut(b.cash), dash: true }],
        xFmt: i => monthLabel(i).replace(/ (\d{2})(\d{2})$/, " '$2"), xTip: i => monthLabel(i), yFmt: money, marks: [{ i: rw.raiseMonth, label: 'raise' }].concat(b.outMonth != null && b.outMonth <= N ? [{ i: b.outMonth, label: 'cash out' }] : []), yMin: Math.min(0, ...cut(b.cash)) < 0 ? undefined : 0 })}
      <ul class="legend"><li><span class="sw" style="background:var(--s1)"></span>With raise</li><li><span class="sw" style="background:var(--s2)"></span>Without raise (dashed)</li></ul></div>`;
    h += `<div class="chart-card"><h3>Revenue vs. expenses</h3><p class="hint">Where the lines cross, the company pays for itself.</p>
      ${lineChart({ h: 200, label: 'Monthly revenue and expenses', series: [{ name: 'Revenue', color: 'var(--s3)', values: b.rev.slice(0, N + 1) }, { name: 'Expenses', color: 'var(--s7)', values: b.exp.slice(0, N + 1) }],
        xFmt: i => monthLabel(i).replace(/ (\d{2})(\d{2})$/, " '$2"), xTip: i => monthLabel(i), yFmt: money, marks: be != null && be <= N ? [{ i: be, label: 'break-even' }] : [], yMin: 0 })}
      <ul class="legend"><li><span class="sw" style="background:var(--s3)"></span>Revenue</li><li><span class="sw" style="background:var(--s7)"></span>Expenses</li></ul></div>`;
    const o = [];
    if (R.alive) o.push(ins(`At ${trim(rw.growth, 1)}% monthly revenue growth you break even in <b>${monthLabel(be)}</b> before cash runs out, without raising. That's default alive: the raise buys speed, not survival.`, '', '✓'));
    else o.push(ins(`Without new money, cash runs out in <b>${monthLabel(outIdx)}</b>, about ${mo(out)} months from now. ${R.reqGrowth ? `Growing revenue <b>${(R.reqGrowth * 100).toFixed(1)}%</b> a month instead of ${trim(rw.growth, 1)}% would make you default alive on current spending.` : 'No realistic growth rate gets there on current spending, so the plan depends on raising or cutting burn.'}`, 'crit', '!'));
    if (r18.tooLate) o.push(ins(`Cash goes negative before month ${rw.raiseMonth}, so the raise has to close earlier.`, 'crit', '!'));
    o.push(ins(`To fund 18 months after closing you need about <b>${money(r18.amount)}</b>; 24 months needs ${money(r24.amount)}. The usual target is 18 to 24 months of runway per round, enough to hit the milestones the next round will be priced on.`, '', '$'));
    h += '<div class="insights">' + o.join('') + '</div>';
    return h;
  }
