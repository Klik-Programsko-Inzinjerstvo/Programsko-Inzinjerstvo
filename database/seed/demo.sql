-- Demo podaci za javnu bazu (Supabase) za prezentaciju 19. 11. 2026.
-- NE briše ništa: stvarne postaje i mjerenja s DHMZ-a ostaju. Može se pokrenuti više puta.

BEGIN;

-- autori testnih prijava
INSERT INTO korisnik (email, korisnicko_ime, ime_prikaza, uloga_id, reputacija) VALUES
    ('ivana@example.com',    'ivana_k',  'Ivana K.', 2, 240),
    ('marko@example.com',    'marko_p',  'Marko P.', 1,  55),
    ('tomislav@example.com', 'tomislav', 'Tomislav', 1,  10)
ON CONFLICT DO NOTHING;

-- prognoza: danas + 2 dana, sve regije
INSERT INTO prognoza (regija_id, datum, temp_min, temp_max, opis, ikona)
SELECT r.id, current_date + v.dan, v.tmin, v.tmax, v.opis, v.ikona
FROM (VALUES
    ('Zagreb i okolica',        0,  7, 12, 'Oblačno, povremeno kiša',                     'kisa'),
    ('Zagreb i okolica',        1,  4,  9, 'Promjenjivo oblačno, mjestimice kiša',        'pljuskovi'),
    ('Zagreb i okolica',        2,  1,  7, 'Pretežno oblačno, ujutro magla',              'oblacno'),
    ('Sjeverozapadna Hrvatska', 0,  6, 11, 'Oblačno, povremeno kiša',                     'kisa'),
    ('Sjeverozapadna Hrvatska', 1,  3,  8, 'Promjenjivo oblačno, mjestimice kiša',        'pljuskovi'),
    ('Sjeverozapadna Hrvatska', 2,  0,  6, 'Ujutro magla, zatim oblačno',                 'magla'),
    ('Slavonija',               0,  8, 14, 'Oblačno, poslijepodne kiša',                  'kisa'),
    ('Slavonija',               1,  5, 10, 'Promjenjivo, kiša u prvom dijelu dana',       'pljuskovi'),
    ('Slavonija',               2,  2,  8, 'Pretežno oblačno',                            'oblacno'),
    ('Lika i Gorski kotar',     0,  5, 11, 'Kiša, u gorju obilna, jako jugo',             'kisa'),
    ('Lika i Gorski kotar',     1,  1,  6, 'Kiša prelazi u susnježicu, u gorju snijeg',   'snijeg'),
    ('Lika i Gorski kotar',     2, -2,  4, 'Hladno, mjestimice snijeg',                   'snijeg'),
    ('Istra',                   0, 11, 15, 'Kiša i pljuskovi, jako jugo',                 'pljuskovi'),
    ('Istra',                   1,  8, 13, 'Djelomično sunčano, bura',                    'djelomicno'),
    ('Istra',                   2,  5, 12, 'Pretežno sunčano',                            'sunce'),
    ('Kvarner',                 0, 12, 16, 'Kiša, mjestimice obilna, olujno jugo',        'kisa'),
    ('Kvarner',                 1,  8, 12, 'Bura, mjestimice olujna',                     'vjetar'),
    ('Kvarner',                 2,  6, 11, 'Sunčano, umjerena bura',                      'sunce'),
    ('Dalmacija',               0, 14, 19, 'Kiša i grmljavina, olujno jugo',              'grmljavina'),
    ('Dalmacija',               1, 11, 16, 'Promjenjivo, okretanje vjetra na buru',       'djelomicno'),
    ('Dalmacija',               2,  8, 15, 'Pretežno sunčano, bura',                      'sunce')
) AS v(regija, dan, tmin, tmax, opis, ikona)
JOIN regija r ON r.naziv = v.regija
ON CONFLICT (regija_id, datum) DO NOTHING;

-- upozorenja: vrijede od jutros do sutra ujutro
INSERT INTO upozorenje (dhmz_id, regija_id, razina, pojava, vrijedi_od, vrijedi_do)
SELECT v.dhmz_id, r.id, v.razina, v.pojava, now() - interval '3 hours', (current_date + 1) + time '06:00'
FROM (VALUES
    ('demo-1', 'Kvarner',             'narancasta', 'Olujno jugo'),
    ('demo-2', 'Dalmacija',           'narancasta', 'Obilna kiša i grmljavina'),
    ('demo-3', 'Lika i Gorski kotar', 'zuta',       'Obilna kiša')
) AS v(dhmz_id, regija, razina, pojava)
JOIN regija r ON r.naziv = v.regija
ON CONFLICT (dhmz_id) DO UPDATE SET vrijedi_od = EXCLUDED.vrijedi_od, vrijedi_do = EXCLUDED.vrijedi_do;

