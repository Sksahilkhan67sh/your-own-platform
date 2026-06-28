import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateOpaqueToken, hashToken, generateTokenFamily } from '../../src/utils/tokenCrypto.js';

test('generateOpaqueToken returns a 64-char hex string', () => {
  const token = generateOpaqueToken();
  assert.equal(token.length, 64);
  assert.match(token, /^[0-9a-f]{64}$/);
});

test('generateOpaqueToken returns unique values across calls', () => {
  const a = generateOpaqueToken();
  const b = generateOpaqueToken();
  assert.notEqual(a, b);
});

test('hashToken is deterministic for the same input', () => {
  const token = generateOpaqueToken();
  assert.equal(hashToken(token), hashToken(token));
});

test('hashToken produces different hashes for different inputs', () => {
  const a = generateOpaqueToken();
  const b = generateOpaqueToken();
  assert.notEqual(hashToken(a), hashToken(b));
});

test('hashToken output never equals the raw input (defense against accidental raw storage)', () => {
  const token = generateOpaqueToken();
  assert.notEqual(hashToken(token), token);
});

test('generateTokenFamily returns a 32-char hex string and is unique per call', () => {
  const a = generateTokenFamily();
  const b = generateTokenFamily();
  assert.equal(a.length, 32);
  assert.match(a, /^[0-9a-f]{32}$/);
  assert.notEqual(a, b);
});
