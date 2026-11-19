# 03. Ce ar putea fi făcut mai bine: Inginerie, Performanță și Arhitectură Practică

Acest document propune soluții concrete de inginerie software pentru a transforma prototipurile fragile actuale într-un sistem robust, modular și scalabil.

---

## 1. Migrarea la Monorepo și Modularizarea Nucleului

### Situația Actuală
* Trei depozite git separate (`psys2`, `sop-knowledge-worlds`, `soplang-words-lib`).
* Un fișier uriaș de 1.7 MB (`sopworld.mjs`) copiat manual între foldere.
* Dependențe desincronizate și incompatibilități tăcute de versiuni.

### Soluția Recomandată: Workspace Monorepo (pnpm / npm)
Unificarea celor trei proiecte într-un singur spațiu de lucru (*monorepo*):
```
sopworld/
├── packages/
│   ├── core/               # Parser, AST, matrici, fapte, tranzacții, reguli, denies
│   ├── solver/             # Motor CDCL, nogoods, CSP geometric și domeniu finit
│   ├── compiler/           # Compilatorul unificat de cereri (CSP + HTN)
│   ├── catalog/            # Loader, cache și indexare pentru lumi de cunoaștere
│   └── knowledge/          # Ontologiile k.* și schemele w.* (fostul sop-knowledge-worlds)
├── apps/
│   └── psys2/              # Aplicația webchat, editoarele, UI și modelele neuronale
└── tools/
    └── eval-suite/         # Suita end-to-end de benchmark și evaluare continuă
```

### De la Monolitul de 1.7 MB la Module Suple (*Tree-Shaking Real*)
* În loc ca `psys2` să importe un monolit ce include și vechile gramatici, și compunerea de povești, și sintetizatorul de fațete, aplicația trebuie să poată importa doar:
  ```javascript
  import { World } from '@sopworld/core';
  import { UnifiedCompiler } from '@sopworld/compiler';
  ```
* Dimensiunea pachetului livrat în browser poate scădea astfel de la **1.7 MB** la sub **180 KB** gzipped!

---

## 2. Optimizarea Catalogului de Cunoaștere și a Memoriei

### Situația Actuală
* Rularea `tools/sync.sh` în `sop-knowledge-worlds` necesită **minim 3000 MB RAM liber**, verificat prin `/proc/meminfo`.
* Procesul de build rulează 28 de scripturi Node.js independente, fiecare pornind un proces separat și re-parsând de la zero mii de fișiere `.sop`.
* Cataloagele JSON generate sunt enorme: `vocab-kinds.json` (4.9 MB), `vocab.json` (3.5 MB), `index.json` (1.8 MB).

### Îmbunătățiri Urgente

#### A. Pipeline Unificat de Build Incremental
* Înlocuirea celor 28 de scripturi înlănțuite cu un singur pipeline de build incremental (ex. scris în Node.js cu graf de dependențe DAG sau folosind un tool precum `tsup`/`esbuild`).
* Fișierele neschimbate nu trebuie re-parsate. Se calculează hash-ul conținutului (SHA-256) per shard, actualizând doar intrările afectate.

#### B. Indexare Eficientă pentru Browser (SQLite / IndexedDB / FlatBuffers)
* În loc ca browserul să descarce și să parseze în memorie un JSON de 4.9 MB (`vocab-kinds.json`) la inițializare:
  1. Folosirea unui format indexat compact (precum SQLite compilat în WebAssembly sau un index binar B-Tree peste IndexedDB).
  2. Încărcare leneșă (*lazy on-demand*): când utilizatorul folosește cuvântul „barcă”, sistemul interoghează doar indexul pentru „boat”, aducând exclusiv shard-ul relevant din `k.objects` și `k.drawing`, fără a încărca anatomia mâinii (`k.body`) sau scalele muzicale (`k.music`).

---

## 3. Explicabilitate și Tracing de Prim Rang (*First-Class Observability*)

