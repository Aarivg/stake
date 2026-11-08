  /* ---------- inputs panel ---------- */
  const KINDS = [['post', 'Post-money SAFE'], ['pre', 'Pre-money SAFE'], ['mfn', 'Uncapped MFN'], ['note', 'Convertible note']];
  const numField = (label, path, v, kind, extra = '', hide = false, g = '') => `<label class="field"><span${hide ? ' class="sr"' : ''}>${label}${g && !hide ? ' ' + q(g) : ''}</span><input class="num" type="text" inputmode="decimal" id="f-${path.replace(/\./g, '-')}" data-bind="${path}" data-kind="${kind}" value="${esc(fmtInput(v, kind))}" ${extra} autocomplete="off" spellcheck="false"></label>`;
  const textField = (label, path, v, hide = false) => `<label class="field"><span${hide ? ' class="sr"' : ''}>${label}</span><input type="text" id="f-${path.replace(/\./g, '-')}" data-bind="${path}" data-kind="text" value="${esc(v)}" autocomplete="off"></label>`;

  function renderInputs() {
    const s = state;
    let h = `<section class="panel intro"><p><b>Every number here is editable.</b> The examples are only starting points. Enter your own shareholders, SAFEs and rounds (through Series G), then save the scenario and compare it with alternatives.</p><div class="actions"><button class="btn small solid" type="button" data-act="course">New to this? Take the 8-lesson course</button><button class="btn small" type="button" data-act="blank">Start blank</button><button class="btn small" type="button" data-act="save">Save this scenario</button></div><p class="simple-note" style="margin:10px 0 0">Beginner view hides discounts, liquidation terms, anti-dilution and goal seek until you use them. Switch to Standard to see everything again.</p></section>`;
    h += `<section class="panel"><header><h2><span class="n">01</span>Shareholders today</h2></header>
      <p class="help">Issued shares and the option pool before anything converts. Type amounts like 4.5m or 750k.</p><div class="stack">`;
    s.holders.forEach((x, i) => {
      h += `<div class="row r-holder">${textField('Name', `holders.${i}.name`, x.name, i > 0)}
        <label class="field f-type"><span${i > 0 ? ' class="sr"' : ''}>Type</span><select id="f-holders-${i}-type" data-bind="holders.${i}.type" data-kind="select"><option value="founder"${x.type === 'founder' ? ' selected' : ''}>Founder</option><option value="common"${x.type !== 'founder' ? ' selected' : ''}>Other common</option></select></label>
        ${numField('Shares', `holders.${i}.shares`, x.shares, 'shares', '', i > 0, 'shares')}
        <button class="x" type="button" data-act="del-holder" data-i="${i}" aria-label="Remove ${esc(x.name)}" ${s.holders.length < 2 ? 'disabled' : ''}>×</button></div>`;
    });
    h += `<button class="add" type="button" data-act="add-holder">+ Add shareholder</button>
      <div class="row r-2">${numField('Options granted', 'optionsGranted', s.optionsGranted, 'shares', '', false, 'optionsGranted')}${numField('Unallocated pool', 'poolUnallocated', s.poolUnallocated, 'shares', '', false, 'pool')}</div>
      <div class="derived" id="d-today"></div></div></section>`;

    h += `<section class="panel"><header><h2><span class="n">02</span>SAFEs &amp; notes</h2><span class="derived" id="d-safetotal"></span></header>
      <p class="help">Each converts at the priced round you pick (the first one by default). An MFN SAFE copies the best terms of SAFEs listed below it that convert in the same round.</p><div class="stack">`;
    s.instruments.forEach((x, i) => {
      const isNote = x.kind === 'note', isMfn = x.kind === 'mfn';
      h += `<div class="item"><span class="stripe" style="background:var(--s2)"></span>
        <div class="item-head">${textField('Name', `instruments.${i}.name`, x.name)}<button class="x" type="button" data-act="del-inst" data-i="${i}" aria-label="Remove ${esc(x.name)}">×</button></div>
        <div class="row r-2"><label class="field"><span>Type ${q(x.kind === 'mfn' ? 'mfn' : x.kind === 'note' ? 'note' : x.kind === 'pre' ? 'pre' : 'post')}</span><select id="f-instruments-${i}-kind" data-bind="instruments.${i}.kind" data-kind="select" data-rerender="1">${KINDS.map(k => `<option value="${k[0]}"${x.kind === k[0] ? ' selected' : ''}>${k[1]}</option>`).join('')}</select></label>
        ${numField(isNote ? 'Principal' : 'Amount', `instruments.${i}.amount`, x.amount, 'money')}</div>
        <div class="row ${isNote ? 'r-2' : 'r-2'}">${isMfn ? `<label class="field"><span>Valuation cap</span><input type="text" id="f-instruments-${i}-cap" value="Inherits" disabled></label>` : numField(x.kind === 'post' ? 'Post-money cap' : 'Pre-money cap', `instruments.${i}.cap`, x.cap, 'money', 'placeholder="none"', false, 'cap')}
        <div class="adv${x.discount > 0 ? ' set' : ''}">${numField('Discount', `instruments.${i}.discount`, x.discount, 'pct', '', false, 'discount')}</div></div>
        ${isNote ? `<div class="row r-2">${numField('Interest / yr', `instruments.${i}.rate`, x.rate, 'pct')}${numField('Months until round', `instruments.${i}.months`, x.months, 'int')}</div>` : ''}
        ${s.rounds.length > 1 || (x.round || 0) > 0 ? `<div class="adv${(x.round || 0) > 0 ? ' set' : ''}"><label class="field"><span>Converts at ${q('convertsAt')}</span><select id="f-instruments-${i}-round" data-bind="instruments.${i}.round" data-kind="selectnum">${s.rounds.map((r, ri) => `<option value="${ri}"${(x.round || 0) === ri ? ' selected' : ''}>${esc(r.name)}${ri > 0 ? ' (bridge)' : ''}</option>`).join('')}${(x.round || 0) >= s.rounds.length ? `<option value="${x.round}" selected>A later round (not modelled yet)</option>` : ''}</select></label></div>` : ''}
        <div class="derived" id="d-inst-${i}"></div></div>`;
    });
    h += `<button class="add" type="button" data-act="add-inst">+ Add SAFE or note</button></div></section>`;

    h += `<section class="panel"><header><h2><span class="n">03</span>Priced rounds</h2></header>
      <p class="help">The option pool target is the unallocated pool investors want after the round. It is carved out of the pre-money.</p><div class="stack">`;
    s.rounds.forEach((r, i) => {
      h += `<div class="item"><span class="stripe" style="background:${roundColor(i)}"></span>
        <div class="item-head">${textField('Round', `rounds.${i}.name`, r.name)}<button class="x" type="button" data-act="del-round" data-i="${i}" aria-label="Remove ${esc(r.name)}">×</button></div>
        <div class="row r-2">${numField('Pre-money valuation', `rounds.${i}.preMoney`, r.preMoney, 'money', '', false, 'premoney')}${numField('Amount raised', `rounds.${i}.raise`, r.raise, 'money', '', false, 'raise')}</div>
        <div class="row r-2">${numField('Pool target (post)', `rounds.${i}.poolPct`, r.poolPct, 'pct', '', false, 'poolTarget')}
          <div class="adv${+r.multiple !== 1 ? ' set' : ''}"><label class="field"><span>Liquidation pref ${q('liqpref')}</span><select id="f-rounds-${i}-multiple" data-bind="rounds.${i}.multiple" data-kind="selectnum">${[1, 1.5, 2, 3].map(m => `<option value="${m}"${+r.multiple === m ? ' selected' : ''}>${m}x</option>`).join('')}</select></label></div></div>
        <div class="adv stack${r.participating || (r.antiDilution || 'bbwa') !== 'bbwa' ? ' set' : ''}"><div class="row r-2"><label class="field"><span>Anti-dilution ${q('antidilution')}</span><select id="f-rounds-${i}-ad" data-bind="rounds.${i}.antiDilution" data-kind="select">${[['bbwa', 'Weighted avg.'], ['full', 'Full ratchet'], ['none', 'None']].map(o => `<option value="${o[0]}"${(r.antiDilution || 'bbwa') === o[0] ? ' selected' : ''}>${o[1]}</option>`).join('')}</select></label>
          ${r.participating ? `<label class="field"><span>Participation cap ${q('partcap')}</span><select id="f-rounds-${i}-pcap" data-bind="rounds.${i}.partCap" data-kind="selectnum">${[[0, 'No cap'], [2, '2x'], [3, '3x'], [4, '4x']].map(o => `<option value="${o[0]}"${(+r.partCap || 0) === o[0] ? ' selected' : ''}>${o[1]}</option>`).join('')}</select></label>` : '<span></span>'}</div>
        <label class="toggle"><input type="checkbox" id="f-rounds-${i}-part" data-bind="rounds.${i}.participating" data-kind="check" data-rerender="1"${r.participating ? ' checked' : ''}> Participating preferred ${q('participating')}</label></div>
        <div class="derived" id="d-round-${i}"></div></div>`;
    });
    h += s.rounds.length < MAX_ROUNDS ? `<button class="add" type="button" data-act="add-round">+ Add priced round</button>` : '';
    h += `</div></section>`;

    h += `<section class="panel adv${s.seniority === 'pari' ? ' set' : ''}"><header><h2><span class="n">04</span>Liquidation seniority ${q('seniority')}</h2></header>
      <p class="help">Who gets paid back first when an exit doesn't cover every preference.</p>
      <div class="seg" role="group" aria-label="Seniority"><button type="button" data-act="sen" data-v="standard" aria-pressed="${s.seniority !== 'pari'}">Newest round first</button><button type="button" data-act="sen" data-v="pari" aria-pressed="${s.seniority === 'pari'}">Pari passu</button></div></section>`;
    $('#inputs').innerHTML = h;
  }

  function setPath(path, val) {
    const parts = path.split('.');
    let o = state;
    for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    o[parts[parts.length - 1]] = val;
  }
  function getPath(path) { return path.split('.').reduce((o, k) => o && o[k], state); }

  const inputsEl = $('#inputs');
  inputsEl.addEventListener('input', e => {
    const t = e.target, path = t.dataset.bind;
    if (!path) return;
    const k = t.dataset.kind;
    if (k === 'text') { setPath(path, t.value); }
    else if (k === 'check' || k === 'select' || k === 'selectnum') return;
    else {
      const v = parseNum(t.value);
      if (v == null) { t.setAttribute('aria-invalid', 'true'); return; }
      t.removeAttribute('aria-invalid');
      setPath(path, k === 'int' ? Math.round(v) : v);
    }
    renderOutputs(); changed();
  });
  inputsEl.addEventListener('change', e => {
    const t = e.target, path = t.dataset.bind;
    if (!path) return;
    const k = t.dataset.kind;
    if (k === 'check') setPath(path, t.checked);
    else if (k === 'select') setPath(path, t.value);
    else if (k === 'selectnum') setPath(path, +t.value);
    else if (k === 'text') return;
    else { t.value = fmtInput(getPath(path), k); return; }
    if (t.dataset.rerender) { const id = t.id; renderInputs(); const n = document.getElementById(id); if (n) n.focus(); }
    renderOutputs(); changed();
  });
  inputsEl.addEventListener('focusout', e => {
    const t = e.target, path = t.dataset && t.dataset.bind;
    if (!path) return;
    const k = t.dataset.kind;
    if (['money', 'shares', 'pct', 'int'].includes(k)) { t.value = fmtInput(getPath(path), k); t.removeAttribute('aria-invalid'); }
  });
  inputsEl.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const i = +b.dataset.i;
    if (b.dataset.act === 'blank') { loadPreset('blank'); return; }
    if (b.dataset.act === 'course') { startCourse(); return; }
    if (b.dataset.act === 'save') { openSave(); return; }
    switch (b.dataset.act) {
      case 'add-holder': state.holders.push({ id: nid(), name: 'Angel (common)', type: 'common', shares: 100000 }); break;
      case 'del-holder': state.holders.splice(i, 1); break;
      case 'add-inst': state.instruments.push({ id: nid(), name: 'New SAFE', kind: 'post', amount: 250000, cap: 10000000, discount: 0, rate: 0, months: 0, round: 0 }); break;
      case 'del-inst': state.instruments.splice(i, 1); break;
      case 'add-round': {
        const last = state.rounds[state.rounds.length - 1];
        const pre = last ? Math.round((last.preMoney + last.raise) * 2.5 / 1e6) * 1e6 : 10000000;
        state.rounds.push({ id: nid(), name: ROUND_NAMES[state.rounds.length] || 'Round ' + (state.rounds.length + 1), preMoney: pre, raise: Math.round(pre / 3 / 1e6) * 1e6 || 1000000, poolPct: 10, multiple: 1, participating: false });
        break;
      }
      case 'del-round':
        state.rounds.splice(i, 1);
        state.instruments.forEach(x => { if ((x.round || 0) > i) x.round--; });
        break;
      case 'sen': state.seniority = b.dataset.v; break;
      default: return;
    }
    ui.stage = null; ui.exitStage = null;
    renderInputs(); renderOutputs(); changed();
  });

  function updateDerived() {
    const st0 = model.stages[0];
    const d = $('#d-today');
    if (d) { const bad = !(st0.total > 0) ? 'Add at least one shareholder with shares.' : ''; d.classList.toggle('bad', !!bad); d.textContent = bad || `${shares(st0.total)} fully diluted · founders ${pct(founderShare(st0))}`; }
    const tot = sum(state.instruments, x => x.amount || 0);
    const dt = $('#d-safetotal'); if (dt) dt.textContent = tot ? money(tot) + ' total' : '';
    state.instruments.forEach((x, i) => {
      const el = document.getElementById('d-inst-' + i); if (!el) return;
      const first = model.stages.find(s => s.idx === (x.round || 0));
      const row = first && first.rows.find(r => r.id === 's' + x.id);
      const res = model.resolved[i];
      let t = '';
      if (x.kind === 'mfn') t = res && res.mfnFrom ? `Inherits ${money(res.cap)} cap from ${res.mfnFrom}. ` : 'No later capped SAFE, converts at round price. ';
      if (x.kind === 'note' && res) t += `Converts ${money(res.convAmount)} with interest. `;
      let bad = '';
      if (x.kind === 'post' && x.cap > 0 && x.cap <= x.amount) bad = 'The cap has to be bigger than the amount, otherwise this SAFE would own over 100% of the company.';
      else if (x.discount >= 100) bad = 'Discount has to be under 100%.';
      else if (!(x.amount > 0)) bad = 'Enter an amount, or remove this row.';
      el.classList.toggle('bad', !!bad);
      if (bad) { el.textContent = bad; return; }
      if (row) t += `→ ${pct(row.shares / first.total, 2)} after ${first.name}, via ${row.method === 'round' ? 'round price' : row.method} at ${price(row.price)}`;
      else if (!first) t += (x.round || 0) > 0 ? 'Converts at a round you haven\'t added yet' : x.kind === 'post' && x.cap > 0 ? `Locks in ${pct(x.amount / x.cap, 2)} of pre-round capitalization` : 'Add a priced round to convert';
      el.textContent = t;
    });
    state.rounds.forEach((r, i) => {
      const el = document.getElementById('d-round-' + i); if (!el) return;
      const st = model.stages.find(s => s.idx === i);
      const err = (model.errors || []).find(x => x.ri === i);
      const blocked = !st && r.preMoney > 0 && (model.errors || []).some(x => x.ri < i);
      const bad = !(r.preMoney > 0) ? 'Enter a pre-money valuation. This round is skipped until you do.' : err ? err.msg : blocked ? 'Not calculated: an earlier round can’t be priced.' : r.poolPct > 60 ? 'Pool targets above 60% are capped at 60%.' : '';
      el.classList.toggle('bad', !!bad);
      el.textContent = bad || (st ? `Post-money ${money(r.preMoney + r.raise)} · ${price(st.pps)}/share · investors ${pct(st.res.nNew / st.res.total)}` : '');
    });
  }
