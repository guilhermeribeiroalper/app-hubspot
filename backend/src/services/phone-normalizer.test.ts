import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone } from './phone-normalizer.js';

// ---- Spec cases (per user requirement) --------------------------------

test('+55-99999-0000 → 999990000, cc=55', () => {
  const r = normalizePhone('+55-99999-0000');
  assert.equal(r.phone_clean, '999990000');
  assert.equal(r.country_code, '55');
  assert.equal(r.had_plus, 'true');
  assert.equal(r.digit_count, 9);
  assert.equal(r.error_message, '');
});

test('+1-415-555-0123 → 4155550123, cc=1', () => {
  const r = normalizePhone('+1-415-555-0123');
  assert.equal(r.phone_clean, '4155550123');
  assert.equal(r.country_code, '1');
  assert.equal(r.had_plus, 'true');
});

test('+44-20 7946 0958 → 2079460958, cc=44 (other DDI, with spaces)', () => {
  const r = normalizePhone('+44-20 7946 0958');
  assert.equal(r.phone_clean, '2079460958');
  assert.equal(r.country_code, '44');
  assert.equal(r.had_plus, 'true');
});

// ---- No "+" cases ----------------------------------------------------

test('no "+": returns digits unchanged', () => {
  const r = normalizePhone('1199990000');
  assert.equal(r.phone_clean, '1199990000');
  assert.equal(r.country_code, '');
  assert.equal(r.had_plus, 'false');
});

test('"+" alone → empty, no error', () => {
  const r = normalizePhone('+');
  assert.equal(r.phone_clean, '');
  assert.equal(r.country_code, '');
  assert.equal(r.had_plus, 'true');
  assert.equal(r.error_message, '');
});

test('+5511999990000 (no "-" after "+") → digits without "+", no cc', () => {
  const r = normalizePhone('+5511999990000');
  assert.equal(r.phone_clean, '5511999990000');
  assert.equal(r.country_code, '');
  assert.equal(r.had_plus, 'true');
});

// ---- Edge cases ------------------------------------------------------

test('empty string → empty, error_message set', () => {
  const r = normalizePhone('');
  assert.equal(r.phone_clean, '');
  assert.equal(r.error_message, 'raw_phone is empty');
});

test('null → empty, error_message set', () => {
  const r = normalizePhone(null);
  assert.equal(r.phone_clean, '');
  assert.equal(r.error_message, 'raw_phone is null or undefined');
});

test('undefined → empty, error_message set', () => {
  const r = normalizePhone(undefined);
  assert.equal(r.phone_clean, '');
  assert.equal(r.error_message, 'raw_phone is null or undefined');
});

test('non-string number → empty, error_message set', () => {
  const r = normalizePhone(123 as unknown as string);
  assert.equal(r.phone_clean, '');
  assert.match(r.error_message, /must be a string/);
});

test('whitespace-only → empty, error_message set', () => {
  const r = normalizePhone('   ');
  assert.equal(r.phone_clean, '');
  assert.equal(r.error_message, 'raw_phone is empty');
});

test('+55-42-98417-6616 → 42984176616, cc=55 (user reported bug)', () => {
  const r = normalizePhone('+55-42-98417-6616');
  assert.equal(r.phone_clean, '42984176616');
  assert.equal(r.country_code, '55');
  assert.equal(r.had_plus, 'true');
  assert.equal(r.digit_count, 11);
  assert.equal(r.error_message, '');
});

test('+55 34 98417-6616 → 34984176616, cc=55 (space between DDI and DDD)', () => {
  const r = normalizePhone('+55 34 98417-6616');
  assert.equal(r.phone_clean, '34984176616');
  assert.equal(r.country_code, '55');
  assert.equal(r.had_plus, 'true');
  assert.equal(r.digit_count, 11);
  assert.equal(r.error_message, '');
});
