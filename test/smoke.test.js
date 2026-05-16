const test = require('node:test');
const assert = require('node:assert/strict');

test('smoke: test runner is configured', () => {
  assert.equal(1 + 1, 2);
});
