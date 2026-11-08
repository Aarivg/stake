const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../src/engine.js');
const { close, share } = require('./helpers.js');

function ycState() {
  return {
    holders: [{ id: 1, name: 'A', type: 'founder', shares: 4.5e6 }, { id: 2, name: 'B', type: 'founder', shares: 4.5e6 }],
    optionsGranted: 3e5, poolUnallocated: 7e5,
    instruments: [
      { id: 1, name: 'YC 7%', kind: 'post', amount: 125000, cap: 125000 / 0.07 },
      { id: 2, name: 'YC MFN', kind: 'mfn', amount: 375000 },
      { id: 3, name: 'Next SAFE', kind: 'post', amount: 1e6, cap: 15e6 }
    ],
    rounds: [{ id: 1, name: 'Seed', preMoney: 16e6, raise: 4e6, poolPct: 10, multiple: 1 }],
    seniority: 'standard'
  };
}

function downRound(ad) {
  return { holders: [{ id: 1, name: 'F', type: 'founder', shares: 8e6 }], optionsGranted: 0, poolUnallocated: 0, instruments: [],
    rounds: [{ id: 1, name: 'Seed', preMoney: 8e6, raise: 2e6, poolPct: 0, antiDilution: ad },
             { id: 2, name: 'A', preMoney: 5e6, raise: 5e6, poolPct: 0 }] };
}

test('new investors get exactly raise / post-money and the pool lands exactly on target', () => {
  const seed = E.buildStages(ycState()).stages[1];
  close(share(seed, 'r0'), 4e6 / 20e6);
  close(share(seed, 'pool'), 0.10);
  close(seed.pps * seed.res.C, 16e6, 1e-9, 'price × pre-money shares = pre-money');
});

test('an unpriceable round is reported, not silently computed', () => {
  const st = downRound('full');
  st.rounds[1].preMoney = 1e6; st.rounds[1].poolPct = 20; // ratchet ($2M) + pool exceed a $1M pre-money
  const m = E.buildStages(st);
  assert.equal(m.errors.length, 1);
  assert.equal(m.stages.length, 2); // Today and Seed only
});
