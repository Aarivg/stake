  function start(data) {
    const h = fromHash();
    let last = null;
    try { last = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { last = null; }
    if (valid(h)) { state = h; }
    else if (data && valid(data.state)) { state = data.state; ui = Object.assign(ui, data.ui || {}); }
    else if (last && valid(last.state)) { state = last.state; ui = Object.assign(ui, last.ui || {}); dirty = !!last.dirty; }
    else { state = PRESETS.yc.make(); state.preset = 'yc'; }
    if (!state.seniority) state.seniority = 'standard';
    saved = loadSaved();
    if (state.savedId && !saved.some(x => x.id === state.savedId)) delete state.savedId;
    if (valid(h)) { delete state.savedId; dirty = true; }
    if (!ui.seek) ui.seek = { target: 50, roundId: null, varKey: '' };
    applyMode(mode);
    bumpIds();
    renderInputs(); renderOutputs(); renderScenarioSelect(); updateSaveUi(); histInit();
    if (window.claude && window.claude.hot) window.claude.hot.snapshot(() => ({ state, ui }));
  }
  if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(start);
  else start((window.claude && window.claude.hot && window.claude.hot.data) || {});
