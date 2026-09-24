import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSetCookie } from '../src/index.js';

test('parses simple name=value pair', () => {
  assert.deepEqual(parseSetCookie('session=abc123'), {
    name: 'session',
    value: 'abc123',
    domain: undefined,
    path: undefined,
    expires: undefined,
    maxAge: undefined,
    httpOnly: false,
    secure: false,
    sameSite: undefined,
  });
});

test('parses name only with empty value', () => {
  assert.deepEqual(parseSetCookie('flag'), {
    name: 'flag',
    value: '',
    domain: undefined,
    path: undefined,
    expires: undefined,
    maxAge: undefined,
    httpOnly: false,
    secure: false,
    sameSite: undefined,
  });
});

test('parses quoted value containing semicolon', () => {
  const result = parseSetCookie('note="hello;world"; path=/');
  assert.equal(result.name, 'note');
  assert.equal(result.value, 'hello;world');
  assert.equal(result.path, '/');
});

test('parses path and domain', () => {
  const result = parseSetCookie('id=42; Path=/app; Domain=example.org');
  assert.equal(result.name, 'id');
  assert.equal(result.value, '42');
  assert.equal(result.path, '/app');
  assert.equal(result.domain, 'example.org');
});

test('parses HttpOnly and Secure flags case-insensitively', () => {
  const result = parseSetCookie('token=xyz; Httponly; SECURE');
  assert.equal(result.httpOnly, true);
  assert.equal(result.secure, true);
});

test('parses Max-Age as integer', () => {
  const result = parseSetCookie('session=abc; Max-Age=3600');
  assert.equal(result.maxAge, 3600);
});

test('parses negative Max-Age', () => {
  const result = parseSetCookie('session=abc; Max-Age=-1');
  assert.equal(result.maxAge, -1);
});

test('ignores non-numeric Max-Age', () => {
  const result = parseSetCookie('session=abc; Max-Age=soon');
  assert.equal(result.maxAge, undefined);
});

test('parses Expires attribute as raw string', () => {
  const result = parseSetCookie(
    'session=abc; Expires=Wed, 21 Oct 2015 07:28:00 GMT'
  );
  assert.equal(result.expires, 'Wed, 21 Oct 2015 07:28:00 GMT');
});

test('parses SameSite attribute', () => {
  const result = parseSetCookie('session=abc; SameSite=Lax');
  assert.equal(result.sameSite, 'Lax');
});

test('ignores unknown attributes', () => {
  const result = parseSetCookie('session=abc; Partitioned; Priority=High');
  assert.equal(result.name, 'session');
  assert.equal(result.value, 'abc');
  assert.equal(result.httpOnly, false);
  assert.equal(result.secure, false);
  assert.equal(result.sameSite, undefined);
});

test('trims surrounding whitespace', () => {
  const result = parseSetCookie('  session=abc; Path=/  ');
  assert.equal(result.name, 'session');
  assert.equal(result.value, 'abc');
  assert.equal(result.path, '/');
});

test('handles empty value with equals sign', () => {
  const result = parseSetCookie('name=');
  assert.equal(result.name, 'name');
  assert.equal(result.value, '');
});

test('throws TypeError for non-string input', () => {
  assert.throws(() => parseSetCookie(123), TypeError);
});

test('throws SyntaxError for empty string', () => {
  assert.throws(() => parseSetCookie(''), SyntaxError);
});

test('throws SyntaxError for whitespace-only string', () => {
  assert.throws(() => parseSetCookie('   '), SyntaxError);
});
