# 2. Analiza zahtjeva

## 2.1 Funkcijski zahtjevi

| ID | Naziv | Akter | Prioritet |
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

## 2.2 Nefunkcijski zahtjevi

| ID | Kategorija | Zahtjev |
|---|---|---|
| NFZ-01 | Upotrebljivost | Responzivnost |
| NFZ-02 | Performanse | Rad u stvarnom vremenu |
| NFZ-03 | Pouzdanost | Dostupnost neovisno o DHMZ-u |
| NFZ-04 | Sigurnost | Autentifikacija, autorizacija i zaštita podataka |
| NFZ-05 | Performanse | Brzina učitavanja |
| NFZ-06 | Pravna ograničenja | Navođenje izvora podataka |

## 2.3 Dionici i akteri

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

## 2.4 Ograničenja i pretpostavke


| ID | Tip | Opis ograničenja ili pretpostavke | Izvor | Inženjerska posljedica / Provjera |
|---|---|---|---|---|
| C-01 | Ograničenje | Prijava korisnika provodi se putem Google OAuth 2.0 / OpenID Connect. | FZ-02 | Potrebna je integracija s Google sustavom za autentifikaciju. |
| C-02 | Ograničenje | DHMZ je izvor službenih meteoroloških podataka u XML formatu. | FZ-03 | Sustav mora podržavati preuzimanje i obradu XML podataka. |
| C-03 | Ograničenje | Kartografska podloga temelji se na OpenStreetMapu. | --- | Potrebna je integracija s OpenStreetMap kartom i navođenje izvora. |
| C-04 | Ograničenje | Prijave se mogu odnositi samo na lokacije unutar Hrvatske, a vrijeme opažanja ne smije biti u budućnosti ni starije od 30 dana. | --- | Sustav provjerava lokaciju i vrijeme prilikom unosa prijave. |
| C-05 | Ograničenje | Pristup funkcionalnostima ovisi o korisničkoj ulozi. | FZ-11, FZ-12, FZ-15 | Potrebna je provjera ovlasti korisnika. |
| AS-01 | Pretpostavka | DHMZ redovito pruža dostupne XML podatke. | Projektna pretpostavka | Provjeriti dostupnost i strukturu podataka. |
| AS-02 | Pretpostavka | Korisnik prilikom prijave nevremena može odrediti lokaciju putem karte ili GPS-a. | --- | Provjeriti ispravnost dohvaćanja koordinata. |
| AS-03 | Pretpostavka | Google autentifikacijski servis dostupan je za prijavu korisnika. | FZ-02 | Provjeriti uspješnu i neuspješnu autentifikaciju. |
| AS-04 | Pretpostavka | Servis e-pošte dostupan je za slanje obavijesti korisnicima. | FZ-10 | Provjeriti mogućnost povezivanja sa servisom e-pošte. |

---

## 2.5 Značajne promjene zahtjeva

| Datum | ID zahtjeva | Promjena i razlog | Dogovoreno s / dokaz |
|---|---|---|---|
| — | — | U dosadašnjoj dokumentaciji nisu evidentirane značajne promjene zahtjeva. | Nije primjenjivo. |

---

## 2.6 Sljedivost zahtjeva

| ID zahtjeva | Obrazac uporabe / modul | Arhitekturna realizacija | Ispitivanje ili provjera |
|---|---|---|---|
| FZ-01 | UC1, UC5, UC6 | Modul karte i pregleda prijava | --- |
| FZ-02 | UC2, UC3 | Modul autentifikacije; Google OAuth 2.0 | --- |
| FZ-03 | Automatizirani proces sustava | Modul za dohvat DHMZ podataka | --- |
| FZ-04 | UC1 | Modul karte i filtara | --- |
| FZ-05 | --- | Modul korisničkog profila | --- |
| FZ-06 | UC4 | Modul prijave opažanja nevremena | --- |
| FZ-07 | UC7, UC8 | Modul komentara i glasovanja | --- |
| FZ-08 | UC4, UC7, UC9, UC10 | Modul ocjene vjerodostojnosti i reputacije | --- |
| FZ-09 | UC11 | Modul grupiranja prijava u događaje | --- |
| FZ-10 | --- | Modul praćenja i obavijesti | --- |
| FZ-11 | UC9 | Modul moderacije prijava | --- |
| FZ-12 | UC4, UC7, UC10 | Modul korisničkih uloga i pouzdanih motritelja | --- |
| FZ-13 | --- | Modul stručnih komentara meteorologa | --- |
| FZ-14 | --- | Modul statistike i izvoza podataka | --- |
| FZ-15 | UC10 | Modul administracije korisnika i uloga | --- |
| NFZ-01 | UC1–UC10 | Korisničko sučelje | Provjera responzivnosti na različitim uređajima. |
| NFZ-02 | UC1 | Modul karte i automatskog osvježavanja | Provjera osvježavanja karte svakih 20 sekundi. |
| NFZ-03 | FZ-03, automatizirani proces sustava | Modul dohvaćanja i pohrane meteoroloških podataka | Provjera rada aplikacije pri nedostupnosti DHMZ-a. |
| NFZ-04 | UC2, UC3, UC6, UC7, UC9, UC10 | Modul autentifikacije i autorizacije | Provjera prijave i pristupa prema korisničkim ulogama. |
| NFZ-05 | UC1–UC10 | Korisničko sučelje i pozadinski procesi | Provjera vremena učitavanja stranica. |
| NFZ-06 | UC1, FZ-03 | Modul prikaza karte i meteoroloških podataka | Provjera navođenja izvora podataka. |

---

## 2.7 Pregled zahtjeva

| Kontrolna točka | Povratna informacija ili nalaz | Odluka o zahtjevu ili opsegu |
|---|---|---|
| Iteracija 1 | --- | --- |
| Demo 2 | --- | --- |
| Završni pregled | --- | --- |
