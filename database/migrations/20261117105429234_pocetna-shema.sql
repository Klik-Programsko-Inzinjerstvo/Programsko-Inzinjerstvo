-- Up Migration

-- StormWatch – početna shema (prva predaja)
-- Opseg: korisnici i uloge, regije, podaci DHMZ-a (postaje, mjerenja, prognoze,
-- upozorenja) te prijave nevremena sa slikama.
-- Potvrde, komentari, događaji, praćenja i obavijesti dolaze u idućim migracijama.

CREATE EXTENSION IF NOT EXISTS postgis;

-- ---------------------------------------------------------------------------
-- Šifrarnici (referentni podaci, potrebni i u produkciji)
-- ---------------------------------------------------------------------------

CREATE TABLE uloga (
    id     smallint PRIMARY KEY,
    kod    text NOT NULL UNIQUE,
    naziv  text NOT NULL
);

CREATE TABLE regija (
    id     smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    naziv  text NOT NULL UNIQUE
);

CREATE TABLE vrsta_pojave (
    id     smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kod    text NOT NULL UNIQUE,
    naziv  text NOT NULL
);

-- ---------------------------------------------------------------------------
-- Korisnici
-- ---------------------------------------------------------------------------

CREATE TABLE korisnik (
    id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- "sub" iz Google ID tokena; NULL dok se korisnik prvi put ne prijavi
    google_sub            text UNIQUE,
    email                 text NOT NULL,
    korisnicko_ime        text NOT NULL UNIQUE,
    ime_prikaza           text,
    slika_url             text,
    opis                  text,
    uloga_id              smallint NOT NULL DEFAULT 1 REFERENCES uloga (id),
    reputacija            integer NOT NULL DEFAULT 0,
    aktivan               boolean NOT NULL DEFAULT true,
    -- privremena zabrana objavljivanja (moderator); NULL = nema zabrane
    zabrana_objave_do     timestamptz,
    kreiran               timestamptz NOT NULL DEFAULT now(),
    zadnja_prijava        timestamptz,
    CONSTRAINT korisnik_email_format CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    CONSTRAINT korisnik_korisnicko_ime_format CHECK (korisnicko_ime ~ '^[A-Za-z0-9_.]{3,30}$')
);

-- e-pošta je jedinstvena bez obzira na velika/mala slova
CREATE UNIQUE INDEX korisnik_email_uq ON korisnik (lower(email));

-- ---------------------------------------------------------------------------
-- Podaci DHMZ-a
-- ---------------------------------------------------------------------------

CREATE TABLE postaja (
    id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- naziv/oznaka postaje kako dolazi u DHMZ XML-u, služi za uparivanje pri uvozu
    dhmz_oznaka       text NOT NULL UNIQUE,
    ime               text NOT NULL,
    regija_id         smallint REFERENCES regija (id),
    lokacija          geography(Point, 4326) NOT NULL,
    nadmorska_visina  integer,
    aktivna           boolean NOT NULL DEFAULT true
);

CREATE INDEX postaja_lokacija_gix ON postaja USING gist (lokacija);

CREATE TABLE mjerenje (
    id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    postaja_id         bigint NOT NULL REFERENCES postaja (id) ON DELETE CASCADE,
    vrijeme            timestamptz NOT NULL,
    temperatura        numeric(4, 1),            -- °C
    vlaga              smallint CHECK (vlaga BETWEEN 0 AND 100),  -- %
    tlak               numeric(5, 1),            -- hPa
    vjetar_smjer       text,                     -- npr. 'SZ', 'JI'
    vjetar_brzina      numeric(4, 1) CHECK (vjetar_brzina >= 0), -- km/h
    preuzeto           timestamptz NOT NULL DEFAULT now(),
    -- isto mjerenje se ne smije upisati dvaput pri uvozu svakih 30 min
    CONSTRAINT mjerenje_postaja_vrijeme_uq UNIQUE (postaja_id, vrijeme)
);

CREATE TABLE prognoza (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    regija_id   smallint NOT NULL REFERENCES regija (id),
    datum       date NOT NULL,
    temp_min    numeric(4, 1),
    temp_max    numeric(4, 1),
    opis        text,
    ikona       text,
    preuzeto    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT prognoza_regija_datum_uq UNIQUE (regija_id, datum),
    CONSTRAINT prognoza_temp_raspon CHECK (temp_min IS NULL OR temp_max IS NULL OR temp_min <= temp_max)
);

CREATE TABLE upozorenje (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- identifikator upozorenja iz DHMZ izvora, za uparivanje pri uvozu
    dhmz_id      text UNIQUE,
    regija_id    smallint NOT NULL REFERENCES regija (id),
    razina       text NOT NULL CHECK (razina IN ('zuta', 'narancasta', 'crvena')),
    pojava       text NOT NULL,
    opis         text,
    vrijedi_od   timestamptz NOT NULL,
    vrijedi_do   timestamptz NOT NULL,
    preuzeto     timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT upozorenje_interval CHECK (vrijedi_od < vrijedi_do)
);

