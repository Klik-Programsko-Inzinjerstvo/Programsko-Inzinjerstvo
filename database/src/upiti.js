// Upiti nad bazom koje koristi backend.
// Sve vrijednosti idu kao parametri ($1, $2...), nikad lijepljenjem u SQL.
// Koordinate su uvijek (lat, lng) u WGS84; PostGIS interno koristi (lng, lat).
const { pool, transakcija } = require('./db');

const tocka = (lngParam, latParam) =>
  `ST_SetSRID(ST_MakePoint(${lngParam}, ${latParam}), 4326)::geography`;

// Polja prijave u obliku pogodnom za frontend.
const PRIJAVA_POLJA = `
  p.id, vp.kod AS vrsta_kod, vp.naziv AS vrsta, p.mjesto,
  ST_Y(p.lokacija::geometry) AS lat, ST_X(p.lokacija::geometry) AS lng,
  p.vrijeme_opazanja, p.intenzitet, p.steta, p.opis, p.stanje, p.razlog_odbijanja,
  p.vjerodostojnost, p.kreirana, r.naziv AS regija,
  k.korisnicko_ime AS autor, (u.kod = 'pouzdani_motritelj') AS pouzdan,
  COALESCE((SELECT json_agg(s.url ORDER BY s.redoslijed, s.id) FROM slika s WHERE s.prijava_id = p.id), '[]') AS slike`;

const PRIJAVA_JOIN = `
  FROM prijava p
  JOIN vrsta_pojave vp ON vp.id = p.vrsta_pojave_id
  JOIN korisnik k ON k.id = p.korisnik_id
  JOIN uloga u ON u.id = k.uloga_id
  LEFT JOIN regija r ON r.id = p.regija_id`;

// ---------------------------------------------------------------------------
// Podaci DHMZ-a
// ---------------------------------------------------------------------------

/** Posljednje mjerenje sa svake aktivne postaje (sloj postaja na karti). */
async function zadnjaMjerenja() {
  const { rows } = await pool.query(`
    SELECT z.*, r.naziv AS regija
    FROM zadnje_mjerenje z LEFT JOIN regija r ON r.id = z.regija_id
    ORDER BY z.postaja`);
  return rows;
}

/** Najbliža aktivna postaja zadanoj točki, s udaljenošću u km. */
async function najblizaPostaja(lat, lng) {
  const { rows } = await pool.query(`
    SELECT p.id, p.ime, p.regija_id, r.naziv AS regija,
           ST_Y(p.lokacija::geometry) AS lat, ST_X(p.lokacija::geometry) AS lng,
           round((ST_Distance(p.lokacija, ${tocka('$2', '$1')}) / 1000)::numeric, 1) AS udaljenost_km
    FROM postaja p LEFT JOIN regija r ON r.id = p.regija_id
    WHERE p.aktivna
    ORDER BY p.lokacija <-> ${tocka('$2', '$1')}
    LIMIT 1`, [lat, lng]);
  return rows[0] || null;
}

/**
 * Službeno mjerenje s najbliže postaje u trenutku opažanja (FZ-06):
 * zadnje mjerenje te postaje koje nije starije od 3 sata prije opažanja.
 */
async function mjerenjeUTrenutku(lat, lng, vrijeme) {
  const { rows } = await pool.query(`
    SELECT p.id AS postaja_id, p.ime AS postaja,
           round((ST_Distance(p.lokacija, ${tocka('$2', '$1')}) / 1000)::numeric, 1) AS udaljenost_km,
           m.vrijeme, m.temperatura, m.vlaga, m.tlak, m.vjetar_smjer, m.vjetar_brzina
    FROM (SELECT * FROM postaja WHERE aktivna
          ORDER BY lokacija <-> ${tocka('$2', '$1')} LIMIT 1) p
    LEFT JOIN LATERAL (
      SELECT * FROM mjerenje
      WHERE postaja_id = p.id
        AND vrijeme <= $3::timestamptz
        AND vrijeme > $3::timestamptz - interval '3 hours'
      ORDER BY vrijeme DESC LIMIT 1
    ) m ON true`, [lat, lng, vrijeme]);
  return rows[0] || null;
}

