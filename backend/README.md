# Backend

Node.js 24 + Express 5. Poslužitelj iscrtava frontendove stranice iz [`server/views`](../server/views),
podatke čita i sprema preko upita iz [`database/src`](../database/src), korisnike prijavljuje
Google računom (OpenID Connect) i svakih 30 minuta preuzima mjerenja s DHMZ-a.

```
backend/
├── src/
│   ├── server.js        # pokretanje: postavke, prijava, uvoz s DHMZ-a, slušanje na portu
│   ├── app.js           # Express aplikacija (sesija, rute, greške)
│   ├── konfig.js        # varijable okoline
│   ├── auth.js          # Google OpenID Connect (authorization code + PKCE)
│   ├── ovlasti.js       # učitavanje korisnika, provjera prijave i uloga
│   ├── dhmz.js          # preuzimanje i čitanje DHMZ XML-a
│   ├── validacija.js    # provjera obrasca nove prijave
│   ├── slike.js         # spremanje fotografija na Cloudinary
│   ├── prikaz.js        # retci iz baze -> oblik koji očekuju predlošci
│   ├── vrijeme.js       # zagrebačka vremenska zona
│   └── rute/            # javno, autentifikacija, prijave, primjeri
└── test/                # node:test + supertest
```

## Što radi (prvi ciklus)

| Zahtjev | Stanje |
|---|---|
| FZ-01 pregled bez prijave | karta s mjernim postajama i potvrđenim prijavama, upozorenja, prognoza |
| FZ-02 prijava i registracija | Google OpenID Connect; prva prijava otvara račun s potvrđenom e-poštom |
| FZ-03 podaci DHMZ-a | `vrijeme.hr/hrvatska_n.xml` svakih 30 min u bazu; prikazuje se vrijeme zadnjeg mjerenja |
| FZ-06 prijava nevremena | obrazac (vrsta, vrijeme, veličina zrna, šteta, lokacija GPS/karta, fotografije, opis), provjera na poslužitelju, spremanje u bazu; stranica prijave prikazuje službeno mjerenje najbliže postaje |
| NFZ-04 sigurnost | uloge se provjeravaju na poslužitelju (401/403), kolačić sesije `httpOnly` + `SameSite=Lax` + `Secure`, parametrizirani SQL upiti, escapeanje korisničkog sadržaja, tajne samo u varijablama okoline |

## Lokalno pokretanje

Potrebno: Node.js 24 i PostgreSQL baza s PostGIS-om (npr. ista Supabase baza ili lokalna).

```bash
npm run build                       # u korijenu repozitorija: instalira database/ i backend/
cp backend/.env.example backend/.env  # upiši DATABASE_URL, a za Google prijavu GOOGLE_CLIENT_ID i GOOGLE_CLIENT_SECRET
npm run migrate                     # tablice (jednom; već izvršene migracije se preskaču)
npm run seed --prefix database      # neobavezno: testni podaci (BRIŠE korisnike i prijave!)
npm start                           # http://localhost:3000
```

Za isprobavanje uloga bez Googlea u `backend/.env` postavi `DEMO_PRIJAVA=true`: na stranici
*Prijava* pojavit će se brza prijava kao bilo koji korisnik iz baze (npr. `admin`, `mod_slavonija`).
U produkciji (`NODE_ENV=production`) ta mogućnost ne postoji.

### Ispitivanje

```bash
npm test                            # u korijenu ili u backend/
```

Testovi rute ispituju kroz cijelu Express aplikaciju s lažnom bazom i lažnim Googleom, pa ne
trebaju bazu ni internet. Integracijski test nad pravom bazom pokreće se samo uz posebnu,
**testnu** bazu: `TEST_DATABASE_URL=postgresql://... npm test`.

## Postavljanje na Render

Aplikacija je jedan Render web servis (besplatni plan), a baza je na Supabaseu.

### 1. Google OAuth klijent

1. [console.cloud.google.com](https://console.cloud.google.com) → novi projekt *StormWatch*.
2. **APIs & Services → OAuth consent screen**: tip *External*, naziv aplikacije, e-pošta za podršku.
   Opsezi: `openid`, `email`, `profile`. Zatim **Publish app** (za ove osnovne opsege Google ne traži
   provjeru); dok je aplikacija u načinu *Testing*, prijaviti se mogu samo korisnici dodani kao *Test users*.
3. **Credentials → Create credentials → OAuth client ID → Web application**.
   *Authorized redirect URIs*:
   - `http://localhost:3000/auth/google/povratak`
   - `https://<ime-servisa>.onrender.com/auth/google/povratak` (dodaj kad Render dodijeli adresu)
4. Spremi *Client ID* i *Client secret*.

### 2. Render servis

1. [dashboard.render.com](https://dashboard.render.com) → prijava GitHub računom → dopusti pristup
   organizaciji *Klik-Programsko-Inzinjerstvo*.
2. **New → Blueprint** → odaberi ovaj repozitorij. Render čita [`render.yaml`](../render.yaml).
3. Upiši vrijednosti koje traži:
   - `DATABASE_URL` – Supabase → *Connect* → *Session pooler*
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` – iz koraka 1
   - `CLOUDINARY_URL` – neobavezno (bez njega prijave nemaju fotografija)
   `SESSION_SECRET` Render stvara sam.
4. Nakon prvog deploya adresa servisa (npr. `https://stormwatch-ab12.onrender.com`) dodaje se u
   Google *Authorized redirect URIs* (korak 1.3). Aplikacija svoju adresu čita iz `RENDER_EXTERNAL_URL`.
5. Provjera: `https://<adresa>/zdravlje` vraća `{"status":"ok","baza":true}`.

Svaki push na glavnu granu ponovno pokreće deploy. Pri pokretanju se izvršavaju nove migracije.

## Poznati nedostaci

- Potvrde i osporavanja, komentari, događaji, obavijesti, omiljene lokacije i statistika
  još nemaju tablice u bazi. Te stranice prikazuju primjer podatke
  (`server/data/mock.js`) uz vidljivu napomenu, a prava pristupa već se provjeravaju.
- Moderacija (potvrda i odbijanje prijava) radi nad bazom, ali moderator zasad vidi prijave iz svih
  regija jer baza još ne pamti za koje je regije moderator zadužen. Brisanje prijava i upozorenja
  korisnicima još ne postoje.
- Administracija prikazuje stvarne korisnike iz baze, ali promjena uloge i deaktivacija se još ne spremaju.
- Prognoza prikazuje samo regiju *Zagreb i okolica* jer stranica još nema odabir regije
  (backend već prima `?regija=Slavonija`).
- Profil prikazuje samo ulogu; podaci s Google računa i popis vlastitih prijava još se ne prikazuju.
- S DHMZ-a se preuzimaju samo trenutačna mjerenja. Prognoza i upozorenja u bazi su testni podaci
  iz `database/seed/seed.sql`.
- Nove prijave vide se tek nakon osvježavanja stranice; WebSocket (NFZ-02) dolazi u idućem ciklusu.
- Besplatni Render servis spava nakon 15 minuta bez prometa: prvo otvaranje traje do minute,
  a uvoz s DHMZ-a radi samo dok servis radi (pokreće se i odmah pri buđenju).
- Uređivanje profila (fotografija, opis) još se ne sprema.
- Regija nove mjerne postaje određuje se tablicom u `src/dhmz.js`, a za postaju koje nema u tablici
  uzima se regija najbliže postaje.
