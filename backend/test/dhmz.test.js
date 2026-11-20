const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { procitajXml, uveziJednom } = require('../src/dhmz');

const XML = fs.readFileSync(path.join(__dirname, 'podaci', 'hrvatska_n.xml'), 'utf8');

test('čita termin i postaje iz DHMZ XML-a', () => {
  const { vrijeme, postaje } = procitajXml(XML);
  assert.equal(vrijeme.toISOString(), '2026-07-14T15:00:00.000Z'); // 17 h po zagrebačkom vremenu
  assert.equal(postaje.length, 3, 'postaja bez koordinata se preskače');

  const [zagreb, puntijarka, nova] = postaje;
  assert.deepEqual(zagreb, {
    oznaka: 'Zagreb-Maksimir', regija: 'Zagreb i okolica', lat: 45.822, lng: 16.034,
    temperatura: 22.6, vlaga: 79, tlak: 1008.1, vjetarSmjer: 'SZ', vjetarBrzina: 63, // 17,5 m/s = 63 km/h
  });
  assert.equal(puntijarka.tlak, 887.5, 'zvjezdica iza tlaka se odbacuje');
  assert.equal(puntijarka.vjetarSmjer, null, 'C (tišina) nema smjer');
  assert.equal(nova.regija, null, 'nepoznatu postaju baza smješta po najbližoj');
  assert.equal(nova.temperatura, null);
  assert.equal(nova.vlaga, null);
  assert.equal(nova.vjetarSmjer, 'JI');
});

test('neispravan XML baca grešku', () => {
  assert.throws(() => procitajXml('<html>Održavanje</html>'), /format/);
});

test('uvoz sprema pročitane podatke, a greška DHMZ-a se prijavljuje', async () => {
  let spremljeno;
  const db = { spremiMjerenjaDhmz: async (podaci) => { spremljeno = podaci; return podaci.postaje.length; } };
  const novih = await uveziJednom({ db, adresa: 'x', fetchFn: async () => new Response(XML) });
  assert.equal(novih, 3);
  assert.equal(spremljeno.postaje[0].oznaka, 'Zagreb-Maksimir');

  await assert.rejects(
    uveziJednom({ db, adresa: 'x', fetchFn: async () => new Response('', { status: 503 }) }),
    /HTTP 503/,
  );
});
