  /* ---------- saved scenarios ---------- */
  const SKEY = 'stake.scenarios.v1';
  let saved = [];
  let dirty = false;
  function loadSaved() { try { const v = JSON.parse(localStorage.getItem(SKEY) || '[]'); return Array.isArray(v) ? v.filter(x => x && valid(x.state)) : []; } catch (e) { return []; } }
  function writeSaved() { try { localStorage.setItem(SKEY, JSON.stringify(saved)); return true; } catch (e) { return false; } }
  const clone = o => JSON.parse(JSON.stringify(o));
  function snapshot() { const c = clone(state); delete c.savedId; delete c.preset; return c; }
  function changed() { dirty = true; updateSaveUi(); histTouch(); }
  function currentName() {
    const sv = state.savedId && saved.find(x => x.id === state.savedId);
    if (sv) return sv.name;
    if (state.preset && PRESETS[state.preset]) return PRESETS[state.preset].label;
    return 'Shared scenario';
  }
  function updateSaveUi() {
    const d = $('#dirty');
    if (d) d.textContent = dirty ? (state.savedId ? 'Unsaved changes' : 'Not saved yet') : '';
  }
  function renderScenarioSelect() {
    const sv = state.savedId && saved.find(x => x.id === state.savedId);
    const curVal = sv ? 's:' + sv.id : state.preset && PRESETS[state.preset] ? 'p:' + state.preset : 'cur';
    sel.innerHTML = (curVal === 'cur' ? '<option value="cur">Shared scenario</option>' : '') +
      `<optgroup label="Start from">${Object.entries(PRESETS).map(([k, p]) => `<option value="p:${k}">${esc(p.label)}</option>`).join('')}</optgroup>` +
      (saved.length ? `<optgroup label="Your scenarios">${saved.map(x => `<option value="s:${x.id}">${esc(x.name)}</option>`).join('')}</optgroup>` : '');
    sel.value = curVal;
  }
  function openSave() {
    const pop = $('#savePop');
    const sv = state.savedId && saved.find(x => x.id === state.savedId);
    $('#saveName').value = sv ? sv.name : (state.preset === 'blank' || !state.preset ? 'My company' : 'My version of ' + PRESETS[state.preset].label.split(':')[0]);
    $('#saveNew').hidden = !sv;
    $('#saveDo').textContent = sv ? 'Update' : 'Save';
    pop.hidden = false;
    $('#saveName').focus(); $('#saveName').select();
  }
  function closeSave() { $('#savePop').hidden = true; $('#saveBtn').focus(); }
  function doSave(asNew) {
    const name = ($('#saveName').value || '').trim() || 'Untitled scenario';
    const sv = !asNew && state.savedId && saved.find(x => x.id === state.savedId);
    if (sv) { sv.name = name; sv.state = snapshot(); sv.updated = Date.now(); }
    else { const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6); saved.push({ id, name, state: snapshot(), updated: Date.now() }); state.savedId = id; }
    delete state.preset;
    const ok = writeSaved();
    dirty = false; updateSaveUi(); renderScenarioSelect();
    $('#savePop').hidden = true;
    if (ui.tab === 'cmp') renderView();
    save();
    toast(ok ? `Saved “${name}” in this browser.` : 'This browser blocked saving. Use Copy share link to keep this scenario.');
  }
  $('#saveBtn').addEventListener('click', openSave);
  $('#saveDo').addEventListener('click', () => doSave(false));
  $('#saveNew').addEventListener('click', () => doSave(true));
  $('#saveCancel').addEventListener('click', closeSave);
  $('#savePop').addEventListener('keydown', e => { if (e.key === 'Enter') doSave(false); if (e.key === 'Escape') closeSave(); });
