const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../src/engine.js');
const { close, share } = require('./helpers.js');

const simple = (extra = {}) => [
  { id: 'f', group: 'founder', shares: 8e6, pref: 0, rank: -1 },
  Object.assign({ id: 's', group: 'investor', shares: 2e6, pref: 2e6, invested: 2e6, rank: 0, part: false }, extra)
];

test('1x non-participating preferred takes the preference or converts, whichever pays more', () => {
  assert.deepEqual(E.waterfall(simple(), 5e6, 'standard').pay, { f: 3e6, s: 2e6 });
  assert.deepEqual(E.waterfall(simple(), 20e6, 'standard').pay, { f: 16e6, s: 4e6 });
  close(E.conversionPoint(simple(), 'standard', 1e9), 10e6, 1e-6);
});

test('participating preferred takes its preference and its pro-rata share', () => {
  close(E.waterfall(simple({ part: true }), 20e6, 'standard').pay.s, 2e6 + 0.2 * 18e6);
});

test('a 3x participation cap limits the total, and the holder converts above it', () => {
  const rows = simple({ part: true, capAmt: 6e6 });
  close(E.waterfall(rows, 20e6, 'standard').pay.s, 5.6e6); // under the cap
  close(E.waterfall(rows, 28e6, 'standard').pay.s, 6e6); // capped
  const w = E.waterfall(rows, 40e6, 'standard'); // converting pays 8M > 6M cap
  close(w.pay.s, 8e6); assert.ok(w.converted.has('s'));
  close(E.waterfall(rows, 40e6, 'standard').pay.f, 32e6);
});

test('standard seniority pays the newest round first; pari passu shares pro rata', () => {
  const rows = [
    { id: 'f', group: 'founder', shares: 6e6, pref: 0, rank: -1 },
    { id: 'a', group: 'investor', shares: 2e6, pref: 2e6, rank: 0 },
    { id: 'b', group: 'investor', shares: 2e6, pref: 6e6, rank: 1 }
  ];
  assert.deepEqual(E.waterfall(rows, 6e6, 'standard').pay, { f: 0, a: 0, b: 6e6 });
  const p = E.waterfall(rows, 6e6, 'pari').pay;
  close(p.a, 1.5e6); close(p.b, 4.5e6);
});
