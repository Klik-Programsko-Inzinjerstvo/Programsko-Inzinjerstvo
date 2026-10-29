# 1. Opseg projekta

StormWatch je web aplikacija koja na jednom mjestu spaja službene podatke DHMZ-a (mjerenja, prognoze, upozorenja) i prijave korisnika s terena,
koje korisnici, moderatori i meteorolozi provjeravaju, potvrđuju i komentiraju.

## 1.1 Problem i cilj projekta

Hrvatsku svakog ljeta pogađaju snažna konvektivna nevremena koja u kratkom vremenu mogu uništiti urode, oštetiti krovove ili uzrokovati bujične poplave.
DHMZ upravlja mrežom mjernih postaja te objavljuje prognoze i upozorenja, no i gusta mreža ima praznine:
tuča može poharati jedno selo dok najbliža postaja zabilježi tek slabu kišu.

StormWatch rješava taj problem spajajući službene podatke DHMZ-a s prijavama korisnika s terena, koje zajednica, moderatori i meteorolozi provjeravaju i potvrđuju.
Korisnici će moći provjeriti stanje u njihovoj okolici i ostati informirani i sigurni.

## 1.2 Ciljani korisnici i dionici

| Akter | Opis |
|---|---|
| Neregistrirani korisnik | Pregledava vrijeme, prognozu, upozorenja i javnu kartu potvrđenih prijava. |
| Registrirani korisnik | Prijavljuje nevremena, komentira, potvrđuje i osporava prijave, prati korisnike i lokacije. |
| Pouzdani motritelj | Registrirani korisnik s dovoljno reputacije; prijave mu ne prolaze moderaciju, potvrde imaju veću težinu. |
| Moderator | Zadužen za regiju; potvrđuje, odbija i briše prijave i prijavljeni sadržaj, upozorava korisnike. |
| Meteorolog | Objavljuje stručne komentare uz događaje i označava stručno vrijedne prijave. |
| Administrator | Upravlja korisnicima i ulogama, postavkama preuzimanja DHMZ podataka i statistikom korištenja. |

## 1.3 Granice projekta

**Uključeno:** Podnošenje prijave nevremena i pregled prijava na karti.

**Isključeno:** Automatsko angažiranje hitnih službi; vjerodostojnost podataka je zajamčena.

**Vanjska ovisnost:** Pružatelj kartografskih usluga omogućuje prikaz karte; bez potvrde meteorologa prijava nije nužno istinita.

## 1.4 Postojeći pristupi i opravdanost projekta

Nakon teškog grmljavinskog nevremena s tučom, korisnik će možda morati provjeriti izvor meteoroloških upozorenja i zaseban izvor lokalnih prijava.
Predloženi prikaz na karti u StormWatchu objedinjuje prijave kriznih događaja relevantne za odabranu lokaciju.
Aplikacija ne zamjenjuje službena upozorenja ni hitne službe.

---

>**Završna provjera:** Opis problema, cilj projekta, korisnici i dionici, granice opsega te postojeći pristupi međusobno su usklađeni. Navedene koristi ne predstavljaju neprovjerene tvrdnje, a uključene i izostavljene funkcionalnosti odgovaraju odobrenom projektnom zadatku.