/** Upozorenja koja vrijede u ovom trenutku, najteža prva. */
async function aktivnaUpozorenja() {
  const { rows } = await pool.query(`
    SELECT u.id, r.naziv AS regija, u.razina, u.pojava, u.opis, u.vrijedi_od, u.vrijedi_do
    FROM upozorenje u JOIN regija r ON r.id = u.regija_id
    WHERE now() BETWEEN u.vrijedi_od AND u.vrijedi_do
    ORDER BY array_position(ARRAY['crvena', 'narancasta', 'zuta'], u.razina), r.naziv`);
  return rows;
}

/** Prognoza od danas nadalje, po regijama. */
async function prognoze(regijaId = null) {
  const { rows } = await pool.query(`
    SELECT r.naziv AS regija, f.datum, f.temp_min, f.temp_max, f.opis, f.ikona
    FROM prognoza f JOIN regija r ON r.id = f.regija_id
    WHERE f.datum >= current_date AND ($1::smallint IS NULL OR f.regija_id = $1)
    ORDER BY r.naziv, f.datum`, [regijaId]);
  return rows;
}

/**
 * Sprema jedno preuzimanje trenutačnih podataka s DHMZ-a (FZ-03).
 * Postaju koje još nema dodaje (regija po nazivu, a ako je nema, regija
 * najbliže postaje). Mjerenje za isti termin se prepisuje: DHMZ je službeni
 * izvor i ima prednost pred ranije upisanim (npr. testnim) vrijednostima.
 * @param vrijeme  termin mjerenja
 * @param postaje  [{ oznaka, regija, lat, lng, temperatura, vlaga, tlak, vjetarSmjer, vjetarBrzina }]
 * @returns broj novih mjerenja (prepisana se ne broje)
 */
async function spremiMjerenjaDhmz({ vrijeme, postaje }) {
  return transakcija(async (k) => {
    let novih = 0;
    for (const p of postaje) {
      const { rows: [postaja] } = await k.query(`
        INSERT INTO postaja (dhmz_oznaka, ime, regija_id, lokacija)
        VALUES ($1, $1,
                COALESCE((SELECT id FROM regija WHERE naziv = $2),
                         (SELECT regija_id FROM postaja WHERE regija_id IS NOT NULL
                          ORDER BY lokacija <-> ${tocka('$4', '$3')} LIMIT 1)),
                ${tocka('$4', '$3')})
        ON CONFLICT (dhmz_oznaka) DO UPDATE
          SET lokacija = EXCLUDED.lokacija,
              regija_id = COALESCE((SELECT id FROM regija WHERE naziv = $2), postaja.regija_id)
        RETURNING id`, [p.oznaka, p.regija, p.lat, p.lng]);

      const { rows: [mjerenje] } = await k.query(`
        INSERT INTO mjerenje (postaja_id, vrijeme, temperatura, vlaga, tlak, vjetar_smjer, vjetar_brzina)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (postaja_id, vrijeme) DO UPDATE
          SET temperatura = EXCLUDED.temperatura, vlaga = EXCLUDED.vlaga, tlak = EXCLUDED.tlak,
              vjetar_smjer = EXCLUDED.vjetar_smjer, vjetar_brzina = EXCLUDED.vjetar_brzina, preuzeto = now()
        RETURNING (xmax = 0) AS novo`,
      [postaja.id, vrijeme, p.temperatura, p.vlaga, p.tlak, p.vjetarSmjer, p.vjetarBrzina]);
      if (mjerenje.novo) novih += 1;
    }
    return novih;
  });
}

// ---------------------------------------------------------------------------
// Šifrarnici
// ---------------------------------------------------------------------------

/** Vrste pojava za obrazac prijave, npr. { kod: 'tuca', naziv: 'Tuča' }. */
async function vrstePojava() {
  const { rows } = await pool.query('SELECT kod, naziv FROM vrsta_pojave ORDER BY id');
  return rows;
}

/** Regije, abecedno (odabir regije za prognozu). */
async function regije() {
  const { rows } = await pool.query('SELECT id, naziv FROM regija ORDER BY naziv');
  return rows;
}

// ---------------------------------------------------------------------------
// Prijave
// ---------------------------------------------------------------------------

/**
 * Prijave za kartu i popis (FZ-01, FZ-04). Odbijene se nikad ne vraćaju.
 * Svi filtri su neobavezni:
 *   samoPotvrdene  – javna karta za neprijavljene korisnike
 *   vrsta          – kod vrste pojave, npr. 'tuca'
 *   od, do         – vremenski raspon opažanja
 *   lat, lng, radijusKm – samo prijave u krugu oko točke
 */
