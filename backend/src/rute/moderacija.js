// Moderacija prijava (FZ-11): moderator ili administrator potvrđuje ili odbija prijave
// koje čekaju. Potvrđena prijava odmah se prikazuje na javnoj karti.
const express = require('express');
const prikaz = require('../prikaz');
const { trebaPrijavu, trebaUlogu } = require('../ovlasti');

const MAX_RAZLOG = 300;
const ODLUKE = { potvrdi: true, odbij: false };

module.exports = function ruteModeracije({ db }) {
  const r = express.Router();
  r.use('/moderacija', trebaPrijavu, trebaUlogu('moderator', 'administrator'));

  r.get('/moderacija', async (req, res) => {
    const cekanje = (await db.prijaveNaCekanju()).map(prikaz.prijava);
    res.render('moderacija', { title: 'Moderacija', cekanje });
  });

  r.post('/moderacija/:id/:odluka', async (req, res) => {
    const id = Number(req.params.id);
    const potvrdi = ODLUKE[req.params.odluka];
    if (!Number.isSafeInteger(id) || id <= 0 || potvrdi === undefined) {
      return res.status(404).render('greska', { title: 'Nije pronađeno', poruka: 'Stranica ne postoji.' });
    }
    const razlog = String(req.body?.razlog ?? '').trim().slice(0, MAX_RAZLOG) || null;
    const uspjelo = await db.odluciOPrijavi(id, { potvrdi, razlog });
    req.session.poruka = !uspjelo ? 'Prijava ne postoji ili je o njoj već odlučeno.'
      : potvrdi ? 'Prijava je potvrđena i prikazuje se na karti.' : 'Prijava je odbijena.';
    res.redirect('/moderacija');
  });

  return r;
};
