// Provjera prijave i uloga na poslužitelju, za svaki zahtjev (NFZ-04).
const prikaz = require('./prikaz');

/** Učitava prijavljenog korisnika iz sesije; deaktivirani korisnik se odjavljuje. */
const ucitajKorisnika = (db) => async (req, res, next) => {
  res.locals.user = null;
  res.locals.path = req.path;
  res.locals.neprocitane = 0; // obavijesti dobivaju tablicu u idućoj migraciji
  res.locals.poruka = req.session.poruka;
  delete req.session.poruka;

  if (req.session.korisnikId) {
    const k = await db.korisnik(req.session.korisnikId);
    if (k && k.aktivan) {
      req.korisnik = k;
      res.locals.user = prikaz.korisnik(k);
    } else {
      req.session = null;
    }
  }
  next();
};

/** Stranice šalju neprijavljenog korisnika na prijavu, a ostali zahtjevi vraćaju 401. */
const trebaPrijavu = (req, res, next) => {
  if (req.korisnik) return next();
  if (req.method === 'GET') return res.redirect(`/prijava?povratak=${encodeURIComponent(req.originalUrl)}`);
  res.status(401).render('greska', { title: 'Potrebna je prijava', poruka: 'Prijavite se pa pokušajte ponovno.' });
};

const trebaUlogu = (...uloge) => (req, res, next) =>
  (uloge.includes(req.korisnik?.uloga)
    ? next()
    : res.status(403).render('greska', { title: 'Nema pristupa', poruka: 'Za ovu stranicu potrebna je druga uloga.' }));

module.exports = { ucitajKorisnika, trebaPrijavu, trebaUlogu };
