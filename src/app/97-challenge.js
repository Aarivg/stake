  /* ---------- challenge link: #challenge ---------- */
  /* Opens the "Tough terms" example on the exit waterfall at a $60M sale, with the payouts
     hidden until the visitor guesses, then asks them to find the founders' first dollar. */
  const CHALLENGE_EXIT = 60e6;
  function founderPayAt(rows, ex) {
    const w = E.waterfall(rows, ex, state.seniority);
    return sum(w.parts.filter(r => r.group === 'founder'), r => w.pay[r.id]);
  }
  function firstDollar(rows) {
    let lo = 0, hi = 1e11;
    if (founderPayAt(rows, hi) <= 0) return null;
    for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (founderPayAt(rows, m) > 1) hi = m; else lo = m; }
    return hi;
  }
  function startChallenge() {
    loadPreset('tough');
    ui.tab = 'exit'; ui.exit = CHALLENGE_EXIT; ui.challenge = { revealed: false };
    renderView(); save();
    const el = $('#challengeCard'); if (el) setTimeout(() => el.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }), 150);
  }
  function challengeCard() {
    if (!ui.challenge) return '';
    const st = model.stages[exitIdx()], rows = st.rows;
    const fo = founderShare(st);
    const totSh = sum(rows.filter(r => r.group !== 'pool'), r => r.shares);
    const own = sum(rows.filter(r => r.group === 'founder'), r => r.shares) / totSh;
    const pay = founderPayAt(rows, CHALLENGE_EXIT);
    const prefs = sum(rows, r => r.pref);
    const fd = firstDollar(rows);
    const head = `<span class="step">Founder challenge</span>`;
    if (!ui.challenge.revealed) {
      return `${head}<h3>The founders own ${pct(own, 0)} of the company. It sells for ${money(CHALLENGE_EXIT)}. How much do they take home?</h3>
        <p>Make a guess first. The payouts below are hidden until you reveal them.</p>
        <div class="pop-actions"><button class="btn solid" type="button" id="challengeReveal">Reveal the answer</button><button class="btn ghost" type="button" id="challengeExit">Skip the challenge</button></div>`;
    }
    const found = fd != null && ui.exit >= fd && ui.exit !== CHALLENGE_EXIT;
    return `${head}<h3>${money(pay)}. ${pay < 1 ? 'Nothing at all.' : ''}</h3>
      <p>Investors hold <b>${money(prefs)}</b> in liquidation preferences, more than the ${money(CHALLENGE_EXIT)} sale, and they are paid first. The founders' ${pct(own, 0)} as-converted ownership doesn't matter until every preference is covered.</p>
      ${fd ? (found
        ? `<p class="win"><b>You found it.</b> The founders see their first dollar once the sale tops <b>${money(fd)}</b>. Everything below that goes to investors.</p>`
        : `<p><b>Next:</b> drag the exit value and find the smallest sale where the founders get their first dollar.</p>`) : ''}
      <div class="pop-actions"><button class="btn ghost" type="button" id="challengeExit">Done. Explore on my own</button></div>`;
  }
  function updateChallenge() {
    const c = $('#challengeCard'); if (!c) return;
    c.innerHTML = challengeCard();
    const b = $('#exitBody'); if (b) b.classList.toggle('veiled', !!ui.challenge && !ui.challenge.revealed);
  }
  $('#view').addEventListener('click', e => {
    if (e.target.id === 'challengeReveal') { ui.challenge.revealed = true; updateChallenge(); }
    else if (e.target.id === 'challengeExit') { ui.challenge = null; renderView(); save(); }
  });
  addEventListener('hashchange', () => { if (location.hash === '#challenge') startChallenge(); });
