// Provjera obrasca "Nova prijava nevremena" (FZ-06, UC-03). Poslužitelj ne vjeruje
// pregledniku: sve što dolazi iz obrasca ovdje se provjerava i čisti.
const { izPoljaDatuma } = require('./vrijeme');

// veličina zrna kako je nudi obrazac -> kod u bazi
const ZRNA = { 'grašak': 'grasak', 'lješnjak': 'ljesnjak', orah: 'orah', jaje: 'jaje' };

// Hrvatska s malom marginom; prijave izvan toga nemaju najbližu postaju ni regiju
const GRANICE = { latMin: 42.2, latMax: 46.7, lngMin: 13.3, lngMax: 19.6 };

const SLIKA = /^image\/(jpeg|png|webp|gif|heic|heif)$/;
const TOLERANCIJA_SATA_MS = 5 * 60 * 1000;

const koordinata = (v) => (v == null || String(v).trim() === '' ? NaN : Number(v));

/**
 * @param tijelo    req.body obrasca
 * @param datoteke  req.files (multer), može biti prazno
 * @param vrste     [{ kod, naziv }] iz db.vrstePojava()
 * @returns { greske: string[], podaci } – podaci su spremni za db.spremiPrijavu()
 */
function provjeriPrijavu(tijelo = {}, datoteke = [], vrste = [], sada = new Date()) {
  const greske = [];
  const tekst = (polje, max, naziv) => {
    const t = String(tijelo[polje] ?? '').trim();
    if (t.length > max) greske.push(`${naziv} smije imati najviše ${max} znakova.`);
    return t || null;
  };

  const vrsta = vrste.find((v) => v.naziv === tijelo.vrsta || v.kod === tijelo.vrsta);
  if (!vrsta) greske.push('Odaberite vrstu pojave.');

  const vrijemeOpazanja = izPoljaDatuma(tijelo.vrijeme);
  if (!vrijemeOpazanja) greske.push('Upišite datum i vrijeme opažanja.');
  else if (vrijemeOpazanja.getTime() > sada.getTime() + TOLERANCIJA_SATA_MS) {
    greske.push('Vrijeme opažanja ne može biti u budućnosti.');
  }

  const lat = koordinata(tijelo.lat);
  const lng = koordinata(tijelo.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    greske.push('Odaberite lokaciju na karti ili upotrijebite GPS.');
  } else if (lat < GRANICE.latMin || lat > GRANICE.latMax || lng < GRANICE.lngMin || lng > GRANICE.lngMax) {
    greske.push('Lokacija mora biti u Hrvatskoj.');
  }

  let intenzitet = null;
  if (tijelo.intenzitet) {
    intenzitet = ZRNA[tijelo.intenzitet] || null;
    if (!intenzitet) greske.push('Odaberite veličinu zrna s popisa.');
  }
  if (vrsta && vrsta.kod !== 'tuca') intenzitet = null; // veličina zrna vrijedi samo za tuču

  const mjesto = tekst('mjesto', 100, 'Mjesto');
  const steta = tekst('steta', 300, 'Procjena štete');
  const opis = tekst('opis', 2000, 'Opis');

  if ((datoteke || []).some((d) => !SLIKA.test(d.mimetype))) {
    greske.push('Fotografije moraju biti slike (JPG, PNG, WebP, GIF ili HEIC).');
  }

  return {
    greske,
    podaci: { vrsta: vrsta?.kod, vrijemeOpazanja, lat, lng, mjesto, intenzitet, steta, opis },
  };
}

/** Dopušta samo povratak na vlastite stranice (sprječava otvoreno preusmjeravanje). */
function sigurnaPovratnaAdresa(adresa) {
  const a = String(adresa || '');
  return a.startsWith('/') && !a.startsWith('//') && !a.startsWith('/\\') ? a : '/';
}

module.exports = { provjeriPrijavu, sigurnaPovratnaAdresa, GRANICE };
