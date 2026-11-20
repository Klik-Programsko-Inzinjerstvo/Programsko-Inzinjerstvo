// Prijave nevremena: popis, nova prijava (FZ-06, UC-03), pojedinačna prijava i profil.
// Obrazac nema polje za mjesto, pa se naziv mjesta uzima od najbliže postaje.
const express = require('express');
const multer = require('multer');
const prikaz = require('../prikaz');
const { provjeriPrijavu } = require('../validacija');
const { zaPoljeDatuma } = require('../vrijeme');
const { trebaPrijavu } = require('../ovlasti');

const MAX_SLIKA = 5;
const MAX_VELICINA_MB = 5;

const primi = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VELICINA_MB * 1024 * 1024, files: MAX_SLIKA },
}).array('foto', MAX_SLIKA);

/** Prevodi greške multera u poruku obrasca umjesto stranice s greškom. */
const primiSlike = (req, res, next) => primi(req, res, (e) => {
  if (!(e instanceof multer.MulterError)) return next(e);
  req.greskaSlika = e.code === 'LIMIT_FILE_SIZE'
    ? `Svaka fotografija smije imati najviše ${MAX_VELICINA_MB} MB.`
    : `Možete priložiti najviše ${MAX_SLIKA} fotografija.`;
  next();
});

const zabranaObjave = (k) => k.zabrana_objave_do && new Date(k.zabrana_objave_do) > new Date();

module.exports = function rutePrijava({ db, slike }) {
  const r = express.Router();
  r.use(['/prijave', '/profil'], trebaPrijavu);

  const obrazac = (res, status, { greske = [], vrijednosti = {} } = {}) => res.status(status).render('prijava_nova', {
    title: 'Nova prijava', greske, vrijednosti: { vrijeme: zaPoljeDatuma(new Date()), ...vrijednosti },
  });

  r.get('/prijave', async (req, res) => {
    const redovi = await db.prijave({ limit: 200 });
    res.render('prijave', { title: 'Prijave', prijave: redovi.map(prikaz.prijava), vrste: req.query.vrsta || '' });
  });

  r.get('/prijave/nova', (req, res) => {
    if (zabranaObjave(req.korisnik)) return obrazac(res, 403, { greske: ['Privremeno vam je onemogućeno objavljivanje.'] });
    obrazac(res, 200);
  });

  r.post('/prijave/nova', primiSlike, async (req, res) => {
    if (zabranaObjave(req.korisnik)) return obrazac(res, 403, { greske: ['Privremeno vam je onemogućeno objavljivanje.'] });

    const datoteke = req.files || [];
    const { greske, podaci } = provjeriPrijavu(req.body, datoteke, await db.vrstePojava());
    if (req.greskaSlika) greske.push(req.greskaSlika);
    if (greske.length) return obrazac(res, 400, { greske, vrijednosti: req.body });

    let urlovi = [];
    let napomena = null;
    if (datoteke.length && !slike.ukljuceno) {
      napomena = 'Fotografije nisu spremljene jer pohrana slika još nije postavljena na poslužitelju.';
    } else if (datoteke.length) {
      try {
        urlovi = await slike.spremi(datoteke);
      } catch (e) {
        console.error('Spremanje fotografija nije uspjelo:', e.message);
        napomena = 'Fotografije se nisu uspjele spremiti, a prijava je spremljena bez njih.';
      }
    }

    if (!podaci.mjesto) {
      const postaja = await db.najblizaPostaja(podaci.lat, podaci.lng);
      podaci.mjesto = postaja ? `kod postaje ${postaja.ime}` : null;
    }

    const nova = await db.spremiPrijavu({ korisnikId: req.korisnik.id, ...podaci, slike: urlovi });
    req.session.poruka = [
      nova.stanje === 'potvrdena' ? 'Prijava je objavljena.' : 'Prijava je spremljena i čeka moderaciju.',
      napomena,
    ].filter(Boolean).join(' ');
    res.redirect(`/prijave/${nova.id}`);
  });

  r.get('/prijave/:id', async (req, res) => {
    const id = Number(req.params.id);
    const p = Number.isSafeInteger(id) && id > 0 ? await db.prijava(id) : null;
    // odbijenu prijavu vide samo autor i moderatori (UC-06)
    const smijeVidjeti = p && (p.stanje !== 'odbijena' || p.autor === req.korisnik.korisnicko_ime
      || ['moderator', 'administrator'].includes(req.korisnik.uloga));
    if (!smijeVidjeti) return res.status(404).render('greska', { title: 'Nije pronađeno', poruka: 'Prijava ne postoji.' });

    // FZ-06: uz prijavu se prikazuje službeno mjerenje s najbliže postaje u trenutku opažanja
    const mjerenje = await db.mjerenjeUTrenutku(p.lat, p.lng, p.vrijeme_opazanja);
    const prijava = prikaz.prijava(p);
    res.render('prijava_detalj', { title: `${prijava.vrsta}, ${prijava.mjesto}`, p: prijava, mjerenje: prikaz.mjerenje(mjerenje) });
  });

  r.get('/profil', (req, res) => res.render('profil', { title: 'Profil' }));

  return r;
};
