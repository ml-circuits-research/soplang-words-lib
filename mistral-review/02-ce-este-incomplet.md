# 02. Ce este incomplet

Această secțiune nu repetă critica de formă din 01. Ea enumeră **capacitățile și contractele care
lipsesc** și, pentru fiecare, dovada că lipsesc, nu doar o impresie.

## 1. Cereri compuse și flux de date între unelte

**Ce există:** `prepareRequestBatch` validează un DAG de cereri și calculează layere topologice
(`src/request-batch.mjs:8-31`). `requestBatchFrontier` spune ce este gata, ce așteaptă și ce este
blocat (`src/request-batch.mjs:34-50`).

**Ce lipsește:** legarea **rezultatelor** unei cereri la **intrările** altei cereri. Batch-ul are
`after` (ordine), dar nu are `from` (date). Documentația o spune explicit: „No implicit sequence,
cross-entry target binding, host capability promise or execution is introduced”
(`docs/reference.md`, secțiunea `prepareRequestBatch`). `std.request` nu are un tip de rezultat
referențiabil; `std.request.constraint` are `phase=result` doar pentru `occurred`
(`src/contracts.mjs:488`), nu pentru „valoarea produsă de pasul anterior”.

**De ce contează:** scenariul de referință din `psys2/current-status.md` — Calendar → grupare → grafic
→ document — nu poate fi exprimat în IR. Aplicația îl compune în JavaScript, ceea ce mută din nou
decizia în afara bibliotecii. `refactoring/request-to-executable-circuits.md` listează „Connect
declared data dependencies across editor tools” ca item deschis.

**Ce ar trebui să existe:** un port tipizat pe fiecare pas (`result: <tip>`) și un operator de
legare (`bind`) validat de contract, astfel încât batch-ul să poată fi executat fără cod specific.

## 2. Plasare relativă și constrângeri multiple

**Ce există:** `placementCircuit` rezolvă o relație între exact două ținte, cu o singură
constrângere de tip `relation` (`src/placement-method.mjs:52-64`). Acceptă doar `mood=do`,
`polarity=positive` și refuză selectori, `from`, `to`, `unit`, `measure`, `anchor`, `baseline`,
`phase`.

**Ce lipsește:**

- mai multe ancore simultan („între casă și lac”, „lângă fereastră, dar nu pe ea”);
- constrângeri cantitative (distanță, aliniere, ordine, înălțime relativă);
- plasare relativă la un lucru care se mișcă sau la o relație care se schimbă;
- păstrarea stilului și a părților atașate la mutare.

**Dovada că este recunoscut:** `refactoring/request-to-executable-circuits.md` are secțiunea
„Complete implicit and relative placement” cu cinci verificări deschise. `current-status.md` spune
„relative placement” la „Still open”.

**De ce contează:** plasarea este cazul canonic în care un limbaj declarativ ar trebui să bată codul
imperativ. Dacă rămâne un caz special cu două ținte, teza „deciziile în SOP, nu în JS” nu este
dovedită.

## 3. Cuantificatori, grupuri și selectori: contract fără compilator

**Ce există:** `std.request.quant`, `std.request.group`, `std.request.not` și `std.request.target.selector`
sunt declarate în contract (`src/contracts.mjs:465-488`). `inspectRequest` le validează structural
(`src/request-contracts.mjs`).

**Ce lipsește:** compilatoarele nu le acoperă uniform. `placement-method.mjs` refuză orice target cu
`selector`; `capability-method.mjs:105` cere exact un target; `choice-method.mjs` are propriul model
de opțiuni. Nu există un test care să spună „pentru fiecare combinație de quant/group/selector,
compilatorul produce un plan sau un refuz tipizat”.

**De ce contează:** contractul promite mai mult decât poate executa. Un utilizator care scrie
„toate casele, în afară de cea roșie” poate trece validarea structurală și apoi primește
`request-shape` sau `unavailable`, fără explicație. Este mai rău decât un contract mai mic, pentru că
pare suportat.

