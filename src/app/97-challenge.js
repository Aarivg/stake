  /* ---------- founder challenge tab (#challenge) ---------- */
  /* A self-contained puzzle on a fixed example ("Tough terms"). It never touches the visitor's
     own scenario: it builds its own model and draws its own bars. */
  const CH_EXIT = 60e6, CH_MAX = 150e6;
  const CH_LABEL = { founder: 'Founders', safe: 'SAFEs & notes', r0: 'Seed investors', r1: 'Series A investors', r2: 'Series B investors', options: 'Employee options', common: 'Other common' };
  let chCache = null;
  function chModel() {
    if (chCache) return chCache;
    const st = PRESETS.tough.make();
    const m = E.buildStages(st), L = m.stages[m.stages.length - 1];
    const rows = L.rows;
    const parts = rows.filter(r => r.group !== 'pool' && r.shares > 0);
    const totSh = sum(parts, r => r.shares);
    const own = {}; parts.forEach(r => { const k = gkey(r); own[k] = (own[k] || 0) + r.shares / totSh; });
    const payAt = ex => { const w = E.waterfall(rows, ex, st.seniority); const g = {}; w.parts.forEach(r => { const k = gkey(r); g[k] = (g[k] || 0) + w.pay[r.id]; }); return g; };
    let lo = 0, hi = 1e11;
    for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if ((payAt(mid).founder || 0) > 1) hi = mid; else lo = mid; }
    chCache = { rows, own, payAt, first: hi, prefs: sum(rows, r => r.pref), keys: ORDER.filter(k => own[k] > 0) };
    return chCache;
  }
  const chUi = () => ui.ch || (ui.ch = { guess: null, revealed: false, exit: CH_EXIT, found: false });

  function chBars(ex) {
    const c = chModel(), pay = c.payAt(ex);
    const bar = (shares, title, val) => {
      let x = 0, h = '';
      c.keys.forEach(k => { const w = shares[k] || 0; if (w > 0.0005) { h += `<div title="${esc(CH_LABEL[k] || k)}: ${val(k)}" style="flex:${w};background:${COLOR[k]}"></div>`; } x += w; });
      if (!h) h = '<div style="flex:1;background:var(--band)"></div>';
      return `<div class="ch-row"><span class="ch-k">${title}</span><div class="ch-bar">${h}</div></div>`;
    };
    const payShare = {}; c.keys.forEach(k => { payShare[k] = ex > 0 ? (pay[k] || 0) / ex : 0; });
    return bar(c.own, 'Ownership', k => pct(c.own[k])) + bar(payShare, `Payout at ${money(ex)}`, k => money(pay[k] || 0)) +
      `<ul class="legend">${c.keys.map(k => `<li><span class="sw" style="background:${COLOR[k]}"></span>${esc(CH_LABEL[k] || k)} <span class="mono" style="margin-left:4px">${money(pay[k] || 0)}</span></li>`).join('')}</ul>`;
  }
  function chLive() {
    const c = chModel(), s = chUi(), ex = s.exit;
    const fp = c.payAt(ex).founder || 0;
    if (!s.found && fp > 0 && ex <= c.first + 2.5e6) s.found = true;
    let msg;
    if (s.found) msg = `<p class="win"><b>You found it.</b> The founders see their first dollar once the sale tops <b>${money(c.first)}</b>, the total of every liquidation preference. Every dollar below that goes to investors.</p>`;
    else if (fp > 0) msg = `<p>The founders get <b>${money(fp)}</b> here. Can you find the smallest sale where they get anything at all?</p>`;
    else msg = `<p>At <b>${money(ex)}</b> the founders still get <b>$0</b>. Keep going.</p>`;
    return `<div class="big2 mono">${money(ex)}</div>${msg}${chBars(ex)}`;
  }
  function viewChallenge() {
    const c = chModel(), s = chUi();
    const ownF = c.own.founder || 0;
    const naive = ownF * CH_EXIT;
    let h = `<section class="challenge"><span class="step">Founder challenge</span>
      <h3>The founders own ${pct(ownF, 0)} of the company. It sells for ${money(CH_EXIT)}. How much do they take home?</h3>
      <p>The company raised a Seed, a Series A and a Series B. The Series B came with a 1.5x participating liquidation preference. Make your guess first.</p>`;
    if (!s.revealed) {
      h += `<div class="ch-guess"><label class="field"><span>Your guess</span><input class="num" type="text" id="chGuess" inputmode="decimal" placeholder="$0" value="${s.guess != null ? esc(moneyInput(s.guess)) : ''}" autocomplete="off"></label>
        <button class="btn solid" type="button" id="chReveal">Reveal the answer</button></div></section>`;
      return h;
    }
    const pay0 = c.payAt(CH_EXIT).founder || 0;
    const g = s.guess;
    h += `<div class="ch-answer"><span class="k">The answer</span><span class="v">${money(pay0)}</span></div>
      <p>${g != null ? `You guessed <b>${money(g)}</b>. ` : ''}Ownership alone would suggest ${pct(ownF, 0)} × ${money(CH_EXIT)} = ${money(naive)}. But investors hold <b>${money(c.prefs)}</b> in liquidation preferences, more than the sale price, and they are paid first. The Series B's preference alone is 1.5x its money, and because it participates it would also share in anything left over.</p>
      ${chBars(CH_EXIT)}</section>
      <section class="challenge"><span class="step">Part two</span>
      <h3>Find the smallest sale where the founders get their first dollar.</h3>
      <div class="ch-slider"><input type="range" id="chRange" min="0" max="${CH_MAX}" step="500000" value="${s.exit}" aria-label="Sale price">
        <div class="scale"><span>$0</span><span>${money(CH_MAX / 2)}</span><span>${money(CH_MAX)}</span></div></div>
      <div id="chLive">${chLive()}</div>
      <div class="pop-actions"><button class="btn" type="button" id="chShow">Show me</button><button class="btn" type="button" id="chRetry">Start over</button></div></section>
      <section class="challenge quiet"><h3>Try it with your own numbers</h3>
      <p>Open this example in the full simulator to change the terms, or go back to your own scenario.</p>
      <div class="pop-actions"><button class="btn solid" type="button" id="chOpen">Open this example in the simulator</button><button class="btn" type="button" id="chMine">Back to my scenario</button></div></section>`;
    return h;
  }
  function startChallenge() { ui.tab = 'challenge'; renderView(); save(); scrollTo(0, 0); }
  $('#view').addEventListener('click', e => {
    const id = e.target.id, s = ui.ch;
    if (id === 'chReveal') { const v = parseNum(($('#chGuess') || {}).value || ''); chUi().guess = v != null && ($('#chGuess').value || '').trim() ? v : null; chUi().revealed = true; renderView(); const a = document.querySelector('.ch-answer'); if (a) a.scrollIntoView({ block: 'center' }); }
    else if (id === 'chShow' && s) { s.exit = Math.ceil(chModel().first / 5e5) * 5e5; $('#chRange').value = s.exit; $('#chLive').innerHTML = chLive(); }
    else if (id === 'chRetry') { ui.ch = null; renderView(); }
    else if (id === 'chOpen') { loadPreset('tough'); ui.tab = 'exit'; ui.exit = s ? s.exit : CH_EXIT; renderView(); save(); }
    else if (id === 'chMine') switchTab('cap');
  });
  $('#view').addEventListener('input', e => {
    if (e.target.id === 'chRange') { chUi().exit = +e.target.value; $('#chLive').innerHTML = chLive(); }
  });
  $('#view').addEventListener('keydown', e => { if (e.target.id === 'chGuess' && e.key === 'Enter') $('#chReveal').click(); });
  addEventListener('hashchange', () => { if (location.hash === '#challenge') startChallenge(); });
