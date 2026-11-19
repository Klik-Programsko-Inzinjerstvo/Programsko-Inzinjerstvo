// Express aplikacija. Ovisnosti (baza, prijava, pohrana slika) dolaze izvana,
// pa testovi mogu pokrenuti aplikaciju bez prave baze i Googlea.
const path = require('path');
const express = require('express');
const cookieSession = require('cookie-session');
const { ucitajKorisnika } = require('./ovlasti');

// frontend (EJS predlošci, CSS, JS za preglednik) je u mapi server/
const FRONTEND = path.join(__dirname, '..', '..', 'server');
const TJEDAN_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * JSON za umetanje u <script>: svaki '<' postaje unicode escape (obrnuta kosa crta + 'u003c'),
 * pa sadržaj prijave ne može zatvoriti oznaku, a JavaScript ga i dalje čita kao '<'.
 */
const ESCAPE_MANJE_OD = `${String.fromCharCode(92)}u003c`;
const jsonZaSkriptu = (v) => JSON.stringify(v)
  .replace(/</g, ESCAPE_MANJE_OD);

function napraviAplikaciju({ db, auth, slike, konfig }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // Render je ispred aplikacije (HTTPS završava na njegovom proxyju)
  app.set('view engine', 'ejs');
  app.set('views', path.join(FRONTEND, 'views'));
  app.locals.json = jsonZaSkriptu;

  app.use(express.static(path.join(FRONTEND, 'public')));

  // provjera za Render; odgovara i kad baza ne radi, da deploy ne ovisi o njoj
  app.get('/zdravlje', async (req, res) => {
    const baza = await db.pool.query('SELECT 1').then(() => true, () => false);
    res.json({ status: 'ok', baza });
  });

  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieSession({
    name: 'sw_sesija',
    keys: [konfig.tajnaSesije],
    maxAge: TJEDAN_MS,
    httpOnly: true,
    sameSite: 'lax', // kolačić ne ide uz POST s tuđih stranica (zaštita od CSRF-a)
    secure: konfig.produkcija,
  }));
  app.use(ucitajKorisnika(db));

  app.use(require('./rute/javno')({ db }));
  app.use(require('./rute/autentifikacija')({ db, auth, konfig }));
  app.use(require('./rute/prijave')({ db, slike }));
  app.use(require('./rute/primjeri')({ db }));

  app.use((req, res) => res.status(404).render('greska', { title: 'Nije pronađeno', poruka: 'Stranica ne postoji.' }));

  // Express prepoznaje rukovatelja greškama po četiri parametra, pa `next` mora ostati
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).render('greska', { title: 'Greška', poruka: 'Nešto je pošlo po zlu. Pokušajte ponovno za koju minutu.' },
      (e, html) => (e ? res.send('Greška na poslužitelju.') : res.send(html)));
  });

  return app;
}

module.exports = { napraviAplikaciju, jsonZaSkriptu };
