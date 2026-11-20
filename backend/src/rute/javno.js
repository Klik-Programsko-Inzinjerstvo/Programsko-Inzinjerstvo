// Stranice dostupne i neprijavljenim korisnicima: pregled s kartom i prognoza (FZ-01, FZ-04).
const express = require('express');
const prikaz = require('../prikaz');

// predložak prognoze još nema odabir regije, pa se prikazuje jedna
const ZADANA_REGIJA = 'Zagreb i okolica';

module.exports = function javneRute({ db }) {
  const r = express.Router();

  r.get('/', async (req, res) => {
    const [mjerenja, upozorenja, potvrdene] = await Promise.all([
      db.zadnjaMjerenja(), db.aktivnaUpozorenja(), db.prijave({ samoPotvrdene: true, limit: 500 }),
    ]);
    res.render('index', {
      title: 'Pregled',
      postaje: mjerenja.map(prikaz.postaja),
      upozorenja: upozorenja.map((u) => prikaz.upozorenje(u)),
      potvrdene: potvrdene.map(prikaz.prijavaZaKartu),
    });
  });

  r.get('/prognoza', async (req, res) => {
    const regija = (await db.regije()).find((x) => x.naziv === (req.query.regija || ZADANA_REGIJA));
    const [prognoze, upozorenja] = await Promise.all([
      regija ? db.prognoze(regija.id) : [], db.aktivnaUpozorenja(),
    ]);
    res.render('prognoza', {
      title: 'Prognoza',
      prognoza: prognoze.map((p) => prikaz.prognoza(p)),
      upozorenja: upozorenja.map((u) => prikaz.upozorenje(u)),
    });
  });

  // traži je Google za objavu prijave putem Googlea (OAuth consent screen)
  r.get('/privatnost', (req, res) => res.render('privatnost', { title: 'Pravila privatnosti' }));

  return r;
};
