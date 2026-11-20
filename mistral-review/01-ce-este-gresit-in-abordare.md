# 01. Ce este greșit în abordare

*A treia citire (0.230.0). Secțiunile rezolvate între citiri au fost șterse sau scurtate; ce rămâne
are dovada în codul de azi. Critica nu este „lipsește funcția X", ci „forma face funcția X scumpă
sau imposibilă".*

## 1. `compileRequest` este un router, nu un compilator

`compilePacket` alege ce face după **prezența unui tip de wire** — și citirea a treia adaugă încă o
ramură (`std.problem.request`), exact cum prezicea citirea I:

```js
if(wires.some(w=>w.type==='std.knowledge.request'))return catalog ? compileKnowledgeProjection(...) : fail(...);
if(grounding)return compileGrounding(world,wires);
if(wires.some(w=>w.type==='std.problem.request'))return solveProblem(wires,{provider});
if(wires.some(w=>w.type==='std.choice.request'))return compileChoice(world,wires);
if(wires.some(w=>w.type==='std.interpret.input'))return compileInterpretations(world,wires,compileSingle);
return compileSingle(world,wires,provider);
```

Sursa: `src/request-compiler.mjs:29-34`. Fiecare ramură are propriul contract, propriile limite,
propriile motive de eșec și propriul modul (knowledge-projection, ground-method, **problem.mjs — nou**,
choice-method, interpretation-method, capability-method, placement-method, rule-circuit).

Ce este greșit:

- **Ordinea este semantică**. Un pachet cu `std.ground.request` ajunge la grounding chiar dacă ar fi și
  o problemă de căutare în el. Nu există o fază care validează combinația sau o descompune.
- **Un singur root este impus prin cod**: `if (roots.length!==1 || contexts.length>1) return fail('request-root')`
  (`request-compiler.mjs:40`). „Desenează o casă, apoi scrie un document" se taie în aplicație.
- **Fiecare ramură își reinventează admisia** (fork + `factsOnly`, verificări de identitate, bugete).
  `solveProblem` e singura care a primit un contract de wire curat — restul rămân ad-hoc.
- **Extinderea tot modifică nucleul**: `std.problem` = 6 `if`-uri în loc de 5, linii noi în
  `contracts.mjs`, export nou. Mecanismul e bun, forma de integrare e aceeași.

Consecința rămâne: nu poți raționa „orice cerere validă dă un plan sau un refuz tipizat", pentru că
fiecare ramură are altă definiție a validului — doar `std.problem` are una publicată, în wire-uri.

## 2. Trei motoare paralele — acum lângă un al patrulea, general

Citirea I cerea un singur motor. S-a construit un motor nou bun (`std.problem`: variabile, domenii,
constrângeri hard/soft, buget — soluțiile recitite contra constrângerilor hard — cu `conflict` numit
la imposibilitate). Dar cele vechi nu au plecat:

- `src/reason.mjs:30` `KIND_FACTS` (tipuri fixe `k.commonsense`, `k.scenes`, `k.kinds`),
  `:44` `REASON_RULES`;
- `src/plan.mjs:71` `PlanLive` cu fact store propriu; `src/request.mjs:1595` `planRequest`;
  `src/tool.mjs:284` `runPlan`;
- toate exportate public: `src/index.mjs:50` (`planner`, `PlanLive`), `:71` (`planRequest`), `:75`
  (`deduceState`) — fără deprecare.

Semnificația s-a schimbat: nu mai e „lipsește motorul general", ci „a sosit și nu a absorbit".
Choice, grounding, plan și reason rulează în continuare pe logici proprii; `std.problem` e folosit
doar de plasare și de cererile explicite `std.problem.request`.

## 3. Granița „mecanism / cunoaștere" e în continuare încălcată în bibliotecă

`AGENTS.md` (regulile 5 și 6): nimic din `src/` nu numește un consumator; lumile particulare stau în
`sop-knowledge-worlds`. În cod:

- `src/spell.mjs:1` — comentariu „psys2 Q39" (atât; singura abatere de la regula 5);
- `src/contracts.mjs:242` — schema întreagă `w.legend`, o lume publicată;
- `src/document.mjs`, `src/diagram.mjs`, `src/compose.mjs`, `src/expect.mjs`, `src/readtypes.mjs`
  scriu direct tipuri `w.document.*`, `w.diagram.*`, numesc `k.genres`, `k.interest`;
- `src/reason.mjs:30` numește `k.commonsense`, `k.scenes`, `k.kinds`; `src/cycles.mjs:12` are
  `k.time.ordered` ca default; `src/statements.mjs:7` vorbește de `w.person`.

Noutatea citirii a III-a: **aplicația a trecut de partea corectă** — taburile rulează pe instanțe din
catalog (`w.drawing`, `w.diagram`, `w.document` extinse zilnic), iar plasarea citește predicate și
regiuni din `std.placement.predicate` / fapte de cunoaștere. Biblioteca e acum singurul loc care mai
cunoaște nume de lumi — adică exact invers de cum ar trebui să fie dependența.

