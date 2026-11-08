  const E = window.StakeEngine;
  const $ = s => document.querySelector(s);
  const sum = E.sum;
  let uid = 1000;
  const nid = () => ++uid;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- formatting ---------- */
  const trim = (x, d) => String(+x.toFixed(d));
  function money(v) {
    if (v == null || !isFinite(v)) return '—';
    const a = Math.abs(v), s = v < 0 ? '−' : '';
    if (a >= 1e9) return s + '$' + trim(a / 1e9, 2) + 'B';
    if (a >= 1e6) return s + '$' + trim(a / 1e6, a >= 1e8 ? 0 : a >= 1e7 ? 1 : 2) + 'M';
    if (a >= 1e3) return s + '$' + trim(a / 1e3, a >= 1e5 ? 0 : 1) + 'K';
    return s + '$' + Math.round(a);
  }
  const price = v => { if (v == null || !isFinite(v)) return '—'; if (v >= 1) return '$' + v.toFixed(2); let t = v.toFixed(4).replace(/0+$/, ''); if (t.split('.')[1].length < 2) t = v.toFixed(2); return '$' + t; };
  const pct = (v, d = 1) => (v == null || !isFinite(v)) ? '—' : (v * 100).toFixed(d) + '%';
  const shares = v => Math.round(v).toLocaleString('en-US');
  const pts = v => (v * 100).toFixed(1) + ' pts';
  function moneyInput(v) {
    if (!v) return '$0';
    const m = v / 1e6, k = v / 1e3;
    const g = v / 1e9;
    if (v >= 1e9 && Math.abs(g - +g.toFixed(3)) < 1e-9) return '$' + trim(g, 3) + 'B';
    if (v >= 1e6 && Math.abs(m - +m.toFixed(3)) < 1e-9) return '$' + trim(m, 3) + 'M';
    if (v >= 1e3 && Math.abs(k - +k.toFixed(2)) < 1e-9) return '$' + trim(k, 2) + 'K';
    return '$' + Math.round(v).toLocaleString('en-US');
  }
  function fmtInput(v, kind) {
    v = +v || 0;
    if (kind === 'money') return moneyInput(v);
    if (kind === 'shares') return shares(v);
    if (kind === 'pct') return trim(v, 2) + '%';
    return String(v);
  }
  function parseNum(str) {
    let s = String(str).trim().toLowerCase().replace(/[$,\s%x_]/g, '');
    if (!s) return 0;
    let m = 1;
    const last = s.slice(-1);
    if (last === 'k') { m = 1e3; s = s.slice(0, -1); }
    else if (last === 'm') { m = 1e6; s = s.slice(0, -1); }
    else if (last === 'b') { m = 1e9; s = s.slice(0, -1); }
    const n = parseFloat(s);
    return isFinite(n) && n >= 0 ? n * m : null;
  }
  function monthLabel(t) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + t);
    return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  }
  function niceCeil(v) {
    if (!(v > 0)) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const f = v / p;
    const n = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
    return n * p;
  }