### Situația Actuală
Când compilatorul eșuează, el returnează coduri opace de eroare:
```
@compile.result std.compile.result status=unavailable reason=request-root
@compile.result std.compile.result status=not-applicable reason=no-method
```
Nici utilizatorul, nici dezvoltatorul nu pot înțelege de ce cererea a fost refuzată:
* Ce operații au fost luate în considerare?
* Ce parametru obligatoriu a lipsit?
* Ce constrângere a fost încălcată?

### Soluția: Arbori de Decizie Semantici Explicați
Fiecare pas din rezolvarea unei cereri trebuie să genereze o structură de justificare (*justification trace*):
1. **La alegerea țintei (`std.choice`)**:
   ```json
   {
     "candidate": "house_1",
     "rank": 2,
     "lostTo": "fish_1",
     "criterion": "recency_focus",
     "why": "fish_1 was selected in the previous turn"
   }
   ```
2. **La potrivirea operației (`std.capability`)**:
   * Dacă lipsește un parametru, trace-ul raportează: `missing_parameter: 'color', available_defaults: ['#228B22' from k.objects.tree]`.
3. **În UI**: Asistentul poate formula direct un răspuns uman inteligibil:
   > *„Am presupus că vrei să colorezi peștele, fiind ultimul selectat. Dacă voiai casa, spune 'nu, casa'.”*

---

## 4. Pipeline de Evaluare Continuă Cap-Coadă (*The Golden Benchmark*)

### Situația Actuală
* Testele din `soplang-words-lib` (`cases/baseline.json`) conțin doar **61 de cazuri** sintetice, testate în principal pe fire mock.
* Testele din `psys2` (`scripts/test-new-engine.mjs`) sunt greoaie, lente și amestecă verificări de interfață cu aserțiuni semantice.

### Soluția Recomandată: Suită de Evaluare de 300+ Cazuri Reale
Crearea unei suite independente de teste end-to-end, formată din 300–500 de comenzi în limbaj natural autentic, acoperind cele cinci taburi (Drawing, Diagram, Documents, Calendar, Avatar):
* Fiecare caz de test definește:
  1. **Stare inițială**: Fișier SOP de instanță (ex. o pânză cu o casă roșie și un copac).
  2. **Intrare text**: „Make the tree bigger and move it near the house”.
  3. **Graf de cerere așteptat**: Structura generată de SOP-BERT.
  4. **Circuit de apeluri compilat**: Instrucțiunile generate de `sopworld`.
  5. **Stare finală observată**: Aserțiuni exacte pe geometria și atributele rezultate pe pânză / în editor.
* Această suită rulează în CI la fiecare pull request. Orice regresie este detectată instantaneu pe comportamentul real al utilizatorului, nu pe mock-uri interne.

---

## 5. Optimizarea Memoriei: Eliminarea Clonării Masive (`World.fork`)

### Problema
În `request-compiler.mjs`, `placement-method.mjs` și `choice-method.mjs`, pentru fiecare încercare de potrivire sau simulare se apelează:
```javascript
const fork = world.fork();
const admitted = fork.tell(wires, { factsOnly: true });
```
Într-o sesiune de căutare a plasării sau a unificării de capabilități, `world.fork()` poate fi apelat de sute de ori. Deși `fork()` folosește tehnici de partajare, el alocă obiecte noi de tip `World`, `Map` și `Set` pentru tranzacții temporare, provocând pauze periodice de Garbage Collection în browser.

### Soluția: Tranzacții Scratch cu Rollback Direct
* În loc de clonarea întregii lumi (`fork`), `World` trebuie să suporte o zonă tranzacțională scratch (*lightweight trial transaction*):
  ```javascript
  world.trial(() => {
    world.pushFacts(candidates);
    const valid = world.checkConsistency();
    return { valid, score: world.evaluateObjective() };
  }); // Toate faptele de test sunt retrase automat prin pointeri de rollback, fără alocări de lumi noi.
  ```
* Această abordare reduce alocările de memorie cu peste **80%** în timpul rezolvării cererilor complexe.
