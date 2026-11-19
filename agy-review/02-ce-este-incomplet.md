# 02. Ce este incomplet: Funcționalități Neterminate și Schisme Tehnice

Acest document inventariază componentele parțial migrate, mecanismele promise în cărți/specificații dar absente din execuție și „codul zombie” care îngreunează cele trei proiecte.

---

## 1. Fractura Stării Instanțelor (*The Split Instance Model*)

### Starea de Fapt
În specificația teoretică ([`sop-worlds-teorie.md`](../books/sop-worlds-teorie.md)), starea oricărui editor deschis trebuie să fie o **lume-instanță SOP** (`live world`). Orice dreptunghi, cerc, nod de diagramă, paragraf sau eveniment de calendar trebuie să existe sub formă de fire de fapte cu versiune, identitate unică și proveniență.

### Realitatea din Cod
Există o ruptură arbitrară în `psys2`:
* **Avatar** și **Calendar**: au fost migrate pe instanțe SOP (`std.schema`). Starea lor este reprezentată ca fapte SOP Lang, iar acțiunile sunt tranzacții în matricea de consistență.
* **Drawing, Diagram (cu Charts) și Documents**: își mențin încă starea în **obiecte JavaScript brute** (`ctx.state`), manipulate imperativ în `psys2/worlds/art.draw/engine.mjs`, `scene.mjs` și `board.mjs`!

### Consecințe Critice
1. **Deducția cross-editor este blocată**: Motorul `sopworld` nu poate raționa despre elementele grafice din desen (ex. „câte case sunt pe pânză?” sau „este barca pe apă?”) direct prin reguli SOP, deoarece obiectele nu există în universul de fire al lumii, ci într-un array `ctx.state.objects` în memoria JS a tab-ului Drawing.
2. **Undo/Redo fragmentat**: În loc ca Undo să fie o simplă retragere tranzacțională de fire în logul SOP (`world.undo`), `art.draw/board.mjs` menține un tablou propriu de snapshot-uri (`history [max 50]`), ducând la desincronizări între jurnalul logic al asistentului și pânza efectivă.

---

## 2. Gâtuirea SOP-BERT: Incapacitatea de Coordonare și Multi-Target

### Starea de Fapt
SOP-BERT a fost introdus ca o alternativă compactă (DistilBERT) la LLM-uri, specializat pe două roluri:
1. **Cutter**: segmentează mesajul brut în cereri.
2. **Key Reader**: extrage span-urile cheilor semantice (acțiune, tip, culoare, mărime, relație).

### Ce este Incomplet?
1. **Incapacitatea de a citi ținte multiple (*Multi-Target Bottleneck*)**:
   * La cererea *„Draw a circle and a square”*, cutter-ul clasifică întregul text ca o **singură cerere**, iar key reader-ul are un singur slot pentru `target.kind`. Unul dintre substantive este pur și simplu pierdut sau ignorat!
2. **Lipsa ancorelor relaționale multiple**:
   * La cererea *„Put the boat near the house and on the lake”*, arhitectura actuală a reader-ului nu poate asocia două ancore relaționale distincte sub aceeași cerere fără a le suprascrie.
3. **Model marcat ca necalibrat**:
   * Modelele DistilBERT livrate în `psys2/training/sop-bert/` sunt marcate cu statusul `trained-unverified`. Ele nu au fost recalibrate după introducerea noii politici de admitere din `sopworld`, generând erori frecvente la întrebări de existență în care substantivul este pierdut.

---

## 3. Planificatorul HTN (`plan.mjs`) este Deconectat de Uneltele Reale

### Schisma Dintre Teorie și Aplicație
În `soplang-words-lib/src/plan.mjs`, biblioteca dispune de o implementare completă de **Planificare Ierarhică a Rețelelor de Sarcini** (*Hierarchical Task Network - HTN*, inspirată din algoritmul SHOP2, Nau et al. 2003). Acest modul consumă cele 23 de proceduri declarate în `sop-knowledge-worlds/docs/worlds/k.procedures`.

