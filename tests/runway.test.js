const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../src/engine.js');
const { close, share } = require('./helpers.js');

test('runway counts full months of cash, fractionally', () => {
  const r = E.simulate({ cash: 1.2e6, burn: 1e5, burnGrowth: 0, mrr: 0, growth: 0 }, { months: 24 });
  close(r.runway, 12);
  const h = E.simulate({ cash: 1.25e6, burn: 1e5, burnGrowth: 0, mrr: 0, growth: 0 }, { months: 24 });
  close(h.runway, 12.5);
});

test('default alive when revenue catches expenses before cash runs out', () => {
  const R = E.runway({ cash: 1e6, burn: 1e5, burnGrowth: 0, mrr: 5e4, growth: 10, raise: 0, raiseMonth: 6 });
  assert.equal(R.alive, true);
  const D = E.runway({ cash: 4e5, burn: 1e5, burnGrowth: 0, mrr: 1e4, growth: 5, raise: 0, raiseMonth: 6 });
  assert.equal(D.alive, false);
  assert.ok(D.reqGrowth > 0.05);
});
