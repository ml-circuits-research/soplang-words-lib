# 01. Ce este greșit în abordare: Deficiențe Fundamentale și Anti-Pattern-uri

Acest document analizează deciziile arhitecturale greșite, scurgerile de abstractizare și tiparele anti-inginerie identificate în interacțiunea dintre `soplang-words-lib`, `sop-knowledge-worlds` și `psys2`.

---

## 1. Scurgerea Semanticii în JavaScript (*Leaky Abstraction*)

### Problema
Deși principiul fondator al proiectului este **„Mai puțin JavaScript, mai multă cunoaștere”**, în realitate sute de decizii semantice critice sunt luate prin cod procedural JavaScript în `psys2`. Biblioteca `sopworld` este ocolită exact acolo unde ar trebui să fie suverană: la rezolvarea lexicală, completarea valorilor implicite și decizia în caz de ambiguitate.

### Dovezi din Cod

#### A. Filtrarea euristică arbitrară din `psys2/src/dialog/project-query-action.mjs` (L103–105)
```javascript
for (const {mapping, operation} of nativeCreationCandidates(bindings, host.bindings(), readerArea)) {
  budget.tick('query-reading.kinds');
  if (!operation.params.kind?.enum?.includes(mapping.lemma) || mapping.lemma.length > 64) continue;
  choices.set(JSON.stringify([mapping.canonical, mapping.lemma]), {
    canonical: mapping.canonical, lemma: mapping.lemma, otherType: Number(mapping.type !== target.type)
  });
}
```
Și mai grav: în fluxul de potrivire, o distanță Levenshtein este plafonată rigid la valoarea fixă `2` în JS.
* **Consecință directă**: La introducerea cuvântului „man”, candidatul semantic natural *person* (distanță lexicală mare, dar distanță semantică = 1 în ontologie) este eliminat înainte de faza de selecție! Sistemul păstrează candidați ortografici absurzi precum *moon* și *sun*.
* La cuvântul „cap”, egalitatea dintre *cat* și *car* este decisă mecanic de ordinea de iterare a proprietăților din obiectul JS, fără nicio legătură cu contextul scenei (dacă pe pânză există deja o pisică).

#### B. Tabele statice de vocabular în `psys2/worlds/art.draw/engine.mjs` (L35–55)
```javascript
export const KIND_WORDS = {
  house: 'house', home: 'house', cottage: 'house', hut: 'house', 
  tree: 'tree', pine: 'tree', palm: 'tree', sun: 'sun', cloud: 'cloud',
  car: 'car', automobile: 'car', truck: 'car', flower: 'flower', ...
  cat: 'cat', kitten: 'cat', kitty: 'cat', dog: 'dog', puppy: 'dog',
  boat: 'boat', ship: 'boat', sailboat: 'boat', yacht: 'boat', ...
};
```
* **Consecință directă**: Sinonimia, hiponimia și termenii de categorie sunt scrise manual într-un dicționar JS. Dacă în `sop-knowledge-worlds/docs/worlds/k.objects` se adaugă un concept nou (ex. `cabin` ca sub-tip de `house`), editorul Drawing habar nu are de el până când un dezvoltator nu modifică manual fișierul JavaScript `engine.mjs`!
* Același lucru este valabil pentru regexul de apă/ocean din Drawing și `KIND_ORDER` din `scene.mjs`.

#### C. Puntea procedurală hibridă din `psys2/src/dialog/lexical-grounding.mjs` (L22–43)
```javascript
// În loc ca World să consulte k.* nativ prin matrici de consistență:
async function knowledgeEdges(knowledge, mention, policy) {
  // ... buclă async JS care face interogări succesive knowledge.thing(term)
  let thing = await knowledge.thing(term);
  for (const wire of thing?.wires ?? []) {
    for (const relation of policy.follow) {
      for (const value of wire.f[relation] ?? []) {
        edges.set(term + '\0' + relation + '\0' + to, { from: term, to, relation });
      }
    }
  }
}
```
* Aplicația face manual traversal de graf în JavaScript pe fișierele de cunoaștere, construiește un string de fire (`std.ground.edge`, `std.ground.candidate`), apelează `world.compileRequest(input)`, iar apoi parsează textul SOP înapoi în obiecte JS!
* **Verdict**: Aceasta nu este o arhitectură declarativă, ci un „wrapper” procedural greoi peste un format de date numit SOP.

