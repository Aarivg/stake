// Shared helpers for the engine tests. Run everything with: npm test
const assert = require('node:assert/strict');

const close = (a, b, tol = 1e-6, msg) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg || ''} expected ${b}, got ${a}`);
const share = (stage, id) => stage.rows.find(r => r.id === id).shares / stage.total;

module.exports = { close, share };
