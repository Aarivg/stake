  /* ---------- the term sheet challenge (#challenge) ---------- */
  /* Five deals, easiest to hardest. Each is a fixed scenario run through the real engine, so the
     answers and the worked solutions are computed, never typed in. It never touches the
     visitor's own scenario. */
  const CH_LEVELS = [
    {
      key: 'angel', name: 'The Angel', tier: 'Easy', diff: 1, tagline: 'One SAFE, one clean round.',
      who: 'A friendly angel writes the first check on a standard post-money SAFE. No discounts, no tricks. Then a Seed round prices the company.',
      terms: ['Founders: 9,000,000 shares', 'Option pool: 1,000,000 shares', 'Angel: $500K post-money SAFE, $5M cap', 'Seed: $2M raised at an $8M pre-money, no pool top-up'],
      q: 'What percentage of the company do the founders own after the Seed?', unit: 'pct',
      state: () => ({ holders: [{ id: 1, name: 'Founder A', type: 'founder', shares: 4.5e6 }, { id: 2, name: 'Founder B', type: 'founder', shares: 4.5e6 }], optionsGranted: 0, poolUnallocated: 1e6,
        instruments: [{ id: 11, name: 'Angel SAFE', kind: 'post', amount: 5e5, cap: 5e6, discount: 0, rate: 0, months: 0, round: 0 }],
        rounds: [{ id: 21, name: 'Seed', preMoney: 8e6, raise: 2e6, poolPct: 0, multiple: 1, participating: false, antiDilution: 'bbwa' }], seniority: 'standard' }),
      answer: m => founderShare(m.stages[1]),
      lesson: 'A post-money SAFE buys amount ÷ cap of the company just before the round, and then everyone, the SAFE holder included, is diluted by the new money.'
    },
    {
      key: 'pool', name: 'The Pool Shuffler', tier: 'Medium', diff: 2, tagline: 'A great headline valuation. Read the fine print.',
      who: 'This investor offers a $10M pre-money, which sounds great, but asks for a 15% unallocated option pool after the round, created before they invest.',
      terms: ['Founders: 9,000,000 shares', 'Options granted: 500,000 · unallocated pool: 500,000', 'Seed: $2.5M at a $10M pre-money', 'Pool target: 15% unallocated after the round'],
      q: 'The headline pre-money is $10M. What are the existing 10,000,000 shares actually valued at?', unit: 'money',
      state: () => ({ holders: [{ id: 1, name: 'Founder', type: 'founder', shares: 9e6 }], optionsGranted: 5e5, poolUnallocated: 5e5, instruments: [],
        rounds: [{ id: 21, name: 'Seed', preMoney: 10e6, raise: 2.5e6, poolPct: 15, multiple: 1, participating: false, antiDilution: 'bbwa' }], seniority: 'standard' }),
      answer: m => { const r = m.stages[1].res; return (r.base - r.dPool) * r.P; },
      lesson: 'The pool top-up sits inside the pre-money, so the effective valuation of your shares is lower than the headline. Negotiate the pool size on a real hiring plan.'
    },
    {
      key: 'stack', name: 'The Stacker', tier: 'Hard', diff: 3, tagline: 'Four SAFEs. One of them copies the others.',
      who: 'The company kept raising on SAFEs: a pre-seed SAFE, an accelerator’s uncapped MFN SAFE, an angel, and a bridge with a discount. They all convert in the Seed.',
      terms: ['Founders: 9,000,000 shares · pool: 1,000,000', 'Pre-seed: $250K post-money SAFE, $4M cap', 'Accelerator: $375K uncapped MFN SAFE (signed next)', 'Angel: $500K post-money SAFE, $8M cap', 'Bridge: $1M post-money SAFE, $12M cap, 20% discount', 'Seed: $3.5M at a $14M pre-money, 10% pool after'],
      q: 'Together, what percentage of the company do the four SAFE holders own after the Seed?', unit: 'pct',
      state: () => ({ holders: [{ id: 1, name: 'Founder A', type: 'founder', shares: 5e6 }, { id: 2, name: 'Founder B', type: 'founder', shares: 4e6 }], optionsGranted: 0, poolUnallocated: 1e6,
        instruments: [
          { id: 11, name: 'Pre-seed SAFE', kind: 'post', amount: 250000, cap: 4e6, discount: 0, rate: 0, months: 0, round: 0 },
          { id: 12, name: 'Accelerator MFN', kind: 'mfn', amount: 375000, cap: 0, discount: 0, rate: 0, months: 0, round: 0 },
          { id: 13, name: 'Angel SAFE', kind: 'post', amount: 5e5, cap: 8e6, discount: 0, rate: 0, months: 0, round: 0 },
          { id: 14, name: 'Bridge SAFE', kind: 'post', amount: 1e6, cap: 12e6, discount: 20, rate: 0, months: 0, round: 0 }],
        rounds: [{ id: 21, name: 'Seed', preMoney: 14e6, raise: 3.5e6, poolPct: 10, multiple: 1, participating: false, antiDilution: 'bbwa' }], seniority: 'standard' }),
      answer: m => { const s = m.stages[1]; return sum(s.rows.filter(r => r.group === 'safe'), r => r.shares) / s.total; },
      lesson: 'Post-money SAFEs stack: each new one comes out of the founders’ share. And an MFN quietly picks up the best terms signed after it, here the angel’s $8M cap and the bridge’s 20% discount.'
    },
    {
      key: 'prefs', name: 'The Preference Stack', tier: 'Brutal', diff: 4, tagline: 'Three rounds of preferences, newest paid first.',
      who: 'A Seed, a Series A and a Series B, each with liquidation preferences. The Series B took 1.5x, participating. In a sale, preferences are paid before anyone holding common.',
      terms: ['YC SAFEs and $1M of angel SAFEs, then:', 'Seed: $4M at $16M pre, 1x', 'Series A: $15M at $45M pre, 1x', 'Series B: $30M at $70M pre, 1.5x participating', 'Seniority: newest round paid first'],
      q: 'What is the smallest sale price at which the founders receive their first dollar?', unit: 'money',
      state: () => PRESETS.tough.make(),
      answer: (m, st) => { const L = m.stages[m.stages.length - 1]; let lo = 0, hi = 1e11; const fp = ex => { const w = E.waterfall(L.rows, ex, st.seniority); return sum(w.parts.filter(r => r.group === 'founder'), r => w.pay[r.id]); }; for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (fp(mid) > 1) hi = mid; else lo = mid; } return hi; },
      exit: 60e6,
      lesson: 'Until a sale covers every preference, common shareholders get nothing, whatever their ownership. In modest exits, preferences matter more than percentages.'
    },
    {
      key: 'shark', name: 'The Shark', tier: 'Expert', diff: 5, tagline: 'A down round with a full ratchet and a 2x double dip.',
      who: 'The Seed investor negotiated full-ratchet anti-dilution. The next round is a down round, led by an investor who wants a 2x participating preference.',
      terms: ['Founders: 8,000,000 shares, no pool', 'Seed: $2M at an $8M pre-money, full-ratchet anti-dilution', 'Series A (down round): $4M at a $4M pre-money', 'Series A terms: 2x preference, participating', 'The company sells for $20M'],
      q: 'How much do the founders take home from the $20M sale?', unit: 'money',
      state: () => ({ holders: [{ id: 1, name: 'Founders', type: 'founder', shares: 8e6 }], optionsGranted: 0, poolUnallocated: 0, instruments: [],
        rounds: [{ id: 21, name: 'Seed', preMoney: 8e6, raise: 2e6, poolPct: 0, multiple: 1, participating: false, antiDilution: 'full' },
                 { id: 22, name: 'Series A', preMoney: 4e6, raise: 4e6, poolPct: 0, multiple: 2, participating: true, partCap: 0, antiDilution: 'bbwa' }], seniority: 'standard' }),
      answer: (m, st) => { const L = m.stages[m.stages.length - 1]; const w = E.waterfall(L.rows, 20e6, st.seniority); return sum(w.parts.filter(r => r.group === 'founder'), r => w.pay[r.id]); },
      exit: 20e6,
      lesson: 'A full ratchet reprices the old investor all the way down, at the founders’ expense, and a participating 2x preference takes its money twice. Each term is survivable alone; together they gut the common.'
    }
  ];
  const CH_TITLES = [[480, 'Managing Partner'], [400, 'Partner'], [300, 'Principal'], [200, 'Associate'], [100, 'Analyst'], [0, 'Intern']];
  const chTitle = s => CH_TITLES.find(t => s >= t[0])[1];
  const chCache = {};
  function chLevel(i) {
    if (chCache[i]) return chCache[i];
    const L = CH_LEVELS[i], st = L.state(), m = E.buildStages(st);
    return (chCache[i] = { L, st, m, ans: L.answer(m, st) });
  }
  const chUi = () => ui.ch && Array.isArray(ui.ch.res) ? ui.ch : (ui.ch = { cur: 0, res: CH_LEVELS.map(() => null), guess: '' });
  function chScore(L, guess, ans) {
    if (L.unit === 'pct') {
      const d = Math.abs(guess - ans * 100);
      return d <= 1 ? 100 : d <= 3 ? 70 : d <= 6 ? 40 : d <= 10 ? 15 : 0;
    }
    const scale = Math.max(Math.abs(ans), L.exit ? L.exit * 0.05 : 1e5);
    const e = Math.abs(guess - ans) / scale;
    return e <= 0.05 ? 100 : e <= 0.15 ? 70 : e <= 0.3 ? 40 : e <= 0.5 ? 15 : 0;
  }
  const chFmt = (L, v) => (L.unit === 'pct' ? (v * 100).toFixed(1) + '%' : money(v));
  const chBadge = sc => sc == null ? '' : `<span class="pill ${sc >= 70 ? 'good' : sc >= 40 ? 'warn' : 'crit'}">${sc} pts</span>`;

  /* The worked solution, generated from the engine's own numbers. */
  function chSteps(i) {
    const { L, st, m, ans } = chLevel(i), out = [];
    const st0 = m.stages[0];
    const fs = st0.rows.filter(r => r.group === 'founder').reduce((a, r) => a + r.shares, 0);
    if (L.key === 'prefs' || L.key === 'shark') {
      const Ls = m.stages[m.stages.length - 1];
      if (L.key === 'shark') {
        const a = Ls.res.adj && Ls.res.adj[0];
        out.push(`The Series A prices at <b>${price(Ls.pps)}</b> a share, below the Seed’s ${price(m.stages[1].pps)}. That is a down round.`);
        if (a) out.push(`Full ratchet: the Seed’s conversion price drops to ${price(a.cp)}, so its $2M now converts into <b>${shares(m.stages[2].rows.find(r => r.id === 'r0').shares)}</b> shares instead of ${shares(m.stages[1].rows.find(r => r.id === 'r0').shares)}. Those ${shares(a.extra)} extra shares come from the founders’ side.`);
        out.push(`After the round: founders own <b>${pct(founderShare(Ls))}</b>, the Seed ${pct(Ls.rows.find(r => r.id === 'r0').shares / Ls.total)}, the Series A ${pct(Ls.rows.find(r => r.id === 'r1').shares / Ls.total)}.`);
      }
      const ex = L.key === 'prefs' ? ans : L.exit;
      const w = E.waterfall(Ls.rows, ex, st.seniority);
      const prefRows = w.parts.filter(r => r.pref > 0).sort((a, b) => b.rank - a.rank);
      const byRound = {};
      prefRows.forEach(r => { const k = r.roundName + (r.group === 'safe' ? ' SAFEs (shadow preferred)' : ' investors'); byRound[k] = (byRound[k] || 0) + r.pref; });
      out.push('Liquidation preferences, newest round first: ' + Object.entries(byRound).map(([k, v]) => `${esc(k)} <b>${money(v)}</b>`).join(' → ') + `. Total <b>${money(sum(prefRows, r => r.pref))}</b>.`);
      if (L.key === 'prefs') {
        out.push(`A sale has to cover all ${money(sum(prefRows, r => r.pref))} before anything reaches common shareholders. The Series B is participating, so it never converts; everyone else takes their preference.`);
        out.push(`So the founders’ first dollar arrives just above <b>${money(ans)}</b>, even though they own ${pct(sum(Ls.rows.filter(r => r.group === 'founder'), r => r.shares) / sum(Ls.rows.filter(r => r.group !== 'pool'), r => r.shares))} as-converted.`);
      } else {
        const conv = [...w.converted].map(id => w.parts.find(r => r.id === id));
        conv.forEach(r => out.push(`${esc(r.roundName)} investors would get ${money(r.pref)} from their preference, but converting to common pays more, so they convert.`));
        out.push(`What is left after preferences is shared per share: <b>${price(w.pps)}</b> for every common share, participating preferred included.`);
        out.push(`Founders: ${shares(fs)} shares × ${price(w.pps)} = <b>${money(ans)}</b> of a ${money(ex)} sale, while owning ${pct(founderShare(Ls))}. The Series A takes ${money(w.pay.r1)}.`);
      }
      return out;
    }
    const s = m.stages[1], r = s.res;
    out.push(`Before the round: <b>${shares(st0.total)}</b> fully diluted shares, founders ${shares(fs)}.`);
    if (r.dPool > 0) out.push(`Pool shuffle: to leave ${trim(s.round.poolPct, 1)}% unallocated after the round, <b>${shares(r.dPool)}</b> new options are created inside the pre-money.`);
    const instr = r.conv.map(c => `${esc(c.inst.name)}${c.inst.mfn ? ` (MFN, copied a ${money(c.inst.cap)} cap${c.inst.discount ? ' and ' + c.inst.discount + '% discount' : ''})` : ''} converts via ${c.method === 'round' ? 'the round price' : c.method} at ${price(c.price)} → <b>${shares(c.shares)}</b> shares`);
    if (instr.length) out.push(instr.join('; ') + '.');
    out.push(`Price per share = ${money(s.round.preMoney)} pre-money ÷ ${shares(r.C)} pre-money shares = <b>${price(r.P)}</b>.`);
    out.push(`New investors buy ${money(s.round.raise)} ÷ ${price(r.P)} = ${shares(r.nNew)} shares, exactly ${pct(r.nNew / r.total)} of the ${shares(r.total)} total.`);
    if (L.key === 'angel') out.push(`Founders: ${shares(fs)} ÷ ${shares(s.total)} = <b>${pct(ans)}</b>.`);
    if (L.key === 'pool') out.push(`The existing ${shares(r.base - r.dPool)} shares × ${price(r.P)} = <b>${money(ans)}</b>. The other ${money(s.round.preMoney - ans)} of the “$10M” pays for the pool top-up.`);
    if (L.key === 'stack') out.push(`SAFE holders: ${shares(sum(r.conv, c => c.shares))} ÷ ${shares(s.total)} = <b>${pct(ans)}</b>, versus ${pct(r.nNew / r.total)} for the Seed investors who wrote a much bigger check.`);
    return out;
  }

  function viewChallenge() {
    const s = chUi();
    const total = sum(s.res, x => (x ? x.score : 0)), done = s.res.filter(Boolean).length;
    let h = `<section class="ch-hero"><span class="step">The term sheet challenge</span>
      <h2>Five deals. One number each.</h2>
      <p>Each deal is harder than the last, from a friendly angel to a shark. Read the terms, make your call, and see the full working. Every answer is computed by the same engine that runs the simulator.</p>
      <div class="ch-score"><span><b class="mono">${total}</b> / 500</span><span>${done ? `${done} of 5 played · ${chTitle(total)}` : 'Not started'}</span></div></section>`;
    h += '<div class="ch-ladder" role="list">' + CH_LEVELS.map((L, i) => {
      const r = s.res[i];
      return `<button type="button" role="listitem" class="ch-card${i === s.cur ? ' on' : ''}${r ? ' done' : ''}" data-ch="${i}">
        <span class="ch-tier">${'●'.repeat(L.diff)}${'○'.repeat(5 - L.diff)} ${L.tier}</span>
        <span class="ch-name">${esc(L.name)}</span><span class="ch-tag">${esc(L.tagline)}</span>
        <span class="ch-res">${r ? chBadge(r.score) : 'Play'}</span></button>`;
    }).join('') + '</div>';

    if (done === 5 && s.cur === -1) {
      const grid = s.res.map(x => (x.score >= 70 ? '🟩' : x.score >= 40 ? '🟨' : '🟥')).join('');
      h += `<section class="challenge"><span class="step">Final score</span><div class="ch-answer"><span class="v">${total}</span><span class="k">/ 500 · ${chTitle(total)}</span></div>
        <p class="ch-grid">${grid}</p><p>${total >= 400 ? 'You read term sheets like an investor does.' : total >= 200 ? 'Solid. The last two deals are where most of the money hides.' : 'Now you know why founders lawyer up. Replay any deal to see the working.'}</p>
        <div class="pop-actions"><button class="btn solid" type="button" id="chShare">Copy my score</button><button class="btn" type="button" id="chReset">Play again</button><button class="btn ghost" type="button" id="chMine">Back to my scenario</button></div></section>`;
      return h;
    }
    const i = Math.max(0, s.cur), { L, ans } = chLevel(i), r = s.res[i];
    h += `<section class="challenge"><span class="step">Deal ${i + 1} of 5 · ${L.tier}</span><h3>${esc(L.name)}</h3><p>${esc(L.who)}</p>
      <div class="ch-terms"><span class="k">Term sheet</span><ul>${L.terms.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
      <p class="ch-q">${esc(L.q)}</p>`;
    if (!r) {
      h += `<div class="ch-guess"><label class="field"><span>Your answer (${L.unit === 'pct' ? '%' : '$, e.g. 8.5m'})</span><input class="num" type="text" id="chGuess" inputmode="decimal" placeholder="${L.unit === 'pct' ? '50%' : '$10M'}" value="${esc(s.guess || '')}" autocomplete="off"></label>
        <button class="btn solid" type="button" id="chSubmit">Lock it in</button></div><p class="ch-err" id="chErr" role="alert"></p></section>`;
      return h;
    }
    h += `<div class="ch-answer"><span class="k">Answer</span><span class="v">${chFmt(L, ans)}</span>${chBadge(r.score)}</div>
      <p>You said <b>${L.unit === 'pct' ? trim(r.guess, 2) + '%' : money(r.guess)}</b>.</p>
      <div class="ch-work"><span class="k">The working</span><ol>${chSteps(i).map(x => `<li>${x}</li>`).join('')}</ol></div>
      <p class="ch-lesson"><b>The lesson:</b> ${esc(L.lesson)}</p>
      <div class="pop-actions">${i < 4 ? `<button class="btn solid" type="button" data-ch="${i + 1}">Next deal: ${esc(CH_LEVELS[i + 1].name)}</button>` : `<button class="btn solid" type="button" id="chFinish">See my final score</button>`}
        <button class="btn" type="button" id="chOpen">Open this deal in the simulator</button></div></section>`;
    return h;
  }
  function chSubmit() {
    const s = chUi(), i = Math.max(0, s.cur), { L, ans } = chLevel(i);
    const raw = ($('#chGuess') || {}).value || '';
    const v = parseNum(raw);
    if (!raw.trim() || v == null) { const e = $('#chErr'); if (e) e.textContent = L.unit === 'pct' ? 'Enter a percentage, like 55 or 55%.' : 'Enter a dollar amount, like 8.5m or $12M.'; return; }
    s.res[i] = { guess: v, score: chScore(L, v, ans) }; s.guess = '';
    renderView(); save();
    const a = document.querySelector('.ch-answer'); if (a) a.scrollIntoView({ block: 'center' });
  }
  function startChallenge() { ui.tab = 'challenge'; renderView(); save(); scrollTo(0, 0); }
  $('#view').addEventListener('click', e => {
    const b = e.target.closest('[data-ch]');
    if (b) { const s = chUi(); s.cur = +b.dataset.ch; s.guess = ''; renderView(); save(); const c = document.querySelector('.challenge'); if (c) c.scrollIntoView({ block: 'start' }); return; }
    const id = e.target.id;
    if (id === 'chSubmit') chSubmit();
    else if (id === 'chFinish') { chUi().cur = -1; renderView(); save(); }
    else if (id === 'chReset') { ui.ch = null; renderView(); save(); }
    else if (id === 'chMine') switchTab('cap');
    else if (id === 'chShare') {
      const s = chUi(), total = sum(s.res, x => x.score);
      const grid = s.res.map(x => (x.score >= 70 ? '🟩' : x.score >= 40 ? '🟨' : '🟥')).join('');
      copy(`I scored ${total}/500 (${chTitle(total)}) on the Stake term sheet challenge.\n${grid}\nThink you can read a term sheet? ${location.href.split('#')[0]}#challenge`, 'Score copied. Paste it anywhere.');
    } else if (id === 'chOpen') {
      const i = Math.max(0, chUi().cur), { L } = chLevel(i);
      if (course) endCourse(false);
      const prev = state && hist.last ? (histCommit(), hist.last) : null;
      state = L.state(); bumpIds(); resetUi(); ui.tab = L.exit ? 'exit' : 'cap'; if (L.exit) ui.exit = L.exit;
      dirty = true; renderInputs(); renderOutputs(); renderScenarioSelect(); updateSaveUi(); histJump(prev, false);
      toast('Opened the deal. Undo brings your previous numbers back.');
    }
  });
  $('#view').addEventListener('input', e => { if (e.target.id === 'chGuess') chUi().guess = e.target.value; });
  $('#view').addEventListener('keydown', e => { if (e.target.id === 'chGuess' && e.key === 'Enter') chSubmit(); });
  addEventListener('hashchange', () => { if (location.hash === '#challenge') startChallenge(); });
