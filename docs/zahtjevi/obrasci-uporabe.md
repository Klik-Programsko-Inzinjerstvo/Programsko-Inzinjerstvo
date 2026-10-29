# Obrasci uporabe

10 obrazaca uporabe, od kojih su 3 ključna.

| Oznaka | Obrazac uporabe | Akter | Zahtjevi |
|---|---|---|---|
| UC-01 | Pregled vremena, prognoze i karte | svi korisnici | FZ-01, FZ-04 |
| UC-02 | Registracija i prijava (OAuth 2.0) | neregistrirani korisnik | FZ-02 |
| **UC-03** | **Prijava nevremena** (ključni) | registrirani korisnik | FZ-06, FZ-09 |
| **UC-04** | **Potvrda ili osporavanje prijave** (ključni) | registrirani korisnik | FZ-07, FZ-08 |
| UC-05 | Postavljanje obavijesti i omiljenih lokacija | registrirani korisnik | FZ-05, FZ-10 |
| **UC-06** | **Moderacija prijava u regiji** (ključni) | moderator | FZ-11 |
| UC-07 | Stručni komentar događaja | meteorolog | FZ-13 |
| UC-08 | Pregled statistike i izvoz u CSV | svi korisnici | FZ-14 |
| UC-09 | Upravljanje korisnicima i ulogama | administrator | FZ-15 |
| UC-10 | Preuzimanje podataka DHMZ-a | sustav (svakih 30 min) | FZ-03 |

---

## UC-03 Prijava nevremena

- **Akter:** registrirani korisnik
- **Preduvjet:** korisnik je prijavljen i nema zabranu objave
- **Rezultat:** prijava je spremljena i čeka moderaciju

**Glavni scenarij**
1. Korisnik otvara „Nova prijava”.
2. Sustav uzima lokaciju preko GPS-a.
3. Korisnik bira vrstu pojave, vrijeme i intenzitet.
4. Korisnik dodaje procjenu štete, fotografije i opis.
5. Sustav sprema prijavu i prikazuje mjerenja najbliže postaje.
6. Prijava ide na moderaciju (stanje „na čekanju”).
7. Sustav je spaja s bliskim prijavama u događaj.

**Alternativni scenariji**
- **2a** GPS nije dostupan ili je odbijen — korisnik bira lokaciju na karti.
- **4a** Nedostaje obavezno polje ili je slika prevelika — sustav javlja grešku i prijava se ne šalje.
- **6a** Autor je pouzdani motritelj — prijava preskače moderaciju i dobiva posebnu oznaku.

## UC-04 Potvrda ili osporavanje prijave

- **Akter:** registrirani korisnik
- **Preduvjet:** prijava nije odbijena, korisnik nije njezin autor
- **Rezultat:** nova ocjena vjerodostojnosti i reputacija autora

**Glavni scenarij**
1. Korisnik otvara prijavu ili stranicu događaja.
2. Odabire „I ja to vidim” ili „Kod mene nije tako”.
3. Po želji dodaje komentar.
4. Sustav sprema glas i ponovno računa ocjenu vjerodostojnosti.
5. Sustav mijenja bodove reputacije autora.
6. Ostali korisnici odmah vide novu ocjenu i komentar.

**Alternativni scenariji**
- **2a** Korisnik nije prijavljen — sustav ga šalje na prijavu.
- **2b** Korisnik je već glasao — sustav mijenja stari glas umjesto da doda novi.
- **4a** Glasa pouzdani motritelj — njegova potvrda ima veću težinu u ocjeni.

## UC-06 Moderacija prijava u regiji

- **Akter:** moderator
- **Preduvjet:** moderator je zadužen za regiju prijave
- **Rezultat:** prijava je potvrđena, odbijena ili izbrisana

**Glavni scenarij**
1. Moderator otvara pregled „Moderacija”.
2. Sustav prikazuje prijave na čekanju i prijavljeni sadržaj iz njegove regije.
3. Moderator pregledava prijavu, slike i mjerenja postaje.
4. Moderator potvrđuje prijavu.
5. Sustav mijenja stanje u „potvrđena” i ističe prijavu na karti.
6. Autor dobiva bodove reputacije.

**Alternativni scenariji**
- **2a** Nema ničega na čekanju — sustav prikazuje praznu listu.
- **4a** Prijava je netočna — moderator je odbija uz obrazloženje i ona više nije vidljiva.
- **4b** Sadržaj je neprimjeren — moderator ga briše i autoru šalje upozorenje ili privremenu zabranu objave.
