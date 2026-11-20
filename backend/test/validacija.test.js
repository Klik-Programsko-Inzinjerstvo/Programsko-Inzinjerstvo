const test = require('node:test');
const assert = require('node:assert/strict');
const { provjeriPrijavu, sigurnaPovratnaAdresa } = require('../src/validacija');

const VRSTE = [{ kod: 'tuca', naziv: 'Tuča' }, { kod: 'olujni_vjetar', naziv: 'Olujni vjetar' }];
const SADA = new Date('2026-07-14T16:00:00Z'); // 18:00 u Zagrebu
const ISPRAVNA = { vrsta: 'Tuča', vrijeme: '2026-07-14T17:42', lat: '45.31', lng: '18.41', intenzitet: 'orah' };

test('ispravna prijava tuče', () => {
  const { greske, podaci } = provjeriPrijavu(ISPRAVNA, [], VRSTE, SADA);
  assert.deepEqual(greske, []);
  assert.equal(podaci.vrsta, 'tuca');
  assert.equal(podaci.intenzitet, 'orah');
  assert.equal(podaci.lat, 45.31);
  assert.equal(podaci.vrijemeOpazanja.toISOString(), '2026-07-14T15:42:00.000Z');
  assert.equal(podaci.mjesto, null);
});

test('nedostaju vrsta, vrijeme i lokacija', () => {
  const { greske } = provjeriPrijavu({ lat: '', lng: '' }, [], VRSTE, SADA);
  assert.equal(greske.length, 3);
});

test('vrijeme u budućnosti se odbija', () => {
  const { greske } = provjeriPrijavu({ ...ISPRAVNA, vrijeme: '2026-07-14T19:00' }, [], VRSTE, SADA);
  assert.match(greske[0], /budućnosti/);
});

test('lokacija izvan Hrvatske se odbija', () => {
  const { greske } = provjeriPrijavu({ ...ISPRAVNA, lat: '48.2', lng: '16.37' }, [], VRSTE, SADA);
  assert.match(greske[0], /Hrvatskoj/);
});

test('veličina zrna se sprema samo za tuču', () => {
  const { greske, podaci } = provjeriPrijavu({ ...ISPRAVNA, vrsta: 'Olujni vjetar' }, [], VRSTE, SADA);
  assert.deepEqual(greske, []);
  assert.equal(podaci.intenzitet, null);
});

test('nepoznata veličina zrna i predug opis', () => {
  const { greske } = provjeriPrijavu({ ...ISPRAVNA, intenzitet: 'lubenica', opis: 'x'.repeat(2001) }, [], VRSTE, SADA);
  assert.equal(greske.length, 2);
});

test('prilog mora biti slika', () => {
  const { greske } = provjeriPrijavu(ISPRAVNA, [{ mimetype: 'application/pdf' }], VRSTE, SADA);
  assert.match(greske[0], /Fotografije/);
  assert.deepEqual(provjeriPrijavu(ISPRAVNA, [{ mimetype: 'image/jpeg' }], VRSTE, SADA).greske, []);
});

test('povratna adresa smije biti samo vlastita stranica', () => {
  assert.equal(sigurnaPovratnaAdresa('/prijave?vrsta=Tuča'), '/prijave?vrsta=Tuča');
  assert.equal(sigurnaPovratnaAdresa('//evil.com'), '/');
  assert.equal(sigurnaPovratnaAdresa('/\\evil.com'), '/');
  assert.equal(sigurnaPovratnaAdresa('https://evil.com'), '/');
  assert.equal(sigurnaPovratnaAdresa(undefined), '/');
});