async function prijave({ samoPotvrdene = false, vrsta = null, od = null, do: doVrijeme = null,
  lat = null, lng = null, radijusKm = null, limit = 200 } = {}) {
  const krug = lat != null && lng != null && radijusKm != null;
  const { rows } = await pool.query(`
    SELECT ${PRIJAVA_POLJA}
           ${krug ? `, round((ST_Distance(p.lokacija, ${tocka('$7', '$6')}) / 1000)::numeric, 1) AS udaljenost_km` : ''}
    ${PRIJAVA_JOIN}
    WHERE p.stanje <> 'odbijena'
      AND (NOT $1 OR p.stanje = 'potvrdena')
      AND ($2::text IS NULL OR vp.kod = $2)
      AND ($3::timestamptz IS NULL OR p.vrijeme_opazanja >= $3)
      AND ($4::timestamptz IS NULL OR p.vrijeme_opazanja <= $4)
      ${krug ? `AND ST_DWithin(p.lokacija, ${tocka('$7', '$6')}, $8::float8 * 1000)` : ''}
    ORDER BY p.vrijeme_opazanja DESC
    LIMIT $5`,
  [samoPotvrdene, vrsta, od, doVrijeme, limit, ...(krug ? [lat, lng, radijusKm] : [])]);
  return rows;
}

/** Jedna prijava po id-u (i odbijena, npr. za autora ili moderatora). */
async function prijava(id) {
  const { rows } = await pool.query(`SELECT ${PRIJAVA_POLJA} ${PRIJAVA_JOIN} WHERE p.id = $1`, [id]);
  return rows[0] || null;
}

/** Prijave jednog korisnika (pregled "Prijave"). */
async function prijaveKorisnika(korisnikId) {
  const { rows } = await pool.query(`
    SELECT ${PRIJAVA_POLJA} ${PRIJAVA_JOIN}
    WHERE p.korisnik_id = $1 ORDER BY p.vrijeme_opazanja DESC`, [korisnikId]);
  return rows;
}

/** Prijave koje čekaju odluku moderatora (FZ-11), najnovije prve. */
async function prijaveNaCekanju() {
  const { rows } = await pool.query(`
    SELECT ${PRIJAVA_POLJA} ${PRIJAVA_JOIN}
    WHERE p.stanje IN ('predana', 'na_cekanju')
    ORDER BY p.kreirana DESC`);
  return rows;
}

/**
 * Odluka moderatora: potvrda ili odbijanje (uz neobavezan razlog) prijave koja još čeka.
 * Vraća false ako prijava ne postoji ili je o njoj već odlučeno.
 */
async function odluciOPrijavi(id, { potvrdi, razlog = null }) {
  const { rowCount } = await pool.query(`
    UPDATE prijava
    SET stanje = $2, razlog_odbijanja = $3, azurirana = now()
    WHERE id = $1 AND stanje IN ('predana', 'na_cekanju')`,
  [id, potvrdi ? 'potvrdena' : 'odbijena', potvrdi ? null : razlog]);
  return rowCount === 1;
}

/**
 * Sprema novu prijavu nevremena sa slikama (FZ-06).
 * - regija se određuje prema najbližoj postaji
 * - prijava pouzdanog motritelja odmah je potvrđena (ne ide na moderaciju)
 * Baca grešku ako korisnik ne postoji, nije aktivan ili ima zabranu objave.
 * @returns spremljena prijava u istom obliku kao prijava(id)
 */
