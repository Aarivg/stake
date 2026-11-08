  /* ---------- tabs: arrow keys ---------- */
  $('.tabs').addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const tabs = [...document.querySelectorAll('.tabs button')];
    const i = tabs.indexOf(document.activeElement); if (i < 0) return;
    const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    n.focus(); n.click();
  });
