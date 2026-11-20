// Periodički uvoz trenutačnih mjerenja s DHMZ-a (FZ-03). Podaci se spremaju u
// našu bazu, pa aplikacija radi i kad DHMZ nije dostupan (NFZ-03).
// Izvor: https://vrijeme.hr/hrvatska_n.xml – © Državni hidrometeorološki zavod.
const { XMLParser } = require('fast-xml-parser');
const { izZagreba } = require('./vrijeme');

// Regije postaja iz hrvatska_n.xml (nazivi točno kako ih piše DHMZ). Regija
// određuje moderatora prijave. Postaju koje nema na popisu baza smješta u
// regiju najbliže postaje.
const POSTAJE_PO_REGIJAMA = {
  'Zagreb i okolica': [
    'Zagreb-Maksimir', 'Zagreb-aerodrom', 'Zagreb-Grič', 'RC Puntijarka', 'Karlovac', 'Sisak', 'Hrvatska Kostajnica',
  ],
  'Sjeverozapadna Hrvatska': [
    'Varaždin', 'Krapina', 'Križevci', 'Bjelovar', 'RC Bilogora', 'Štrigova', 'Čakovec', 'Koprivnica',
  ],
  'Slavonija': [
    'Osijek', 'RC Osijek-Čepin', 'Slavonski Brod', 'Požega', 'Kutjevo', 'Daruvar', 'Virovitica', 'Vukovar-Grabovo',
    'RC Gorice (kod Nove Gradiške)', 'RC Gradište (kod Županje)',
  ],
  'Lika i Gorski kotar': [
    'Gospić', 'Otočac', 'Ličko Lešće', 'NP Plitvička jezera', 'Zavižan', 'Ogulin', 'Plaški', 'Bosiljevo',
    'Parg-Čabar', 'Crni Lug - NP Risnjak', 'Delnice',
  ],
  'Istra': [
    'Pula-aerodrom', 'Pazin', 'Monte Kope', 'Porer - svjetionik', 'Sv. Ivan na pučini - svjetionik', 'Poreč', 'Rovinj',
  ],
  'Kvarner': [
    'Rijeka', 'Rijeka-aerodrom', 'Opatija', 'Crikvenica', 'Senj', 'Malinska', 'Rab', 'Mali Lošinj', 'Mali Lošinj - Ćunski',
  ],
  'Dalmacija': [
    'Zadar', 'Zadar-aerodrom', 'Knin', 'Šibenik', 'Split-Marjan', 'Split-Marjan-Marjan', 'Split-aerodrom', 'Makarska',
    'Hvar', 'Lastovo', 'Ploče', 'Rašćane', 'Živogošće', 'Dubrovnik', 'Dubrovnik-aerodrom', 'Prevlaka',
  ],
};
const REGIJE = Object.fromEntries(Object.entries(POSTAJE_PO_REGIJAMA)
  .flatMap(([regija, postaje]) => postaje.map((ime) => [ime, regija])));

// DHMZ šalje engleske oznake smjera (SW), a baza i sučelje koriste hrvatske (JZ)
const SMJER = { N: 'S', S: 'J', E: 'I', W: 'Z' };

const broj = (v) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

/**
 * Čita DHMZ-ov XML s trenutačnim podacima.
 * @returns { vrijeme: Date, postaje: [{ oznaka, regija, lat, lng, temperatura, vlaga, tlak, vjetarSmjer, vjetarBrzina }] }
 */
function procitajXml(xml) {
  const parser = new XMLParser({ ignoreAttributes: true, parseTagValue: false, trimValues: true, isArray: (ime) => ime === 'Grad' });
  const { Hrvatska } = parser.parse(xml);
  const termin = Hrvatska?.DatumTermin;
  const [d, mj, g] = String(termin?.Datum ?? '').split('.').map(Number);
  const sat = Number(termin?.Termin);
  if (!g || !mj || !d || !Number.isInteger(sat)) throw new Error('Neočekivan format DHMZ XML-a (nema datuma i termina).');

  const postaje = (Hrvatska.Grad || []).map((grad) => {
    const p = grad.Podatci || {};
    const oznaka = String(grad.GradIme ?? '').trim();
    const smjer = String(p.VjetarSmjer ?? '').trim().toUpperCase();
    const brzina = broj(p.VjetarBrzina);
    const vlaga = broj(p.Vlaga);
    return {
      oznaka, regija: REGIJE[oznaka] || null,
      lat: broj(grad.Lat), lng: broj(grad.Lon),
      temperatura: broj(p.Temp),
      vlaga: vlaga != null && vlaga >= 0 && vlaga <= 100 ? Math.round(vlaga) : null,
      tlak: broj(p.Tlak), // zvjezdica iza tlaka (planinske postaje) se odbacuje
      vjetarSmjer: /^[NSEW]{1,3}$/.test(smjer) ? [...smjer].map((c) => SMJER[c]).join('') : null,
      vjetarBrzina: brzina == null ? null : Math.round(brzina * 3.6 * 10) / 10, // DHMZ: m/s, baza: km/h
    };
  }).filter((p) => p.oznaka && p.lat != null && p.lng != null);

  return { vrijeme: izZagreba(g, mj, d, sat), postaje };
}

/** Jedno preuzimanje: dohvat, čitanje i spremanje. Vraća broj novih mjerenja. */
async function uveziJednom({ db, adresa, fetchFn = fetch }) {
  const odgovor = await fetchFn(adresa, {
    headers: { 'User-Agent': 'StormWatch/0.1 (FER, Programsko inzenjerstvo)' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!odgovor.ok) throw new Error(`DHMZ je vratio HTTP ${odgovor.status}`);
  return db.spremiMjerenjaDhmz(procitajXml(await odgovor.text()));
}

/** Pokreće uvoz odmah po pokretanju poslužitelja i zatim svakih `intervalMin` minuta. */
function pokreniUvoz({ db, adresa, intervalMin }) {
  const uvezi = () => uveziJednom({ db, adresa })
    .then((novih) => console.log(`DHMZ: spremljeno novih mjerenja: ${novih}`))
    .catch((e) => console.error(`DHMZ: uvoz nije uspio (${e.message}); ostaju zadnji spremljeni podaci.`));
  setTimeout(uvezi, 3_000);
  return setInterval(uvezi, intervalMin * 60_000);
}

module.exports = { procitajXml, uveziJednom, pokreniUvoz, REGIJE };