---

## 2. Capcana „Single-Root” în Compilatorul de Cereri

### Problema
În `soplang-words-lib/src/request-compiler.mjs` (L39–41):
```javascript
function compileSingle(world, wires) {
  const contexts = wires.filter(w => ['std.placement.context','std.capability.context'].includes(w.type));
  const nodes = wires.filter(w => !contexts.includes(w));
  const roots = nodes.filter(w => w.type === 'std.request');
  if (roots.length !== 1 || contexts.length > 1) return fail('request-root');
  // ...
```

### De ce este greșit fundamental?
1. **Incompatibilitate cu limbajul natural**: Oamenii nu vorbesc în comenzi atomice de micro-instrucțiuni. Oamenii spun frecvent:
   * *„Draw a blue circle and a green square”* (două acțiuni de creare concomitente).
   * *„Move the car to the right and make it red”* (acțiune compusă: translație + schimbare atribut).
   * *„Delete all triangles and center the house”* (acțiune secvențială coordonată).
2. **Blocaj arhitectural**: Forțând un singur root (`roots.length !== 1 => fail('request-root')`), compilatorul obligă nivelurile superioare (SOP-BERT și dialogul) să devină extrem de simplificate sau să recurgă la spargeri artificiale în JavaScript, pierzând atomicitatea tranzacției și contextul comun al frazei.

---

## 3. Silozuri de Compilare în loc de Satisfacere Unificată de Constrângeri (CSP)

### Problema
În loc să existe o singură buclă de raționament care rezolvă simultan tipul acțiunii, țintele, valorile lipsă și constrângerile de plasare, `request-compiler.mjs` bifurcă în metode izolate:
* `compileGrounding`
* `compileChoice`
* `compileCapabilityCircuit`
* `placementCircuit`

```javascript
// soplang-words-lib/src/request-compiler.mjs (L64-68)
if (context?.type === 'std.capability.context') return compileCapabilityCircuit(fork, root, nodes, context);
if (context?.type === 'std.placement.context' && nodes.some(w => w.type === 'std.request.constraint' && w.attrs.operator?.[0] === 'relation')) {
  return placementCircuit(fork, root, nodes, context);
}
return compileRuleCircuit(fork, root.id, nodes) ?? '@compile.result std.compile.result status=not-applicable reason=no-method\n';
```

### Consecințe Catastrofale în `placement-method.mjs`
În `soplang-words-lib/src/placement-method.mjs`:
```javascript
function perform(world, request, nodes, context, method) {
  const targets = nodes.filter(w => w.type === 'std.request.target');
  const relation = one(nodes.filter(w => w.type === 'std.request.constraint'));
  if (!relation || ...) ...
```
* Observați expresia: `relation = one(...)`! Compilatorul de plasare este scris să accepte **exact o singură relație**!
* Dacă utilizatorul cere: *„Pune barca între lac și copac”* (două ancore) sau *„Pune masa lângă fereastră și sub ceas”* (două relații), algoritmul crapă sau respinge cererea.
* În plus, deși `soplang-words-lib/src/solve.mjs` conține un solver complet CDCL (Clause-Learning SAT solver) pentru domenii finite (`Problem`), `placement-method` și `capability-method` **nu folosesc deloc acest solver**! Ele își rulează propriile bucle ad-hoc de căutare brută și generare de candidați.

---

## 4. Pseudo-Declarativism în Generarea Cunoașterii

### Problema
Depozitul `sop-knowledge-worlds` se prezintă ca o bibliotecă ontologică în SOP Lang. În realitate, o mare parte a cunoașterii nu este reprezentată ca axiome sau reguli de inferență, ci este generată mecanic prin **28 de scripturi procedurale Node.js** înlănțuite în `package.json`:

```json
"build": "node tools/render-svg.mjs && node tools/render-scenes.mjs && node tools/check-preview-page.mjs && node tools/derive.mjs && node tools/geo-aliases.mjs && node tools/joins.mjs && node tools/attributes-glosses.mjs && node tools/kinds-core.mjs && node tools/relations-core.mjs && node tools/joins-report.mjs && node tools/structures-core.mjs && node tools/diagram-topics.mjs && node tools/expect-core.mjs && node tools/narration-core.mjs && node tools/lang-en-diagram-frames.mjs && node tools/lang-en-person-frames.mjs && node tools/outlines-core.mjs && node tools/lang-en-shape-frames.mjs && node tools/lang-en-list-frames.mjs && node tools/lang-en-arithmetic.mjs && node tools/lang-en-time-frames.mjs && node tools/lang-en-variants.mjs && node tools/lang-en-closed.mjs && node tools/lang-en-core.mjs && node tools/lang-en-catalog-plurals.mjs && node tools/lang-en-morph.mjs && node tools/forms-report.mjs && node tools/sensitive-core.mjs && node tools/counts.mjs && node tools/build-catalog.mjs"
```

