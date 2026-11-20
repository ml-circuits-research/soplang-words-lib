# 02. Ce este incomplet

*A treia citire (0.230.0). Două secțiuni mari din prima citire s-au închis între citiri; apar aici
scurt, cu commitul care le-a închis, ca să nu se redeschidă ca subiecte dezbătute. Restul rămâne
cu dovada că lipsește.*

## Închise între citiri

- **§ Plasare relativă (fost „2")** — mecanismul există: calea generală prin `std.problem`
  (0.227–0.229): mai multe relații și ținte împreună, predicate declarate (`std.placement.predicate`),
  aliniere moale, regiuni ale ancorei, `fit`. Rămân deschise doar verificările din planul propriu
  (`refactoring/request-to-executable-circuits.md`): mutarea unei ancore vii, mutări la plural cu
  pas comparativ, membri atațați.
- **§ Starea aplicației împărțită (fost „5")** — toate cele cinci taburi rulează pe arii SOP
  (Avatar, Calendar — ieri; Desen `9381a3d4`, Diagramă `de0645ea`, Documente `d4918747`, azi-noapte).
  Rămâne de făcut: ștergerea fișierelor JS vechi, rămase pe disc (de exemplu `worlds/art.draw/engine.mjs`),
  nefolosite de taburi.

## 1. Cereri compuse și flux de date între unelte

**Ce lipsește mai departe:** legarea **rezultatelor** unei cereri la **intrările** alteia. Batch-ul are
`after` (ordine), nu `from` (date). `docs/reference.md:2111` încă declară: „No implicit sequence,
cross-entry target binding, host capability promise or execution is introduced". `std.request.constraint`
are `phase=result` doar pentru `occurred` (`src/contracts.mjs:490`). Scenariul Calendar → grupare →
grafic → document se compune în JavaScript, exact ca la citirea I.

**Ce ar trebui să existe:** un port tipizat pe fiecare pas și un operator `bind` validat de contract.
`std.problem.result.assignment` arată forma tipizată care lipsește la nivel de cerere.

## 2. Cuantificatori, grupuri și selectori: contract fără compilator

Neschimbat de la citirea I: `std.request.quant`, `std.request.group`, `std.request.not`,
`std.request.target.selector` sunt declarate (`src/contracts.mjs`) și validate structural
(`src/request-contracts.mjs:64,87-90`), dar compilatoarele nu le execută uniform:
`capability-method.mjs:105` cere exact un target, iar selectorii neexecutabili opresc cu
`unsupported-selector` (`capability-method.mjs:525,591`). Nu există testul „orice combinație
quant/group/selector dă plan sau refuz tipizat".

## 3. Tranzacții și undo între unelte

Neschimbat: pasul compus din mai multe unelte nu are un singur undo dacă a doua eșuează după prima;
nu există compensare declarată. Planul propriu cere explicit „Verify recovery for dependent calls,
… and compensation that cannot restore the full state" (`refactoring/request-to-executable-circuits.md`).

## 4. Diagnostic și explicație pentru eșec

**Progres:** `std.problem.result` introduce forma bună într-un loc — `conflict` (constrângerile
care se bat), `cost`, `alternative`, `explored`, și distinge `unsatisfiable` / `exhausted` / `budget`.
**Ce lipsește:** tipul comun de `Issue` — etapă (`parse`, `contract`, `admission`, `search`, `emit`),
cod stabil de motiv, span, candidați respinși cu motivul, sugestie de reparare. `std.compile.result`
are tot doar `status` + `reason` + `call` + `evidence` (`src/rule-circuit-contract.mjs:17-21`), iar
`fail('request-root')` rămâne tot ce primește apelantul la cereri cu două root-uri.

## 5. Performanță: cold start și index

**Ce s-a mișcat:** turele aplicației au căzut de la 2–5,5 s la 0,8–1,5 s (psys2, worker-log
2026-11-20), iar Z3 isolated se încarcă în 160–210 ms cu rezolvări de 7–26 ms. **Ce nu s-a mișcat:**
`compileRequest` nu are cache în bibliotecă (niciun snapshot `world.stamp` × cerere × versiune de
catalog); indexul de catalog rămâne monolitic — `index.json` 1,73 MiB, `vocab.json` 3,37 MiB,
`vocab-kinds.json` 4,70 MiB, în total **9,81 MiB** pentru orice căutare de cuvânt; WASM-ul Z3
(8,6–8,9 MB gzip) se adaugă pe prima problemă, nu e inclus, deci natura dependenței de rețea rămâne.

## 6. Tipuri și contracte

`src/index.d.ts`: 1.027 linii, un singur fișier pentru 278 de exporturi, ținut manual sincron cu
`src/index.mjs`. Versiunile interne rămân etichete (`std.request version=0.198.0`,
`std.capability version=0.212.0`, `std.instance version=0.208.0`, `std.compile version=0.211.0`,
`std.problem` fără versiune declarată la citire). Lipsesc: tipuri per modul/subpachet, validarea
shard-urilor contra versiunii de motor, aceeași suită de contracte rulată pe toate trei proiectele.

## 7. Testarea cross-proiect

**Progres real:** psys2 are acum un corpus de antrenare auditabil (`official-dataset`: train/dev/test
cu `MANIFEST.json` și `STATS`; 23.299 familii de parafraze) și `ui-coverage-v2` (241 de cazuri ×
≥20 parafraze, 3.180 rânduri). Gate-urile verificate azi: bibliotecă **1047 teste, 1045 pass**
(surse+bundle, rularea mea), cunoaștere **3268, 3250 pass, 18 skip** (rularea mea), aplicație
**647 pass, 0 fail** (worker-log).

**Ce lipsește:** corpusul e pentru cititor (text → etichete), nu golden end-to-end (text → cerere →
plan → apel → efect → răspuns) pe cele trei proiecte la commituri declarate; nu există test de
compatibilitate matriceală (bibliotecă × cunoaștere × aplicație). Dovada că e necesar: testele
cunoașterii trec validând cu **0.225.1** în timp ce aplicația rulează **0.230.0** — două motoare
diferite, verde-amândouă, fără nicio cale de a dovedi că verdele acoperă ce rulează utilizatorul.

## 8. Modelul de încredere

Neschimbat: `fns`/`actions`/`producers` rămân JavaScript arbitrar al hostului; `index.json` nu are
hash per shard sau semnătură; Z3 (WASM, izolare necesară) e primul furnizor extern de încredere
— `provider` apare în rezultat, dar nu există o politică declarată care anume furnizori sunt
admisibili.

## Rezumat: contractele care lipsesc

| Contract | Stare la citirea III |
| --- | --- |
| IR de cerere cu rezultate referențiabile | lipsește (`std.problem.assignment` e forma existentă, dar doar în căutare) |
| Compensare și undo compus | lipsește |
| `Issue` tipizat pe toate etapele | parțial (`std.problem.result`); `std.compile.result` tot string |
| Versionare între proiecte | lipsește; ilustrație nouă: validare la -6 builduri |
| Cache de compilare în bibliotecă | lipsește |
| Corpus golden end-to-end | parțial (corpus de cititor, nu de circuit) |
| Sandbox/trust pentru host | lipsește; + furnizorul Z3, primul binar extern |

Următoarea capacitate adăugată fără aceste contracte rămâne o excepție; `std.problem` a fost exact
excepția care a meritat — măsura după care se judecă următoarele.
