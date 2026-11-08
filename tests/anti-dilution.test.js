const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../src/engine.js');
const { close, share } = require('./helpers.js');

function downRound(ad) {
  return { holders: [{ id: 1, name: 'F', type: 'founder', shares: 8e6 }], optionsGranted: 0, poolUnallocated: 0, instruments: [],
    rounds: [{ id: 1, name: 'Seed', preMoney: 8e6, raise: 2e6, poolPct: 0, antiDilution: ad },
             { id: 2, name: 'A', preMoney: 5e6, raise: 5e6, poolPct: 0 }] };
}

test('full ratchet reprices the seed to the new round price', () => {
  const A = E.buildStages(downRound('full')).stages[2];
  // seed bought 2M shares at $1. Solve C = 8M + 2M/P with P = 5M/C  =>  C = 13.333M, P = $0.375
  close(A.pps, 0.375);
  close(A.rows.find(r => r.id === 'r0').shares, 2e6 / 0.375);
  close(share(A, 'h1'), 0.30);
});

test('broad-based weighted average follows CP2 = CP1 × (A + B) / (A + C)', () => {
  const A = E.buildStages(downRound('bbwa')).stages[2];
  const P = A.pps, seed = A.rows.find(r => r.id === 'r0');
  const cp2 = 1 * (10e6 + 5e6 / 1) / (10e6 + 5e6 / P);
  close(seed.cp, cp2);
  close(seed.shares, 2e6 / cp2);
  close(share(A, 'r1'), 0.5);
});

test('no anti-dilution when the seed opts out', () => {
  const A = E.buildStages(downRound('none')).stages[2];
  close(A.rows.find(r => r.id === 'r0').shares, 2e6);
  close(A.pps, 0.5);
});
