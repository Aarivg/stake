  /* ---------- arrow-key nudging on number fields ---------- */
  document.addEventListener('keydown', e => {
    const t = e.target;
    if (!(e.key === 'ArrowUp' || e.key === 'ArrowDown') || !t.classList || !t.classList.contains('num')) return;
    const kind = t.dataset.kind || (t.id === 'exitInput' || t.id === 'cmpExit' ? 'money' : t.id === 'seekT' ? 'pct' : null);
    if (!kind) return;
    const v = parseNum(t.value); if (v == null) return;
    e.preventDefault();
    let step;
    if (kind === 'pct') step = e.shiftKey ? 5 : 0.5;
    else if (kind === 'int') step = e.shiftKey ? 6 : 1;
    else { step = Math.pow(10, Math.floor(Math.log10(Math.max(v, kind === 'money' ? 1000 : 10))) - 1); if (e.shiftKey) step *= 10; }
    let nv = Math.max(0, (e.key === 'ArrowUp' ? v + step : v - step));
    nv = Math.round(nv / step) * step;
    t.value = kind === 'pct' ? trim(nv, 2) + '%' : fmtInput(nv, kind);
    t.dispatchEvent(new Event('input', { bubbles: true }));
  });
