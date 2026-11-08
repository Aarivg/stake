  /* ---------- course for beginners ---------- */
  const LS = o => Object.assign({ holders: [{ id: nid(), name: 'You', type: 'founder', shares: 10e6 }], optionsGranted: 0, poolUnallocated: 0, instruments: [], rounds: [], seniority: 'standard',
    runway: { cash: 600000, burn: 60000, burnGrowth: 0, mrr: 10000, growth: 6, raise: 2e6, raiseMonth: 6 } }, o);
  const SR = o => Object.assign({ id: nid(), name: 'Seed', preMoney: 8e6, raise: 2e6, poolPct: 0, multiple: 1, participating: false, antiDilution: 'bbwa', partCap: 0 }, o);
  const COURSE = [
    { title: 'Selling a slice of your company', tab: 'cap', focus: '#f-rounds-0-raise',
      setup: () => LS({ rounds: [SR()] }),
      body: 'You start with 100% of your company. In a priced round, investors buy newly created shares. Here they put in $2M at an $8M pre-money valuation, so the company is worth $10M afterwards (the post-money) and they own $2M ÷ $10M = 20%.',
      task: 'In the Seed round on the left, change <b>Amount raised</b> to $4M.',
      check: (m, s) => s.rounds[0] && s.rounds[0].raise >= 3.99e6,
      take: 'The share you sell is money raised ÷ post-money valuation. $4M on an $8M pre-money is 4 ÷ 12 = 33%, so raising more at the same valuation costs more of the company.' },
    { title: 'Valuation sets the price per share', tab: 'cap', focus: '#f-rounds-0-preMoney',
      setup: () => LS({ rounds: [SR()] }),
      body: 'Price per share = pre-money valuation ÷ shares that exist before the round. $8M ÷ 10M shares = $0.80. A higher valuation makes every share cost more, so the same money buys fewer of them.',
      task: 'Raise the Seed’s <b>pre-money valuation</b> to $16M and watch the price per share in the cap table.',
      check: (m, s) => s.rounds[0] && s.rounds[0].preMoney >= 15.99e6,
      take: 'At $16M the price doubles to $1.60 and you sell about 11% instead of 20%. Valuation is literally the price of your shares.' },
    { title: 'The option pool shuffle', tab: 'cap', focus: '#f-rounds-0-poolPct',
      setup: () => LS({ rounds: [SR()] }),
      body: 'Investors want shares set aside to hire with. They ask for the pool as a share of the company after the round, but it is created before they invest, so only the existing shareholders (you) are diluted by it.',
      task: 'Set the Seed’s <b>Pool target</b> to 15%.',
      check: (m, s) => s.rounds[0] && s.rounds[0].poolPct >= 15,
      take: 'You lose far more than the investors’ 20%, and the “Where the pre-money goes” bar shows your effective valuation shrinking. Size the pool to a real hiring plan, not a round number.' },
    { title: 'SAFEs: money now, shares later', tab: 'cap', focus: '[data-act="add-inst"]',
      setup: () => LS({ instruments: [{ id: nid(), name: 'First SAFE', kind: 'post', amount: 500000, cap: 5e6, discount: 0, rate: 0, months: 0, round: 0 }], rounds: [SR({ preMoney: 12e6, raise: 3e6 })] }),
      body: 'A SAFE is an investment today that turns into shares at your next priced round. With a post-money SAFE the math is simple: amount ÷ cap. $500K at a $5M cap buys 10% of the company just before the Seed money arrives.',
      task: 'Click <b>+ Add SAFE or note</b> to take a second SAFE, then look at who got diluted.',
      check: (m, s) => s.instruments.length >= 2,
      take: 'The first SAFE still converts to its 10%. Every post-money SAFE you add comes out of the founders’ share alone, so keep a running total of what you have promised.' },
    { title: 'Cap or discount: the better one wins', tab: 'cap', focus: '#f-instruments-0-cap',
      setup: () => LS({ instruments: [{ id: nid(), name: 'Angel SAFE', kind: 'post', amount: 500000, cap: 30e6, discount: 20, rate: 0, months: 0, round: 0 }], rounds: [SR({ preMoney: 10e6, raise: 2.5e6 })] }),
      body: 'Many SAFEs have a valuation cap and a discount. When the round happens, the investor converts at whichever price is lower: the cap price, or the round price minus the discount. With a $30M cap and a $10M round, the 20% discount is the better deal.',
      task: 'Lower this SAFE’s <b>cap</b> to $5M and watch the line under it switch from “via discount” to “via cap”.',
      check: m => { const st = m.stages[1]; const r = st && st.rows.find(x => x.group === 'safe'); return !!r && r.method === 'cap'; },
      take: 'At a $5M cap the SAFE converts to 10% of the pre-Seed company instead of 6.25%. A cap protects early investors when your valuation jumps; the lower the cap, the more of the company they get.' },
    { title: 'Who gets paid when you sell', tab: 'exit', focus: '#exitRange', exit: 5e6,
      setup: () => LS({ holders: [{ id: nid(), name: 'You', type: 'founder', shares: 8e6 }], rounds: [SR()] }),
      body: 'Investors usually buy preferred shares with a 1x liquidation preference. In a sale they either take their money back first or convert to common and take their ownership share, whichever pays more. In this $5M sale, the Seed investors take their $2M off the top.',
      task: 'Drag the <b>exit value</b> above $10M and watch the payouts line up with ownership.',
      check: () => ui.exit > 10e6,
      take: 'Below $10M the preference protects the investor; above it they convert and everyone is paid by ownership. Preferences matter most in modest outcomes, which are the common ones.' },
    { title: 'Participating preferred, the double dip', tab: 'exit', focus: '#f-rounds-0-part', exit: 20e6,
      setup: () => LS({ holders: [{ id: nid(), name: 'You', type: 'founder', shares: 8e6 }], rounds: [SR({ participating: true })] }),
      body: 'Participating preferred takes its money back and then also its ownership share of whatever is left. At a $20M exit the Seed gets $2M plus 20% of $18M.',
      task: 'In the Seed round, untick <b>Participating preferred</b> and compare your take-home.',
      check: (m, s) => s.rounds[0] && !s.rounds[0].participating,
      take: 'Here participation moves $1.6M from you to the investor. Standard early-stage terms are 1x non-participating; push back if you see anything else.' },
    { title: 'Runway and default alive', tab: 'run', focus: '#f-runway-growth',
      setup: () => LS({ rounds: [SR()] }),
      body: 'Runway is how many months your cash lasts. “Default alive” asks a sharper question: if you never raised again, would revenue catch up with costs before the money ran out?',
      task: 'Raise <b>Revenue growth / mo</b> until the badge says Default alive. The “Growth to be alive” tile tells you the number.',
      check: (m, s) => E.runway(s.runway).alive,
      take: 'Default-alive companies raise because they want to, not because they have to, and that changes every negotiation you just practised.' }
  ];
  const CKEY = 'stake.course.v1';
  let course = null;
  function courseDone() { try { return new Set(JSON.parse(localStorage.getItem(CKEY) || '[]')); } catch (e) { return new Set(); } }
  function startCourse(i) {
    if (!course) {
      histCommit();
      course = { i: 0, backup: JSON.stringify(state), backupUi: JSON.stringify(ui), backupDirty: dirty, done: courseDone(), passed: false };
      document.body.classList.add('coursing');
    }
    if (i == null) { i = COURSE.findIndex((_, k) => !course.done.has(k)); if (i < 0) i = 0; }
    goLesson(i);
  }
  function goLesson(i) {
    course.i = i; course.passed = false;
    const L = COURSE[i];
    state = L.setup(); bumpIds();
    resetUi(); ui.tab = L.tab; if (L.exit != null) ui.exit = L.exit;
    dirty = false;
    renderInputs(); renderOutputs(); histInit(); updateSaveUi();
    renderCourse();
    setTimeout(() => spotlight(L.focus), 30);
  }
  function spotlight(sel) {
    document.querySelectorAll('.spot').forEach(e => e.classList.remove('spot'));
    if (!sel) return;
    const el = document.querySelector(sel); if (!el) return;
    const t = el.closest('.toggle') || el.closest('.field') || el;
    t.classList.add('spot');
    t.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  function courseCheck() {
    if (!course) return;
    let ok = false;
    try { ok = !!COURSE[course.i].check(model, state); } catch (e) { ok = false; }
    if (ok && !course.passed) {
      course.passed = true; course.done.add(course.i);
      try { localStorage.setItem(CKEY, JSON.stringify([...course.done])); } catch (e) { /* ignore */ }
      renderCourse();
    }
  }
  function renderCourse() {
    const el = $('#course');
    if (!course) { el.hidden = true; return; }
    const L = COURSE[course.i], n = COURSE.length, last = course.i === n - 1;
    el.hidden = false;
    el.innerHTML = `<div class="top-row"><span class="step">Lesson ${course.i + 1} of ${n}</span><button class="x" type="button" data-c="close" aria-label="Leave the course">×</button></div>
      <h3>${esc(L.title)}</h3><p>${L.body}</p>
      <div class="task${course.passed ? ' done' : ''}" aria-live="polite"><span class="box" aria-hidden="true">✓</span><span><b>Try it:</b> ${L.task}${course.passed ? ' <span class="sr">Done.</span>' : ''}</span></div>
      <p class="take"${course.passed ? '' : ' hidden'}><b>Takeaway:</b> ${L.take}</p>
      <div class="nav"><button class="btn small" type="button" data-c="prev"${course.i === 0 ? ' disabled' : ''}>Back</button>
        <div class="dots">${COURSE.map((c, k) => `<button type="button" data-go="${k}" class="${course.done.has(k) ? 'done' : ''}"${k === course.i ? ' aria-current="step"' : ''} aria-label="Lesson ${k + 1}: ${esc(c.title)}${course.done.has(k) ? ' (done)' : ''}"></button>`).join('')}</div>
        <button class="btn small${course.passed ? ' solid' : ''}" type="button" data-c="next">${last ? 'Finish' : course.passed ? 'Next lesson' : 'Skip'}</button></div>
      <p class="simple-note" style="display:block">Your own scenario comes back when you leave the course.</p>`;
  }
  function endCourse(restore) {
    if (!course) return;
    const c = course; course = null;
    document.body.classList.remove('coursing');
    spotlight(null); renderCourse();
    if (restore) {
      state = JSON.parse(c.backup); ui = Object.assign(JSON.parse(c.backupUi), { exit: null });
      dirty = c.backupDirty; bumpIds();
      renderInputs(); renderOutputs(); renderScenarioSelect(); updateSaveUi(); histInit();
    }
  }
  $('#course').addEventListener('click', e => {
    const b = e.target.closest('[data-c],[data-go]'); if (!b || !course) return;
    if (b.dataset.go != null) { goLesson(+b.dataset.go); return; }
    const a = b.dataset.c;
    if (a === 'close') { endCourse(true); toast('Back to your scenario. Reopen the course any time from Learn the basics.'); }
    else if (a === 'prev' && course.i > 0) goLesson(course.i - 1);
    else if (a === 'next') {
      if (course.i < COURSE.length - 1) goLesson(course.i + 1);
      else { const all = course.done.size === COURSE.length; endCourse(true); toast(all ? 'Course complete. You now know more term-sheet math than most first-time founders.' : 'Back to your scenario.'); }
    }
  });
  $('#learnBtn').addEventListener('click', () => (course ? renderCourse() : startCourse()));
