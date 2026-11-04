// Privremeni podaci dok backend nije spreman. Zamijeniti pozivima na API.
const postaje = [
  { id: 1, ime: 'Zagreb-Maksimir', regija: 'Zagreb i okolica', lat: 45.822, lng: 16.034, temp: 24.1, vlaga: 61, tlak: 1012, vjetarSmjer: 'SZ', vjetarBrzina: 14 },
  { id: 2, ime: 'Osijek', regija: 'Slavonija', lat: 45.553, lng: 18.726, temp: 27.3, vlaga: 48, tlak: 1010, vjetarSmjer: 'JZ', vjetarBrzina: 22 },
  { id: 3, ime: 'Split-Marjan', regija: 'Dalmacija', lat: 43.511, lng: 16.426, temp: 29.0, vlaga: 55, tlak: 1014, vjetarSmjer: 'JI', vjetarBrzina: 9 },
  { id: 4, ime: 'Pula-aerodrom', regija: 'Istra', lat: 44.893, lng: 13.922, temp: 26.4, vlaga: 58, tlak: 1013, vjetarSmjer: 'S', vjetarBrzina: 18 },
  { id: 5, ime: 'Rijeka', regija: 'Kvarner', lat: 45.337, lng: 14.443, temp: 25.2, vlaga: 66, tlak: 1011, vjetarSmjer: 'SI', vjetarBrzina: 31 },
];
const upozorenja = [
  { id: 1, regija: 'Slavonija', razina: 'crvena', pojava: 'Grmljavina i tuča', vrijediDo: '21:00' },
  { id: 2, regija: 'Zagreb i okolica', razina: 'narančasta', pojava: 'Olujni vjetar', vrijediDo: '20:00' },
  { id: 3, regija: 'Kvarner', razina: 'žuta', pojava: 'Jak vjetar (bura)', vrijediDo: '23:59' },
];
const prognoza = [
  { dan: 'Danas', ikona: '⛈', min: 17, max: 27, opis: 'Grmljavina, mjestimice tuča' },
  { dan: 'Sutra', ikona: '🌦', min: 15, max: 24, opis: 'Promjenjivo, kiša u prvom dijelu dana' },
  { dan: 'Petak', ikona: '☀', min: 14, max: 26, opis: 'Pretežno sunčano' },
];
const prijave = [
  { id: 101, vrsta: 'Tuča', mjesto: 'Đakovo', lat: 45.31, lng: 18.41, vrijeme: '14. 7. 2026. 17:42', status: 'potvrđena', vjerodostojnost: 92, potvrde: 14, osporavanja: 1, autor: 'ivana_k', pouzdan: true, intenzitet: 'veličina oraha', steta: 'oštećeni usjevi i auti', dogadaj: 1, opis: 'Tuča traje oko 10 minuta, tuče na cesti.' },
  { id: 102, vrsta: 'Tuča', mjesto: 'Vuka', lat: 45.43, lng: 18.52, vrijeme: '14. 7. 2026. 17:55', status: 'potvrđena', vjerodostojnost: 78, potvrde: 6, osporavanja: 0, autor: 'marko_p', pouzdan: false, intenzitet: 'veličina lješnjaka', steta: 'manja', dogadaj: 1, opis: 'Počela tuča, vjetar sve jači.' },
  { id: 103, vrsta: 'Olujni vjetar', mjesto: 'Sesvete', lat: 45.83, lng: 16.11, vrijeme: '14. 7. 2026. 18:10', status: 'na čekanju', vjerodostojnost: 40, potvrde: 2, osporavanja: 1, autor: 'tomislav', pouzdan: false, intenzitet: 'jaki udari', steta: 'srušeno stablo na cesti', dogadaj: 2, opis: 'Stablo blokira cestu prema Dubravi.' },
  { id: 104, vrsta: 'Jaka kiša i poplava', mjesto: 'Rijeka, Sušak', lat: 45.33, lng: 14.45, vrijeme: '13. 7. 2026. 21:05', status: 'predana', vjerodostojnost: 0, potvrde: 0, osporavanja: 0, autor: 'ivana_k', pouzdan: true, intenzitet: 'preplavljena ulica', steta: 'nema', dogadaj: null, opis: 'Voda do gležnjeva na križanju.' },
];
const dogadaji = [
  { id: 1, naziv: 'Tuča, Đakovo, 14. 7. 2026.', vrsta: 'Tuča', regija: 'Slavonija', prijava: [101, 102],
    komentar: { meteorolog: 'dr. Horvat', tekst: 'Superćelija se kreće prema istoku brzinom oko 40 km/h. Očekuje se slabljenje nakon 19 h.' },
    rasprava: [{ autor: 'marko_p', tekst: 'Kod nas još pada, zrna sve veća.' }, { autor: 'ana', tekst: 'Kod mene u Vuki je samo kiša.' }] },
  { id: 2, naziv: 'Olujni vjetar, Zagreb, 14. 7. 2026.', vrsta: 'Olujni vjetar', regija: 'Zagreb i okolica', prijava: [103], komentar: null, rasprava: [] },
];
const lokacije = [
  { ime: 'Zagreb', postaja: postaje[0], upozorenja: [upozorenja[1]] },
  { ime: 'Đakovo', postaja: postaje[1], upozorenja: [upozorenja[0]] },
];
const obavijesti = [
  { id: 1, tekst: 'DHMZ je izdao crveno upozorenje za Slavoniju.', vrijeme: 'prije 12 min', procitano: false },
  { id: 2, tekst: 'Nova potvrđena prijava tuče u krugu 20 km od lokacije Đakovo.', vrijeme: 'prije 40 min', procitano: false },
  { id: 3, tekst: 'Korisnik ivana_k objavio je novu prijavu.', vrijeme: 'jučer', procitano: true },
];
const statistika = {
  poRegijama: [['Slavonija', 42], ['Zagreb i okolica', 31], ['Dalmacija', 12], ['Istra', 9], ['Kvarner', 14]],
  poMjesecima: [['Lip', 18], ['Srp', 47], ['Kol', 31], ['Ruj', 12]],
};
const korisnici = [
  { id: 1, ime: 'ivana_k', email: 'ivana@example.com', uloga: 'pouzdani motritelj', bodovi: 240 },
  { id: 2, ime: 'marko_p', email: 'marko@example.com', uloga: 'korisnik', bodovi: 55 },
  { id: 3, ime: 'dr_horvat', email: 'horvat@example.com', uloga: 'meteorolog', bodovi: 0 },
];
module.exports = { postaje, upozorenja, prognoza, prijave, dogadaji, lokacije, obavijesti, statistika, korisnici };
