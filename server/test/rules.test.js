import test from 'node:test';
import assert from 'node:assert/strict';
import { parseClient } from '../src/utils/ua.js';
import { inWindow, istDay } from '../src/utils/time.js';
import { postLimit, generatePassword, effectivePlan, PLANS } from '../src/utils/rules.js';

const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36';

test('browser / os / device detection', () => {
  assert.deepEqual(parseClient(CHROME), { browser: 'Google Chrome', os: 'Windows', device: 'Desktop' });
  assert.equal(parseClient(CHROME + ' Edg/120.0').browser, 'Microsoft Edge');
  assert.equal(parseClient(CHROME, 'laptop').device, 'Laptop');
  const m = parseClient('Mozilla/5.0 (Linux; Android 13) Chrome/120 Mobile Safari/537.36');
  assert.equal(m.device, 'Mobile'); assert.equal(m.os, 'Android');
});

test('IST time windows', () => {
  const at = (h, m = 0) => new Date(Date.UTC(2026, 9, 17, h, m) - 5.5 * 3600e3); // IST h:m
  assert.ok(inWindow(10, 13, at(10, 0))); assert.ok(inWindow(10, 13, at(12, 59)));
  assert.ok(!inWindow(10, 13, at(13, 0))); assert.ok(!inWindow(10, 13, at(9, 59)));
  assert.ok(inWindow(10, 11, at(10, 30))); assert.ok(!inWindow(10, 11, at(11, 0)));
  assert.ok(inWindow(10, 11, at(23), true));
  assert.equal(istDay(at(0, 5)), '2026-10-17');
});

test('post limits by friend count', () => {
  assert.deepEqual([0, 1, 2, 5, 10, 11, 50].map(postLimit), [0, 1, 2, 5, 10, null, null]);
});

test('generated password is letters only with both cases', () => {
  for (let i = 0; i < 200; i++) { const p = generatePassword(); assert.match(p, /^[A-Za-z]{12}$/); assert.match(p, /[a-z]/); assert.match(p, /[A-Z]/); }
});

test('plans and expiry', () => {
  assert.deepEqual(Object.values(PLANS).map((p) => [p.price, p.limit]), [[0, 1], [100, 5], [300, 10], [1000, null]]);
  assert.equal(effectivePlan({ plan: 'gold', planExpires: new Date(Date.now() + 1e6) }), 'gold');
  assert.equal(effectivePlan({ plan: 'gold', planExpires: new Date(Date.now() - 1e6) }), 'free');
});
