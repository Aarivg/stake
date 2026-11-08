  /* ---------- more menu: export, import, print ---------- */
  const framed = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
  const closeMenu = () => { const d = document.querySelector('.more'); if (d) d.open = false; };
  if (framed) $('#printBtn').hidden = true;
  $('#exportJson').textContent = framed ? 'Copy scenario as JSON' : 'Export scenario (JSON)';
  $('#exportJson').addEventListener('click', () => {
    closeMenu();
    const json = JSON.stringify({ app: 'stake', version: 1, name: currentName(), state: snapshot() }, null, 2);
    if (framed) { copy(json, 'Scenario JSON copied. Import it later from the More menu.'); return; }
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      a.download = (currentName().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'scenario') + '.stake.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast('Scenario downloaded.');
    } catch (err) { copy(json, 'Download blocked, so the JSON was copied instead.'); }
  });
  $('#importJson').addEventListener('click', () => { closeMenu(); $('#importFile').click(); });
  $('#importFile').addEventListener('change', async e => {
    const f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const st = data && data.state ? data.state : data;
      if (!valid(st)) throw new Error('not a scenario');
      histCommit(); hist.past.push(hist.last); hist.future = [];
      state = st; delete state.savedId; delete state.preset; bumpIds();
      resetUi(); renderInputs(); renderOutputs(); renderScenarioSelect();
      dirty = true; updateSaveUi(); hist.last = JSON.stringify(state); updateHistUi();
      toast(`Imported “${data.name || f.name}”. Save it to keep it in this browser.`);
    } catch (err) { toast('That file isn’t a Stake scenario. Export one from the More menu first.'); }
  });
  $('#printBtn').addEventListener('click', () => { closeMenu(); window.print(); });
  document.addEventListener('click', e => { const d = document.querySelector('.more'); if (d && d.open && !d.contains(e.target)) d.open = false; });
