  /* ---------- charts ---------- */
  function dilutionChart(stages) {
    const W = 640, H = 300, ml = 40, mr = 8, mt = 28, mb = 34;
    const iw = W - ml - mr, ih = H - mt - mb;
    const n = stages.length;
    const slot = iw / n, cw = Math.min(86, slot * 0.58);
    const y = v => mt + ih - v * ih;
    const id = 'h' + (++hid);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Ownership by stage, stacked to 100 percent">`;
    s += '<g class="grid">';
    [0, .25, .5, .75, 1].forEach(v => { s += `<line x1="${ml}" x2="${W - mr}" y1="${y(v)}" y2="${y(v)}"/><text x="${ml - 8}" y="${y(v) + 4}" text-anchor="end">${v * 100}%</text>`; });
    s += '</g>';
    const cols = stages.map((st, i) => {
      const a = agg(st), x = ml + slot * i + (slot - cw) / 2;
      let acc = 0; const segs = [];
      ORDER.forEach(k => { if (a[k] > 0) { const f = a[k] / st.total; segs.push({ k, f, y0: acc }); acc += f; } });
      return { st, x, segs, a };
    });
    // founder ribbons
    for (let i = 0; i < n - 1; i++) {
      const A = cols[i], B = cols[i + 1];
      const fa = (A.segs.find(g => g.k === 'founder') || { f: 0 }).f, fb = (B.segs.find(g => g.k === 'founder') || { f: 0 }).f;
      s += `<polygon points="${A.x + cw},${y(0)} ${A.x + cw},${y(fa) + 1} ${B.x},${y(fb) + 1} ${B.x},${y(0)}" fill="var(--s1)" opacity=".13"/>`;
    }
    cols.forEach((c, i) => {
      c.segs.forEach(g => {
        const top = y(g.y0 + g.f), h = Math.max(0, y(g.y0) - top - 2);
        const pat = g.k === 'pool' ? ' stroke="var(--muted)" stroke-dasharray="2 2" stroke-width="1"' : '';
        s += `<rect x="${c.x}" y="${top + 2}" width="${cw}" height="${h}" rx="3" fill="${COLOR[g.k]}"${pat}/>`;
        if (g.k === 'founder' && h > 18) s += `<text class="on-fill" x="${c.x + cw / 2}" y="${top + 2 + Math.min(h / 2 + 4, 18)}" text-anchor="middle">${pct(g.f)}</text>`;
      });
      s += `<text class="lbl-strong" x="${c.x + cw / 2}" y="${mt - 10}" text-anchor="middle">${esc(c.st.name)}</text>`;
      s += `<text x="${c.x + cw / 2}" y="${H - mb + 18}" text-anchor="middle">${c.st.pps ? price(c.st.pps) + '/sh' : 'pre-round'}</text>`;
      s += `<rect x="${ml + slot * i}" y="${mt}" width="${slot}" height="${ih}" fill="transparent" data-hover="${id}" data-i="${i}" style="cursor:crosshair"/>`;
    });
    s += '</svg>';
    reg(id, (e, t) => {
      const c = cols[+t.dataset.i];
      let h = `<div class="t">${esc(c.st.name)}${c.st.pps ? ' · ' + price(c.st.pps) + '/share' : ''}</div>`;
      [...c.segs].reverse().forEach(g => { h += tipLine(COLOR[g.k], glabel(g.k), pct(g.f, 2) + (c.st.pps ? ' · ' + money(c.a[g.k] * c.st.pps) : '')); });
      return h;
    });
    return s;
  }

  function legendFor(keys) {
    return '<ul class="legend">' + keys.map(k => `<li><span class="sw" style="background:${COLOR[k]}"></span>${esc(glabel(k))}</li>`).join('') + '</ul>';
  }

  /* Generic line chart with crosshair hover. series: {name,color,values,dash,area} */
  function lineChart(o) {
    const W = 640, H = o.h || 240, ml = 58, mr = 12, mt = 14, mb = 28;
    const iw = W - ml - mr, ih = H - mt - mb;
    const n = o.series[0].values.length;
    let lo = Math.min(0, ...o.series.flatMap(s => s.values)), hi = Math.max(...o.series.flatMap(s => s.values));
    if (o.yMin != null) lo = o.yMin;
    if (o.clampLow != null) lo = Math.max(lo, o.clampLow);
    const stepY = niceCeil(((hi > 0 ? hi : 1) - lo) / 4);
    lo = Math.floor(lo / stepY) * stepY; hi = Math.max(lo + stepY, Math.ceil((hi > 0 ? hi : 1) / stepY) * stepY);
    const ticks = Math.round((hi - lo) / stepY);
    const x = i => ml + (i / (n - 1)) * iw;
    const y = v => mt + ih - ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * ih;
    const id = 'h' + (++hid);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label)}">`;
    s += `<defs><clipPath id="c${id}"><rect x="${ml}" y="${mt}" width="${iw}" height="${ih}"/></clipPath></defs>`;
    s += '<g class="grid">';
    for (let k = 0; k <= ticks; k++) { const v = lo + stepY * k; s += `<line x1="${ml}" x2="${W - mr}" y1="${y(v)}" y2="${y(v)}"/><text x="${ml - 8}" y="${y(v) + 4}" text-anchor="end">${o.yFmt(v)}</text>`; }
    const step = Math.max(1, Math.round((n - 1) / 6 / 6) * 6);
    for (let i = 0; i < n; i += step) s += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${o.xFmt(i)}</text>`;
    s += '</g>';
    if (lo < 0) s += `<line class="axis" x1="${ml}" x2="${W - mr}" y1="${y(0)}" y2="${y(0)}"/>`;
    (o.marks || []).forEach(m => {
      if (m.i == null || m.i < 0 || m.i > n - 1) return;
      s += `<line x1="${x(m.i)}" x2="${x(m.i)}" y1="${mt}" y2="${mt + ih}" stroke="var(--ink-2)" stroke-dasharray="3 3" stroke-width="1"/><text x="${x(m.i) + 5}" y="${mt + 11}" class="lbl-strong">${esc(m.label)}</text>`;
    });
    s += `<g clip-path="url(#c${id})">`;
    o.series.forEach(se => {
      const pts = se.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
      if (se.area) s += `<polygon points="${x(0)},${y(Math.max(lo, 0))} ${pts.join(' ')} ${x(n - 1)},${y(Math.max(lo, 0))}" fill="${se.color}" opacity=".12"/>`;
      s += `<polyline points="${pts.join(' ')}" fill="none" stroke="${se.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"${se.dash ? ' stroke-dasharray="6 4"' : ''}/>`;
    });
    s += '</g>';
    s += `<line class="xh" id="xh${id}" x1="0" x2="0" y1="${mt}" y2="${mt + ih}" stroke="var(--ink)" stroke-width="1" opacity="0"/>`;
    s += `<rect x="${ml}" y="${mt}" width="${iw}" height="${ih}" fill="transparent" data-hover="${id}" style="cursor:crosshair"/>`;
    s += '</svg>';
    reg(id, (e, t) => {
      const b = t.getBoundingClientRect();
      const i = Math.max(0, Math.min(n - 1, Math.round(((e.clientX - b.left) / b.width) * (n - 1))));
      const l = document.getElementById('xh' + id);
      if (l) { l.setAttribute('x1', x(i)); l.setAttribute('x2', x(i)); l.setAttribute('opacity', .5); }
      let h = `<div class="t">${esc(o.xTip ? o.xTip(i) : o.xFmt(i))}</div>`;
      o.series.forEach(se => { h += tipLine(se.color, se.name, o.yTip ? o.yTip(se.values[i]) : o.yFmt(se.values[i])); });
      return h;
    });
    return s;
  }

  /* 100% stacked area: share of exit proceeds by group across exit values. */
  function shareChart(rows, xmax, seniority, sel, cp, keys) {
    const W = 640, H = 270, ml = 40, mr = 12, mt = 14, mb = 28;
    const iw = W - ml - mr, ih = H - mt - mb, N = 140;
    const xs = [], data = [];
    for (let i = 0; i <= N; i++) {
      const ex = Math.max(xmax * 0.002, (i / N) * xmax);
      xs.push(ex);
      const w = E.waterfall(rows, ex, seniority);
      const g = {};
      w.parts.forEach(r => { const k = gkey(r); g[k] = (g[k] || 0) + w.pay[r.id]; });
      data.push(g);
    }
    const X = v => ml + (v / xmax) * iw, Y = f => mt + ih - f * ih;
    const id = 'h' + (++hid);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Share of exit proceeds by holder group across exit values">`;
    s += '<g class="grid">';
    [0, .25, .5, .75, 1].forEach(v => { s += `<line x1="${ml}" x2="${W - mr}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${ml - 8}" y="${Y(v) + 4}" text-anchor="end">${v * 100}%</text>`; });
    for (let k = 0; k <= 5; k++) { const v = xmax * k / 5; s += `<text x="${X(v)}" y="${H - 8}" text-anchor="middle">${money(v)}</text>`; }
    s += '</g>';
    const base = new Array(N + 1).fill(0);
    keys.forEach(k => {
      const top = data.map((d, i) => base[i] + (d[k] || 0) / xs[i]);
      const up = xs.map((v, i) => `${X(v).toFixed(1)},${Y(top[i]).toFixed(1)}`);
      const dn = xs.map((v, i) => `${X(v).toFixed(1)},${Y(base[i]).toFixed(1)}`).reverse();
      s += `<polygon points="${up.join(' ')} ${dn.join(' ')}" fill="${COLOR[k]}" stroke="var(--sheet)" stroke-width="1.5" stroke-linejoin="round"/>`;
      top.forEach((v, i) => { base[i] = v; });
    });
    if (cp && cp < xmax) s += `<line x1="${X(cp)}" x2="${X(cp)}" y1="${mt}" y2="${mt + ih}" stroke="var(--ink)" stroke-dasharray="3 3"/><text x="${X(cp) - 5}" y="${mt + ih - 8}" text-anchor="end" class="lbl-strong">all preferred converts →</text>`;
    const sx = X(Math.min(sel, xmax));
    s += `<line x1="${sx}" x2="${sx}" y1="${mt - 4}" y2="${mt + ih}" stroke="var(--ink)" stroke-width="2"/><circle cx="${sx}" cy="${mt - 4}" r="4" fill="var(--ink)"/>`;
    s += `<line class="xh" id="xh${id}" x1="0" x2="0" y1="${mt}" y2="${mt + ih}" stroke="var(--ink)" stroke-width="1" opacity="0"/>`;
    s += `<rect x="${ml}" y="${mt}" width="${iw}" height="${ih}" fill="transparent" data-hover="${id}" style="cursor:crosshair"/>`;
    s += '</svg>';
    reg(id, (e, t) => {
      const b = t.getBoundingClientRect();
      const i = Math.max(0, Math.min(N, Math.round(((e.clientX - b.left) / b.width) * N)));
      const l = document.getElementById('xh' + id);
      if (l) { l.setAttribute('x1', X(xs[i])); l.setAttribute('x2', X(xs[i])); l.setAttribute('opacity', .6); }
      let h = `<div class="t">Exit at ${money(xs[i])}</div>`;
      [...keys].reverse().forEach(k => { const v = data[i][k] || 0; if (v > 0 || true) h += tipLine(COLOR[k], glabel(k), money(v) + ' · ' + pct(v / xs[i])); });
      return h;
    });
    return s;
  }
