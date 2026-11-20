// Prijava, registracija i odjava (FZ-02). Korisnik se prijavljuje Google računom;
// prva prijava ujedno je registracija (račun se stvara s Googleovom e-poštom).
const express = require('express');
const { sigurnaPovratnaAdresa } = require('../validacija');

module.exports = function autentifikacijskeRute({ db, auth, konfig }) {
  const r = express.Router();

  r.get('/prijava', async (req, res) => {
    if (req.korisnik) return res.redirect('/');
    res.render('prijava', {
      title: 'Prijava',
      povratak: sigurnaPovratnaAdresa(req.query.povratak),
      googleUkljucen: auth.ukljucen,
      demoKorisnici: konfig.demoPrijava ? await db.korisnici() : null,
    });
  });

  r.get('/registracija', (req, res) =>
    res.render('registracija', { title: 'Registracija', googleUkljucen: auth.ukljucen }));

  r.get('/auth/google', async (req, res) => {
    if (!auth.ukljucen) {
      return res.status(503).render('greska', {
        title: 'Prijava nije dostupna',
        poruka: 'Prijava putem Googlea nije postavljena na poslužitelju (GOOGLE_CLIENT_ID i GOOGLE_CLIENT_SECRET).',
      });
    }
    const { adresa, provjera } = await auth.adresaZaPrijavu();
    req.session.oidc = { ...provjera, povratak: sigurnaPovratnaAdresa(req.query.povratak) };
    res.redirect(adresa);
  });

  r.get('/auth/google/povratak', async (req, res) => {
    const provjera = req.session.oidc;
    delete req.session.oidc; // state, nonce i verifier vrijede samo za jedan pokušaj
    if (!auth.ukljucen || !provjera) return res.redirect('/prijava');
    if (req.query.error) return res.redirect('/prijava'); // korisnik je odustao na Googleu

    let podaci;
    try {
      podaci = await auth.obradiPovratak(req, provjera);
    } catch (e) {
      console.error('Google prijava nije uspjela:', e.message);
      return res.status(401).render('greska', { title: 'Prijava nije uspjela', poruka: 'Google nije potvrdio prijavu. Pokušajte ponovno.' });
    }
    if (!podaci.email || podaci.email_verified === false) {
      return res.status(403).render('greska', { title: 'Prijava nije uspjela', poruka: 'Google račun nema potvrđenu adresu e-pošte.' });
    }

    const korisnik = await db.korisnikIzGooglea({
      sub: podaci.sub, email: podaci.email, ime: podaci.name || null, slika: podaci.picture || null,
    });
    if (!korisnik.aktivan) {
      return res.status(403).render('greska', { title: 'Račun je deaktiviran', poruka: 'Za više informacija obratite se administratoru.' });
    }
    req.session.korisnikId = korisnik.id;
    res.redirect(provjera.povratak);
  });

  if (konfig.demoPrijava) {
    r.post('/prijava/demo', async (req, res) => {
      const korisnik = await db.korisnik(Number(req.body.korisnikId));
      if (!korisnik || !korisnik.aktivan) return res.redirect('/prijava');
      req.session.korisnikId = korisnik.id;
      res.redirect(sigurnaPovratnaAdresa(req.body.povratak));
    });
  }

  r.get('/odjava', (req, res) => {
    req.session = null;
    res.redirect('/');
  });

  return r;
};
