# 01. Ce este greșit în abordare

Critica nu este „lipsește funcția X”. Critica este că anumite decizii de formă fac funcția X scumpă
sau imposibilă. Fiecare punct are dovada în cod și consecința arhitecturală.

## 1. `compileRequest` este un router, nu un compilator

`compilePacket` alege ce face după **prezența unui tip de wire**:

```js
if (wires.some(w => w.type === 'std.knowledge.request')) return catalog ? compileKnowledgeProjection(...) : fail(...);
if (grounding) return compileGrounding(world, wires);
if (wires.some(w => w.type === 'std.choice.request')) return compileChoice(world, wires);
if (wires.some(w => w.type === 'std.interpret.input')) return compileInterpretations(world, wires, compileSingle);
return compileSingle(world, wires);
```

Sursa: `src/request-compiler.mjs:29-33`. Fiecare ramură are propriul contract, propriile limite,
propriile motive de eșec și propriul modul:

| Ramură | Modul | Rezultat |
| --- | --- | --- |
| knowledge projection | `knowledge-projection.mjs` | SOP + `status=unavailable` |
| grounding | `ground-method.mjs` | SOP + `std.choice` |
| choice | `choice-method.mjs` | SOP + assessments |
| interpretations | `interpretation-method.mjs` | SOP per reading |
| capability | `capability-method.mjs` | SOP calls |
| placement | `placement-method.mjs` | SOP proposal |
| rule circuit | `rule-circuit.mjs` | SOP calls + evidence |

Ce este greșit:

- **Ordinea este semantică**. Dacă un pachet conține și `std.ground.request` și `std.choice.request`,
  câștigă grounding. Nu există o fază care să valideze combinația, să o descompună sau să explice
  de ce a ales o ramură.
- **Un singur root este impus prin cod**, nu prin contract: `if (roots.length !== 1 || contexts.length > 1)
  return fail('request-root')` (`request-compiler.mjs:40`). Două acte într-o singură cerere
  („desenează o casă, apoi scrie un document”) nu pot fi compilate nativ; trebuie tăiate înainte de
  compilator, de aplicație.
- **Fiecare ramură își reinventează admisia**: `world.fork().tell(..., {factsOnly:true})`,
  verificări de identitate, bugete proprii, vocabulare proprii. Nu există un singur „request IR”
  peste care să ruleze un singur set de validări.
- **Extinderea cere modificarea nucleului**. Un tip nou de cerere = un `if` nou în `compilePacket`,
  un contract nou în `contracts.mjs`, un export nou în `index.mjs`, un rând nou în tabelul de
  capabilități. Nu există un registry de faze sau de providere.

Consecința: compilatorul nu poate fi raționat ca un todo. Nu poți demonstra „orice cerere validă
produce un plan sau un refuz tipizat”, pentru că fiecare ramură are altă definiție a validului.

## 2. Trei motoare paralele pentru aceleași noțiuni

Există trei moduri de a răspunde la „ce urmează din starea lumii?”:

1. **Kernelul**: `World.tell` + `matrix` + `core.rule` + `chase` + `solve.mjs`.
2. **`reason.mjs`**: un view plat (`factsOf`) și un forward-chaining separat (`deduceState`) cu
   `REASON_RULES` proprii.
3. **`plan.mjs`**: `PlanLive` + `factStore` + HTN, cu propriul model de lucruri, atribute, istoric.

Dovezi:

- `src/reason.mjs:30-35` definește `KIND_FACTS` ca listă fixă de tipuri:
  `k.commonsense.thing`, `k.scenes.thing`, `k.kinds.kind`, `k.kinds.parent`.
- `src/reason.mjs:44-49` definește `REASON_RULES` cu nume de chei de domeniu: `at`, `place`, `in`,
  `on`, `material`, `is_a`.
- `src/plan.mjs:1-8` spune explicit că planul este „applied by the host as one sentence”, iar
  `PlanLive` (`plan.mjs:71`) este o simulare paralelă, nu un `World`.