## 4. Tranzacții și undo între unelte

**Ce există:** `toolTimeline` ține un plan ca un pas de undo (`src/tool.mjs`), iar `World.act` are
tranzacții. `requestBatchFrontier` distinge `confirmed`, `unverified`, `refused`, `failed`, `unknown`.

**Ce lipsește:**

- un pas compus din mai multe unelte nu are un singur undo dacă a doua unealtă eșuează după ce prima
  a reușit;
- nu există compensare declarată („dacă `add` a reușit și `style` a eșuat, șterge ce ai adăugat”);
- nu există un contract de „efecte reziduale” atunci când compensarea nu poate readuce starea.

**Dovada:** `refactoring/request-to-executable-circuits.md` cere explicit „Verify recovery for
dependent calls, including a changed precondition before dispatch, failure after an earlier call
succeeds, and compensation that cannot restore the full state.”

**De ce contează:** fără asta, cererile compuse nu pot fi sigure. Utilizatorul vede o acțiune parțială
și nu are un buton de undo care să o anuleze.

## 5. Starea aplicației este încă împărțită

**Ce există:** `serializeInstanceState` / `readInstanceState` / `instanceStateWorld`
(`src/instance-state.mjs`) oferă un codec pentru instanțe. Calendar și Avatar din `psys2` folosesc
stare SOP.

**Ce lipsește:** Drawing, Diagram și Documents își țin starea în obiecte JS (`ctx.state`), nu în
fire. Consecințe:

- Undo/Redo nu este uniform între taburi;
- serializarea și restaurarea nu sunt uniforme;
- deducția din bibliotecă nu vede starea reală a desenului sau a documentului;
- testele de browser trebuie să cunoască două modele.

**Dovada:** `psys2/current-status.md` listează migrarea ca lucru rămas; `agy-review/02` o spune la fel.
Nu este o problemă de „feature”, este o problemă de contract: biblioteca are un codec, aplicația nu îl
folosește peste tot.

**De ce contează:** promisiunea „o lume vie” este încălcată exact în locurile în care utilizatorul
vede cel mai mult: desenul, diagrama, documentul.

## 6. Diagnostic și explicație pentru eșec

**Ce există:** `world.explain`, `world.why`, `describe`, `diff`, `history` pentru starea kernelului.
Rezultatele de compilare au `evidence` în `rule-circuit.mjs`.

**Ce lipsește:** un diagnostic de compilare cu:

- etapa (`parse`, `contract`, `admission`, `search`, `emit`);
- cod stabil, nu string liber;
- span în textul sursă;
- lista candidaților și motivul pentru care fiecare a fost eliminat;
- alternativa selectată și costul;
- sugestia de reparare.

Astăzi `fail('request-root')` este tot ce primește apelantul (`request-compiler.mjs:40`). Unele ramuri
au `assessment` și `alternative`, altele nu. Nu există un tip comun.

**De ce contează:** „self-consistent micro-worlds” înseamnă și „refuzul este explicabil”. Fără
diagnostic, utilizatorul nu poate învăța din refuz, iar dezvoltatorul nu poate reproduce un bug din
producție.

## 7. Performanță: cold start, caching și index

**Ce există:** `createCatalog` citește shard-uri leneș, cu cache și promisiuni deduplicate
(`src/knowledge.mjs`). `memoPerWorld` cache-uiește pe `world.version`.

**Ce lipsește:**

- `compileRequest` nu are cache; fiecare cerere reface parse, fork, admitere și căutare. Nu există o
  cheie `(world.stamp, requestHash, catalogVersion)`.
- `compileKnowledgeProjection` este async, dar restul pipeline-ului este sync; nu există un snapshot
  consistent între momentul în care se citește profilul și momentul în care se încarcă catalogul.
- Catalogul are un index monolitic: `index.json` 1,73 MB, `vocab.json` 3,37 MB,
  `vocab-kinds.json` 4,69 MB. Pentru o singură căutare de cuvânt, browserul poate descărca ~9,8 MB.