CREATE INDEX upozorenje_aktivna_idx ON upozorenje (regija_id, vrijedi_do);

-- ---------------------------------------------------------------------------
-- Prijave nevremena
-- ---------------------------------------------------------------------------

CREATE TABLE prijava (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    korisnik_id         bigint NOT NULL REFERENCES korisnik (id),
    vrsta_pojave_id     smallint NOT NULL REFERENCES vrsta_pojave (id),
    -- regija određuje moderatora; backend je postavlja prema najbližoj postaji
    regija_id           smallint REFERENCES regija (id),
    lokacija            geography(Point, 4326) NOT NULL,
    mjesto              text,                    -- naziv mjesta za prikaz
    vrijeme_opazanja    timestamptz NOT NULL,
    intenzitet          text,                    -- za tuču: grasak, ljesnjak, orah, jaje
    steta               text,
    opis                text,
    stanje              text NOT NULL DEFAULT 'predana'
                        CHECK (stanje IN ('predana', 'na_cekanju', 'potvrdena', 'odbijena')),
    razlog_odbijanja    text,
    vjerodostojnost     smallint NOT NULL DEFAULT 0 CHECK (vjerodostojnost BETWEEN 0 AND 100),
    kreirana            timestamptz NOT NULL DEFAULT now(),
    azurirana           timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT prijava_razlog_odbijanja CHECK (stanje = 'odbijena' OR razlog_odbijanja IS NULL)
);

CREATE INDEX prijava_lokacija_gix ON prijava USING gist (lokacija);
CREATE INDEX prijava_vrijeme_idx ON prijava (vrijeme_opazanja DESC);
CREATE INDEX prijava_korisnik_idx ON prijava (korisnik_id);
CREATE INDEX prijava_regija_stanje_idx ON prijava (regija_id, stanje);

CREATE TABLE slika (
    id                     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    prijava_id             bigint NOT NULL REFERENCES prijava (id) ON DELETE CASCADE,
    -- slike su na Cloudinaryju, u bazi je samo poveznica
    url                    text NOT NULL,
    cloudinary_public_id   text,
    redoslijed             smallint NOT NULL DEFAULT 0,
    kreirana               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX slika_prijava_idx ON slika (prijava_id, redoslijed);

-- ---------------------------------------------------------------------------
-- Pogledi
-- ---------------------------------------------------------------------------

-- posljednje mjerenje za svaku postaju (sloj "mjerne postaje" na karti)
CREATE VIEW zadnje_mjerenje AS
SELECT DISTINCT ON (m.postaja_id)
       m.postaja_id, p.ime AS postaja, p.regija_id,
       ST_Y(p.lokacija::geometry) AS lat, ST_X(p.lokacija::geometry) AS lng,
       m.vrijeme, m.temperatura, m.vlaga, m.tlak, m.vjetar_smjer, m.vjetar_brzina
FROM mjerenje m
JOIN postaja p ON p.id = m.postaja_id
WHERE p.aktivna
ORDER BY m.postaja_id, m.vrijeme DESC;

-- ---------------------------------------------------------------------------
-- Referentni podaci
-- ---------------------------------------------------------------------------

INSERT INTO uloga (id, kod, naziv) VALUES
    (1, 'korisnik',           'Registrirani korisnik'),
    (2, 'pouzdani_motritelj', 'Pouzdani motritelj'),
    (3, 'moderator',          'Moderator'),
    (4, 'meteorolog',         'Meteorolog'),
    (5, 'administrator',      'Administrator');

INSERT INTO regija (naziv) VALUES
    ('Zagreb i okolica'),
    ('Sjeverozapadna Hrvatska'),
    ('Slavonija'),
    ('Lika i Gorski kotar'),
    ('Istra'),
    ('Kvarner'),
    ('Dalmacija');

INSERT INTO vrsta_pojave (kod, naziv) VALUES
    ('tuca',          'Tuča'),
    ('olujni_vjetar', 'Olujni vjetar'),
    ('jaka_kisa',     'Jaka kiša i poplava'),
    ('snijeg',        'Snijeg'),
    ('poledica',      'Poledica'),
    ('pijavica',      'Pijavica'),
    ('ostalo',        'Ostalo');

-- Down Migration

DROP VIEW IF EXISTS zadnje_mjerenje;
DROP TABLE IF EXISTS slika;
DROP TABLE IF EXISTS prijava;
DROP TABLE IF EXISTS upozorenje;
DROP TABLE IF EXISTS prognoza;
DROP TABLE IF EXISTS mjerenje;
DROP TABLE IF EXISTS postaja;
DROP TABLE IF EXISTS korisnik;
DROP TABLE IF EXISTS vrsta_pojave;
DROP TABLE IF EXISTS regija;
DROP TABLE IF EXISTS uloga;
-- PostGIS ekstenzija namjerno ostaje (može je koristiti i nešto drugo u bazi)