- `src/request.mjs:1595` are `planRequest` propriu; `src/tool.mjs:284` are `runPlan` propriu;
  `src/index.mjs:50` (`planner`, `PlanLive`), `:70` (`planRequest`), `:74` (`deduceState`) — toate
  publice, fără deprecare.

Ce este greșit:

- **Semantica se dublează**. O regulă `core.rule` și o regulă din `REASON_RULES` pot spune lucruri
  diferite despre același lucru. Nimeni nu definește care este adevărul.
- **Starea se dublează**. `PlanLive` și `FactView` nu sunt `World`; un fapt schimbat în `World` nu
  apare automat în ele, iar un plan executat în `PlanLive` nu produce jurnalul `World`.
- **Testele se dublează**. Fiecare motor are testele lui; un bug de semantică poate fi verde în două
  suite și roșu în a treia.
- **Utilizatorul alege motorul**. Pentru un consumator nou nu este clar dacă trebuie `planner`,
  `planRequest`, `deduceState` sau `world.query`. Toate sunt publice.

Consecința: proiectul crește prin adăugarea de motoare, nu prin adâncirea unuia. Orice generalizare
viitoare trebuie să aleagă un motor și să convertească celelalte în date, nu să adauge al patrulea.

## 3. Granița „mecanism / cunoaștere” este declarată, dar încălcată

`AGENTS.md` spune două lucruri incompatibile cu codul:

- regula 5: „Nothing in `src/` names a particular consumer (`git grep -i psys2 src/` stays empty)”;
- regula 6: „Particular worlds and knowledge live in sop-knowledge-worlds”.

În realitate:

- `src/spell.mjs:1` conține „psys2 Q39”. `git grep -i psys2 -- src` nu este gol.
- `src/contracts.mjs:240-445` definește `w.legend`, un world schema întreg (206 linii de contract),
  în bibliotecă. `w.legend` este o lume publicată, nu un mecanism al kernelului.
- `src/document.mjs` scrie direct tipuri `w.document.*`; `src/diagram.mjs` scrie `w.diagram.*`;
  `src/compose.mjs` numește `k.genres`, `k.interest`, `k.story`; `src/reason.mjs` numește
  `k.commonsense`, `k.scenes`, `k.kinds`.
- `src/statements.mjs` vorbește despre `w.person`; `src/cycles.mjs` are `k.time.ordered` ca default.

Ce este greșit:

- **Direcția dependenței este inversată**. O schimbare într-o lume publicată poate rupe biblioteca,
  deși biblioteca ar trebui să fie stabilă și lumea să depindă de ea.
- **„General” devine „cunoaște toate lumile”**. Bibliotecă generală nu înseamnă să știe `w.document`;
  înseamnă să poată rula orice `w.document` care respectă contractul.
- **Testele nu mai pot izola mecanismul**. Un test pentru `compose` are nevoie de `k.genres`, deci
  testul nu mai dovedește că mecanismul este general.

Consecința: promisiunea „extindere cu cost mic” este adevărată doar pentru lumile pe care biblioteca
le știe deja. Pentru o lume nouă, utilizatorul trebuie să editeze `src/`.

## 4. Contracte „stringly typed”, cu pierdere de informație

Compilarea returnează text SOP:

```js
const fail = reason => '@compile.result std.compile.result status=unavailable reason=' + reason + '\n';
```

Sursa: `src/request-compiler.mjs:11`. Succesul este tot text serializat de `rule-circuit.mjs` sau de
ramurile speciale. Consecințe directe:

- **Apelantul re-parsează**. În teste: `parse(world.compileRequest(...))[0].attrs.reason[0]`.
  În aplicație: `parse`, `str`, `serialize` sunt printre puținele importuri folosite.
- **String gol este rezultat valid**. `knowledge-projection.mjs:78` returnează `''` când nicio
  selecție nu se leagă. Un apelant nu poate distinge „nu s-a aplicat” de „a mers, dar nu am nimic”.
- **Sync/async este amestecat în același API**: `return options ? Promise.resolve(result) : result`
  (`request-compiler.mjs:15-17`). Același apel returnează `string` sau `Promise<string>` după cum
  al doilea argument este sau nu un obiect. Tipurile și testele trebuie să acopere ambele.
