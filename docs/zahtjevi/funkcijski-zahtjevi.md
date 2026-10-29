# Funkcijski zahtjevi

Funkcijski zahtjevi opisuju **što** sustav StormWatch mora raditi. Izvedeni su iz projektnog zadatka (M. Matjanec, *StormWatch*, listopad 2026.) i usklađeni s M0 prezentacijom tima.

**Prioritet:** `Visok` – nužno za osnovnu funkcionalnost · `Srednji` – važno, ali sustav radi i bez toga · `Nizak` – poželjno

## Dionici i akteri

| Akter | Opis |
|---|---|
| Neregistrirani korisnik | Pregledava vrijeme, prognozu, upozorenja i javnu kartu potvrđenih prijava. |
| Registrirani korisnik | Prijavljuje nevremena, komentira, potvrđuje i osporava prijave, prati korisnike i lokacije. |
| Pouzdani motritelj | Registrirani korisnik s dovoljno reputacije; prijave mu ne prolaze moderaciju, potvrde imaju veću težinu. |
| Moderator | Zadužen za regiju; potvrđuje, odbija i briše prijave i prijavljeni sadržaj, upozorava korisnike. |
| Meteorolog | Objavljuje stručne komentare uz događaje i označava stručno vrijedne prijave. |
| Administrator | Upravlja korisnicima i ulogama, postavkama preuzimanja DHMZ podataka i statistikom korištenja. |
| DHMZ (vanjski sustav) | Izvor službenih podataka u XML formatu. |
| Google (vanjski sustav) | Pružatelj identiteta (OAuth 2.0 / OpenID Connect). |
| OpenStreetMap (vanjski sustav) | Kartografska podloga. |
| Servis e-pošte (vanjski sustav) | Slanje obavijesti e-poštom. |

## Pregled

| Oznaka | Naziv | Akter | Prioritet |
|---|---|---|---|
| FZ-01 | Pregled vremena i karte bez prijave | svi korisnici | Visok |
| FZ-02 | Registracija i prijava preko Googlea (OAuth 2.0) | neregistrirani korisnik | Visok |
| FZ-03 | Periodičko preuzimanje DHMZ podataka | sustav | Visok |
| FZ-04 | Slojevi karte i filtri | svi korisnici | Visok |
| FZ-05 | Profil i omiljene lokacije | registrirani korisnik | Srednji |
| FZ-06 | Prijava nevremena | registrirani korisnik | Visok |
| FZ-07 | Komentari, potvrde i osporavanja | registrirani korisnik | Visok |
| FZ-08 | Ocjena vjerodostojnosti i reputacija | sustav | Visok |
| FZ-09 | Grupiranje prijava u događaj | sustav | Srednji |
| FZ-10 | Praćenje i obavijesti | registrirani korisnik | Srednji |
| FZ-11 | Moderacija prijava po regijama | moderator | Visok |
| FZ-12 | Uloga pouzdanog motritelja | moderator, sustav | Srednji |
| FZ-13 | Stručni komentar meteorologa | meteorolog | Srednji |
| FZ-14 | Statistika i izvoz u CSV | svi korisnici | Nizak |
| FZ-15 | Upravljanje korisnicima i ulogama | administrator | Visok |

---

## Podaci i karta

### FZ-01 Pregled vremena i karte bez prijave
**Akter:** svi korisnici · **Prioritet:** Visok

Sustav neregistriranom korisniku omogućuje pregled trenutačnih vremenskih uvjeta, prognoza, aktivnih upozorenja i javne karte potvrđenih prijava. Sve ostale funkcionalnosti zahtijevaju prijavu u sustav.

**Kriteriji prihvaćanja**
- Početna stranica i karta dostupni su bez prijave.
- Neprijavljeni korisnik na karti vidi samo prijave u stanju *potvrđena*.
- Pokušaj pristupa zaštićenoj funkcionalnosti (npr. nova prijava, komentar) preusmjerava na prijavu.

### FZ-02 Registracija i prijava preko Googlea (OAuth 2.0)
**Akter:** neregistrirani korisnik · **Prioritet:** Visok

Korisnik se registrira unosom osnovnih podataka potrebnih za rad aplikacije i važeće adrese e-pošte. Autentifikacija se provodi preko vanjskog pružatelja identiteta (Google, OpenID Connect), a autorizacija unutar aplikacije preko OAuth 2.0 tokena.

**Kriteriji prihvaćanja**
- Pri prvoj prijavi automatski se stvara korisnički račun s ulogom *registrirani korisnik*.
- Adresa e-pošte preuzima se od pružatelja identiteta i mora biti potvrđena.
- Svaki zaštićeni zahtjev prema poslužitelju nosi važeći token; istekao ili neispravan token odbija se.
- Korisnik se može odjaviti.

> ⚠️ **Otvoreno pitanje:** projektni zadatak u „Ostalim zahtjevima” spominje pristup *korisničkim imenom i lozinkom*. Treba potvrditi s asistentom je li dovoljna prijava preko Googlea.

### FZ-03 Periodičko preuzimanje DHMZ podataka
**Akter:** sustav · **Prioritet:** Visok

