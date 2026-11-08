  /* ---------- hero ---------- */
  function renderHero() {
    const stages = model.stages, L = stages[stages.length - 1], F = stages[0];
    const fo = founderShare(L);
    const fs = sum(L.rows.filter(r => r.group === 'founder'), r => r.shares);
    const raised = sum(state.instruments, x => x.amount || 0) + sum(state.rounds.filter(r => r.preMoney > 0), r => r.raise || 0);
    const post = L.round ? L.round.preMoney + L.round.raise : null;
    const pool = sum(L.rows.filter(r => r.group === 'pool'), r => r.shares) / L.total;
    const inv = sum(L.rows.filter(r => r.group === 'investor' || r.group === 'safe'), r => r.shares) / L.total;
    const big = (fo * 100).toFixed(1);
    const keys = ORDER.filter(k => stages.some(s => agg(s)[k] > 0));
    $('#hero').innerHTML = `<div>
        <p class="lede">${stages.length > 1 ? `After the ${esc(L.name)}, the founders own` : 'Today, the founders own'}</p>
        <div class="big">${big}<small>%</small></div>
        <p class="sub">${post ? `worth <b>${money(fs * L.pps)}</b> on paper at a ${money(post)} post-money valuation.` : 'Add a priced round to see how your SAFEs and notes convert.'}</p>
        <ul class="stats">
          <li><span class="k">Total raised</span><span class="v">${money(raised)}</span></li>
          <li><span class="k">Founder dilution</span><span class="v">${pct(founderShare(F))} → ${pct(fo)}</span></li>
          <li><span class="k">Investors own</span><span class="v">${pct(inv)}</span></li>
          <li><span class="k">Option pool</span><span class="v">${pct(pool)}</span></li>
        </ul></div>
      <div class="chart-card"><h3>Ownership, round by round</h3><p class="hint">Hover a column for the full split and dollar value.</p>${dilutionChart(stages)}${legendFor(keys)}</div>`;
  }