### De ce este greșit?
1. **Fragilitate extremă la sincronizare**: Scriptul `tools/sync.sh` trebuie să verifice dacă sistemul are minim `3000 MB` RAM liber înainte de a rula regenerarea, reîncercând de până la 4 ori dacă procesul este ucis de OOM Killer!
2. **Inversiune de roluri**: În loc ca motorul de inferență `sopworld` să aplice reguli declarative (`core.rule`) la încărcare sau să deriveze relații prin unificare, zeci de scripturi JS parsează fișiere, calculează derivate și rescriu fișiere `.sop` gigantice.
3. Cunoașterea devine „coaptă” (pre-baked) și rigidă, pierzându-și flexibilitatea contextuală.

---

## 5. Monolitul Distribuit și Iadul Vendoring-ului

### Problema
Sistemul este împărțit în trei depozite git distincte, dar managementul dependențelor este realizat printr-un anti-pattern de tip **„Copy-Paste Vendoring de Fișier Monolitic”**:
* `soplang-words-lib` compilează totul într-un singur fișier: `docs/sopworld.mjs` (1.702.332 octeți, ~1.7 MB, 24.000+ linii).
* Acest fișier este copiat brut în:
  * `psys2/src/vendor/sopworld/sopworld.mjs`
  * `sop-knowledge-worlds/tools/sopworld/sopworld.mjs`

### Divergența Catastrofală a Versiunilor (*Version Drift*)
O analiză atentă a fișierelor de configurare relevă un decalaj periculos:
* **`soplang-words-lib`**: versiunea `0.225.1` (commit `747b51e`)
* **`psys2`**: importă release `0.225.1` (conform `provenance.json`)
* **`sop-knowledge-worlds`**: este blocat la `VERSION: 0.144.0` (commit `94cffa2e6b5bde4353d4174c0e12eb271b10eb5b`, datat 15 noiembrie 2026)!

```
[sop-knowledge-worlds/tools/sopworld/VERSION]
version: 0.144.0
commit: 94cffa2e6b5bde4353d4174c0e12eb271b10eb5b
```

* **Consecință**: Între `0.144.0` și `0.225.1` au existat peste 80 de versiuni minore, cu modificări de indexare a join-urilor, corecții de memorie (`memoPerWorld`), schimbări în tipurile `std.request.*` și `std.ground.*`. Cataloagele din `sop-knowledge-worlds` sunt validate și testate contra unui motor învechit, dar sunt consumate de `psys2` cu motorul nou!

---

## 6. Rigiditate Binară: „Totul sau Nimic” în loc de Abducție Continuă

### Problema
Compilatorul actual acționează preponderent ca un filtru binar de validare: dacă o singură cheie lipsește sau un slot nu are valoare certă, aruncă imediat `status=unavailable reason=...`.

### Lipsa Ipotezelor Active
Într-un asistent inteligent (System 2):
* Când utilizatorul spune *„Mută cercul”*, iar pe ecran sunt trei cercuri, sistemul nu trebuie să refuze sau să aleagă aleatoriu primul element din memorie.
* Sistemul trebuie să genereze o ierarhie de ipoteze ponderate (Weighted Abduction), să execute cea mai probabilă ipoteză (ex. cel aflat în focus sau cel mai recent creat), menținând explicit celelalte ipoteze în registrul dialogului (`turn journal`).
* Astfel, când utilizatorul reacționează prin *„Nu, celălalt!”*, sistemul nu reia parsingul de la zero, ci pur și simplu invalidează prima ipoteză și trece la candidatul #2 deja structurat.
* În arhitectura curentă din `psys2`, acest mecanism a fost parțial schițat în `foreign-reading.mjs` și `project-query-action.mjs`, dar este rupt de motorul central `sopworld` și implementat fragmentat în JS.