- **Eșecul nu are structură**. Are un cod de motiv, dar nu are etapa, span-ul, candidatul, alternativa
  sau dovada. `fail('request-root')` nu spune care root a fost în plus, care context a fost refuzat,
  ce ar fi trebuit schimbat.
- **Vocabular de statusuri inconsistent**: `unavailable`, `not-applicable`, `selected`, `compiled`,
  `unavailable` în `std.choice`, `unavailable` în `std.ground`. Nu există o enumerare unică.

Consecința: fiecare consumator își scrie propriul parser de rezultat și propriul mapping de erori.
Aplicația nu poate afișa „de ce” fără să ghicească, iar un test nu poate verifica altceva decât stringul.

## 5. Nu există contract de versiune între cele trei proiecte

Biblioteca are un mecanism de module:

```
@k.objects core.module name=k.objects version=8 imports=... exports=...
```

Dar versiunea este **doar o etichetă**:

```js
const version = ...; // a label, reported, nothing more
```

Sursa: `src/matrix.mjs:360`. Nu se compară cu nimic, nu se negociază, nu se refuză un import cu
versiune incompatibilă. `core.module version` este colectat și raportat de `world.modules()`
(`world.mjs:1495`), atât.

Starea reală (re-măsurată la `ac33216`, 19.11 seara):

- `sop-knowledge-worlds/tools/sopworld/VERSION`: **0.225.1**, build `8a63e3e83fef`, copie a
  `docs/sopworld.mjs` de la commitul `747b51e` al bibliotecii. **Schimbat în aceeași zi:** la prima
  citire validarea catalogului era la 0.144.0; commitul `b62c771b` a realiniat-o la curent — dar tot
  prin copie, iar până seara biblioteca trecuse la 0.225.2 și copia era din nou în urmă.
- `soplang-words-lib`: **0.225.2**, build `0edcca627270`.
- `psys2/src/vendor/sopworld/provenance.json`: **0.225.2**, commit `ac33216`, copie sincronizată azi
  a `docs/sopworld.mjs`. Dar commitul psys2 `da02e8ec` ține în `src/dialog/new-engine-source.mjs` un
  `libraryPin` la `747b51e` (0.225.1) și un `knowledgePin` la `288699c9`, în timp ce checkout-ul de
  cunoaștere local este la `b62c771b`. Trei referințe, trei stări, într-un singur commit.
- `repos.pin` din bibliotecă pinnează cunoașterea la `a0e8538` (checkout: `b62c771b`) și aplicația la
  `45ac4bf` (checkout: `da02e8ec`). Pinurile sunt utile pentru teste, dar nu sunt un contract de
  compatibilitate și au rămas în urmă față de toate cele trei checkout-uri.
- Bibliotecă și cunoaștere nu au **niciun tag git**. Aplicația are un tag (`pre-tab-cut`).

Ce este greșit:

- **„Funcționează la mine” nu se poate reproduce**. Un utilizator care ia ultima cunoaștere și ultima
  bibliotecă nu are nicio garanție; unul care ia pinul vechi are altă semantică.
- **Vendoring-ul ascunde divergența**. `psys2` nu depinde de un pachet, ci de un fișier copiat manual.
  Când biblioteca se schimbă, copia nu se schimbă decât dacă cineva o copiază.
- **Modulele interne au versiuni independente** (`std.request version=0.198.0`,
  `std.capability version=0.212.0`, `std.instance version=0.208.0`), dar nimic nu le leagă de
  versiunea bibliotecii sau de cea a cunoașterii.

Consecința: cele trei proiecte sunt „legate” prin oameni și prin obiceiuri, nu prin mașină. Orice
generalizare serioasă începe aici.

## 6. Monolitul de distribuție blochează modularizarea

`docs/sopworld.mjs` are **1,70 MB** și 24.860 linii; `src/` are 108 module direct în el
(110 cu `internal/`), din care 109 bundle-uite. `package.json` expune
`./bundle` ca un singur fișier. `README` și `AGENTS.md` tratează „one file, no dependencies” ca pe o
virtute. Pentru un playground și GitHub Pages este o virtute. Pentru un pachet consumat de o aplicație
este o constrângere care se opune oricărei separări.

