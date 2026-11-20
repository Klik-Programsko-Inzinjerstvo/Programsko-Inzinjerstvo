# A. Pregled aktivnosti grupe

## A.1 Evidencija sastanaka

**Kratice članova tima:**  
`DB = Domagoj Beus`
`GB = Gabrijel Buće`
`BC = Bartol Crnjak`
`LČ = Lorena Čvek`
`NH = Niko Hunski`
`LP = Leon Pastuović`
`BP = Bartol Perić`

| Datum i sudionici | Glavna tema | Donesena odluka ili zadatak | Poveznica na zadatak ili rezultat |
|---|---|---|---|
| 4.11.2026; SVI | Analiza zahtjeva i definiranje funkcionalnosti, arhitektura i oblikovanje sustava | Dogovoreni su osnovni zahtjevi, korisničke uloge i glavne funkcionalnosti aplikacije. Odabran je monolitni MVC pristup te definirani glavni moduli | GitHub repozitorij |

## A.2 Plan rada

| Razdoblje / faza | Glavni planirani rad | Odgovorni članovi | Poveznica na zadatke |
|---|---|---|---|
| Analiza zahtjeva | Definiranje funkcijskih i nefunkcijskih zahtjeva, aktera i obrazaca uporabe. | NH, BC | Dokument Analiza zahtjeva |
| Arhitektura i dizajn | Izrada arhitekture, modela baze podataka i UML dijagrama. | NH, BC | Dokument Arhitektura i oblikovanje |
| Implementacija backenda | Izrada autentifikacije, prijava, događaja, glasovanja, komentara i moderacije. | NH, BC i BP | GitHub – backend |
| Korisničko sučelje | Izrada stranica, karte, filtara i obrazaca za prijavu nevremena. | GB i LČ | GitHub repozitorij |
| Ispitivanje i integracija | Provjera funkcionalnosti, sigurnosti i ispravnosti rada s bazom podataka. | NH, BC, BP | Testovi projekta |
| Dokumentacija i završna predaja | Izrada tehničke dokumentacije, dijagrama i završna provjera projekta. | LP, DB | Projektna dokumentacija |

## A.3 Aktivnosti i doprinosi članova

| Aktivnost ili rezultat | Član | Prijavljeni sati | Reprezentativni rezultat ili poveznica |
|---|---|---|---|
| Analiza zahtjeva i definiranje obrazaca uporabe | NH, BC | 3 | Dokument Analiza zahtjeva |
| Projektiranje arhitekture i baze podataka | NH, BC, BP  | 3 | Arhitekturni i ER dijagram |
| Implementacija autentifikacije i korisničkih sesija | NH, BC | 2 | `backend/src/auth.js` |
| Implementacija prijava, događaja i poslovnih pravila | NH, BC, BP | 4 | `backend/src/*` |
| Implementacija moderacije i upravljanja ulogama | NH, BC | 1 | Rute moderacije i administracije |
| Izrada korisničkog sučelja i karte | GB i LČ | 5 | `server/views/`, `server/public/` |

## A.4 Pregled promjena u repozitoriju

**Prikaz aktivnosti repozitorija:** [GitHub Contributors](https://github.com/Klik-Programsko-Inzinjerstvo/Programsko-Inzinjerstvo/graphs/contributors).

Za pregled promjena backend dijela dostupan je i [pregled commitova grane 7-backend](https://github.com/Klik-Programsko-Inzinjerstvo/Programsko-Inzinjerstvo/commits/7-backend/).

GitHubov graf doprinositelja prikazuje aktivnost članova kroz zapise promjena u repozitoriju. Broj commitova ne predstavlja količinu uloženog rada jer ne obuhvaća sve aktivnosti, kao što su projektiranja, sastanci, ispitivanja i dokumentiranja.

## A.5 Ključni inženjerski izazovi i rješenja

| Izazov | Poduzeta radnja | Ishod ili preostalo ograničenje |
|---|---|---|
| Integracija Google autentifikacije | Implementiran je OAuth 2.0 / OpenID Connect putem Passport strategije. Korisnici se identificiraju pomoću `google_sub`, a sesije se pohranjuju u PostgreSQL. | Omogućena je prijava Google računom i upravljanje korisničkim sesijama. |
| Validacija prijava nevremena | Poslovna pravila izdvojena su u funkcije modula `domain.js`, uključujući provjeru lokacije, vremena i obaveznih podataka. | Prijave se provjeravaju prije spremanja u bazu. |
| Grupiranje prijava u događaje | Implementirano je pronalaženje događaja iste vrste unutar 15 km i 3 sata, uz odabir najbližeg događaja ili stvaranje novog. | Omogućeno je povezivanje prostornih i vremenski bliskih prijava u zajedničke događaje. |
| Dosljednost moderacije i reputacije | Promjena statusa prijave i reputacijskih bodova povezana je u atomarni SQL upit. | Smanjen je rizik od neusklađenosti statusa prijave i bodova autora. |
| Sigurnost aplikacije | Uvedene su provjere korisničkih uloga, parametrizirani SQL upiti, sigurno rukovanje sesijama i automatsko escapiranje izlaza u EJS predlošcima. | Osigurana je osnovna zaštita od neovlaštenog pristupa, SQL injectiona i XSS-a. |
| Ograničenja sigurnosne zaštite | Identificirani su nedostatak CSRF tokena, ograničenja broja zahtjeva i sigurnosnih HTTP zaglavlja. | Navedene mjere ostaju preporučene nadogradnje prije stvarne produkcijske uporabe. |
| Usklađivanje funkcionalnih zahtjeva i implementacije | Uspoređeni su zahtjevi za moderaciju po regijama s implementacijom prve inačice. | U prvoj inačici moderatori pregledavaju prijave svih regija, što predstavlja poznato odstupanje od zahtjeva. |
