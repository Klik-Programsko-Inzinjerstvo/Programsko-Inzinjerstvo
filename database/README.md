# Baza podataka

PostgreSQL + PostGIS: migracije, testni podaci i upiti koje koristi backend.
Opis modela i ER dijagram: [docs/model-podataka.md](../docs/model-podataka.md).

```
database/
├── migrations/     # SQL migracije (node-pg-migrate), izvršavaju se redom
├── seed/seed.sql   # testni podaci
├── seed/demo.sql   # demo podaci za javnu bazu (ništa ne briše)
├── scripts/        # seed skripta
└── src/            # pool konekcija i upiti za backend
```

## Pokretanje

1. Instaliraj ovisnosti:
   ```bash
   cd database
   npm install
   ```
2. Kopiraj `.env.example` u `.env` i upiši adresu baze u `DATABASE_URL`.
   Za Supabase: **Connect → Session pooler** (ne „Direct connection“, ona radi samo preko IPv6).
   Datoteka `.env` se ne commita.
3. Napravi tablice:
   ```bash
   npm run migrate up
   ```
4. Upiši testne podatke (**briše** postojeće korisnike, postaje, mjerenja, upozorenja i prijave):
   ```bash
   npm run seed
   ```
   Za javnu bazu (Render) postoji `seed/demo.sql`: dodaje prognozu, upozorenja i nekoliko prijava,
   a stvarne postaje i mjerenja s DHMZ-a ne dira. Pokreće se ručno, npr. u Supabaseu → *SQL Editor*.

Ostale naredbe:

| Naredba | Što radi |
|---|---|
| `npm run migrate down` | poništava zadnju migraciju |
| `npm run migrate create naziv-promjene` | stvara novu praznu SQL migraciju |

Već izvršenu migraciju se ne mijenja; svaka promjena sheme ide u novu migraciju.

## Korištenje iz backenda

```js
const db = require('../database/src');

const postaje = await db.zadnjaMjerenja();
const prijave = await db.prijave({ samoPotvrdene: true, vrsta: 'tuca' });
const uKrugu = await db.prijave({ lat: 45.31, lng: 18.41, radijusKm: 20 });
const nova = await db.spremiPrijavu({ korisnikId, vrsta: 'tuca', lat, lng, vrijemeOpazanja, slike: [url] });
const korisnik = await db.korisnikIzGooglea({ sub, email, ime, slika }); // nakon Google prijave
```

| Funkcija | Zahtjev |
|---|---|
| `zadnjaMjerenja()` | posljednje mjerenje sa svake postaje (karta) |
| `najblizaPostaja(lat, lng)` | najbliža postaja s udaljenošću u km |
| `mjerenjeUTrenutku(lat, lng, vrijeme)` | službeno mjerenje uz prijavu (FZ-06) |
| `aktivnaUpozorenja()` | upozorenja koja trenutno vrijede |
| `prognoze(regijaId?)` | prognoza od danas nadalje |
| `spremiMjerenjaDhmz({ vrijeme, postaje })` | uvoz trenutačnih podataka s DHMZ-a svakih 30 min (FZ-03) |
| `vrstePojava()`, `regije()` | šifrarnici za obrazac prijave i odabir regije |
| `prijave({ ...filtri })` | prijave za kartu: vrsta, razdoblje, krug oko točke, samo potvrđene |
| `prijava(id)`, `prijaveKorisnika(id)` | jedna prijava, prijave korisnika |
| `spremiPrijavu({...})` | nova prijava sa slikama (FZ-06) |
| `korisnikIzGooglea({...})`, `korisnik(id)`, `korisnici()` | prijava preko Googlea (FZ-02), profil, popis korisnika |

Koordinate se uvijek predaju kao `(lat, lng)`.
