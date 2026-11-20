# Review independent: ecosistemul SOP Worlds

**Proiecte:** `soplang-words-lib` (motorul), `sop-knowledge-worlds` (cunoaștere), `psys2` (aplicația).
**Commituri citite:** `soplang-words-lib` `85a79dc` (0.230.0), `sop-knowledge-worlds` `a04fb0d8` (validează cu sopworld 0.225.1), `psys2` `d4918747`.
**Data:** 20 noiembrie 2026.
**Autor:** review independent (Mistral), pe cod, teste și manifeste, nu pe prezentări.

## Trei citiri în două zile

- **Citirea I** — la 0.225.1 (`747b51e`): verdict dur, corect în mare, cu câteva numărători greșite.
- **Citirea a II-a** — seara aceleiași zile, la 0.225.2: numerele corectate; primul răspuns la review apăruse deja (validarea catalogului realiniată, Avatar pe arie SOP).
- **Citirea a III-a** — aceasta, la 0.230.0, după o noapte în care cererile mari din review au devenit mecanisme: `std.problem` cu Z3, plasarea pe calea generală, toate cele cinci taburi pe arii SOP.

De data aceasta nu doar actualizez: **șterg constatările rezolvate** și păstrez, cu dovezi proaspete,
doar ce mai stă în picioare. Ce a fost rezolvat rămâne consemnat scurt, ca dovezi de direcție, în „Ce s-a întâmplat".

## Verdict

Kernelul rămâne bun, iar direcția de noapte e cea cerută de prima citire: o căutare neutră (`std.problem`),
verificată la citire înapoi, cu buget declarat, doi furnizori (unul intern, Z3 în browser) și distincție
onestă între „nemodelează", „buget epuizat" și „imposibil demonstrat". Plasarea și-a luat locul pe
această cale. Aplicația ține toate cele cinci taburi în lumi SOP. Astea sunt exact „un singur motor de
decizie" și „starea în SOP" din [03](./03-ce-ar-putea-fi-facut-mai-bine.md) și [04](./04-ce-ar-putea-fi-facut-mai-general.md).

Ce nu s-a schimbat — și acum costă mai mult, pentru că mecanismul care le-ar absorbi există deja:

1. `compileRequest` rămâne un **router pe tipul de wire**: o nouă cerere (`std.problem.request`) a
   însemnat încă un `if` în `compilePacket`, nu o fază nouă într-un pipeline. Root-ul unic este în continuare
   impus prin `fail('request-root')`.
2. Motoarele paralele rămân: `reason.mjs` (`KIND_FACTS`, `REASON_RULES`), `plan.mjs` (`PlanLive`),
   `request.mjs` (`planRequest`) sunt exportate public, nedeprecate. `std.problem` le-ar putea înlocui;
   astăzi coexistă.
3. Biblioteca scrie în continuare **tipuri de domeniu în `src/`**: `w.legend` (contract întreg),
   `w.document`, `w.diagram`, `k.scenes`, `k.kinds`. Aplicația a migrat taburile pe lumi din
   catalog (`w.drawing`, `w.diagram`, `w.document` extinse) — biblioteca nu.
4. Rezultatele de compilare rămân **text SOP**: `status=unavailable reason=...`, string gol la
   proiecția de cunoaștere, `string | Promise<string>` după forma celui de-al doilea argument.
   Excepție notabilă: `std.problem.result` poartă `conflict`, `cost` — forma bună există deja într-un singur loc.
5. Contractul între proiecte rămâne **copiat de mână**: validarea catalogului stă la 0.225.1 (realiniată
   ieri-dimineață, azi are șase builduri în urmă), vendorul din psys2 e la 0.230.0 (copiat azi-noapte),
   pinurile `repos.pin` au rămas în urmă, taguri zero. Dintr-o zi în alta, aceleași trei probleme.
6. Monolitul a crescut: 1.699,9 kB și 25.372 linii, 278 exporturi, plus WASM-ul Z3 (8,6–8,9 MB gzip,
   livrat separat, încărcat leneș) — distribuția e tot „un fișier (și un wasm)".

## Ce s-a întâmplat între citiri (verificat, nu citit din rapoarte)