Sustav periodički (zadano svakih 30 minuta) preuzima javno dostupne XML podatke DHMZ-a (trenutačna mjerenja s postaja, prognoze, upozorenja) i pohranjuje ih u vlastitu bazu, tako da aplikacija radi i kad vanjski izvor nije dostupan.

**Kriteriji prihvaćanja**
- Interval preuzimanja podesiv je bez promjene koda (FZ-15).
- Neuspjelo preuzimanje se bilježi i ne briše postojeće podatke; prikazuju se zadnji uspješno preuzeti podaci s vremenom ažuriranja.
- Pohranjuju se povijesna mjerenja kako bi se uz prijavu mogla prikazati mjerenja u trenutku opažanja (FZ-06).

### FZ-04 Slojevi karte i filtri
**Akter:** svi korisnici · **Prioritet:** Visok

Na interaktivnoj karti (OpenStreetMap) korisnik uključuje i isključuje slojeve:
- mjerne postaje s posljednjim mjerenjima (temperatura, vlažnost, tlak, smjer i brzina vjetra),
- aktivna upozorenja po regijama,
- prijave korisnika, filtrirane po vrsti pojave i vremenskom razdoblju.

**Kriteriji prihvaćanja**
- Svaki sloj može se zasebno uključiti i isključiti.
- Klik na postaju, upozorenje ili prijavu prikazuje detalje.
- Filtri po vrsti pojave i vremenskom razdoblju odmah mijenjaju prikaz prijava.
- Potvrđene prijave vizualno su istaknute.

### FZ-05 Profil i omiljene lokacije
**Akter:** registrirani korisnik · **Prioritet:** Srednji

Korisnik uređuje profil (fotografija, kratak opis) i odabire jednu ili više omiljenih lokacija. Na pregledu **„Lokacije”** za svaku omiljenu lokaciju prikazuju se trenutačni uvjeti s najbliže mjerne postaje, prognoza i aktivna upozorenja.

**Kriteriji prihvaćanja**
- Korisnik može dodati, preimenovati i ukloniti omiljenu lokaciju.
- Najbliža postaja određuje se prostornim upitom (udaljenost).
- Profil drugih korisnika (fotografija, opis, reputacija, prijave) javno je vidljiv registriranim korisnicima.

---

## Prijave i zajednica

### FZ-06 Prijava nevremena
**Akter:** registrirani korisnik · **Prioritet:** Visok

Korisnik prijavljuje opažanje nevremena i navodi:
- vrstu pojave (tuča, olujni vjetar, jaka kiša i poplava, snijeg, poledica, pijavica i sl.),
- lokaciju (automatski putem GPS-a ili odabirom na karti),
- vrijeme opažanja,
- intenzitet (za tuču veličina zrna: grašak, lješnjak, orah, jaje),
- procjenu štete,
- jednu ili više fotografija,
- dodatni opis (neobavezno).

Uz svaku prijavu prikazuju se službena mjerenja s najbliže postaje u trenutku opažanja. Korisnik svoje prijave vidi na pregledu **„Prijave”**.

**Kriteriji prihvaćanja**
- Bez obaveznih polja prijava se ne može predati; sustav javlja grešku.
- Fotografije se pohranjuju izvan baze; prevelike ili neispravne datoteke se odbijaju.
- Ako GPS nije dostupan, korisnik bira lokaciju na karti.
- Korisnik s privremenom zabranom objave ne može predati prijavu.

### FZ-07 Komentari, potvrde i osporavanja
**Akter:** registrirani korisnik · **Prioritet:** Visok

Prijave su vidljive ostalim korisnicima, koji ih mogu komentirati, potvrditi („I ja to vidim”) ili osporiti („Kod mene nije tako”). Neprimjeren ili lažan sadržaj korisnici mogu prijaviti moderatorima.

**Kriteriji prihvaćanja**
- Korisnik ne može glasati za vlastitu prijavu.
- Svaki korisnik ima najviše jedan glas po prijavi; ponovni glas mijenja prethodni.
- Odbijene prijave nisu vidljive i za njih se ne može glasati.
- Prijava sadržaja moderatoru sadrži razlog.

### FZ-08 Ocjena vjerodostojnosti i reputacija
**Akter:** sustav · **Prioritet:** Visok

Na temelju potvrda i osporavanja sustav izračunava ocjenu vjerodostojnosti prijave. Korisnici skupljaju bodove reputacije: potvrđene prijave donose bodove, a osporene ih oduzimaju. Potvrda pouzdanog motritelja ima veću težinu.

**Kriteriji prihvaćanja**
- Ocjena se ponovno izračunava pri svakom novom ili promijenjenom glasu.
- Reputacija autora mijenja se pri potvrdi prijave od strane moderatora te pri potvrdama i osporavanjima.
- Ocjena i reputacija prikazuju se uz prijavu, odnosno na profilu.

> ⚠️ **Otvoreno pitanje:** točnu formulu ocjene i težinske faktore određuje tim (dokumentirati u arhitekturi).

### FZ-09 Grupiranje prijava u događaj
**Akter:** sustav · **Prioritet:** Srednji

