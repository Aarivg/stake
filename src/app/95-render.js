  /* ---------- render ---------- */
  function renderView() {
    document.querySelectorAll('.tabs button').forEach(b => { const on = b.dataset.tab === ui.tab; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    clearScope('view'); scope = 'view';
    const v = $('#view');
    const active = document.activeElement && document.activeElement.id;
    const caret = active && document.activeElement.selectionStart;
    const errs = (model.errors || []).map(x => ins(`<b>${esc(x.name)}:</b> ${esc(x.msg)} Results below stop before this round.`, 'crit', '!')).join('');
    v.innerHTML = errs + (ui.tab === 'exit' ? viewExit() : ui.tab === 'run' ? viewRun() : ui.tab === 'cmp' ? viewCompare() : viewCap());
    if (active && v.querySelector('#' + active)) {
      const el = document.getElementById(active); el.focus();
      try { if (caret != null) el.setSelectionRange(caret, caret); } catch (e) { /* not a text input */ }
    }
  }
  function renderOutputs() {
    model = E.buildStages(state);
    clearScope('hero'); scope = 'hero';
    renderHero();
    scope = 'view';
    renderView();
    updateDerived();
    save();
    courseCheck();
  }

  $('.tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (!b) return; ui.tab = b.dataset.tab; renderView(); save(); });
  $('#view').addEventListener('click', e => {
    const s = e.target.closest('[data-stage]'); if (s) { ui.stage = +s.dataset.stage; renderView(); return; }
    const x = e.target.closest('[data-xstage]'); if (x) { ui.exitStage = +x.dataset.xstage; ui.exit = null; renderView(); return; }
    if (e.target.id === 'useSeed' && state.rounds[0]) { state.runway.raise = state.rounds[0].raise; renderView(); save(); changed(); return; }
    if (e.target.id === 'seekGo') { runSeek(); return; }
    if (e.target.id === 'seekApply' && lastSeek && lastSeek.val != null) {
      const t = seekTarget(state, lastSeek.vdef.key);
      if (t) { t.obj[t.field] = lastSeek.val; renderInputs(); renderOutputs(); changed(); toast('Applied. Founders now hit the target.'); }
      return;
    }
    const op = e.target.closest('[data-open]'); if (op) { openSaved(op.dataset.open); return; }
    const dl = e.target.closest('[data-del]');
    if (dl) {
      if (dl.dataset.confirm !== '1') { dl.dataset.confirm = '1'; dl.textContent = 'Confirm delete'; return; }
      saved = saved.filter(x => x.id !== dl.dataset.del);
      if (state.savedId === dl.dataset.del) { delete state.savedId; dirty = true; }
      writeSaved(); renderScenarioSelect(); updateSaveUi(); renderView(); save();
      return;
    }
  });
  $('#view').addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'exitRange') {
      const sc = exitScale(model.stages[exitIdx()]);
      const f = +t.value / 1000, raw = sc.xmax * f * f;
      const stepv = raw < 1e6 ? 1e4 : raw < 1e7 ? 1e5 : 1e6;
      ui.exit = Math.round(raw / stepv) * stepv;
      $('#exitInput').value = moneyInput(ui.exit);
      refreshExitBody(); save();
      return;
    }
    if (t.id === 'cmpExit') { const v = parseNum(t.value); if (v != null) { ui.cmpExit = v; const pos = t.selectionStart; renderView(); const n = $('#cmpExit'); n.focus(); try { n.setSelectionRange(pos, pos); } catch (er) { /* ignore */ } } return; }
    if (t.id === 'seekT') { const v = parseNum(t.value); if (v != null) ui.seek.target = Math.min(100, v); return; }
    if (t.id === 'exitInput') {
      const v = parseNum(t.value); if (v == null) return;
      ui.exit = v;
      const sc = exitScale(model.stages[exitIdx()]);
      $('#exitRange').value = Math.round(Math.sqrt(Math.min(1, v / sc.xmax)) * 1000);
      refreshExitBody(); save();
      return;
    }
    const path = t.dataset.bind;
    if (path && path.startsWith('runway.')) {
      const v = parseNum(t.value); if (v == null) return;
      setPath(path, t.dataset.kind === 'int' ? Math.round(v) : v);
      clearScope('view'); scope = 'view';
      $('#runBody').innerHTML = runBody(); save(); changed(); courseCheck();
    }
  });
  $('#view').addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.cmp) {
      const k = t.dataset.cmp;
      ui.cmp = t.checked ? [...ui.cmp, k].slice(0, 4) : ui.cmp.filter(x => x !== k);
      renderView(); return;
    }
    if (t.id === 'seekR') { ui.seek.roundId = t.value; return; }
    if (['sensM', 'sensRound', 'sensRow', 'sensCol'].includes(t.id)) {
      const sn = ui.sens || (ui.sens = {});
      if (t.id === 'sensM') sn.metric = t.value; else if (t.id === 'sensRound') sn.roundId = t.value; else if (t.id === 'sensRow') { if (t.value === sn.col) sn.col = sn.row; sn.row = t.value; } else { if (t.value === sn.row) sn.row = sn.col; sn.col = t.value; }
      const y = scrollY; renderView(); scrollTo(0, y); const n = document.getElementById(t.id); if (n) n.focus();
      return;
    }
    if (t.id === 'seekV') { ui.seek.varKey = t.value; return; }
  });
  $('#view').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'seekT') runSeek(); });
  $('#view').addEventListener('focusout', e => {
    const t = e.target;
    if (t.id === 'exitInput') t.value = moneyInput(ui.exit);
    else if (t.dataset && t.dataset.bind && t.dataset.bind.startsWith('runway.')) t.value = fmtInput(getPath(t.dataset.bind), t.dataset.kind);
  });

  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2200); }
  async function copy(text, okMsg) {
    try { await navigator.clipboard.writeText(text); toast(okMsg); }
    catch (e) { toast('Copy was blocked by the browser. Select and copy manually.'); }
  }
  $('#copyLink').addEventListener('click', () => copy(location.href.split('#')[0] + toHash(), 'Share link copied. Anyone who opens it sees this scenario.'));
  $('#copyCsv').addEventListener('click', () => {
    closeMenu();
    const st = model.stages[ui.stage == null || ui.stage >= model.stages.length ? model.stages.length - 1 : ui.stage];
    const lines = [['Holder', 'Class', 'Shares', 'Ownership %', 'Invested', 'Value at round price'].join(',')];
    st.rows.forEach(r => lines.push([`"${String(r.label).replace(/"/g, '""')}"`, glabel(gkey(r)), Math.round(r.shares), (r.shares / st.total * 100).toFixed(4), r.invested || 0, st.pps ? Math.round(r.shares * st.pps) : ''].join(',')));
    copy(lines.join('\n'), `${st.name} cap table copied as CSV. Paste into Sheets or Excel.`);
  });
  const sel = $('#preset');
  sel.addEventListener('change', () => {
    const v = sel.value;
    if (v.startsWith('p:')) loadPreset(v.slice(2));
    else if (v.startsWith('s:')) openSaved(v.slice(2));
  });
  function resetUi() { ui = { tab: ui.tab || 'cap', stage: null, exitStage: null, exit: null, cmp: ui.cmp, cmpExit: null, seek: { target: 50, roundId: null, varKey: '' }, sens: {} }; }
  function histJump(prev, wasDirty) {
    if (prev == null) { histInit(); return; }
    hist.past.push(prev); hist.future = []; hist.last = JSON.stringify(state); updateHistUi();
    if (wasDirty) toast('Switched scenario. Undo brings your unsaved numbers back.');
  }
  function loadPreset(k) {
    if (course) endCourse(false);
    const prev = state && hist.last ? (histCommit(), hist.last) : null, wasDirty = dirty;
    state = PRESETS[k].make(); state.preset = k;
    resetUi(); dirty = false;
    renderInputs(); renderOutputs(); renderScenarioSelect(); updateSaveUi(); histJump(prev, wasDirty);
  }
  function openSaved(id) {
    if (course) endCourse(false);
    const sv = saved.find(x => x.id === id); if (!sv) return;
    const prev = state && hist.last ? (histCommit(), hist.last) : null, wasDirty = dirty;
    state = clone(sv.state); state.savedId = id; bumpIds();
    resetUi(); dirty = false;
    renderInputs(); renderOutputs(); renderScenarioSelect(); updateSaveUi(); histJump(prev, wasDirty);
  }
