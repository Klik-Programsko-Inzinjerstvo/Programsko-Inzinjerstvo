-- StormWatch – testni podaci (prebačeni iz server/data/mock.js)
-- Pokreće se s: npm run seed
-- PAŽNJA: briše sve korisnike, postaje, mjerenja, prognoze, upozorenja i prijave
-- pa ih upisuje iznova. Šifrarnici (uloga, regija, vrsta_pojave) se ne diraju.

BEGIN;

TRUNCATE slika, prijava, upozorenje, prognoza, mjerenje, postaja, korisnik
    RESTART IDENTITY CASCADE;

-- ---------------------------------------------------------------------------
-- Korisnici
-- ---------------------------------------------------------------------------
INSERT INTO korisnik (email, korisnicko_ime, ime_prikaza, uloga_id, reputacija) VALUES
    ('ivana@example.com',     'ivana_k',    'Ivana K.',         2, 240),
    ('marko@example.com',     'marko_p',    'Marko P.',         1,  55),
    ('tomislav@example.com',  'tomislav',   'Tomislav',         1,  10),
    ('ana@example.com',       'ana',        'Ana',              1,   5),
    ('horvat@example.com',    'dr_horvat',  'dr. Horvat',       4,   0),
    ('moderator@example.com', 'mod_slavonija', 'Moderator Slavonija', 3, 0),
    ('admin@example.com',     'admin',      'Administrator',    5,   0);

-- ---------------------------------------------------------------------------
-- Mjerne postaje (ST_MakePoint prima dužinu pa širinu!)
-- ---------------------------------------------------------------------------
INSERT INTO postaja (dhmz_oznaka, ime, regija_id, lokacija, nadmorska_visina)
SELECT v.oznaka, v.ime, r.id, ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)::geography, v.visina
FROM (VALUES
    ('Zagreb-Maksimir', 'Zagreb-Maksimir', 'Zagreb i okolica', 45.822, 16.034, 123),
    ('Osijek',          'Osijek',          'Slavonija',        45.553, 18.726,  89),
    ('Split-Marjan',    'Split-Marjan',    'Dalmacija',        43.511, 16.426, 122),
    ('Pula-aerodrom',   'Pula-aerodrom',   'Istra',            44.893, 13.922,  63),
    ('Rijeka',          'Rijeka',          'Kvarner',          45.337, 14.443, 120)
) AS v(oznaka, ime, regija, lat, lng, visina)
JOIN regija r ON r.naziv = v.regija;

-- ---------------------------------------------------------------------------
-- Mjerenja: trenutačna (zadnja 3 sata, svakih 30 min) ...
-- ---------------------------------------------------------------------------
INSERT INTO mjerenje (postaja_id, vrijeme, temperatura, vlaga, tlak, vjetar_smjer, vjetar_brzina)
SELECT p.id,
       date_trunc('hour', now()) - (k * interval '30 minutes'),
       v.temp - k * 0.3, v.vlaga + k, v.tlak, v.smjer, v.brzina
FROM (VALUES
    ('Zagreb-Maksimir', 24.1, 61, 1012.0, 'SZ', 14.0),
    ('Osijek',          27.3, 48, 1010.0, 'JZ', 22.0),
    ('Split-Marjan',    29.0, 55, 1014.0, 'JI',  9.0),
    ('Pula-aerodrom',   26.4, 58, 1013.0, 'S',  18.0),
    ('Rijeka',          25.2, 66, 1011.0, 'SI', 31.0)
) AS v(oznaka, temp, vlaga, tlak, smjer, brzina)
JOIN postaja p ON p.dhmz_oznaka = v.oznaka
CROSS JOIN generate_series(0, 5) AS k;

-- ... i povijesna, u vrijeme događaja iz testnih prijava (14. 7. 2026.)
INSERT INTO mjerenje (postaja_id, vrijeme, temperatura, vlaga, tlak, vjetar_smjer, vjetar_brzina)
SELECT p.id, v.vrijeme::timestamptz, v.temp, v.vlaga, v.tlak, v.smjer, v.brzina
FROM (VALUES
    ('Osijek',          '2026-07-14 17:30+02', 21.4, 88, 1006.5, 'Z',  54.0),
    ('Osijek',          '2026-07-14 18:00+02', 19.8, 92, 1007.2, 'SZ', 41.0),
    ('Zagreb-Maksimir', '2026-07-14 18:00+02', 22.6, 79, 1008.1, 'SZ', 63.0),
    ('Rijeka',          '2026-07-13 21:00+02', 20.1, 95, 1009.4, 'JI', 25.0)
) AS v(oznaka, vrijeme, temp, vlaga, tlak, smjer, brzina)
JOIN postaja p ON p.dhmz_oznaka = v.oznaka;

