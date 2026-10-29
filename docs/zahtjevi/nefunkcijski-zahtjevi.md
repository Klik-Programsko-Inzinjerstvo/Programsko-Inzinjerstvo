# Nefunkcijski zahtjevi

Nefunkcijski zahtjevi opisuju **kako** sustav mora raditi: kvalitetu, ograničenja i svojstva sustava. Svaki zahtjev ima mjerljiv kriterij kako bi se mogao provjeriti ispitivanjem.

## Pregled

| Oznaka | Kategorija | Zahtjev |
|---|---|---|
| NFZ-01 | Upotrebljivost | Responzivnost |
| NFZ-02 | Performanse | Rad u stvarnom vremenu |
| NFZ-03 | Pouzdanost | Dostupnost neovisno o DHMZ-u |
| NFZ-04 | Sigurnost | Autentifikacija, autorizacija i zaštita podataka |
| NFZ-05 | Performanse | Brzina učitavanja |
| NFZ-06 | Pravna ograničenja | Navođenje izvora podataka |

---

### NFZ-01 Responzivnost
Aplikacija je web aplikacija prilagođena mobilnim uređajima i računalima.

**Mjerljivi kriterij:** sve stranice upotrebljive su bez vodoravnog pomicanja na zaslonima širine od **360 px** naviše; podržane su posljednje dvije verzije preglednika Chrome, Firefox, Safari i Edge.

### NFZ-02 Rad u stvarnom vremenu
Sustav podržava istovremeni rad više korisnika. Nove prijave, potvrde i komentari prikazuju se bez ručnog osvježavanja stranice (WebSocket).

**Mjerljivi kriterij:** promjena je vidljiva ostalim povezanim korisnicima unutar **2 sekunde**.

### NFZ-03 Dostupnost neovisno o DHMZ-u
Podaci DHMZ-a pohranjuju se u vlastitu bazu pa aplikacija radi i kad vanjski izvor nije dostupan.

**Mjerljivi kriterij:** pri nedostupnosti DHMZ-a sve funkcionalnosti ostaju dostupne, a uz podatke se prikazuje vrijeme posljednjeg uspješnog ažuriranja.

### NFZ-04 Sigurnost
- Autentifikacija preko OAuth 2.0 / OpenID Connect; zaštićeni zahtjevi koriste tokene.
- Sva komunikacija ide isključivo preko **HTTPS-a**.
- Uloge i prava pristupa provjeravaju se **na poslužitelju** za svaki zahtjev, ne samo u korisničkom sučelju.
- Korisnički unos se validira, a aplikacija je zaštićena od uobičajenih napada (SQL injection, XSS, CSRF).
- Tajni ključevi ne nalaze se u repozitoriju (koriste se varijable okruženja).

**Mjerljivi kriterij:** zahtjev bez važećeg tokena ili s nedovoljnom ulogom vraća HTTP 401/403.

### NFZ-05 Performanse
**Mjerljivi kriterij:** stranice i karta učitavaju se za manje od **3 sekunde** na prosječnoj mobilnoj vezi; odgovor REST API-ja za uobičajene upite kraći je od 500 ms.

### NFZ-06 Navođenje izvora podataka
Pri korištenju podataka DHMZ-a poštuju se njihovi uvjeti korištenja, a DHMZ se jasno navodi kao izvor podataka. Isto vrijedi za OpenStreetMap.

**Mjerljivi kriterij:** izvor podataka (DHMZ, © OpenStreetMap suradnici) vidljiv je na svakoj stranici koja prikazuje te podatke.

---

## Ostala ograničenja

- **Tehnologije:** React + TypeScript (frontend), Java 21 + Spring Boot 3 (backend), PostgreSQL + PostGIS (baza).
- **Isporuka:** aplikacija je javno dostupna na internetu (Docker, Render).
- **Ispitivanje:** jedinični i integracijski testovi (JUnit 5, Mockito) te sustavski testovi (Selenium).
- **Održavanje:** sav kod i dokumentacija nalaze se u ovom repozitoriju; promjene idu kroz pull requestove.