async function spremiPrijavu({ korisnikId, vrsta, lat, lng, mjesto = null, vrijemeOpazanja,
  intenzitet = null, steta = null, opis = null, slike = [] }) {
  const id = await transakcija(async (k) => {
    const { rows: [autor] } = await k.query(`
      SELECT u.kod AS uloga, aktivan,
             (zabrana_objave_do IS NOT NULL AND zabrana_objave_do > now()) AS zabrana
      FROM korisnik JOIN uloga u ON u.id = korisnik.uloga_id
      WHERE korisnik.id = $1`, [korisnikId]);
    if (!autor || !autor.aktivan) throw new Error('Korisnik ne postoji ili je deaktiviran.');
    if (autor.zabrana) throw new Error('Korisniku je privremeno onemogućeno objavljivanje.');

    const { rows: [nova] } = await k.query(`
      INSERT INTO prijava (korisnik_id, vrsta_pojave_id, regija_id, lokacija, mjesto, vrijeme_opazanja,
                           intenzitet, steta, opis, stanje)
      VALUES ($1,
              (SELECT id FROM vrsta_pojave WHERE kod = $2),
              (SELECT regija_id FROM postaja WHERE aktivna ORDER BY lokacija <-> ${tocka('$4', '$3')} LIMIT 1),
              ${tocka('$4', '$3')}, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
    [korisnikId, vrsta, lat, lng, mjesto, vrijemeOpazanja, intenzitet, steta, opis,
      autor.uloga === 'pouzdani_motritelj' ? 'potvrdena' : 'predana']);

    for (const [i, url] of slike.entries()) {
      await k.query('INSERT INTO slika (prijava_id, url, redoslijed) VALUES ($1, $2, $3)', [nova.id, url, i]);
    }
    return nova.id;
  });
  return prijava(id);
}

// ---------------------------------------------------------------------------
// Korisnici
// ---------------------------------------------------------------------------

/**
 * Poziva se nakon uspješne Google prijave (FZ-02). Pronalazi korisnika po
 * Google "sub" ili e-pošti, a ako ne postoji, stvara novog.
 * Vraća korisnika s ulogom; backend mora odbiti prijavu ako je aktivan = false.
 */
async function korisnikIzGooglea({ sub, email, ime = null, slika = null }) {
  const postojeci = await pool.query(`
    UPDATE korisnik
    SET google_sub = $1, zadnja_prijava = now(),
        ime_prikaza = COALESCE(ime_prikaza, $3), slika_url = COALESCE(slika_url, $4)
    WHERE google_sub = $1 OR (google_sub IS NULL AND lower(email) = lower($2))
    RETURNING id`, [sub, email, ime, slika]);

  let id = postojeci.rows[0]?.id;
  if (!id) {
    const baza = email.split('@')[0].replace(/[^A-Za-z0-9_.]/g, '_').padEnd(3, '_').slice(0, 24);
    for (let pokusaj = 0; !id; pokusaj++) {
      const korisnickoIme = pokusaj === 0 ? baza : `${baza}${Math.floor(Math.random() * 100000)}`;
      try {
        const { rows } = await pool.query(`
          INSERT INTO korisnik (google_sub, email, korisnicko_ime, ime_prikaza, slika_url, zadnja_prijava)
          VALUES ($1, $2, $3, $4, $5, now()) RETURNING id`, [sub, email, korisnickoIme, ime, slika]);
        id = rows[0].id;
      } catch (e) {
        // zauzeto korisničko ime -> pokušaj s brojem; sve ostalo je prava greška
        if (e.code !== '23505' || e.constraint !== 'korisnik_korisnicko_ime_key' || pokusaj > 5) throw e;
      }
    }
  }
  return korisnik(id);
}

/** Korisnik po id-u, s ulogom (za sesiju i profil). */
async function korisnik(id) {
  const { rows } = await pool.query(`
    SELECT k.id, k.email, k.korisnicko_ime, k.ime_prikaza, k.slika_url, k.opis,
           u.kod AS uloga, k.reputacija, k.aktivan, k.zabrana_objave_do, k.kreiran
    FROM korisnik k JOIN uloga u ON u.id = k.uloga_id
    WHERE k.id = $1`, [id]);
  return rows[0] || null;
}

/** Aktivni korisnici s ulogom, po korisničkom imenu. */
async function korisnici() {
  const { rows } = await pool.query(`
    SELECT k.id, k.korisnicko_ime, k.email, u.kod AS uloga, k.reputacija
    FROM korisnik k JOIN uloga u ON u.id = k.uloga_id
    WHERE k.aktivan
    ORDER BY k.korisnicko_ime`);
  return rows;
}

module.exports = {
  zadnjaMjerenja, najblizaPostaja, mjerenjeUTrenutku, aktivnaUpozorenja, prognoze, spremiMjerenjaDhmz,
  vrstePojava, regije,
  prijave, prijava, prijaveKorisnika, spremiPrijavu, prijaveNaCekanju, odluciOPrijavi,
  korisnikIzGooglea, korisnik, korisnici,
};
