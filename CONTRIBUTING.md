# Kako radimo

## Tijek rada
1. Svaki zadatak ima svoj **Issue** (zahtjev, bug, dokumentacija).
2. Iz `main` napravi novu granu:
   - `feature/FZ-06-prijava-nevremena`
   - `fix/123-kratki-opis`
   - `docs/zahtjevi`
3. Commitaj male, smislene promjene.
4. Otvori **pull request** prema `main` i u opisu napiši `Closes #broj`.
5. Barem **jedan član tima** mora odobriti PR prije spajanja.
6. Nitko ne pusha izravno na `main`.

## Poruke commitova
Kratko, u imperativu, s prefiksom:
```
feat: dodaj formu za prijavu nevremena
fix: ispravi izračun najbliže postaje
docs: dopuni nefunkcijske zahtjeve
test: dodaj testove za ocjenu vjerodostojnosti
```

## Oznake (labels)
| Oznaka | Značenje |
|---|---|
| `funkcijski` | funkcijski zahtjev (FZ) |
| `nefunkcijski` | nefunkcijski zahtjev (NFZ) |
| `frontend` / `backend` / `baza` | dio sustava |
| `dokumentacija` | dokumentacija i dijagrami |
| `bug` | greška |
| `prioritet: visok` / `srednji` / `nizak` | prioritet |
