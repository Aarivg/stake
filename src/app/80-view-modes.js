  /* ---------- Simple / Pro ---------- */
  /* Every visit opens in Standard view. Beginner and Pro are opt-in for this visit only. */
  let mode = 'standard';
  const MODE_MSG = {
    beginner: 'Beginner view: advanced terms stay hidden until you set them. Try Learn the basics for a guided tour.',
    standard: 'Standard view.',
    pro: 'Pro view: sensitivity table, command palette (⌘K) and keyboard shortcuts (press ?).'
  };
  function applyMode(m, announce) {
    mode = ['beginner', 'pro'].includes(m) ? m : 'standard';
    document.body.classList.toggle('simple', mode === 'beginner');
    document.body.classList.toggle('pro', mode === 'pro');
    document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    if (announce) toast(MODE_MSG[mode]);
  }
  document.querySelector('.mode').addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (b) applyMode(b.dataset.mode, true); });
