/* Stake — cap table engine. Pure functions, no DOM. */
(function (root) {
  'use strict';

  const sum = (arr, f) => arr.reduce((a, x) => a + (f ? f(x) : x), 0);

  /* Amount a convertible turns into equity: notes accrue simple interest. */
  function convAmount(s) {
    if (s.kind === 'note') {
      const yrs = (s.months || 0) / 12;
      return s.amount * (1 + ((s.rate || 0) / 100) * yrs);
    }
    return s.amount;
  }

  /* MFN SAFEs inherit the best terms of SAFEs issued after them (listed below them). */
  function resolveInstruments(insts) {
    return insts.map((s, i) => {
      const base = Object.assign({}, s, { convAmount: convAmount(s) });
      if (s.kind !== 'mfn') return base;
      const later = insts.slice(i + 1).filter(t => (t.kind === 'post' || t.kind === 'pre') && t.cap > 0 && (t.round || 0) === (s.round || 0));
      if (!later.length) return Object.assign(base, { kind: 'post', cap: 0, discount: s.discount || 0, mfnFrom: null, mfn: true });
      const best = later.reduce((a, b) => (b.cap < a.cap ? b : a));
      const disc = Math.max(s.discount || 0, ...later.map(t => t.discount || 0));
      return Object.assign(base, { kind: best.kind, cap: best.cap, discount: disc, mfnFrom: best.name, mfn: true });
    });
  }

  /* Conversion price for one instrument given round price P, the pre-money capitalization
     (excluding converting securities) `base`, and the post-money-SAFE capitalization `C`. */
  function priceFor(s, P, base, C) {
    const d = (s.discount || 0) / 100;
    const discPrice = d > 0 ? P * (1 - d) : Infinity;
    let capPrice = Infinity;
    if (s.cap > 0) capPrice = s.kind === 'post' ? s.cap / C : s.cap / base;
    if (capPrice === Infinity && discPrice === Infinity) return { price: P, method: 'round' };
    if (capPrice <= discPrice) return { price: capPrice, method: 'cap' };
    return { price: discPrice, method: 'discount' };
  }

  /* Shares an earlier preferred holding gains from anti-dilution when a round prices below it.
     Broad-based weighted average: CP2 = CP1 * (A + B) / (A + C), where A = fully diluted shares
     before the round, B = shares the new money would buy at CP1, C = shares it actually buys.
     Full ratchet: CP2 = new price. */
  function antiDilution(prior, P, A, I) {
    return prior.map(h => {
      if (!(h.cp > P) || h.ad === 'none' || !(I > 0)) return { id: h.id, extra: 0, cp: h.cp };
      const cp2 = h.ad === 'full' ? P : h.cp * (A + I / h.cp) / (A + I / P);
      return { id: h.id, extra: h.shares * (h.cp / cp2 - 1), cp: cp2 };
    });
  }

  /* Price a round: converts SAFEs/notes, tops up the pool in the pre-money (the "pool shuffle"),
     issues anti-dilution shares to earlier series on a down round, and solves the circular math
     by fixed-point iteration. Pool top-up and anti-dilution shares sit in the pre-money, so the
     new investors get exactly raise / post-money.
     S  = fully diluted shares before the round (incl. unallocated pool U0). */
  function priceRound(S, U0, round, insts, prior) {
    prior = prior || [];
    const Vpre = round.preMoney, I = round.raise || 0;
    const p = Math.min(Math.max((round.poolPct || 0) / 100, 0), 0.6);
    const k = (Vpre + I) / Vpre;
    let dPool = 0, C = S, P = Vpre / S;
    let warn = null, blown = false;

    const solveC = (base, Cstart) => {
      let Cg = Math.max(Cstart, base);
      for (let it = 0; it < 2000; it++) {
        const Pg = Vpre / Cg;
        let fixed = 0, f = 0;
        for (const s of insts) {
          const r = priceFor(s, Pg, base, Cg);
          if (r.method === 'cap' && s.kind === 'post') f += s.convAmount / s.cap;
          else fixed += s.convAmount / r.price;
        }
        antiDilution(prior, Pg, S, I).forEach(a => { fixed += a.extra; });
        if (f >= 0.98) { warn = 'Post-money SAFEs converting here claim nearly all of the company. Check the caps against the amounts.'; f = 0.98; }
        const Cn = (base + fixed) / (1 - f);
        if (!isFinite(Cn) || Cn > 1e4 * S) { blown = true; return Cg; }
        if (Math.abs(Cn - Cg) <= 1e-10 * Cg) return Cn;
        Cg = Cn;
      }
      return Cg;
    };

    for (let o = 0; o < 2000; o++) {
      C = solveC(S + dPool, C);
      if (blown) break;
      const dNew = Math.max(0, p * C * k - U0);
      if (Math.abs(dNew - dPool) <= 1e-10 * C) { dPool = dNew; break; }
      dPool = dNew;
    }
    const base = S + dPool;
    C = solveC(base, C);
    P = Vpre / C;
    if (blown || !(P > 0) || !isFinite(P)) {
      return { infeasible: true, warn: 'This round can’t be priced: anti-dilution shares, conversions and the pool top-up would need more than the entire pre-money valuation. Raise the pre-money, lower the pool target, or soften the anti-dilution terms.' };
    }

    const conv = insts.map(s => {
      const r = priceFor(s, P, base, C);
      let shares;
      if (r.method === 'cap' && s.kind === 'post') shares = (s.convAmount / s.cap) * C;
      else shares = s.convAmount / r.price;
      return { inst: s, shares, price: s.convAmount / shares, method: r.method };
    });
    const adj = antiDilution(prior, P, S, I).filter(a => a.extra > 0);
    const nNew = I / P;
    return { P, dPool, base, C, nNew, conv, adj, total: C + nNew, warn };
  }

  /* Build ownership snapshots: Today, then after each priced round. */
  function buildStages(state) {
    const rows = [];
    state.holders.forEach(h => {
      if (h.shares > 0) rows.push({ id: 'h' + h.id, label: h.name || 'Holder', group: h.type === 'founder' ? 'founder' : 'common', shares: h.shares, invested: 0, pref: 0, rank: -1, part: false });
    });
    if (state.optionsGranted > 0) rows.push({ id: 'opt', label: 'Employee options (granted)', group: 'options', shares: state.optionsGranted, invested: 0, pref: 0, rank: -1, part: false });
    rows.push({ id: 'pool', label: 'Unallocated option pool', group: 'pool', shares: state.poolUnallocated || 0, invested: 0, pref: 0, rank: -1, part: false });

    const clone = rs => rs.map(r => Object.assign({}, r));
    const stages = [{ name: 'Today', rows: clone(rows), total: sum(rows, r => r.shares), pps: null, res: null, round: null }];
    const resolved = resolveInstruments(state.instruments || []);
    let cur = clone(rows);

    const errors = [];
    const rounds = state.rounds || [];
    for (let ri = 0; ri < rounds.length; ri++) {
      const round = rounds[ri];
      if (!(round.preMoney > 0)) continue;
      const S = sum(cur, r => r.shares);
      const poolRow = cur.find(r => r.id === 'pool');
      const insts = resolved.filter(s => s.convAmount > 0 && (s.round || 0) === ri);
      const prior = cur.filter(r => r.pref > 0 && r.cp > 0).map(r => ({ id: r.id, shares: r.shares, cp: r.cp, ad: r.ad || 'bbwa' }));
      const res = priceRound(S, poolRow.shares, round, insts, prior);
      if (res.infeasible) { errors.push({ ri, name: round.name, msg: res.warn }); break; }
      poolRow.shares += res.dPool;
      res.adj.forEach(a => {
        const r = cur.find(x => x.id === a.id);
        r.shares += a.extra; r.cp = a.cp; r.adShares = (r.adShares || 0) + a.extra;
      });
      const mult = round.multiple == null ? 1 : round.multiple;
      const capM = round.participating && round.partCap > 0 ? round.partCap : 0;
      const ad = round.antiDilution || 'bbwa';
      res.conv.forEach(c => {
        cur.push({
          id: 's' + c.inst.id, label: c.inst.name || 'SAFE', group: 'safe', shares: c.shares,
          invested: c.inst.amount, pref: c.inst.convAmount * mult, rank: ri, part: !!round.participating,
          capAmt: capM ? c.inst.convAmount * capM : 0, roundName: round.name, price: c.price, cp: c.price, ad,
          method: c.method, inst: c.inst
        });
      });
      if (round.raise > 0) {
        cur.push({ id: 'r' + ri, label: (round.name || 'Round') + ' investors', group: 'investor', shares: res.nNew, invested: round.raise, pref: round.raise * mult, rank: ri, part: !!round.participating, capAmt: capM ? round.raise * capM : 0, roundName: round.name, price: res.P, cp: res.P, ad });
      }
      stages.push({ name: round.name || ('Round ' + (ri + 1)), rows: clone(cur), total: sum(cur, r => r.shares), pps: res.P, res, round, idx: ri });
    }
    return { stages, resolved, errors };
  }

  /* Liquidation waterfall. Preferences are paid by seniority, then the rest goes pro rata to common,
     converted holders and participating preferred. A participation cap limits a participating
     holder's total (preference included); above it they would rather convert. */
  function distribute(parts, E, seniority, converted) {
    let remaining = Math.max(0, E);
    const pay = {};
    parts.forEach(r => { pay[r.id] = 0; });
    const claims = parts.filter(r => r.pref > 0 && !converted.has(r.id));
    const rankOf = r => (seniority === 'pari' ? 0 : r.rank);
    const ranks = [...new Set(claims.map(rankOf))].sort((a, b) => b - a);
    for (const rk of ranks) {
      const grp = claims.filter(r => rankOf(r) === rk);
      const tot = sum(grp, r => r.pref);
      const paid = Math.min(remaining, tot);
      grp.forEach(r => { pay[r.id] += tot > 0 ? paid * r.pref / tot : 0; });
      remaining -= paid;
    }
    const prefPaid = Math.max(0, E) - remaining;
    let resid = parts.filter(r => r.pref === 0 || converted.has(r.id) || r.part);
    let pps = 0;
    for (let guard = 0; guard <= parts.length; guard++) {
      const sh = sum(resid, r => r.shares);
      pps = sh > 0 ? remaining / sh : 0;
      const over = resid.filter(r => r.part && !converted.has(r.id) && r.capAmt > 0 && pay[r.id] + r.shares * pps > r.capAmt + 1e-9);
      if (!over.length) break;
      over.forEach(r => { const take = Math.max(0, r.capAmt - pay[r.id]); pay[r.id] += take; remaining -= take; });
      resid = resid.filter(r => !over.includes(r));
    }
    resid.forEach(r => { pay[r.id] += r.shares * pps; });
    return { pay, pps, prefPaid };
  }

  /* Threshold per share above which a preferred holder is better off converting to common. */
  const convThreshold = r => (r.part ? (r.capAmt > 0 ? r.capAmt / r.shares : Infinity) : r.pref / r.shares);

  function waterfall(rows, E, seniority) {
    const parts = rows.filter(r => r.group !== 'pool' && r.shares > 0);
    const prefRows = parts.filter(r => r.pref > 0 && isFinite(convThreshold(r)));
    const converted = new Set();
    let res = distribute(parts, E, seniority, converted);
    for (let i = 0; i < prefRows.length; i++) {
      const cand = prefRows.filter(r => !converted.has(r.id) && convThreshold(r) < res.pps * (1 - 1e-12));
      if (!cand.length) break;
      cand.sort((a, b) => convThreshold(a) - convThreshold(b));
      converted.add(cand[0].id);
      res = distribute(parts, E, seniority, converted);
    }
    res.converted = converted;
    res.parts = parts;
    return res;
  }

  /* Lowest exit value at which every non-participating holder converts, so payouts match ownership. */
  function conversionPoint(rows, seniority, hi) {
    const parts = rows.filter(r => r.group !== 'pool' && r.shares > 0);
    const pr = parts.filter(r => r.pref > 0);
    if (!pr.length || pr.some(r => !isFinite(convThreshold(r)))) return null;
    let lo = 0, up = hi;
    if (waterfall(rows, up, seniority).converted.size < pr.length) return null;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + up) / 2;
      if (waterfall(rows, mid, seniority).converted.size >= pr.length) up = mid; else lo = mid;
    }
    return up;
  }

  /* Runway simulation, month by month. */
  function simulate(rw, opts) {
    const n = (opts && opts.months) || 60;
    const g = opts && opts.growth != null ? opts.growth : rw.growth / 100;
    const bg = (rw.burnGrowth || 0) / 100;
    const withRaise = opts && opts.withRaise;
    const cash = [rw.cash], rev = [], exp = [];
    let c = rw.cash;
    for (let t = 0; t < n; t++) {
      const r = rw.mrr * Math.pow(1 + g, t);
      const e = rw.burn * Math.pow(1 + bg, t);
      rev.push(r); exp.push(e);
      if (withRaise && t === rw.raiseMonth) c += rw.raise;
      c += r - e;
      cash.push(c);
    }
    const out = cash.findIndex(v => v < 0);
    const be = rev.findIndex((v, t) => v >= exp[t]);
    /* runway in months, fractional: full months covered plus the part of the month the last cash lasts */
    const runway = out === -1 ? null : (out - 1) + cash[out - 1] / (cash[out - 1] - cash[out]);
    return { cash, rev, exp, outMonth: out === -1 ? null : out, runway, outIdx: out === -1 ? null : out - 1, breakEven: be === -1 ? null : be };
  }

  function isAlive(rw, g, n) {
    const s = simulate(rw, { growth: g, months: n, withRaise: false });
    return s.outMonth === null && s.rev[n - 1] >= s.exp[n - 1];
  }

  function runway(rw) {
    const n = 60;
    const base = simulate(rw, { months: n, withRaise: false });
    const funded = simulate(rw, { months: n, withRaise: true });
    const alive = isAlive(rw, rw.growth / 100, n);
    let reqGrowth = null;
    if (!alive) {
      if (isAlive(rw, 1, n)) {
        let lo = rw.growth / 100, hi = 1;
        for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (isAlive(rw, m, n)) hi = m; else lo = m; }
        reqGrowth = hi;
      }
    }
    const raiseFor = months => {
      const m = rw.raiseMonth;
      const preNeg = base.cash.slice(0, m + 1).some(v => v < 0);
      let minC = Infinity;
      for (let t = m + 1; t <= Math.min(n, m + months); t++) minC = Math.min(minC, base.cash[t]);
      return { amount: Math.max(0, -minC), tooLate: preNeg };
    };
    return { base, funded, alive, reqGrowth, raiseFor, months: n };
  }

  const api = { convAmount, resolveInstruments, antiDilution, priceRound, buildStages, waterfall, conversionPoint, simulate, runway, sum };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StakeEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