Cu toate acestea:
* **`psys2` NU folosește `src/plan.mjs`!**
* Când `psys2` primește o cerere, el nu apelează planificatorul HTN, ci trece cererea printr-un dispecer procedural propriu: `psys2/src/dialog/declared-candidate-plan.mjs` și `declared-dispatch.mjs`.
* Dispecerul din `psys2` mapează rutele pe 5 interpretoare hardcodate (`declared-execution.mjs:29`):
  ```javascript
  const interpreters = new Map([
    ['query', { run: executeNativeQuery }],
    ['history', { run: executeHistoryRequest }],
    ['spatial', { run: executeSpatialPlacement }],
    ['capability', { run: executeNativeCapability }],
    ['reject', { run: unavailable }],
  ]);
  ```
* **Verdict**: Întreaga teorie a procedurilor declarative din `k.procedures` și algoritmul HTN din `plan.mjs` trăiesc într-o bulă academică, complet izolate de execuția reală din asistent!

---

## 4. Absența Fluxului de Date între Unelte (*Cross-Tool Dataflow*)

### Scenariul Promis
Unul dintre obiectivele cheie menționate în carte este execuția lanțurilor compuse de sarcini între editoare:
$$\text{Calendar (extragere ședințe)} \longrightarrow \text{Diagram/Chart (agregare grafică)} \longrightarrow \text{Document (inserare raport)}$$

### Ce Lipsește în Cod
1. **Lipsa ieșirilor tipizate cu legare automată**: Nu există un mecanism prin care rezultatul returnat de o unealtă (`receipt.data`, ex. o listă de evenimente) să fie publicat ca un set de fire tipizate în lumea-instanță, astfel încât o unealtă subsecventă (Chart) să-l poată primi ca argument pe baza compatibilității de tip (`type=list<event>`), fără intervenție manuală.
2. **Lipsa tranzacționalității cross-editor**: Dacă pasul 3 (inserarea în document) eșuează, nu există un mecanism integrat de compensare sau rollback care să readucă toate cele trei editoare la starea inițială într-un singur pas atomic de Undo.

---

## 5. Referințe pe Mulțimi și Cuantificatori Neimplementate

### Ce Funcționează Azi
* Rezolvarea referințelor pronominale singulare: „it” (leagă la ultimul obiect din focus), „the other one” (exclude primul candidat și alege alternativa #2).

### Ce Este Incomplet
* **Cuantificatori universali și existențiali**: „Șterge toate cercurile”, „Mărește fiecare casă”. Sistemul nu știe să instanțieze o buclă de execuție peste un set de obiecte determinate declarativ.
* **Referințe ordinale**: „A doua casă”, „penultimul rând”.
* **Filtrare relațională compusă**: „Selectează cercul roșu care se află deasupra pătratului albastru”. Astăzi, această cerere este respinsă de compiler cu `request-root` sau `unsupported-projection`.

---

## 6. Cod Zombie și Reziduuri Istorice

Baza de cod a celor trei proiecte conține mii de linii de cod mort sau depreciat, care induc în eroare colaboratorii și încetinesc testele:

1. **`psys2/src/formalizer/` (5.700 rânduri)**:
   * 19 fișiere (`nx.mjs`, `ort-client.mjs`, `dispatcher-runtime.mjs` etc.) ce aparțin vechii arhitecturi de dinainte de trecerea la SOP-BERT. Deși nu mai fac parte din nucleul de execuție curent, sunt menținute în arborele de cod.
2. **`psys2/src/translate/` (8.500 rânduri)**:
   * Un sistem paralel de traducere și generare canonică EN-RO (`canonical.en-ro.mjs`, `candidates.mjs`) care dublează funcționalitățile din `w.lang.ro` și `w.lang.en`.
3. **Cititorul pe gramatică vechi din `soplang-words-lib`**:
   * `src/grammar.mjs`, `src/grammar-request.mjs`, `src/grammar-overlay.mjs`, `src/grammar-compose.mjs`. Acestea implementau un parser sintactic/gramatical în SOP înainte de adoptarea modelului SOP-BERT + `request-compiler.mjs`. În prezent, sunt utilizate sporadic în teste vechi, dar consumă mii de linii în bundle-ul monolitic `sopworld.mjs`.