| Cerere din review | Ce e acum în cod | Verificat |
| --- | --- | --- |
| Plasarea: mai multe relații, ținte, constrângeri cantitative, regiuni | Cale generală `problemPlacement` când metoda declară `search=problem`, cererea are >1 relație, >2 ținte, predicat fără direcții, `fit` sau `region`; totul devine un singur `std.problem` | `src/placement-method.mjs:196-215`, 0.227–0.229 |
| Un motor de decizie neutru | `src/problem.mjs`: variabile tipizate, domenii, hard/soft, buget, adâncime; furnizori intern și Z3; soluțiile sunt recitite contra constrângerilor hard | `src/problem.mjs`, 0.226.0 |
| Z3 „nu se poate în browser" | `browser/smt-z3.mjs`, încărcare leneșă la prima problemă, izolare necesară, altfel `provider=internal` | 0.228.0; `node tools/browser-z3-check.mjs` 10/10: încărcare 160–210 ms, rezolvare 7–26 ms |
| Starea taburilor în JS | Toate cele cinci taburi (Avatar, Calendar, Desen, Diagramă, Documente) pe arii SOP; gate 647 pass, 0 fail | psys2 `d4918747`, worker-log 2026-11-20 |
| Gradele („un soare mare") ca formă, nu excepție | `operator=degree` cu factori din catalog peste o bază; „small/plain/big sun" → 112/160/224 | `src/capability-method.mjs`, 0.230.0 |
| Cititorul: corpus real | `official-dataset` (train 41.870 / dev 5.128 / test 4.880, 23.299 familii), v6 la intenție exactă 61,8% vs 18,4% pentru modelul implementat, activat; probe pe ruta reală 6/22 → 15/22 | psys2 worker-log 2026-11-20 |
| Ture lente (2–5,5 s) | 0,8–1,5 s în Chromium, prin cedare la tura care așteaptă și refolosire pe turn | psys2 worker-log 2026-11-20 |

Acest tabel nu mărturisește că totul e gata: planul propriu al proiectului (`refactoring/request-to-executable-circuits.md`)
ține încă verificările deschise pentru plasări multiple, dependențe date între unelte și compensare. Dar
direcția cerută de review e recunoscută și implementată, nu ignorată.

## Dovezi măsurate (citirea a III-a, `85a79dc`)

| Măsură | Valoare | Sursă |
| --- | --- | --- |
| Build single-file | 1.699,9 kB, 476,3 kB gzip, 110 module, 25.372 linii | `docs/version.md`, `wc -l` |
| Module în `src/` | 111 | `find src -name '*.mjs'` |
| Exporturi publice | 278 | `import * as m from './src/index.mjs'` |
| Versiuni în changelog | 221 secțiuni | `grep -c '^## '` |
| Teste bibliotecă (rularea mea) | 1047: 1045 pass, 0 fail, 1 skip, 1 todo | `npm test` (43 s) |
| Teste cunoaștere (rularea mea) | 3268: 3250 pass, 0 fail, 18 skip | `npm test` în catalog (29 s) |
| Teste aplicație | 647 pass, 0 fail, 1 todo | worker-log 2026-11-20 (rulat de worker; eu n-am rulat poarta psys2) |
| Z3 în browser (izolat) | încărcare 160–210 ms, prima rezolvare 200–320 ms, apoi 7–26 ms | worker-log la 0.228.0, `tools/browser-z3-check.mjs` |
| Limitele Z3, măsurate | aceeași formă: 55 ms sau 37 s după obiectiv; `Optimize` pe disjuncții explodează; bugetul declarat refuză onest | `books/propunere-compilator-smt.md` |
| Cunoaștere publicată | 60,2 MB SOP / 57,3 MiB, 1325 fișiere; index+vocab 9,81 MiB | `find`, `du` |
| Validarea cunoașterii | sopworld **0.225.1** (copie din `747b51e`), biblioteca e la **0.230.0** | `tools/sopworld/VERSION` |
| Vendor psys2 | 0.230.0 (`e2435a4`), copiat de mână azi-noapte | `psys2/src/vendor/sopworld/provenance.json` |
| Pinuri vs checkout-uri | `repos.pin`: `a0e8538` / `45ac4bf`; checkout-uri: `a04fb0d8` / `d4918747` | `repos.pin`, `git rev-parse` |
| Taguri git | 0 / 0 / 1 (`pre-tab-cut`) | `git tag` |

## Ce rămâne de criticat (top-ul actualizat)

| # | Constatare | Severitate | Unde se vede |
| --- | --- | --- | --- |
| 1 | Compilatorul e un router pe tipul de wire, cu root unic impus în cod | P0 | `src/request-compiler.mjs:21-34,40` |
| 2 | Trei motoare paralele (`World`, `reason.mjs`, `plan.mjs`) lângă noul `std.problem` | P0 | `src/reason.mjs:30,44`, `src/plan.mjs:71`, `src/request.mjs:1595`, `src/index.mjs:50,71,75` |
| 3 | Domeniul rămâne în bibliotecă (`w.legend`, `w.document`, `w.diagram`, `k.*`) | P0 | `src/contracts.mjs:242`, `src/document.mjs`, `src/diagram.mjs`, `src/reason.mjs:30` |
| 4 | Rezultate „stringly typed": text SOP, string gol, sync/async amestecat | P0 | `src/request-compiler.mjs:11,18`, `src/knowledge-projection.mjs:78` |
| 5 | Fără contract de versiune; copii realiniate azi, în urmă mâine | P0 | `tools/sopworld/VERSION` vs `package.json`; `repos.pin` |
| 6 | Monolit: 1,70 MB / 278 exporturi; Z3-ul vine ca wasm separat, nu ca pachet | P1 | `docs/version.md`, `browser/smt-z3.mjs` |
| 7 | Metoda: 221 versiuni aditive; `std.problem` e prima absorbție reală, rămân 278 de nume fără deprecare | P1 | `CHANGELOG.md`, `src/index.mjs` |
| 8 | Flux de date între unelte tot lipsă din IR (Calendar → chart → document) | P1 | `docs/reference.md:2111`, `request-batch.mjs` |
| 9 | Selectorii și cuantificatorii sunt declarați și validați, dar executarea rămâne parțială; capability cere exact un target | P1 | `src/capability-method.mjs:105,525,591` |
| 10 | Determinismul: `localeCompare` 15, `toLowerCase` 171, `Date` 15 în `src/` | P2 | grep în `src/` |

Corecturile de numărare din citirea a II-a (171 vs 153 etc.) rămân valabile; fenomenul nu s-a schimbat,
doar codul de plasare a fost rescris prin `std.problem` — și totuși contorul de `localeCompare` a rămas 15.

## Ce este bun și trebuie păstrat

- Kernelul `World`: tell all-or-nothing, jurnal, fork copy-on-write, `explain`, `why`, `stamp`.
- `std.problem` nou: contract curat pe wire-uri, recitirea soluțiilor contra constrângerilor hard,
  `unsatisfiable` cu `conflict` numit, `exhausted` distinct de imposibil, buget declarat. Este forma
  exactă pe care 04 o cerea pentru „orice alegere", plus onestitatea măsurată despre propriile limite.
- Testele: 1045 pass pe surse, la fel pe bundle; cunoașterea 3250 pass; aplicația 647 pass cu tot cu
  Chromium. Discipline reale, repetate zilnic.
- Fișierele JS vechi ale taburilor sunt încă pe disc dar nefolosite — dovadă că migrarea s-a făcut
  prin mecanism, nu prin excepție; ștergerea lor rămâne de făcut.
- Reacția la review: realinierea validării, `std.ground`, `std.problem`, taburile pe arii — toate
  în echivalent de o zi. Când critica greșește, se corectează; când are dreptate, se implementează.

## Cum se citește restul

| Fișier | Întrebarea |
| --- | --- |
| [01-ce-este-gresit-in-abordare.md](./01-ce-este-gresit-in-abordare.md) | Ce este greșit în abordare și încă stă în picioare |
| [02-ce-este-incomplet.md](./02-ce-este-incomplet.md) | Ce lipsește; secțiunile închise apar scurt |
| [03-ce-ar-putea-fi-facut-mai-bine.md](./03-ce-ar-putea-fi-facut-mai-bine.md) | Ordinea venită din review, actualizată după noapte |
| [04-ce-ar-putea-fi-facut-mai-general.md](./04-ce-ar-putea-fi-facut-mai-general.md) | Forma generală; ce s-a realizat deja din ea |

## Limitele review-ului

- Nu am rulat poarta psys2 (la citirea trecută, rularea ei a regenerat buildul aplicației; de data
  aceasta am citit gate-ul înregistrat al workerului și nu am atins psys2 deloc).
- Cifrele Z3 sunt cele înregistrate de proiect (`tools/browser-z3-check.mjs`, worker-log); nu le-am
  re-măsurat eu.
- Nu am profilat memorie în browser; nu am făcut audit de securitate.
- Nu am rescris cod. Review-ul păstrează kernelul și direcția noastră — care peste noapte a devenit și a lor.
