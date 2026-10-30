# ⚡ StormWatch

> Službeni podaci DHMZ-a i prijave nevremena s terena, na jednoj karti.

Projekt iz kolegija **Programsko inženjerstvo** (FER, ak. god. 2026./2027.) · Grupa **G08** · Tim **Klik** · asistent Marin Matjanec

## O projektu

Konvektivna nevremena u Hrvatskoj (tuča, olujni vjetar, bujične poplave) često su lokalna: tuča može poharati jedno selo dok najbliža mjerna postaja zabilježi tek slabu kišu. StormWatch na jednom mjestu spaja **službene podatke DHMZ-a** (mjerenja, prognoze, upozorenja) i **prijave korisnika s terena**, koje zajednica, moderatori i meteorolozi provjeravaju, potvrđuju i komentiraju.

## Dokumentacija

| Dokument | Opis |
|---|---|
| [Funkcijski zahtjevi](docs/zahtjevi/funkcijski-zahtjevi.md) | FZ-01 – FZ-15 |
| [Nefunkcijski zahtjevi](docs/zahtjevi/nefunkcijski-zahtjevi.md) | NFZ-01 – NFZ-06 |
| [Obrasci uporabe](docs/zahtjevi/obrasci-uporabe.md) | UC-01 – UC-10 (ključni: UC-03, UC-04, UC-06) |
| [Kako radimo](CONTRIBUTING.md) | Grane, commitovi, pull requestovi, Issues |
| [Predaje](docs/deliverables/) | PDF dokumentacija za predaje |

## Tehnologije

| Dio sustava | Tehnologija |
|---|---|
| Frontend | React + TypeScript, Vite, Tailwind CSS |
| Karta | Leaflet + OpenStreetMap |
| Backend | Java 21 + Spring Boot 3 (REST API, Spring Security, `@Scheduled`) |
| Autentifikacija | Google OpenID Connect / OAuth 2.0 |
| Stvarno vrijeme | WebSocket (STOMP) |
| Baza podataka | PostgreSQL + PostGIS |
| Slike i e-pošta | Cloudinary, Spring Mail |
| Ispitivanje | JUnit 5, Mockito, Selenium |
| Deploy | Docker, Render |
| Dokumentacija | Markdown, PlantUML, draw.io |

## Struktura repozitorija

```
.
├── backend/              # Spring Boot aplikacija
├── frontend/             # React + TypeScript aplikacija
├── docs/
│   ├── zahtjevi/         # funkcijski i nefunkcijski zahtjevi, obrasci uporabe
│   ├── dijagrami/        # UML dijagrami (PlantUML, draw.io)
│   └── deliverables/     # PDF-ovi za predaje
├── scripts/              # pomoćne skripte (npr. kreiranje Issuea)
└── .github/              # predlošci za Issue i pull request
```

## Tim

| Ime i prezime | Uloga | GitHub |
|---|---|---|
| Gabriel Buće | voditelj tima | @gb56872 |
|  | backend |  |
|  | backend |  |
| Lorena Cvek | frontend | @lorenacvek |
|  | baza |  |
| Domagoj Brus | dokumentacija / testovi | @db678 |
| Leon Pastuović | dokumentacija / testovi | @Leon-P1 |

## Izvor podataka

Meteorološki podaci: **Državni hidrometeorološki zavod (DHMZ)**, [meteo.hr](https://meteo.hr). Podaci se koriste u skladu s uvjetima korištenja DHMZ-a. Kartografska podloga: © [OpenStreetMap](https://www.openstreetmap.org/copyright) suradnici.