Dovezi:

- `src/index.mjs` are 77 de linii de `export` și **277 de nume**.
- `psys2` importă **15** nume din bundle.
- `docs/version.md` raportează 109 module bundle-uite, 1.663,2 kB, 466,3 kB gzip.
- Nu există `exports` per subpath (`./core`, `./schema`, `./reader`); doar `.`, `./bundle` și
  `./node/solvers.mjs`. Toate straturile sunt într-un singur punct de intrare.

Ce este greșit:

- **Nu poți livra un subset**. Un consumator care vrea doar `World` + parser primește și `story`,
  `diagram`, `document`, `morph`, `compose`, `kit`.
- **Nu poți face tree-shaking**. Un singur fișier construit închide optimizarea la nivel de modul.
- **Nu poți versiona bucăți**. Orice schimbare în `diagram.mjs` schimbă fingerprint-ul întregului
  bundle, deci și contractul cu aplicația, deși consumatorul nu folosește diagrame.

Consecința: „bibliotecă generală” este de fapt „aplicație monolitică livrată ca fișier”. Separarea pe
care o cer cele trei proiecte nu se poate face fără a sparge build-ul.

## 7. Metoda de lucru produce suprafață, nu nucleu

216 versiuni, 2.928 de linii de changelog, 51 de capabilități documentate (48 de rânduri în tabelul
din README), 277 de exporturi.
Fiecare versiune adaugă o capacitate, un tip de wire, un contract, un export și un rând în tabel.
Nu există o versiune în care să se **elimine** ceva sau să se **stabilizeze** un contract.

Simptome:

- Tabelul de capabilități este mai mare decât API-ul pe care îl folosește aplicația.
- `docs/sopworld.d.ts` are 1.025 linii; fiecare export nou trebuie ținut sincron manual cu
  `src/index.mjs`.
- `CHANGELOG.md` are 216 secțiuni, dar niciun tag și nicio politică de deprecare.
- Testele verifică afirmații din documentație (bine), dar nu există un „contract suite” între
  proiecte (vezi 02).

Ce este greșit: proiectul nu are un **punct de îngheț**. Nu există „core 1.0” cu invarianți pe care
celelalte straturi să se sprijine. Fără el, fiecare generalizare este o rescriere.

## 8. Determinismul promis este subminat de mediu

`SPEC.md` promite: „the same input and state give the same path”. În cod:

- `localeCompare` apare de **15** ori (`turn.mjs:118,122,126,128`, `ground-method.mjs:124,134,137`,
  `align.mjs:41`, `spell.mjs:136`, `summarize.mjs:56`, `compose.mjs:191`, `diagram.mjs:183`,
  `grammar.mjs:148`, `handover.mjs:40`, `ledger.mjs:50`). Rezultatul depinde de ICU și de locale.
- `toLowerCase()` apare de **171** ori (numărat identic la `747b51e` și la `ac33216`; prima ediție a
  raportat 153). Pentru limbile cu reguli speciale (turcă, lituaniană) nu este o operație independentă
  de limbă.
- `Date.now`/`new Date` apar de **14** ori. Fusul orar al hostului poate schimba un plan sau un răspuns.
- `spell.mjs` face fold NFD și elimină diacritice; `ground-method.mjs` face NFC + lowercase. Două
  normalizări diferite în același flux.

Ce este greșit: „determinist” înseamnă determinist **pentru orice mediu**, nu pentru mașina autorului.
Un test care rulează doar în `en-US`, `UTC`, ICU implicit nu dovedește nimic.

## Concluzia secțiunii

Niciunul dintre aceste puncte nu cere rescrierea kernelului. Toate cer însă o **decizie de formă**
înainte de următoarea capacitate:

1. un singur IR de cerere și un singur pipeline;
2. un singur motor de raționament și un singur model de stare;
3. o graniță reală între mecanism și cunoaștere;
4. rezultate structurate, versionate;
5. un contract de versiune între cele trei proiecte.

Fără acestea, următoarea capacitate va fi încă o ramură în `compilePacket` și încă un export în
`index.mjs`.
