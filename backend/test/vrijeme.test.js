const test = require('node:test');
const assert = require('node:assert/strict');
const v = require('../src/vrijeme');

test('zagrebačko vrijeme ljeti je UTC+2, zimi UTC+1', () => {
  assert.equal(v.izZagreba(2026, 7, 14, 17, 42).toISOString(), '2026-07-14T15:42:00.000Z');
  assert.equal(v.izZagreba(2026, 11, 17, 14, 30).toISOString(), '2026-11-17T13:30:00.000Z');
});

test('dan prelaska na ljetno vrijeme', () => {
  // 29. 3. 2026. u 02:00 sat skače na 03:00
  assert.equal(v.izZagreba(2026, 3, 29, 1, 30).toISOString(), '2026-03-29T00:30:00.000Z');
  assert.equal(v.izZagreba(2026, 3, 29, 3, 30).toISOString(), '2026-03-29T01:30:00.000Z');
});

test('polje datetime-local', () => {
  assert.equal(v.izPoljaDatuma('2026-07-14T17:42').toISOString(), '2026-07-14T15:42:00.000Z');
  assert.equal(v.izPoljaDatuma('2026-02-31T10:00'), null, 'nepostojeći datum');
  assert.equal(v.izPoljaDatuma('14. 7. 2026.'), null);
  assert.equal(v.izPoljaDatuma(''), null);
  assert.equal(v.izPoljaDatuma(undefined), null);
});

test('zaPoljeDatuma je obrat od izPoljaDatuma', () => {
  assert.equal(v.zaPoljeDatuma(v.izPoljaDatuma('2026-11-17T09:05')), '2026-11-17T09:05');
});

test('oblikovanje za prikaz', () => {
  const d = new Date('2026-07-14T15:42:00Z');
  assert.equal(v.datumIVrijeme(d), '14. 7. 2026. 17:42');
  assert.equal(v.sat(d), '17:42');
});

test('nazivi dana u prognozi', () => {
  const sada = new Date('2026-11-17T22:30:00Z'); // utorak 23:30 u Zagrebu
  assert.equal(v.nazivDana({ g: 2026, mj: 11, d: 17 }, sada), 'Danas');
  assert.equal(v.nazivDana({ g: 2026, mj: 11, d: 18 }, sada), 'Sutra');
  assert.equal(v.nazivDana({ g: 2026, mj: 11, d: 19 }, sada), 'Četvrtak');
});