- `psys2/current-status.md` raportează că, atunci când indexul a fost întârziat deliberat cu 11,5 s,
  turul obișnuit „Add a circle” a terminat în 11,67 s. Nu este un cold start măsurat în producție,
  dar arată că un index mare poate domina răspunsul.

**De ce contează:** un index de 9,8 MB este descărcat ca un tot pentru o singură căutare. Chiar dacă
cei 11,67 s au fost măsurați cu o întârziere indusă, experimentul arată că timpul de răspuns depinde
de index, nu de mărimea cererii.

## 8. Tipuri și contracte: d.ts, runtime, versiuni

**Ce există:** `src/index.d.ts` (1.025 linii), contracte runtime opt-in în `src/contracts.mjs`,
teste care compară numele din documentație cu biblioteca.

**Ce lipsește:**

- tipuri per modul și per pachet; astăzi un singur `index.d.ts` pentru 277 de exporturi;
- verificare statică a shard-urilor de cunoaștere împotriva propriei versiuni de modul;
- un test care să ruleze **aceeași** suită de contracte pe bibliotecă, pe cunoaștere și pe aplicație;
- un contract de compatibilitate între `std.request version=0.198.0` și biblioteca 0.225.1.

**De ce contează:** `version=` fără verificare este documentație, nu contract. Un shard valid azi poate
fi invalid mâine fără ca nimeni să afle până la runtime.

## 9. Testarea cross-proiect

**Ce există:** 1022 de teste în bibliotecă (1020 pass), 3267 în cunoaștere (3237 pass), o suită de
aplicație cu sute de teste. Testele din bibliotecă verifică afirmații din documentație; cele din
cunoaștere validează fiecare shard.

**Ce lipsește:**

- un corpus **golden** comun: text → cerere → plan → apel → efect → răspuns, rulat pe cele trei
  proiecte la aceleași commituri;
- un test de compatibilitate matriceală: bibliotecă `X` × cunoaștere `Y` × aplicație `Z`;
- un test de determinism sub `TZ` și `LANG` diferite;
- un test de „același rezultat cu și fără cache”;
- un test de „refuzul este stabil între versiuni” (codurile de motiv nu sunt versionate).

Rularea locală de azi: biblioteca verde, cunoașterea verde, aplicația cu 3 eșecuri în exportul
SOP-BERT. Asta nu dovedește că integrarea este verde; dovedește că fiecare proiect are propriul gate.

## 10. Modelul de încredere

**Ce există:** bugete pentru buclele bibliotecii, verificarea răspunsurilor solverului prin oracle,
`factsOnly`, `strict`.

**Ce lipsește:**

- un contract de sandbox pentru funcțiile host: `fns`, `actions`, `producers` sunt JavaScript arbitrar;
  `SPEC.md` recunoaște că bugetul nu acoperă o funcție care buclă singură;
- verificarea integrității catalogului: `index.json` are un câmp `sopworld`, dar nu are semnătură sau
  hash per shard;
- separarea „date de încredere” de „date neverificate” în rezultatul compilării;
- un mod `strict` care să refuze funcții host nedeterministe sau care ating starea globală.

**De ce contează:** într-o aplicație care încarcă cunoaștere de pe GitHub Pages, „catalogul este
adevărul” este o presupunere de securitate, nu doar de design.

## Rezumat: ce este „incomplet” în sens tare

Nu lipsesc funcții izolate. Lipsesc **contractele** care fac funcțiile compunebile:

| Contract | Stare |
| --- | --- |
| IR de cerere cu rezultate referențiabile | lipsește |
| Plan executabil cu efecte și compensare | parțial (`runPlan`, dar fără compensare) |
| Diagnostic structurat | lipsește |
| Versionare între proiecte | lipsește |
| Cache și snapshot consistent | lipsește |
| Corpus golden cross-proiect | lipsește |
| Sandbox/trust pentru host | lipsește |

Următoarea capacitate adăugată fără aceste contracte va fi încă o excepție.
