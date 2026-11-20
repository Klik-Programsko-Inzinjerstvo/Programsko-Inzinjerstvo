// Pretvara retke iz baze u oblik koji očekuju frontendovi predlošci u server/views
// (isti oblik kao nekadašnji mock podaci), da se predlošci ne moraju mijenjati.
const vrijeme = require('./vrijeme');

const STANJA = { predana: 'predana', na_cekanju: 'na čekanju', potvrdena: 'potvrđena', odbijena: 'odbijena' };
const RAZINE = { zuta: 'žuta', narancasta: 'narančasta', crvena: 'crvena' };
const VELICINE_ZRNA = {
  grasak: 'veličina graška', ljesnjak: 'veličina lješnjaka', orah: 'veličina oraha', jaje: 'veličina jajeta',
};
const IKONE = {
  sunce: '☀', djelomicno: '⛅', oblacno: '☁', kisa: '🌧', pljuskovi: '🌦',
  grmljavina: '⛈', snijeg: '🌨', magla: '🌫', vjetar: '💨',
};

const ili = (v, zamjena = '–') => (v == null ? zamjena : v);

/** Redak iz db.zadnjaMjerenja() -> postaja za kartu i popis uvjeta. */
function postaja(r) {
  return {
    id: r.postaja_id, ime: r.postaja, regija: r.regija, lat: r.lat, lng: r.lng,
    temp: r.temperatura, vlaga: ili(r.vlaga), tlak: ili(r.tlak),
    vjetarSmjer: ili(r.vjetar_smjer), vjetarBrzina: r.vjetar_brzina == null ? '–' : Math.round(r.vjetar_brzina),
  };
}

/** Redak iz db.aktivnaUpozorenja() -> upozorenje. */
function upozorenje(r, sada = new Date()) {
  return {
    id: r.id, regija: r.regija, razina: RAZINE[r.razina] || r.razina, pojava: r.pojava, opis: r.opis,
    vrijediDo: vrijeme.danas(r.vrijedi_do, sada) ? vrijeme.sat(r.vrijedi_do) : vrijeme.datumIVrijeme(r.vrijedi_do),
  };
}

/**
 * Redak iz db.prognoze() -> dan prognoze. Stupac `date` driver pretvara u Date
 * u lokalnoj zoni procesa, pa se kalendarski dan čita lokalnim getterima.
 */
function prognoza(r, sada = new Date()) {
  const d = r.datum instanceof Date
    ? { g: r.datum.getFullYear(), mj: r.datum.getMonth() + 1, d: r.datum.getDate() }
    : (([g, mj, dan]) => ({ g, mj, d: dan }))(String(r.datum).split('-').map(Number));
  return {
    dan: vrijeme.nazivDana(d, sada), ikona: IKONE[r.ikona] || '🌡',
    min: r.temp_min == null ? '–' : Math.round(r.temp_min),
    max: r.temp_max == null ? '–' : Math.round(r.temp_max),
    opis: r.opis || '',
  };
}

/** Redak iz db.prijave()/db.prijava() -> prijava. */
function prijava(r) {
  return {
    id: r.id, vrsta: r.vrsta, vrstaKod: r.vrsta_kod, mjesto: r.mjesto || 'nepoznato mjesto',
    lat: r.lat, lng: r.lng, regija: r.regija,
    vrijeme: vrijeme.datumIVrijeme(r.vrijeme_opazanja),
    status: STANJA[r.stanje] || r.stanje, razlogOdbijanja: r.razlog_odbijanja,
    vjerodostojnost: r.vjerodostojnost,
    // potvrde i osporavanja dobivaju tablicu u idućoj migraciji (FZ-07)
    potvrde: 0, osporavanja: 0,
    autor: r.autor, pouzdan: r.pouzdan,
    intenzitet: VELICINE_ZRNA[r.intenzitet] || r.intenzitet || '',
    steta: r.steta || '', opis: r.opis || '', slike: r.slike || [],
    dogadaj: null,
  };
}

/** Samo polja koja treba karta (sve ostalo ostaje na poslužitelju). */
function prijavaZaKartu(r) {
  const p = prijava(r);
  return { id: p.id, lat: p.lat, lng: p.lng, vrsta: p.vrsta, mjesto: p.mjesto, vrijeme: p.vrijeme, vjerodostojnost: p.vjerodostojnost };
}

/** Redak iz db.mjerenjeUTrenutku() -> službeno mjerenje uz prijavu (ili null). */
function mjerenje(r) {
  if (!r) return null;
  return {
    postaja: r.postaja, udaljenostKm: r.udaljenost_km, postoji: r.vrijeme != null,
    vrijeme: r.vrijeme == null ? null : vrijeme.datumIVrijeme(r.vrijeme),
    temp: ili(r.temperatura), vlaga: ili(r.vlaga), tlak: ili(r.tlak),
    vjetarSmjer: ili(r.vjetar_smjer), vjetarBrzina: r.vjetar_brzina == null ? '–' : Math.round(r.vjetar_brzina),
  };
}

/** Korisnik iz baze -> korisnik u predlošcima (`user`); uloga je kod iz baze, npr. 'moderator'. */
function korisnik(k) {
  return { id: k.id, ime: k.korisnicko_ime, uloga: k.uloga };
}

module.exports = { postaja, upozorenje, prognoza, prijava, prijavaZaKartu, mjerenje, korisnik };
