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

test('YC $125K post-money SAFE is exactly 7% of the capitalization it converts into', () => {
  const seed = E.buildStages(ycState()).stages[1];
  close(seed.rows.find(r => r.id === 's1').shares / seed.res.C, 0.07);
});

test("YC uncapped MFN takes the next SAFE's $15M cap: $375K / $15M = 2.5% (YC's own example)", () => {
  const { stages, resolved } = E.buildStages(ycState());
  assert.equal(resolved[1].cap, 15e6);
  close(stages[1].rows.find(r => r.id === 's2').shares / stages[1].res.C, 0.025);
});

test('pre-money SAFE prices off pre-money capitalization including the pool increase', () => {
  const st = { holders: [{ id: 1, name: 'F', type: 'founder', shares: 9e6 }], optionsGranted: 0, poolUnallocated: 1e6,
    instruments: [{ id: 1, name: 'pre', kind: 'pre', amount: 5e5, cap: 5e6, discount: 20 }],
    rounds: [{ id: 1, name: 'Seed', preMoney: 10e6, raise: 2e6, poolPct: 10 }] };
  const seed = E.buildStages(st).stages[1];
  const row = seed.rows.find(r => r.id === 's1');
  close(row.price, 5e6 / seed.res.base);
  assert.equal(row.method, 'cap');
});

test('discount wins when it beats the cap', () => {
  const st = { holders: [{ id: 1, name: 'F', type: 'founder', shares: 1e7 }], optionsGranted: 0, poolUnallocated: 0,
    instruments: [{ id: 1, name: 's', kind: 'post', amount: 1e5, cap: 50e6, discount: 20 }],
    rounds: [{ id: 1, name: 'Seed', preMoney: 10e6, raise: 2e6, poolPct: 0 }] };
  const seed = E.buildStages(st).stages[1];
  const row = seed.rows.find(r => r.id === 's1');
  assert.equal(row.method, 'discount');
  close(row.price, seed.pps * 0.8);
});

test('convertible note accrues simple interest before converting', () => {
  close(E.convAmount({ kind: 'note', amount: 2e5, rate: 8, months: 18 }), 224000);
});

test('bridge SAFE converts at the round it is assigned to', () => {
  const st = ycState();
  st.rounds.push({ id: 2, name: 'A', preMoney: 40e6, raise: 10e6, poolPct: 10 });
  st.instruments.push({ id: 4, name: 'bridge', kind: 'post', amount: 1e6, cap: 20e6, round: 1 });
  const { stages } = E.buildStages(st);
  assert.equal(stages[1].rows.find(r => r.id === 's4'), undefined);
  close(stages[2].rows.find(r => r.id === 's4').shares / stages[2].res.C, 0.05);
});