Više prijava iste vrste koje su prostorno i vremenski bliske sustav grupira u jedan događaj (npr. „Tuča, Đakovo, 14. 7. 2026.”) sa zajedničkom stranicom na kojoj su prikazane sve prijave, fotografije i rasprava.

**Kriteriji prihvaćanja**
- Nova prijava pridružuje se postojećem događaju ako je unutar zadanog radijusa i vremenskog prozora, inače stvara novi događaj.
- Naziv događaja generira se iz vrste pojave, najbližeg mjesta i datuma.
- Radijus i vremenski prozor su konfigurabilni.

> ⚠️ **Otvoreno pitanje:** zadane vrijednosti radijusa i vremenskog prozora (prijedlog: 10 km, 2 h).

### FZ-10 Praćenje i obavijesti
**Akter:** registrirani korisnik · **Prioritet:** Srednji

Korisnik postavlja vlastite obavijesti, npr. kada DHMZ izda upozorenje narančaste ili crvene razine za njegovu regiju ili kada se u zadanom krugu oko njegove lokacije pojavi potvrđena prijava tuče. Korisnik može pratiti druge korisnike ili lokacije i dobivati obavijesti o njihovim novim prijavama. Obavijesti se prikazuju u aplikaciji (oznaka na pregledu **„Obavijesti”**) i šalju e-poštom.

**Kriteriji prihvaćanja**
- Korisnik može uključiti, isključiti i urediti svako pravilo obavijesti.
- Nepročitane obavijesti označene su brojem na pregledu „Obavijesti”.
- Korisnik može isključiti slanje e-pošte.

---

## Uloge i upravljanje

### FZ-11 Moderacija prijava po regijama
**Akter:** moderator · **Prioritet:** Visok

Svaka prijava prolazi kroz stanja **predana → na čekanju → potvrđena / odbijena**. Moderatori su zaduženi za pojedine regije (npr. Dalmacija, Slavonija, Istra). Na pregledu **„Moderacija”** vide prijave na čekanju i prijavljeni sadržaj iz svoje regije te ih mogu potvrditi, odbiti uz obrazloženje ili izbrisati. Korisnicima koji krše pravila mogu uputiti upozorenje ili im privremeno onemogućiti objavljivanje.

**Kriteriji prihvaćanja**
- Moderator vidi i obrađuje samo sadržaj iz svojih regija.
- Odbijanje zahtijeva obrazloženje; odbijena prijava nije vidljiva drugim korisnicima.
- Potvrđena prijava dobiva oznaku i istaknuta je na karti.
- Privremena zabrana objave ima datum isteka.

### FZ-12 Uloga pouzdanog motritelja
**Akter:** moderator, sustav · **Prioritet:** Srednji

Korisniku koji dosegne zadani prag reputacije moderator može dodijeliti ulogu pouzdanog motritelja. Prijave pouzdanih motritelja ne prolaze moderaciju, označene su posebnom oznakom, a njihova potvrda tuđe prijave ima veću težinu.

**Kriteriji prihvaćanja**
- Moderator vidi popis korisnika koji su dosegli prag.
- Uloga se može dodijeliti samo korisniku iznad praga i može se oduzeti.
- Prijava pouzdanog motritelja odmah prelazi u stanje *potvrđena*.

> ⚠️ **Otvoreno pitanje:** vrijednost praga reputacije (konfigurabilna od strane administratora).

### FZ-13 Stručni komentar meteorologa
**Akter:** meteorolog · **Prioritet:** Srednji

Meteorolog uz pojedini događaj objavljuje stručni komentar (npr. o smjeru kretanja olujne ćelije) koji se svim korisnicima ističe na vrhu stranice događaja te označava prijave posebno vrijedne za stručnu analizu.

**Kriteriji prihvaćanja**
- Stručni komentar prikazuje se iznad ostalih komentara i vizualno se razlikuje.
- Označene prijave imaju vidljivu oznaku na stranici događaja.

### FZ-14 Statistika i izvoz u CSV
**Akter:** svi korisnici · **Prioritet:** Nizak

Na pregledu **„Statistika”** korisnici pregledavaju arhivu prošlih događaja i grafički prikaz učestalosti pojava po regijama i mjesecima te mogu izvesti podatke u CSV formatu.

**Kriteriji prihvaćanja**
- Arhiva se može filtrirati po vrsti pojave, regiji i razdoblju.
- Izvezena CSV datoteka sadrži iste podatke kao trenutačni filtrirani prikaz.

### FZ-15 Upravljanje korisnicima i ulogama
**Akter:** administrator · **Prioritet:** Visok

Administrator upravlja korisnicima i dodjeljuje im uloge (moderator s regijom, meteorolog), podešava parametre preuzimanja podataka s DHMZ-a te pregledava statistiku korištenja sustava. U slučaju težeg kršenja pravila može brisati sadržaj i deaktivirati korisničke račune.

**Kriteriji prihvaćanja**
- Administrator može pretraživati korisnike i mijenjati im uloge.
- Deaktivirani korisnik ne može se prijaviti u sustav.
- Promjena intervala preuzimanja DHMZ podataka primjenjuje se bez ponovnog pokretanja aplikacije.
