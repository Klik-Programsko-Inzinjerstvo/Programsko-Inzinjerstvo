// Pomoćne funkcije za vrijeme. Korisnici unose i čitaju vrijeme po zagrebačkoj
// zoni, a poslužitelj (Render) radi u UTC-u, pa se zona uvijek navodi izričito.
const ZONA = 'Europe/Zagreb';
const DANI = ['nedjelja', 'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota'];

const formater = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZONA, hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
});

/** Dijelovi datuma po zagrebačkom vremenu: { g, mj, d, h, min, s } kao brojevi. */
function uZagrebu(datum) {
  const p = Object.fromEntries(formater.formatToParts(new Date(datum)).map(({ type, value }) => [type, Number(value)]));
  return { g: p.year, mj: p.month, d: p.day, h: p.hour, min: p.minute, s: p.second };
}

/** Pomak zagrebačke zone od UTC-a (u ms) u zadanom trenutku. */
function pomak(ms) {
  const z = uZagrebu(ms);
  return Date.UTC(z.g, z.mj - 1, z.d, z.h, z.min, z.s) - (ms - (ms % 1000));
}

/** Zagrebačko lokalno vrijeme (mjesec 1–12) -> Date. Uzima u obzir ljetno računanje vremena. */
function izZagreba(g, mj, d, h = 0, min = 0) {
  const kaoUtc = Date.UTC(g, mj - 1, d, h, min);
  const prvi = kaoUtc - pomak(kaoUtc);
  return new Date(kaoUtc - pomak(prvi));
}

/** Vrijednost polja <input type="datetime-local"> ('2026-07-14T17:42') -> Date ili null. */
function izPoljaDatuma(tekst) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/.exec(String(tekst ?? '').trim());
  if (!m) return null;
  const [g, mj, d, h, min] = m.slice(1).map(Number);
  const datum = izZagreba(g, mj, d, h, min);
  // odbij nepostojeće datume poput 31. 2. koje bi Date.UTC prebacio u ožujak
  const z = uZagrebu(datum);
  return z.mj === mj && z.d === d ? datum : null;
}

const dva = (n) => String(n).padStart(2, '0');

/** Date -> vrijednost za <input type="datetime-local"> po zagrebačkom vremenu. */
function zaPoljeDatuma(datum) {
  const z = uZagrebu(datum);
  return `${z.g}-${dva(z.mj)}-${dva(z.d)}T${dva(z.h)}:${dva(z.min)}`;
}

/** '14. 7. 2026. 17:42' */
function datumIVrijeme(datum) {
  const z = uZagrebu(datum);
  return `${z.d}. ${z.mj}. ${z.g}. ${dva(z.h)}:${dva(z.min)}`;
}

/** '17:42' */
function sat(datum) {
  const z = uZagrebu(datum);
  return `${dva(z.h)}:${dva(z.min)}`;
}

/** Je li datum danas po zagrebačkom vremenu. */
function danas(datum, sada = new Date()) {
  const a = uZagrebu(datum);
  const b = uZagrebu(sada);
  return a.g === b.g && a.mj === b.mj && a.d === b.d;
}

/**
 * Naziv dana za prognozu: 'Danas', 'Sutra' ili dan u tjednu.
 * `datum` je kalendarski dan u obliku { g, mj, d }.
 */
function nazivDana({ g, mj, d }, sada = new Date()) {
  const z = uZagrebu(sada);
  const razlika = Math.round((Date.UTC(g, mj - 1, d) - Date.UTC(z.g, z.mj - 1, z.d)) / 86_400_000);
  if (razlika === 0) return 'Danas';
  if (razlika === 1) return 'Sutra';
  const dan = DANI[new Date(Date.UTC(g, mj - 1, d)).getUTCDay()];
  return dan[0].toUpperCase() + dan.slice(1);
}

module.exports = {
  ZONA, uZagrebu, izZagreba, izPoljaDatuma, zaPoljeDatuma, datumIVrijeme, sat, danas, nazivDana,
};
