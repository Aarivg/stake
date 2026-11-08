  /* ---------- undo / redo ---------- */
  const hist = { past: [], future: [], last: null, t: 0 };
  function histInit() { clearTimeout(hist.t); hist.past = []; hist.future = []; hist.last = JSON.stringify(state); updateHistUi(); }
  function histCommit() {
    clearTimeout(hist.t);
    const cur = JSON.stringify(state);
    if (cur !== hist.last) { hist.past.push(hist.last); if (hist.past.length > 150) hist.past.shift(); hist.future = []; hist.last = cur; }
    updateHistUi();
  }
  function histTouch() { clearTimeout(hist.t); hist.t = setTimeout(histCommit, 400); updateHistUi(true); }
  function updateHistUi(pending) {
    $('#undoBtn').disabled = !(hist.past.length || pending);
    $('#redoBtn').disabled = !hist.future.length;
  }
  function restore(json) {
    state = JSON.parse(json); hist.last = json;
    renderInputs(); renderOutputs(); renderScenarioSelect();
    dirty = true; updateSaveUi(); updateHistUi();
  }
  function undo() { histCommit(); if (!hist.past.length) return; hist.future.push(hist.last); restore(hist.past.pop()); toast('Undone'); }
  function redo() { if (!hist.future.length) return; hist.past.push(hist.last); restore(hist.future.pop()); toast('Redone'); }
  $('#undoBtn').addEventListener('click', undo);
  $('#redoBtn').addEventListener('click', redo);
  document.addEventListener('keydown', e => {
    if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z' && e.key.toLowerCase() !== 'y') return;
    const tg = e.target;
    if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA') && tg.type !== 'checkbox' && tg.type !== 'range') return; // let the field undo its own typing
    e.preventDefault();
    if (e.key.toLowerCase() === 'y' || e.shiftKey) redo(); else undo();
  });