## 4. Contracte „stringly typed", cu pierdere de informație

- Eșecul: `const fail = reason => '@compile.result std.compile.result status=unavailable reason='+reason+'\n'`
  (`request-compiler.mjs:11`). Fără etapă, span, candidați, alternativă.
- String gol ca succes: `knowledge-projection.mjs:78` `return ''` când nicio selecție nu se leagă.
- Sync/async după forma argumentului: `return options ? Promise.resolve(result) : result`
  (`request-compiler.mjs:16-18`).
- Vocabular de statusuri neomogen (`unavailable`, `not-applicable`, `compiled`, `solved`,
  `unsatisfiable`, `exhausted`); ultimele trei trăiesc doar în `std.problem.result`.
- Excepția bună: `std.problem.result` (`src/problem.mjs`, schema) — `status enum=solved|unsatisfiable|exhausted|budget`,
  `provider`, `cost`, `assignment`, `conflict`, `alternative`, `explored`. Forma tipizată pe care 03
  o cere există deja — dar într-un singur stream, nu în toate.

## 5. Nu există contract de versiune între cele trei proiecte

`core.module version=` rămâne „a label, reported, nothing more" (`matrix.mjs`). Starea de fapt la
citirea a III-a:

- validarea catalogului: sopworld **0.225.1** (copie de la commitul `747b51e` al bibliotecii) —
  realiniată ieri-dimineață, azi biblioteca e la **0.230.0**: șase builduri în urmă;
- vendorul psys2: **0.230.0** (`e2435a4`), copiat de mână azi-noapte — deci la zi, tot prin copie;
- `repos.pin`: cunoașterea `a0e8538` (checkout `a04fb0d8`), aplicația `45ac4bf` (checkout `d4918747`) —
  pinurile de integrare sunt în urmă cu zile;
- taguri git: 0 în bibliotecă, 0 în cunoaștere, 1 (`pre-tab-cut`) în aplicație.

Fenomenul s-a repetat identic în două zile consecutive: realinierea prin copie rezolvă starea într-o
zi și o pierde în ziua următoare. Nimic din `index.json`, provenance sau modules nu se compară
mașinal.

## 6. Monolitul de distribuție blochează modularizarea

`docs/sopworld.mjs`: **1.699,9 kB, 25.372 linii, 110 module bundle-uite** (`docs/version.md`).
`src/index.mjs`: 278 de nume exportate; psys2 (singurul consumator mare folosește 15+ nume din vendor).
Nu există `exports` pe subpath. Nou la citirea a III-a: Z3 se distribuie ca **WASM separat**
(`docs/vendor/z3-solver-5.4.1/`, 8,6–8,9 MB gzip, încărcat la prima problemă, cu izolare obligatorie) —
prima piesă care iese din „un singur fișier", dar ca artefact de vendor, nu ca pachet versionat.

## 7. Metoda de lucru: suprafață, cu o excepție notabilă

221 de secțiuni de changelog (2.955 de linii), cu capabilități noi la fiecare versiune. Dar citirea a III-a
trebuie să consemnează: **0.226–0.230 este prima absorbție reală** — familia de cazuri speciale de
plasare (relații, regiuni, fit, aliniere) a devenit un mecanism declarativ (`std.problem` +
`std.placement.predicate`), nu încă un `if`. Dovada că metoda poate produce nucleu, nu doar suprafață.
Ce nu s-a schimbat: nimic din API-ul public nu a fost retras; 278 de exporturi, toate nedeprecate.

## 8. Determinismul promis este subminat de mediu

- `localeCompare`: **15** apeluri (aceleași fișiere și linii ca la citirea I: `turn.mjs:118,122,126,128`,
  `ground-method.mjs:124,134,137`, `align.mjs:41`, `spell.mjs:136`, `summarize.mjs:56`,
  `compose.mjs:191`, `diagram.mjs:183`, `grammar.mjs:148`, `handover.mjs:40`, `ledger.mjs:50`);
- `toLowerCase()`: **171** (numărat la fel la `747b51e` și la citirile II–III);
- `Date.now`/`new Date`: **15**.

Codul de plasare a fost rescrit în noaptea asta prin `std.problem`; contoarele n-au mișcat. Determinismul
e o politică lipsă, nu un accident local.

## Concluzia secțiunii

Ce a căzut de la citirea I: „nu există motor de decizie general", „plasarea nu scalează dincolo de două
ținte", „starea aplicației e în JS". Ce a rămas ca decizie de formă, înainte de următoarea capacitate:

1. un pipeline cu faze (nu `if` pe tipuri de wire) și un IR de cerere;
2. `std.problem` extins peste choice/grounding/plan/reason, cu deprecarea celor vechi;
3. `w.*`/`k.*` scoase din `src/` în catalog;
4. rezultate tipizate peste tot — forma există deja în `std.problem.result`;
5. un contract de versiune mașinal, pe cele trei repo-uri.

Fiecare are acum o piesă de cod care arată cum ar arăta rezolvarea. Nu mai e o cerere abstractă.