-- povijesna mjerenja na najbližoj postaji u vrijeme srpanjskih prijava (usporedba sa službenim mjerenjem)
INSERT INTO mjerenje (postaja_id, vrijeme, temperatura, vlaga, tlak, vjetar_smjer, vjetar_brzina)
SELECT (SELECT p.id FROM postaja p WHERE p.aktivna
        ORDER BY p.lokacija <-> ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)::geography LIMIT 1),
       v.vrijeme::timestamptz, v.temp, v.vlaga, v.tlak, v.smjer, v.brzina
FROM (VALUES
    (45.31, 18.41, '2026-07-14 17:30+02', 21.4, 88, 1006.5, 'Z',  54.0),
    (45.43, 18.52, '2026-07-14 18:00+02', 19.8, 92, 1007.2, 'SZ', 41.0),
    (45.83, 16.11, '2026-07-14 18:00+02', 22.6, 79, 1008.1, 'SZ', 63.0),
    (45.33, 14.45, '2026-07-13 21:00+02', 20.1, 95, 1009.4, 'JI', 25.0)
) AS v(lat, lng, vrijeme, temp, vlaga, tlak, smjer, brzina)
ON CONFLICT (postaja_id, vrijeme) DO NOTHING;

-- prijave: srpanjske iz testnih podataka + dvije današnje (uz stvarna mjerenja DHMZ-a od 11 h)
INSERT INTO prijava (korisnik_id, vrsta_pojave_id, regija_id, lokacija, mjesto, vrijeme_opazanja,
                     intenzitet, steta, opis, stanje, vjerodostojnost)
SELECT k.id, vp.id, r.id, ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)::geography, v.mjesto,
       v.vrijeme::timestamptz, v.intenzitet, v.steta, v.opis, v.stanje, v.vjerodostojnost
FROM (VALUES
    ('ivana_k',  'tuca',          'Slavonija',        'Đakovo',          45.31,  18.41,  '2026-07-14 17:42+02',
     'orah',               'oštećeni usjevi i auti',                 'Tuča traje oko 10 minuta, tuče na cesti.',  'potvrdena',  92),
    ('marko_p',  'tuca',          'Slavonija',        'Vuka',            45.43,  18.52,  '2026-07-14 17:55+02',
     'ljesnjak',           'manja',                                  'Počela tuča, vjetar sve jači.',             'potvrdena',  78),
    ('tomislav', 'olujni_vjetar', 'Zagreb i okolica', 'Sesvete',         45.83,  16.11,  '2026-07-14 18:10+02',
     'jaki udari',         'srušeno stablo na cesti',                'Stablo blokira cestu prema Dubravi.',       'na_cekanju', 40),
    ('ivana_k',  'jaka_kisa',     'Kvarner',          'Rijeka, Sušak',   45.33,  14.45,  '2026-07-13 21:05+02',
     'preplavljena ulica', 'nema',                                   'Voda do gležnjeva na križanju.',            'predana',     0),
    ('ivana_k',  'olujni_vjetar', 'Dalmacija',        'Zadar, Poluotok', 44.116, 15.225, '2026-11-19 11:05+01',
     'jaki udari',         'polomljene grane, prevrnuti kontejneri', 'Jugo jako puše, more prelijeva rivu.',      'potvrdena',  88),
    ('marko_p',  'jaka_kisa',     'Kvarner',          'Rab',             44.758, 14.762, '2026-11-19 11:12+01',
     'pljusak',            'poplavljena ulica kod luke',             'Jaka kiša, kod luke voda na cesti.',        'potvrdena',  74)
) AS v(autor, vrsta, regija, mjesto, lat, lng, vrijeme, intenzitet, steta, opis, stanje, vjerodostojnost)
JOIN korisnik k ON k.korisnicko_ime = v.autor
JOIN vrsta_pojave vp ON vp.kod = v.vrsta
JOIN regija r ON r.naziv = v.regija
WHERE NOT EXISTS (SELECT 1 FROM prijava x WHERE x.mjesto = v.mjesto AND x.vrijeme_opazanja = v.vrijeme::timestamptz)
ORDER BY v.vrijeme;

COMMIT;
