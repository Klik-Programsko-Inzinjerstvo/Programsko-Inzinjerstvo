// Integracijski test nad pravom bazom: pokreće se samo uz TEST_DATABASE_URL
// (posebna, testna baza s izvršenim migracijama – test u nju upisuje podatke).
//   TEST_DATABASE_URL=postgresql://postgres@localhost:5432/stormwatch_test npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { procitajXml } = require('../src/dhmz');

const URL = process.env.TEST_DATABASE_URL;

test('DHMZ uvoz i prijava nevremena u pravoj bazi', { skip: !URL && 'nije postavljen TEST_DATABASE_URL' }, async (t) => {
  process.env.DATABASE_URL = URL;
  const db = require('../../database/src');
  const pocisti = async () => {
    await db.pool.query("DELETE FROM prijava WHERE mjesto = 'TEST Zagreb'");
    await db.pool.query("DELETE FROM postaja WHERE dhmz_oznaka LIKE 'TEST %'");
  };
  t.after(async () => { await pocisti(); await db.pool.end(); });
  await pocisti();

  const podaci = procitajXml(fs.readFileSync(path.join(__dirname, 'podaci', 'hrvatska_n.xml'), 'utf8'));
  podaci.postaje = podaci.postaje.map((p) => ({ ...p, oznaka: `TEST ${p.oznaka}` }));

  assert.equal(await db.spremiMjerenjaDhmz(podaci), 3, 'tri nova mjerenja');
  podaci.postaje[0].temperatura = 23.0;
  assert.equal(await db.spremiMjerenjaDhmz(podaci), 0, 'isti termin ne stvara nova mjerenja');

  const { rows } = await db.pool.query(`
    SELECT p.dhmz_oznaka, r.naziv AS regija, m.temperatura
    FROM postaja p LEFT JOIN regija r ON r.id = p.regija_id JOIN mjerenje m ON m.postaja_id = p.id
    WHERE p.dhmz_oznaka LIKE 'TEST %' ORDER BY p.dhmz_oznaka`);
  const zagreb = rows.find((r) => r.dhmz_oznaka === 'TEST Zagreb-Maksimir');
  assert.equal(zagreb.temperatura, 23, 'DHMZ prepisuje vrijednost za isti termin');
  assert.ok(rows.find((r) => r.dhmz_oznaka === 'TEST Nova postaja').regija, 'nepoznata postaja dobiva regiju najbliže');

  const vrste = await db.vrstePojava();
  assert.ok(vrste.some((v) => v.kod === 'tuca'));

  const [autor] = await db.korisnici();
  const prijava = await db.spremiPrijavu({
    korisnikId: autor.id, vrsta: 'tuca', lat: 45.85, lng: 16.0, mjesto: 'TEST Zagreb',
    vrijemeOpazanja: new Date(podaci.vrijeme.getTime() + 20 * 60_000), intenzitet: 'grasak',
  });
  assert.equal(prijava.vrsta, 'Tuča');

  const mjerenje = await db.mjerenjeUTrenutku(prijava.lat, prijava.lng, prijava.vrijeme_opazanja);
  assert.ok(mjerenje.postaja, 'uz prijavu postoji najbliža postaja');
});
