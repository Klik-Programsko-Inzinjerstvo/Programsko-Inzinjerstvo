// Stranice čije tablice u bazi još ne postoje (događaji, lokacije, obavijesti,
// statistika, moderacija). Do idućeg ciklusa prikazuju primjer podatke iz
// frontendova mock.js uz vidljivu napomenu; prava i uloge se već provjeravaju.
// Administracija već prikazuje stvarne korisnike iz baze.
const express = require('express');
const mock = require('../../../server/data/mock');
const { trebaPrijavu, trebaUlogu } = require('../ovlasti');

const primjer = { primjer: true };

module.exports = function rutePrimjera({ db }) {
  const r = express.Router();
  r.use(['/dogadaji', '/lokacije', '/obavijesti', '/statistika', '/moderacija', '/admin'], trebaPrijavu);

  r.get('/dogadaji/:id', (req, res) => {
    const d = mock.dogadaji.find((x) => x.id === Number(req.params.id));
    if (!d) return res.status(404).render('greska', { title: 'Nije pronađeno', poruka: 'Događaj ne postoji.' });
    res.render('dogadaj', { title: d.naziv, d, prijave: mock.prijave.filter((p) => d.prijava.includes(p.id)), ...primjer });
  });
  r.get('/lokacije', (req, res) => res.render('lokacije', { title: 'Lokacije', ...mock, ...primjer }));
  r.get('/obavijesti', (req, res) => res.render('obavijesti', { title: 'Obavijesti', ...mock, ...primjer }));
  r.get('/statistika', (req, res) => res.render('statistika', { title: 'Statistika', ...mock, ...primjer }));
  r.get('/statistika.csv', trebaPrijavu, (req, res) => {
    const redovi = mock.statistika.poRegijama.map(([regija, n]) => `${regija};${n}`).join('\n');
    res.type('text/csv').send(`regija;broj_prijava\n${redovi}`);
  });
  r.get('/moderacija', trebaUlogu('moderator', 'administrator'), (req, res) =>
    res.render('moderacija', {
      title: 'Moderacija', cekanje: mock.prijave.filter((p) => ['predana', 'na čekanju'].includes(p.status)), ...primjer,
    }));
  r.get('/admin', trebaUlogu('administrator'), async (req, res) => {
    const korisnici = (await db.korisnici()).map((k) => ({
      ime: k.korisnicko_ime, email: k.email, uloga: k.uloga.replace(/_/g, ' '), bodovi: k.reputacija,
    }));
    res.render('admin', {
      title: 'Administracija', korisnici,
      primjer: 'Popis korisnika je iz baze. Promjena uloge, deaktivacija i postavke uvoza još se ne spremaju.',
    });
  });

  return r;
};