-- ---------------------------------------------------------------------------
-- Prognoza (danas + 2 dana) za regije s postajama
-- ---------------------------------------------------------------------------
INSERT INTO prognoza (regija_id, datum, temp_min, temp_max, opis, ikona)
SELECT r.id, current_date + v.dan, v.tmin, v.tmax, v.opis, v.ikona
FROM regija r
CROSS JOIN (VALUES
    (0, 17, 27, 'Grmljavina, mjestimice tuča',           'grmljavina'),
    (1, 15, 24, 'Promjenjivo, kiša u prvom dijelu dana', 'kisa'),
    (2, 14, 26, 'Pretežno sunčano',                      'sunce')
) AS v(dan, tmin, tmax, opis, ikona)
WHERE r.naziv IN ('Zagreb i okolica', 'Slavonija', 'Dalmacija', 'Istra', 'Kvarner');

-- ---------------------------------------------------------------------------
-- Aktivna upozorenja (vrijede od sada do večeras)
-- ---------------------------------------------------------------------------
INSERT INTO upozorenje (dhmz_id, regija_id, razina, pojava, vrijedi_od, vrijedi_do)
SELECT v.dhmz_id, r.id, v.razina, v.pojava,
       date_trunc('hour', now()) - interval '1 hour',
       date_trunc('day', now()) + v.do_sata
FROM (VALUES
    ('test-1', 'Slavonija',        'crvena',     'Grmljavina i tuča', interval '1 day'),
    ('test-2', 'Zagreb i okolica', 'narancasta', 'Olujni vjetar',     interval '1 day'),
    ('test-3', 'Kvarner',          'zuta',       'Jak vjetar (bura)', interval '1 day')
) AS v(dhmz_id, regija, razina, pojava, do_sata)
JOIN regija r ON r.naziv = v.regija;

-- ---------------------------------------------------------------------------
-- Prijave nevremena
-- ---------------------------------------------------------------------------
INSERT INTO prijava (korisnik_id, vrsta_pojave_id, regija_id, lokacija, mjesto, vrijeme_opazanja,
                     intenzitet, steta, opis, stanje, vjerodostojnost)
SELECT k.id, vp.id, r.id, ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)::geography, v.mjesto,
       v.vrijeme::timestamptz, v.intenzitet, v.steta, v.opis, v.stanje, v.vjerodostojnost
FROM (VALUES
    ('ivana_k',  'tuca',          'Slavonija',        'Đakovo',        45.31, 18.41, '2026-07-14 17:42+02',
     'orah',              'oštećeni usjevi i auti',  'Tuča traje oko 10 minuta, tuče na cesti.', 'potvrdena',  92),
    ('marko_p',  'tuca',          'Slavonija',        'Vuka',          45.43, 18.52, '2026-07-14 17:55+02',
     'ljesnjak',          'manja',                   'Počela tuča, vjetar sve jači.',            'potvrdena',  78),
    ('tomislav', 'olujni_vjetar', 'Zagreb i okolica', 'Sesvete',       45.83, 16.11, '2026-07-14 18:10+02',
     'jaki udari',        'srušeno stablo na cesti', 'Stablo blokira cestu prema Dubravi.',      'na_cekanju', 40),
    ('ivana_k',  'jaka_kisa',     'Kvarner',          'Rijeka, Sušak', 45.33, 14.45, '2026-07-13 21:05+02',
     'preplavljena ulica', 'nema',                   'Voda do gležnjeva na križanju.',           'predana',     0)
) AS v(autor, vrsta, regija, mjesto, lat, lng, vrijeme, intenzitet, steta, opis, stanje, vjerodostojnost)
JOIN korisnik k ON k.korisnicko_ime = v.autor
JOIN vrsta_pojave vp ON vp.kod = v.vrsta
JOIN regija r ON r.naziv = v.regija
ORDER BY v.vrijeme;

INSERT INTO slika (prijava_id, url, redoslijed)
SELECT p.id, v.url, 0
FROM (VALUES
    ('Đakovo', 'https://res.cloudinary.com/demo/image/upload/sample.jpg')
) AS v(mjesto, url)
JOIN prijava p ON p.mjesto = v.mjesto;

COMMIT;
