// Ispitivanje ruta bez prave baze i bez Googlea: baza i prijava su zamijenjene
// jednostavnim lažnim objektima (stub), a zahtjevi idu kroz cijelu Express aplikaciju.
const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { napraviAplikaciju } = require('../src/app');
const { ucitajKonfig } = require('../src/konfig');

const KORISNICI = {
  1: { id: 1, korisnicko_ime: 'ivana_k', email: 'ivana@example.com', uloga: 'pouzdani_motritelj', aktivan: true, reputacija: 240, kreiran: new Date('2026-10-01T10:00:00Z') },
  2: { id: 2, korisnicko_ime: 'marko_p', email: 'marko@example.com', uloga: 'korisnik', aktivan: true, reputacija: 55, kreiran: new Date('2026-10-02T10:00:00Z') },
  3: { id: 3, korisnicko_ime: 'blokiran', email: 'b@example.com', uloga: 'korisnik', aktivan: false, reputacija: 0, kreiran: new Date('2026-10-03T10:00:00Z') },
  4: { id: 4, korisnicko_ime: 'admin', email: 'admin@example.com', uloga: 'administrator', aktivan: true, reputacija: 0, kreiran: new Date('2026-10-04T10:00:00Z') },
  5: { id: 5, korisnicko_ime: 'mod_slavonija', email: 'mod@example.com', uloga: 'moderator', aktivan: true, reputacija: 0, kreiran: new Date('2026-10-05T10:00:00Z') },
};

const PRIJAVA = {
  id: 7, vrsta_kod: 'tuca', vrsta: 'Tuča', mjesto: '</script><script>alert(1)</script>', lat: 45.31, lng: 18.41,
  vrijeme_opazanja: new Date('2026-07-14T15:42:00Z'), intenzitet: 'orah', steta: 'auti', opis: 'Tuča!',
  stanje: 'potvrdena', razlog_odbijanja: null, vjerodostojnost: 92, regija: 'Slavonija', autor: 'ivana_k', pouzdan: true, slike: [],
};

function lazniDb() {
  const db = {
    spremljeno: null,
    pool: { query: async () => ({ rows: [] }) },
    korisnik: async (id) => KORISNICI[id] || null,
    korisnici: async () => Object.values(KORISNICI),
    korisnikIzGooglea: async ({ email }) => Object.values(KORISNICI).find((k) => k.email === email),
    zadnjaMjerenja: async () => [{ postaja_id: 1, postaja: 'Zagreb-Maksimir', regija: 'Zagreb i okolica', lat: 45.8, lng: 16, vrijeme: new Date('2026-11-17T16:00:00Z'), temperatura: 15.5, vlaga: 60, tlak: 1000, vjetar_smjer: 'Z', vjetar_brzina: 10.8 }],
    aktivnaUpozorenja: async () => [],
    regije: async () => [{ id: 1, naziv: 'Zagreb i okolica' }, { id: 3, naziv: 'Slavonija' }],
    prognoze: async () => [],
    vrstePojava: async () => [{ kod: 'tuca', naziv: 'Tuča' }, { kod: 'olujni_vjetar', naziv: 'Olujni vjetar' }],
    prijave: async () => [PRIJAVA],
    prijava: async (id) => (id === 7 ? PRIJAVA : null),
    prijaveKorisnika: async () => [],
    najblizaPostaja: async () => ({ ime: 'Osijek' }),
    mjerenjeUTrenutku: async () => ({ postaja: 'Osijek', udaljenost_km: 36.6, vrijeme: new Date('2026-07-14T15:30:00Z'), temperatura: 21.4, vlaga: 88, tlak: 1006.5, vjetar_smjer: 'Z', vjetar_brzina: 54 }),
    spremiPrijavu: async (podaci) => { db.spremljeno = podaci; return { id: 99, stanje: 'predana' }; },
    odluka: null,
    prijaveNaCekanju: async () => [{ ...PRIJAVA, id: 8, mjesto: 'Vuka', stanje: 'predana' }],
    odluciOPrijavi: async (id, odluka) => { db.odluka = { id, ...odluka }; return id === 8; },
  };
  return db;
}

// Google se glumi: adresa za prijavu je lažna, a povratak vraća zadani e-mail
const lazniAuth = (email = 'marko@example.com') => ({
  ukljucen: true,
  adresaZaPrijavu: async () => ({ adresa: 'https://accounts.google.com/o/oauth2/v2/auth?test', provjera: { state: 's', nonce: 'n', codeVerifier: 'v' } }),
  obradiPovratak: async (req, provjera) => {
    assert.equal(provjera.state, 's', 'state iz sesije stiže do provjere');
    return { sub: 'google-123', email, email_verified: true, name: 'Test' };
  },
});

