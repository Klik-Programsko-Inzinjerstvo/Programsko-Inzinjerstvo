# Model podataka

Baza je **PostgreSQL** s ekstenzijom **PostGIS** za prostorne podatke. Shema je u
[`database/migrations/`](../database/migrations/), a ovaj dokument opisuje stanje
nakon migracije `pocetna-shema` (prva predaja).

Opseg prve predaje pokriva FZ-01 do FZ-04 i FZ-06: korisnike i uloge, podatke DHMZ-a
i prijave nevremena. Tablice za potvrde, komentare, događaje, praćenja i obavijesti
(FZ-07 do FZ-14) dodaju se u idućim migracijama.

## ER dijagram

```mermaid
erDiagram
    uloga ||--o{ korisnik : "ima"
    korisnik ||--o{ prijava : "podnosi"
    vrsta_pojave ||--o{ prijava : "vrsta"
    regija ||--o{ prijava : "pripada"
    regija ||--o{ postaja : "nalazi se u"
    regija ||--o{ prognoza : "za"
    regija ||--o{ upozorenje : "za"
    postaja ||--o{ mjerenje : "bilježi"
    prijava ||--o{ slika : "sadrži"

    uloga {
        smallint id PK
        text kod UK
        text naziv
    }
    regija {
        smallint id PK
        text naziv UK
    }
    vrsta_pojave {
        smallint id PK
        text kod UK
        text naziv
    }
    korisnik {
        bigint id PK
        text google_sub UK "sub iz Google ID tokena"
        text email UK "jedinstven bez obzira na velika slova"
        text korisnicko_ime UK
        text ime_prikaza
        text slika_url
        text opis
        smallint uloga_id FK
        integer reputacija
        boolean aktivan
        timestamptz zabrana_objave_do
        timestamptz kreiran
        timestamptz zadnja_prijava
    }
    postaja {
        bigint id PK
        text dhmz_oznaka UK
        text ime
        smallint regija_id FK
        geography lokacija "Point, WGS84"
        integer nadmorska_visina
        boolean aktivna
    }
    mjerenje {
        bigint id PK
        bigint postaja_id FK
        timestamptz vrijeme "UK zajedno s postaja_id"
        numeric temperatura
        smallint vlaga
        numeric tlak
        text vjetar_smjer
        numeric vjetar_brzina
        timestamptz preuzeto
    }
    prognoza {
        bigint id PK
        smallint regija_id FK
        date datum "UK zajedno s regija_id"
        numeric temp_min
        numeric temp_max
        text opis
        text ikona
        timestamptz preuzeto
    }
    upozorenje {
        bigint id PK
        text dhmz_id UK
        smallint regija_id FK
        text razina "zuta, narancasta, crvena"
        text pojava
        text opis
        timestamptz vrijedi_od
        timestamptz vrijedi_do
        timestamptz preuzeto
    }
    prijava {
        bigint id PK
        bigint korisnik_id FK
        smallint vrsta_pojave_id FK
        smallint regija_id FK
        geography lokacija "Point, WGS84"
        text mjesto
        timestamptz vrijeme_opazanja
        text intenzitet
        text steta
        text opis
        text stanje "predana, na_cekanju, potvrdena, odbijena"
        text razlog_odbijanja
        smallint vjerodostojnost "0-100"
        timestamptz kreirana
        timestamptz azurirana
    }
    slika {
        bigint id PK
        bigint prijava_id FK
        text url "Cloudinary"
        text cloudinary_public_id
        smallint redoslijed
        timestamptz kreirana
    }
```

## Tablice

| Tablica | Namjena | Zahtjevi |
|---|---|---|
| `uloga` | Šifrarnik uloga: korisnik, pouzdani motritelj, moderator, meteorolog, administrator | FZ-12, FZ-15 |
| `regija` | Regije Hrvatske; određuju upozorenja, prognoze i nadležnost moderatora | FZ-04, FZ-11 |
| `vrsta_pojave` | Šifrarnik vrsta nevremena (tuča, olujni vjetar, jaka kiša...) | FZ-04, FZ-06 |
| `korisnik` | Korisnici prijavljeni preko Googlea, s ulogom, reputacijom i zabranama | FZ-02, FZ-05, FZ-08 |
| `postaja` | DHMZ mjerne postaje s lokacijom | FZ-01, FZ-03 |
| `mjerenje` | Mjerenja s postaja, uvoze se svakih 30 min | FZ-01, FZ-03 |
| `prognoza` | Prognoza po regiji i danu | FZ-01, FZ-03 |
| `upozorenje` | DHMZ upozorenja po regiji, s razinom i trajanjem | FZ-01, FZ-03 |
| `prijava` | Prijave nevremena s lokacijom, stanjem i ocjenom vjerodostojnosti | FZ-04, FZ-06, FZ-11 |
| `slika` | Poveznice na fotografije prijave (slike su na Cloudinaryju, ne u bazi) | FZ-06 |

Pogled `zadnje_mjerenje` vraća posljednje mjerenje za svaku aktivnu postaju (sloj postaja na karti).

## Važnije odluke

- **Lokacije** su tipa `geography(Point, 4326)` (WGS84, kao GPS i Leaflet) s GiST
  indeksom. Udaljenosti se računaju u metrima, a upiti „najbliža postaja“ (`<->`) i
  „prijave u krugu“ (`ST_DWithin`) koriste indeks.
- **Stanje prijave** i **razina upozorenja** ograničeni su `CHECK` ograničenjem, a vrste
  pojava i uloge su šifrarnici, pa se nova vrijednost dodaje bez promjene sheme.
- **Uvoz DHMZ podataka je idempotentan**: mjerenje je jedinstveno po (postaja, vrijeme),
  prognoza po (regija, datum), upozorenje po `dhmz_id`, pa ponovljeni uvoz ne stvara duplikate.
- **Regija prijave** postavlja se prema najbližoj mjernoj postaji. Po njoj se prijava
  dodjeljuje moderatoru.
- **Prijava pouzdanog motritelja** sprema se odmah kao `potvrdena` (ne prolazi moderaciju).
- **Korisnik** ima jednu ulogu. E-pošta je jedinstvena bez obzira na velika i mala slova.
  Testni korisnici nemaju `google_sub` i povezuju se s Google računom po e-pošti pri prvoj prijavi.
- **Slike** se ne spremaju u bazu; spremaju se samo URL i Cloudinary `public_id` (za brisanje).
