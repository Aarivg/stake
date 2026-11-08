  /* ---------- command palette ---------- */
  function switchTab(t) { ui.tab = t; renderView(); save(); }
  function commands() {
    const c = [];
    [['cap', 'Cap table'], ['exit', 'Exit waterfall'], ['run', 'Runway'], ['cmp', 'Compare scenarios']].forEach(([k, t], i) => c.push({ g: 'Go to', t, k: String(i + 1), run: () => switchTab(k) }));
    c.push({ g: 'Add', t: 'Add a SAFE or note', run: () => { if (course) endCourse(false); document.querySelector('[data-act="add-inst"]').click(); } });
    c.push({ g: 'Add', t: 'Add a priced round', run: () => { const b = document.querySelector('[data-act="add-round"]'); if (b) b.click(); else toast('Eight rounds is the maximum.'); } });
    c.push({ g: 'Add', t: 'Add a shareholder', run: () => document.querySelector('[data-act="add-holder"]').click() });
    c.push({ g: 'Tools', t: 'Goal seek', run: () => { if (mode === 'beginner') applyMode('standard'); switchTab('cap'); const el = $('#seekT'); if (el) { el.scrollIntoView({ block: 'center' }); el.focus(); } } });
    c.push({ g: 'Tools', t: 'Sensitivity table', run: () => { applyMode('pro'); switchTab('cap'); const el = $('#sensCard'); if (el) el.scrollIntoView({ block: 'start' }); } });
    c.push({ g: 'Learn', t: 'Take the 8-lesson course', run: () => startCourse() });
    [['beginner', 'Beginner'], ['standard', 'Standard'], ['pro', 'Pro']].filter(([m]) => m !== mode).forEach(([m, t]) => c.push({ g: 'View', t: `Switch to ${t} view`, k: m === 'pro' ? 'P' : '', run: () => applyMode(m, true) }));
    THEMES.filter(t => t !== theme).forEach(t => c.push({ g: 'Theme', t: `Switch to ${THEME_LABEL[t].toLowerCase() === 'match my device' ? 'device' : THEME_LABEL[t].toLowerCase()} theme`, k: 'T', run: () => applyTheme(t, true) }));
    c.push({ g: 'Scenario', t: 'Save scenario', k: '⌘S', run: openSave });
    c.push({ g: 'Scenario', t: 'Start blank', run: () => loadPreset('blank') });
    Object.entries(PRESETS).filter(([k]) => k !== 'blank').forEach(([k, p]) => c.push({ g: 'Example', t: p.label, run: () => loadPreset(k) }));
    saved.forEach(x => c.push({ g: 'Open', t: x.name, run: () => openSaved(x.id) }));
    c.push({ g: 'Share', t: 'Copy share link', run: () => $('#copyLink').click() });
    c.push({ g: 'Share', t: 'Copy cap table as CSV', run: () => $('#copyCsv').click() });
    c.push({ g: 'Share', t: $('#exportJson').textContent, run: () => $('#exportJson').click() });
    c.push({ g: 'Share', t: 'Import scenario (JSON)', run: () => $('#importJson').click() });
    c.push({ g: 'Edit', t: 'Undo', k: '⌘Z', run: undo });
    c.push({ g: 'Edit', t: 'Redo', k: '⇧⌘Z', run: redo });
    c.push({ g: 'Help', t: 'Keyboard shortcuts', k: '?', run: openKeys });
    return c;
  }
  let palItems = [], palSel = 0, lastFocus = null;
  function showScrim(on) { $('#scrim').hidden = !on; }
  function openPalette() {
    closeMenu(); closeDialogs(); lastFocus = document.activeElement;
    showScrim(true); $('#palette').hidden = false; $('#palIn').value = ''; filterPalette(); $('#palIn').focus();
  }
  function filterPalette() {
    const words = $('#palIn').value.toLowerCase().split(/\s+/).filter(Boolean);
    palItems = commands().filter(c => words.every(w => (c.g + ' ' + c.t).toLowerCase().includes(w)));
    palSel = 0; drawPalette();
  }
  function drawPalette() {
    $('#palList').innerHTML = palItems.length ? palItems.map((c, i) => `<li role="option" id="pal-${i}" data-i="${i}" aria-selected="${i === palSel}"><span>${esc(c.t)}</span><span class="g">${esc(c.g)}${c.k ? ' · ' + esc(c.k) : ''}</span></li>`).join('') : '<li aria-disabled="true"><span>No matching command</span></li>';
    $('#palIn').setAttribute('aria-activedescendant', palItems.length ? 'pal-' + palSel : '');
    const cur = document.getElementById('pal-' + palSel); if (cur) cur.scrollIntoView({ block: 'nearest' });
  }
  function runPalette(i) { const c = palItems[i]; if (!c) return; closeDialogs(); c.run(); }
  $('#palIn').addEventListener('input', filterPalette);
  $('#palIn').addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); palSel = Math.min(palItems.length - 1, palSel + 1); drawPalette(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); palSel = Math.max(0, palSel - 1); drawPalette(); }
    else if (e.key === 'Enter') { e.preventDefault(); runPalette(palSel); }
  });
  $('#palList').addEventListener('click', e => { const li = e.target.closest('[data-i]'); if (li) runPalette(+li.dataset.i); });
  function openKeys() { closeMenu(); closeDialogs(); lastFocus = document.activeElement; showScrim(true); $('#keys').hidden = false; $('#keys').setAttribute('tabindex', '-1'); $('#keys').focus(); }
  function closeDialogs() {
    const was = !$('#palette').hidden || !$('#keys').hidden;
    $('#palette').hidden = true; $('#keys').hidden = true; showScrim(false);
    if (was && lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus();
  }
  $('#scrim').addEventListener('click', closeDialogs);
  $('#paletteBtn').addEventListener('click', openPalette);
  $('#keysBtn').addEventListener('click', openKeys);
  document.addEventListener('keydown', e => {
    const mod = e.metaKey || e.ctrlKey, k = e.key.toLowerCase();
    if (mod && k === 'k') { e.preventDefault(); if ($('#palette').hidden) openPalette(); else closeDialogs(); return; }
    if (mod && k === 's') { e.preventDefault(); if (!course) openSave(); return; }
    if (e.key === 'Escape') {
      if (!$('#palette').hidden || !$('#keys').hidden) { closeDialogs(); return; }
      if (!$('#savePop').hidden) { closeSave(); return; }
      closeMenu(); return;
    }
    const tg = e.target;
    if (mod || e.altKey || (tg && (/^(INPUT|SELECT|TEXTAREA)$/.test(tg.tagName) || tg.isContentEditable))) return;
    if (!$('#palette').hidden || !$('#keys').hidden) return;
    if (e.key === '?') { e.preventDefault(); openKeys(); }
    else if (['1', '2', '3', '4'].includes(e.key)) switchTab(['cap', 'exit', 'run', 'cmp'][+e.key - 1]);
    else if (k === 'p') applyMode(mode === 'pro' ? 'standard' : 'pro', true);
    else if (k === 't') nextTheme();
  });