function aplikacija({ db = lazniDb(), auth = lazniAuth(), env = {} } = {}) {
  const konfig = ucitajKonfig({ DEMO_PRIJAVA: 'true', ...env });
  return { app: napraviAplikaciju({ db, auth, slike: { ukljuceno: false }, konfig }), db };
}

/** Prijavljuje korisnika kroz cijeli Google tok i vraća agenta s kolačićem sesije. */
async function prijavljen(app) {
  const agent = request.agent(app);
  const start = await agent.get('/auth/google?povratak=/prijave');
  assert.equal(start.status, 302);
  assert.match(start.headers.location, /^https:\/\/accounts\.google\.com/);
  const povratak = await agent.get('/auth/google/povratak?code=abc&state=s');
  assert.equal(povratak.status, 302);
  assert.equal(povratak.headers.location, '/prijave');
  return agent;
}

test('javne stranice rade bez prijave', async () => {
  const { app } = aplikacija();
  const r = await request(app).get('/');
  assert.equal(r.status, 200);
  assert.match(r.text, /Zagreb-Maksimir/);
  assert.match(r.text, /15\.5 °C/);
  assert.equal((await request(app).get('/prognoza')).status, 200);
  assert.equal((await request(app).get('/privatnost')).status, 200);
  assert.deepEqual((await request(app).get('/zdravlje')).body, { status: 'ok', baza: true });
});

test('sadržaj prijave ne može izaći iz <script> oznake na karti (XSS)', async () => {
  const { app } = aplikacija();
  const r = await request(app).get('/');
  assert.ok(!r.text.includes('"mjesto":"</script>'), 'znak < mora biti escapean');
  assert.match(r.text, /"mjesto":"\\u003c\/script>/);
});

test('zaštićene stranice traže prijavu (302 za stranice, 401 za slanje)', async () => {
  const { app } = aplikacija();
  const r = await request(app).get('/prijave');
  assert.equal(r.status, 302);
  assert.equal(r.headers.location, '/prijava?povratak=%2Fprijave');
  assert.equal((await request(app).post('/prijave/nova')).status, 401);
});

test('prijava putem Googlea otvara sesiju', async () => {
  const { app } = aplikacija();
  const agent = await prijavljen(app);
  const r = await agent.get('/profil');
  assert.equal(r.status, 200);
  assert.match(r.text, /marko_p/);
  assert.match(r.text, /Uloga: korisnik/);
});

test('povratak s Googlea bez započete prijave ne prijavljuje korisnika', async () => {
  const { app } = aplikacija();
  const r = await request(app).get('/auth/google/povratak?code=abc&state=s');
  assert.equal(r.status, 302);
  assert.equal(r.headers.location, '/prijava');
});

test('deaktivirani korisnik se ne može prijaviti', async () => {
  const { app } = aplikacija({ auth: lazniAuth('b@example.com') });
  const agent = request.agent(app);
  await agent.get('/auth/google');
  assert.equal((await agent.get('/auth/google/povratak?code=abc&state=s')).status, 403);
});

test('bez Google postavki prijava javlja da nije dostupna', async () => {
  const { app } = aplikacija({ auth: { ukljucen: false } });
  assert.equal((await request(app).get('/auth/google')).status, 503);
});

test('uloge se provjeravaju na poslužitelju (403)', async () => {
  const { app } = aplikacija();
  const agent = await prijavljen(app);
  assert.equal((await agent.get('/moderacija')).status, 403);
  assert.equal((await agent.get('/admin')).status, 403);
});

test('administracija prikazuje korisnike iz baze', async () => {
  const { app } = aplikacija({ auth: lazniAuth('admin@example.com') });
  const agent = await prijavljen(app);
  const r = await agent.get('/admin');
  assert.equal(r.status, 200);
  assert.match(r.text, /marko@example\.com/);
  assert.match(r.text, /<option selected>pouzdani motritelj<\/option>/);
  assert.match(r.text, /Popis korisnika je iz baze/);
});

test('moderator potvrđuje i odbija prijave na čekanju', async () => {
  const { app, db } = aplikacija({ auth: lazniAuth('mod@example.com') });
  const agent = await prijavljen(app);
  const r = await agent.get('/moderacija');
  assert.equal(r.status, 200);
  assert.match(r.text, /Vuka/);
  assert.match(r.text, /action="\/moderacija\/8\/potvrdi"/);

  const potvrda = await agent.post('/moderacija/8/potvrdi');
  assert.equal(potvrda.status, 302);
  assert.equal(potvrda.headers.location, '/moderacija');
  assert.deepEqual(db.odluka, { id: 8, potvrdi: true, razlog: null });
  assert.match((await agent.get('/moderacija')).text, /Prijava je potvrđena/);

  await agent.post('/moderacija/8/odbij').type('form').send({ razlog: '  Duplikat  ' });
  assert.deepEqual(db.odluka, { id: 8, potvrdi: false, razlog: 'Duplikat' });

  await agent.post('/moderacija/9/potvrdi');
  assert.match((await agent.get('/moderacija')).text, /već odlučeno/);
  assert.equal((await agent.post('/moderacija/abc/potvrdi')).status, 404);
  assert.equal((await agent.post('/moderacija/8/obrisi')).status, 404);
});

test('obični korisnik ne može potvrditi prijavu', async () => {
  const { app, db } = aplikacija();
  assert.equal((await request(app).post('/moderacija/8/potvrdi')).status, 401);
  const agent = await prijavljen(app);
  assert.equal((await agent.post('/moderacija/8/potvrdi')).status, 403);
  assert.equal(db.odluka, null, 'ništa se ne mijenja');
});

test('nova prijava: neispravan obrazac vraća 400 s porukama', async () => {
  const { app, db } = aplikacija();
  const agent = await prijavljen(app);
  const r = await agent.post('/prijave/nova').field('vrsta', 'Tuča').field('vrijeme', '').field('lat', '').field('lng', '');
  assert.equal(r.status, 400);
  assert.match(r.text, /Upišite datum i vrijeme opažanja/);
  assert.match(r.text, /Odaberite lokaciju/);
  assert.equal(db.spremljeno, null, 'ništa se ne sprema');
});

test('nova prijava: ispravan obrazac sprema prijavu i vodi na njezinu stranicu', async () => {
  const { app, db } = aplikacija();
  const agent = await prijavljen(app);
  const r = await agent.post('/prijave/nova')
    .field('vrsta', 'Tuča').field('vrijeme', '2026-07-14T17:42').field('intenzitet', 'orah')
    .field('lat', '45.31').field('lng', '18.41').field('opis', 'Tuča veličine oraha');
  assert.equal(r.status, 302);
  assert.equal(r.headers.location, '/prijave/99');
  assert.equal(db.spremljeno.korisnikId, 2, 'autor je prijavljeni korisnik, ne podatak iz obrasca');
  assert.equal(db.spremljeno.vrsta, 'tuca');
  assert.equal(db.spremljeno.mjesto, 'kod postaje Osijek');
  assert.equal(db.spremljeno.vrijemeOpazanja.toISOString(), '2026-07-14T15:42:00.000Z');
});

test('temperatura koja nedostaje ne ruši početnu stranicu', async () => {
  const db = lazniDb();
  const [postaja] = await db.zadnjaMjerenja();
  db.zadnjaMjerenja = async () => [{ ...postaja, temperatura: null }];
  const r = await request(aplikacija({ db }).app).get('/');
  assert.equal(r.status, 200);
  assert.match(r.text, /– °C/);
});

test('stranica prijave prikazuje službeno mjerenje najbliže postaje', async () => {
  const { app } = aplikacija();
  const agent = await prijavljen(app);
  const r = await agent.get('/prijave/7');
  assert.equal(r.status, 200);
  assert.match(r.text, /postaja Osijek, 36\.6 km od prijave/);
  assert.ok(!r.text.includes('<script>alert(1)'), 'naslov je escapean');
  assert.equal((await agent.get('/prijave/8')).status, 404);
  assert.equal((await agent.get('/prijave/abc')).status, 404);
});

test('demo prijava postoji samo izvan produkcije', async () => {
  const lokalno = aplikacija().app;
  assert.equal((await request(lokalno).post('/prijava/demo').type('form').send({ korisnikId: '1' })).status, 302);
  const produkcija = aplikacija({ env: { NODE_ENV: 'production', SESSION_SECRET: 'x' } }).app;
  assert.equal((await request(produkcija).post('/prijava/demo').type('form').send({ korisnikId: '1' })).status, 404);
});

test('produkcija ne kreće bez SESSION_SECRET', () => {
  assert.throws(() => ucitajKonfig({ NODE_ENV: 'production' }), /SESSION_SECRET/);
});
