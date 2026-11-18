# SOP Worlds: teoria

*SOP Worlds: the architectural and semantic contract. Examples use English identifiers and declared SOP Lang schemas.*

---

# 1. From a human request to concrete tool calls

## 1.1 Purpose and responsibility

A person can manipulate Drawing, Diagram (including charts), Documents, Calendar and Avatar with either editor controls or ordinary language. Both paths must reach the same public tool interfaces and change the same instance worlds. These five editors are examples, not a fixed vocabulary built into the reasoning engine.

**SOPWorlds LIB turns a high-level request circuit into a concrete SOP Lang circuit of tool calls. A plan is this circuit: operations, typed arguments, dependencies and result bindings. Tools execute their individual calls; they do not interpret the plan or decide what the person meant.**

The reader identifies what the words express. It preserves targets, counts, relations, conditions, negation, coordination, source spans and uncertainty. It does not invent coordinates, resolve a pronoun from hidden UI state or decide which calendar object exists. The library elaborates that reading using declared schema worlds, knowledge worlds and live instance worlds. This is a compiler-like process with state-dependent binding, constraint solving and planning, rather than a text-to-tool string template.

There are two families of JavaScript responsibility:

| Family | Responsibility | What belongs in SOP worlds instead |
|---|---|---|
| Generic SOPWorlds LIB mechanisms | Load and validate worlds; match rules; bind references; generate and rank hypotheses; solve declared constraints; build and schedule call circuits; observe effects and retain evidence/history. A reader adapter preserves typed model output. | Domain meanings, preferred placements, concept/property mappings, relevance, defaults, operation applicability and semantic decompositions. |
| Concrete tools and adapters | Render or edit an object, store an event, measure geometry, run a typed numerical primitive, perform model inference, receive pointer input or access storage. | Choosing what “big”, “the other one”, “a house” or “next week” means, and deciding which object or operation a vague request denotes. |

Application assembly connects worlds, interfaces and UI. It must not become a third reasoning engine. Moving a sentence-specific branch into the library, or naming a JS handler from a SOP declaration, does not make that branch a general mechanism. A reusable numerical solver is legitimate native code; a handler that silently chooses a domain-specific size or target is hidden semantic policy.

## 1.2 What a world contributes

A **schema world** declares allowed fact types, keys, value domains, references and invariants. A **knowledge world** declares reusable meanings, rules, constructions, preferences and completion constraints. An **instance world** records concrete objects and their current relationships. A project world connects instances to the schemas, knowledge and capabilities they use. Importing knowledge shares its declarations; it does not copy every knowledge fact into every editor instance.

These roles answer different questions. A schema can require a finite width; knowledge can define a normal width range for a concept; an instance can show that the currently selected object is already 80 units wide. A request for “twice as wide” uses the instance value and produces 160. A request for “width 120” uses the explicit value. Neither requires the drawing tool to understand “twice” or choose a normal width.

A rule has named premises and a conclusion; matching binds variables to actual facts. Constraints reject or score candidate completions. A method decomposes an abstract result into subgoals and concrete capabilities. The library processes these declarations with general operators. A new domain supplies declarations and concrete adapters; it does not add verb or domain-ID branches to the engine.

## 1.3 The executable boundary

A circuit is ready for dispatch when every required semantic choice has been made: operation, compatible destination instance, targets, values, units, coordinate/time frames and dependencies. Arguments are either validated concrete values/references or typed references to outputs of earlier calls. A newly created object's identifier need not exist before its creation call returns. Binding that result to the next call is mechanical scheduling, not unfinished interpretation.

Each tool interface must state:

- which operation wires it accepts, and each argument's type, required/optional status and absence semantics;
- object/instance identity, units and frames, applicable state/version preconditions;
- typed outputs, observable postconditions, failure outcomes and undo/rollback obligations;
- dependencies and the result slots later calls may consume.

A tool may reject an invalid or stale call. It may not repair one by guessing an object, colour, size or layout. Semantic completion belongs before this boundary. An editor action that already supplies a complete call goes directly through the same validation, dispatch and observation path; it need not be read again by SOP-BERT.

The application-facing boundary has two responsibilities: provide existing worlds, tool interfaces and context; submit SOP request/query circuits for compilation. Resolution, completion, ranking and planning are encapsulated within LIB. High-level explanations of these algorithms do not create additional public APIs.

This book states the architectural and semantic contract. Implementation gaps and the concrete replacement sequence belong in the separate [request-to-circuit migration plan](../refactoring/request-to-executable-circuits.md). Syntax examples must use declared schemas; an explanatory table is not an undeclared SOP interface.

## 1.4 A complete, checkable example

Consider a deliberately small drawing exercise. The drawing schema declares objects with an ID, concept, finite `x`, `y`, `width`, `height` and colour. The instance contains a house `h1` occupying the rectangle from `(400,200)` to `(520,320)`. Coordinates use a top-left origin, x increasing rightward and y downward; object positions name their top-left corner. Knowledge for this exercise assigns a tree a 60-by-100 extent and the default colour `#228B22`. Its declared “near” policy places a new object 20 units to the right of its anchor and aligns their bottom edges. The scene is 800 by 600 units and that region is empty. These are explicit example premises, not universal meanings of “tree” or “near”.

The person writes **“draw a tree near the house”**.

| Stage | Exact input and result |
|---|---|
| Read | Create one tree; “the house” is an existing anchor of the near relation. No second creation request, coordinates or size are extracted. |
| Bind | Match the house description against the live instance; retain `h1` and its observed version. Other matching houses, if present, remain ranked alternatives. |
| Complete | Read the declared tree extent and near policy. Compute `x = 520 + 20 = 540`, `y = 320 - 100 = 220`, width 60, height 100. |
| Validate | The resulting rectangle ends at `(600,320)`, stays in the scene and intersects no occupied region. Recheck `h1`'s observed version before mutation. |
| Compile | Produce a creation call with concept tree, position `(540,220)`, extent `(60,100)` and colour `#228B22`. Its output reference supplies the new object's identity to later calls. No argument still says “near”. |
| Dispatch | The generic dispatcher invokes the registered creation primitive with those concrete arguments. The primitive creates exactly that object and returns its ID. |
| Observe | Read the new object from the authoritative instance and verify concept, geometry and colour. A success flag alone does not prove the visible effect. |
| Reply | State that a tree was added near `h1`; disclose the chosen anchor or other uncertain completion when relevant. Retain alternatives and undo for correction. |

For **“draw a tree and a house”**, both nouns are new targets of the shared creation act. For **“draw a tree near a house”**, the house belongs to a relation and its mode must remain part of the reading; the library ranks compatible interpretations against the instance and declared policies. Splitting text at “and”, or treating every noun as a creation, loses the distinction. The reader must preserve ownership and relation roles before completion begins.

For **“make it bigger”**, bind “it” from the conversation/selection evidence, read its current extent and the declared comparative step, then emit concrete resize arguments. For **“no, the other one”**, revise the selected hypothesis using the retained alternatives and undo or correct the earlier effect. The default under ordinary uncertainty is the most plausible usable reversible interpretation with a brief uncertainty note, not a clarification question. Hard constraints still apply; an unresolved hard precondition is never reported as a successful effect.

---

# 2. Limbajul SOP Lang

This chapter defines declaration syntax, values, identity and visibility. Compact literal values stay on their owning facts; separate facts are used when something needs identity, references, rules or independent provenance.

## 2.1 Sintaxa unei declarații

Tot ce se scrie în SOP Lang este un șir de declarații. O declarație se numește **fir (wire)**. Un fir are întotdeauna aceeași formă, în trei părți, în această ordine:

```text
@identificator  tip  cheie=valoare  cheie=valoare  ...
```

**Identificatorul (id)** este numele propriu al firului. Este scris cu semnul `@` în față. Rostul lui este ca alte fire să se poată referi la acesta. Într-un text, un identificator poate fi declarat o singură dată.

**Tipul (type)** este un nume care spune ce fel de declarație este firul. De tip depinde ce chei are voie să aibă firul și ce face biblioteca cu el.

**Perechile cheie și valoare** dau conținutul. **Cheia (key)** este numele unei informații; **valoarea (value)** este informația. Între cheie, semnul egal și valoare nu se pune spațiu. Aceeași cheie poate fi scrisă de mai multe ori pe un fir; atunci cheia are mai multe valori, în ordinea în care au fost scrise.

Un fir se termină acolo unde începe următorul, adică la următorul `@` de la începutul unui cuvânt. Poate fi scris pe mai multe rânduri. Limbajul nu are altceva: nu are paranteze, nu are liste, nu are fire în interiorul altor fire. This compact syntax is deliberate. Give a part a separate fact when it needs identity, references or its own provenance. Ordinary scalar properties stay directly on their owner; a pair of coordinates does not require two value objects.

A self-contained toy drawing schema and its facts:

```sop
@t.pond core.type of=example.pond closed=true
@t.fish core.type of=example.fish closed=true
@s.fish.size core.slot of=example.fish key=size kind=number present=true
@s.fish.x core.slot of=example.fish key=x kind=number present=true
@s.fish.y core.slot of=example.fish key=y kind=number present=true
@s.fish.in core.slot of=example.fish key=in type=example.pond present=true
@pond1 example.pond
@f1 example.fish size=1.6 x=120 y=540 in=$pond1
```

`f1` identifies the fish. Its type is `example.fish`; `size`, `x` and `y` are numeric values, while `in` is a typed reference to `pond1`. The schema makes the distinction explicit. The `example` prefix marks invented teaching types, not published drawing-tool operations.

## 2.2 Categorii lexicale și valori

Analiza lexicală separă textul în unități lexicale (tokens). La acest nivel, o valoare aparține uneia dintre categoriile de mai jos. Categoria lexicală nu este încă tipul semantic al valorii: `10:30` este recunoscut ca atom, apoi schema poate cere interpretarea lui ca oră.

| Felul | Cum se scrie și ce este |
|---|---|
| atom | Orice șir de caractere fără spații care nu începe cu `$`, `?`, `@` sau `#`: `fish`, `1.6`, `120,540`, `10:30`, `5kg`. Numerele, cantitățile, orele și numele sunt toate atomi. Limbajul nu le deosebește între ele; ce înseamnă un atom hotărăște schema (secțiunea 3.2). |
| text (string) | Scris între ghilimele: `"Review"`. Poate conține spații. |
| referință (reference) | `$` urmat de identificatorul unui fir: `$pond1`. Înseamnă „firul cu acest identificator”. |
| variabilă (variable) | `?` urmat de un nume: `?n`. Înseamnă „orice valoare”. Este permisă numai în reguli și în întrebări, niciodată într-un fapt (secțiunea 3.4). |

De exemplu, `label="Review"` furnizează un text, `source=$m1` furnizează o referință, iar `label=?text` cere legarea unei variabile în timpul potrivirii. Textul `"$m1"` rămâne text: ghilimelele împiedică interpretarea lui ca referință. Schimbarea categoriei schimbă sensul declarației, chiar dacă literele din interior sunt aceleași.

### 2.2.1 Compound values and order

A position can be represented by two numeric slots on its owning object. There is no reason to give each coordinate a separate identity when it is only a value. This complete toy schema uses ordinary `core.type` and `core.slot` declarations:

```sop
@t.example.dot core.type of=example.dot closed=true
@s.example.dot.x core.slot of=example.dot key=x kind=number present=true
@s.example.dot.y core.slot of=example.dot key=y kind=number present=true
@dot example.dot x=120 y=540
```

`x=120` and `y=540` are typed values on `dot`, not objects called `state.value.1` and `state.value.2`. A request to move the dot up changes `y` according to the declared coordinate frame and retains `x`. A missing mandatory coordinate is invalid; a number is not itself a position unless the relevant schema says which axis it represents. *(R1–R4)*

Repeated values preserve order. A document's paragraph references therefore retain their sequence. If a domain treats participants as a set, its declared collection semantics must specify duplicate reduction and order-independent comparison; a repeated key alone does not assert set semantics. *(R5)*

### 2.2.2 Choosing a representation

Use scalar slots for independently typed coordinates. Use a typed referenced fact for an independently named point, reusable geometry or a measurement with its own source/history. Both choices keep the semantic structure available to rules. A point fact needs a declared type, slots and reference type; naming it `point.value` does not create a schema automatically.

`kind=json` accepts structured native values, but an opaque implementation object must not stand in for inspectable world structure. If JSON is used at an adapter boundary, its schema and conversion into domain facts must be explicit. A generic JSON tag does not establish coordinate axes, units or equality between values in different frames. Domain reasoning uses the declared facts, not private JS object fields.

## 2.3 Marcatori sintactici și referințe

**Sintaxa (syntax)** stabilește ce secvențe de caractere sunt declarații corecte. **Semantica (semantics)** stabilește ce înseamnă o declarație și cum influențează lumea. `@n1 node` poate fi corect sintactic înainte să știm ce proprietăți are tipul `node`. Dacă un slot obligatoriu lipsește, aceasta este o problemă semantică de completitudine, nu un caracter scris greșit.

Marcatorii de mai jos sunt interpretați de analizorul lexical. Ei disting declararea unei identități, folosirea unei identități existente, legarea unei valori necunoscute și comentariul. Nu sunt operatori care execută singuri o acțiune.

| Semnul | Ce înseamnă și unde poate sta |
|---|---|
| `@` | Declară un fir. Stă numai la începutul unei declarații. |
| `$` | Trimite la un fir, prin identificatorul lui. Stă numai la începutul unei valori. |
| `?` | Este o variabilă. Stă numai la începutul unei valori, în reguli și în întrebări. |
| `#` | Începe un comentariu, care ține până la sfârșitul rândului. |

Contextul stabilește ținta referinței: într-un fapt, `$x` desemnează un fapt; în `when=$p.node`, desemnează pattern-ul declarat, iar în condițiile legate de el poate desemna faptul găsit la potrivire. Secțiunea 3.5 urmărește aceste utilizări pe același exemplu.

Mai există semnul `::`, care apare în interiorul unui identificator; este explicat în secțiunea 2.6.

## 2.4 Identificatori, nume de tipuri și calificarea numelor

Identificatorii, tipurile și cheile sunt nume, scrise după aceeași regulă: litere, cifre, liniuțe, și puncte între bucăți. `f1`, `fish`, `core.type` și `s.drawn.at` sunt nume corecte.

Pentru numele SOP noi, convenția proiectului este scrierea cu litere mici și separarea cuvintelor prin puncte: `gap.observation`, `source.snapshot`, `point.value`. Ea se aplică identificatorilor redactați, tipurilor și cheilor, inclusiv folosirilor lor în referințe, `of`, `kind` sau `type`. Este o convenție de redactare, nu o operație automată de schimbare a literelor la încărcare. Numele importate și identificatorii persistenți se păstrează ori primesc o mapare explicită; nu se redenumesc tacit. Valorile textuale și etichetele pot avea majuscule.

**Punctul nu are niciun înțeles pentru limbaj.** `core.type` este un singur nume, la fel ca `fish`. Punctele sunt folosite după o convenție, pentru cititor: începutul numelui unui tip spune cine a definit acel tip.

| Începutul | Cine a definit tipul |
|---|---|
| `core.` | Limbajul însuși. Sunt tipurile predefinite, cu care se scrie schema unei lumi (capitolul 3). |
| `std.` | Modulele standard ale bibliotecii, folosite pentru conversație (secțiunea 6.1). |
| `w.legend.` | Lumea legendelor (capitolul 4). |
| `k.` | O bază de cunoaștere publicată (secțiunea 5.1). |
| `w.` | O descriere publicată a unui fel de lume (secțiunea 5.1). |
| nimic | Un tip propriu lumii în care apare: `fish`, `node`, `meeting`. |

Un lucru trebuie spus limpede, fiindcă produce confuzie: **un tip nu este un fir și nu are identificator.** Un tip este un nume. Oriunde limbajul așteaptă un tip, se scrie numele lui, fără `$`: ca al doilea cuvânt al unui fir (`@f1 fish`), sau ca valoare a unor chei care cer un tip (`of=fish`, `extends=fish`, `type=fish`). Un tip nici nu trebuie declarat ca să fie folosit: firul `@f1 fish size=1.6` este primit și într-o lume care nu a auzit de `fish`. Declararea unui tip adaugă informații despre el; cum se face este în secțiunea 3.1.

### 2.4.1 Identitate, referințe și ciclul de viață al faptelor

Identitatea permite recunoașterea aceluiași lucru după ce i se schimbă numele, poziția sau fișierul în care este salvat. O etichetă servește cititorului; o referință servește legăturilor dintre fapte. Dacă o ședință este redenumită din „Review” în „Planning”, nodul diagramei care o reprezintă trebuie să continue să indice aceeași ședință.

Regulile de mai jos separă identitatea persistentă de rezolvarea unei referințe și de verificarea existenței țintei. Acestea sunt trei operații distincte: un identificator poate fi bine format și totuși să nu desemneze niciun fapt disponibil.

Identitatea persistentă a unui fapt este perechea dintre identitatea imutabilă a instanței și identificatorul local al faptului. Numele afișat al lumii, numele modulului și calea pe disc nu sunt această identitate. Încărcătorul poate deduce un nume inițial din calea relativă, dar salvează separat identitatea instanței. Un spațiu de nume lizibil precum `calendar` se rezolvă în contextul proiectului la această identitate. In persistent storage, referința stochează perechea dintre identitatea imutabilă a instanței și identificatorul local; `calendar` este numai numele lizibil folosit la introducere și afișare. Salvarea rezolvă acest nume și scrie identitatea, nu textul aliasului. La redenumirea în `agenda`, afișarea se schimbă, dar perechea stocată nu se schimbă. Importul unui text vechi cu `$calendar::m1` cere un alias declarat sau o mapare explicită; nu ghicește noul nume. Redenumirea ori mutarea directorului păstrează astfel referințele persistente; copierea independentă remapează identitățile și referințele interne împreună. Secțiunea 2.6 descrie contractul și separation from readable prefixes. *(R6)*

Într-un fapt, `$x` este o referință locală, rezolvată în contextul instanței. Forma calificată `$calendar::m1` poate desemna un fapt din altă instanță, conform secțiunii 2.6. În declarația unei reguli, `when=$p.node` numește un pattern din schemă; într-o condiție legată de acel pattern, referința poate desemna faptul găsit la evaluare. Rezolvarea identității declarației și legarea la un fapt sunt etape distincte, urmărite în secțiunea 3.5. *(R7)*

O referință trebuie să se rezolve până la sfârșitul schimbării în care apare. Altfel schimbarea este refuzată (`dangling-ref`). Singura excepție este un slot cu `by=` (secțiunea 3.2): valoarea rămâne în așteptare până când este spus firul numit, iar lumea o ține într-o listă de legături neînchise. *(R8)*

| Întâmplarea | Ce se întâmplă cu identitatea și cu referințele |
|---|---|
| ștergerea unui lucru | Relațiile care au nevoie de el dispar odată cu el: săgețile unui nod șters. Un lucru care doar trimite la el (o ședință la sala ei) blochează ștergerea, cu motivul spus. |
| copierea | Copia are identificator nou. Păstrează felul și însușirile. Nu păstrează referințele la alte lucruri, în afară de cele ale căror sloturi spun `copy=keep`. |
| importul unei scheme | Identificatorii firelor de schemă primesc numele modulului în față. Faptele nu sunt atinse. |
| schimbarea numelui | Identificatorul nu se schimbă niciodată. Numele văzut de om este o cheie (`label`, `title`), deci schimbarea lui nu atinge nicio referință. |
| salvarea și reîncărcarea | Identificatorii se păstrează întocmai. |

Tabelul ciclului de viață trebuie citit în funcție de rolul relației. O săgeată nu poate exista fără capetele sale; ștergerea unui nod poate elimina și săgețile sale. O ședință însă are existență proprie față de sala indicată. Ștergerea sălii nu autorizează ștergerea ședinței și nici alegerea tacită a altei săli. Politica fiecărei relații trebuie declarată în schema domeniului.

La copiere se separă identitatea nouă de conținutul reutilizat. Copierea unei diagrame întregi cere remaparea referințelor dintre nodurile copiate; păstrarea unei legături către calendar este o altă decizie, explicită. Regulile pentru un obiect copiat nu trebuie confundate cu importul unui modul sau cu mutarea fișierelor aceleiași instanțe.

## 2.5 Semantica declarațiilor: fapte, schemă și pattern-uri

Toate firele se scriu la fel, dar biblioteca le folosește în două feluri.

Un **fapt (fact)** este un fir care spune că ceva există și cum este: peștele `f1`, ședința de la zece. Faptele se schimbă mereu, pe măsură ce omul lucrează.

**Schema (schema)** este mulțimea firelor care spun ce fapte au voie să existe și ce decurge din ele. Schema se scrie o dată, de către cel care descrie domeniul, și se schimbă rar. The schema is the declared contract, not an editor-specific collection of JS checks.

Biblioteca hotărăște în care din cele două categorii intră un fir după două reguli. Un fir este al schemei dacă tipul lui este unul dintre tipurile predefinite de schemă (cele din capitolul 3, de exemplu `core.type` sau `core.rule`). Un fir este al schemei și dacă o regulă din același text îl folosește drept condiție sau concluzie: în primul caz este un pattern, în al doilea un șablon de concluzie (secțiunile 3.4–3.5). Orice alt fir este un fapt.

Faptele și firele schemei au identificatori separați: un fapt `p` și un fir de schemă `p` nu se ciocnesc.

## 2.6 Spații de nume, module și organizarea proiectului

Un **spațiu de nume (namespace)** stabilește contextul în care un nume este rezolvat. Problema nu este doar că două obiecte se pot numi `n1`. Trebuie să știm și din ce modul vine tipul lor, ce fișier îi conține și din ce instanță provin atunci când sunt salvați sau legați de altă lume.

Aceste patru informații nu sunt identice. Calea unui fișier este adresa de stocare. Modulul este unitatea de schemă reutilizabilă. Instanța este o stare concretă construită cu acea schemă. Identificatorul local numește un fapt în acea instanță. Același modul al diagramei poate fi folosit de două diagrame diferite; o diagramă poate fi salvată în mai multe fișiere.

În aplicația demonstrativă, desenul, diagrama, documentul și calendarul au fiecare câte o instanță distinctă. Descriptorul proiectului leagă numele lor lizibile de identități persistente, fișiere și scheme. Chiar dacă desenul și diagrama au amândouă un obiect `n1`, acestea nu sunt același lucru. La cererea unui grafic din calendar, aplicația citește instanța calendarului și creează obiecte în instanța diagramei; aici calificarea referințelor face vizibilă trecerea dintre cele două stări.

Exemplele locale din capitolul 7 folosesc schema proprie a aplicației, deci păstrează tipuri precum `node` și `meeting`. Directorul `worlds/diagram/` din organisational example nu califică singur tipul `node`. Dacă schema este publicată și importată printr-un modul calificat, tipul poate deveni `diagram.node`; atunci și sloturile, pattern-urile și folosirile sale trebuie calificate consecvent la import. Această operație asupra numelor de schemă este separată de prefixul `diagram::` al faptelor unei instanțe.

### 2.6.1 Qualified references and historical sources

A local reference resolves within its declared instance context. A qualified reference identifies a fact in another declared context; it does not import that context, grant write access or prove that the target is loaded. A pattern reference instead names a schema pattern and is bound to the matching fact during rule evaluation (sections 3.4–3.5).

An active document embedding needs a resolvable drawing target. A chart calculated from a calendar can instead preserve an independent historical source observation. The difference must be structural: a live typed reference requires its target; an historical record preserves the source identity, version and consumed values without claiming that the source still exists. A missing live reference must never be silently converted into historical text.

For example, a chart of meeting counts reads a calendar snapshot, counts Monday=2 and Tuesday=3, and stores those counts with the captured source identity and version. Deleting the source calendar does not alter those historical counts. “Update the chart” must read a new calendar snapshot and recompute them; if that source is unavailable, it cannot claim an update. A live embedded drawing follows a different contract: render the referenced scene at a coherent observed version, or report that it cannot be resolved.

### 2.6.2 Project ownership and file organisation

A project descriptor identifies the project roots, imported modules, schema dependencies, instance identities and the files that own their facts. A file path is storage location, not semantic identity. The following layout illustrates those distinct roles; directory names do not create types or instances by themselves.

| Cale relativă | Rol declarat în proiect |
|---|---|
| `worlds/diagram/schema.sop` | Schema modulului diagramei; numele public este explicit și rămâne stabil. |
| `worlds/diagram/rules.sop` | Reguli ale aceluiași modul, nu altă instanță pentru că sunt în alt fișier. |
| `instances/diagram/main.sop` | Fapte ale unei instanțe cu identitate persistentă. |
| `instances/diagram/parts/nodes.sop` | Alte fapte ale aceleiași instanțe, dacă descriptorul spune aceasta. |
| `instances/calendar/main.sop` | Fapte ale instanței calendarului, legate explicit de diagramă când este nevoie. |

Încărcătorul rezolvă întâi calea relativ la rădăcina declarată, apoi rolul fișierului. Două căi normalizate care desemnează același fișier nu îl încarcă de două ori. Un import care iese din rădăcinile permise se refuză; o dependență publicată se identifică prin modul și versiune, nu prin calea absolută de pe calculatorul autorului.

Numele dedus din cale este o convenție de inițializare, nu identitatea permanentă a faptelor. La prima salvare, instanța primește și păstrează o identitate imutabilă. Mutarea directorului nu creează altă instanță. Copierea unui proiect trebuie să aleagă explicit între continuarea aceleiași identități și crearea unei copii independente cu remaparea referințelor. La coliziune între identități, încărcătorul refuză îmbinarea implicită.

Persistența cere și o regulă de atribuire a fișierului de destinație. Pentru fiecare fapt existent, descriptorul identifică fișierul care îl deține; pentru un fapt nou, declară o destinație implicită sau o regulă deterministă de repartizare. În exemplul diagramei, nodurile noi pot merge în `parts/nodes.sop`, iar restul faptelor în `main.sop`. O repartizare absentă sau ambiguă oprește salvarea, fără să suprascrie fișierele existente.

| Situație la încărcare sau copiere | Required behaviour |
|---|---|
| Două căi diferite deduc același nume de instanță | Se refuză deducerea ambiguă; descriptorul trebuie să declare nume distincte. Regula acoperă și diferențele numai de majuscule pe un sistem de fișiere care nu le distinge. |
| Calendarul este mutat în afara rădăcinilor declarate, iar diagrama conține `$calendar::m1` | Activarea contextului care conține referința se refuză, cu sursa și ținta lipsă în diagnostic. Nu se alterează fișierele salvate și nu se prezintă contextul ca valid. |
| O copie independentă are referințe spre o instanță din afara copiei | Referințele externe își păstrează ținta originală numai dacă descriptorul copiei declară explicit dependența externă. Altfel copierea se refuză înainte de publicarea copiei. |
| Aceeași instanță este repartizată în mai multe fișiere | Fiecare fapt are o singură destinație declarată. Salvarea nu dublează faptul în fișiere concurente. |

Coliziunea de nume și coliziunea de identități sunt erori diferite. `instances/diagram/main.sop` și `instances/diagram.sop` pot deduce amândouă numele `diagram` fără să reprezinte aceeași instanță. Încărcătorul nu rezolvă această situație alegând primul fișier găsit. De asemenea, numele diferite nu autorizează încărcarea de două ori a aceleiași identități cu stări incompatibile.

An active factual reference requires an available target (R8). An historical chart keeps autonomous source evidence and consumed values; displaying it does not authorise recomputation without the source. The declared representation must preserve this distinction.


### 2.6.3 Sublumi și limitele vizibilității

Un subdirector nu este automat o sublume. Putem împărți o diagramă în fișiere doar pentru organizare, fără să schimbăm ce văd regulile. O **sublume (subworld)** există când este declarată o instanță distinctă, cu stare și identitate proprii, legată de instanța care o conține. Conținerea nu înseamnă automat import, moștenire de tipuri sau acces la toate faptele.

În demo, cele patru zone nu cer automat o ierarhie de sublumi. Un document care încorporează un desen poate justifica o asemenea compunere: documentul păstrează locul și dimensiunea inserției, iar desenul își păstrează propria schemă și stare. O imagine statică inserată în document este însă doar o resursă; nu devine sublume pentru că are un fișier separat.

Pentru a reuni date din două instanțe, un context de compunere declară ce scheme și ce fapte citește, la ce versiuni și cu ce drept de modificare. Referințele între lumi sunt explicite. Nu se leagă două fapte numai fiindcă numele local sau o valoare textuală coincid. Excepțiile intenționate, precum tipurile partajate, trebuie declarate; `shared=true` declares pentru participarea faptelor unui tip între spații de nume.

Firele schemei au identități în module; spațiul de nume al faptelor nu trebuie confundat cu calificarea tipurilor. `diagram.node` poate fi un tip public, iar `diagram::n1` un fapt. Punctul și `::` au roluri distincte. `core.namespace` declares an open key prefix, not an instance namespace. The two meanings must not be conflated.

---

# 3. Schema unei lumi

This chapter explains the declarations used to define and validate a schema. Pentru fiecare se spune la ce folosește, se dă tabelul complet al cheilor și un exemplu. Ordinea este de la cele folosite cel mai des.

## 3.1 `core.type`: declararea unui tip

**La ce folosește.** Un fir de tipul `core.type` adaugă informații despre un tip: din ce tip mai general se trage și câteva proprietăți. Un tip poate fi folosit și fără o asemenea declarație; declarația este necesară numai când vrem să spunem aceste lucruri.

**Forma.** Numele tipului despre care se vorbește este dat în cheia `of`. Firul de declarație are și el un identificator, fiindcă orice fir are unul, dar acest identificator **nu este numele tipului** și nu are niciun rol în afară de a fi unic. Convenția din exemple este ca el să fie `t.` urmat de numele tipului, numai ca firul să fie ușor de recunoscut.

```
@t.drawn core.type of=drawn extends=std.schema.thing closed=true
```

Aici firul are identificatorul `t.drawn`. Tipul despre care vorbește este `drawn`. Firul spune două lucruri despre tipul `drawn`: că se trage din tipul `std.schema.thing` și că este închis.

| Cheia | Ce spune |
|---|---|
| `of` | Numele tipului despre care se vorbește. Obligatorie. |
| `extends` | Numele tipului părinte. Un fir de tipul declarat este socotit și fir de tipul părinte: tot ce s-a declarat pentru părinte (chei, reguli, interdicții) i se aplică și lui. Un tip are un singur părinte. Cheia poate fi repetată; valorile următoare sunt grupuri de chei împrumutate, nu părinți. |
| `closed` | `true`: firele de acest tip primesc numai cheile declarate. Fără ea, un fir poate purta și chei nedeclarate. |
| `complete` | `true`: lumea cunoaște toate firele de acest tip. Schimbă un singur răspuns: la întrebarea „există un fir de acest tip care…?”, lipsa unei potriviri înseamnă „nu”, nu „nu se știe”. |
| `transient` | `true`: firele de acest tip sunt o stare la care se privește, nu una care se editează (o selecție, un cursor). Anularea trece peste ele. |
| `unique` | Numele unei chei. Două fire de acest tip nu pot avea aceeași valoare la ea. Repetată: aceeași combinație de valori. |
| `shared` | `true`: firele de acest tip aparțin tuturor spațiilor de nume (secțiunea 2.6). |
| `is` | With `w.legend` loaded, a reference or unambiguous public name of a declared `w.legend.concept`; checked by the declared schema-link contract (section 4.7). |

Proprietatea dată de `extends` se numește **moștenire (lineage)** și este mecanismul prin care se aplică principiul „de la general la particular”: ce este comun mai multor tipuri se declară o singură dată, pe părintele lor.

Tipul `std.schema.thing` din exemplu este un tip predefinit de modulele standard. Înseamnă „un lucru dintr-o lume în care se pot face lucruri” și este părintele tuturor tipurilor de lucruri din cele patru domenii (secțiunea 6.1).

## 3.2 `core.slot`: declararea unei chei a unui tip

**La ce folosește.** Un tip de fire are anumite chei. Pentru ca biblioteca să poată verifica valorile, fiecare cheie trebuie descrisă: ce fel de valoare ține, dacă este obligatorie, câte valori poate avea. Descrierea unei chei se numește **slot (slot)** și se face printr-un fir de tipul `core.slot`.

Deosebirea dintre cheie și slot trebuie ținută minte. Cheia este ce se scrie într-un fapt: `size=1.6`. Slotul este firul din schemă care spune că firele de tipul `drawn` au o cheie `size` și că valoarea ei este un număr.

**Forma.** Fiindcă limbajul nu are fire în interiorul altor fire, cheile unui tip nu pot fi scrise „înăuntrul” declarației tipului. Fiecare cheie are firul ei, separat, iar legătura cu tipul se face prin cheia `of`, care dă numele tipului. De aceea un tip cu cinci chei este descris de șase fire: unul `core.type` și cinci `core.slot`, toate cu același `of`. Identificatorul fiecărui fir de slot este, ca la tipuri, liber; convenția din exemple este `s.`, numele tipului și numele cheii.

```
@t.drawn      core.type of=drawn extends=std.schema.thing
@s.drawn.at   core.slot of=drawn key=at     kind=number many=true required=true
@s.drawn.size core.slot of=drawn key=size   kind=number min=0.3 max=3
@s.drawn.in   core.slot of=drawn key=in     type=drawn
```

Al doilea fir spune: firele de tipul `drawn` au o cheie numită `at`; valorile ei sunt numere; poate avea mai multe; este obligatorie. Al treilea: au o cheie `size`, un număr între 0,3 și 3. Al patrulea: au o cheie `in`, a cărei valoare este o referință la un alt fir de tipul `drawn`.

The following table describes schema slot declarations.

| Cheia | Ce spune |
|---|---|
| `of` | Numele tipului căruia îi aparține cheia. Obligatorie. |
| `key` | Numele cheii. Obligatorie. |
| `required` | `true`: cheia este obligatorie. Un fir de acest tip căruia îi lipsește are o cheie deschisă (secțiunea 3.3). |
| `present` | `true`: cheia exactă trebuie să existe după deducție; o înregistrare fără ea este structural invalidă și tranzacția este refuzată. |
| `many` | `true`: cheia poate avea mai multe valori. Fără ea, una singură. |
| `kind` | Felul valorii, când valoarea este scrisă direct. Valorile posibile sunt în tabelul următor. Poate fi repetată; valoarea trebuie să se potrivească cu unul dintre feluri. |
| `type` | Numele unui tip: valoarea trebuie să fie o referință la un fir de acel tip. Poate fi repetată. |
| `enum` | O valoare permisă; repetată, lista valorilor permise. Use for a genuinely closed vocabulary; reusable concept meanings belong in knowledge (section 4.4). |
| `min`, `max` | Marginile, pentru valori care sunt numere sau cantități. |
| `step` | Împreună cu `min` și `max`: valorile permise sunt `min`, `min+step` și așa mai departe. |
| `default` | Valoarea presupusă când nimeni nu a dat una. A literal schema fallback is distinct from contextual semantic completion in knowledge (section 6.6). |
| `ask` | Textul întrebării de pus când cheia este deschisă. This is explanatory metadata, not a requirement to interrupt the user; prefer declared completion and ranked reversible action (section 6.4). |
| `soft` | `true`: o valoare în afara marginilor este primită, dar se notează o problemă (secțiunea 3.6). |
| `why` | Textul motivului dat când o valoare este refuzată. |
| `id` | `true`: cheia este o cheie de identitate. Două fapte de același tip care au aceleași valori la toate cheile de identitate sunt unul și același fir. |
| `unique` | `true`: două fire de acest tip, din același spațiu de nume, nu pot avea aceeași valoare. |
| `excludes` | Numele altei chei: un fir care are această cheie nu o poate avea și pe aceea. |
| `prefix` | `true`: `key` este un început de nume; orice cheie care începe așa este descrisă de acest slot. |
| `combine` | `intersect` sau `override`: cum se împacă această declarație cu alta, făcută pentru aceeași cheie a aceluiași tip (secțiunea 5.3). |
| `to` | Împreună cu `kind=ref`: tipul firului la care trebuie să trimită referința. |
| `by` | Împreună cu `type=T`: valoarea nu este o referință, ci un nume, care desemnează firul de tipul `T` ce are acel nume la cheia dată. Așa se scrie `kind=duck` în loc de o referință la firul care descrie rața. |
| `match` | Împreună cu `by`: chei suplimentare care trebuie să se potrivească. |
| `strict` | Împreună cu `by`: un nume care nu desemnează niciun fir este refuzat pe loc, în loc să rămână în așteptare. |
| `copy` | `keep`: la copierea unui lucru, această referință este păstrată. |
| `means`, `space` | With `w.legend` loaded, a declared concept and space respectively. Names must resolve uniquely or use typed references; these are checked schema links, not arbitrary documentation strings. |

Valorile posibile ale cheii `kind`:

| `kind=` | Ce valoare este primită |
|---|---|
| `integer` | Un număr întreg. |
| `number` | Un număr întreg sau cu zecimale. Sub o asemenea cheie, `5` și `5.0` sunt aceeași valoare. |
| `boolean` | `true` sau `false`. |
| `string` | Un text între ghilimele. |
| `atom` | Un nume. |
| `quantity.<nume>` | Un număr cu unitate de măsură, de exemplu `quantity.mass` pentru `5kg`. |
| `time.clock`, `time.date` | O oră (`10:40`) sau o dată (`2026-01-30`). |
| `ref` | O referință la un fir; cu `to=T`, la un fir de tipul `T`. |
| `json` | Un text care conține o valoare structurată (un punct, un interval). O regulă poate citi înăuntrul ei. |
| `blob` | O valoare mare, păstrată întocmai, pe care regulile nu o pot citi. |
| `any` | Orice. |

**Moștenirea sloturilor.** Un slot declarat pentru un tip este valabil pentru toate tipurile care se trag din el. Un tip mai particular poate declara din nou aceeași cheie; atunci este valabilă declarația cea mai apropiată.

`present=true` pe un `core.slot` cere ca cheia exactă să existe la validarea tranzacției, după deducție. Lipsa ei produce `missing-key` și anulează schimbarea. `required=true` păstrează sensul existent: cheia lipsă este o întrebare deschisă pentru completare, nu automat o eroare structurală. Contractele publicate folosesc prima proprietate pentru câmpurile fără de care înregistrarea nu are sens; o valoare încă necunoscută a unei instanțe poate folosi a doua. Proprietatea de prezență se moștenește cu slotul și nu se combină cu un prefix de chei, fiindcă un prefix nu numește o cheie exactă obligatorie.

## 3.3 Cheile deschise

**Ce sunt.** Să presupunem că schema declară cheia `at` a tipului `drawn` ca obligatorie, iar în lume apare faptul `@f2 drawn size=1`, fără `at`. Biblioteca nu refuză acest fapt. Îl primește și ține minte că îi lipsește ceva. O cheie pe care schema o declară obligatorie și care nu are încă valoare pe un fapt se numește **cheie deschisă (open key)**.

Această situație folosește `required=true`, nu `present=true`. Un loc încă necunoscut poate rămâne o sarcină de completare; în schimb, o înregistrare de proveniență fără sursa sa nu este o dovadă incompletă utilizabilă, ci o înregistrare invalidă. `present=true` refuză această lipsă la validare. Autorul schemei alege proprietatea după sensul înregistrării, nu presupune că toate câmpurile numite „obligatorii” trebuie să aibă aceeași politică.

**De ce există.** Într-o conversație, aceasta este situația obișnuită, nu o greșeală: omul spune „draw a fish” și nu spune unde. Dacă faptele incomplete ar fi refuzate, aplicația nu ar avea unde să țină ce a înțeles până în acel moment. Cheia deschisă este felul în care lumea ține, într-o formă pe care programul o poate număra, răspunsul la întrebarea „ce mai trebuie hotărât?”.

**Ce se face cu ele.** LIB handles open keys through four internal activities. These explain its algorithm; they are not additional application-facing orchestration APIs.

| Operația | Ce face |
|---|---|
| lista | Dă toate cheile deschise ale lumii sau ale unui fir: ce fir, ce cheie și, dacă slotul are `ask`, întrebarea. |
| completarea (complete) | Pentru fiecare cheie deschisă calculează ce valori mai sunt permise de schemă. Dacă a rămas una singură, o pune. |
| sfatul | Fără să schimbe nimic, spune ce se poate face pentru fiecare cheie deschisă: ce valoare s-ar putea pune sau ce întrebare ar trebui pusă omului. |
| rezolvarea (solve) | Caută valori pentru toate cheile deschise deodată, astfel încât nicio regulă să nu fie încălcată. Este pentru cazul în care cheile depind una de alta: orele și sălile tuturor ședințelor unei săptămâni. |

In conversation, the library first completes from declarations and compatible live context, ranks usable alternatives and retains the chosen assumptions. A missing coordinate is a completion task, not an automatic question to the person (sections 6.4, 6.6 and 6.8).

**Legătura cu variabilele.** Cheia deschisă și variabila par același lucru, fiindcă amândouă sunt „un loc fără valoare”. Sunt lucruri diferite. Variabila (secțiunea 3.4) stă într-o regulă, în schemă, și înseamnă „oricare ar fi valoarea”; nu lipsește nimic, este felul de a scrie o regulă generală. Cheia deschisă stă pe un fapt și înseamnă „aici trebuie o valoare și încă nu o știm”. Cele două se întâlnesc numai în operația de rezolvare, care tratează cheile deschise ca pe necunoscutele unei probleme și caută valori care mulțumesc toate regulile.

## 3.4 Pattern-uri, variabile și legarea la fapte

Un **pattern (model de potrivire)** este o condiție structurală de căutare a faptelor. Nu este un model de învățare automată, o imagine și nici un exemplu pe care programul trebuie să îl imite. Spune ce tip de fapt căutăm și ce relații trebuie să aibă valorile lui. În continuare folosim termenul tehnic „pattern” pentru a evita aceste confuzii.

Un fapt spune „acest nod există și are această culoare”. Un pattern spune „găsește un nod cu această culoare”. Amândouă folosesc sintaxa firelor, însă au roluri semantice diferite. A declaration named de o regulă drept condiție is registered as a pattern in that rule’s schema; nu este introdus ca obiect în starea diagramei. Simpla prezență a semnului `?` nu este o declarație suficientă a acestui rol.

Să avem următoarele fapte ale diagramei:

```sop
@t.node core.type of=node closed=true
@s.node.label core.slot of=node key=label kind=string
@s.node.colour core.slot of=node key=colour kind=atom
@n1 node label="Review" colour=red
@n2 node label="Decision" colour=blue
@n3 node label="Finish" colour=red
```

`node` este aici numele tipului de obiect grafic „nod de diagramă”. Nu este un cuvânt rezervat al limbajului. `n1`, `n2` și `n3` sunt identități ale celor trei obiecte. `label` și `colour` sunt cheile lor; schema trebuie să le permită. Un pattern folosit de o regulă poate fi:

```sop
@t.node core.type of=node closed=true
@s.node.label core.slot of=node key=label kind=string
@s.node.colour core.slot of=node key=colour kind=atom
@t.match core.type of=example.red.match closed=true
@s.match.text core.slot of=example.red.match key=text kind=string present=true
@p.red node colour=red label=?text
@t.red example.red.match text=?text
@r.red core.rule when=$p.red then=$t.red
@n1 node label="Review" colour=red
@n2 node label="Decision" colour=blue
@n3 node label="Finish" colour=red
```

`p.red` names the search condition, not another diagram node. The rule names that pattern and derives one `example.red.match` result per matching label; `t.red` is its conclusion template. The complete block declares its toy types and supplies its input facts. Căutarea se limitează la tipul `node` și descendenții lui. Constanta `colour=red` trebuie să coincidă cu valoarea faptului. Variabila `?text` preia valoarea cheii `label`. O cheie pe care pattern-ul nu o menționează nu este verificată de acel pattern.

| Fapt încercat | Rezultat al potrivirii |
|---|---|
| `n1` | Potrivire: pattern-ul desemnează `n1`, iar `?text` primește textul `Review`. |
| `n2` | Fără potrivire: `blue` nu este `red`. |
| `n3` | Potrivire distinctă: pattern-ul desemnează `n3`, iar `?text` primește `Finish`. |

Aceasta este **legarea variabilelor (binding)**: pentru fiecare rezultat există o asociere concretă între variabile și valori, plus faptul găsit. Nu păstrăm o singură variabilă globală care se schimbă din `Review` în `Finish`; avem două rezultate independente. O variabilă repetată în aceeași regulă trebuie să păstreze aceeași valoare în toate condițiile acelei potriviri. Această egalitate permite **îmbinarea condițiilor (join)**. Numele variabilei din altă regulă nu creează o legătură între reguli.

Dacă faptul nu are `label`, condiția `label=?text` nu produce o potrivire. Nu inventează textul lipsă. Dacă pattern-ul ar spune numai `node colour=red`, lipsa etichetei nu ar conta. Un pattern poate să nu aibă deloc variabile: constantele și tipul sunt suficiente pentru o condiție de căutare.

**Metadatele de potrivire și construcție** de mai jos pot fi puse pe un pattern sau pe un șablon de concluzie. Nu fac parte din firul descris; schimbă felul în care este folosit.

| Cheia | Ce face |
|---|---|
| `core.absent` | Pe un model. Valoarea este numele unei chei: modelul se potrivește numai cu fire care nu au nicio valoare la acea cheie. |
| `core.select` | Pe un model. `latest` sau `first`: dintre firele care se potrivesc, numai ultimul sau primul. |
| `core.on` | Pe un fir de construit. Valoarea este un model al aceleiași reguli: în loc să se facă un fir nou, cheile se adaugă pe firul găsit de acel model. |

## 3.5 Reguli de deducție: condiții, potrivire și concluzie

O **regulă de deducție (deduction rule)** definește ce concluzie este justificată de anumite fapte. Ea nu descrie o secvență de instrucțiuni care desenează pe ecran. Motorul găsește asocierile care satisfac condițiile și aplică forma concluziei pentru fiecare asociere. Unealta de desenare este o altă componentă, descrisă în capitolul 6.

În exemplul diagramei, numim „nod de început” un nod fără legătură care intră în el. Aceasta este o definiție declarată pentru exemplu, nu o semnificație ascunsă în numele `node`. Schema regulii este:

```sop
@t.node core.type of=node closed=true
@s.node.label core.slot of=node key=label kind=string
@s.node.start core.slot of=node key=start kind=boolean
@t.link core.type of=link closed=true
@s.link.from core.slot of=link key=from type=node present=true
@s.link.to core.slot of=link key=to type=node present=true
@p.node  node
@p.in    link to=$p.node
@t.start node core.on=$p.node start=true
@r.start core.rule when=$p.node not=$p.in then=$t.start
```

Primul fir definește pattern-ul `p.node`: caută orice fapt de tip `node`. Nu îi cere nicio cheie, deci poate găsi orice nod. Al doilea definește pattern-ul `p.in`: caută un fapt de tip `link`, adică o legătură din diagramă, al cărui capăt `to` este faptul găsit de `p.node`. Aici `$p.node` nu este textul `p.node` și nici un nod din diagramă cu acest nume. Motorul îl interpretează ca referință la faptul deja asociat acelui pattern.

Al treilea fir este un **șablon de concluzie (conclusion template)**. `core.on=$p.node` cere adăugarea cheii `start=true` pe nodul găsit, nu crearea unui obiect numit `t.start`. Al patrulea fir leagă piesele: `when=$p.node` numește condiția pozitivă, `not=$p.in` numește condiția negativă, iar `then=$t.start` numește concluzia.

Prin urmare, `when=$p.node` este o referință reală la o declarație din schemă. Nu este o formulă incompletă și nu cere programului să ghicească ce înseamnă „model”. Încărcătorul rezolvă `p.node` în unitatea regulii. Dacă declarația lipsește sau nu poate fi folosită drept pattern, schema trebuie refuzată. Prefixele `p.` și `t.` sunt convenții de citire; rolul vine din folosirea declarației de către regulă.

Pentru a urmări execuția, încărcăm regula împreună cu schema tipurilor, apoi spunem aceste fapte:

```sop
@t.node core.type of=node closed=true
@s.node.label core.slot of=node key=label kind=string
@s.node.start core.slot of=node key=start kind=boolean
@t.link core.type of=link closed=true
@s.link.from core.slot of=link key=from type=node present=true
@s.link.to core.slot of=link key=to type=node present=true
@n1 node label="Review"
@n2 node label="Decision"
@e1 link from=$n1 to=$n2
```

| Evaluare | Ce găsește motorul |
|---|---|
| `p.node` găsește `n1` | `p.in` ar trebui să găsească o legătură cu `to=$n1`. Nu există în starea citită, deci condiția negativă trece și `n1` primește `start=true`. |
| `p.node` găsește `n2` | `e1` are `to=$n2`. Condiția negativă nu trece; regula nu adaugă `start=true` pe `n2`. |

Dacă se adaugă o legătură spre `n1`, justificarea concluziei despre `n1` dispare. Motorul retrage valoarea dedusă dacă nu mai există alt temei pentru ea. Un fapt declarat explicit de utilizator și o valoare dedusă trebuie păstrate distinct în evidența justificării.

`not` exprimă lipsa unei potriviri în starea evaluată, nu o dovadă despre legături care încă nu au fost încărcate. Dacă diagrama este incomplet încărcată, nu putem prezenta rezultatul ca definiție definitivă a începutului ei. Regulile de completitudine din 3.9 și 8.4 precizează când concluzia poate fi folosită pentru validare sau execuție.

| Cheie | Semantica în evaluarea regulii |
|---|---|
| `when` | Referință la un pattern pozitiv. Motorul caută fapte care îi satisfac tipul, constantele și egalitățile. Mai multe `when` cer o asociere comună compatibilă, nu rezultate fără legătură. |
| `not` | Referință la un pattern negativ. Pentru asocierea curentă, condiția trece numai dacă nu există nicio extensie care să satisfacă pattern-ul. |
| `with` | Referință la un calcul `core.calc`, care produce o valoare pentru asocierea curentă. |
| `if` | Referință la o condiție calculată `core.check`; rezultatul ei trebuie să fie adevărat. |
| `then` | Referință la un șablon de concluzie, completat cu valorile și faptele asociate. |
| `lazy` | Solicită evaluarea deducției la cerere; nu schimbă ce condiții justifică acea concluzie. |

## 3.6 `core.deny`: ce nu este permis

**La ce folosește.** O **interdicție (deny)** spune că anumite modele nu au voie să se potrivească împreună. Dacă o schimbare ar face ca ele să se potrivească, schimbarea este refuzată în întregime, iar lumea rămâne cum era.

**Exemplu.** În calendar, un om nu poate fi în două ședințe care se suprapun.

```sop
@t.meeting core.type of=meeting closed=true
@s.meeting.people core.slot of=meeting key=people kind=string many=true
@s.meeting.start core.slot of=meeting key=start kind=number present=true
@s.meeting.length core.slot of=meeting key=length kind=number present=true
@f.over core.function name=overlaps out.kind=boolean pure=true
@f.over.1 core.function.arg of=$f.over name=start1 kind=number
@f.over.2 core.function.arg of=$f.over name=length1 kind=number
@f.over.3 core.function.arg of=$f.over name=start2 kind=number
@f.over.4 core.function.arg of=$f.over name=length2 kind=number
@p.m1   meeting people=?p start=?s1 length=?l1
@p.m2   meeting people=?p start=?s2 length=?l2
@c.two  core.check fn=neq args=$p.m1 args=$p.m2
@c.hit  core.check fn=overlaps args=?s1 args=?l1 args=?s2 args=?l2
@d.busy core.deny when=$p.m1 when=$p.m2 if=$c.two if=$c.hit why="?p already has something at that time"
```

The block first declares the toy meeting type and a typed pure `overlaps` primitive. Its registered implementation tests half-open intervals: `s1 < s2+l2` and `s2 < s1+l1`; it does not choose people or times. The next two wires are meeting patterns. Variabila `?p` apare în amândouă, deci cele două ședințe au același participant. Al treilea fir este o condiție: cele două ședințe găsite nu sunt una și aceeași. Al patrulea este a doua condiție: intervalele lor se suprapun. Al cincilea este interdicția: dacă amândouă modelele se potrivesc și amândouă condițiile sunt adevărate, schimbarea este refuzată. Textul din `why` este motivul; `?p` este înlocuit cu valoarea variabilei.

| Cheia | Ce spune |
|---|---|
| `when`, `not`, `with`, `if` | Ca la `core.rule`. |
| `why` | Motivul refuzului. `?v` scrie valoarea variabilei `v`. |
| `soft` | `true`: interdicția este slabă (vezi mai jos). |
| `priority` | Un număr. Când o schimbare încalcă mai multe interdicții, cea cu numărul mai mic este spusă prima. |

**Tare și slab.** O interdicție obișnuită este **tare (hard)**: schimbarea este refuzată. O interdicție cu `soft=true` este **slabă (soft)**: schimbarea este primită, dar lumea adaugă un fapt de tipul `core.issue`, numit **problemă (issue)**, care spune ce interdicție este încălcată și de către ce fire. Problema dispare singură când încălcarea dispare. Deosebirea este între ce nu se poate și ce nu este firesc. Suprapunerea ședințelor este tare. „Peștii stau în apă” este slabă: aplicația pune singură peștii în iaz, dar îi mută pe cer dacă omul o cere, și poate spune oricând ce este neobișnuit în desen.

**Refuzul.** Când o schimbare este refuzată, biblioteca dă înapoi o **încălcare (violation)**: ce fel de încălcare este, ce regulă, ce fire și motivul. Din ea se compune explicația pentru om. Felurile de încălcare sunt fixe.

| Felul | Când apare |
|---|---|
| `domain` | O valoare nu este de felul, tipul, lista sau marginile cerute de slot. |
| `cardinality` | Mai multe valori la o cheie care primește una. |
| `unknown-key` | O cheie nedeclarată pe un fir de tip închis. |
| `dangling-ref` | O referință la un fir care nu există. |
| `conflict` | A doua valoare, diferită, la o cheie cu o singură valoare. |
| `duplicate-id` | Un identificator declarat a doua oară, cu alt conținut. |
| `variable` | O variabilă într-un fapt. |
| `deny` | O interdicție tare se potrivește. |
| `schema` | O declarație de schemă greșită sau în conflict cu alta. |

### 3.6.1 Constrângeri, norme și valori implicite

O afirmație despre ce se întâmplă de obicei nu are aceeași forță cu o condiție fără de care starea nu poate exista. Cunoașterea poate spune că peștii stau în apă; o aplicație de desen poate permite intenționat un pește pe cer. Calendarul poate însă declara suprapunerea rezervărilor unei persoane drept interdicție tare.

Tăria aparține utilizării unei afirmații într-un tipar de lume. Tabelul distinge refuzul unei schimbări, semnalarea unei abateri și simpla completare a unei valori nespecificate. Un sistem care confundă aceste roluri fie refuză prea mult, fie ascunde încălcări reale.

Cunoașterea spune felul afirmației; tiparul de lume îi dă tăria. O bază de cunoaștere nu declară nimic tare sau slab. Tiparul de lume care folosește afirmația o face. *(R49)*

| Felul afirmației | Tăria, dacă tiparul nu spune altfel |
|---|---|
| fapt de domeniu („peștele stă în apă”) | Slabă. |
| normă („o scrisoare are semnătură”; „un flux are un singur început”) | Slabă în timpul lucrului. La o verificare cerută anume („check the letter”), fiecare normă neîndeplinită este raportată. |
| valoare obișnuită, euristică | Nu este o constrângere. Servește numai la completare și la alegere. |

Tari sunt numai două feluri de reguli: cele fără de care starea nu poate fi reprezentată (o săgeată fără capete) și cele pe care tiparul le declară anume ca tari (un om în două ședințe deodată). *(R50)*

Un pește pe cer este o problemă slabă, nu o stare nevalidă. O ședință trasă cu mâna peste alta a aceluiași om este o încălcare tare dacă tiparul interzice suprapunerea.

O normă slabă permite lucrul intermediar. Scrisoarea fără semnătură poate fi editată și salvată, iar verificarea explicită raportează ce îi lipsește. Verificarea nu ar trebui să adauge o semnătură inventată doar pentru a elimina problema. O valoare implicită are un scop și mai limitat: propune o completare și nu dovedește că alte valori sunt greșite.

Dacă o schimbare făcută manual produce o încălcare tare, observația trebuie păstrată ca descriere a stării reale. Aplicația raportează conflictul și poate propune o reparare; nu falsifică observația pentru a face schema să pară satisfăcută. Această situație este diferită de validarea preventivă a unui plan încă neexecutat.

## 3.7 Calcule, condiții și funcții

**Problema.** Unele condiții și valori nu pot fi exprimate prin potrivirea de fire: dacă două intervale de timp se suprapun; cât este suma a două numere; câte cuvinte are un text. Pentru ele, schema cheamă o **funcție (function)**.

**`core.check`** este o condiție calculată: cheamă o funcție care răspunde adevărat sau fals.

| Cheia | Ce spune |
|---|---|
| `fn` | Numele funcției. Obligatorie. |
| `args` | Argumentele, în ordine: valori, variabile sau modele. Repetată. |
| `why` | Motivul de dat când condiția nu este îndeplinită. |

**`core.calc`** este o valoare calculată: cheamă o funcție și pune rezultatul într-o variabilă, care poate fi folosită apoi în firul de construit.

| Cheia | Ce spune |
|---|---|
| `out` | Variabila care primește rezultatul. Obligatorie. |
| `fn` | Numele funcției. Obligatorie. |
| `args` | Argumentele, în ordine. Repetată. |
| `over` | Un model: funcția este aplicată asupra tuturor potrivirilor lui (un total, un maxim). |
| `pick`, `ties` | Pentru cel mai mare și cel mai mic: ce se dă înapoi și ce se face la egalitate. |

**De unde vin funcțiile.** Biblioteca are un set de funcții generale: aritmetică (`add`, `sub`, `mul`), comparații (`eq`, `neq`, `gt`, `lt`), text, timp și totaluri (`count`, `sum`, `min`, `max`). Un domeniu poate adăuga funcții proprii, scrise ca program obișnuit. Aceasta este permis cu două condiții. Funcția trebuie declarată în schemă, printr-un fir `core.function`, cu numele ei și cu ce primește. Și trebuie să facă numai calculul, fără să schimbe ceva. Este singurul loc în care o regulă a lumii se sprijină pe program, și este un loc declarat.

```
@f.over   core.function name=overlaps out.kind=boolean pure=true doc="two time intervals share a moment"
@f.over.1 core.function.arg of=$f.over name=start1  kind=number
@f.over.2 core.function.arg of=$f.over name=length1 kind=number
@f.over.3 core.function.arg of=$f.over name=start2  kind=number
@f.over.4 core.function.arg of=$f.over name=length2 kind=number
```

Primul fir declară funcția `overlaps`: dă înapoi adevărat sau fals și este pură. Următoarele patru îi declară argumentele, câte un fir pentru fiecare, în ordine; fiecare trimite la firul funcției prin `of`.

| Cheia lui `core.function` | Ce spune |
|---|---|
| `name` | Numele sub care o cheamă `fn=`. |
| `out.kind` | Felul valorii date înapoi. |
| `pure` | `true`: aceleași argumente dau mereu același rezultat și nu se întâmplă nimic altceva. |
| `doc` | Ce face, pentru cititor. |

| Cheia lui `core.function.arg` | Ce spune |
|---|---|
| `of` | Referință la firul funcției. |
| `name` | Numele argumentului. |
| `kind` | Felul valorii lui. |
| `optional` | `true`: poate lipsi. |
| `doc` | Ce este. |

Exemple de funcții proprii ale domeniilor noastre: `overlaps` pentru calendar; `covers` (două lucruri se acoperă pe pagină) pentru desen; `crossings` (câte săgeți se încrucișează) pentru diagrame; `words` (câte cuvinte are un text) pentru documente.

## 3.8 Celelalte tipuri predefinite

Tipurile de mai jos completează lista tipurilor `core.` ale limbajului. Sunt date pe scurt; cheile fiecăruia sunt în `docs/reference.md` al bibliotecii.

| Tipul | La ce folosește |
|---|---|
| `core.aggregate` | Un total peste toate potrivirile unor modele, fără un fir de care să fie legat: câte ședințe are fiecare om. |
| `core.rank` | Locul unui fir printre cele asemenea lui, după o cheie: „al doilea paragraf”. |
| `core.relation` | O relație liniară între valori, din care se calculează oricare lipsește. |
| `core.abducible` | Ce are voie lumea să presupună când este întrebată ce ar trebui să fie adevărat pentru ca ceva să fie posibil. Are un cost. |
| `core.tier` | Un nivel de încredere pentru valori: spus de om, presupus, obișnuit. O valoare de la un nivel mai sigur o înlocuiește pe una mai puțin sigură. |
| `core.issue` | Problema notată când o constrângere slabă este încălcată (secțiunea 3.6). Este un fapt făcut de bibliotecă. |
| `core.word` | Un cuvânt și numele din schemă pe care îl înseamnă: un tip, o cheie, o valoare, un act. Limbajul nu cunoaște limbi; cuvintele unei lumi sunt în engleză, iar traducerea se face în afara lumii. |
| `core.use` | Încarcă în lume o schemă publicată (secțiunea 5.3). |
| `core.module` | O schemă care își spune numele, ce importă și ce tipuri lasă altora să citească (secțiunea 5.3). |
| `core.schema.map` | Spune cum se citesc declarații de tipuri și de sloturi scrise în altă notație. |
| `core.namespace` | Declară un început de nume de chei care sunt primite pe orice fir, fără verificare. Este folosit pentru chei de evidență. Nu are legătură cu spațiile de nume din secțiunea 2.6. |
| `core.sequence` | Declară cheia care dă locul unui fir într-o succesiune. |
| `core.fluent`, `core.effect` | O cheie a cărei valoare este o stare schimbată de evenimente, și cum o schimbă fiecare fel de eveniment. |
| `core.action` | O operație care schimbă lumea la cerere, scrisă ca fire sau ca funcție. |
| `core.producer` | O funcție a programului care calculează o cheie atunci când este cerută. |
| `core.question`, `core.answer`, `core.request` | Fapte prin care se ține o întrebare pusă, răspunsul la ea și o cerere de acțiune. |
| `core.precision` | Câte zecimale păstrează numerele calculate. |

Cheile care încep cu `core.` (de exemplu `core.source`, care ține de unde vine un fapt) sunt chei de evidență: sunt primite pe orice fir.

## 3.9 Ce face lumea cu schema

**Verificarea.** Orice schimbare (unul sau mai multe fire spuse deodată) este verificată față de schemă înainte de a fi primită. Firele unei schimbări sunt judecate împreună: dacă unul este refuzat, nu rămâne niciunul. O schimbare primită poate lăsa chei deschise (secțiunea 3.3) și probleme (secțiunea 3.6); acestea nu sunt refuzuri.

**Three semantic outcomes.** Checking must distinguish a proved violation from a condition that cannot yet be evaluated. A meeting without a duration has no proved overlap, but its interval is not proved free either. These are semantic assessment outcomes, not interchangeable success flags.

| Rezultatul | Ce înseamnă |
|---|---|
| validă (valid) | Nicio interdicție tare nu este încălcată și toate au putut fi verificate. |
| nevalidă (invalid) | Cel puțin o interdicție tare este încălcată. |
| nedeterminată (undetermined) | Nicio încălcare găsită, dar cel puțin o interdicție tare nu a putut fi verificată. |

Before dispatch, affected hard constraints must be decided. If a duration is missing, the library obtains a plausible value from declared knowledge or context and validates the completed interval. A declared 30-minute default gives an event starting at 10:30 the interval [10:30,11:00). If that interval overlaps a hard reservation, it is not committed. Remaining undetermined hard preconditions are reported as unresolved; absence of a detected violation is never a successful reservation.

**Întrebările.** Unei lumi i se pot pune întrebări scrise ca modele: „care sunt nodurile și ce etichetă are fiecare?”. Răspunsul este lista potrivirilor. La o întrebare de felul „există…?”, răspunsul este da, nu sau nu se știe.

**Anularea.** O lume ține minte fiecare schimbare și o poate anula sau reface.

**Copia de încercare.** O lume poate fi copiată. O **copie (fork)** este o a doua lume, la început identică, în care se poate încerca o schimbare fără a atinge originalul. LIB uses this internally to evaluate candidate changes before compiling the chosen executable circuit. The application submits the request; it does not orchestrate candidate forks.

### 3.9.1 Informație incompletă, negație și validare

Absența unei valori nu spune de ce lipsește aceasta. Într-un calendar, sala poate să nu fie aleasă încă sau ședința poate să nu aibă nevoie de sală. Prima situație cere completare; a doua este o informație pozitivă despre lipsa unei resurse. Dacă le confundăm, fie întrebăm inutil, fie declarăm disponibilă o rezervare pe care încă nu o putem verifica.

Trebuie separate și două întrebări: „am găsit o încălcare?” și „am suficiente informații ca să dovedesc validitatea?”. Un rezultat fără încălcări găsite nu răspunde automat afirmativ la a doua întrebare. Starea valorii, potrivirea unui pattern și concluzia verificării trebuie deci urmărite separat.

A value can be known, unknown, or explicitly inapplicable. The schema must represent these cases distinctly. For a resource-free calendar event, an explicit resource requirement of false is not the same as an unknown resource. An ordinary atom named `none` does not acquire special absence semantics by its spelling. A closed schema must declare any absence/status representation it accepts. *(R9)*

A pattern matches the values actually present. A condition binding a resource does not invent one when the key is absent. `core.absent` checks missing keys; it does not reinterpret an arbitrary domain atom as absence. Constraint evaluation uses the declared applicability condition before deciding whether a missing resource makes the check undetermined. *(R10)*

`not=` vorbește despre ce ține lumea acum. O regulă cu `not=$p` se aplică atunci când niciun fapt de acum nu se potrivește cu `p`. Nu afirmă că așa ceva nu există în realitate. De aceea un fir dedus printr-un `not=` este retras de îndată ce apare faptul care lipsea. *(R11)*

Întrebarea „există?” are trei răspunsuri. Da, dacă un fapt se potrivește. Nu, dacă niciunul nu se potrivește și tipul este declarat `complete`. Nu se știe, în rest. *(R12)*

Verificarea unei schimbări privește toate interdicțiile ale căror modele se pot potrivi cu cel puțin un fir atins de schimbare (adăugat, modificat sau șters). Fiindcă modelele unei interdicții se leagă între ele prin variabile, aici intră și firele neatinse: la mutarea unei ședințe sunt verificate toate ședințele care au aceeași sală sau un participant comun. *(R13)*

Verificarea unei interdicții este nedeterminată când un fir atins se potrivește cu un model al ei la toate cheile pe care le are, dar îi lipsește o cheie pe care modelul sau o condiție a interdicției o citește. *(R14)*

| Starea ședinței noi | Rezultatul verificării suprapunerii |
|---|---|
| are început și durată; nu se suprapune | Validă. |
| are început și durată; se suprapune cu alta a Anei | Nevalidă, cu încălcarea care numește cele două ședințe. |
| are început, dar durata este necunoscută | Undetermined until duration is completed from declared policy and the interval is checked; no reservation is claimed meanwhile. |
| explicitly requires no resource | Resource-occupancy constraints are inapplicable by declaration; participant constraints still apply. |
| primește două ore de început diferite | Refuzată ca `conflict`, înainte de orice interdicție. |

În tabelul ședinței, „nedeterminată” este un rezultat propriu al verificării. Nu este o eroare de parsare și nici o interdicție demonstrată. De exemplu, începutul 10:30 fără durată nu spune dacă ședința ajunge până la următoarea rezervare. Aplicația păstrează cererea incompletă și caută informația necesară, fără să pretindă că a rezervat intervalul.

Completitudinea privește un domeniu de căutare identificat: instanța, tipurile și starea încărcată. O listă completă de ședințe pentru un calendar nu dovedește că au fost încărcate toate regulile de cunoaștere. Similar, `not` poate produce o concluzie revocabilă despre starea curentă, dar aceasta nu poate fi prezentată ca adevăr despre date pe care sistemul nu le-a citit.

## 3.10 Câteva precizări

**O valoare care lipsește** înseamnă că nu este cunoscută. Nu înseamnă „nu” și nu înseamnă „fals”. Dacă ședința nu are sală, nu se știe în ce sală este. Un „nu” se scrie explicit.

**O regulă căreia îi lipsește o valoare** nu se potrivește. Nu presupune nimic în locul valorii.

**Un fapt nu poate fi folosit ca model.** O regulă poate numi numai fire din același text cu ea. Un fir cu identificatorul unui model, spus mai târziu de unul singur, este un fapt și nu are legătură cu modelul.

**Un fir dedus dispare** când nu mai are niciun temei, adică atunci când nicio regulă nu îl mai cere.

---

# 4. Lumea legendelor

The legend World declares meanings shared by otherwise independent schemas: identity, quantity, position, time, part, relation and change. The library reads these declarations when elaborating a request. A shared name alone supplies neither a metric nor a default, inference rule or tool implementation; each needs its own declared contract.

## 4.1 Problema

Consider four structural slots from different domains:

```
@s1 core.slot of=drawn   key=at    kind=number many=true
@s2 core.slot of=node    key=at    kind=number many=true
@s3 core.slot of=section key=order kind=integer
@s4 core.slot of=meeting key=room  type=room
```

These slots cannot be interchanged merely because they all answer “where?”. A page coordinate is a numeric point in a frame, document order is a discrete position in a sequence, and a meeting room is an identified resource. The shared concept identifies the semantic family. The declared space, units, ordering and target type determine the legal calculation. “Move up” may decrease a page coordinate; it cannot silently subtract one from a room identifier.

Without those declarations, a handler has to guess meaning from a slot or domain name. With them, the library follows the referenced concept and operations; a concrete tool receives the resulting typed values.

## 4.2 Soluția

Se adaugă o singură lume, numită **lumea legendelor (legend world)**, care conține conceptele generale: loc, timp, însușire, cantitate și celelalte. Numele vine de la legenda unei hărți, care spune ce înseamnă fiecare semn. Lumea legendelor nu conține lucruri. Conține numai conceptele prin care se descrie orice altă lume.

Each domain type and slot declares its semantic concept and the structure needed by that concept (§4.7). A link to `place` does not make every location numeric. The library selects operations whose declared argument types, frame and units match the slot. A room relation uses identity and availability; a page position uses geometry.

## 4.3 Conceptele generale

Conceptele sunt puține, fiindcă sunt foarte abstracte. Se găsesc întrebând ce se poate întreba despre orice lucru și despre orice întâmplare, oricare ar fi lumea. The table fixes the vocabulary used in this book; another concept requires a defined interpretation, not merely a name. Prima coloană este numele conceptului așa cum se scrie în fire.

| Conceptul | Ce este, cu un exemplu din fiecare domeniu |
|---|---|
| `thing` | Lucru: orice despre care se poate vorbi și care poate fi arătat. Un pește desenat, un nod, un paragraf, o ședință. |
| `kind` | Fel: ce este un lucru. Pește, nod, scrisoare, ședință. Felurile stau într-un singur arbore (secțiunea 5.2). |
| `whole`, `part` | Întreg și parte: un lucru făcut din alte lucruri. Un iaz cu pești; o diagramă cu noduri; o scrisoare cu părțile ei; o zi cu ședințele ei. |
| `collection` | Grup: mai multe lucruri luate împreună, cu sau fără ordine. Copacii unei păduri; pașii unui flux; capitolele unui raport. |
| `name` | Nume: cum este numit un lucru. Eticheta unui nod, titlul unui document, numele unei ședințe. |
| `quality` | Însușire: o proprietate a unui lucru. Culoarea unui pește, forma unui nod, tonul unei scrisori, durata unei ședințe. Valoarea ei este un punct într-un spațiu (secțiunea 4.4). |
| `quantity` | Cantitate: un număr, cu sau fără unitate. Trei pești, șase noduri, 200 de cuvinte. |
| `relation` | Relație: ceva adevărat despre două lucruri luate împreună. O săgeată între două noduri; un pește în iaz. |
| `place` | Loc: unde este un lucru (secțiunea 4.7). |
| `time` | Timp: când și cât (secțiunea 4.7). |
| `belonging` | Apartenență: al cui este. Calendarul omului; participanții unei ședințe. |
| `change` | Schimbare: trecerea de la o stare la alta (secțiunea 4.6). |
| `act` | Act: o schimbare cerută de cineva (secțiunea 4.6). |
| `role` | Rol: partea pe care o joacă un lucru într-un act. În „move the duck to the lake”, rața este lucrul mutat, iar lacul este ținta. |
| `manner` | Mod: cum se face. „Neatly”, „at random”, „formally”. |
| `cause`, `purpose` | Cauză și scop: de ce și pentru ce. O ședință „for the budget”. |
| `topic` | Subiect: despre ce este. O scrisoare „about a late delivery”. |
| `statement` | Afirmație: ceva spus despre lucruri, de un anumit fel: fapt, normă, valoare obișnuită, preferință, cerință a omului, presupunere a aplicației (secțiunile 5.1 și 6.6). |
| `negation`, `scope` | Negație și cuprindere: „nu”; și despre câte lucruri se vorbește: toate, unele, niciunul, fiecare. |
| `agent` | Cel care acționează: omul, aplicația, un participant. |
| `resource` | Resursă: ceva care se ocupă și se poate termina. Spațiul paginii, o sală, timpul unui om. |

## 4.4 Spațiile conceptuale

**Problem.** `enum=red enum=blue enum=green` validates three symbols but says nothing about “darker”, the distance between colours or the coordinates of turquoise. A colour space defines these operations once. A tool with a restricted palette still declares its accepted values; the library computes a compatible realization without treating that finite palette as the entire space.

**Principiul.** Valoarea unei însușiri nu este un cuvânt dintr-o listă. **Este un punct într-un spațiu, iar cuvintele sunt nume date unor zone ale acelui spațiu.** Spațiul se numește **spațiu conceptual (conceptual space)**.

**Spații cu axe.** Cele mai multe însușiri se pot măsura. Spațiul unei asemenea însușiri are una sau mai multe **axe (axes)**, iar pe fiecare axă valoarea este un număr. O valoare este un punct: câte un număr pentru fiecare axă.

| Însușirea | Axele spațiului ei |
|---|---|
| mărime | O axă: de câte ori mai mare sau mai mic decât obișnuit. |
| culoare | Trei axe: nuanță, saturație, luminozitate. |
| formă | Câteva axe: număr de laturi, rotunjime, alungire. |
| poziție pe pagină | Două axe: orizontală și verticală. |
| timp | O axă: momentul. Durata este o lungime pe această axă. |
| lungimea unui text | O axă: numărul de cuvinte. |
| tonul unui text | Câteva axe: formalitate, căldură, fermitate. |

**Cuvintele sunt regiuni.** Un cuvânt ca „red”, „oval” sau „formal” numește o **regiune (region)** a spațiului: o zonă cu un **centru**, care este exemplul cel mai tipic, și cu o întindere în jurul lui. Un punct apropiat de centru este limpede roșu; unul de la margine este roșu spre portocaliu. Regiunile pot fi una în alta: cercul este o regiune în interiorul elipsei.

**Ce se câștigă.** Odată ce valorile sunt puncte, lucruri care altfel ar trebui scrise caz cu caz se obțin prin calcul, la fel pentru orice spațiu.

| Calculul | Ce rezolvă |
|---|---|
| distanța dintre două puncte | Cât de apropiate sunt două culori, două forme, două ore. |
| cel mai apropiat punct posibil | Omul cere „oval” într-o diagramă care are opt forme: se alege elipsa. Omul cere o oră ocupată: se propune cea mai apropiată oră liberă. |
| dacă un punct este într-o regiune | Dacă un nod este „round”; dacă o ședință este „in the morning”. Așa se găsește „the red fish”. |
| un pas pe o axă | „Darker”, „bigger”, „rounder”, „later”, „longer”, „more formal”. Toate sunt un pas pe axa potrivită, pornind de la valoarea de acum. |
| o regiune în alta | Un cerc este o elipsă; „navy” este un fel de „blue”; dimineața este o parte a zilei. |

**Spații fără axe.** Unele concepte nu se pot măsura cu numere: ce este o scrisoare, ce este o diagramă de flux, ce este un iaz ca scenă desenată. Nici acestea nu sunt cuvinte dintr-o listă. Fiecare este descris de un **graf de relații și constrângeri**: din ce părți este făcut, în ce ordine stau ele, care sunt obligatorii.

| Conceptul | Graful lui |
|---|---|
| scrisoare | Formulă de început, introducere, cuprins, încheiere, semnătură, în această ordine. Prima și ultima sunt obligatorii. |
| diagramă de flux | Noduri legate într-o singură direcție, cu un început și un sfârșit. |
| grafic cu bare | Un fel de diagramă: bare a căror înălțime este o cantitate, așezate pe o axă. |
| iaz, ca scenă | Apă; în ea, pești și nuferi; pe margine, stuf. |

Apropierea dintre două asemenea concepte se calculează tot: câte părți și legături au în comun grafurile lor. Calculul are sens numai între două concepte cunoscute; ce se face cu un fel necunoscut sau fără graf propriu este în secțiunea 4.4.2.

**Excepții.** Câteva lucruri rămân liste închise, fiindcă țin de un sistem formal care are într-adevăr numai câteva valori: adevărat sau fals; persoana unui verb. Pentru acestea cheia `enum` rămâne potrivită. Fiecare excepție se declară cu motivul ei.

### 4.4.1 Metrici, apartenență și includerea regiunilor

Un spațiu conceptual devine utilizabil numai după ce știm cum comparăm valorile lui. „Aproape” nu are aceeași unitate pentru o nuanță, o poziție și o durată. Normalizarea face comparabile diferențele în interiorul metricii declarate; ponderile exprimă contribuția fiecărei axe la acea metrică.

Apartenența întreabă dacă un punct respectă descrierea unei regiuni. Includerea întreabă dacă toate punctele unei regiuni aparțin alteia. A doua afirmație este mai puternică: verificarea unui singur punct, chiar centrul, nu o dovedește. Calculul distanței și utilizările lui sunt explicate separat mai jos.

Fiecare axă este adusă la aceeași scară. Pentru o axă liniară cu limite finite distincte și fără scară explicită `normalisation`, diferența se normalizează ca `delta = abs(a − b) / (max − min)`. Când ambele valori sunt în limite, rezultatul este între 0 și 1. O axă poate avea o pondere, `weight`, implicit 1. *(R18)*

Pe o axă circulară (`kind=angle`, cu `period=360` în exemplul nuanței), diferența este drumul cel mai scurt pe cerc, împărțit la jumătate de perioadă. Între nuanțele 350 și 0 diferența este 10/180, adică 0,056. *(R19)*

Distanța dintre două puncte este `sqrt(sum(weight_i * delta_i²))`, unde `delta_i` este diferența normalizată pe axa `i`. Ponderile trebuie să fie pozitive; o axă nerelevantă pentru o regiune este omisă din restricția acelei regiuni, nu transformată într-o axă cu distanță nedefinită. *(R20)*

O regiune poate lăsa axe nespuse. „Dark” spune numai `centre.lightness=0.25`; orice nuanță și orice saturație sunt primite. Distanța până la o asemenea regiune se calculează numai pe axele spuse. *(R21)*

In this representation, două regiuni ale aceluiași spațiu pot restrânge axe diferite:

```text
Illustrative region description; pseudocode, not SOP Lang:
space colour: axes hue [0,360), saturation [0,1], lightness [0,1]
dark: constrain lightness to [0.15,0.35]; hue and saturation unrestricted
red: constrain circular hue to [350,360) or [0,10],
     saturation to [0.8,1], lightness to [0.4,0.6]
```

Primul fir numește regiunea `dark` din spațiul `colour` și fixează numai luminozitatea centrului. Cu axa luminozității între 0 și 1 și ponderea 1, sunt admise valorile între 0,15 și 0,35, inclusiv. Nuanța și saturația nu participă la acest test. Al doilea fir fixează toate cele trei axe, deci apartenența la `red` folosește toate cele trei diferențe normalizate. Exemplele presupun axele spațiului deja declarate; aceste fire declară regiuni, nu axe noi.

| Punctul `(hue, saturation, lightness)` | Verificarea regiunilor declarate |
|---|---|
| `(0, 0.9, 0.25)` | În `dark`: diferența este 0. Nu este în `red`: diferența de luminozitate 0,25 depășește singură raza 0,12. |
| `(350, 0.9, 0.5)` | În `red`: diferența circulară este aproximativ 0,056. Nu este în `dark`: luminozitatea este în afara intervalului. |
| `(240, 0.2, 0.35)` | Pe marginea lui `dark`, deci admis. Nuanța albastră nu schimbă acest rezultat. |

Un punct este în regiune când distanța lui până la centru este cel mult `spread`. Marginea face parte din regiune. Exemplu: nuanța 350, saturația 0,9, luminozitatea 0,5 față de „red” (centrul 0; 0,9; 0,5; `spread` 0,12): distanța este 0,056, deci punctul este roșu. *(R22)*

Regiunile se pot suprapune. Un punct poate fi și „red”, și „orange”. La căutare („the red fish”) contează apartenența. La numire, în răspuns, se folosește regiunea cu centrul cel mai apropiat. O regiune din mai multe bucăți se scrie ca mai multe fire cu același nume. *(R23)*

Includerea unei regiuni în alta se calculează. Centrul dinăuntru nu este o dovadă suficientă. Pe o axă, intervalul [4, 8] are centrul 6 în [0, 7], dar punctul 8 este în afară. Pentru două bile în aceeași metrică, o condiție suficientă este `distanța dintre centre + raza interioară ≤ raza exterioară`. Pentru intervale se compară ambele capete. Pentru forme generale, verificatorul trebuie să poată demonstra includerea prin operațiile declarate ale spațiului. Dacă nu poate, rezultatul este nedeterminat; relația nu se folosește ca adevăr demonstrat. Eșantionarea câtorva puncte poate găsi un contraexemplu, dar nu dovedește includerea. La aplicarea testului trebuie comparate aceleași axe, în aceeași metrică. O axă omisă din regiunea interioară rămâne liberă în limitele spațiului: dacă regiunea exterioară o restrânge, includerea nu rezultă din testul centrelor și razelor. De exemplu, „dark” lasă nuanța liberă și nu este inclus în „blue”, chiar dacă alegem pentru ilustrare un centru albastru. *(R24)*

Region inclusion is calculated with a proof, not accepted from an unverified `inside` label. The justification names the region definitions and metric and becomes invalid when either changes. Finding a blue fish uses membership of its observed colour point in the blue region; it does not require inclusion between two entire regions.

When admissible values have the same distance, the library retains both and applies a declared ranking policy. For an omitted value in a reversible operation, a stable declared tie-break can choose one, retain the alternative and report the assumption. For an exact request of 10:30, neither 10:00 nor 11:00 satisfies the requirement: these remain alternatives, never silently rewritten requirements. Choosing an interpretation does not authorize overriding an explicit constraint. *(R25)*

De exemplu, pe o axă liniară cu limitele 0 și 100, valorile 20 și 30 au diferența normalizată 0,1. Pe un cerc, 350 și 0 sunt apropiate deoarece trecerea prin origine este permisă; scăderea obișnuită ar produce greșit o distanță mare. Formula trebuie aleasă din tipul axei, nu din numele cuvântului căutat.

Pentru o axă liniară fără limite finite, normalizarea prin `max−min` nu este definită; se folosește scara explicită `normalisation`, conform secțiunii 8.2.1. Pe axele circulare rămâne valabilă normalizarea prin jumătate de perioadă.

### 4.4.2 Structura conceptelor și reutilizarea prin specializare

Nu toate conceptele sunt descrise prin coordonate. Un document are părți și relații de ordine, iar o diagramă are noduri și legături. Un graf conceptual descrie această structură: ce părți pot apărea, câte sunt necesare și cum sunt legate. El nu este graful obiectelor concrete dintr-un document anume, ci schema structurii pe care acestea o pot realiza.

Comparația structurală cere două descrieri disponibile. Dacă sistemul nu cunoaște deloc un gen, nu poate calcula distanța până la el. Lipsa unei descrieri și lipsa unei realizări specifice au consecințe diferite, separate în regulile și cazurile de mai jos.

Graful unui concept cuprinde o mulțime de părți, fiecare cu felul ei, cu un număr minim și maxim de apariții (minimul 1 înseamnă obligatorie), și o mulțime de legături între părți, fiecare cu o etichetă: `before` (ordine), `in` (cuprindere), `to` (săgeată). *(R26)*

Apropierea a două grafuri este partea comună împărțită la tot: se numără părțile și legăturile care apar în amândouă și se împart la cele care apar în cel puțin unul. O parte obligatorie contează dublu în calculul atât al intersecției, cât și al reuniunii. Rezultatul este între 0 și 1. Calculul are sens numai între două grafuri cunoscute; se folosește la întrebări ca „cu ce gen seamănă acest document?”. *(R27)*

Un fel necunoscut nu este înlocuit. Față de un concept fără descriere nu se poate calcula apropierea structurală. Sunt relevante următoarele cazuri, după cunoașterea disponibilă. *(R28)*

| Ce se știe despre felul cerut | Ce face aplicația |
|---|---|
| nu este în arborele felurilor | Nu a înțeles cuvântul. Spune: „I do not know what a memo is.” Nu face nimic. |
| este în arbore, dar nu are graf propriu | Folosește graful celui mai apropiat strămoș care are unul (un memo este un text) și spune o dată ce a folosit. Lucrul rămâne de felul cerut. |
| are graf propriu | Îl folosește. |

If equally specific sources provide different composition graphs, the library retains both, ranks their compatibility with the request and instance, and records the selected graph and uncertainty. File order is not semantic evidence.

Moștenirea unei structuri nu schimbă identitatea semantică a obiectului. Un gen cunoscut ca specializare a textului poate primi structura disponibilă pentru text și poate rămâne de genul cerut. Sistemul trebuie să spună ce structură a reutilizat și ce particularități nu sunt cunoscute; nu poate afirma că a respectat cerințe pe care nu le deține.

Pentru a calcula apropierea a două grafuri, părțile trebuie aliniate prin conceptele lor, nu prin identificatorii locali ai declarațiilor. Două secțiuni numite diferit pot realiza același rol, iar două părți cu aceeași etichetă pot avea roluri diferite. Formula de suprapunere presupune această corespondență; în lipsa ei, un scor numeric ar ascunde o comparație nedefinită.

### 4.4.3 Sisteme de coordonate și semantica timpului

Un număr de poziție nu poate fi interpretat fără un reper, iar o oră locală nu identifică singură un moment. În ambele cazuri, sistemul trebuie să cunoască regulile prin care reprezentarea este legată de spațiul sau timpul folosit de aplicație. Aceste reguli trebuie păstrate și atunci când datele trec între lumi.

Poziția, relația geometrică, momentul și seria recurentă sunt niveluri distincte. Fiecare cere propriile declarații și propriile verificări înainte de acțiune.

Fiecare spațiu de loc își declară reperul: originea, sensul axelor și unitatea. Pagina are originea în colțul din stânga sus, axa orizontală spre dreapta, axa verticală în jos, iar unitatea este unitatea paginii. „Above” înseamnă deci un număr mai mic pe axa verticală. Poziția unui lucru este întotdeauna în reperul paginii, chiar dacă lucrul este „în” altul. *(R44)*

Relațiile de loc sunt definite prin numere, în funcția `test` a fiecărei relații (R15). „Near”: distanța dintre marginile celor două lucruri este mai mică decât o fracțiune din diagonala paginii (0.15 in this example). „Above”: mai sus pe axa verticală și suprapus pe cea orizontală. *(R45)*

Pentru a declara verificarea geometrică, o relație numește funcția care o decide. The following declaration names the relation contract, and `page.above` este numele unui contract de funcție ce trebuie furnizat de adaptorul geometric:

```sop
@space.page w.legend.space name=page form=axes version=1
@rel.above w.legend.relation name=above space=$space.page test=page.above
```

`name=above` numește relația; `space=$space.page` identifies the declared space; `test=page.above` leagă relația de operația de verificare. Funcția primește limitele geometrice observate ale obiectului și țintei în același reper. În convenția acestui exemplu, întoarce adevărat când marginea de jos a obiectului este cel mult marginea de sus a țintei și proiecțiile lor orizontale se intersectează pe o lungime pozitivă. Lipsa limitelor geometrice produce un rezultat nedeterminat, nu fals. Firul nu implementează funcția prin simpla numire: dacă operația lipsește, relația nu poate fi verificată.

| Limite verticale și proiecții orizontale | Rezultatul testului `above` |
|---|---|
| Obiectul are baza la 20, ținta începe la 30; proiecțiile se suprapun | Adevărat: obiectul este deasupra și există suprapunere orizontală. |
| Obiectul are baza la 20, ținta începe la 30; proiecțiile sunt disjuncte | Fals: poziția este mai sus, dar nu satisface relația declarată. |
| Limitele țintei nu sunt disponibile | Nedeterminat: nu există date suficiente pentru test. |

În calendar, o ședință ține un moment absolut de început și o durată. Calendarul își declară fusul orar; orele spuse de om sunt înțelese în acel fus. Intervalul este semideschis, `[început, sfârșit)`: își cuprinde începutul și nu își cuprinde sfârșitul. Astfel, o ședință care se termină la 11:00 și una care începe la 11:00 nu se suprapun, deci sala este liberă. *(R46)*

A local time is resolved with its date, timezone and timezone rules. A time that does not exist at a seasonal transition cannot become an executable timestamp; the conflict and admissible alternatives must be reported. A repeated local time gives two offset candidates. Context and a declared policy can choose a reversible interpretation, with the selected offset and uncertainty stated. A tool never receives an unresolved local-time ambiguity. *(R47)*

Recurența descrie o serie de apariții ale unei ședințe. Seria păstrează regula de repetare, fusul orar și excepțiile; fiecare apariție are identitate stabilă. Modificarea uneia trebuie deosebită de modificarea întregii serii. Verificarea conflictelor privește aparițiile din intervalul verificat, nu o expansiune infinită. O serie fără sfârșit nu poate fi declarată liberă pentru tot viitorul după verificarea unui număr finit de apariții. Reprezentarea persistentă trebuie să lege fiecare apariție de serie și de excepțiile aplicabile. Formatul complet al acestor declarații rămâne deschis; comportamentul editării și al verificării este descris mai jos. *(R48)*

Durata și fusul orar trebuie cunoscute înainte de compararea momentelor; textul „Monday at ten” singur nu este o reprezentare persistentă suficientă.

A recurring edit resolves its scope to an occurrence, a series, or occurrences from a boundary onward. The library ranks scopes using request and context. For an unqualified reversible “move the Monday meeting”, a declared occurrence-level default can avoid changing an entire series; the selected scope is reported and undoable. A check of eight occurrences establishes only that horizon. Undo restores the affected rule, exceptions and occurrence identities.

### 4.4.4 Modificări cu cantitate explicită și relații măsurate

O schimbare relativă nu numește direct valoarea finală: o definește față de o valoare observată. Contractul trebuie să precizeze operația, cantitatea, unitatea, starea de referință și, pentru o întindere, ancora păstrată. Altfel, „shorten by 15 minutes” ar putea muta începutul, sfârșitul sau ambele. Regula generală se declară pe felul și însușirea relevante, iar cererea o poate particulariza explicit.

An edit policy declares the fixed anchor. This meeting-duration policy preserves the start; a node-size policy can preserve the centre. Neither choice follows from a numeric axis name:

```sop
@policy.duration std.change.policy kind=meeting concept=duration anchor=start unit=minute
```

`kind` and `concept` identify the policy domain, `anchor` names the fixed reference, and `unit` fixes the duration unit. The library resolves these names, filters incompatible policies and ranks the remaining policies by declared specificity and context. An explicit request anchor wins over a default. Preserving both endpoints while changing duration is contradictory; the library cannot solve it by dropping an endpoint constraint.

Pentru „shorten the review by 15 minutes”, descrierea de cerere poate folosi extensia următoare a constrângerii din secțiunea 6.3.2. Review este presupus numele unei singure întâlniri identificate în instanță.

```sop
@source.shorten std.request.source text="shorten the review by 15 minutes"
@request.shorten std.request act=change mood=do source=$source.shorten
@target.review std.request.target request=$request.shorten mode=existing kind=meeting name=review
@change.duration std.request.constraint request=$request.shorten target=$target.review concept=duration operator=delta value=-15 unit=minute baseline=before anchor=start character=requirement polarity=positive source=$source.shorten
```

`operator=delta` înseamnă valoare finală egală cu valoarea de referință plus cantitatea semnată, după conversia unităților. `baseline=before` cere observația de dinaintea pasului, cu versiunea ei; nu cere recitirea și aplicarea repetată a scăderii la fiecare încercare. `anchor=start` fixează începutul, iar durata determină noul sfârșit. Rerularea unui plan trebuie corelată cu identitatea operației din jurnal, nu interpretată ca încă o cerere de scurtare.

| Observație sau variantă | Calculul și obligația |
|---|---|
| Intervalul [10:00, 11:00), scurtare cu 15 minute | Durata 60 devine 45; începutul rămâne 10:00, sfârșitul devine 10:45. |
| Aceeași scurtare, cu sfârșitul păstrat explicit | Durata devine 45, sfârșitul rămâne 11:00 și începutul devine 10:15. |
| Durata inițială 10 minute, scurtare cu 15 | Rezultatul −5 nu este o durată validă. Cerința nu se aproximează tacit la zero; se explică incompatibilitatea. |
| „Twice as long” | `operator=factor value=2` înmulțește durata de referință; factorul este adimensional și cere o scară de raport. |
| „20% shorter” | Factorul este 0,8. Nu înseamnă scăderea a 20 de minute și nu se mai aplică pasul implicit. |

Pentru „every meeting on Friday”, selecția întâlnirilor se rezolvă în data și fusul orar cererii, apoi aceeași constrângere se aplică fiecărui membru prin cuantificarea din secțiunea 10.3.1. Verificarea include toate cerințele fiecărui candidat, nu doar durata: participanți, resurse și eventuale limite minime. Apartenența la o zi folosește timpul civil, pe când calculul duratei folosește momentele rezolvate și unitatea declarată; nu se presupune că orice zi are aceeași durată. Un membru incompatibil nu este omis din „every” pentru a raporta succesul grupului.

O relație măsurată cere, suplimentar față de relație și țintă, punctele ori marginile între care se măsoară și unitatea. Pentru „put a reminder 10 minutes before the review”, condiția asupra rezultatului poate fi:

```sop
@source.reminder std.request.source text="put a reminder 10 minutes before the review"
@request.reminder std.request act=make mood=do source=$source.reminder
@target.reminder std.request.target request=$request.reminder mode=new kind=reminder
@target.meeting std.request.target request=$request.reminder mode=existing kind=meeting name=review
@relation.reminder std.request.constraint request=$request.reminder target=$target.reminder concept=time operator=relation relation=before goal=$target.meeting measure=10 unit=minute from=instant to=start character=requirement polarity=positive source=$source.reminder
```

`from=instant` desemnează momentul reminderului, `to=start` începutul întâlnirii, iar `measure=10` cere exact diferența orientată de 10 minute. Dacă întâlnirea începe la 10:00, rezultatul trebuie să fie 09:50 în aceeași cronologie. Un simplu test „mai devreme” ar accepta și 09:00, deci nu satisface această cerere. O cerință „at least 10 minutes before” adaugă `comparison=greater.equal`; fără acea precizare, valoarea măsurii este exactă. Funcția de verificare a relației primește aceste argumente tipizate și întoarce nedeterminat dacă reperul sau momentul lipsește.

Aceeași structură servește „2 cm left of the house”, dar contractul geometric trebuie să numească marginile între care măsoară distanța și conversia în reperul paginii. Pentru „two paragraphs after the introduction”, măsura este o distanță discretă în ordinea părților, nu o lungime în centimetri. Unitățile, capetele și ordinea sunt ale relației declarate; nu sunt alese tacit de funcția gazdei după cuvintele mesajului. Un reminder astfel creat fixează momentul calculat la versiunea citită; urmărirea automată a unei întâlniri mutate ulterior cere o dependență persistentă explicită, nu rezultă numai din proveniența cererii.

### 4.4.5 Însușiri agregate și egalitatea cu o valoare de referință

O însușire a unui întreg poate fi calculată din părțile lui. Paleta unui desen, durata totală a ședințelor unei zile și ziua cu cele mai multe ședințe sunt rezultate derivate, dar folosesc operații diferite. Contractul însușirii declară ce părți intră în calcul, ce valoare contribuie fiecare, operația de agregare și condițiile în care rezultatul este cunoscut. `core.aggregate` oferă un mecanism de agregare; sensul unei palete sau al unei zile aglomerate trebuie declarat de domeniu.

Să definim aici paleta ca mulțimea culorilor de umplere distincte ale formelor vizibile dintr-un desen, într-un spațiu de culoare declarat. Contururile, fundalul și formele ascunse nu intră în această definiție. Este o definiție explicită pentru exemplu, nu singurul sens posibil al cuvântului „paletă”. Dacă aplicația folosește o distribuție ponderată după suprafață, ea declară altă însușire, cu altă regulă de comparare. Egalitatea mulțimilor de culori nu garantează egalitatea proporțiilor lor.

| Date și operație | Rezultat și interpretare |
|---|---|
| Forme vizibile cu umpleri roșu, roșu și albastru; mulțime distinctă | Paleta este `{roșu, albastru}`. Repetarea roșului nu adaugă o culoare. |
| Durate de 30 și 60 de minute; sumă | Totalul este 90 de minute de ședințe. Dacă ele se suprapun, acesta nu este timpul ocupat pe ceas; acela cere reuniunea intervalelor. |
| Două zile cu același număr maxim de ședințe; selecția maximului | Rezultatul conține ambele zile. Alegerea uneia cere un criteriu suplimentar, nu ordinea accidentală de încărcare. |
| Colecție complet citită, fără membri | Mulțimea culorilor este vidă și suma duratelor este zero; un maxim nu are element câștigător. |
| Formă relevantă cu umplere necunoscută | Paleta completă este necunoscută. Culorile observate sunt o mulțime parțială, nu dovada că alte culori lipsesc. |

Culorile se compară ca valori în spațiul conceptual, după normalizarea reprezentărilor, nu după ortografia etichetelor. Două nume pentru aceeași valoare nu produc două culori. O apropiere perceptuală poate folosi metrica și toleranța din secțiunea 4.4.1, dar atunci contractul spune „suficient de apropiat”, nu pretinde egalitate exactă. La fel, o durată de o oră și una de șaizeci de minute se compară după conversie.

Pentru „make the diagram's colours match the drawing”, sursa comparației este o însușire a unui obiect identificat. Ea nu este un nume de culoare. The request representation din secțiunea 6.3.2 separă descrierea valorii de referință de valoarea observată ulterior:

```sop
@source.match std.request.source text="make the diagram's colours match the drawing"
@request.match std.request act=change mood=do source=$source.match
@target.diagram std.request.target request=$request.match mode=existing kind=diagram determiner=definite
@target.drawing std.request.target request=$request.match mode=existing kind=drawing determiner=definite
@reference.palette std.request.value target=$target.drawing concept=palette
@constraint.palette std.request.constraint request=$request.match target=$target.diagram concept=palette operator=same value=$reference.palette scope=group polarity=positive character=requirement source=$source.match
```

`std.request.value` describes a value to obtain: `target` names the source object and `concept` its property. It is neither the palette nor an observation. The library resolves the source identity, obtains a typed palette over a collection with known coverage, and retains the source World, state version and derivation. Only that observed result becomes the destination constraint. Multiple source drawings remain ranked hypotheses; missing evidence does not authorize inventing a palette.

Presupunem că interpretarea acceptată cere egalitatea exactă a paletelor, iar desenul are paleta `{roșu, albastru}`. Pentru o diagramă cu trei noduri, culorile roșu, albastru, albastru satisfac cererea; roșu, roșu, roșu nu o satisfac, deși fiecare culoare folosită aparține paletei sursă. Egalitatea cere ambele incluziuni. Cererea „use only colours from the drawing” ar cere doar incluziunea paletei destinație în cea sursă și trebuie reprezentată ca alt predicat, nu confundată cu `same`.

Egalitatea paletelor nu stabilește care nod devine roșu. Planificatorul alege o distribuire care respectă și celelalte cerințe, inclusiv lizibilitatea; preferința pentru schimbarea cât mai puținor culori poate departaja alternativele numai dacă este declarată. Dacă schema unui singur nod permite o singură umplere și diagrama nu are alte elemente colorabile, paleta cu două culori nu poate fi realizată fără alte schimbări. Sistemul explică incompatibilitatea sau propune o alternativă; nu creează un nod suplimentar doar pentru a ascunde conflictul.

Valoarea sursă este un instantaneu la planificare, ca în secțiunea 6.1.2. Modificarea ulterioară a desenului nu recolorează automat diagrama. O nouă cerere de actualizare recitește și recalculează paleta. Dacă o comparație depinde circular de însușirea pe care ar trebui să o determine, evaluatorul trebuie să detecteze dependența; lipsa unei valori ancorate nu se rezolvă prin alegerea arbitrară a unei culori. Execuția schimbă numai destinația autorizată și verifică apoi paleta efectiv observată, nu doar culorile promise de plan.

## 4.5 Cuvintele de grad

**Problema.** „Red” are un centru fix. „Big” nu are. Un pește mare și o casă mare nu au aceeași mărime; un pește mare printre pești mici nu este cât unul mare printre pești mari. Cuvinte ca „big”, „small”, „huge”, „short”, „long”, „many”, „late” se numesc **cuvinte de grad (degree words)** și sunt subiective prin natura lor.

**Principiul.** Un cuvânt de grad nu este valoarea unei însușiri și nu apare în starea lumii. În starea lumii, mărimea este un număr. Cuvântul de grad este o instrucțiune de calcul: spune în ce direcție și cam cât, **față de ceva**. Acel „ceva” se numește **clasă de comparație (comparison class)**.

**De unde se ia clasa de comparație.** Din patru surse, în această ordine; prima care are ceva de spus hotărăște.

| Sursa | Exemplu |
|---|---|
| lucrurile de același fel care există acum | „A big fish” într-un iaz cu doi pești: mai mare decât ei. |
| ce a cerut omul până acum | Dacă a cerut de două ori „shorter” la scrisori, „short” înseamnă pentru el mai scurt. |
| ce este obișnuit pentru acel fel de lucru, în acel fel de lume | Mărimea obișnuită a unui copac într-un desen; lungimea obișnuită a unei scrisori. Vine din cunoaștere. |
| cât loc este | Pagina, diagrama, ziua. |

**Învățarea.** Fiecare cuvânt de grad are un factor de pornire: „big” înseamnă de aproximativ 1,6 ori față de clasa de comparație. Reacțiile ulterioare pot ajusta rezultatul și pot furniza o preferință numerică pentru acel fel de lume. Actualizarea se face la încheierea șirului de corectări, după regula explicată mai jos; o reacție izolată nu dovedește singură de ce valoarea inițială nu a fost potrivită.

**Comparativele** („bigger”, „shorter”, „later”) nu au nevoie de clasă de comparație: se compară cu valoarea pe care lucrul o are acum. Sunt un pas pe axă.

### 4.5.1 Comparație contextuală și adaptarea valorilor de grad

Clasa de comparație fiind stabilită, calculul trebuie să păstreze sursa valorii de referință și factorul folosit. Aceste date permit explicarea rezultatului și a eventualei adaptări.

Trebuie deosebite alegerea inițială a unei mărimi, deplasarea cu un pas și învățarea unei preferințe. O cerere nouă de mărire schimbă obiectul. Numai în contextul definit de regulă poate constitui și o corecție a factorului folosit anterior.

Valoarea de referință a unei clase de comparație este mediana valorilor lucrurilor din clasă. Cu un singur lucru, este valoarea lui. Fără niciun lucru, se trece la sursa următoare din secțiunea 4.5. *(R29)*

Scara unei axe determină operațiile permise. O axă cu zero firesc (mărimea, lungimea, durata, numărul) se declară `scale=ratio`; pe ea cuvântul de grad înmulțește: referința ori factorul. O axă fără zero firesc (poziția, ora) se declară `scale=interval`; pe ea nu se înmulțește, iar cuvinte ca „late” sau „high” sunt regiuni ale axei, nu cuvinte de grad. *(R30)*

Pasul unui comparativ este declarat pe axă, cu `step`. Pe o axă `ratio` este un factor (1.25 in this example); pe o axă `interval` este o mărime în unitățile axei (for example, 30 minutes for time or one tenth of a page for position). „Much bigger” face doi pași. *(R31)*

Axa declară explicit felul scării și sensul pasului. The following example assumes spațiul `size` deja declarat:

```sop
@sp.size w.legend.space name=size form=axes version=1
@ax.size w.legend.axis of=$sp.size name=ratio order=0 kind=linear unit=$unit.size min=0 max=10 scale=ratio step=1.25
@unit.size w.legend.unit name=ratio of=$ax.size factor=1 offset=0
```

`of=$sp.size` identifies the space, iar `name=ratio` numește axa. `scale=ratio` spune că un pas crescător înmulțește valoarea cu 1,25; un pas descrescător o împarte la 1,25. De la 2 rezultă 2,5 în sus sau 1,6 în jos. Limitele 0 și 10 delimitează domeniul acestui exemplu, nu toate mărimile posibile din orice aplicație. Pe o axă `scale=interval`, aceeași cheie `step` ar desemna o deplasare aditivă în unitatea declarată. Cele două semantici nu se aleg după numele axei.

După calcul, rezultatul este adus între marginile pe care le poate realiza unealta. Dacă prin aceasta nu se schimbă nimic, nu se execută nimic, iar răspunsul este „It is already as big as it can be.” *(R32)*

O reacție „bigger” schimbă imediat obiectul cu un pas, dar nu actualizează imediat factorul învățat. Când prima valoare a fost calculată dintr-un cuvânt de grad, sistemul deschide un episod de ajustare: păstrează obiectul, însușirea, referința inițială și factorul inițial. Reacțiile succesive asupra aceleiași valori continuă episodul. La primul mesaj care nu mai corectează acea valoare, episodul se închide; valoarea finală este tratată ca acceptare operațională, iar factorul se actualizează o singură dată. Tăcerea nu închide singură episodul. *(R33)*

| Mesaj și stare | Efect asupra obiectului și învățării |
|---|---|
| „a big fish”, referință 1, factor 1,6 | Mărimea devine 1,6. Se păstrează referința și factorul inițial. |
| „bigger”, pas 1,25 | Mărimea devine 2,0. Preferința nu este încă schimbată. |
| „bigger” | Mărimea devine 2,5. Episodul rămâne deschis. |
| O cerere despre alt obiect | Se închide episodul: factorul acceptat este 2,5 / 1, iar noul factor este `(1,6 + 2,5) / 2 = 2,05`. |

Formula generală este `factor_acceptat = valoare_finală / referință_inițială`, apoi `factor_nou = (factor_inițial + factor_acceptat) / 2`. Ea se aplică axelor de raport cu referință strict pozitivă. Cu referința 2 și valoarea finală 4, factorul acceptat este 2, nu 4. Dacă șirul de reacții urcă și apoi coboară, numai rezultatul final intră în actualizare; valorile intermediare nu sunt voturi separate pentru o preferință.

Acceptarea operațională nu dovedește că factorul era cauza nepotrivirii. Clasa de comparație poate fi nepotrivită, de exemplu dacă include un pește neobișnuit de mic. Explicația păstrează atât referința, cât și factorul, pentru ca această ambiguitate să fie vizibilă. O intervenție externă asupra valorii, un eșec al execuției sau anularea înaintea închiderii invalidează episodul și nu produce învățare automată. Actualizarea închisă este legată de pașii care au produs valoarea acceptată; anularea lor retrage și actualizarea, fără a schimba istoricul altor obiecte.

Pentru a păstra justificarea adaptării, factorul învățat este un fapt, cu proveniența lui (din ce mesaj), ținut pentru omul care folosește aplicația și pentru felul de lume (desen, calendar). Anularea pasului care l-a produs îl anulează și pe el. Nu trece niciodată singur în cunoașterea comună. *(R34)*

Limitele uneltei contează separat de preferință. Dacă unealta plafonează mărimea, rezultatul nu dovedește că omul preferă exact plafonul. O operație fără schimbare nu trebuie să producă nici mesaj de execuție, nici o actualizare arbitrară a preferinței. Anularea trebuie să refacă atât obiectul, cât și factorul modificat în același pas.

## 4.6 Schimbări și acte

**Problem.** An operation name is not a semantic definition. To justify an act, the library needs its roles, preconditions, required final conditions and permitted effects. These declarations let one reasoning mechanism elaborate acts across domains and let observation verify what actually happened.

**Patru schimbări de bază.** Orice i se poate întâmpla unei lumi este una dintre următoarele patru schimbări, sau o înșiruire a lor.

| Schimbarea | Ce este |
|---|---|
| apariție (`appear`) | Un lucru care nu exista există: un pește, un nod, un paragraf, o ședință. |
| dispariție (`disappear`) | Un lucru care exista nu mai există. |
| schimbarea unei însușiri (`quality`) | Lucrul rămâne, dar o valoare a lui este alta: peștele devine roșu; scrisoarea devine mai formală. |
| schimbarea unei relații (`relation`) | Lucrul rămâne, dar legătura lui cu alt lucru este alta: peștele ajunge în alt loc; ședința se mută vineri. |

**Actul.** Un **act (act)** este o schimbare cerută de cineva. Fiecare act se definește o singură dată, pentru toate domeniile, prin patru lucruri: ce schimbare de bază este, ce roluri are, ce trebuie să fie adevărat înainte și ce trebuie să fie adevărat după.

| Actul | Definiția |
|---|---|
| `make` (a face) | Apariție. Rol: rezultatul. După: rezultatul există. |
| `remove` (a șterge) | Dispariție. Rol: lucrul. Înainte: lucrul există. După: nu mai există. |
| `change` (a schimba) | Schimbarea unei însușiri. Roluri: lucrul și însușirea. Înainte: lucrul există. După: însușirea are valoarea cerută. |
| `place` (a așeza) | Schimbarea unei relații. Roluri: lucrul și ținta. Înainte: lucrul există. După: lucrul este la țintă. |

**Ce decurge din definiții.** Trei lucruri, fără alt rând scris.

Întâi, **actele compuse**. Când omul cere „put a child on the swing” și pe pagină nu este niciun copil, condiția „înainte” a actului „a așeza” nu este îndeplinită. Aplicația deduce că trebuie întâi „a face” un copil. „Replace”, „copy”, „swap” se descompun la fel, în acte de bază.

Apoi, **verificarea de după execuție**. Condiția „după” este ce trebuie să se vadă în stare când actul s-a încheiat. Dacă nu se vede, răspunsul nu are voie să spună „am făcut”. Aceasta este apărarea împotriva răspunsurilor care pretind că s-a făcut ceva când nu s-a făcut nimic.

În sfârșit, **cuvintele**. „Draw”, „add”, „create”, „write”, „schedule” sunt nume diferite ale aceluiași act, „a face”. Ele stau în lumea limbii, o dată, nu în fiecare domeniu.

### 4.6.1 Semantica actelor și compunerea schimbărilor

Un act descrie diferența dorită dintre două stări. „A așeza” cere o relație între un obiect și o țintă; „a schimba” cere o valoare nouă a unei însușiri. Planificatorul folosește aceste condiții pentru a decide ce trebuie pregătit, iar verificatorul le folosește după execuție pentru a decide ce poate fi afirmat în răspuns.

Rolurile sunt locurile numite din descrierea actului. La construirea unui plan, fiecare rol se leagă de un obiect, o valoare sau o cerință concretă. Formele din tabel exprimă verificări asupra acestor legături; nu sunt propoziții pe care motorul le interpretează liber.

Condițiile unui act nu sunt texte. Formularea în limbaj natural explică intenția, dar evaluarea cere o reprezentare structurată. Forma exactă folosește patru feluri de condiții, câte una pentru fiecare schimbare de bază. *(R35)*

| Condiția | Ce afirmă |
|---|---|
| `kind=exists object=<rol>` | Lucrul din rol există în starea observată. |
| `kind=absent object=<rol>` | Lucrul din rol nu există în domeniul verificat complet. |
| `kind=has object=<rol> quality=<rol>` | Lucrul are valoarea cerută pentru însușirea legată de al doilea rol. |
| `kind=holds object=<rol> goal=<rol>` | Relația furnizată de cerere ține între cele două roluri. |

```sop
@condition.result w.legend.condition kind=exists object=result
@condition.exists w.legend.condition kind=exists object=object
@condition.absent w.legend.condition kind=absent object=object
@condition.quality w.legend.condition kind=has object=object quality=quality
@condition.relation w.legend.condition kind=holds object=object goal=goal
@act.make w.legend.act name=make change=appear role=result after=$condition.result
@act.remove w.legend.act name=remove change=disappear role=object before=$condition.exists after=$condition.absent
@act.change w.legend.act name=change change=quality role=object role=quality before=$condition.exists after=$condition.quality
@act.place w.legend.act name=place change=relation role=object role=goal before=$condition.exists after=$condition.relation
```

Fiecare condiție are identitate proprie. Cheile `object`, `quality` și `goal` conțin numele rolurilor, nu identitățile obiectelor dintr-o aplicație. De exemplu, `object=object` spune că argumentul condiției este rolul numit `object`; cererea concretă va lega acel rol de lucrul mutat. `holds` primește relația din cerere, astfel încât aceeași definiție poate descrie așezarea în, pe sau lângă o țintă fără să inventeze o relație implicită.

Loading these declarations validates structure, not the effect of an act. Each act declares roles and a final condition; initial conditions are optional. Every role mentioned by a condition must belong to the referring act. The library binds those roles to actual targets, checks the before conditions, constructs concrete calls and checks the after conditions against observed state. Naming `make` does not itself create anything.

Această validare nu execută actele și nu dovedește condițiile asupra unei lumi concrete. Legarea cererii, planificarea și verificarea efectului observat rămân mecanisme distincte. Nici `kind=absent`, singur, nu dovedește că observația acoperă toate obiectele relevante.

Ce nu este numit nu se schimbă. După un act, singurele diferențe permise în stare sunt cele din condiția „după” și cele care decurg din ea prin reguli. Orice altă diferență este spusă în răspuns ca schimbare neașteptată. *(R36)*

Crearea unui referent care lipsește este permisă numai când cererea îl introduce nehotărât, în loc să desemneze un obiect existent. „Put **a** child on the swing”: nu există copil, se face unul. „Put **the** child on the swing” sau „put Tom on the swing”: omul vorbește despre un lucru anume; dacă nu există, aplicația spune „There is no child in the picture.” și nu face nimic, cu excepția completării unui rol structural explicit autorizat, descrisă în secțiunea 6.4.1. *(R37)*

Actele compuse reutilizează condițiile actelor de bază. „Copy” este „a face” un lucru cu felul și însușirile celui copiat; identitatea este nouă, iar referințele urmează politica de copiere din secțiunea 2.4.1. „Swap” este de două ori „a așeza”, cu țintele luate din starea dinainte: fiecare lucru primește locul pe care îl avea celălalt. „Replace A with B” este „a face” B la locul lui A, mutarea pe B a relațiilor lui A și „a șterge” A. *(R38)*

Descompunerea se oprește. Singura condiție „înainte” care poate cere un alt act este `exists`, iar actul care o îndeplinește, „a face”, nu are nicio condiție „înainte”. Lanțul are deci cel mult doi pași pentru fiecare rol. Dacă un domeniu adaugă acte cu alte condiții, planificarea refuză un plan în care aceeași pereche de act și lucruri apare a doua oară. *(R39)*

În exemplul `act.place`, `object` desemnează lucrul mutat și `goal` ținta cerută. Verificarea existenței obiectului nu dovedește că relația finală este realizabilă; planul trebuie să verifice și ținta, capabilitatea uneltei și restricțiile relevante. După execuție, `holds` se verifică pe starea observată, nu pe argumentele trimise uneltei.

Pentru un schimb de poziții, ambele poziții se citesc înaintea primei mutări. Dacă a doua mutare ar citi poziția deja schimbată a primului obiect, ambele ar ajunge în același loc. Compunerea păstrează deci o stare de referință și o unitate de anulare. La înlocuire, transferul relațiilor este permis numai dacă noul obiect satisface tipurile și restricțiile acelor relații.

### 4.6.2 Schimbarea felului cu păstrarea identității

Felul semantic poate fi tratat ca o valoare în spațiul felurilor, deci schimbarea lui este un caz al actului `change`. Aceasta nu înseamnă că orice tip structural se poate înlocui prin atribuirea unui cuvânt. Tipul firului stabilește sloturile și validarea; felul semantic spune ce reprezintă obiectul. Un obiect generic poate avea un slot `kind` legat de conceptul de fel, fără să schimbe tipul structural al firului. Dacă noul fel cere altă structură, schimbarea include o migrare verificată. Identitatea obiectului rămâne aceeași numai dacă această migrare este posibilă fără încălcarea cerințelor păstrate.

| Componenta stării | Regula schimbării de fel |
|---|---|
| Identitatea și proveniența obiectului | Se păstrează. Noua clasificare primește propria sursă și versiune. |
| Valori încă admise | Se păstrează numai dacă au același sens, unități compatibile și satisfac schema nouă. Egalitatea numelor de slot nu ajunge. |
| Valori sau părți incompatibile | Sunt identificate în diferența propusă. O presupunere poate fi retrasă prin politica declarată; o cerință a omului nu dispare tacit. |
| Relații către și dinspre obiect | Sunt verificate în ambele direcții. Identitatea păstrată nu face automat validă fiecare relație veche. |
| Informații nou obligatorii | Se completează din surse declarate sau rămân întrebări deschise; migrarea nu produce o stare acceptată înainte de validare. |

De exemplu, transformarea unui paragraf în titlu poate păstra identitatea și textul, dar nu păstrează automat un rol de notă de subsol incompatibil cu titlul. Planul arată ce relație trebuie schimbată și verifică trimiterile la acel obiect. La eșec, nu șterge paragraful pentru a crea pe ascuns un alt obiect. `replace` rămâne operația cu identitate nouă din secțiunea 4.6.1.

Această tratare a felului nu confundă clasificarea cu realizarea: folosirea unei imagini moștenite nu schimbă felul semantic al obiectului. Nici apropierea dintre două feluri nu autorizează o migrare. Referirea aproximativă din secțiunea 6.4.1 găsește un candidat; schimbarea felului este un efect separat, care trebuie cerut sau justificat prin politica explicită a aplicației.

## 4.7 Legarea unei lumi de lumea legendelor

**Rule.** A type or slot participating in semantic elaboration must be linked to its declared concept. `is` identifies a type’s concept; `means` identifies a slot’s concept, and `space` can link an applicable space. The link does not create all required methods. A technical bookkeeping field need not acquire a false conceptual interpretation merely to satisfy an “annotate everything” rule. Missing information needed by a particular semantic operation is reported at that operation’s boundary.

**Why semantic links are checked.** A `means` or `space` link must resolve to exactly the intended declaration. Otherwise two consumers could interpret the same numeric value differently. Link validation proves that the referenced concept exists and is unambiguous; the concept’s operation contracts must additionally define how its values are measured and changed.

```sop
@type.sample core.type of=sample is=thing
@slot.sample core.slot of=sample key=value kind=number means=quality space=size
@concept.thing w.legend.concept name=thing
@concept.quality w.legend.concept name=quality
@space.size w.legend.space name=size form=axes version=1
```

Exemplul se încarcă împreună, după `core.use world=w.legend`; țintele pot apărea după schema care le referă. Un atom precum `quality` caută exact un nume public în lumea încărcată. Niciun rezultat sau mai multe rezultate produc eroare. Referința `means=$concept.quality` selectează identitatea exactă și rămâne valabilă dacă eticheta publică este schimbată. Un text citat nu este tratat ca referință. Căutarea numelor este globală în instanța World, fără preferință tacită pentru namespace-ul curent; vocabularul ambiguu cere referințe explicite.

Verificarea se repetă pe starea finală a fiecărei tranzacții. Ștergerea sau redenumirea unei ținte și introducerea unui nume concurent nu pot lăsa o schemă legată de ceva inexistent sau ambiguu. La eșec se revine la starea anterioară. The resolved identity is recorded separately from the author’s spelling. Validating a link does not prove that a number belongs to a space or that a comparison has been evaluated.

| Semantic concept | Information required by the applicable method |
|---|---|
| kind | The declared classification and its identity; no inference from a display label. |
| name | The naming scope and the distinction between a label and object identity. |
| quality | The space and measurement contract, such as size, colour, shape or tone. |
| quantity | Unit or counted population, plus its coverage and duplicate policy. |
| place | A coordinate space/frame, discrete order, or typed relation to another object. |
| time | Whether the value is an instant, duration, interval, recurrence or occurrence boundary. |
| part | Whole identity, membership role, cardinality and structural constraints. |
| role | The act/relation and the named role played by this value. |
| topic, manner, cause, purpose | The typed content or relation required by the corresponding method. |

These are semantic input obligations, not additional `core.slot` keys. A schema uses its declared fields and links; a method consumes those declarations through LIB.

**Exemplu.** Cele patru sloturi din secțiunea 4.1, cu legarea adăugată.

```text
Explanatory semantic mapping; pseudocode, not SOP declarations:
Drawing position: point in page frame, concept place
Diagram position: point in diagram frame, concept place
Document order: integer in declared section order, concept place
Meeting room: typed reference to room, concept place via relation in
```

**What the link enables.** A semantic link lets the library locate applicable methods, but a link alone supplies neither a language grammar nor a transformation. Each capability in the following table requires its declared language forms, relation or space operations, typed binding and validation conditions. A missing method remains a missing method; it is not filled by a domain-specific JavaScript guess.

| Ce se primește | Cum arată |
|---|---|
| întrebarea, când valoarea lipsește | „Where?”, făcută mai precisă de tipul valorii: „In which room?” |
| înțelegerea unui loc spus singur | „in the sky”, „at the top”, „after the introduction”, „in the big room”. |
| găsirea unui lucru după loc | „the fish in the pond”, „the node under Start”, „the meeting in room 2”. |
| mutarea | „move it up”, „move it earlier in the text”. |
| răspunsul | Locul este spus în același fel în toate domeniile. |

For `means=quality`, the library can use applicable comparison and degree methods when the space, measurement, baseline and operation are declared. For `means=time`, temporal methods additionally require instant/duration distinctions, timezone, calendar and recurrence scope. The single annotation does not manufacture those contracts.

**Locul și timpul.** Un loc poate fi spus în patru feluri, aceleași în orice domeniu: ca poziție (un punct), ca regiune cu nume (sus, jos, centru; începutul unui text), ca relație cu alt lucru (pe, în, lângă, după) sau ca pas față de locul de acum (în sus, mai la stânga). Fiecare relație are o definiție prin numere: „lângă” este o distanță mică; „deasupra” este mai sus pe axa verticală. Timpul are aceleași forme pe o singură axă: un moment, un interval, o durată, o ordine, o repetare. „In the afternoon” este o regiune pe axa orelor, la fel cum „red” este o regiune în spațiul culorilor.

## 4.8 Tipurile de fire ale lumii legendelor

The legend defines concepts, acts, conditions, spaces, axes, units, degrees, roles and relations. Its declarations describe the inputs to generic interpretation. A valid declaration is not evidence that a particular tool supports the requested effect; capability and concrete-call validation remain separate.

**`w.legend.space`** declară un spațiu conceptual.

| Cheia | Ce spune |
|---|---|
| `name` | Numele spațiului: `colour`, `size`, `shape`, `page`, `tone`. |
| `form` | `axes` sau `graph`: cu axe numerice sau ca graf de părți. |
| `version` | Versiunea declarată, obligatorie; nu garantează imutabilitatea. |

**`w.legend.axis`** declară o axă a unui spațiu.

| Cheia | Ce spune |
|---|---|
| `of` | Referință tipizată la declarația spațiului. |
| `name` | Numele axei: `hue`, `saturation`, `lightness`. |
| `min`, `max` | Marginile axei. |
| `kind` | Obligatoriu: `angle` pentru o axă circulară, `linear` pentru una liniară. |
| `period` | Număr pozitiv obligatoriu numai pentru `angle`, exprimat în unitatea canonică. |
| `unit` | Referință obligatorie la unitatea canonică a axei. |
| `scale` | `ratio` pentru pași multiplicativi; `interval` pentru pași aditivi. |
| `step` | Factorul sau deplasarea unui pas, conform scării; vezi 4.5.1. |
| `order`, `weight` | Ordine întreagă sigur reprezentabilă, nenegativă și unică în spațiu, obligatorie; pondere pozitivă opțională. |
| `normalisation` | Lungimea pozitivă de normalizare, în unitatea axei; înlocuiește numitorul `max−min` când este declarată. Pentru o axă liniară fără limite finite este obligatorie dacă se cere distanța normalizată. Vezi 8.2.1. |

Parametrii numerici trebuie să fie finiți. Dacă ambele limite există, `min` trebuie să fie strict mai mic decât `max`. `scale` și `step` apar împreună: pasul este o mărime pozitivă pentru `interval`, iar pentru `ratio` este un factor strict mai mare decât 1; direcția cererii va selecta adunarea/scăderea sau multiplicarea/împărțirea. Schema nu execută acele operații. Unitățile alternative pot avea o deplasare semnată, astfel încât descrierea să nu excludă conversiile afine; executarea conversiei rămâne un mecanism separat.

**Region descriptions.** A region needs the identity of its space, constrained axes, bounds and membership rule. A colour word can constrain only some axes. The descriptions in this chapter use explicit prose or pseudocode; they do not define an additional `w.legend.region` wire type. A concrete schema and evaluator contract must precede any executable region declaration. Point membership and complete-region inclusion remain different tests.

**`w.legend.degree`** declară un cuvânt de grad.

| Cheia | Ce spune |
|---|---|
| `word` | Cuvântul: `big`, `huge`, `small`, `long`. |
| `direction` | `up` sau `down`. |
| `factor` | Factorul de pornire față de clasa de comparație. |

**`w.legend.condition`** declară o condiție structurată, cu variantele și argumentele din §4.6.1. O referință la o condiție leagă actul de o declarație verificabilă; textul explicativ nu înlocuiește acea declarație.

**`w.legend.act`** declară un act.

| Cheia | Ce spune |
|---|---|
| `name` | Numele actului: `make`, `remove`, `change`, `place`. |
| `change` | Schimbarea de bază: `appear`, `disappear`, `quality`, `relation`. |
| `role` | Un rol al actului. Repetată. |
| `before` | Referințe repetabile la condiții `w.legend.condition` pentru starea inițială; opționale. |
| `after` | Referințe repetabile la condiții `w.legend.condition` pentru starea finală; cel puțin una obligatorie. |

Exemplu executabil al declarațiilor de culoare, fără afirmație de validare a punctelor:

```sop
@sp.colour w.legend.space name=colour form=axes version=1
@ax.hue w.legend.axis of=$sp.colour name=hue order=0 kind=angle period=360 unit=$unit.degree min=0 max=360
@ax.saturation w.legend.axis of=$sp.colour name=saturation order=1 kind=linear unit=$unit.saturation min=0 max=1
@ax.lightness w.legend.axis of=$sp.colour name=lightness order=2 kind=linear unit=$unit.lightness min=0 max=1
@unit.degree w.legend.unit name=degree of=$ax.hue factor=1 offset=0
@unit.saturation w.legend.unit name=ratio of=$ax.saturation factor=1 offset=0
@unit.lightness w.legend.unit name=ratio of=$ax.lightness factor=1 offset=0
```

Referințele `of` și `unit` leagă declarații, nu caută texte similare. Cele două unități numite `ratio` aparțin unor axe diferite și nu sunt contopite. Ordinea axelor este dată de întregi unici în spațiul lor; nu este necesar ca numerele să fie consecutive. Unitatea canonică trebuie să aparțină exact axei care o referă și să aibă factor 1 și deplasare 0. Referințele circulare axă–unitate se încarcă atomic, în același lot. Tipurile declarațiilor de axe și unități sunt partajate între namespace-uri: mutarea unei declarații în alt namespace nu permite dublarea aceleiași axe într-un spațiu comun. Două spații cu identități diferite pot folosi aceleași nume.

A valid axis declaration must provide numeric restrictions and typed dependencies. A space can be named before its axes, but a complete point must satisfy all required axes and units. A graph space uses typed nodes and relations rather than numeric axes. Coordinates in different frames require a declared conversion with origin, orientation and scale; equal-looking numbers do not prove equal positions.

A region description, dependent de toate axele declarate mai sus:

```text
Illustrative region description; pseudocode, not SOP Lang:
space: colour defined by sp.colour
red: hue in [350,360) or [0,10], saturation in [0.8,1], lightness in [0.4,0.6]
```

A region description defines membership; the evaluator must apply that definition to a typed point. A degree word defines a transformation; the evaluator must obtain its baseline, compute the transformation, and validate the result. Neither action follows merely from loading the name of the region or degree.

### 4.8.1 Metamodelul conceptual și ordinea de încărcare

Lumea legendelor este vocabularul prin care schemele unor domenii diferite își declară semnificația. Fără această legătură, `at`, `position` și `start` sunt doar nume locale. Legarea lor de concepte permite alegerea operațiilor potrivite: poziția se măsoară într-un spațiu, începutul este un moment, iar participantul joacă un rol într-un act.

Metamodelul trebuie să poată fi încărcat fără a presupune că el există deja. De aceea distingem primitivele limbajului de conceptele descrise cu acele primitive. Tabelul tipurilor arată ce informații declară autorul cunoașterii; regulile de încărcare arată în ce ordine pot fi interpretate.

Tipurile de fire ale lumii legendelor sunt cele din secțiunea 4.8, la care se adaugă patru, pentru ca toate conceptele din secțiunea 4.3 să aibă unde fi declarate. *(R15)*

| Tipul | Ce declară și cu ce chei |
|---|---|
| `w.legend.concept` | Un concept general. Chei: `name`; `group` (grupa din care face parte); `specialises` (referință tipizată la conceptul mai general, dacă are unul); `question` (întrebarea generală: „Where?”). |
| `w.legend.role` | Un rol. Chei: `name`; `of` (referință tipizată la actul sau relația în care apare). |
| `w.legend.relation` | O relație generală. Chei: `name` (`in`, `on`, `next_to`); `space` (referință opțională la spațiul în care se măsoară); `inverse` (referință opțională la relația inversă); `test` (funcția care spune, din pozițiile a două lucruri, dacă relația ține). |
| `w.legend.unit` | Unitate declarată prin `name`, `of` (referință la axă), `factor` pozitiv și `offset` finit, toate obligatorii. Conversia declarată este `valoare_canonică = factor × valoare + offset`. |

Exemplu minimal executabil, cu un vocabular ilustrativ:

```sop
@concept.entity w.legend.concept name=entity group=basic question="What exists?"
@concept.component w.legend.concept name=component specialises=$concept.entity
@degree.large w.legend.degree word=large direction=up factor=1.6
@relation.connected w.legend.relation name=connected inverse=$relation.connected
@role.endpoint w.legend.role name=endpoint of=$relation.connected
```

`specialises` referă un singur concept mai general. Mai multe concepte pot avea același părinte, dar o specializare nu poate reveni la ea însăși, nici printr-un lanț de alte concepte. Modulul respinge asemenea cicluri și după editări; scoaterea unei legături retrage consecințele ei de specializare. `group` este deocamdată o etichetă de organizare, iar `question` este text explicativ: niciuna nu rezolvă automat un concept sau o întrebare a utilizatorului.

Un rol are o referință tipizată la un act sau la o relație. Numele lui este unic în acel proprietar, inclusiv când declarațiile sunt în namespace-uri diferite. Pentru un act, rolul trebuie să apară deja în lista `role` a actului; lista poate exista fără înregistrări separate de rol, dar o înregistrare nu poate inventa un rol incompatibil. Pentru o relație, înregistrarea rolului introduce numele respectiv. Referința tipizată evită confuzia dintre două acte sau relații cu aceeași etichetă.

O relație simetrică poate fi propria inversă. Dacă ambele capete declară o inversă, declarațiile trebuie să fie reciproce; dacă ambele numesc un spațiu, trebuie să refere același spațiu. O declarație unilaterală este permisă, fără a genera tacit cealaltă declarație. Cheia `test` este opțională și numește contractul unei funcții viitoare; prezența numelui nu validează funcția, semnătura sau rezultatul ei. Relațiile nemăsurate geometric pot omite `space`.

A degree factor is finite and positive; its direction is explicit. A factor alone does not authorize an edit. The library obtains the baseline and scale, applies the declared transformation, checks hard constraints and tool limits, and retains the calculation. A value crossing an uncertain boundary stays uncertain rather than becoming a proof of membership.

Felurile de afirmații, cuprinderea și negația sunt fire `w.legend.concept`. O resursă nu are tip propriu: un tip de lucruri se declară resursă cu `resource=true` pe firul lui `core.type`.

Încărcarea urmează patru straturi, fiecare scris numai cu ce este sub el. Tipurile `core.` sunt fixe, fac parte din limbaj și nu sunt descrise de nimic. Lumea legendelor este scrisă cu `core.type` și `core.slot`; sloturile tipurilor `w.legend.` sunt singurele scutite de cheia `means`. Tiparele și bazele de cunoaștere folosesc lumea legendelor. Instanțele folosesc tiparele. *(R16)*

Suprapunerile aparente sunt specializări. Durata este timp (`means=time part=duration`); fiindcă timpul are o axă, pe ea funcționează și „longer”, ca pentru orice însușire. Participantul este un rol (`role=participant`); că ședința „este a” participanților se deduce, nu se declară a doua oară. Locul unei secțiuni în text este un loc, în spațiul `order`. Regula generală: un slot are un singur `means`; ce mai decurge vine din faptul că acel concept are un spațiu. *(R17)*

Un `w.legend.unit` care declară un factor de conversie furnizează date pentru o operație numerică deja definită; nu inventează singur operația de conversie. În același fel, cheia `test` a unei relații trebuie să desemneze o funcție cu intrări și rezultat cunoscute. Un nume precum `near` fără o asemenea definiție nu permite verificarea distanței.

Ordinea straturilor evită o definiție circulară a cheii `means`: tipurile de bază ale metamodelului sunt definite prin primitive, apoi celelalte scheme își exprimă semnificația prin ele. O durată are un singur concept principal; faptul că permite comparații numerice rezultă din axa asociată, fără duplicarea aceleiași informații în sloturi concurente.

---

# 5. Feluri de lumi și compunerea lor

## 5.1 Trei feluri de lumi, după ce țin în ele

Până acum am spus „lume” pentru orice mulțime de fire verificate. În practică, lumile se împart în trei feluri, după ce conțin și cât de des se schimbă. Împărțirea contează fiindcă cele trei sunt scrise de oameni diferiți, la momente diferite, și sunt refolosite diferit.

A **schema World** defines the wire types, slots, rules and restrictions of a family of Worlds. It contains no current drawing object or calendar event. Drawing, Diagram, Documents, Calendar and Avatar have domain schemas; these are examples, not a closed list of possible domains. The legend is also schema-level vocabulary. An application’s organizing World is an instance of its own schema, not a fourth kind of World.

Al doilea fel este **lumea de cunoaștere (knowledge World)**. Ea ține ce se știe în general și nu depinde de nicio pagină anume: că o rață este o pasăre, unde este regiunea „red” în spațiul culorilor, din ce părți este făcută o scrisoare, cât ține de obicei o ședință. Bazele de cunoaștere sunt mari, cresc mereu și sunt folosite de toate domeniile deodată.

Al treilea fel este **instanța de lume (world instance)**. Ea ține starea unui lucru anume, acum: această pagină desenată, această diagramă, această scrisoare, această săptămână din calendar. Se schimbă la fiecare mesaj al omului. O instanță folosește un tipar, care îi spune ce fapte are voie să conțină, și se sprijină pe bazele de cunoaștere.

The roles are **schema**, **knowledge** and **instance**. They describe what a World contributes. A knowledge World is itself validated under a schema. A World may import another without copying its declarations into every instance; the architecture must show that dependency rather than present a catalogue entry as an active inference.

**Felurile de cunoaștere.** Nu tot ce stă într-o bază de cunoaștere are aceeași greutate, iar aplicația trebuie să știe ce are în față. „Peștii trăiesc în apă” și „o ședință ține de obicei o oră” nu se folosesc la fel: prima poate opri o greșeală, a doua doar umple un gol. De aceea fiecare rând al unei baze de cunoaștere își declară felul.

| Felul | Ce este și la ce folosește |
|---|---|
| fapt de domeniu | Ceva adevărat despre lume: „Peștele trăiește în apă.” Pe el se poate sprijini o constrângere. |
| normă | Cum trebuie să fie ceva ca să fie corect: „O scrisoare se încheie cu o semnătură.” „Un flux are un singur început.” Se verifică. |
| valoare obișnuită | Cum este ceva de obicei: „Un flux are în jur de șapte pași.” „O ședință ține o oră.” Completează numai ce omul nu a spus. |
| euristică | O regulă de bună alegere, valabilă într-un context: „Un lucru mic stă bine într-un colț.” „Ședințele scurte se pun dimineața.” Ajută la alegerea între variante la fel de permise. |

Tiparele și bazele de cunoaștere publicate în depozitul comun sunt **standardizate**: au nume fix, schemă verificată și licență. O bază de cunoaștere nu pomenește niciodată domeniile unei aplicații; ea nu știe că există un „desen”. Legătura se face în sens invers: domeniul spune ce cunoaștere folosește.

## 5.2 Un singur arbore al felurilor și ce se moștenește pe el

Omul poate cere să fie desenat orice: o rață, un bunic, un leagăn. Nu putem scrie câte un rând pentru fiecare lucru care poate fi cerut. Dar nici nu este nevoie, dacă știm cum se leagă felurile între ele.

Toate felurile de lucruri stau într-un singur arbore, în cunoaștere, de la general la particular: o rață este o pasăre, o pasăre este un animal; un bunic este un bărbat, un bărbat este un om; un romb este o formă cu patru laturi; o scrisoare este un text; un grafic cu bare este o diagramă. Arborele este unul singur pentru toate domeniile.

Four families of declarations can be inherited down this tree. A new kind reuses applicable capabilities, composition and ordinary values only when their preconditions and tool contracts remain satisfied. A taxonomy edge alone does not guarantee an executable realization.

| Ce se moștenește | Ce înseamnă |
|---|---|
| ce se poate face | Ce se poate face cu orice lucru desenat (a-l face, a-l muta, a-l colora, a-l șterge) se poate face cu o rață. Ce se poate face cu o diagramă se poate face cu un grafic. |
| cum este realizat | Dacă desenul nu are o imagine pentru rață, o folosește pe a păsării; pentru „grandfather”, pe a bărbatului. Lucrul rămâne însă o rață: „the duck” îl găsește mai târziu, iar culoarea cerută i se aplică. Omului i se spune o dată ce imagine a fost folosită. |
| ce este obișnuit | Ce este obișnuit pentru orice text este valabil și pentru o scrisoare; scrisoarea declară numai ce are ea diferit, adică părțile ei. Ce este obișnuit pentru orice scenă desenată este valabil pentru un iaz. |
| cuvintele | „Bird” găsește și rațele; „shape” găsește și romburile. |

Cuvântul **realizare** din al doilea rând va reveni: înseamnă felul concret în care un domeniu face un lucru, de exemplu imaginea cu care desenul arată o rață sau forma cu care diagrama arată un început.

Din aceeași cunoaștere vin și părțile lucrurilor: o față are ochi și gură; o pădure are copaci; o scrisoare are formulă de început. Un domeniu nu le scrie din nou.

### 5.2.1 Moștenire structurală, cunoaștere și realizare

Un tip stabilește forma faptelor, un fel clasifică lucrurile din cunoaștere, iar o realizare spune cum poate un domeniu să le prezinte sau să le construiască. Aceste niveluri pot colabora, dar nu sunt interschimbabile. O rață poate rămâne semantic rață chiar când unealta folosește o imagine generică de pasăre.

Comparația mecanismelor arată ce transmite fiecare. Contractele precizează cum se alege o informație moștenită și ce limite nu pot fi slăbite. Fără această separare, împrumutarea unei imagini ar putea modifica greșit cunoașterea despre obiect.

Moștenirea structurală, specializarea semantică și împrumutarea unei realizări transmit informații diferite, după cum arată comparația următoare.

| Ce | Unde stă și ce transmite |
|---|---|
| moștenirea tipurilor | În schemă (`core.type extends=`). Transmite chei, reguli și interdicții. |
| moștenirea felurilor | În cunoaștere (arborele felurilor: o rață este o pasăre). Transmite ce se știe: părți, valori obișnuite, cuvinte. |
| înlocuitorul | În domeniu. Este o realizare împrumutată: imaginea păsării pentru o rață. Nu schimbă felul lucrului. |

Structural `extends` declarations may import slot groups without giving a semantic kind several parents. When an imported group changes, queries and rules must see the same updated structural membership. If `item` retains parent `base` but replaces mixin `left` with `right`, an existing `item` must match `right` and cease matching `left`. A rejected transaction restores schema and indexes together. Structural inheritance does not reinterpret coordinates in a changed semantic space.

Un fel are un singur părinte. Alte împărțiri ale lucrurilor nu sunt feluri. „Lucrurile roșii” sunt o regiune a unui spațiu. „Nodurile de început” sunt un rol dedus de o regulă. „Lucrurile care plutesc” sunt o afirmație de cunoaștere despre mai multe feluri. *(R40)*

Ce este declarat mai aproape câștigă. O valoare obișnuită sau o normă spusă despre un fel o înlocuiește pe cea spusă despre un strămoș. Fiindcă există un singur părinte, nu pot veni două valori de la aceeași depărtare. *(R41)*

O restrângere este corectă dacă tot ce permite ea era permis și înainte: o regiune aflată în regiunea părintelui, margini între marginile părintelui. Se verifică la încărcare. O constrângere tare nu poate fi slăbită nici de un descendent, nici de om. Una slabă poate fi depășită de o cerință a omului. *(R42)*

Un rând particular este legitim când spune ceva diferit de ce ar da strămoșul. „Peștele stă în apă” este legitim, fiindcă animalele stau de obicei pe pământ. Verificarea refuză numai rândurile care repetă ce spune un strămoș sau care sunt scrise pentru mai multe feluri surori cu aceeași valoare, semn că locul lor era pe părinte. *(R43)*

O valoare obișnuită poate fi specializată deoarece ajută la alegere când omul nu a cerut altceva. O constrângere tare delimitează stările admise și are alt rol. Dacă părintele permite mărimi între 1 și 5, un descendent poate restrânge la intervalul 2–4; intervalul 0–6 ar introduce valori interzise de părinte și trebuie respins.

Absența unei realizări specifice nu este absența conceptului. Explicația pentru o rață desenată prin imaginea păsării trebuie să numească traseul de specializare și realizarea disponibilă, păstrând felul cerut. O regulă locală „desenează întotdeauna rața ca pasăre” ar pierde motivul reutilizării și nu ar explica ce se întâmplă pentru alt fel fără imagine proprie.

## 5.3 Cum se compun lumile

O lume nu se scrie de la zero. Ea ia ce există deja și adaugă ce are propriu. Sunt trei operații.

**Importul.** O lume încarcă un tipar sau o bază de cunoaștere publicată, printr-un fir `core.use` (secțiunea 3.8), la o versiune anume. Versiunea este fixată pentru ca o schimbare făcută de altcineva să nu ne strice lumea pe neștiute.

**Extinderea.** O lume poate specializa ce a importat. Poate adăuga un tip nou de fire, care extinde unul importat. Sau poate **restrânge** un slot moștenit: diagrama poate spune că forma unui nod stă numai într-o parte a spațiului formelor. O restrângere este permisă, fiindcă tot ce este adevărat în general rămâne adevărat. Ce nu este permis sunt două declarații care se contrazic; acesta este un **conflict**, iar lumea îl spune la încărcare, nu mai târziu, când ar fi greu de găsit.

**Linking.** A typed slot can refer to an identified object supplied by another World. The composition context must make that object and its schema available; a bare name is insufficient. Two people named Ana produce two candidates. The library ranks them by explicit references, accepted context and declared relevance, retains the alternative and reports a reversible selected interpretation. A calendar tool receives the chosen identity, not the string “whichever Ana”.

Domeniile aplicației se pot compune între ele prin aceleași operații. O diagramă poate arăta ședințele unei săptămâni; un document poate cuprinde un desen; un grafic poate arăta câte ședințe are fiecare om. În fiecare caz, un slot al unei lumi ține un lucru din cealaltă. O regulă care are nevoie de amândouă lumile stă în lumea care le încarcă pe amândouă.

## 5.4 La ce folosește o lume și fără conversație

Înainte de a trece la conversație, merită văzut că modelul general este util și singur. Trei exemple, câte unul pentru trei dintre domenii.

**Verificarea unui document.** Cunoașterea are graful raportului: titlu, introducere, secțiuni, concluzie, cu concluzia obligatorie. Un document este încărcat ca fapte, câte un fir pentru fiecare parte. Lumea răspunde la trei întrebări: ce lipsește (concluzia), ce este încălcat și ce nu a putut verifica. Poate spune și cu ce gen seamănă cel mai mult documentul, comparând grafurile.

**Găsirea unui orar.** Avem săli, oameni și ședințe care trebuie puse într-o săptămână. Ora și sala fiecărei ședințe sunt chei deschise (secțiunea 3.3). Nu pot fi completate una câte una, fiindcă depind una de alta: dacă pun prima ședință luni la zece, a doua nu mai poate fi acolo. Pentru asemenea situații există un **rezolvitor (solver)**: un program de căutare care încearcă valori pentru toate cheile deschise deodată, până găsește o așezare în care nicio interdicție nu este încălcată și cât mai multe preferințe sunt îndeplinite. Rezolvitorul nu știe nimic despre calendare; lucrează cu orice lume care are chei deschise și reguli.

**Verificarea unei diagrame.** Normele unui flux spun că are un singur început și că la fiecare nod se poate ajunge. Lumea deduce începuturile (regula din secțiunea 3.5) și spune ce nod a rămas nelegat.

---

# 6. Conversația

This chapter specifies elaboration of a human request into an executable SOP circuit, followed by dispatch and observation. The library makes semantic decisions using declared Worlds. Tools consume their own concrete instructions; they do not interpret a plan or fill gaps in the user’s intention.

## 6.1 Cum este legat un domeniu de programul lui

O lume, oricât de bine descrisă, nu desenează nimic. Undeva trebuie să existe program care pune efectiv un pește pe ecran. Întrebarea este cum ținem acest program cât mai mic și cum îl legăm de lume fără să scriem, din nou, program pentru fiecare propoziție. Răspunsul are patru piese.

Un **domeniu de capabilități (capability domain)** este o parte a aplicației care poate face lucruri reale: desenul, diagramele, documentele, calendarul. Fiecare are instanța lui de lume, uneltele lui și un fel de a-și citi starea.

A **tool** implements a concrete operation: create an object, change its geometry, assign a value or remove it. Its input is a typed instruction defined by its public wire contract, with concrete values and validated references. Values may include numbers, strings, booleans and structured arguments. The tool does not interpret the human sentence, choose a referent, infer “big”, rank meanings or expand a high-level plan.

O **capabilitate (capability)** este o promisiune declarată a domeniului: ce act general poate îndeplini, asupra cărui fel de lucru și de ce roluri ține seama. Desenul promite că poate „face” lucruri desenate și că ține seama de fel, cantitate, însușiri și loc.

O **legătură (binding)** este declarația care unește cele două: spune ce unealtă îndeplinește ce act și din ce rol al cererii vine fiecare parametru al uneltei.

```sop
@use.schema core.use world=std.schema
@use.tools core.use world=std.tool
@world.drawing std.schema.world name=drawing
@k.drawn std.schema.kind of=drawn world=drawing acts=make acts=place acts=change acts=remove
@h.make std.schema.honours world=drawing act=make of=drawn on=kind on=size on=attribute on=place
@op.add std.tool.op world=drawing name=add effect=makes
@pa.kind std.tool.param op=add name=kind kind=atom required=true
@pa.x std.tool.param op=add name=x kind=number required=true
@pa.y std.tool.param op=add name=y kind=number required=true
@pa.size std.tool.param op=add name=size kind=number min=0.3 max=3 required=true
@pa.colour std.tool.param op=add name=colour kind=string required=true
@b.make std.tool.bind world=drawing act=make of=drawn op=add
```

This is a small illustrative interface, not a claim about a particular deployed Drawing tool. It declares a capability, an `add` operation, five typed required inputs and a binding. The library must supply `kind`, `x`, `y`, `size` and `colour` before dispatch. A full interface must also declare argument sources, coordinate meaning, output identity, preconditions, observations and undo. The `on` list describes capability coverage; it is not a replacement for ownership and scope in a structured request graph.

The interface must distinguish accepted argument types, mandatory arguments, bounds, units and coordinate frames from semantic defaults. The library resolves meanings and defaults before dispatch. Each instruction must also identify expected observable effects, outputs, preconditions and undo behavior. An operation name or `effect=makes` label alone is not a full effect contract.

**Reading the interface.** A capability describes which requests can be elaborated for a domain; a binding connects that capability to a concrete operation. A parameter declaration fixes the tool-side input. The tables below describe these responsibilities. The library validates actual operation and parameter declarations before generating calls; a conceptual role is not an undeclared tool argument.

| Tipul din `std.schema` | La ce folosește și ce chei are |
|---|---|
| `std.schema.thing` | Tipul părinte al oricărui lucru dintr-o lume în care se pot face lucruri. Nu are chei proprii. |
| `std.schema.world` | Declară o lume care face lucruri. Chei: `name`, `doc`, `bundle`. |
| `std.schema.kind` | Spune ce acte se pot face cu firele unui tip. Chei: `of` (tipul), `world`, `acts` (repetată). |
| `std.schema.kinds` | Același lucru pentru orice fel numit de o bază de cunoaștere, fără a le enumera. Chei: `world`, `from` (tipul firelor care numesc felurile), `key`, `acts`, `stand_in`. |
| `std.schema.honours` | Spune de ce părți ale cererii ține seama un domeniu pentru un act. Keys: `act`, `of`, `on` (repetată, cu valorile `kind`, `count`, `place` și celelalte chei fixe ale cererii). Semantic concepts remain separate from this capability coverage declaration. |
| `std.schema.limit` | Cel mult atâtea lucruri de un fel. Chei: `of`, `max`. |
| `std.schema.capacity` | Un lucru care ține alte lucruri are loc pentru un număr dat. Chei: `of`, `key`, `holds`, `via`. |
| `std.schema.relation` | O relație pe care o are lumea. Chei: `name`, `kind` (`spatial`, `containment`, `flow`), `inverse`. The semantic relation must be identified, not inferred from this name alone. |
| `std.schema.region` | O regiune cu nume a paginii. Chei: `name`, `x`, `y`, `w`, `h`. A named rectangle does not define the representation of every conceptual region. |
| `std.schema.effect` | Spune că un act asupra unui fel este îndeplinit de program. Chei: `of`, `act`, `action`. |
| `std.schema.needs` | Ce trebuie încărcat înainte de a acționa într-o lume. Chei: `of`, `type`, `from`. |

| Tipul din `std.tool` | La ce folosește și ce chei are |
|---|---|
| `std.tool.op` | O operație a uneltei. Keys: `name`, `world`, `param`, `effect` (cu valorile `makes`, `removes`, `changes`), `doc`. The semantic act is connected through a binding, not an undeclared `realises` key. |
| `std.tool.param` | Un parametru al unei operații. Keys: `op`, `name`, `kind`, `type`, `accepts` (lista valorilor primite), `scale`, `by`, `order`, `min`, `max`, `default`, `required`. Semantic spaces are linked through their schema; `space` is not a parameter key in this interface. |
| `std.tool.bind` | Legătura: un act asupra unui fel pornește o operație. Chei: `act`, `of`, `op`, `arg`, `needs`, `makes`, `removes`, `changes`. |
| `std.tool.arg` | Un argument al unei legături și sursele lui, în ordine. Chei: `bind`, `param`, `from`. |
| `std.tool.needs` | Ce trebuie să fie adevărat în stare înainte de o operație. Chei: `op`, `exists`, `absent`, `check`, `args`. |
| `std.tool.custom` | O constrângere sau o căutare proprie a uneltei, cu ce primește și ce dă. Chei: `name`, `world`, `kind` (`constraint`, `search`), `in`, `out`, `fails`, `doc`. |

**Acts and operations.** Capability declarations distinguish `make`, `remove`, `change`, `place`, `connect`, `group`, `pick`, `ask`, `copy`, `send`, `save`, `load`, `undo` and `redo`. Semantic methods may expand a compound act into simpler calls. Such expansion must preserve identity and observed effects; a label like `group` is not permission to infer arbitrary membership. Queries can produce results without a state-changing tool call.

**Shared context.** The declarations for filling, focus, dialogue, knowledge and turn organization identify sources and context used by the library. Their role is to make completion and reference decisions inspectable. They are not another family of domain-specific JavaScript controllers, and the existence of a module name does not prove that a particular request used it.

**Which instance is affected.** The library first finds compatible capabilities and live instances. “Schedule a meeting with Ana” can select Calendar while Drawing is visible. “A red circle” can remain compatible with Drawing and Diagram. Explicit destination, referent identity, conversational focus, schema/knowledge relevance and the visible area provide ranked evidence. The visible area cannot create a capability or discard otherwise compatible hypotheses. For a reversible choice the library acts on the best usable interpretation, reports uncertainty and retains alternatives and undo.

### 6.1.1 Selectarea domeniului și transferul între lumi

O capabilitate răspunde la întrebarea „cine poate realiza această cerere?”. Contextul răspunde la întrebarea „în care dintre aceste locuri vrea omul să lucreze?”. Alegerea domeniului combină cele două informații, fără ca simpla deschidere a unei zone pe ecran să creeze capabilități pe care ea nu le are.

Cererile între lumi introduc încă o distincție: lumea din care se citesc datele poate fi diferită de lumea în care se creează rezultatul. Regulile separă selectarea destinației de politica de actualizare a rezultatului.

Capability compatibility filters impossible destinations. Ranking then uses the explicit destination, the World containing a resolved referent, accepted context and declared relevance. The visible area is useful evidence, not a global type clamp. With a circle creation request and Drawing visible, Drawing can be selected while Diagram remains a recorded alternative. The chosen instance and reason become part of the elaboration trace. *(R57)*

O cerere peste două lumi citește dintr-una și scrie în cealaltă. „A bar chart of meetings per person” citește calendarul și scrie în diagramă. Citirea se face o singură dată, la alcătuirea planului. Graficul ține minte de unde vine: sursa și momentul citirii. *(R58)*

Graficul nu se schimbă singur când se schimbă calendarul. Dacă o ședință este ștearsă, graficul rămâne cum era, iar la întrebare spune când a fost făcut. „Update the chart” îl reface. *(R59)*

Un grafic al ședințelor pe persoană este construit dintr-o stare identificată a calendarului. Diagrama păstrează proveniența citirii, astfel încât o întrebare ulterioară să poată primi un răspuns despre datele folosite. Dacă ședințele se schimbă, graficul nu trebuie prezentat drept imagine a calendarului actual fără o nouă citire.

„Update the chart” produce o actualizare explicită, verificabilă și anulabilă. Anularea ei restaurează graficul anterior; nu anulează schimbările calendarului care au avut loc între cele două citiri. Această separare a responsabilităților împiedică o operație de prezentare să modifice accidental sursa.

### 6.1.2 Proiecția declarativă între lumi

O **proiecție (projection)** construiește o descriere în lumea destinație dintr-o selecție explicită a lumii sursă. Ea nu schimbă felul lucrurilor originale: ședința rămâne ședință în calendar, iar nodul care o reprezintă este un lucru nou în diagramă. Corespondența dintre ele este cunoaștere declarată, nu o asemănare dedusă din numele sloturilor. Două sloturi numite `start` pot însemna un moment și, respectiv, un nod inițial; copierea lor după nume ar fi greșită.

A projection applies declared rules in a composition context: sources are versioned reads, conclusions are destination candidates. Collection retrieves named facts and rules; it neither invents a correspondence nor proves source completeness. Rule evaluation does not emit tool effects. Destination candidates are validated, elaborated into concrete calls, dispatched and observed (§6.7–6.9).

| Declarație necesară | Ce fixează și de ce |
|---|---|
| Selecția sursei | Instanța, versiunea de stare, intervalul și filtrul; pentru o săptămână, și fusul orar în care se stabilesc limitele zilelor. |
| Corespondența obiectelor | Felul sursă, condițiile de potrivire și felul destinație; cheia rezultatului distinge obiectele cu aceeași etichetă. |
| Corespondența valorilor | Slotul citit, transformarea, unitatea și slotul scris. Poziția pe o axă temporală cere origine și scară, nu simpla copiere a orei. |
| Regula relațiilor | Condiția exactă pentru o legătură: succesiune temporală, participant comun sau altă relație declarată. Aceste sensuri nu sunt interschimbabile. |
| Agregarea | Gruparea, identitatea elementului numărat, tratamentul duplicatelor și dovada acoperirii colecției. |
| Proveniența rezultatului | Selecția, valorile consumate, identitățile sursă, versiunea regulilor și parametrii transformării care permit explicarea rezultatului. |

For “draw a diagram of my week”, the library identifies the source week and destination diagram, then considers declared projections such as temporal placement or shared participants. A reversible default can choose temporal placement without inventing arrows whose meaning is unknown. It records the selected projection and alternative. The following example uses meetings as nodes positioned on a time axis, with no connecting edges.

Instantaneul săptămânii conține `m1`, de la 11:00 la 11:30, cu Ana și Dan, și `m2`, de la 14:00 la 15:00 în aceeași zi, numai cu Ana. Regula de obiect produce câte un nod pentru fiecare identitate de apariție a ședinței. Pentru o serie recurentă se păstrează atât identitatea apariției, cât și identitatea seriei. Proiecția pe apariții folosește prima drept cheie; o grupare cerută pe serii folosește a doua și păstrează membrii grupului în proveniență. Astfel, „the Monday stand-up” poate desemna o apariție sau un grup de apariții, după selecția și gruparea rezolvate din cerere, fără să le contopească accidental. Eticheta rezultă din intervalul citit. Dacă originea axei este 09:00 și scara aleasă este două unități de desen pe minut, pozițiile sunt `(660 − 540) × 2 = 240`, respectiv `(840 − 540) × 2 = 600`. Calculul presupune aceeași zi fără schimbare de fus; cazul general calculează diferența dintre momente rezolvate, nu dintre două ore locale izolate.

Corespondența nu este completă până când schema destinației nu spune ce înseamnă această poziție: aici este coordonata orizontală a centrului nodului, într-un cadru declarat al diagramei. Scara aparține prezentării și rămâne în proveniență; nu modifică durata ședinței. Un alt layout poate folosi aceeași selecție cu altă scară. Dacă nodurile se suprapun, constrângerile de layout cer o altă așezare sau o altă scară; nu mută ședințele în calendar pentru a face loc în desen.

| Rezultatul urmărit | Regula aplicată instantaneului |
|---|---|
| Nod pentru `m1` | Identitate nouă în diagramă, proveniență către apariția `m1`, etichetă `11:00–11:30`, poziție orizontală `240` în cadrul ales. |
| Nod pentru `m2` | Identitate distinctă, proveniență către apariția `m2`, etichetă `14:00–15:00`, poziție orizontală `600` în același cadru. |
| Numărul ședințelor Anei | Grupul de identități distincte este `{m1, m2}`; rezultatul este `2`. |
| Numărul ședințelor lui Dan | Grupul este `{m1}`; rezultatul este `1`. |

Ultimele două rânduri aparțin altei proiecții, „a bar chart of meetings per person”. Regula formează perechi distincte `(persoană, apariție)`, grupează după persoană și numără aparițiile din fiecare grup. Ședința comună contribuie o dată fiecărei persoane; suma barelor este deci numărul participărilor, nu numărul ședințelor. Un total se produce numai pentru un domeniu închis al selecției, consemnat în proveniență: de exemplu toate ședințele persoanelor selectate în intervalul săptămânii rezolvate. Dacă selecția este incompletă, valorile nu pot fi prezentate drept totalurile săptămânii. Se poate prezenta o propunere explicit etichetată „based on what is loaded”, cu datele lipsă declarate; ea nu devine un grafic verificat al întregii săptămâni. O bară zero pentru o persoană fără ședințe cere și mulțimea persoanelor care trebuie afișate; absența ei din grupurile găsite nu furnizează singură această informație.

Fiecare fapt produs păstrează justificarea sa: un nod indică apariția citită, o legătură indică ambele capete și regula relației, iar o bară indică grupul și acoperirea selecției. Proveniența locală de tip `source.snapshot`, exemplificată în secțiunea 8.6, păstrează valorile consumate; o referință activă temporară către calendar nu este exportată ca și cum ar fi o dovadă autonomă. Identitatea rezultatului ține cont de proiecție și de cheia sursă sau a grupului, astfel încât două ședințe cu aceeași etichetă să nu se contopească.

An explicit update rereads the source and reevaluates the declared projection. It compares results by source/group key. Removing a generated diagram node never removes its calendar event. Manual overrides remain distinct from generated values. A declared merge policy can preserve overridden fields, update unaffected fields and report which fields were kept. If an update cannot reconcile a hard constraint, the conflicting part remains unchanged with a concrete explanation; no hidden overwrite or routine clarification is required. Undo restores the previous destination snapshot, not intervening source edits.

## 6.2 Drumul unui mesaj, pe etape

Am văzut drumul în secțiunea 1.4, pe un exemplu. Acum îl numim. Fiecare etapă primește ceva și dă ceva mai departe, iar secțiunile următoare iau etapele pe rând.

| Etapa | Ce primește și ce dă |
|---|---|
| 1. State | Obtain the authoritative instance facts and declared primitive observations, with version and coverage. |
| 2. Interpretarea | Din propoziție face cererea: ce se vrea, spus în concepte generale (secțiunea 6.3). |
| 3. Situarea | Hotărăște ce este mesajul față de dialogul de până acum: cerere nouă, corectare, răspuns la o întrebare (secțiunea 6.4). |
| 4. Înțelesul numeric | Din cuvinte face numere și le potrivește cu ce pot face uneltele (secțiunea 6.5). |
| 5. Completarea | Pentru ce a rămas nespus propune valori (secțiunea 6.6). |
| 6. Elaboration | Resolve targets, expand compositions, fill declared defaults, rank candidates and validate; output a concrete SOP circuit of typed tool calls and dependencies (§6.7–6.8). |
| 7. Dispatch | The generic library dispatcher binds typed outputs and schedules concrete calls. Each tool handles its own instruction; observed effects are checked (§6.9). |
| 8. Răspunsul | Din ce s-a schimbat de fapt compune propoziția de răspuns (secțiunea 6.10). |

Completion and elaboration repeat until every effectful instruction matches a tool contract and contains no unresolved semantic choice. A typed reference to the output of an earlier call is concrete dataflow: it is bound mechanically at dispatch, not guessed by the tool. Intermediate representations contain typed values and wires, not only numbers. A fully concrete UI-generated command can enter validation and dispatch directly through the same interface.

The application's public interaction with LIB supplies existing Worlds, declared interfaces and context, then submits requests and receives results. The steps above are internal mechanisms, not JavaScript stages that each application must orchestrate. Inspection can expose their facts and evidence without exposing a second public control API.

A concrete instruction has the exact shape of its tool interface. This small invented interface uses only schema primitives; `example.move` is the tool's accepted wire type, not a new library operation:

```sop
@move.type core.type of=example.move closed=true
@move.object core.slot of=example.move key=object kind=string present=true
@move.x core.slot of=example.move key=x kind=number present=true
@move.y core.slot of=example.move key=y kind=number present=true
@move1 example.move object="o2" x=270.82 y=527.40
```

For this example, `object` must resolve to a live object in the supplied instance, and `x,y` are centre coordinates in the declared page frame. The tool handler assigns those coordinates and returns its concrete result. The library checks the observed coordinates and records the previous values for undo. Source words, candidate referents and the reasoning trace stay linked outside the instruction; they need not become separate `value` wires inside every simple call. Removing that serialization noise does not remove the evidence.

## 6.3 Interpretarea: din propoziție, o cerere

Prima sarcină este să trecem de la cuvinte la ceva cu care programul poate lucra. Acest ceva se numește **cerere (request)** și este o mică lume de fire care spune ce vrea omul.

Lucrul important despre cerere este în ce termeni este scrisă. Nu are chei proprii fiecărui domeniu și nici o listă fixă de câmpuri. Este scrisă în conceptele lumii legendelor: un act, lucrul sau lucrurile despre care este vorba, cu felul lor, și cerințele despre ele, fiecare legată de un concept. De aceea aceeași formă servește toate domeniile.

| Propoziția | Cererea, spusă în cuvinte |
|---|---|
| „draw three big red fish in the pond” | Act: a face. Fel: pește. Cantitate: 3. Mărime: cuvântul de grad „big”. Culoare: regiunea „red”. Loc: relația „în” cu iazul. |
| „make a flowchart of how bread is baked, with no circles” | Act: a face. Fel: diagramă de flux. Subiect: coacerea pâinii. Forma părților: regiunea „circle”, nedorită. |
| „write a short formal letter about a late delivery” | Act: a face. Fel: scrisoare. Lungime: cuvântul de grad „short”. Ton: regiunea „formal”. Subiect: livrarea întârziată. |
| „a long meeting with Ana tomorrow afternoon” | Act: a face. Fel: ședință. Durată: cuvântul de grad „long”. Participant: Ana. Timp: regiunea „afternoon” a zilei de mâine. |

Coordination preserves target roles. “Draw a tree and a house” introduces two new targets under the shared creation act:

```sop
@source.pair std.request.source text="draw a tree and a house"
@request.pair std.request act=make mood=do source=$source.pair
@target.tree std.request.target request=$request.pair mode=new kind=tree
@target.house std.request.target request=$request.pair mode=new kind=house
```

“Draw a tree near the house” is different: the tree is new, the house is an existing anchor, and `near` relates them. Splitting every noun into a separate creation would create a house the user did not ask for. Both the reader and the graph bridge must preserve this distinction; later tool execution cannot repair a lost target or ownership edge.

De observat că în această etapă „big” și „red” rămân cuvinte: cererea ține minte că omul a spus „big”. Numărul vine abia în etapa 4, fiindcă depinde de ce este pe pagină.

**Cerințele.** Fiecare lucru pe care omul îl vrea este o **cerință (constraint)** a cererii. Ca să poată fi urmărită până la capăt și pomenită în răspuns, o cerință ține minte mai mult decât valoarea ei. Ține minte despre ce concept este (mărime, loc, culoare); dacă omul o vrea sau nu o vrea („no circles”); despre care lucru din cerere este vorba; dacă privește fiecare lucru în parte sau pe toate la un loc; dacă este o cerință sau doar o preferință („if possible”); și cuvintele din care a fost citită. Acestea sunt conținutul și proveniența cerinței; **identitatea** ei este un identificator stabil, care rămâne același când omul o corectează. Datorită ei, când omul scrie mai târziu „red, actually”, aplicația știe ce cerință anume se schimbă.

**De ce lucru se leagă fiecare cuvânt.** Partea grea a interpretării nu este recunoașterea cuvintelor, ci legarea lor. Tabelul arată perechi de propoziții în care o mică diferență schimbă înțelesul.

| Propoziția | Ce trebuie hotărât |
|---|---|
| „a big pond with small fish” | Sunt două mărimi și două lucruri: „big” este al iazului, „small” al peștilor. |
| „a report with no pictures in the introduction” | Interdicția privește numai introducerea, nu tot raportul. |
| „two arrows from each box” față de „two arrows” | Câte două la fiecare nod, sau două în total. |
| „do not move all the meetings” față de „do not move any meeting” | „Nu pe toate” față de „pe niciuna”. |
| „put the duck next to the red house” | Roșie este casa, nu rața. |

Aceste legări folosesc lexicul, gramatica și regulile de compunere semantică descrise în secțiunile 10.1–10.4; ele sunt comune domeniilor.

**Checking the reader.** Compare the entire request graph with independently annotated intent: targets, ownership, scope, negation, values and source spans. Reading a generated paraphrase again can reveal inconsistency, but two identical wrong readings do not prove correctness. Reader correctness, successful elaboration and observed tool effects are measured separately.

**Uninterpreted text.** The reader preserves uncertain spans and alternatives. The library applies the most plausible usable interpretation for reversible changes, reports the actual effect and the uncertainty, and retains undo. A relevant unresolved clause cannot silently disappear: it is recorded as unresolved and the response says what was not applied. An incidental remark need not become a tool argument. Unknown words can be proper names; edit distance alone never licenses replacing “man” with “moon”.

### 6.3.1 Interpretări candidate și tratarea ambiguității

Graph comparison uses a bijection between local identifiers while preserving types, typed values, shared references, repeated-value order and source evidence. Equivalence of two graphs proves neither correct reading of the human intention nor an observed effect. If comparison exceeds its budget, the result remains unknown; a timeout is not inequality.


Interpretarea unei propoziții produce ipoteze despre intenție. Fiecare ipoteză trebuie să păstreze corespondența cu mesajul: obiectele desemnate, cerințele și cuvintele care nu au fost încă interpretate. Altfel, eliminarea unei interpretări ar putea însemna eliminarea tacită a unei cerințe a omului.

Filtering uses actual state and declared capabilities. Ranking uses linguistic and contextual evidence without erasing alternatives. A non-winning interpretation remains inspectable. The response distinguishes the selected meaning from an observed effect, and identifies uncertainty rather than asking routine clarification questions.

Citirea dă una sau mai multe cereri candidate. Fiecare ține cerințele ei, cuvintele rămase necitite și legarea fiecărui cuvânt de un lucru. *(R51)*

Candidates incompatible with identity, hard requirements or declared capabilities are eliminated. The library ranks the compatible candidates using declared language, knowledge and contextual evidence. For a reversible request it selects the best usable candidate, retains alternatives and undo, and states the selected interpretation when uncertainty matters. An unresolved hard contradiction is reported; it is not repaired by silently deleting a requirement. *(R52)*

Exemplu: „make the red and blue nodes bigger”. Prima citire: nodurile roșii și nodurile albastre. A doua: nodurile care sunt și roșii, și albastre. Dacă niciun nod nu este în amândouă regiunile, a doua citire nu găsește nimic și cade. Contraexemplu: „add red and blue nodes”. Prima citire: câte un nod din fiecare culoare. A doua: noduri în două culori. Dacă unealta diagramei declară că nu poate realiza un nod în două culori, a doua interpretare cade. Limitarea trebuie să vină din contractul uneltei, nu dintr-o presupunere despre toate diagramele.

Identificarea lucrului și rezultatul dorit sunt două contexte de evaluare. În „make the red objects blue”, roșul identifică obiectele în starea observată înaintea schimbării, iar albastrul descrie rezultatul. Dacă am pune ambele culori în aceeași conjuncție de rezultate, am cere greșit ca obiectul să ajungă simultan roșu și albastru.

An existing target can have a `selector`, a reference to the predicate graph that filters observed candidates. A reference to that target inside its selector denotes the candidate under evaluation. `request.root` denotes desired-result conditions. Without an explicit root, constraints outside selectors form the implicit result conjunction. Selection and recolouring are separate operations even when they use the same property:

```sop
@source.selection std.request.source text="make the red objects blue"
@request.selection std.request act=change mood=do source=$source.selection
@target.selection std.request.target request=$request.selection mode=existing kind=object selector=$condition.selected
@condition.selected std.request.constraint request=$request.selection target=$target.selection concept=colour operator=region value=red polarity=positive character=requirement
@condition.desired std.request.constraint request=$request.selection target=$target.selection concept=colour operator=region value=blue polarity=positive character=requirement
```

Selectorul poate folosi aceleași noduri logice de conjuncție, disjuncție, negație și cuantificare. Unirea sau intersecția obiectelor existente roșii și albastre din exemplul anterior se exprimă în selector, nu prin cerințe care le recolorează. Fiecare nod și descendent al său aparține unui singur context: unui selector anume sau rezultatului. Refolosirea aceluiași nod între contexte este refuzată; dacă omul cere explicit aceeași proprietate înainte și după, reprezentarea folosește două constrângeri distincte. Variabilele legate de un cuantificator nu ies din acel context.

Selectors describe observed state; `delta`, `factor` and `occurred` express changes or evidence of acts and are not simple observed-property selectors. Historical selection must use an explicit history contract. Relations and `same` descriptions can connect targets, so resolving them may require a joint search. An acyclic predicate graph alone does not prove that its referents can be found.

A relevant uninterpreted span must remain attached to the request and response. It does not force refusal of every independent reversible effect, but it cannot silently lose a negation, a required target or a condition. The library identifies exactly which part it applied and which span remains unresolved. *(R53)*

O întrebare de clarificare rămâne deschisă până când omul îi răspunde, până când aplicația pune alta sau până când se execută o cerere nouă. Un mesaj care se potrivește ca răspuns (are felul de valoare așteptat) este luat ca răspuns. Unul care nu se potrivește este o cerere nouă și închide întrebarea. *(R54)*

În exemplul cu nodurile roșii și albastre, diferența este între reuniunea a două grupuri și intersecția lor. Interpretările trebuie păstrate separat până la rezolvarea referințelor. Faptul că intersecția este goală poate elimina o citire a unei referințe la obiecte existente, dar nu justifică eliminarea unei culori dintr-o cerere de creare.

Un cuvânt neinterpretat poate părea mic și totuși să schimbe cererea: „not” inversează o condiție. De aceea categoria „cuvânt de legătură” nu este o autorizație de a ignora negația, ordinea ori întinderea unei expresii. Ignorarea este admisibilă numai când gramatica îi declară rolul nerelevant pentru cererea structurată. Întrebarea de clarificare păstrează candidații și valoarea așteptată, pentru ca răspunsul următor să poată fi legat de problema corectă.

Reader evaluation compares the full structured request against annotated intent on independent examples. It measures target ownership, scope, negation, source spans and calibration, not only a verb score. A confidence number is evidence for ranking interpretations, not proof of a meaning or permission to bypass schema and effect checks. Failure on “draw a tree and a house” must be located at its actual boundary: reading the two targets, preserving them in the request graph, elaborating both, or executing the resulting calls.

### 6.3.2 Reprezentarea cererii și identitatea unei cerințe

Cererea este o stare distinctă de desen: faptul că omul cere trei pești nu înseamnă că aceștia există deja. Un obiect al cererii poate desemna un grup de rezultate încă de creat sau un lucru existent care trebuie găsit. Planificarea leagă aceste ținte de identități concrete; nu folosește identificatorul unui obiect al cererii drept identificatorul unui pește real.

The `std.request` declarations preserve source, named act, explicit mood and target descriptions. Here is a minimal request; the later example adds conditions:

```sop
@request.sample std.request act=make mood=propose source=$source.sample
@target.sample std.request.target request=$request.sample mode=new kind=sample name="illustrative sample"
@source.sample std.request.source text="propose a new sample"
```

`mood=propose` consemnează solicitarea unei propuneri, nu autorizează execuția. Modul este obligatoriu în acest contract: absența sa nu se transformă implicit în `do`. Celelalte variante declarate sunt `do`, `check` și `ask`; nici una nu înlocuiește verificarea drepturilor sau a efectului. `act` și `kind` sunt încă nume nerezolvate, nu dovezi că există o capabilitate ori o schemă cu acel nume.

Fiecare țintă are o referință tipizată la cererea sa; fiecare cerere are o referință tipizată la sursă. Ștergerea țintei nu șterge cererea, dar ștergerea unei cereri încă referite sau a unei surse folosite este refuzată. Mai multe cereri pot păstra aceeași sursă. Numele unei ținte descrie căutarea ori rezultatul dorit; nu este identitatea unui obiect creat sau găsit. Variantele `new` și `existing` sunt validate structural; o țintă `existing` fără referent concret nu este rezolvată prin simpla încărcare a acestor fire.

The request graph includes constraints, value descriptions, logical nodes, `root` and bound targets. Its structural invariants cover ownership, reachability, cycles and variable scope. Those checks do not evaluate predicate truth or authorize execution. A fragment is situated in dialogue before an explicit execution mood is assigned.

The following request represents “draw three big red fish in the pond”. Act, kind and concept names must resolve before evaluation and elaboration. The fixed structural fields describe the generic graph; colour, place and quantity are vocabulary data rather than a new JavaScript field per domain.

```sop
@src1 std.request.source text="draw three big red fish in the pond"
@r1 std.request act=make mood=do source=$src1
@fish1 std.request.target request=$r1 mode=new kind=fish
@pond1 std.request.target request=$r1 mode=existing kind=pond determiner=definite
@c.count std.request.constraint request=$r1 target=$fish1 concept=quantity operator=eq value=3 scope=group polarity=positive character=requirement source=$src1 source.start=5 source.end=10
@c.size std.request.constraint request=$r1 target=$fish1 concept=size operator=degree value=big scope=each polarity=positive character=requirement source=$src1 source.start=11 source.end=14
@c.colour std.request.constraint request=$r1 target=$fish1 concept=colour operator=region value=red scope=each polarity=positive character=requirement source=$src1 source.start=15 source.end=18
@c.place std.request.constraint request=$r1 target=$fish1 concept=place operator=relation relation=in goal=$pond1 scope=each polarity=positive character=requirement source=$src1 source.start=24 source.end=35
```

`src1` preserves the exact source. Source intervals count Unicode scalars from zero with an exclusive end, not UTF-16 code units. The bounds occur together and identify a nonempty in-range span. A multiword meaning may preserve separate contributing intervals rather than falsely claim intervening text. `r1` identifies the request, not a created object. Provenance remains distinct from whether the interpretation or requested effect is correct.

`fish1` denotes a group of new results, not an already created fish. `pond1` describes an existing pond to resolve. With two ponds, the library ranks them by context and declared relevance, records the selected interpretation and retains the alternative. It never changes `existing` to `new` merely to avoid resolving the reference.

| Cerință | Interpretare și verificare |
|---|---|
| `c.count` | Cantitatea grupului este exact trei. `scope=group` numără rezultatele, nu cere trei copii pentru fiecare pește. |
| `c.size` | Fiecare rezultat primește mărimea calculată din conceptul de grad `big`, clasa de comparație și sursa ei. `degree` amână calculul numeric până când există context. |
| `c.colour` | Culoarea fiecărui rezultat trebuie să aparțină regiunii `red`; numele se rezolvă la declarația regiunii și versiunea ei. |
| `c.place` | Pentru fiecare rezultat trebuie să țină relația `in` cu iazul găsit pentru `pond1`. Locul nu este dedus din cuvântul fish, fiindcă omul l-a cerut explicit. |

`operator` selectează verificarea cerinței, nu o unealtă: egalitate de cantitate, calcul de grad, apartenență la regiune sau relație. `polarity=positive` cere satisfacerea ei; `negative` cere ca predicatul să fie fals. `character=requirement` exprimă obligația, `preference` o preferință care poate ceda cerințelor, iar `assumption` o alegere a aplicației pentru o informație omisă. Negarea nu slăbește obligația: „no circles” poate fi o cerință negativă tare a cererii. O presupunere nu inventează un interval în mesaj: ea indică declarația sau pasul de justificare care a propus-o.

Schema trebuie să verifice variantele operatorului. Section 4.4.5 defines `same`, cu o referință tipizată la însușirea altei ținte și cu observația versionată rezolvată separat. Section 4.4.4 defines `delta` and `factor`, cu observația de referință și ancora schimbării, precum și argumentele măsurate ale relațiilor; o unitate incompatibilă sau capete de măsurare nedefinite sunt erori ale cererii, nu valori implicite ale uneltei. Extensia logică din secțiunea 10.3.1 adaugă predicatul `occurred`, care cere un act, faza verificată și o valoare booleană și citește dovezile unei schimbări; nu se tratează ca egalitate numerică. `relation` cere `relation` și `goal`; `eq`, `less.equal`, `greater.equal`, `degree` și `region` cer o valoare de tipul acceptat de concept; operatorii `less.equal` și `greater.equal` sunt admiși numai pe valori ordonabile, în unități compatibile. O cheie `goal` rămasă pe o egalitate numerică este o eroare de schemă a cererii. Rezolvitorul păstrează separat descrierea țintei, identitățile găsite și versiunea stării citite. Această legare permite verificarea fiecărui rezultat și explicarea unei ambiguități fără modificarea sensului inițial al cererii.

Să urmeze mesajul „in the sky”. Situarea din secțiunea 6.4 îl leagă de locul grupului de pești din ultima cerere. The following complete revised snapshot preserves the group and unchanged requirements; `c.place` keeps its identity and receives the new source and destination:

```sop
@src2 std.request.source text="in the sky"
@src1 std.request.source text="draw three big red fish in the pond"
@r1 std.request act=make mood=do source=$src1
@fish1 std.request.target request=$r1 mode=new kind=fish
@sky1 std.request.target request=$r1 mode=existing kind=sky determiner=definite
@c.count std.request.constraint request=$r1 target=$fish1 concept=quantity operator=eq value=3 scope=group polarity=positive character=requirement source=$src1 source.start=5 source.end=10
@c.size std.request.constraint request=$r1 target=$fish1 concept=size operator=degree value=big scope=each polarity=positive character=requirement source=$src1 source.start=11 source.end=14
@c.colour std.request.constraint request=$r1 target=$fish1 concept=colour operator=region value=red scope=each polarity=positive character=requirement source=$src1 source.start=15 source.end=18
@c.place std.request.constraint request=$r1 target=$fish1 concept=place operator=relation relation=in goal=$sky1 scope=each polarity=positive character=requirement source=$src2 source.start=0 source.end=10
```

This block is the complete revised request snapshot. It is loaded instead of the earlier snapshot, not concatenated with it: repeating identifiers with conflicting declarations would be an error. Cantitatea, mărimea și culoarea rămân neschimbate, la fel ca identitatea grupului vizat. Jurnalul păstrează versiunea anterioară și legătura cu mesajul corectiv.

Dacă peștii au fost deja creați, legarea grupului `fish1` la acele identități se păstrează, iar planul mută acei pești. Nu execută din nou `make` pentru încă trei. Dacă prima cerere nu a ajuns la execuție, corectarea schimbă locul în planul încă neexecutat. Aplicarea asupra ultimului grup, distincția dintre corectare și repetare și controlul efectelor sunt obligații separate ale situării și planificării; schimbarea unui fir nu le rezolvă singură.

Aceeași structură permite ca mesajul real cu două case diferite să aibă o țintă pentru case și o cantitate a acelui grup. Dar semnificația lui „diferite” și părțile complete ale peisajului trebuie declarate separat. Exemplul de aici nu închide aceste lacune din replay și nu face, singur, un domeniu executabil.

Cititorul englez este dezvoltat în capitolul 10: lexic, gramatică, compunere semantică și extinderea interpretării.

## 6.4 Situarea: ce este acest mesaj față de ce s-a spus înainte

Oamenii nu vorbesc în propoziții întregi. După „draw three fish” urmează „bigger”, „in the sky”, „two more”, „not that one”. Fiecare dintre acestea are sens numai față de ce s-a spus înainte. Etapa aceasta hotărăște ce fel de mesaj a sosit.

Pentru aceasta dialogul ține un **focus**: lucrurile despre care se vorbește acum, lucrurile pe care omul le-a selectat și ultima cerere, cea care mai poate fi corectată.

| Felul mesajului | Cum se recunoaște și ce face |
|---|---|
| cerere nouă | Are un act și un lucru nou: „draw a house”. Pornește un drum nou. |
| reacție | Judecă ce tocmai s-a făcut: „fewer”, „too big”, „another one”, „shorter”, „later”. Schimbă numai ce numește. După „fewer fish”, casa și iazul rămân neatinse. |
| corecție | Dă altă valoare pentru ceva ce omul ceruse deja: „red, actually”, „make that Friday”. |
| fragment | Este o bucată de propoziție care dă o valoare pentru ceva rămas nespus sau pentru ultimul lucru despre care s-a vorbit: „on the lake”, „down”, „two of them”, „with Tom too”, „after the greeting”. |
| răspuns | Vine după o întrebare pusă de aplicație și îi răspunde. |
| laudă sau mulțumire | Nu schimbă nimic. |

Fragmentul este locul în care se vede cel mai bine câștigul lumii legendelor. „On the lake” este recunoscut ca loc fiindcă „on” este o relație de loc și „lake” este un fel de lucru; apoi este pus în cerința de loc a cererii dinainte. Nimic din aceasta nu este scris pentru desen.

**Despre care lucru vorbește omul.** Omul numește lucrurile care există în multe feluri, iar aplicația trebuie să găsească lucrul. Găsirea se face tot prin concepte.

| Cum este numit lucrul | Exemple |
|---|---|
| după nume | „the Start box”, „the meeting called Review”. |
| după fel și însușire | „the red fish” este peștele a cărui culoare este cea mai aproape de regiunea „red”; „the round node”; „the long meeting”. |
| după ordine | „the second paragraph”, „the first one”. |
| după o relație | „the house next to the pond”, „the box under Start”, „the meeting before lunch”. |
| printr-un pronume | „it”, „them”: lucrurile din focus. |
| printr-un plural hotărât | „the fish”, „the arrows”: lucrurile selectate, dacă sunt; altfel toate cele de acel fel. |

When several objects match a singular description, the library ranks them using explicit identity, focus, accepted context and declared relevance. A reversible change may use the best candidate, retain the others and say which object changed. The tool receives one resolved identity. If there is no compatible candidate, the library reports the missing referent; it does not create an existing target merely to make the command run.

**Missing information.** The concept and expected type identify the missing value; declared knowledge, accepted context and instance constraints supply candidates. The library uses a plausible reversible completion, records its source and explains material uncertainty. It does not ask one question per missing parameter. A response to an already-open question is still represented as a reference to that dialogue record; it must not be mistaken for an unrelated new creation.

### 6.4.1 Descrieri și rezolvarea referințelor

O descriere este un graf de ținte și condiții: feluri, însușiri, relații și surse. Structura cererii din secțiunea 6.3.2 folosește o asemenea descriere și îi adaugă actul. O referință o folosește pentru a găsi ceva; un subiect de document o poate folosi pentru a descrie ceva despre care se va scrie. Aceste utilizări au aceeași formă de bază, dar angajamente diferite: descrierea unui personaj într-o poveste nu afirmă că există în lumea observată și nu autorizează crearea lui acolo. Rolul descrierii este declarat, nu dedus din simpla prezență a unui fir.

Rezolvarea urmează un mecanism comun: stabilește mulțimea de candidați, aplică filtrele obligatorii, apoi ordonează potrivirile admisibile folosind distanțele declarate. Nu există o singură distanță universală care să poată compensa orice nepotrivire. Un nume exact, o identitate, o proveniență cerută sau o limită temporală sunt filtre tari; distanța de culoare nu poate compensa încălcarea lor. Aproximarea se aplică numai componentelor pentru care este permisă, cu toleranța lor. O potrivire exactă are prioritate față de relaxarea aceleiași descrieri. If several candidates remain, the library preserves and ranks them; a reversible selection is reported with its uncertainty and alternatives.

| Ce se caută | Candidați, filtrare și criteriu de alegere |
|---|---|
| Un obiect descris prin fel și însușiri | Obiectele vizibile în context; identitățile și cerințele exacte filtrează; aproximarea felului sau a unei însușiri cere o politică și o metrică declarate. |
| Un obiect după proveniență | Obiectele cu dovezi despre creare sau modificare; „adăugat de aplicație” selectează evenimentul și autorul cerut, nu obiectul cel mai asemănător. |
| O valoare din trecut | Valorile aceluiași obiect și aceleiași proprietăți din jurnal; momentul indicat filtrează. „Înainte” fără alt reper selectează valoarea dinaintea ultimei schimbări relevante, dacă aceasta este cunoscută. |
| Un membru după ordine | Membrii întregului, sub o ordine declarată: flux, timp, text sau lectură. Fără ordine unică aplicabilă, „primul” rămâne ambiguu. |
| Partea care participă la o relație | Părțile obiectului, filtrate prin rolul declarat de susținere, conținere sau atașare; nu se alege automat partea cu coordonata extremă. |
| Un sens sau un cuvânt reparat | Sensurile din vocabular, respectiv formele engleze admise și numele instanței; compatibilitatea gramaticală și semantică filtrează înaintea costului reparației. |
| O realizare disponibilă | Realizările declarate compatibile cu felul și cerințele; distanța pe arbore poate ordona împrumutul, dar capabilitatea uneltei trebuie verificată separat. |

Distanța pe arborele felurilor poate propune o potrivire apropiată numai când politica domeniului permite asta. De exemplu, „the box” poate desemna un nod dreptunghiular într-o diagramă dacă este singurul candidat admisibil, iar aplicația spune ce a înțeles. Acest rezultat nu schimbă nodul în alt tip și nu introduce automat o echivalență generală între box și node. Un alias local necesită o înregistrare separată, cu obiect, context și sursă. La folosirea ulterioară, aliasul nu trebuie să ascundă o nouă ambiguitate între obiecte.

O parte așteptată, dar absentă, nu este un referent observat. Sistemul poate găsi în graful unui întreg rolul cerut și poate propune crearea lui când actul este de editare, rolul este declarat construibil, întregul este identificat și nu există o constrângere de absență. Astfel, „add the signature” poate completa rolul semnăturii unei scrisori fără să pretindă că semnătura exista. O întrebare despre semnătură nu o creează. For an optional role, possibility alone does not authorize creation: a declared interpretation policy and context must support the chosen edit, with its uncertainty recorded. Aceasta este excepția controlată de completare structurală la regula R37, nu o regulă „nu găsesc, deci fac”.

Reparația unui cuvânt poate traversa o limită de cuvinte, dar trebuie să producă o citire completă și compatibilă, cu modificarea păstrată în proveniență. Un cuvânt necunoscut poate fi un nume propriu; costul mic de editare nu autorizează rescrierea lui. A missing realization requires an applicable declared composition and matching tool capabilities; selection alone cannot manufacture either. Pentru o valoare istorică lipsă, răspunsul este că istoricul nu o conține, nu alegerea unei valori recente de la alt obiect.

## 6.5 Înțelesul numeric și potrivirea cu ce poate unealta

The request may retain qualitative constraints such as “big”, “red” and “afternoon”. The library resolves them against declared spaces, baselines and instance state. Tool inputs are concrete typed values, not necessarily numbers: a label remains a string, a selection becomes identified objects, a colour can become a supported colour encoding, and a time becomes a resolved instant.

First, resolve each qualitative constraint to its declared space and region or transformation. “Red” identifies a region, not automatically one universal colour number. “Big” uses a declared comparison population and baseline. The library then generates concrete candidate values, such as a supported colour point or a numeric size, preserving the region test and baseline calculation as evidence.

În al doilea pas, punctul cerut este comparat cu ce poate realiza unealta, lucru declarat pe parametrul ei (secțiunea 6.1). Pot apărea patru situații.

| Situația | Ce face aplicația |
|---|---|
| unealta poate realiza chiar punctul cerut | Îl folosește întocmai. Desenul poate picta orice culoare. |
| unealta poate realiza un punct apropiat | Diagrama are numai opt forme; „oval” cade în regiunea elipsei. Se folosește elipsa. Omului i se spune o singură dată, și numai dacă diferența se vede. |
| cel mai apropiat punct posibil este prea departe | „A two-hour meeting” într-o zi cu o singură jumătate de oră liberă. Ședința nu este scurtată pe tăcute; aplicația explică și propune. |
| felul cerut nu are o realizare proprie | „A duck” este desenată cu imaginea păsării. Lucrul rămâne rață; omului i se spune o dată. |

Cât de departe este „prea departe” se declară, și se numește **toleranță (tolerance)**: câtă abatere este primită între ce s-a cerut și ce se poate face.

Regula comună este cea hotărâtă pentru întreaga aplicație: aplicația face cât poate de bine și spune ce a făcut altfel; nu oprește omul cu o întrebare pentru o înlocuire măruntă. Cerința omului nu este înlocuită în cerere. Ea rămâne așa cum a fost spusă, cu transformarea notată lângă ea, pentru ca răspunsul să poată spune adevărul și pentru ca „the duck” să găsească mai târziu rața.

### 6.5.1 Exactitate, aproximare și toleranță

Aproximarea este o permisiune semantică, nu doar un calcul de distanță. O oră cerută exact nu poate fi înlocuită cu cea mai apropiată oră liberă fără acord. O cerere precum „in the afternoon” autorizează alegerea în interiorul unei regiuni, dar nu în afara ei doar pentru că o altă oră este convenabilă.

Tabelul clasifică sursa valorii. Această clasificare trebuie păstrată de la interpretare până la execuție, deoarece două planuri cu aceeași valoare numerică pot avea libertăți diferite în funcție de ce a spus omul.

Ce se poate apropia depinde de cât de exact a vorbit omul. *(R55)*

| Cum a fost spusă valoarea | Ce are voie aplicația |
|---|---|
| exact: un număr, o oră, un nume („at ten thirty”, „Ana”) | Nimic altceva fără acordul omului. Dacă nu se poate întocmai, explică și propune. |
| vag: o regiune sau un cuvânt de grad („in the afternoon”, „big”) | Orice punct din regiune, respectiv din jurul valorii calculate, în toleranță. |
| ca pas: un comparativ („later”, „bigger”) | Aplicația poate ajusta mărimea pasului, păstrând direcția cerută și restricțiile. „Later” nu permite o oră mai devreme. |
| nespusă: o presupunere | Orice valoare permisă. Se spune dacă contează. |

Toleranța este o distanță, în unitățile din secțiunea 4.4.1. Fiecare spațiu declară una implicită; un parametru al unei unelte poate declara alta. Toleranța zero înseamnă numai întocmai. Omul o poate schimba pe loc: „exactly” o face zero; „about” o dublează. *(R56)*

Exemple de margine, în spațiul formelor, cu toleranța 0,15. „Oval”, când unealta are elipsă: distanța 0,05; se face elipsa. „Triangle”, când cea mai apropiată formă a uneltei este rombul: distanța 0,4; nu se face romb, ci se spune că triunghiul nu este posibil și ce forme sunt.

Toleranța se aplică numai după verificarea permisiunii de aproximare. Ea nu slăbește o interdicție tare și nu transformă un nume exact într-o persoană asemănătoare. Dacă durata cerută este exact o oră, o rezervare de 55 de minute nu devine acceptabilă doar pentru că diferența numerică este mică.

Distanțele din exemplul formelor presupun un spațiu și o metrică declarate. Valorile 0,05 și 0,4 sunt date ilustrative pentru acel calcul, nu proprietăți universale ale cuvintelor „oval” și „triangle”. În lipsa reprezentării formelor, sistemul nu poate inventa aceste scoruri pentru a justifica un înlocuitor.

## 6.6 Completarea: ce facem cu ce omul nu a spus

Omul spune puțin. „Draw a fish” nu spune unde, cât de mare, ce culoare. Dacă aplicația ar întreba de fiecare dată, nu l-ar folosi nimeni. Dacă ar alege singur și ar tăcea, omul nu ar ști ce a hotărât el și ce a hotărât aplicația. Etapa aceasta rezolvă amândouă părțile: propune valori și ține minte, pentru fiecare, de unde vine.

**Fiecare valoare își cunoaște originea.** Orice valoare din cerere poartă patru informații. **Sursa**: de unde vine, de la om, din cunoaștere, din ce este pe pagină. **Caracterul**: cât de tare ține de ea, lucru explicat imediat. **Contextul**: despre ce lucru este și cât timp rămâne valabilă. **Costul**: cât de nesigură este, dacă a fost presupusă.

Caracterul are trei valori, iar ele hotărăsc ce îi datorează aplicația omului.

| Caracterul | Ce înseamnă |
|---|---|
| cerință | A spus-o omul și trebuie îndeplinită. Dacă nu se poate, the library explains the conflict and retains alternatives; it does not silently discard it. „In the sky” pentru pești este o cerință și se îndeplinește, chiar dacă este neobișnuită. |
| preferință | A spus-o omul, dar cu „dacă se poate”: „in the morning if possible”. Se îndeplinește după cerințe, cât se poate. |
| presupunere | A ales-o aplicația. Poate fi schimbată oricând, iar omului i se spune când contează: locul ales pentru pești, ora aleasă pentru ședință. |

Conflicting hard requirements cannot be resolved by making the older one disappear. If Ana is unavailable throughout the explicitly requested Monday morning, the library retains both requirements, explains the concrete conflict and identifies admissible alternatives. It can still apply independently authorized reversible changes, but cannot report that the conflicting meeting was scheduled as requested.

**De unde vin valorile propuse.** Cheile rămase deschise primesc valori candidate din patru surse, luate în ordine. Întâi, ce a spus omul mai devreme despre același lucru. Apoi, ce au în comun lucrurile pe care omul le-a cerut până acum: dacă toate nodurile cerute de el sunt albastre, următorul este tot albastru. Apoi, ce este obișnuit pentru acel fel de lucru, moștenit pe arborele felurilor (secțiunea 5.2). La urmă, dacă nimic nu alege, o valoare variată din zona obișnuită, ca desenele să nu arate toate la fel.

Ce este obișnuit are forma unei regiuni, nu a unei valori fixe. Numărul de pași ai unui flux nu este „șapte”; este o regiune pe axa cantității, cu centrul în jurul lui șapte.

O valoare obișnuită umple numai un gol. Nu are voie să înlocuiască ce a cerut omul. Dacă omul cere un flux despre „how bread is baked” și cunoașterea nu are pașii coacerii pâinii, răspunsul este „I do not know the steps; I can make empty steps, or you can name them”. Nu este un flux despre altceva, cu pași luați de unde s-a nimerit.

**Mai multe lucruri într-o cerere.** Când omul cere mai multe lucruri deodată („a house and a swing”), aplicația verifică dacă sunt independente: nu se bat pe aceeași resursă, nicio regulă nu le leagă și omul nu a spus că le vrea numai împreună. Dacă sunt independente și unul nu se poate face, celelalte se fac, iar omului i se spune ce a rămas nefăcut.

### 6.6.1 Cunoaștere locală și învățarea unei preferințe

O instanță poate primi nume, regiuni, valori obișnuite și factori folosind aceleași structuri ca bazele de cunoaștere. Reutilizarea formei nu înseamnă reutilizarea necondiționată a autorității. Fiecare fapt local păstrează cine l-a introdus, ce afirmație îl susține, domeniul de aplicare și versiunea. O corectare a rezultatului curent schimbă acel rezultat; pentru a deveni preferință aplicabilă cererilor viitoare, trebuie fie formulată explicit ca preferință, fie să îndeplinească regula de învățare declarată. Nu se promovează automat în cunoaștere comună.

| Fapt local | Condiția de introducere și limita lui |
|---|---|
| Nume pentru un obiect | Obiect identificat și nume atribuit sau confirmat; aliasul este local și nu schimbă felul obiectului. |
| Regiune numită | Spațiu și limite cunoscute ori construite printr-o regulă declarată; numele și ordinea regiunilor devin referibile în instanță. |
| Valoare obișnuită | Felul și contextul sunt explicite; o singură cerință pentru un obiect nu este o regulă pentru toate obiectele de acel fel. |
| Factor de grad | Episodul de ajustare îndeplinește condițiile din secțiunea 4.5.1; factorul rămâne legat de acea justificare. |

„For my reports, use a short introduction” poate introduce o preferință pentru introducerile rapoartelor utilizatorului. „Shorten this introduction” autorizează numai schimbarea introducerii indicate. Ambele pot folosi aceeași regiune de lungime; întinderea învățării diferă. La o cerere viitoare exactă, acea preferință umple numai ce rămâne liber, fără să înlocuiască cerința nouă.

Anularea retrage efectul învățat legat de pasul anulat, fără să șteargă dovada că a existat. Dacă preferința a fost revizuită ulterior pe alte dovezi, sistemul nu suprascrie acea revizie cu o valoare veche: recalculează contribuția retractată sau raportează conflictul. Aceeași regulă protejează un alias și o regiune editate între timp.

## 6.7 Întregul și părțile

Omul cere adesea un lucru mare: un iaz, un flux, o scrisoare. Uneltele fac lucruri mici: o imagine, un nod, un paragraf. Între ele trebuie cineva care să știe din ce este făcut întregul. Acest „cineva” este cunoașterea: graful conceptului (secțiunea 4.4) spune din ce părți este făcut un **întreg (whole)** și cum se leagă ele.

| Întregul | Părțile lui |
|---|---|
| un iaz | Apă; pești și nuferi în ea; stuf pe margine. |
| un flux | Câte un nod pentru fiecare pas, legate într-o direcție; începutul și sfârșitul au forma lor. |
| un grafic cu bare | Câte o bară pentru fiecare valoare; înălțimea barei este cantitatea; etichete. |
| o scrisoare | Formulă de început, introducere, cuprins, încheiere, semnătură. |
| o zi de lucru | Ședințele ei, în ordine, fără suprapuneri. |

Cerințele omului trebuie duse la partea potrivită, după cum au fost legate în secțiunea 6.3. O cantitate rămâne la felul pe care îl numără: în „two ducks and a swan”, „two” este al rațelor.

Omul cere apoi schimbări ale întregului, cu cuvinte foarte scurte: „fewer”, „connect them”, „make it nicer”. These are requests over a whole, resolved by applicable declared methods; not every whole supports every operation. Ce le face sigure este că fiecare știe ce trebuie păstrat.

| Operația | Ce face și ce păstrează |
|---|---|
| mai puține părți | Scoate părți, dar păstrează părțile obligatorii și legăturile dintre cele rămase. Un flux scurtat rămâne legat de la început la sfârșit; o scrisoare scurtată își păstrează formula de început și semnătura. |
| mai multe părți | Adaugă numai părți pe care graful conceptului le permite. |
| nu toate la fel | Schimbă o însușire la unele părți, numai în regiunile permise. |
| leagă tot | Adaugă numai legături care au sens în tiparul lumii. |
| așază mai bine | Mută părțile spre locurile pe care cunoașterea le socotește potrivite: apa jos, cerul sus, rața pe apă; nodurile așezate astfel încât săgețile să se încrucișeze cât mai puțin. |

The output is a **plan** in the precise sense of a concrete SOP circuit of tool calls, typed dataflow and dependencies. Elaboration resolves object identities, values, authorized effects and preconditions; no tool is expected to decide what the user meant. No effect has occurred yet. A named high-level act with unfilled roles is still an intermediate goal, not an executable plan.

### 6.7.1 Recompletarea sub constrângeri

Multe operații asupra unui întreg pot folosi aceeași procedură: pornesc de la rezultatul existent, fixează ce trebuie păstrat, eliberează numai rolurile autorizate pentru schimbare, adaugă condițiile noi și caută o atribuire validă cu un cost declarat. Aceasta este **recompletarea**. Mai întâi se satisfac constrângerile tari; costul compară numai candidații care le respectă. O condiție de păstrare, o cantitate exactă sau o relație cerută nu devine negociabilă fiindcă altă variantă ar avea un scor mai bun.

| Familia de operații | Roluri schimbabile și condiții |
|---|---|
| Reașezarea unui întreg | Locurile părților autorizate; identitățile, numărul și valorile protejate rămân fixe. Obiectivul poate combina încălcări slabe, intersecții nedorite și aglomerare. |
| Așezarea după o structură | Locurile și atribuirea la pozițiile structurii declarate; apartenența cerută și excepțiile explicite sunt condiții tari, iar deplasarea totală poate fi cost. |
| O alternativă la rezultat | Alegerile lăsate aplicației; cerințele omului rămân. Se adaugă o distanță minimă față de rezultatul respins în dimensiunile declarate relevante. |
| Completarea felului sau a părților | Felurile și părțile permise de graf, cu limite de cardinalitate; varietatea folosește un generator declarat și păstrează sursa alegerii. |
| Ajustarea unei valori | Rolul indicat și direcția cerută; un pas vine din axă. Fără dimensiune numită, se compară abaterile normalizate numai pe dimensiunile declarate comparabile. |
| Păstrarea explicită | Rolurile numite sunt fixate la starea de referință; optimizarea celorlalte nu le poate elibera. |

Într-un document cu trei secțiuni, a cere două coloane poate elibera locurile secțiunilor și fixa textul și ordinea logică. O secțiune cerută pe întreaga lățime este o excepție explicită a structurii, nu un caz pe care optimizatorul îl poate aproxima printr-o coloană îngustă. Schema trebuie să ofere pozițiile permise și regula de repartizare; cuvântul „coloane” singur nu furnizează aceste date.

Nu orice reacție înseamnă aceeași recompletare. „Another one” poate cere adăugarea unui obiect, în timp ce „something else instead” cere înlocuirea rezultatului respins. Interpretarea stabilește identitatea rezultatului și dacă se adaugă sau se înlocuiește înainte de căutare. Costul nu poate hotărî această intenție. „Too much” fără dimensiune oferă un candidat de corectare numai dacă o abatere comparabilă este clar dominantă; otherwise ranked interpretations are retained and a reversible declared default may select a property, with the selected dimension stated; an undeclared property must not change silently.

Pentru varietate, jurnalul păstrează generatorul și alegerile efective. Dacă nu există alternativă validă la distanța cerută, aplicația raportează limita căutării sau imposibilitatea dovedită, după caz. Nu modifică cerințele ferme pentru a garanta un rezultat diferit. Explicația numește condițiile îmbunătățite și ce s-a păstrat; faptul că un cost a scăzut nu dovedește singur că întregul este „frumos”.

## 6.8 Raționamentul: când și cum alege biblioteca

A fully specified tool instruction needs contract validation, not another interpretation. A high-level request needs elaboration whenever it has unresolved targets, missing required arguments, qualitative constraints, a composition, conflicting requirements or competing interpretations. These are properties of the request graph and declared interfaces, not a list of domain-specific sentences in JavaScript.

Toate mecanismele de raționament lucrează pe același lucru: starea lumii văzută ca fapte, adică lucruri cu felurile lor, însușiri ca puncte în spații și relații între lucruri. De aceea niciunul nu trebuie rescris pentru un domeniu.

| Mecanismul | Ce face |
|---|---|
| deducția (deduction) | Aplică regulile și cunoașterea și spune ce decurge și ce se încalcă. Un nod fără săgeți spre el este un început. Două ședințe ale Anei se suprapun. |
| completarea cu cost minim | Ia valorile candidate pentru cheile deschise, le aruncă pe cele care încalcă o regulă tare și o alege, dintre cele rămase, pe cea mai ieftină. Costul crește cu fiecare regulă slabă încălcată și cu depărtarea de ce este obișnuit. Așa ajung peștii în iaz și ședința la cea mai apropiată oră liberă. În literatură, aceasta este o formă de abducție. |
| extinderea unei valori comune | Dacă lucrurile de același fel au valori apropiate, iar aceste valori au venit de la om, propune aceeași valoare pentru un lucru nou. Toate nodurile sunt albastre fiindcă omul le-a cerut așa; nodul nou va fi albastru. În literatură, aceasta este o formă de inducție. |
| rezolvitorul (solver) | Caută valori pentru multe chei deschise deodată, când depind una de alta: orarul unei săptămâni (secțiunea 5.4). |

**Cum se poate încheia o căutare.** Pentru ca aplicația să nu spună „nu se poate” când de fapt doar nu a căutat destul, o căutare are cinci încheieri posibile, iar ele sunt ținute deosebit: s-a găsit un plan valid; s-a găsit un plan, dar ceva a rămas neverificat; cererea însăși este nevalidă; s-a dovedit că nu există nicio soluție; căutarea a fost oprită la limită, fără nicio concluzie. Numai a patra îi dă voie aplicației să spună „nu se poate”.

**Native calculations.** There are two JavaScript responsibility families: generic SOPWorlds LIB mechanisms and concrete primitives/adapters. A geometry or text-generation algorithm can be a registered native calculation with typed inputs, purity, limits and output contracts. The semantic choice of which relation to achieve, what may change, which facts count as evidence and which candidate to prefer belongs to library processing of declared Worlds. Moving a domain-specific handler into LIB, or naming it in a wire, does not make that decision generic.

### 6.8.1 Planificarea semantică și funcțiile specializate

The library selects a compatible interpretation and elaborates its goals. A registered pure function can calculate candidates inside declared bounds. It cannot select a different semantic goal or mutate the live state during search. Its result goes through the same generic constraint checking and ranking as any other candidate. Only the final concrete effectful calls are dispatched to tools.

Tabelul funcțiilor trebuie citit ca un contract de intrare, rezultat și verificare. Un rezultat furnizat de o funcție nu este adevărat doar pentru că funcția l-a returnat; verificatorul îl compară cu cerința și starea relevantă.

The library selects the intended relation from request, knowledge and instance evidence. If the user did not specify a location, a declared ordinary-location rule may select the pond for fish. If the user explicitly requested the sky, that rule cannot override the request. A geometry function then searches inside the selected region and returns coordinates; it cannot change the destination because another region is easier. *(R67)*

| Funcția | Ce primește, ce dă și cum este verificată |
|---|---|
| `free_spot` (desen) | Primește regiunea sau relația aleasă de plan, mărimea lucrului și lucrurile de acolo. Dă un punct, sau eșecul „nu este loc”. Planul verifică punctul cu `test`-ul relației (R45). |
| `layout` (diagrame) | Primește nodurile și săgețile. Dă câte un punct pentru fiecare nod. Verificare: niciun nod peste altul. |
| `compose` (documente) | Primește partea de scris, lista afirmațiilor pe care cunoașterea le are despre subiect, lungimea cerută și punctul de ton. Dă textul și lista afirmațiilor folosite. |

`compose` nu inventează. Are voie să folosească numai afirmațiile primite și formule legate de partea scrisă (salutul, încheierea). Lungimea se verifică prin numărare. Afirmațiile folosite se verifică față de lista dată. Dacă lista este goală, se scriu numai formulele, iar răspunsul spune că despre subiect nu se știe nimic. Tonul se verifică prin măsurarea textului în spațiul de ton și compararea rezultatului cu regiunea cerută, under the measurement contract below. O măsurare încă necalibrată sau incertă rămâne marcată ca atare în rezultatul concret, fără să transforme această lipsă într-o limită a proiectului. *(R68)*

Măsurarea tonului este o funcție declarată care primește textul, profilul de limbă și versiunea spațiului și întoarce coordonatele estimate, dovezile textuale și incertitudinea. Axele pot descrie formalitatea, căldura și caracterul direct. Alegerea cuvintelor, formele de adresare, lungimea propozițiilor și marcatorii de atenuare sunt trăsături de intrare, nu definiții universale ale tonului: un text lung nu este automat formal. O funcție de măsurare, simbolică sau învățată, le combină conform unui model declarat și calibrat pe judecăți independente. Pentru fiecare axă cerută se compară valoarea cu regiunea țintă și toleranța ei; incertitudinea care traversează frontiera produce un rezultat nedeterminat, nu o reușită certă.

| Pasul verificării tonului | Rezultatul necesar |
|---|---|
| Extrage trăsături | Fragmentele textului și măsurile lor, cu versiunea extractorului. |
| Proiectează în spațiul de ton | Coordonate, intervale de incertitudine și versiunea modelului de măsurare. |
| Compară cu regiunea cerută | Apartenență verificată, abatere măsurată sau incertitudine ce cere o verificare suplimentară. |
| Revizuiește textul | Un candidat care păstrează afirmațiile și cerințele ferme; se măsoară din nou după schimbare. |

Conținutul provenit din alt document folosește tot o capabilitate declarată. Ea primește textul sursă și identificatorul versiunii, extrage afirmații legate de intervale din sursă și păstrează relațiile dintre ele, apoi compune rezultatul cerut. Verificarea caută atât afirmații adăugate fără suport, cât și omisiuni care schimbă sensul, precum pierderea unei negații sau a unei condiții. Cititorul de comenzi stabilește ce se cere documentului; extractorul de conținut stabilește ce spune documentul. Această separare permite proiectarea rezumării fără să pretindă că recunoașterea unei comenzi este deja înțelegerea textului sursă. Rezultatul concret cu suport insuficient rămâne propunere verificabilă, iar mecanismul lipsă intră în registrul de lucru.

Dacă planul cere ca peștele să fie în iaz, `free_spot` nu poate răspunde cu o poziție pe cer pentru că acolo a găsit loc. Poate returna un punct verificabil în regiunea permisă sau poate declara că nu a găsit o soluție. Distincția dintre căutare epuizată și imposibilitate demonstrată rămâne cea din secțiunea 8.5.

Pentru `compose`, verificarea afirmațiilor cere identificarea surselor, nu doar compararea unor cuvinte. Dacă această verificare nu este disponibilă pentru o proprietate, răspunsul trebuie limitat la proprietățile efectiv verificate. Lungimea măsurată a textului nu dovedește că tonul cerut a fost respectat și nici că afirmațiile sunt justificate.

### 6.8.2 Catalogul operațiilor generale

Un concept nou nu adaugă singur o putere nouă programului. Dacă autorul declară o culoare, sistemul o poate folosi fiindcă știe deja să compare valori și să verifice apartenența la o regiune. Dacă autorul scrie numele unei operații de recunoaștere a unei imagini, acel nume nu produce un recognoscător. Pentru a deosebi aceste situații trebuie fixat vocabularul de operații pe care declarațiile îl pot cere.

The following catalogue fixes the generic operations that declared methods can compose. An operation name has a defined argument and result contract; an unfamiliar name cannot introduce executable semantics. These are encapsulated mechanism contracts, not public JavaScript orchestration APIs or natural-language verbs. Applications submit requests to LIB; they do not call this catalogue step by step. For example, `make` denotes an act whose elaboration uses matching, validation, planning and concrete tool calls.

| Operația generală | Intrări și rezultat |
|---|---|
| `value` | Un operator scalar din lista `add`, `subtract`, `multiply`, `divide`, `min`, `max`, `equal`, `less`, `less.equal`, `and`, `or`, `not`, plus operanzi tipizați. Întoarce o valoare ori o eroare de tip/domeniu; nu modifică starea. |
| `collect` | O colecție finită, o selecție și una dintre operațiile `filter`, `project`, `distinct`, `join`, `count`, `sum`, `median`, `order`. Întoarce colecția, scalarul sau ordinea cerută, cu identitățile și sursele păstrate. |
| `match` | O stare identificată prin versiune, un model de fire și legături inițiale pentru variabile. Întoarce legături compatibile și firele care le susțin, plus dacă enumerarea este completă. |
| `traverse` | Un graf declarat, nodurile de pornire, direcția și etichetele admise ale muchiilor, limita de adâncime. Întoarce noduri și căi justificative; vizitele repetate nu deschid o buclă infinită. |
| `space` | Un spațiu declarat, valori compatibile și una dintre operațiile `contains`, `distance`, `step`, `convert`. Întoarce apartenență, distanță, valoare deplasată sau valoare convertită, conform axelor, metricii și conversiei declarate. |
| `derive` | O stare, reguli și un buget. Întoarce faptele derivate și proveniența lor, indicând dacă a atins punctul fix sau s-a oprit la buget. |
| `validate` | O stare sau o cerere, schema și constrângerile aplicabile. Întoarce încălcările, proprietățile neverificate și domeniul verificării; absența încălcărilor nu ascunde o verificare incompletă. |
| `fork` | O versiune de stare și un set propus de inserări, înlocuiri ori retrageri de fire, cu precondiții. Întoarce o stare izolată și diferența ei față de bază; nu apelează unelte. |
| `enumerate` | Variabile tipizate și domenii finite explicite ori generatoare declarate cu limită. Întoarce atribuiri candidate și informația dacă domeniul declarat a fost epuizat. |
| `rank` | Candidați verificați, criterii de cost declarate și o regulă explicită de departajare. Întoarce ordinea, costurile și egalitățile rămase; nu inventează un criteriu pentru „mai bine”. |
| `search` | Variabile, generatorul candidaților, constrângeri, obiectiv și buget. Întoarce candidați, justificarea verificărilor și una dintre încheierile căutării din secțiunea 6.8. |
| `plan` | O cerere situată, legarea țintelor, acte declarate, capabilități și starea de bază. Întoarce pași dependenți cu condiții înainte/după, efecte permise și sursele deciziilor, ori condițiile încă nerezolvate. |
| `call` | O funcție sau unealtă înregistrată, declarația contractului ei și argumente tipizate. Întoarce rezultatul și statutul apelului; verificarea efectului aparține lui `observe` și `validate`. |
| `observe` | Un adaptor declarat și domeniul de stare cerut. Întoarce fire observate, versiune și acoperire, sau o eroare explicită de citire. |
| `compare` | Două versiuni de stare și identitățile relevante. Întoarce aparițiile, disparițiile și valorile/relațiile schimbate, inclusiv diferențele din afara efectului permis. |
| `record` | Un eveniment și sursele lui, conform schemei jurnalului. Întoarce identitatea înregistrării persistate sau eșecul; nu rescrie evenimentele anterioare. |
| `realise` | Un cadru de limbă declarat, legături de roluri și afirmații justificate. Întoarce textul și legătura fragmentelor cu sursele; dacă lipsesc roluri obligatorii, raportează lipsa în loc să inventeze conținut. |

În această listă, `value` nu primește un fragment de program. Operatorul este unul dintre numele enumerate și are o aritate cunoscută. Împărțirea la zero este eroare, iar o comparație între valori cu unități incompatibile nu este falsă: trebuie întâi o conversie declarată. `collect` nu interpretează o funcție arbitrară scrisă în text; selecția și proiecția folosesc modele și expresii alcătuite din aceleași operații. O ordine cere cheile și sensurile de sortare; identitatea poate departaja numai dacă politica o declară, nu pentru a ascunde o ambiguitate semantică.

`match` caută corespondențe între un model și firele unei stări. Nu este recunoaștere liberă a sensului unei propoziții. Regulile de limbă pot folosi această operație asupra firelor care reprezintă cuvinte și roluri, dar regulile și vocabularul trebuie furnizate. În mod similar, `traverse` știe să urmeze muchii; faptul că o anumită muchie înseamnă „este un fel de” vine din schema grafului. Distanța între două feluri nu autorizează singură înlocuirea unui referent cu altul: alegerea are nevoie de politica de referire.

`space` este o familie închisă de cereri către spațiile definite în secțiunea 4.4. Apartenența verifică regiunea declarată; distanța folosește metrica și normalizarea ei; pasul folosește scara și sensul axei; conversia folosește transformarea declarată între repere sau unități compatibile. Un spațiu a cărui metrică nu se poate exprima cu operațiile existente cere o funcție înregistrată prin `call`. Fără ea, rezultatul este „operație nesuportată”, nu o distanță aleasă după numele spațiului.

`derive`, `validate` și `search` au obligații diferite. Deducția produce consecințe, verificarea caută încălcări și necunoscute, iar căutarea propune atribuiri. Un candidat găsit de căutare trece prin verificare pe un `fork`. Abia după aceasta poate deveni parte a planului. Nici deducția, nici încercarea unui candidat nu are voie să execute o unealtă cu efecte. O funcție pură poate participa la calcul; o funcție cu efecte este rezervată execuției autorizate a planului.

Catalogul nu ascunde o căutare infinită în `enumerate`. Pe un interval numeric continuu, un generator care încearcă puncte pe o grilă explorează numai acea grilă. Epuizarea ei dovedește cel mult că nu există candidat pe grila respectivă. Pentru o concluzie despre întregul interval trebuie un algoritm cu acel contract și o justificare a concluziei. `rank` nu transformă cel mai bun candidat încercat în optimul global.

`plan` compune acte folosind condițiile și politica de descompunere din secțiunea 4.6.1. Nu poate satisface orice precondiție prin inventarea unei acțiuni. `call` este singura trecere din catalog către un calcul sau un efect furnizat de gazdă; numele, tipurile argumentelor, puritatea și condițiile rezultatului trebuie declarate. În execuție se compun `observe`, `call`, `compare`, `validate` și `record`, cu regulile de recuperare din secțiunea 6.9. Anularea este un plan de compensare verificat prin aceleași operații, nu o ștergere a jurnalului.

The following example shows diferența dintre compunere și operație nouă. Într-un document, vrem ca o secțiune deja identificată să aibă cel mult 120 de cuvinte. Citirea stării oferă textul și versiunea lui; numărarea cuvintelor cere o segmentare declarată, apoi `collect` cu `count`. Limita este o cerință a cererii, nu limita permanentă a tipului secțiune. O propunere mai scurtă se verifică pe o copie izolată:

```sop
@source.limit std.request.source text="at most 120 words"
@request.limit std.request act=change mood=do source=$source.limit
@target.section std.request.target request=$request.limit mode=existing kind=section
@constraint.length std.request.constraint request=$request.limit target=$target.section concept=length operator=less.equal value=120 unit=word scope=each polarity=positive character=requirement source=$source.limit source.start=0 source.end=17
```

Aceste fire descriu ce se verifică, nu generează rezumatul. `target.section` trebuie legat separat la identitatea secțiunii alese. Operatorul `less.equal` compară numărul observat cu limita; metadatele conceptului stabilesc că lungimea se măsoară aici în cuvinte, prin segmentarea declarată. Dacă textul candidat are 117 cuvinte, condiția numerică este adevărată. Aceasta nu dovedește că sensul a fost păstrat: acea proprietate cere propriul contract și poate rămâne neverificată. Dacă nu există un compozitor capabil să propună textul, numărarea singură nu rezolvă cererea.

Cazul permite delimitarea concretă a extensiilor. O altă limită, de 90 de cuvinte, este o dată nouă. O regulă care verifică aceeași lungime numai pentru introduceri este o declarație nouă compusă din operațiile existente. Un nou algoritm care produce text sau măsoară o proprietate încă nesuportată cere o implementare de funcție, declarată și înregistrată; numirea ei într-un fir nu ajunge. Extinderea programului general însuși este necesară dacă apar valori, condiții sau efecte care nu pot fi reprezentate prin contractele catalogului. În acel caz se revizuiește explicit catalogul și se verifică din nou compatibilitatea declarațiilor.

## 6.9 Execuția

A plan is the concrete SOP circuit of tool calls produced by elaboration. The generic library dispatcher follows its dependencies, binds typed results to later arguments and submits each instruction through the declared binding. Tools implement those instructions; they neither execute the semantic plan nor complete a vague request. A call can use a newly created object’s typed output reference without knowing its eventual identifier in advance.

A primitive may fail and the user may edit the state between planning and dispatch. The **authoritative instance state** and the **candidate state** therefore have distinct roles. A candidate is isolated until validated and committed. A renderer reads the instance; it does not become the semantic authority merely because it draws pixels. For external or native-managed resources, a declared adapter supplies observations, version and coverage, and the library reconciles those observations with the instance. No tool may silently maintain a contradictory second semantic state.

După fiecare pas, starea este citită din nou și comparată cu condiția „după” a actului (secțiunea 4.6). Rezultatul unei execuții este unul din cinci: executat; executat în parte; desfăcut, adică s-a dat înapoi tot; efect necunoscut; desfacere eșuată. Ultimele două sunt rare, dar trebuie să aibă nume, fiindcă în ele aplicația nu are voie să spună nici „am făcut”, nici „nu am făcut”.

Pentru om, o cerere executată este un singur pas care se poate anula, oricâte unelte au pornit pentru ea. O reacție („bigger”) înlocuiește pasul pe care îl corectează, nu adaugă altul. O întrebare pusă de aplicație nu este un pas.

### 6.9.1 Consistența execuției și recuperarea după eșec

Un plan verificat descrie ce ar trebui să se întâmple pornind de la o anumită stare. Între verificare și execuție, starea poate fi schimbată de om sau de o altă operație. În plus, o unealtă poate eșua după ce a aplicat numai o parte din modificări. Execuția trebuie deci să urmărească atât versiunile citite, cât și efectele confirmate.

Independența semantică a operațiilor nu rezultă din simpla lor separare în apeluri. Două apeluri sunt dependente dacă împart o restricție sau o resursă, chiar când modifică identificatori diferiți.

Două părți ale unui plan sunt independente dacă nu citesc și nu scriu aceleași fire, dacă nicio interdicție nu se poate potrivi cu fire din amândouă și dacă nu ocupă aceeași resursă. Dacă una dintre aceste condiții nu poate fi dovedită, părțile sunt socotite dependente: se execută amândouă sau niciuna. *(R60)*

Starea este citită din nou chiar înainte de execuție. Dacă firele pe care planul le citește s-au schimbat de când a fost făcut, planul este refăcut o dată. Dacă s-au schimbat din nou, cererea este oprită și omului i se spune de ce. *(R61)*

La eșecul unui pas, pașii executați ai aceleiași părți sunt desfăcuți în ordine inversă, fiecare prin actul lui invers. O operație nu este încercată a doua oară decât dacă unealta o declară fără urmări la repetare. *(R62)*

Dacă desfacerea eșuează, starea este citită din nou și spusă omului așa cum este: ce a rămas făcut și ce nu. Aplicația nu pretinde nici că a făcut, nici că nu a făcut. *(R63)*

Tools exposed by the application trebuie să permită anularea. Contractul fiecărei operații include informația necesară refacerii stării dinainte și verificarea rezultatului anulării. Un eșec al anulării se raportează conform R63. O unealtă viitoare fără anulare are nevoie de o politică explicită; nu moștenește automat permisiunea de a executa. *(R64)*

Două ședințe nou create pentru aceeași persoană pot avea identificatori complet diferiți și totuși să fie dependente: interdicția suprapunerii le privește împreună. În schimb, două modificări fără date, reguli sau resurse comune pot fi tratate separat dacă această independență este demonstrată. Lipsa unei dovezi cere tratarea conservatoare ca operații dependente.

Recuperarea este o succesiune de operații observabile, nu o presupunere că apelul invers a reușit. După fiecare anulare se verifică efectul; la eșec se recitește starea. Reîncercarea unei operații cere garanția de idempotență, adică repetarea ei nu dublează efectul. Un răspuns pierdut după crearea unei ședințe nu autorizează crearea alteia identice.

### 6.9.2 Istoricul operațiilor, corectarea și anularea

Istoricul păstrează unitățile de lucru pe care omul le poate corecta sau anula. O reacție imediată precum „bigger” poate ajusta rezultatul tocmai creat, dar nu trebuie să rescrie retroactiv o stare pe care altcineva a modificat-o între timp. Diferența privește gruparea în istoric, nu existența unei cereri noi de modificare.

Tabelul cronologic arată când se înlocuiește ultimul pas și când se adaugă unul. Pentru fiecare pas trebuie păstrate starea anterioară, efectele și eventualele preferințe învățate, ca anularea să aibă un rezultat determinat.

O reacție înlocuiește un pas numai în două condiții: pasul este ultimul din istorie și lucrurile lui nu au fost schimbate de altcineva între timp. Altfel reacția este un pas nou. *(R65)*

| Ce se întâmplă, în ordine | Pașii din istorie |
|---|---|
| „draw a fish” | Pasul 1: un pește, mărimea 1,0. |
| „bigger” | Pasul 1 este înlocuit: un pește, mărimea 1,25. |
| omul trage peștele cu mâna | Pasul 2: mutarea, luată din starea observată. |
| „bigger” | Pasul 3: mărimea 1,56. Nu înlocuiește nimic, fiindcă ultimul pas nu este al aplicației. |

Anularea, de trei ori la rând, duce mărimea la 1,25, apoi peștele la locul dinainte, apoi șterge peștele. Ce s-a învățat într-un pas (R34) dispare odată cu el.

O schimbare făcută în alt domeniu este un pas al acelui domeniu. Anularea desface ultimul pas, oricare ar fi domeniul lui, și spune ce a desfăcut. *(R66)*

În exemplu, prima mărire este inclusă în pasul de creare. Anularea acelui pas elimină peștele, fiindcă aceasta este starea dinaintea întregii unități de lucru. Mutarea manuală întrerupe această continuitate: mărirea următoare devine un pas separat și anularea ei nu trebuie să mute peștele înapoi.

Ordinea globală a istoricului permite anularea ultimei acțiuni chiar dacă ea a fost făcută în alt domeniu. Răspunsul numește domeniul și efectul anulat pentru ca omul să poată verifica operația. Dacă starea observată nu mai permite restaurarea sigură, se aplică regulile de eșec; istoricul nu este o autorizație de a suprascrie schimbări intervenite.

## 6.10 Răspunsul

Ultima etapă compune ce i se spune omului. Greșeala la îndemână este să scrii propoziții gata făcute pentru fiecare situație: „I added a fish.”, „I could not add the fish.” Aceasta duce la sute de rânduri și, mai rău, la răspunsuri care spun ce ar fi trebuit să se întâmple, nu ce s-a întâmplat.

Aici răspunsul se compune din două surse care trebuie corelate și verificate: **diferența de stare**, adică ce este acum altfel față de dinainte, și **evidența execuției**, adică ce a reușit și ce nu. Fiecare act are o familie de **cadre de propoziție** generale, completate cu rolurile care s-au schimbat; variantele păstrează aceeași semnificație. Selecția, gruparea și realizarea lor sunt explicate în capitolul 13. Cuvintele pentru roluri, relații și regiuni vin din lumea limbii. Un domeniu nu scrie nicio propoziție.

| Partea răspunsului | De unde vine |
|---|---|
| ce s-a făcut | Din diferența de stare. „I moved the duck to the lake” se spune numai dacă rața este acum pe lac. |
| ce a presupus aplicația | Din sursa și caracterul fiecărei valori (secțiunea 6.6). Se spune numai ce contează pentru om. |
| ce s-a făcut altfel decât s-a cerut | Apropierile și realizările împrumutate (secțiunea 6.5), o singură dată. |
| ce nu s-a putut face | Fiecare cerință neîndeplinită, cu cuvintele omului și cu motivul. |
| ce nu s-a putut verifica | Verificările rămase nedeterminate (secțiunea 3.9). |
| ce nu s-a înțeles | Cuvintele necitite, așa cum le-a scris omul. |

Întrebările omului despre ce există se răspund din stare: „What is in the picture?”, „What does the diagram show?”, „What is on Friday?”. „What can you do here?” se răspunde din capabilitățile declarate. În răspuns, valorile sunt spuse cu numele celei mai apropiate regiuni: un pește este „red”, nu trei numere; o ședință este „long”, față de celelalte.

Fiecare valoare ține minte de unde vine; aceasta se numește **proveniență (provenance)** și din ea se poate răspunde la „de ce este peștele acolo?”. Ce nu poate fi rezolvat cu mecanismele existente se trece în **registrul cazurilor nerezolvate**, împreună cu conceptul sau mecanismul general care lipsește. Registrul este lista de lucru pentru partea generală, nu o listă de petice de scris.

### 6.10.1 Observarea efectelor și justificarea răspunsurilor

Răspunsul este concluzia unei verificări a cererii și a efectului, nu o reformulare a apelului trimis uneltei. „Am mutat” cere o schimbare observată; „era deja acolo” cere constatarea aceleiași condiții înaintea execuției. Dacă observația lipsește, niciunul dintre aceste răspunsuri nu este justificat.

Tabelul formelor de răspuns leagă formularea de dovezile disponibile. El nu este o listă de replici fixe pentru fiecare domeniu. Aceeași distincție între executat, deja satisfăcut, refuzat și necunoscut se aplică desenului, diagramei, documentului și calendarului.

Înaintea fiecărui pas se verifică dacă condiția „după” ține deja. Dacă da, unealta nu este pornită, iar răspunsul este „The duck is already on the lake.” *(R69)*

„Am făcut” se spune când sunt îndeplinite două lucruri: unealta a confirmat operația și diferența dintre starea citită chiar înainte și cea citită chiar după conține schimbarea cerută. *(R70)*

Formele de răspuns sunt cadrele celor patru acte și șapte forme generale. *(R71)*

| Forma | Când se folosește |
|---|---|
| deja așa | Condiția „după” ținea dinainte. |
| făcut în parte | Unele părți independente s-au făcut, altele nu; fiecare este numită. |
| refuz cu motiv | O interdicție tare, sau o cerință care nu se poate îndeplini. |
| interpretation with uncertainty | A reversible effect used a ranked referent or completion; state the chosen interpretation and retain alternatives and undo. |
| efect necunoscut | Vezi R63. |
| răspuns despre stare | „What is on Friday?” |
| explicație | „Why is the fish there?”, din proveniența valorilor. |

O confirmare tehnică a uneltei poate arăta că cererea a fost primită fără să dovedească rezultatul. Pentru „put the duck on the lake”, sistemul trebuie să regăsească rața și lacul în observația de după și să verifice relația cerută. Dacă poziția nu s-a schimbat și relația nu ținea înainte, mesajul „done” ar fi fals chiar dacă apelul a returnat succes.

Explicația ulterioară reconstruiește aceeași justificare: cerința, faptele citite, regula aplicată și observația finală. Ea trebuie să poată distinge un efect confirmat de o presupunere de planificare. Într-o execuție parțială numește separat părțile independente reușite și cele rămase, fără a prezenta întregul plan ca realizat.

---

## 6.11 Cum explică sistemul un răspuns

Regula este simplă: explicația se construiește din evidența păstrată în timpul lucrului. Nu se inventează după răspuns o poveste plauzibilă. Când omul întreabă „why?”, sistemul arată legătura dintre cererea lui, regulile aplicate și rezultatul observat.

O **urmă de justificare (justification trace)** este înregistrarea acestei legături. Fiecare pas numește intrările, operația, rezultatul și pasul care l-a cerut. O intrare este fie un fragment al cererii, fie un fapt identificat din starea citită, fie o declarație dintr-o versiune fixată a cunoașterii. O concluzie derivată trimite la regula și intrările ei. O observație a uneltei poartă identitatea operației și versiunea stării observate.

The justification trace is facts in a schema-validated session World, with explicit links to requests, premises, rules, calculations, calls and observations. It is not only a temporary response object or an animation event. These facts describe interpretation and execution, not drawn objects or calendar events.

Persistence is explicit. Saving a project can include its trace World, preserving request and step identities. Loading that saved trace permits questions about earlier actions. A session without a saved trace makes no such promise: if history has been cleared or was not loaded, the library reports that the justification is unavailable rather than reconstructing an invented historical explanation.

Fiecare răspuns păstrează identificatorul cererii și al pasului care îl justifică. „Why?” se leagă de ultimul răspuns relevant din contextul conversației; o întrebare explicită despre o acțiune mai veche selectează răspunsul acelei acțiuni. If several historical actions match, the library ranks them using conversational context, identifies the selected action in its explanation and retains the alternatives. El nu înlocuiește explicația unei acțiuni vechi cu justificarea stării curente numai pentru că aceasta este mai ușor de obținut.

| Date păstrate în jurnal | Rol în explicație |
|---|---|
| Cerere și răspuns | Identitatea mesajului, formularea primită, cererea structurată și rezultatul comunicat. |
| Pas de evaluare | Operația și versiunea ei, intrările, rezultatul și legătura cu cererea. |
| Intrare istorică | Identitatea sursei, versiunea citită și valorile exacte consumate de pas. |
| Dependență | Legătura dintre un pas și pașii sau intrările pe care se sprijină. |
| Observație de execuție | Identitatea apelului, confirmarea uneltei, starea observată înainte și după, verificarea efectului. |
| Anulare | Pasul vizat, efectele restaurate și rezultatul observat al restaurării. |

Intrarea istorică este o copie a valorilor folosite, nu o referință activă care ar citi mereu ultima versiune a faptului. Dacă o ședință este modificată ulterior, explicația refuzului anterior continuă să arate intervalul citit atunci. Identitatea sursei este păstrată ca valoare de proveniență; referințele dintre faptele jurnalului leagă numai înregistrări existente în acel jurnal. Această separare este aceeași cu cea dintre sursa activă și proveniența unui instantaneu din secțiunea 2.6.2.

Anularea schimbă starea domeniului și retrage preferințele învățate de pas, dar nu șterge dovada că pasul a avut loc. Jurnalul primește o înregistrare nouă de anulare, legată de operația inițială. Astfel, „why did you move it?” poate primi o explicație istorică urmată de precizarea că mutarea a fost anulată. O anulare eșuată înregistrează efectul rămas observat. Păstrarea istoricului nu autorizează refolosirea unei concluzii anulate drept fapt curent.

The `std.trace` schema distinguishes request, input, step, observation, reply, undo and correction. The following records express structural links. They are not sufficient evidence of the geometric relation: that requires the relevant geometry and a recorded relation check.

```sop
@req1 std.trace.request message="put the duck on the lake"
@input1 std.trace.input source="drawing-instance/duck1" version="state-17" source.type=drawn key=at values="[\"120,540\"]"
@step1 std.trace.step request=$req1 act=place operation=move operation.version=1 invocation=call.move.1 status=confirmed input=$input1
@before1 std.trace.observation step=$step1 invocation=call.move.1 phase=before input=$input1
@input2 std.trace.input source="drawing-instance/duck1" version="state-18" source.type=drawn key=at values="[\"200,300\"]"
@after1 std.trace.observation step=$step1 invocation=call.move.1 phase=after input=$input2
@reply1 std.trace.reply request=$req1 step=$step1 text="I moved the duck onto the lake."
@undo.request std.trace.request message="undo that"
@undo.step std.trace.step request=$undo.request operation=restore operation.version=1 invocation=call.undo.1 status=confirmed input=$input2 depends=$step1
@input3 std.trace.input source="drawing-instance/duck1" version="state-19" source.type=drawn key=at values="[\"120,540\"]"
@undo.after std.trace.observation step=$undo.step invocation=call.undo.1 phase=after input=$input3
@undo1 std.trace.undo target=$step1 execution=$undo.step observation=$undo.after
```

`req1` identifică mesajul, iar `input1` fixează o valoare citită din starea 17. `source` este aici o valoare istorică explicită, nu o referință `$` către un obiect care ar trebui să existe pentru totdeauna. `step1` distinge actul semantic `place` de operația uneltei `move`; împreună cu `reply1`, folosește referințe reale către înregistrările jurnalului. `undo1` distinge pasul anulat (`target`) de pasul care execută restaurarea (`execution`). Observația anulării aparține celui de-al doilea și poartă identitatea noului apel; versiunea stării restaurate este păstrată în intrarea sa. Intrarea păstrează tipul sursei în `source.type`, cheia citită și o listă JSON de tokenuri SOP în `values`. Lista păstrează ordinea și repetițiile; tokenul numeric `12`, textul `"12"` și referința istorică `$obiect` rămân categorii diferite. Referințele din listă sunt date istorice, nu legături care cer existența obiectului în starea curentă. `values=[]` înregistrează că citirea nu a găsit valori pentru acea cheie; nu dovedește închiderea întregii lumi. Variabilele și fragmentele care introduc alte chei sau fire sunt refuzate. Forma canonică normalizează escaparea textelor, nu scrierea numerică: `1` și `1.0` își păstrează tokenurile originale. Valoarea `120,540` rămâne aici un token, fără validare geometrică. Trace immutability and project saving are separate obligations of the journal and persistence mechanisms; loading a record alone supplies neither. Fragmentul păstrează pozițiile observate, dar omite geometria lacului și verificarea relației. Încărcarea sa nu autorizează textul răspunsului: singur, `status=confirmed` nu este o dovadă suficientă. Verificarea efectului și a afirmației comunicate rămâne responsabilitatea evaluatorului de dovezi.

Un pas își numește operația, versiunea implementării și identitatea apelului. Statutul descrie pasul individual: planificat, confirmat, refuzat, necunoscut sau parțial. Pentru un pas încă planificat, identitatea este rezervată înaintea apelului; existența sa nu înseamnă că unealta a fost pornită. Aceste statute nu înlocuiesc rezultatele întregului plan din secțiunea 6.9. Observația conține cel puțin o intrare istorică, iar fiecare intrare își păstrează propria versiune: nu presupunem că două surse independente au același contor de versiuni.

Legăturile `depends` pot trimite la pași din cereri anterioare, dar nu formează cicluri. Un răspuns poate numi numai pași ai propriei cereri; o întrebare de clarificare poate să nu aibă niciun pas. O corecție leagă `target` de `replacement`, eventual dintr-o cerere nouă. Această legătură înregistrează succesiunea acceptată a istoriei, nu alternative propuse: fiecare pas are cel mult un înlocuitor direct, fără cicluri. O nouă corecție continuă de la înlocuitorul curent. Condițiile de timp și concurență din secțiunea 6.9.2 trebuie verificate separat înainte de a accepta corecția.

Autorul tiparului declară regulile; motorul înregistrează potrivirile și calculele; unealta raportează efectele observate. Componenta de răspuns selectează din această urmă pașii necesari explicației și le exprimă sensul în cuvinte. Ea nu este autorizată să adauge o cauză pentru care nu există un pas înregistrat.

| Răspuns | Ce trebuie să explice „de ce?” |
|---|---|
| executat | Cerința, operația confirmată, diferența relevantă și verificarea condiției finale. |
| refuzat | Constrângerea încălcată, faptele care o declanșează și calculul; la date lipsă spune ce nu a putut verifica. |
| întrebare | Ambiguitatea sau valoarea lipsă, candidații cunoscuți și de ce alegerea nu este justificată. |
| presupunere | Valoarea omisă de om, sursa valorii completate și motivul pentru care acea sursă se aplică. |
| adaptare | Valoarea cerută, valoarea realizată, distanța, toleranța și regula care permite abaterea. |

Urmărim exemplul calendarului. Pentru claritate, numerele sunt minute față de începutul zilei fixate în exemplu, o reprezentare de calcul, nu formatul de stocare al momentelor absolute. Ana este ocupată între 600 și 660. Noua cerere are începutul 630 și durata 30. Înregistrarea calculului este următoarea; tabelul descrie conținutul faptelor jurnalului; numele coloanelor nu sunt chei SOP suplimentare.

| Pas | Evidență înregistrată |
|---|---|
| intrare | Cererea spune 10:30 și 30 minute; participantul se rezolvă la identitatea Anei. |
| fapt | Rezervarea existentă, la versiunea citită, are același participant și intervalul [600,660). |
| calcul | Sfârșitul cerut este 630 + 30 = 660. |
| regulă | Două intervale ale aceluiași participant nu se suprapun; 630 < 660 și 600 < 660 sunt ambele adevărate. |
| rezultat | Cererea exactă este refuzată; nu a fost executată nicio operație. |

The explanation is: “Ana already has a meeting from 10:00 to 11:00. Your 30-minute meeting at 10:30 overlaps it, so I did not schedule it.” Each claim names its evidence. If two people are named Ana, the library ranks them before checking availability and records the selected identity. For example, accepted focus may select Ana Ionescu; the response then names that interpretation and retains the other Ana as an alternative. An arbitrary person must not be substituted merely because that person is free.

În desen, urmărim „put the duck on the lake”. Presupunem că rața și lacul există, că referințele sunt univoce și că relația cerută nu este deja satisfăcută. Fiecare rând de mai jos trebuie să aibă un corespondent în urma aceleiași cereri; un rezultat din altă cerere nu poate completa o dovadă lipsă.

| Pas | Evidență înregistrată |
|---|---|
| cerere | Actul `place`, obiectul cerut și ținta, legate de fragmentele mesajului. |
| referenți | Identitățile `duck1` și `lake1`, împreună cu versiunea desenului în care au fost găsite. |
| condiție | Relația `on` trebuie să țină între cele două obiecte; testul ei în starea inițială este fals. |
| plan | Poziția propusă, testul geometric care o validează și operația care o poate realiza. |
| apel | Identitatea apelului și confirmarea uneltei pentru mutarea acelei rațe. |
| observație | Poziția raței înainte și după apel, din citirea efectivă a desenului. |
| verificare | Testul declarat pentru `on` este adevărat pe observația de după; diferența față de starea inițială conține mutarea cerută. |
| răspuns | „I moved the duck onto the lake.”, legat de apel și de verificarea efectului. |

Dacă unealta confirmă, dar observația nu arată relația, ultimul rând nu este permis. Dacă relația era deja adevărată înainte, planul nu mută rața și răspunsul spune că ea era deja pe lac. Explicația trebuie să arate această diferență, nu doar faptul că o funcție a fost apelată.

Reutilizarea unei imagini cere o justificare separată de justificarea mutării. Tabelul compară două explicații care pot produce același desen, dar se bazează pe cunoaștere diferită.

| Explicație | Ce permite verificarea ei |
|---|---|
| „There is no duck image; duck is a kind of bird, and bird is the nearest ancestor with an available image.” | Numește relația de specializare, realizarea disponibilă și regula generală de căutare pe strămoși. Aceeași regulă poate fi aplicată altor feluri. |
| „Ducks are drawn as birds.” | Nu arată dacă s-a aplicat moștenirea sau doar un rând scris pentru această cerere. Fără sursele și regula generală, explicația nu demonstrează reutilizarea. |

Criteriul nu interzice faptele specifice: faptul că rața este pasăre și identitatea raței cerute sunt intrări legitime. Verificarea urmărește dacă decizia de realizare vine dintr-o regulă generală aplicată acelor intrări sau dintr-o asociere particulară între cerere și răspuns. O explicație scurtă poate omite detalii pentru lizibilitate, dar desfășurarea ei trebuie să le poată furniza.

În diagramă, pentru o distanță minimă de 12 unități ale paginii, explicația poate spune „The nodes were 8 units apart; the layout moved them to 14, satisfying the minimum of 12.” Urma trebuie să conțină măsurările și limita. Nu poate afirma „best layout” fără o dovadă de optimizare.

În document, presupunem cererea „write a letter about the meeting”, fără lungime specificată. Exemplul folosește o declarație ilustrativă care dă lungimea obișnuită de 180 de cuvinte pentru genul scrisorii. Numărul nu este o constantă a programului și nu devine o cerință exactă a omului.

| Pas | Evidență înregistrată |
|---|---|
| cerere | Genul scrisorii și subiectul; nicio cerință de lungime în mesaj. |
| surse preferate | Nu există o valoare contextuală sau o preferință a omului aplicabilă, potrivit ordinii din secțiunea 4.5. |
| cunoaștere | Identitatea și versiunea declarației de lungime obișnuită: 180 de cuvinte pentru acel gen. |
| aplicabilitate | Genul cerut coincide cu genul declarației sau este o specializare care nu o înlocuiește cu altă valoare. |
| alegere | 180 de cuvinte este ținta presupusă a planului, marcată ca presupunere și legată de sursă. |
| explicație | „You did not specify a length; I used the declared usual length of 180 words for this kind of letter.” |

Acest traseu explică alegerea unei ținte, nu dovedește că textul final are 180 de cuvinte. După compunere, lungimea efectivă trebuie măsurată și comparată cu toleranța permisă. Dacă sursa obișnuită lipsește, sistemul nu poate produce aceeași explicație; it must use another justified source, state its assumption and uncertainty, or report that no compatible completion is available. Pentru ton, lipsa unei verificări nu poate fi ascunsă prin „I made it formal”: se explică numai transformarea și proprietățile efectiv verificate.

Pentru toate domeniile, explicația scurtă poate fi desfășurată în pașii ei, cu identitățile și versiunile reale. Numele de reguli dintr-un exemplu al cărții nu sunt dovezi dintr-o execuție. Dacă urma s-a pierdut, răspunsul corect este că justificarea nu mai este disponibilă, nu o reconstrucție prezentată ca certitudine.

### 6.11.1 Mesaje despre conversație și referințe la istoric

A conversational reference must link a retained request target to its historical subject and the corresponding canonical membership evidence. Request, step, invocation, host context and population snapshot identities are distinct. A justified historical reference can survive object removal, but it does not authorize modifying a newly created object that reuses a display label. Before a new edit, the library resolves the current identity and version again.

Jurnalul este o lume de fapte și poate fi interogat prin aceleași modele, referințe și surse ca celelalte lumi. Un mesaj despre conversație poate desemna o cerere, un rezultat sau o afirmație anterioară. Reutilizarea privește reprezentarea și accesul la dovezi; nu dă voie ca ștergerea unui fir din jurnal să fie confundată cu anularea efectului lui în aplicație. O corectare se înregistrează ca eveniment nou și verifică separat starea observabilă.

| Intenția mesajului | Date consultate și efect permis |
|---|---|
| Explicație sau obiecție la o afirmație | Pasul și dovezile care au produs afirmația; explică justificarea sau corectează afirmația nefondată. |
| Raport despre o nepotrivire a stării | Afirmația omului, ultima observație și o citire nouă; păstrează diferența dintre ce spune omul și ce poate confirma adaptorul. |
| Corectarea cererii anterioare | Cererea și rolul schimbat; reconstruiește planul pentru efectul corectat, respectând condițiile de istoric și concurență din secțiunea 6.9.2. |
| Restaurarea unei valori trecute | Identitatea obiectului, proprietatea și valoarea istorică justificată; face o schimbare nouă numai asupra acelei proprietăți. |
| Întrebare despre cunoaștere | Faptele relevante și sursele lor; răspunde cu ce este susținut sau spune că informația lipsește. |
| Nemulțumire fără corecție determinată | Ultima cerere și rezultatul; spune ce a înțeles și ce rămâne neclar, fără modificarea stării doar pentru a produce un efect. |

Într-un calendar, „put the title back” poate restaura titlul anterior al unei ședințe, păstrând o schimbare mai recentă a orei. Acesta este un nou act `change`, nu anularea tuturor operațiilor care au urmat titlului. Dacă istoricul nu conține titlul vechi, sistemul nu îl reconstruiește dintr-o presupunere.

Un raport că rezultatul nu se vede nu autorizează automat repetarea operației. Dacă recitirea confirmă obiectul, problema poate fi de vizibilitate sau de întârziere a adaptorului; dacă citirea este incompletă, efectul rămâne necunoscut. Sistemul corectează ce poate justifica și nu creează o copie pentru a face să dispară contradicția din dialog. La fel, o obiecție care conține o corecție explicită trebuie separată în afirmația despre trecut și cerința nouă.

# 7. Application areas and their declared interfaces

The examples use five application areas: Drawing, Diagram (including charts), Documents, Calendar and Avatar. This is an open set of consumers of one library. A new area contributes schemas, knowledge, live instance Worlds and typed tool bindings; it does not contribute another natural-language interpreter or hidden planner.

For every example distinguish the reader's request, the declarations consulted by LIB, the concrete circuit of tool calls, and the observed effect. Schema relationships alone do not define a tool interface: parameters, outputs, units, references, preconditions and observations must also be declared. The domain sketches below use explanatory pseudocode, not additional SOP syntax.

## 7.1 Desenul

```text
Pseudocode — model responsibilities, not SOP declarations
Drawing World: page contains drawable objects.
Drawable object: identity, kind, position, parent/group, size, colour, optional label.
Knowledge: editable representations, part roles, placement and style policies.
Tools: create concrete geometry, move, set supplied properties, remove, observe.
```

The drawing model separates the page, objects and groups. Position is not identical to a relationship such as “on the lake”: the library must derive coordinates from that relation using geometry and applicable knowledge. A free-position calculator returns candidates under a declared contract; it cannot decide by itself which object or region the user intended.

Representations belong in knowledge: a house can be a group of editable polygons, rectangles and text, rather than an opaque picture. A declared inheritance method may reuse an ancestor's representation while retaining the requested kind and recording the approximation. The drawing primitive receives concrete geometry. It does not choose the ancestor or decide where a house belongs.

| Omul spune | Ce se întâmplă și din ce decurge |
|---|---|
| „draw a landscape with water, ground, sky, clouds, sun, two different houses” | Un întreg cu părțile numite de om (secțiunea 6.7). „Different” cere ca însușirile celor două case să fie depărtate în spațiile lor (secțiunea 4.4). Fiecare parte ajunge în regiunea paginii pe care o dă cunoașterea. |
| „put a duck” | „Put” fără un lucru existent înseamnă „a face” și apoi „a așeza” (secțiunea 4.6). Rața este desenată cu imaginea păsării, dacă nu are una, și rămâne rață (secțiunea 5.2). Locul, pe apă, vine din cunoaștere (secțiunea 6.8). |
| „on the lake” | Un fragment care dă locul (secțiunea 6.4). |
| „move the house down”, apoi „down” | Un pas pe axa verticală (secțiunea 4.7). Al doilea mesaj este un fragment care repetă pasul, cu același lucru (secțiunea 6.4). |
| „put a child on the swing” | Copilul nu există: întâi „fă”, apoi „așază” (secțiunea 4.6). |
| „arrange everything more naturally” | Operația „așază mai bine” asupra întregii pagini (secțiunea 6.7). |
| „random colours for the petals” | O alegere variată în spațiul culorilor, pentru părțile „petal” ale florilor (secțiunile 6.6 și 6.7). |
| „what is in the picture?” | Se răspunde din stare, cu numele regiunilor (secțiunea 6.10). |

## 7.2 Diagramele, cu graficele ca fel de diagramă

```text
Pseudocode — model responsibilities, not SOP declarations
Diagram World: diagram contains nodes, links and groups.
Node: identity, optional label, shape, colour, position, optional data value.
Link: identity, source node, destination node, optional label and geometry.
Group: member references, layout choice and constraints.
Tools: create/update nodes and links, group/ungroup, apply concrete positions, observe.
```

The diagram model gives nodes, links and groups independent identities. An arrow's endpoints are references to the selected nodes; its label is editable content. Grouping preserves member identities and adds group properties. A layout request changes only the resolved group's coordinates according to declared constraints; a tool receives those concrete positions, not “make it nicer”.

**Charts are diagram groups.** A chart groups typed data items and declares how values map to geometry. Changing bars to a line changes the group's layout while retaining data identities. LIB instantiates declared methods for axes, labels and positions; tools create or change concrete nodes and links. A new chart family using the same primitives requires declarations, not an application branch on its name. A new rendering primitive requires a documented tool extension.

| Omul spune | Ce se întâmplă și din ce decurge |
|---|---|
| „make a flowchart with six steps, no circles” | Șase noduri legate (secțiunea 6.7). Forma fiecăruia este aleasă în afara regiunii „circle” (secțiunea 4.4). Începutul și sfârșitul au forma dată de cunoaștere. |
| „fewer” | O reacție (secțiunea 6.4). Mai puține noduri; fluxul rămâne legat (secțiunea 6.7). |
| „make the second one red” | Lucrul este găsit după ordine (secțiunea 6.4); se schimbă o însușire (secțiunea 4.6). |
| „connect them all” | Operația „leagă tot” (secțiunea 6.7). |
| „make it nicer” | Operația „așază mai bine”: mai puține încrucișări, distanțe egale (secțiunea 6.7). |
| „a bar chart of meetings per person” | Un grafic. Valorile vin din calendar, prin compunerea lumilor (secțiunea 5.3). |
| „rounder boxes” | Un pas pe axa rotunjimii, în spațiul formelor (secțiunea 4.4). |

## 7.3 Documentele

```text
Pseudocode — model responsibilities, not SOP declarations
Document World: document contains ordered sections with optional parent sections.
Document: identity, title, genre and source material.
Section: identity, parent, role, order and text.
Knowledge: genre composition, length and tone policies.
Tools: create/update/remove/reorder concrete sections; compose under typed requirements; observe.
```

The document model distinguishes the whole document from ordered, optionally nested sections. A chapter and a subchapter share the section mechanism with different parent references. Moving a section changes its ordering relation; editing its label does not rename its persistent identity or replace its content.

Genres, mandatory and optional parts, and defaults belong in knowledge Worlds. For “add a chapter called Results”, LIB resolves the document, creates a section goal with that parent and title, derives order from the declared insertion policy, and emits a section-creation call. Composition additionally requires concrete source material, topic, section role, target length and tone parameters. The composition primitive produces text under that contract; it does not choose the document or invent facts about a meeting.

| Omul spune | Ce se întâmplă și din ce decurge |
|---|---|
| „write a short formal letter about a late delivery” | O scrisoare cu părțile ei (secțiunea 6.7). „Short” se judecă față de lungimea obișnuită a scrisorilor (secțiunea 4.5). „Formal” este o regiune în spațiul tonului (secțiunea 4.4). |
| „longer” | O reacție: un pas pe axa lungimii; părțile se păstrează (secțiunile 6.4 și 6.7). |
| „move the apology before the explanation” | Schimbarea unei relații de ordine între două părți (secțiunile 4.6 și 4.7). |
| „a story about a fox, in three chapters” | Cantitatea este a părților „chapter” (secțiunea 6.7). Dacă despre vulpi cunoașterea are prea puțin, se spune cât s-a putut scrie (secțiunea 6.6). |
| „warmer” | Un pas pe axa căldurii, în spațiul tonului (secțiunea 4.4). |
| „what is in the document?” | Se răspunde din stare: genul, titlul, părțile (secțiunea 6.10). |

## 7.4 Calendarul

The simplest calendar profile has one live calendar and editable events. Event creation needs a resolved title, start, duration and calendar identity. Participants and rooms are optional extensions, not mandatory complications of every calendar UI. The sketch below illustrates the room extension because it makes shared-resource constraints explicit.

```text
Pseudocode — model responsibilities, not SOP declarations
Calendar World: calendar contains events and optional resources.
Event: identity, title, absolute start, duration, optional participant/resource references.
Optional room: identity and capacity.
Knowledge: working regions, ordinary durations, overlap policy and scheduling objective.
Tools: create/update/remove the supplied event; observe events with coverage and version.
```

The optional participant/resource model links events to existing identities and describes room capacity. A participant label is not a participant reference. LIB resolves the live identity before scheduling; the event primitive receives that identity together with concrete times and content.

Overlap policy is separate from the data model. Observations may contain existing overlaps; representing that conflict must remain possible. A planning constraint can reject introducing an overlap, while another declared policy can permit it and report it. The tool validates structural integrity and applies the supplied mutation; it does not secretly choose an event to move or impose its own scheduling preferences.

Scheduling and spatial placement share a search pattern: enumerate candidates in a declared region, measure them, reject hard-constraint violations and rank the remainder by a declared objective. Measurements differ: interval intersection for time, geometric containment or distance for a page. Reuse concerns this mechanism and its contracts; minutes and page coordinates retain distinct units and semantics.

| Omul spune | Ce se întâmplă și din ce decurge |
|---|---|
| „a long meeting with Ana tomorrow afternoon” | „Long” se judecă față de ședințele din acest calendar (secțiunea 4.5). „Afternoon” este o regiune pe axa orelor (secțiunea 4.7). Ora exactă este cea mai apropiată liberă pentru Ana (secțiunea 6.8). |
| „later” | O reacție: un pas pe axa timpului. Dacă noul interval se suprapune cu altceva, se alege cel mai apropiat liber (secțiunile 6.4 și 4.4). |
| „in the big room” | Un fragment care dă locul. „Big” se judecă față de sălile care există (secțiunile 6.4 și 4.5). |
| „with Tom too” | Un fragment care adaugă un participant. Se verifică și timpul lui Tom (secțiunile 6.4 și 3.9). |
| “a meeting with Ana at ten thirty”, when Ana is busy | Preserve explicit 10:30. If overlap is allowed, create it and report the conflict. If overlap is forbidden, explain that constraint and retain the nearest feasible time as a proposal; do not silently substitute it. |
| „move everything on Friday to Monday” | Toate ședințele din regiunea „Friday”. Rezolvitorul le găsește ore fără suprapuneri (secțiunea 5.4). |
| „who is in the review?” | Întrebarea generală a rolului de participant, răspunsă din stare (secțiunea 6.10). |
| „what is on Friday?” | Se răspunde din stare (secțiunea 6.10). |

### 7.4.1 Aplicarea contractelor într-un scenariu de calendar

A complete scenario connects request representation, declared policies, candidate verification and observed effect. The model sketches identify responsibilities, while executable examples must declare their schemas and all required tool parameters. Reading the sketch alone does not create a capability.

The following independent cases use one explicitly fixed initial calendar. An undo case continues its named creation; other rows do not silently inherit effects from one another.

A complete domain supplies imports, schema types, applicable knowledge, tool signatures and bindings, observation interfaces and any registered mechanical functions. The dependency table identifies the semantic content that those declarations must provide.

| Domeniul | De ce depinde |
|---|---|
| desen | Lumea legendelor; arborele felurilor; regiunile de culoare și de mărime; părțile scenelor; cuvintele engleze. |
| diagrame | Lumea legendelor; regiunile de formă și de culoare; grafurile felurilor de diagrame. |
| documente | Lumea legendelor; grafurile genurilor; regiunile de ton; afirmațiile despre subiecte. |
| calendar | Lumea legendelor; tiparul persoanelor; regiunile zilei; unitățile de timp. |

A concrete example fixes a local day and time zone. The calendar contains `m1`, Review, 10:00–11:00. Knowledge declares an ordinary duration of 30 minutes, a working region 09:00–17:00 and an earliest-free-slot preference; policy forbids introducing overlaps. These are illustrative World facts, not JavaScript defaults. Each row starts independently unless it explicitly continues another.

| Request | Elaboration by LIB | Concrete effect and evidence |
|---|---|---|
| “Add Review preparation on Monday at 14:00” | Resolve Monday and zone; retain explicit 14:00; fill duration 30 from applicable knowledge; verify [14:00,14:30). | Emit an event-creation instruction with calendar, title, start and duration. Observe the returned event identity and values. |
| “Add Review preparation on Monday” | Search complete occupancy within the working region using ordinary duration and earliest-slot preference. | Create at 09:00 if free. Say “Added it at 09:00 for 30 minutes; I used the first free working slot.” Retain undo. Missing time does not automatically require a question. |
| “Move Review to Tuesday”, with two matching events | Rank identities by explicit selection, conversation binding and declared relevance; preserve both alternatives. | With a usable best candidate and reversible move, move that event and name the assumption. The tool never resolves “Review”. |
| “Add Review preparation on Monday at 10:30” | [10:30,11:00) intersects `m1`; explicit time conflicts with the hard no-overlap policy. | Do not silently rewrite 10:30 to 11:00. Explain the conflict and retain 11:00 as the nearest feasible proposal. |
| “Undo” after the first row | Resolve that invocation and created identity; compare current state against its observed result. | Delete only that event if the compensation precondition holds; reread. Independent edits and `m1` remain. |

Tool arguments contain no unresolved “Monday”, “usual” or “earliest”. They contain absolute time with its resolved interpretation, duration and unit, references and typed content. A later call may consume the earlier creation result: a new ID need not be predicted before creation. Binding returned IDs is generic dataflow, not semantic interpretation by the tool.

## 7.5 Ce are voie să fie program și cum știm că nu ne păcălim

Toată construcția are rost numai dacă programul unui domeniu rămâne mic și nu ia, pe ascuns, hotărâri care trebuiau declarate. Altfel am avea declarații frumoase și, lângă ele, program care face de fapt treaba, pentru fiecare caz în parte.

There are two JavaScript responsibility families. SOPWorlds LIB implements generic parsing, matching, inference, search, elaboration, validation and dispatch. Tools and adapters perform typed effects, observe state and calculate documented mechanical functions. Application-specific choices—referents, default colours, scheduling preferences, layout policy—are declarations interpreted by LIB. Moving such choices into a callback, or naming that callback in SOP, does not make them general.

| Ce nu are voie să facă programul unui domeniu | De ce |
|---|---|
| să citească propoziția omului | A tool receives typed concrete values and references; the reader and LIB handle language and semantic elaboration. |
| să țină cuvinte, sinonime sau liste de valori | Acestea sunt nume de regiuni și stau în cunoaștere. |
| să aleagă cantitatea, felul, forma, locul, ora | LIB derives choices from the request and Worlds and records them in the resulting call circuit. |
| să țină valori obișnuite | Sunt regiuni, în cunoaștere. |
| să scrie propoziții de răspuns sau întrebări | Vin din cadrele actelor și din concepte. |

Și o declarație poate fi un petic. Un rând scris pentru un lucru anume („rața se desenează cu imaginea păsării”), când un rând mai general îl putea purta („un fel fără imagine o folosește pe a strămoșului”), este tot o cârpeală, numai că scrisă în fire. Asemenea rânduri sunt refuzate la verificare.

**Cum măsurăm.** Măsurile de mai jos sunt alese ca să nu poată fi îndeplinite prin cârpeli.

| Măsura | Ce arată |
|---|---|
| sesiunile reale ale omului | Mesajele scrise de om în aplicație, rulate din nou. Fiecare este socotit corect, parțial, refuzat cu motiv sau greșit. Verificarea afirmă ce a vrut omul și ce nu avea voie să se schimbe. Report correct effects, wrong effects, undo success and unresolved requests separately. Small reversible interpretation mistakes are measured and corrected; zero observed errors is not a refusal-first policy. |
| numărul declarațiilor particulare | Liste de cuvinte, propoziții de răspuns, realizări scrise pe un fel, valori obișnuite pentru un singur lucru. Trebuie să scadă spre zero. |
| ce trece neschimbat de la un domeniu la altul | Limba, conceptele, spațiile, actele, cadrele de răspuns, completarea, verificarea. |
| costul calendarului | Câte rânduri de declarații, câte linii de unelte și câte ore a cerut, fără nicio schimbare în partea generală. |
| perechi minimale și propoziții nevăzute | Cât de bine este citită o propoziție care nu a fost folosită la construire. |

## 7.6 Avatar: composition of editable properties

An avatar is a live instance with addressable hair, eyes, mouth, accessories and geometry. Person and robot templates are property-bearing compositions from knowledge. The UI and language path address the same part identities and tools.

For “make the avatar happier”, the reader retains an expression degree change. Knowledge must relate expression measures to editable features. In an invented numerical example, observed smile is 0.2, a declared step is 0.1 and a declared feature mapping is `mouth.curvature = 2 × smile`. LIB derives smile 0.3 and curvature 0.6, validates a candidate and emits a change of the resolved mouth part. The tool receives the part reference and 0.6; it never receives “happy”. These numbers illustrate a mapping, not a universal psychological definition.

Observation confirms the mouth property, not that every viewer perceives happiness. A separate expression evaluator can support that interpretation with a measurement and uncertainty. “Give it a hat” instead expands a composition with a hat part, attachment relations and defaults. Direct UI resizing already supplies the part reference and concrete values and uses the same tool interface without semantic replanning.

---

# 8. De la declarații la un rezultat: exemple de integrare

These examples follow a concrete request through schema resolution, inference, candidate search, tool-call construction and observation. Accepting a candidate in a trial World remains distinct from observing an actual tool effect.

## 8.1 Ce trebuie să știe programul general

Catalogul închis al operațiilor generale, intrările, rezultatele și limita dintre o declarație nouă și o implementare nouă sunt definite în secțiunea 6.8.2, lângă mecanismele de raționament. Exemplul de mai jos aplică această delimitare unui spațiu geometric.

## 8.2 Introducerea unui spațiu: distanța liberă dintre noduri

Să vrem o diagramă în care două noduri au cel puțin 12 unități ale paginii între contururile lor. Pentru a verifica cerința, sistemul are nevoie de două informații diferite: distanța observată și limita impusă rezultatului dorit. Distanța poate fi 8 într-o diagramă reală, chiar dacă planul trebuie să producă cel puțin 12. Modelul observației trebuie să poată reprezenta această încălcare; altfel ar ascunde exact situația pe care vrem să o reparăm.

Spațiul `clearance` are o singură axă, cu valori nenegative, în unitatea paginii. Nu folosim aici pixelul ecranului: schimbarea măririi de afișare nu trebuie să schimbe distanța din document. „Cel puțin 12” este o limită inferioară asupra candidatului. Nu o declarăm ca regiune de forma centru–rază, deoarece o asemenea bilă cu rază finită nu reprezintă intervalul fără capăt superior `[12, infinit)`.

The following declarations define a one-dimensional space and keep the observed gap separate from the requested lower bound. Load `w.legend` and `std.request`; `gap.observation` and `layout.candidate` are invented local toy types. Each declared slot constrains its value without imposing the request's lower bound on all observations.

```sop
@sp.clearance w.legend.space name=clearance version="1" form=axes
@ax.clearance w.legend.axis of=$sp.clearance name=distance order=0 kind=linear unit=$unit.clearance min=0 normalisation=10
@unit.clearance w.legend.unit of=$ax.clearance name=page.unit factor=1 offset=0
@s.observed.value core.slot of=gap.observation key=value kind=number min=0
@s.candidate.gap core.slot of=layout.candidate key=gap kind=number min=0
@source.gap std.request.source text="at least 12 page units apart"
@request.gap std.request act=place mood=do source=$source.gap
@target.gap std.request.target request=$request.gap mode=existing kind=gap.observation
@constraint.gap std.request.constraint request=$request.gap target=$target.gap concept=clearance operator=greater.equal value=12 unit=page.unit scope=each polarity=positive character=requirement source=$source.gap
```

The space has a version. Its axis refers to the space and the unit by real references; the unit declares identity conversion (`factor=1`, `offset=0`). Axis order and linear kind are explicit. There is no maximum. The positive normalisation length is 10 page units, independently of the lower bound 12 on this request.

Al treilea și al patrulea fir permit orice distanță nenegativă, inclusiv observația 8 și candidatul 14. Firele următoare păstrează limita 12 pe cerere, prin operatorul ordonat `greater.equal`. Ținta se leagă la măsurătorile perechilor de noduri vizate de cerere; legarea păstrează identitățile perechilor și versiunea stării, nu toate măsurătorile din proiect. Pe un fork al diagramei, verificatorul recalculează fiecare distanță și compară valoarea cu limita cererii: 8 nu trece, 14 trece. Schema candidatului rămâne neschimbată pentru o cerere ulterioară cu altă limită. Observația și candidatul descriu versiuni diferite ale stării; valoarea calculată pe fork nu este deja o observație a efectului real.

### 8.2.1 Normalizarea unei axe fără plafon

Pe o axă cu limite finite distincte, secțiunea 4.4.1 folosește diferența împărțită la `max−min`. Aici nu există `max`, deci acea formulă nu poate fi aplicată. The metric uses a positive normalisation length, declarată pe axă prin `normalisation`, în aceeași unitate cu valorile. Pentru valori `a` și `b`, diferența normalizată este `abs(a−b)/normalisation`. Dacă sunt declarate atât limite finite, cât și `normalisation`, scara explicită are prioritate; zero și valorile negative sunt refuzate la încărcarea schemei.

Autorul spațiului alege lungimea de normalizare dintr-un reper declarat, de exemplu lățimea mediană 10 a obiectelor unui set de referință fixat. Cu numitorul 1, o diferență brută de 4 devine 4; cu 1000 devine 0,004. Aceeași toleranță ar produce alegeri radical diferite. Secțiunea 12.2 explică alegerea și verificarea scării; valoarea 10 de aici este o ipoteză ilustrativă, nu un prag ales pentru a face cerința să treacă.

Această cheie nu este `scale`. `scale=ratio` stabilește dacă un pas comparativ multiplică valoarea; `normalisation=10` stabilește numitorul distanței dintre valori. Niciuna nu este limita minimă cerută. În acest spațiu, distanțele normalizate pot depăși 1 și nu sunt trunchiate: distanța dintre 0 și 25 este 2,5. Schimbarea scării schimbă comparațiile și toleranțele, deci versiunea axei face parte din justificare.

| Valori comparate | Calcul și semnificație |
|---|---|
| Observație 8, limită 12 | Lipsesc 4 unități; diferența normalizată este `4/10 = 0,4`. Cerința minimă este încălcată. |
| Candidat 14, limită 12 | Candidatul depășește limita cu 2 și o satisface; distanța numerică față de limită este 0,2, dar încălcarea este zero. |
| Observație 8, candidat 14 | Modificarea distanței este 6 unități, adică 0,6 normalizat. Aceasta nu măsoară deplasarea fiecărui nod. |

Tabelul separă distanța față de limită de mărimea încălcării. Pentru o limită inferioară, încălcarea este `max(0, limită−valoare)`. Un candidat la distanța 14 nu trebuie penalizat ca încălcare doar pentru că nu este exact la 12. Alegerea celui mai bun candidat cere un obiectiv separat, cum ar fi deplasarea totală minimă; satisfacerea limitei nu demonstrează optimalitatea.

### 8.2.2 Măsurarea geometrică și validarea candidatului

Funcția geometrică primește date deja observate; nu citește singură ecranul și nu mută noduri. În exemplul simplificat, fiecare nod are un dreptunghi de încadrare în reperul paginii, cu marginile `left`, `right`, `top`, `bottom`. Pentru contururi curbe sau rotite este necesar alt contract geometric; aproximarea prin dreptunghiuri trebuie declarată, nu ascunsă sub același rezultat.

```sop
@type.gap.node core.type of=node closed=true
@slot.gap.left core.slot of=node key=left kind=number present=true
@slot.gap.right core.slot of=node key=right kind=number present=true
@slot.gap.top core.slot of=node key=top kind=number present=true
@slot.gap.bottom core.slot of=node key=bottom kind=number present=true
@type.gap.observation core.type of=gap.observation closed=true
@slot.gap.first core.slot of=gap.observation key=first kind=ref to=node present=true
@slot.gap.second core.slot of=gap.observation key=second kind=ref to=node present=true
@slot.gap.value core.slot of=gap.observation key=value kind=number min=0 present=true
@f.gap core.function name=page.gap out.kind=number pure=true doc="distance between axis-aligned rectangles in page units"
@f.gap.0 core.function.arg of=$f.gap name=a.left kind=number
@f.gap.1 core.function.arg of=$f.gap name=a.right kind=number
@f.gap.2 core.function.arg of=$f.gap name=a.top kind=number
@f.gap.3 core.function.arg of=$f.gap name=a.bottom kind=number
@f.gap.4 core.function.arg of=$f.gap name=b.left kind=number
@f.gap.5 core.function.arg of=$f.gap name=b.right kind=number
@f.gap.6 core.function.arg of=$f.gap name=b.top kind=number
@f.gap.7 core.function.arg of=$f.gap name=b.bottom kind=number
@p.a node left=?a.left right=?a.right top=?a.top bottom=?a.bottom
@p.b node left=?b.left right=?b.right top=?b.top bottom=?b.bottom
@c.distinct core.check fn=neq args=$p.a args=$p.b
@c.gap core.calc fn=page.gap args=?a.left args=?a.right args=?a.top args=?a.bottom args=?b.left args=?b.right args=?b.top args=?b.bottom out=?gap
@t.gap gap.observation first=$p.a second=$p.b value=?gap
@r.gap core.rule when=$p.a when=$p.b if=$c.distinct with=$c.gap then=$t.gap
```

`f.gap` declares a pure geometric calculation and the argument declarations fix its eight ordered numeric arguments. The implementation accepts the four bounds of each rectangle and returns a finite nonnegative distance. Both patterns bind nodes in the same observed revision. `neq` removes the same-node case; because calculation can precede that filter, measuring identical bounds must be valid and return zero. The rule retains both subject references in the derived observation. The toy schemas declare numeric bounds and the two observation references explicitly. Missing or inconsistent bounds produce a diagnostic rather than an invented zero.

Pentru dreptunghiurile A și B, calculăm `dx = max(0, A.left−B.right, B.left−A.right)` și analog `dy` pentru marginile verticale. Rezultatul este `sqrt(dx²+dy²)`. Dreptunghiurile care se ating sau se suprapun au distanța zero. Dacă lipsesc margini sau ele sunt inconsistente, măsurarea nu este disponibilă; nu se întoarce zero ca substitut pentru date lipsă.

De exemplu, A are intervalul orizontal [0,10], B are [18,28], iar proiecțiile verticale se suprapun: rezultă `dx=8`, `dy=0`, deci distanța 8. Dacă planul mută B la [24,34], valoarea devine 14. Funcția `layout` din secțiunea 6.8.1 poate propune această mutare, dar aceeași funcție de măsurare trebuie aplicată candidatului și apoi observației de după execuție. Valoarea promisă de plan nu înlocuiește măsurarea efectului.

Introducerea spațiului folosește astfel mecanisme generale pentru limite, calcule, potrivire și validare. Programul specific rămâne calculul geometric declarat și unealta care poate muta nodurile. Un sistem care are numai funcția de măsurare poate verifica diagrama, fără să pretindă că știe și să o repare.

## 8.3 De la textul SOP la interpretarea unui fir

Interpretarea separă forma scrisă de sensul stabilit prin schemă. Parsarea identifică declarații, chei și tokenuri. Rezolvarea leagă numele de instanțe și referenți. Validarea verifică valorile, tipurile și multiplicitatea; legăturile conceptuale precizează operațiile aplicabile. Aceste distincții sunt obligații ale contractului, nu afirmația că motorul actual execută intern toate verificările în aceeași ordine liniară.

Exemplul următor folosește sintaxa și sloturile existente. O notă aparține unei pagini; eticheta ei conține intenționat un text care seamănă cu o comandă și cu o referință. Schema este:

```sop
@type.note.page core.type of=page closed=true
@type.note.note core.type of=note closed=true
@s.note.label core.slot of=note key=label kind=string
@s.note.page core.slot of=note key=page kind=ref to=page
@s.note.count core.slot of=note key=count kind=integer min=0
@s.note.tag core.slot of=note key=tag kind=atom many=true
@page1 page
@note1 note
  label="Move $page1 later"
  page=$page1
  count=2
  tag=red tag=round
```

`@page1` introduce ținta referinței. Declarația începută prin `@note1` continuă pe liniile următoare până la sfârșit; indentarea este numai pentru cititor. `label` conține un singur token de text, iar `$page1` din interiorul lui nu este extras ca referință. În schimb, valoarea cheii `page` este o referință. `count` este încă tokenul atomic `2` la parsare. Repetarea cheii `tag` produce două valori, fără a o suprascrie pe prima.

| Etapa | Rezultatul pentru aceeași notă |
|---|---|
| Tokenizare | `label="Move $page1 later"` este o singură intrare; sfârșiturile de linie dintre intrări nu încheie declarația. Pozițiile din text pot localiza fiecare token. |
| Parsare | The declaration has identity note1 and type note, with label, page, count and repeated tag entries. None is an inferred request to move anything. |
| Clasificarea valorilor | The interpreter distinguishes string, reference and atom tokens; the count slot supplies the integer meaning. |
| Rezolvarea referinței | `$page1` este legat de identitatea paginii din instanța încărcată. Textul din label nu participă la această căutare. |
| Validarea prin schemă | Slotul count verifică întregul nenegativ; slotul page verifică tipul țintei; many permite cele două tag-uri. Lipsa țintei nu este reparată prin crearea automată a unei pagini. |
| Interpretare și folosire | Nota și relația ei pot fi interogate sau afișate. Nicio regulă ori capabilitate din exemplu nu cere mutarea paginii: eticheta rămâne conținut. |

The decoded label is the literal text “Move $page1 later”; it contains neither an executable instruction nor an active reference. `page=$page1` is an actual reference, and `count=2` is validated against an integer slot. This distinction is preserved by the language interpreter, so a renderer does not parse natural-language-looking labels as commands.

| Resolved information | Why it is retained |
|---|---|
| Instance and wire identity | Distinguishes `note1` from a note with the same local ID in another instance. |
| Applied type and slot declarations | Explain why count is an integer and page is a reference. |
| Source text and positions | Locate the declaration or value that produced an error or interpretation. |
| Reference target and observed version | Establish which page was read and whether a later call is stale. |
| Provenance and status | Distinguish explicit facts, derived facts and unresolved assumptions. |

Metadatele dependente de schemă sau stare se invalidează când versiunea respectivă se schimbă; textul canonic și identitatea nu sunt rescrise pentru a ascunde schimbarea interpretării. Un consumator grafic primește numai câmpurile necesare din această reprezentare, nu recitește eticheta cu reguli proprii. La fel, `before="object exists"` rămâne text până când o schemă și un mecanism explicit îl tratează altfel: condițiile executabile structurate sunt contractul R35, nu rezultatul implicit al prezenței unei fraze.

## 8.4 Cum strângem firele relevante

„Toate firele unui concept” nu înseamnă toate firele care conțin același cuvânt. Pentru desenarea unei rațe avem nevoie de felul rață, strămoșii lui, realizările disponibile, proprietățile și regulile aplicabile. Pentru găsirea unei ședințe libere avem nevoie și de alte ședințe ale participanților, chiar dacă acestea nu conțin cuvintele cererii.

Un **catalog (catalog)** este aici o evidență a declarațiilor și a locului de unde pot fi încărcate. Programul îl construiește din firele validate. Nu ghicește legături din asemănarea numelor. O bază mare poate fi împărțită în **fragmente (shards)**: fișiere care se încarcă separat, dar aparțin aceleiași versiuni publicate.

| Legătura citită | Ce poate fi găsit prin ea |
|---|---|
| `extends` | Declarațiile tipului părinte și regulile aplicabile descendenților. |
| Declared conceptual mappings | The concept represented by a type or property; follow only mappings defined and checked by the corresponding schema. |
| `of`, `type` ale slotului | Tipul care deține slotul și tipul faptului la care valoarea lui poate trimite. |
| `space` | Definiția axelor și operațiile spațiului valorii. |
| `when`, `not`, `if`, `with` | Modelele, condițiile și calculele de care depinde o regulă. |
| Tool interface and binding | The accepted operation, typed parameters, outputs, dependencies and observation mapping. |
| referință între fapte | Lucrul concret numit, inclusiv într-o altă instanță. |

Același text `of` pe alt tip de fir nu este automat aceeași legătură. Semnificația vine din schema tipului. Un **index invers (reverse index)** este tabelul care răspunde la întrebarea inversă: „ce reguli sau declarații folosesc acest tip?”. Dacă o regulă privește animale, indexul permite să o găsim și când verificăm o rață, după urmărirea părinților.

Căutarea pornește din operația cerută și urmează aceste dependențe. Memorează identitățile deja vizitate, ca un ciclu să nu provoace o buclă. Dacă descoperă o regulă care cere alte date, le solicită și continuă. La fiecare fapt inclus păstrează motivul includerii. O limită de timp oprește căutarea cu rezultat incomplet; nu transformă datele lipsă în inexistență.

În demo, calendarul este o instanță locală. Toate ședințele ei sunt în starea citită; nu presupunem un serviciu extern de rezervări. Autorul tiparului poate declara această închidere printr-un fir existent al limbajului:

```sop
@t.meeting core.type of=meeting complete=true
```

This toy declaration states coverage only for the observed local population. It is justified after the relevant facts are loaded. A partially read calendar cannot be made complete by attaching this flag to its type; the loader/observer must establish the coverage claim.

Firul spune că tipul despre care vorbim este `meeting`, iar `complete=true` permite răspunsul „nu” când nu există o potrivire în acea instanță. Programul care încarcă instanța trebuie să asigure că toate faptele ei au fost citite înainte să folosească această proprietate. Declarația nu produce faptele lipsă. Ea nu spune nici că toate bazele de cunoaștere ale lumii au fost încărcate.

Knowledge rules have their own dependencies. The library follows declared imports and references to load those rules and their premises. A complete event population does not prove that all required policy declarations were loaded. An unavailable dependency yields an incomplete verification, not “no restriction applies”.

Sunt două versiuni diferite. **Versiunea stării (state version)** este un identificator care se schimbă la fiecare modificare semantică a instanței și permite detectarea unui plan învechit. **Versiunea publicată (published version)** identifică exact un pachet de scheme și cunoaștere, de exemplu prin amprenta conținutului. Rezultatul unei verificări reține amândouă. „Verificat la V” fără să spună care dintre ele este insuficient.

Prin **sfera de completitudine (coverage scope)** înțelegem faptele și intervalul pentru care sursa garantează că nimic relevant nu lipsește. Nu o numim „domeniu”, fiindcă domeniul este zona de lucru a aplicației. Pentru calendarul local, sfera poate fi toate faptele `meeting` din instanța citită; pentru o serie recurentă este necesară și verificarea aparițiilor în intervalul cerut, conform R48.

## 8.5 Cum se schimbă motorul de raționament

Un motor primește o stare cu versiune, un scop, constrângeri, preferințe și un buget. Declară ce operații și ce **fragment de logică (logical fragment)** suportă: de exemplu, reguli fără negație, constrângeri liniare sau reguli care pot apela anumite funcții pure. Un motor care nu știe negație nu are voie să ignore interdicția negativă și să raporteze succes.

Un motor de deducție poate produce consecințe. Un rezolvitor poate căuta începutul unei ședințe. Un planificator poate propune o succesiune de operații. Ele au roluri diferite; nu sunt variante interschimbabile doar fiindcă toate se numesc reasoning.

Rezultatele se citesc după întrebarea la care răspund. Nu introducem încă o listă de succese echivalente.

| Întrebarea | Rezultatul și legătura cu celelalte etape |
|---|---|
| Este candidatul valid? | Verificarea din 3.9: valid, nevalid sau nedeterminat. Un candidat găsit încă nu este valid. |
| Ce a stabilit căutarea? | Cele cinci rezultate din 6.8: plan valid; plan neverificat complet; cerere nevalidă; inexistență demonstrată; oprire fără concluzie. |
| Poate motorul face operația? | Operația nesuportată este un diagnostic: se poate încerca alt motor declarat compatibil; dacă niciunul nu există, căutarea se oprește fără concluzie. |
| Au fost suficiente date și timp? | Datele lipsă duc la plan neverificat, dacă există un candidat, sau la oprire fără concluzie. Bugetul epuizat nu dovedește inexistența soluției. |
| Ce s-a întâmplat efectiv? | Execuția din 6.9: executat, executat în parte, desfăcut, efect necunoscut sau desfacere eșuată. |

O soluție fezabilă satisface constrângerile; o soluție optimă are în plus o dovadă că niciun candidat admis nu are cost mai mic. Motorul nu are voie să schimbe primul cuvânt în al doilea doar fiindcă s-a terminat timpul.

The coordinator belongs to SOPWorlds LIB. It reads declared execution dependencies, asks generic inference and search mechanisms to elaborate open goals, validates candidate call circuits, dispatches ready concrete calls and observes their effects. It is not an application-specific second interpreter. A diagram or calendar name must not select an undeclared semantic algorithm inside it.

For each candidate, LIB constructs a trial state with the same schema and knowledge versions, applies the proposed effects and evaluates constraints. It retains assumptions separately from observed facts. A reversible ambiguity can be resolved by the declared ranking policy; a missing required tool argument cannot. Before dispatch, the relevant state preconditions are rechecked. A changed version triggers revalidation, not a silent invocation against an obsolete object.

O funcție geometrică sau numerică declarată poate rămâne o dependență de încredere: verificatorul îi controlează argumentele, tipul rezultatului și proprietățile verificabile, dar nu poate dovedi corectitudinea oricărui program arbitrar. Contractul numește funcția și versiunea ei; testele ei și limitele metodei sunt parte din justificare. Autorul domeniului trebuie să aleagă o implementare verificată pentru acel contract și să declare limitele ei; numirea funcției nu este o dovadă de corectitudine. O funcție lipsă nu se consideră adevărată implicit. Practic, înainte să folosească rezultatul pentru o decizie, integratorul verifică versiunea implementării, probele contractului și domeniul intrărilor; dacă acestea nu justifică acel caz, rezultatul rămâne nedeterminat, nu o dovadă de satisfacere.

## 8.6 O ședință, urmărită cu numere

Fixăm pentru exemplu o zi și un fus orar deja rezolvate. Minutele se numără de la miezul nopții. Ana are o rezervare [600, 660), adică 10:00–11:00. Cererea este o ședință de 30 de minute, cu Ana, începând exact la 10:30. Interpretarea produce participantul identificat, începutul 630 și durata 30. Sfârșitul calculat este 660.

This example enables the optional resource profile. `room1` is already resolved, and the same interval must be checked for the participant and room. In the simpler single-calendar profile there is no room argument to fill. The need for a resource comes from the applicable schema and tool contract, not from a universal scheduling assumption.

Fragmentul executabil de mai jos izolează verificarea conflictelor, folosind mecanismele existente. Tipul `candidate` desemnează numai propunerea de testat; nu este încă o rezervare executată. Schema completă a rolurilor și unităților aparține declarației domeniului. Datele sunt un instantaneu local ilustrativ: singura rezervare existentă este `busy`, pentru aceeași persoană și aceeași sală.

```sop
@type.time.person core.type of=person closed=true
@type.time.room core.type of=room closed=true
@type.time.meeting core.type of=meeting closed=true complete=true
@type.time.candidate core.type of=candidate closed=true
@slot.time.meeting.people core.slot of=meeting key=people kind=ref to=person present=true
@slot.time.meeting.room core.slot of=meeting key=room kind=ref to=room present=true
@slot.time.meeting.start core.slot of=meeting key=start kind=number present=true
@slot.time.meeting.length core.slot of=meeting key=length kind=number min=0 present=true
@slot.time.candidate.people core.slot of=candidate key=people kind=ref to=person present=true
@slot.time.candidate.room core.slot of=candidate key=room kind=ref to=room present=true
@slot.time.candidate.start core.slot of=candidate key=start kind=number present=true
@slot.time.candidate.length core.slot of=candidate key=length kind=number min=0 present=true
@ana person
@room1 room
@busy meeting people=$ana room=$room1 start=600 length=60
@p.old meeting people=?person start=?old.start length=?old.length
@p.new candidate people=?person start=?new.start length=?new.length
@p.room.old meeting room=?room start=?old.start length=?old.length
@p.room.new candidate room=?room start=?new.start length=?new.length
@c.old.end core.calc out=?old.end fn=add args=?old.start args=?old.length
@c.new.end core.calc out=?new.end fn=add args=?new.start args=?new.length
@c.left core.check fn=lt args=?new.start args=?old.end
@c.right core.check fn=lt args=?old.start args=?new.end
@d.person core.deny when=$p.old when=$p.new with=$c.old.end with=$c.new.end if=$c.left if=$c.right why="participant overlap"
@d.room core.deny when=$p.room.old when=$p.room.new with=$c.old.end with=$c.new.end if=$c.left if=$c.right why="room overlap"
```

The initial type/slot declarations define the toy schema; the person, room and busy meeting are observed data. Cele două perechi de pattern-uri leagă, separat, participantul comun și sala comună. Calculele `c.old.end` și `c.new.end` adună începutul și durata intervalului potrivit; variabilele se leagă pentru fiecare pereche, fără a amesteca două rezervări. Condițiile `c.left` și `c.right` sunt cele două inegalități stricte ale suprapunerii. Fiecare interdicție folosește ambele calcule și ambele condiții; verificarea unei resurse nu înlocuiește verificarea celeilalte.

The meeting type is marked complete only in this local toy instance, după încărcarea integrală a rezervărilor relevante pentru ambele resurse și intervalul cercetat. Nu afirmă că sursa externă nu se poate modifica și nu închide toate calendarele. O citire incompletă nu primește această declarație doar ca să permită găsirea unei ore. Verificarea la execuție folosește versiunea sursei, nu numai acest indicator.

For the trial `@trial candidate people=$ana room=$room1 start=630 length=30`, both deny patterns match: participant and room overlap. For start 660 they do not match, because the half-open interval [660,690) starts exactly at the old interval's end. Passing these checks establishes only this constraint result; it does not create an event or establish every other precondition.

Pentru două intervale [a,b) și [c,d), suprapunerea este adevărată când a < d și c < b. Aici 630 < 660 și 600 < 660: există conflict. Acesta este un calcul explicit, nu o concluzie obținută din cuvântul „ședință”. Regula leagă întâi rezervările care împart un participant, apoi aplică testul intervalelor.

Coordonatorul poate căuta o alternativă. La 660, intervalul propus este [660,690). Condiția 660 < 660 este falsă, deci rezervarea cunoscută nu îl blochează. Dar acest calcul singur nu dovedește că Ana este liberă: trebuie consultate toate rezervările ei relevante până la 690. Dacă sursa este indisponibilă, rezultatul rămâne necunoscut.

The initial time was explicit. Under the declared no-overlap policy, 11:00 remains an alternative rather than a silent replacement for 10:30. A vague “later” request would instead allow LIB to choose the ranked feasible time and explain that choice. This difference follows the source and strength of the requirement, not a refusal-first treatment of all uncertainty.

To continue with a feasible creation, consider the separate request “book the next free 30-minute meeting with Ana after 10:30”. This allows a later start. LIB derives 660 under the declared objective and emits a creation instruction containing the resolved calendar, title, participant and room references, absolute date/time corresponding to 660, and duration 30 minutes. The tool does not see “next free”. Observation must find the returned event identity with those values and no alteration to the existing booking before the response says it was scheduled.

If several people have the same label, identity resolution ranks context evidence such as explicit selection and prior bindings. A freer calendar is not itself evidence of which person the user meant. With a usable reversible interpretation, LIB can act on the best supported identity, name it and retain alternatives and undo. Genuine uncertainty remains in the trace; it is not removed by presenting one candidate.

| Ramura scenariului | Starea păstrată și răspunsul justificat |
|---|---|
| Two people named Ana | Rank contextual evidence; preserve both candidates. If a usable reversible choice is made, name the selected identity and the assumption. Never invent distinguishing personal facts. |
| Exact 10:30 conflicts; 11:00 is verified free | Preserve the explicit time. “The requested 10:30 conflicts with Ana’s meeting; 11:00 is the nearest free alternative.” No booking is claimed. |
| A request allowing the next free time yields an observed creation at 11:00 | Retain the new event identity and invocation. “I scheduled the meeting with Ana from 11:00 to 11:30; that was the next free interval.” |
| Refuz confirmat al creării și absență verificată a efectului | Nu există întâlnire nouă atribuită pasului. „The booking was rejected; no meeting was created.” Motivul este adăugat numai dacă provine dintr-un rezultat verificat al uneltei. |
| Răspuns pierdut, efect încă necunoscut | Nu se reîncearcă orbește crearea. „I could not confirm whether the meeting was created. I need to check the calendar.” |
| Anulare cerută după crearea confirmată | Se compensează numai întâlnirea identificată în pasul respectiv; după observarea dispariției ei: „I removed the meeting I just created.” Rezervarea inițială 10:00–11:00 rămâne neschimbată. |
| Compensare neconfirmată | Jurnalul nu este șters și pasul nu este declarat anulat. „I could not confirm the cancellation; the meeting may still be present.” |

Pentru răspunsul pierdut, adaptorul caută efectul după identitatea operației sau cheia de idempotență stabilită înainte de apel. O întâlnire cu aceleași valori nu este automat aceeași operație: altcineva putea crea una identică. Dacă verificarea găsește efectul corelat, continuarea folosește identitatea găsită; dacă dovedește absența și politica permite reîncercarea, aceasta păstrează aceeași cheie. În lipsa unei concluzii, rămâne statutul necunoscut. O eroare de transport nu dovedește absența efectului.

Anularea citește versiunea curentă a întâlnirii create și o compară cu starea consemnată după execuție. Dacă între timp întâlnirea a fost modificată independent, nu se șterge automat acea muncă sub pretextul restaurării stării vechi; conflictul urmează politica de compensare din secțiunea 6.9.2. Anularea adaugă în jurnal o operație compensatoare cu rezultatul observat, nu elimină episodul care explică de ce întâlnirea a existat. Aceste ramuri aplică același contract de execuție în toate domeniile; calendarul furnizează identitățile și observațiile concrete.

După crearea confirmată, întâlnirea poate fi reprezentată printr-un nod al unei diagrame. Alegerea acestui exemplu este un instantaneu, conform R58–R59: citim o versiune coerentă, salvăm valorile consumate și proveniența lor, apoi desenăm din acele date. Referința activă spre calendar și proveniența istorică au roluri diferite, ca în secțiunea 2.6.

În contextul temporar de citire, ambele instanțe sunt încărcate și aliasul `calendar` este legat de identitatea imutabilă a calendarului. The following pseudocode identifies the projection input; `m2` is the created event, distinct from the original booking:

```text
Pseudocode — projection input
source: calendar instance / event m2 / coherent state revision
mode: snapshot
```

The projection resolves the source event against its instance and version. That temporary read dependency is not automatically a permanent live dependency of the saved diagram. Start, duration and participant are read from one coherent snapshot. The following pseudocode shows the resulting data; a domain schema must define its concrete storage representation.

```text
Pseudocode — projected snapshot and node
snapshot: calendar-instance-id / m2 / state-18
captured values: start 660, duration 30, participant ana-id
node label: 11:00–11:30
node provenance: that snapshot
```

The snapshot retains the source identity and the values justifying the label, including the participant. `ana-id` este identitatea rezolvată, nu o nouă persoană creată în diagramă. Pentru acest fragment, ziua și fusul orar sunt cele deja fixate în scenariu; un instantaneu exportat independent trebuie să le păstreze explicit împreună cu unitatea timpului. Eticheta este calculată din începutul 660 și durata 30, nu copiată din intenția inițială de a începe la 10:30.

The saved node retains local provenance to the captured values. Closing the calendar need not invalidate historical provenance. Moving the source event later does not make a snapshot chart current: explicit refresh reads another coherent revision and produces new provenance. A live view instead requires declared invalidation, propagation and lifetime semantics.

Un grafic cu numărul întâlnirilor pe participant cere toate întâlnirile din domeniul agregării, nu doar acest fir. Pentru el se păstrează colecția surselor, versiunea și acoperirea citirii; fiecare întâlnire se numără o singură dată după identitate. Exemplul de nod individual nu este dovada completitudinii acelui grafic. Acest fapt localizează exact munca suplimentară a proiecțiilor agregate, fără să transforme nodurile în copii ale persoanelor.

# 9. Request classes and their resolution circuits

The public semantic boundary is SOP Lang. A request circuit states a goal or question; it is not necessarily executable. The library elaborates it using schema, knowledge and live instance Worlds. The terminal result is either a concrete circuit of typed tool calls, or a justified answer derived from observations, with any unresolved obligations retained. Internal JavaScript methods are implementation details, not a second semantic interface.

## 9.1 Questions: values, count, existence and members

A question selects existing subjects and declares its projection separately. Asking for their colour does not require changing their colour. The following independent examples use the `std.request` schema. The invented kind `sample.item` names an application vocabulary concept; it does not give that kind a renderer or imply the existence of any instance.

```sop
@source.query.values std.request.source text="What colours are the items?"
@request.query.values std.request act=inspect mood=ask source=$source.query.values query=$query.values
@target.query.values std.request.target request=$request.query.values mode=existing kind=sample.item
@query.values std.request.query request=$request.query.values target=$target.query.values operation=values concept=colour
```

```sop
@source.query.count std.request.source text="How many items are there?"
@request.query.count std.request act=inspect mood=ask source=$source.query.count query=$query.count
@target.query.count std.request.target request=$request.query.count mode=existing kind=sample.item
@query.count std.request.query request=$request.query.count target=$target.query.count operation=count
```

```sop
@source.query.exists std.request.source text="Are there any items?"
@request.query.exists std.request act=inspect mood=ask source=$source.query.exists query=$query.exists
@target.query.exists std.request.target request=$request.query.exists mode=existing kind=sample.item
@query.exists std.request.query request=$request.query.exists target=$target.query.exists operation=exists
```

```sop
@source.query.members std.request.source text="Which items are there?"
@request.query.members std.request act=inspect mood=ask source=$source.query.members query=$query.members
@target.query.members std.request.target request=$request.query.members mode=existing kind=sample.item
@query.members std.request.query request=$request.query.members target=$target.query.members operation=members
```

LIB resolves the target kind against compatible instance Worlds and the schema's declared type relationships, selects a population from a coherent snapshot, evaluates any selectors, and applies the requested projection. Suppose a complete snapshot contains `a`, red, and `b`, blue. Values yields those property values with their subject identities; count yields 2; existence yields true; members yields `a` and `b`. Duplicated evidence for `a` does not create a third item. The answer retains the instance, snapshot version, selection evidence and declared coverage.

For a partial snapshot containing only `a`, existence can still be true. Count is at least 1, not exactly 1; a full members list is unknown. If no member is observed in a partial population, existence is unknown rather than false. A values query must distinguish an absent property from a known empty value. These rules are generic consequences of coverage, independent of whether the subjects are drawing objects, calendar events or document chapters.

## 9.2 Selection and result requirements have different roles

“How many red items?” adds a selector to the target:

```sop
@source.query.red std.request.source text="How many red items?"
@request.query.red std.request act=inspect mood=ask source=$source.query.red query=$query.red
@target.query.red std.request.target request=$request.query.red mode=existing kind=sample.item selector=$selector.red
@selector.red std.request.constraint request=$request.query.red target=$target.query.red concept=colour operator=eq value="red" polarity=positive character=requirement
@query.red std.request.query request=$request.query.red target=$target.query.red operation=count
```

The selector tests the observed colour. In “make the selected items red”, colour is instead a requirement on the result. Filtering out blue items before recolouring would lose exactly the objects that need changing. The compiler retains these roles through every transformation: bind subjects from the selector, then instantiate property-change calls for those subjects, then observe the result predicate. A type-valid graph that swaps these roles is semantically wrong.

Schema declares what colour means for that kind and how it maps to a concrete tool field; knowledge resolves a named colour to the representation required by the tool. A string such as “red” in a request is not automatically a renderer code. A tool that accepts a hexadecimal colour receives the resolved code; the correspondence and source remain visible in the elaboration trace.

## 9.3 Rules, inference and search

Rules derive facts from matching premises; they do not inspect arbitrary sentence fragments. The following complete toy model states that a selected item is eligible. It demonstrates a schema, instance facts and a rule in one small circuit; a production application can load those parts from separate Worlds with explicit imports.

```sop
@type.sample.item core.type of=sample.item closed=true
@slot.sample.id core.slot of=sample.item key=id kind=string present=true
@slot.sample.selected core.slot of=sample.item key=selected kind=boolean present=true
@type.sample.eligible core.type of=sample.eligible closed=true
@slot.sample.eligible.id core.slot of=sample.eligible key=id kind=string present=true
@pattern.sample.selected sample.item id=?id selected=true
@template.sample.eligible sample.eligible id=?id
@rule.sample.selected core.rule when=$pattern.sample.selected then=$template.sample.eligible
@sample.a sample.item id="a" selected=true
@sample.b sample.item id="b" selected=false
```

The matcher binds `?id` to `"a"`; the rule derives `sample.eligible id="a"` with the rule and matching fact as evidence. It does not derive eligibility for `b`. If the supporting selection changes, derived eligibility must be re-evaluated. A request that operates on eligible items can consume this conclusion; derivation alone does not issue a tool call.

Search is needed when rules constrain several possible completions without forcing a single value. For “place the group without overlap”, schema supplies dimensions and coordinate units; instance facts supply members and occupied regions; knowledge supplies candidate generation and the ranking objective. LIB generates candidate positions, measures collisions, rejects forbidden intersections and ranks feasible candidates. It emits coordinates for a selected candidate, with its assumptions. A pure geometric calculation can be native; which group, which constraints and which objective to use must be declared.

## 9.4 Creation, modification and composition

“Draw a tree and a house” introduces two new targets under the shared creation act. The reader must preserve both noun groups and their local conditions. LIB selects representations, instantiates parts, derives required size and position arguments, and constructs calls with output references for newly created objects. “Draw a tree near the house” instead introduces one new target and an existing anchor. Splitting at every noun or every “and” cannot implement this distinction.

A concrete call contains only typed literals, resolved existing references, or typed outputs of earlier calls. Its operation, required arguments, units and coordinate frame are known. It has no unresolved “the other one”, “large”, “near” or “tomorrow”. Calls may have explicit dependencies and guards; their order follows those dependencies, not the order of declarations in the file. The generic dispatcher binds outputs and invokes primitives. The tools do not interpret the overall plan.

A UI command that already supplies an object reference and colour uses this same validation and dispatch boundary directly. It need not be translated into English and read again. Its training pair can still record the natural text and concrete SOP intent, without making that pair the execution mechanism.

## 9.5 Follow-ups, collective requests and transfers between Worlds

| Request class | Generic elaboration | Terminal obligation |
|---|---|---|
| “Move the other one down” | Retain compatible identities, exclude the prior referent, rank context evidence, resolve the vertical frame and declared step. | Concrete subject, coordinate change, explicit assumption if the reference remained uncertain. |
| “Make every red box smaller” | Evaluate the red-box selector on one population snapshot; bind each member; apply the declared size step and bounds. | One typed change per selected identity, or a bulk primitive with equivalent declared semantics; preserve all other properties. |
| “Add two items to each group” | Bind each group separately and instantiate a local creation quantity of two. | Returned identities are attached to the correct parent; two globally is not equivalent. |
| “Show meetings per day as a chart” | Read the declared date interval with coverage; group by resolved local day; count unique event identities; instantiate the chosen chart method. | Diagram calls contain concrete values and geometry; provenance points to the consumed calendar snapshot. |
| “Put that chart into the report” | Resolve the chart and document separately, select snapshot or live-reference semantics from declarations, instantiate the insertion method. | Concrete document insertion with explicit content/reference and observation of the inserted section. |

An uncertain but usable reversible interpretation is acted on with its actual effect and assumption stated; ranked alternatives and undo remain available. Explicit constraints are preserved. Missing evidence cannot be converted into a factual assertion, and an unbound required argument cannot be passed to a primitive as if it were concrete. The trace identifies the precise remaining obligation instead of hiding it behind “the system understands”.

# 10. The reader: from text to candidate request circuits

The reader proposes request graphs with source spans, roles, ownership and uncertainty. A neural encoder such as SOP-BERT can predict act labels and token spans; it does not generate executable tool calls by itself. A span head locates a substring using token offsets. A generic decoder builds graph nodes from those predictions under the request schema. If two target spans are found but the decoder retains only one target field, a second object is lost after recognition. More training cannot repair a representation that has discarded it.

A symbolic reader can instead obtain candidate structure through declared lexical and grammar rules. These are alternative ways to propose the same request contract. LIB's subsequent world resolution and elaboration must not depend on which reader supplied it. The constructions in this chapter define the required distinctions, rather than requiring every reader to build an identical internal syntax tree.

## 10.1 Lexicul: forme de limbă legate de concepte

Cititorul primește text englez și întoarce descrieri candidate, nu comenzi de unealtă. Pentru aceasta are nevoie de trei lucruri distincte: un lexic care leagă formele de sensuri, o gramatică ce construiește relații între fragmente și reguli de compunere semantică ce transformă acele relații în cerințe. Recunoașterea tuturor cuvintelor nu dovedește că relația dintre ele a fost înțeleasă. „Before” și „after” pot folosi aceleași obiecte, dar cer schimbări opuse.

Lumea limbii deține formele și construcțiile engleze, iar bazele conceptuale dețin felurile, regiunile și relațiile desemnate. Numele introduse într-o instanță completează lexicul local, fără să modifice vocabularul tuturor lumilor. O intrare lexicală păstrează forma, lema, categoria gramaticală, trăsăturile relevante și unul sau mai multe sensuri. Fiecare sens indică un concept sau un rol; simpla coincidență a numelor nu este legătura semantică.

| Categoria de intrări | Ce trebuie declarat și cum este folosit |
|---|---|
| Substantive și nume | Legătura cu felul conceptual sau identitatea numită; forma de plural nu schimbă felul. Un nume al instanței poate acoperi mai multe cuvinte. |
| Verbe de act | Actul general și cadrele sale de argumente: care rol este obligatoriu, care poate fi omis și ce complement îl realizează. Verbul nu selectează singur o unealtă. |
| Adjective și grade | Conceptul modificat și regiunea sau operatorul de grad; sensurile incompatibile rămân candidate separate. |
| Prepoziții și relații | Sensurile posibile, rolurile relației și tipurile de complemente admise. Aceeași formă poate avea sens temporal sau spațial. |
| Determinanți, numere și cuantificatori | Referință existentă sau introducere, cantitate, distribuție și întinderea cuantificării. „Each” nu este un cuvânt de ignorat. |
| Pronume și cuvinte de dialog | Rolul de referire, persoana, numărul sau legătura cu o întrebare deschisă; obiectul concret se rezolvă în context. |
| Negație și coordonare | Operatorul logic și construcția asupra căreia se aplică; nu doar un indicator global că propoziția conține „not” ori „and”. |

Lexicul poate da mai multe categorii sau sensuri aceleiași forme. Alegerea se face împreună cu structura propoziției și tipurile conceptelor. „Light” poate modifica o culoare sau greutatea unui obiect; o listă de cuvinte care îl transformă mereu în același număr pierde această distincție. În schimb, un nume exact al unui obiect nu trebuie reparat ortografic doar pentru că seamănă cu un cuvânt comun.

### 10.1.1 Potrivirea formelor imperfecte

Un mesaj tastat nu este neapărat o secvență de forme corecte. Cititorul păstrează textul original și construiește variante de segmentare și de formă, fiecare cu intervalele originale și operațiile propuse. Mecanismul este aceeași căutare a potrivirii apropiate din secțiunea 6.4.1, aplicată formelor lexicale, înainte de alegerea sensului. Distanța dintre litere nu înlocuiește distanța conceptuală: două cuvinte apropiate ortografic pot avea sensuri incompatibile.

Mai întâi sunt căutate formele exacte, inclusiv numele locale cu mai multe cuvinte. Pentru un segment rămas necunoscut se generează candidați prin inserție, ștergere, substituție, transpoziție și mutarea unei granițe de cuvânt. Politica declară costurile, toleranța și bugetul de căutare, calibrate prin procedura din capitolul 12; nu există un prag numeric universal justificat doar de aceste exemple. Potrivirea gramaticală și compatibilitatea rolurilor elimină candidați, dar simplul fapt că unul poate fi executat nu dovedește intenția.

| Fragment primit | Candidat și verificare |
|---|---|
| `watter` | `water`, prin eliminarea unei litere dublate, dacă forma este necunoscută și sensul se potrivește rolului. Se păstrează legătura cu întregul fragment original. |
| `th epond` | `the pond`, prin mutarea graniței, fără schimbarea șirului de litere. Determinantul și substantivul trebuie să formeze împreună un grup nominal valid. |
| `upper` într-o cerere de schimbare | Se păstrează întâi sensul lexical existent, de exemplu regiunea superioară. O construcție comparativă neuzuală poate propune și o creștere pe axa verticală, dar cele două citiri nu sunt sinonime: regiunea cerută și deplasarea relativă au condiții diferite. |
| Numele exact `Watter` al unui obiect | Rămâne referință la acel obiect; nu devine `water`. Numele locale și intervalele citate sunt protejate de corectarea automată. |

Corectarea poate afecta mai multe tokenuri; de aceea proveniența nu se reduce la o pereche „token greșit → token bun”. Varianta `th epond` păstrează intervalele din textul original chiar dacă arborele rezultat are alte granițe. Nici numărul, nici negația și nici unitatea unei valori nu pot dispărea drept zgomot. Un nume aproximativ poate fi propus utilizatorului ca referent candidat, dar nu este redenumit ori substituit în tăcere. O reparație poate și introduce informație, nu doar să o piardă: `now`/`not`, `on`/`no`, `on`/`one` și `for`/`four` sunt apropiate ortografic, dar schimbă timpul, negația sau cantitatea. Orice reparație care adaugă, elimină ori schimbă o negație, un număr, un cuantificator, o unitate sau un nume cere alegerea între citirile explicate; nu este aplicată în tăcere pe baza scorului. Protecția privește conținutul semantic, astfel încât normalizarea unei grafii echivalente nu devine automat schimbare de cantitate. Formele exacte rămân prima analiză; exemplele de mai sus sunt contraexemple pentru corectare agresivă, nu instrucțiuni de a le confunda.

Equivalent descriptions can merge while retaining their separate evidence. Different descriptions remain ranked alternatives. For “upper”, context can support either a comparative move or placement in an upper region. With a usable reversible interpretation, act on the best supported one, state the concrete move and retain undo. Exhausting a search budget does not prove that the retained alternative was unique.

## 10.2 Gramatica și arborele sintactic

O regulă gramaticală descrie cum se construiește o expresie din componente. Un grup nominal poate conține un determinant, o cantitate, modificatori și un substantiv principal. Arborele rezultat păstrează fiecare componentă și intervalul ei în text. Acesta este diferit de modelul de fire din secțiunea 3.4: arborele descrie organizarea textului, iar un pattern SOP caută potriviri într-o lume. Arborele poate fi reprezentat ulterior prin fire, dar cele două operații nu trebuie confundate.

The following explanatory grammar describes the required constructions, using grammar notation rather than loadable SOP declarations. `NP` înseamnă grup nominal, `PP` grup prepozițional, `V` verb, `N` substantiv, `Adj` modificator, iar `?`, `*` și `+` înseamnă opțional, zero sau mai multe, respectiv una sau mai multe apariții. `Name`, `Pron`, `Det`, `Num`, `Prep` și `Coord` sunt categorii ale lexicului.

```text
Message  := Command | RequestFrame | Fragment
Command  := V NP Complement*
RequestFrame := "I want" NP | "can I get" NP | "make it so" Clause
Clause   := NP Predicate
NP       := Name | Pron | Det? Num? Adj* N Modifier*
Modifier := PP | Relative
PP       := Prep NP
Relative := "that" Predicate
Group    := NP (Coord NP)+
Fragment := PP | Adj | Num | Direction | Degree | NP (Complement | Direction | Degree)+
```

Această schemă arată componentele, nu închide toate regulile. `Complement` este un rol permis de cadrul verbului, iar `Predicate` este o proprietate sau o relație din construcțiile suportate. Coordonarea trebuie introdusă în locurile permise de gramatică, cu tipul ei de grup; nu înseamnă tăierea mesajului la fiecare „and”. O gramatică livrată trebuie să definească toate categoriile utilizate și să declare limitele sale de recursie și calcul.

| Construcția vizată | Structura și obligația semantică |
|---|---|
| Imperativ | Leagă verbul de act și complementele de rolurile cadrului; un rol lipsă rămâne deschis. |
| Grup nominal cu adjective și PP | Păstrează substantivul principal și modificatorii lui; o prepoziție poate modifica substantivul sau actul, deci atașamentele se păstrează separat. |
| Coordonare | Construiește grupuri distincte sau condiții comune conform categoriei coordonate; cantitatea unui membru nu se transferă celuilalt. |
| Relativă restrictivă | Adaugă un predicat de selecție asupra referentului: „the section that contains the table”. Nu execută actul numit în relativă. |
| Pronume | Produce o cerință de referire cu trăsături; nu alege obiectul înainte de consultarea focusului și selecției. |
| Elipsă și fragment | Produce rolul spus și rolurile omise; situarea decide ce se poate moșteni din dialog. |
| Negație și distribuție | Construiește întinderea operatorului: negarea actului, a unei proprietăți sau a cuantificării au rezultate diferite. |

Intrarea gramaticii este `Message`, nu doar imperativul. `Direction` și `Degree` sunt categorii lexicale pentru direcții și modificări de grad; `Clause` exprimă o stare cerută, iar `Predicate` poate fi proprietate sau relație. Cadrele din schemă sunt exemple ale unor familii de construcții declarate în lumea limbii, cu roluri și reguli de compunere; nu teste de egalitate cu propoziții întregi. O implementare le extinde cu politețe, flexiune și forme interogative păstrând aceleași roluri.

| Formă de mesaj | Descrierea produsă și informația încă necesară |
|---|---|
| `down` | Direcție de schimbare pe o axă; ținta, reperul și pasul provin din context sau rămân deschise. |
| `more` | Creștere de grad ori cantitate; conceptul modificat trebuie identificat, nu ales automat după ultimul număr. |
| `on the lake` | Relație cu o țintă existentă; poate corecta locul cererii active fără a introduce un obiect nou. |
| `the pond up` | Țintă explicită plus direcție; actul de schimbare se deduce din construcție și axa aplicabilă. |
| `I want a boat` | Stare dorită cu o țintă introdusă; în contextul editării poate produce o cerere de creare, păstrând determinarea și cantitatea. |
| `can I get a boat` | În contextul editării propriului desen, cadrul indirect cere crearea: `mood=do`. O întrebare explicită despre posibilitate păstrează `check`, conform regulii de mai jos. |
| `make it so the heading is above the table` | Stare finală cerută, cu relație între referenți; planificatorul alege schimbarea care o realizează fără să inventeze un verb lipsă din mesaj. |

Context resolution fills omitted roles from explicit selection, dialogue bindings and applicable World declarations. For “more” after a size change, bind the prior subject and size concept and apply the declared comparative step. If count and size both remain plausible, retain and rank both interpretations, apply a usable reversible one and identify its concrete effect. A new user message authorizes that adjustment; the mechanism does not autonomously repeat it forever.

Act and request mood are independent. `std.request` declares `mood=do|propose|check|ask`: effect, proposal, feasibility check or information. Only `do` dispatches mutations; `propose` and `check` evaluate candidates without claiming a real effect. Indirect requests such as “could you add a box” normally denote `do` in an editing context. The absence of an imperative verb does not justify returning only a statement of capability.

| Indiciu al cadrului și contextului | Modul și continuarea |
|---|---|
| Solicitare adresată asistentului pentru un rezultat propriu, în zona de editare | `do`; se construiește planul și se execută după verificările obișnuite, fără o întrebare redundantă despre intenția de a cere. |
| Întrebare despre posibilitate ori efecte ipotetice; marcaj explicit precum `just check` | `check`; se verifică planul fără efecte asupra stării reale. |
| Cerere de variante sau recomandare | `propose`; se prezintă opțiunile și justificarea lor. |
| Several plausible conversational goals | Rank them using declared context policy. A usable reversible editing interpretation can execute with its assumption stated; preserve alternatives. |

Mood does not establish access rights. The library interprets conversational evidence and the declared policy for unresolved alternatives, while each concrete call must satisfy resource permissions and preconditions. A `check` does not become `do` because it is feasible. A vague but usable editing request does not become `check` simply because several reversible interpretations exist. The selected mood and uncertainty remain visible.

A grammar can be inspected independently of execution. In the following toy example, lexical categories and a coordination rule preserve the different quantities and modifiers. The notation is explanatory pseudocode, not a public JavaScript API.

```text
Pseudocode — declared grammar and result
Num(two) = 2; Adj(red) = red; N(cards) = card; N(note) = note; Det(a) = a
NP := Det? Num? Adj* N
Coordination marker := and
Input: two red cards and a note
Result: [{quantity: 2, modifiers: [red], kind: card},
         {determiner: a, modifiers: [], kind: note}]
```

Quantity 2 and modifier red belong only to cards; the note is a separate noun group. Source token positions must map back to character positions in `std.request.source`. Finding both nouns is insufficient if ownership or quantity is lost when the request circuit is assembled.

With that grammar, “two red cards except a note” leaves `except` unbound. The reader must preserve the unsupported relationship; executing only the cards would silently drop a possible exclusion. Unrelated remarks may be ignored under the declared relevance policy, but a fragment that changes targets, quantity, negation or scope cannot be discarded as chatter.

A reader declares a computation budget and retains whether candidate enumeration was truncated. First place in a truncated list is not proof of unique meaning. It can still be the best usable reversible interpretation under the policy, with alternatives and uncertainty retained; the trace must not pretend the search was exhaustive.

## 10.3 Compunerea semantică, atașamentul și întinderea condițiilor

După analiză, regulile de compunere transformă fiecare arbore într-o descriere. Substantivul introduce o țintă; numărul produce o cerință asupra grupului acelei ținte; adjectivul produce o cerință asupra conceptului și țintei indicate de atașament; prepoziția produce o relație cu roluri explicite. Verbul introduce actul, iar cadrul său leagă ținta de rolul obiectului sau rezultatului. Fiecare regulă consumă un nod identificat și produce fire cu sursa acelui nod. Nu caută liber un cuvânt oriunde în mesaj pentru a umple o cheie globală.

Semantic composition proceeds bottom-up over a candidate structure. A noun group introduces a target with its source; a modifier adds a constraint owned by that target; a verbal frame assigns argument roles. Map declarations copy or combine typed child results. Missing required roles remain open. A mapping cannot silently null a negation or quantity just because the resulting request would be easier to execute.

De exemplu, o producție ilustrativă cu un copil pentru obiect și altul pentru însușire poate construi un obiect cu câmpurile `target` și `result`, copiind separat rezultatele celor doi copii. Dacă lexicul oferă două sensuri ale însușirii, cele două analize produc două rezultate candidate; funcția nu le contopește și nu alege prima ca intenție sigură. Dacă lipsește maparea unui copil sau trăsătura cerută, analiza este refuzată cu motivul păstrat. Materialul pur sintactic poate primi explicit o valoare nulă; autorul declarației răspunde pentru corectitudinea acestei alegeri, deoarece o asemenea mapare greșită poate elimina sens.

Lexicon providers, grammar productions and semantic mappings belong in language Worlds. A generic compiler checks mapping references, cycles, required fields and source ownership before producing a request graph. Different senses remain alternatives. Colour names such as “dark blue” stay source-backed concepts until knowledge resolves them to the tool representation; the presence of spaces in a value does not determine its type. Serialization preserves typed literals and references, preventing a string from introducing another wire or reference.

A verbal frame distinguishes the described subject from the requested result. “Move the note beside the heading” can describe a note already beside the heading or a new destination; the frame and attachment determine which. Generic template projection preserves these roles and source paths; it does not pick the frame merely because a particular tool is available.

Agreement conditions constrain which child meanings can combine: an adjective's concept must be applicable to the target kind, and a relational goal must fill the declared role. Conditions compare typed values and explicit paths. A missing path is different from a false comparison; neither can be replaced by a domain-specific guess in the mapping engine.

Egalitatea acestor condiții este structurală: ordinea câmpurilor unui obiect nu contează, ordinea elementelor unui tablou contează, iar numărul `1` nu este egal cu textul `"1"`. Nu este egalitate între concepte demonstrată prin ontologie și nu face conversii de unități. Toate declarațiile condițiilor sunt verificate înainte de a returna vreun candidat, inclusiv cele ale unor reguli nefolosite în mesajul curent. O declarație greșită nu poate fi ignorată numai pentru că arborele curent nu o vizitează. Lumea de cunoaștere alege ce concepte trebuie să coincidă; mecanismul execută aceeași comparație generală pentru fiecare producție.

Rezultatul compunerii este o valoare structurată, încă nevalidată ca cerere. Adapterul o transformă în firele `std.request` și verifică schema, conceptele, rolurile și referințele; această etapă nu este înlocuită de succesul compunerii. Intervalele originale pot fi copiate ca dovezi, fără modificarea arborelui sursă. Bugetul și adâncimea sunt limitate, iar epuizarea bugetului păstrează explicit caracterul incomplet al rezultatelor. Coordonarea specială a analizorului nu primește implicit o semantică: până la o mapare suportată, ea este refuzată. Astfel, publicarea mecanismului nu declară deja implementate toate construcțiile engleze din acest capitol.

Pentru „make two red cards and a note”, coordonarea din exemplul sintactic produce două ținte ale actului de creare. Grupul de carduri primește cantitatea 2 și culoarea red; grupul notei primește cantitatea 1 din determinantul singular. Sursa fiecărei cerințe rămâne fragmentul care a introdus-o. Transformarea nu aplică red notei și nu interpretează numărul 2 ca număr total al tuturor rezultatelor. Acestea sunt consecințe ale arborelui, nu reguli scrise pentru carduri.

| Structură a textului | Cum devine descriere și ce se păstrează |
|---|---|
| Număr în interiorul unui grup nominal | Constrângere de cantitate cu ținta acelui grup și `scope=group`. |
| Adjectiv al unui substantiv | Constrângere asupra conceptului lexical al adjectivului, de regulă cu `scope=each` pentru membrii grupului. |
| PP legat de obiect | Relație care restrânge referința sau descrierea obiectului; nu este automat destinația unei mutări. |
| PP legat de cadrul actului | Valoare pentru rolul de loc, timp, participant sau alt rol admis de cadru. |
| Coordonare de grupuri | Ținte separate și relația dintre ele; condițiile locale rămân locale. |
| Negare a unui cuantificator | Arbore logic al cuantificării, nu distribuirea negației peste fiecare obiect. |

For the two readings of “Move the note beside the heading”, rank frame, context and attachment evidence. If one gives a usable reversible move, carry it out and state which note and destination were chosen. Keep the alternative reading. A shorter parse or an executable tool binding alone is not evidence that the other reading is false.

Întinderea negației și a cuantificatorilor este reprezentată prin nodurile logice din secțiunea 10.3.1. Constrângerile simple rămân frunze ale acestei reprezentări, iar gruparea explicită păstrează diferența dintre negarea unei condiții și negarea cuantificării ei.

Verificarea semantică are loc în etape: tipurile și rolurile trebuie să fie coerente; referințele trebuie rezolvate sau marcate deschise; fiecare fragment cu efect asupra intenției trebuie acoperit; apoi se verifică realizabilitatea. O cerere imposibilă poate fi totuși citită corect. Lipsa unei capabilități trebuie raportată ca atare și nu este motiv suficient pentru a înlocui o intenție explicită cu alta, executabilă. Reformularea și recitirea pot detecta pierderi de informație, dar două componente care repetă aceeași eroare pot trece acest test; comparația cu interpretări independente rămâne necesară.

### 10.3.1 Noduri logice și legarea cuantificatorilor

Negation and quantification use an explicit logical graph. Leaves test target predicates; internal nodes compose truth values. Validation checks ownership, reachability and bound variables before evaluation. A well-formed graph is not automatically true, and truth in a candidate state is not an observed effect.

| Tipul | Câmpuri și semnificație |
|---|---|
| `std.request.not` | `request` referă cererea proprietară; `of` indică exact condiția negată. Inversează adevărat/fals și păstrează rezultatul nedeterminat. |
| `std.request.group` | `request` referă cererea proprietară; `operator=and` sau `operator=or`, cu `member` repetat. Combină membrii în aceeași întindere de variabile. |
| `std.request.quant` | `request` referă cererea proprietară; `kind=all`, `any`, `each` sau `none`; `target` este colecția, `bind` este ținta locală legată la fiecare membru, iar `body` condiția evaluată. |

`all` cere ca fiecare membru să satisfacă corpul; `any` cere existența cel puțin unui membru care îl satisface; `none` neagă această existență. `each` are aceeași condiție de adevăr ca `all`, dar păstrează distribuția cerinței și a dovezilor pe fiecare membru pentru planificare și explicație. El nu reprezintă încă o cantitate: „two for each section” cere o țintă de rezultate locală fiecărei secțiuni și o constrângere de cantitate în corpul cuantificatorului.

O țintă cu `mode=bound` nu caută singură un obiect în lume. Ea primește pe rând identitățile din colecția cuantificatorului care o leagă. Un cuantificator interior are propria legare; nu poate captura accidental ținta altuia. Cererea indică rădăcina prin `root`. Când aceasta există, toate condițiile și nodurile logice declarate trebuie să fie accesibile din ea; o condiție orfană, un ciclu, o referință lipsă ori o țintă legată folosită în afara corpului său sunt erori de schemă. Cererile simple fără rădăcină explicită păstrează conjuncția condițiilor din secțiunea 6.3.2 numai dacă nu conțin noduri logice. Un graf cu `not`, `group` sau `quant` cere o rădăcină explicită. Grupurile sunt nevide. Fiecare țintă legată are un singur cuantificator; numele sau determinantul unei căutări independente nu pot fi puse pe o țintă `bound`.

Un nod poate fi partajat de mai multe ramuri, dar legările trebuie să fie valabile pe fiecare cale care ajunge la el. Dacă o condiție despre membrul local al unui cuantificator apare și direct într-o ramură exterioară, graful este refuzat. În schimb, un cuantificator interior poate utiliza ținta legată de cuantificatorul exterior drept colecție, apoi introduce propria țintă locală distinctă. O legare nu este validă doar fiindcă o traversare a găsit-o mai întâi pe o cale convenabilă.

Request validation checks structure, ownership, reference types and variable scope. It does not resolve a name, interpret a concept's measurement or establish a population's completeness. Those are separate internal compiler obligations with evidence retained at each boundary.

Să comparăm „do not move all the notes” cu „do not move any note”. Colecția de note este rezolvată din aceeași stare de referință. Predicatul frunză spune că nota a fost mutată în pasul curent: la verificarea candidatului se citește diferența planificată, iar după execuție diferența observată și dovada operației. Nu înseamnă că nota a fost vreodată mutată în istoria ei. `concept=change operator=occurred act=place phase=result value=true` represents this event predicate.

```sop
@source.notes std.request.source text="do not move all the notes"
@request.notes std.request act=place mood=do source=$source.notes root=$not.all
@notes std.request.target request=$request.notes mode=existing kind=note determiner=definite
@member std.request.target request=$request.notes mode=bound
@moved std.request.constraint request=$request.notes target=$member concept=change operator=occurred act=place phase=result value=true polarity=positive character=requirement source=$source.notes
@all std.request.quant request=$request.notes kind=all target=$notes bind=$member body=$moved
@not.all std.request.not request=$request.notes of=$all
```

| Etapa primei cereri | Interpretarea păstrată |
|---|---|
| Rezolvarea colecției | Se identifică notele la care se referă omul, cu versiunea stării și acoperirea colecției. |
| Evaluarea corpului | Pentru fiecare notă se verifică dacă pasul o mută. |
| Cuantificarea | `all` este adevărat numai dacă toate notele sunt mutate. |
| Negația exterioară | `not.all` cere ca nu toate să fie mutate. Nu cere singur să fie mutată măcar una. |

Pentru a doua cerere se păstrează țintele și predicatul, dar se schimbă sursa și rădăcina; nodurile `all` și `not.all` sunt retrase și înlocuite de `any` și `not.any`. Blocul următor descrie această versiune alternativă, nu declarații care se concatenează cu versiunea precedentă folosind aceiași identificatori.

```sop
@source.notes std.request.source text="do not move any note"
@request.notes std.request act=place mood=do source=$source.notes root=$not.any
@notes std.request.target request=$request.notes mode=existing kind=note determiner=definite
@member std.request.target request=$request.notes mode=bound
@moved std.request.constraint request=$request.notes target=$member concept=change operator=occurred act=place phase=result value=true polarity=positive character=requirement source=$source.notes
@any std.request.quant request=$request.notes kind=any target=$notes bind=$member body=$moved
@not.any std.request.not request=$request.notes of=$any
```

| Etapa celei de-a doua cereri | Interpretarea păstrată |
|---|---|
| Colecția și corpul | Aceleași note și același predicat de mutare în pasul curent. |
| Cuantificarea | `any` este adevărat când cel puțin o notă este mutată. |
| Negația exterioară | `not.any` cere să nu fie mutată nicio notă; este echivalent cu `none` asupra aceluiași corp. |
| Consecința pentru plan | Orice candidat care mută măcar o notă este respins de această cerință. |

Cu trei note identificate, mutarea a două satisface „not all”, dar nu „not any”. Mutarea tuturor nu satisface niciuna; mutarea niciuneia le satisface pe amândouă. O interdicție singură nu autorizează alegerea arbitrară a unor note de mutat. Ea poate restrânge un plan deja discutat; dacă omul dorește o mutare parțială, selecția și destinația trebuie rezolvate din cerere sau context. Propoziția negativă nu este executată ca un imperativ pozitiv doar fiindcă firul cererii numește actul `place`.

Evaluarea folosește adevărat, fals și nedeterminat. `and` este fals când un membru este fals și adevărat când toți sunt adevărați; `or` este adevărat când un membru este adevărat și fals când toți sunt falși; altfel rezultatul este nedeterminat. Pentru o colecție incomplet citită, `all` nu devine adevărat doar fiindcă toate elementele încărcate trec; un contraexemplu cunoscut îl poate face fals. `any` poate fi adevărat printr-un martor cunoscut, dar absența unui martor nu îl face fals fără acoperire completă. Negarea nu transformă o citire incompletă în dovadă.

Pe o colecție demonstrabil goală, semantica logică este `all=true`, `any=false`, `none=true`. Separat, referința hotărâtă a omului poate presupune existența unor note; acea problemă se rezolvă înainte de planificare, fără a prezenta adevărul pe mulțimea goală ca realizarea cererii. Astfel, logica și conversația folosesc reguli explicite diferite, fără excepții ascunse în cuantificator.

## 10.4 Reader coverage and evaluation

Reader evaluation separates recognition, graph construction, instance resolution and concrete effects. For each failure retain the source, expected roles, produced graph and first incorrect transformation. A new mechanism must cover a family of constructions and counterexamples, not a list of whole sentences.

| Reader result | Continuation |
|---|---|
| Unknown fragment outside the task | Preserve its source and record why relevance policy excludes it. |
| Unknown fragment in a required semantic role | Keep that role open; try compatible lexical or contextual candidates with evidence. Never erase a negation or second object to claim success. |
| Several plausible meanings | Rank compatible hypotheses; act on a usable reversible one with concrete uncertainty and undo. Retain alternatives. |
| Missing location, size or style | Elaborate from applicable schema and knowledge defaults and constraints; report meaningful assumptions. |
| Explicit requirement conflicts with a hard constraint | Preserve both; explain the concrete conflict and retain a feasible alternative without silently changing the requirement. |
| Search budget exhausted | Report the best usable result and its uncertainty, or the exact unresolved obligation. Do not claim impossibility from timeout. |

SOP-BERT predicts candidate semantic structure, not domain-specific renderer keys. A span may contain several words; source offsets recover the substring from the original message. Coordination requires multiple target records, shared-act ownership and local constraints. “Draw a tree and a house” and “draw a tree near the house” therefore require different graphs even if they contain the same object words. Model predictions, generic graph decoding and world-based elaboration are separately inspectable boundaries.

Datele de pregătire cuprind mesaje tastate efectiv, etichetate cu descrierea generală și intervalele justificative, completate cu variante generate. Etichetele sunt revizuite independent de cititorul existent; altfel modelul ar învăța tocmai cheile și omisiunile pe care încercăm să le înlocuim. Variantele aceleiași expresii și întreaga familie de reformulări rămân în aceeași partiție. Separarea pe domenii testează transferul, iar separarea pe familii de formulări testează citirea unor construcții nefolosite la pregătire. Mesajele păstrate pentru acceptare nu sunt utilizate ulterior la ajustare fără înlocuirea explicită a setului de evaluare.

| Etapa acceptării | Ce se măsoară sau se verifică |
|---|---|
| Fidelitatea descrierii | Act, mod, ținte, condiții, negație și cuantificare față de eticheta revizuită, nu doar validitatea schemei. Fiecare condiție explicită citează cuvintele care o susțin; completările din context au proveniență separată. |
| Rezolvarea în instanță | Referenți și sensuri candidate, roluri obligatorii, condiții păstrate și explicația eventualei imposibilități. Acordul vechiului cititor nu este criteriu de admitere. |
| Comparația cu sistemul de referință | Pe aceleași mesaje și stări, more correct usable effects, with wrong effects, undo and uncertainty reported separately, inclusiv în sesiunile reale ale utilizatorului. Se raportează separat clarificările, abținerile și regresiile pe cererile anterior corecte. |
| Transferul | Rezultate separate pentru domenii și familii de formulări ținute deoparte; un câștig agregat nu ascunde un domeniu deteriorat. |
| Activarea | Versiunile modelului, datelor, politicii și rezultatele verificării sunt fixate împreună. Dacă poarta nu este trecută, componenta rămâne în evaluare, iar cazurile pierdute ghidează următoarea revizie. |

Compare candidates message by message under the same initial state. Report improvements and regressions, including unnecessary abstentions, wrong effects, assumption quality and successful undo. Small reversible mistakes are acceptable under the application policy; their frequency and consequences remain measured. A higher aggregate score cannot hide that an entire request class stopped working. Complete dialogues are evaluated through their resulting state trajectories because early choices change later references.

Numărul de execuții greșite se măsoară atât ca număr de cazuri, cât și raportat la efectele încercate, pe un set fixat în avans. Mai puține abțineri nu constituie progres dacă sunt înlocuite de acțiuni incorecte. O evaluare fără erori observate nu este o garanție universală: verificările la fiecare cerere rămân active și după acceptare. Model selection follows the declared application policy; evaluation does not replace that policy with an implicit refusal-first objective.

Un model poate produce o cerere perfect validă pentru o intenție pe care omul nu a exprimat-o. Verificatorul lumii poate constata că obiectele există și acțiunea este permisă, fără să poată demonstra că tocmai acea acțiune a fost cerută. De aceea proveniența lexicală, comparația interpretărilor și clarificarea rămân necesare. O creștere numai pe reformulări generate din aceleași cadre nu justifică înlocuirea cititorului pe mesaje reale.

# 11. Cunoașterea necesară: conținut, proveniență și acoperire

Un mecanism general nu poate înlocui informația despre lucrurile cu care lucrează. O regulă de moștenire poate căuta un strămoș, dar trebuie să existe arborele felurilor; un planificator poate păstra părți obligatorii, dar cineva trebuie să declare acele părți. A spune că informația „vine din cunoaștere” este suficient numai dacă putem identifica declarațiile, sursele și limitele lor. Acest capitol stabilește ce trebuie să conțină un pachet utilizabil și cum se deosebește o bază mare de una suficientă pentru operațiile promise.

## 11.1 Pachetul minim este închis pe dependențe

Pachetul minim se stabilește pornind de la capabilități și de la familiile de probleme pe care aplicația declară că le rezolvă. Pentru fiecare concept expus, se urmăresc dependențele până când toate operațiile necesare au intrări cunoscute: felul, părinții relevanți, spațiile, regiunile, rolurile și realizările cerute. Aceasta este închiderea pe dependențe. Nu cere încărcarea tuturor cunoștințelor despre lume; cere ca un concept oferit utilizatorului să nu se termine într-o trimitere lipsă tocmai în timpul planificării.

| Componentă comună | Ce trebuie să poată afla sistemul din ea |
|---|---|
| Feluri și specializări | Identitatea conceptului, părinții și sensul fiecărei legături; distanțele se folosesc numai prin metrica declarată. |
| Vocabular conceptual | Formele engleze ale conceptelor, sensurile și sursa lor; categoriile gramaticale și construcțiile generale aparțin lumii limbii. |
| Spații și regiuni | Axe, unități, repere, domenii și definițiile regiunilor; un nume de culoare fără coordonate nu este încă o regiune calculabilă. |
| Structuri de întreguri | Rolurile părților, cardinalitățile și relațiile dintre ele; ce este obligatoriu se distinge de ce este doar obișnuit. |
| Relații funcționale | Ce parte susține, conține sau atașează alt obiect și în ce condiții; o simplă relație „parte din” nu identifică automat acel rol. |
| Valori obișnuite și preferințe | Contextul în care se aplică, caracterul lor modificabil și proveniența; nu sunt legi tari despre toate instanțele. |
| Realizări și capabilități | Ce reprezentare poate produce unealta, cu ce parametri și ce limitări; un concept cunoscut poate rămâne nerealizabil. |
| Surse și versiuni | De unde provine fiecare afirmație, transformarea care a produs-o și versiunea la care a fost verificată. |

De exemplu, faptul că o scrisoare are o semnătură nu precizează cine semnează. Structura declară rolul; identitatea semnatarului poate veni din instanță sau din cerere. Dacă lipsește, mecanismul de completare nu are voie să inventeze o persoană doar pentru a închide graful. O dependență poate fi rezolvată și printr-o întrebare explicită, dacă aceasta face parte din capabilitatea declarată.

Acoperirea se păstrează separat pentru recunoaștere, raționament și realizare. Sistemul poate recunoaște un fel și răspunde din cunoaștere despre el fără să-l poată desena. Poate avea o imagine fără să cunoască părțile ei editabile. Aceste stări trebuie declarate; nici existența unui cuvânt, nici existența unui fișier grafic nu implică întreaga capabilitate.

## 11.2 Knowledge required by the application areas

Pachetul comun este reutilizat între domenii. Un domeniu adaugă numai structurile și legăturile specifice operațiilor sale. Tabelul descrie minimul semantic pentru familiile de operații ale cărții, nu un inventar al tuturor obiectelor despre care poate vorbi un om. Un produs trebuie să declare separat ce feluri și ce operații acoperă concret.

| Domeniu | Cunoașterea indispensabilă și limita acoperirii |
|---|---|
| Desen | Feluri reprezentabile, realizări proprii ori moștenite, părți editabile, relații de susținere/conținere, întinderi și straturi, culori și proporții obișnuite. Fără rolul părții de sprijin, o verificare geometrică nu poate decide locul funcțional potrivit. |
| Diagrame | Feluri de noduri și legături, structuri de graf, roluri de început/sfârșit, ordine, forme și reguli de așezare. Un desen frumos al unui graf nu dovedește corectitudinea relațiilor lui. |
| Documente | Genuri, structura secțiunilor, roluri de conținut, regiuni de lungime și ton, proceduri de măsurare a tonului cu incertitudine, plus afirmațiile despre subiect cu sursele lor. Un șablon de scrisoare fără informații despre subiect produce structură, nu conținut factual justificat. |
| Avatar | Editable part identities, attachment and proportion constraints, template compositions, mappings from expression/style concepts to feature parameters, and measurement uncertainty. A named emotion is not a primitive instruction. |
| Calendar | Tipuri de evenimente și resurse, durate, disponibilitate, relații temporale, repere și grupuri numite. Persoanele, întâlnirile și disponibilitatea curentă sunt date ale instanței; nu se deduc dintr-o bază generală. |

Aceste dependențe produc diferențe practice. O relație temporală poate fi verificată exact după citirea completă a rezervărilor relevante, pe când tonul unui document este măsurat pe axele declarate, cu procedură, dovezi textuale și incertitudine, conform secțiunii 6.8.1. Dacă intervalul măsurării traversează frontiera regiunii cerute, rezultatul rămâne nedeterminat; aceasta este o proprietate a măsurării concrete, nu o excludere a tonului din mecanismele de verificare. În desen, geometria unei părți poate fi disponibilă fără ca numele ei semantic să fie cunoscut. Pachetul nu ascunde aceste diferențe sub o singură etichetă „concept suportat”.

Datele obligatorii ale instanței nu trebuie confundate cu cunoașterea generală. O sursă generală despre sărbători are nevoie de regiune și interval de valabilitate; nu spune automat ce zile sunt nelucrătoare pentru o persoană. Dacă o excepție cerută nu poate fi verificată, cererea rămâne incompletă. Absența sursei nu autorizează eliminarea excepției din plan.

Pentru reutilizare, o relație sau un rol se declară la cel mai general nivel justificat de date. „Suprafața de sprijin a unui obiect” este reutilizabilă; o instrucțiune pentru o singură propoziție a utilizatorului nu este. Totuși, faptele particulare sunt legitime: că o anumită piesă este suprafața de sprijin a unui anumit fel este tocmai informația de domeniu de care regula generală are nevoie.

## 11.3 Surse și transformări

Există trei căi principale de alimentare: declarații redactate de autori, importuri din surse externe și fapte introduse sau învățate în instanță. Ele pot folosi aceeași schemă, dar nu au aceeași autoritate. O afirmație generală importată, o aproximare editorială și o preferință a unui utilizator trebuie să rămână deosebite după îmbinare. Un scor de încredere nu înlocuiește proveniența și nu transformă automat o preferință într-un fapt universal.

| Calea de alimentare | Ce se păstrează și ce nu se presupune |
|---|---|
| Redactare explicită | Autorul, motivul, contextul și exemplele de verificare; valorile alese ca ipoteze de lucru sunt marcate astfel. |
| Import determinist | Identitatea și versiunea sursei, înregistrarea originală, maparea către schema locală și transformările aplicate. Repetarea importului pe aceeași intrare trebuie să dea aceleași fire. |
| Deducție din alte fapte | Regula și premisele cu versiunile lor; concluzia este retrasă sau reverificată când suportul se schimbă. |
| Predicție ori etichetare de model | Modelul sau procedura, intrarea și statutul de candidat verificat sau neverificat; numele unei clase prezise nu este adevăr garantat. |
| Învățare locală | Utilizatorul sau episodul, instanța și domeniul de aplicare; promovarea către cunoaștere comună cere o decizie separată. |

Un import de relații de tip „parte din” poate furniza candidați pentru structura unui obiect. Nu furnizează automat cardinalități obligatorii, geometrie și roluri de susținere. Aceste informații cer surse suplimentare sau redactare verificată. În mod similar, o listă de nume de culori poate completa lexicul, dar nu stabilește singură frontierele regiunilor de culoare.

Înainte de folosirea și redistribuirea unei surse se consemnează condițiile aplicabile exact versiunii preluate, atribuirea și transformările permise. Faptul că un fișier este accesibil public nu dovedește că poate fi republicat. Verificarea aparține importatorului și reviewerului sursei; cartea nu declară o licență potrivită pentru un set de date fără analiza lui. Importurile cu condiții diferite își păstrează proveniența și separarea necesară distribuirii.

O etichetă produsă de model poate economisi redactare, dar trebuie verificată tocmai la frontierele care schimbă comportamentul: roluri obligatorii, imposibilități, relații folosite pentru acțiuni și atribuiri de sens. Verificarea unui eșantion poate estima calitatea lotului; nu dovedește că fiecare fapt rămas este corect. Faptele cu efect critic cer o verificare potrivită consecinței lor sau rămân propuneri slabe.

### 11.3.1 Surse concrete și alegerea informației utile

Sursele se aleg după relația de care avem nevoie. Un lexic poate lega numele de un sens, o adnotare de imagine poate susține o observație spațială, iar o bază de bun-simț poate sugera o utilizare obișnuită. Niciuna nu este preluată ca autoritate universală asupra tuturor familiilor din secțiunea 11.1. În tabel, restricțiile de utilizare sunt reguli de proiectare a importului: ele arată ce nu trebuie dedus numai din tipul informației disponibile.

| Sursa candidată | Contribuția și verificarea înainte de folosire |
|---|---|
| [Princeton WordNet](https://wordnet.princeton.edu/front) — licență de verificat de importator pentru versiunea preluată | Grupurile de sinonime pe sensuri (synsets), hiperonimele și relațiile parte–întreg alimentează vocabularul, felurile și candidații pentru structuri. Se păstrează identitatea sensului și tipul relației. O parte lexicală nu stabilește singură cardinalitatea obligatorie, suprafața de sprijin sau geometria editabilă. |
| [Visual Genome](https://visualgenome.org/api/v0/api_readme) — licență de verificat de importator pentru fiecare artefact preluat | Obiectele, atributele, relațiile și descrierile regiunilor pot alimenta observații despre scene și exemple de relații precum on/in/has. Se păstrează imaginea, obiectele, regiunea și predicatul original. O casetă de încadrare în pixeli nu este o regulă geometrică generală sau un contur editabil; o observație într-o imagine nu devine o obligație pentru toate obiectele acelui fel. |
| [ConceptNet](https://github.com/commonsense/conceptnet5/wiki/Relations) — licență de verificat de importator pentru subsetul preluat | Relații precum PartOf, HasA, UsedFor și CapableOf oferă candidați pentru părți, utilizări și comportamente obișnuite. Se verifică sensurile și orientarea relației, fără a trata o pondere ca probabilitate a adevărului. HasA poate exprima și posesie, iar IsA poate include instanțe: maparea nu le transformă automat în parte structurală, respectiv specializare de fel. |
| Depozitul existent `sop-knowledge-worlds` — licență de verificat de importator pe sursele și fragmentele reutilizate | Oferă deja vocabular, relații, scene, părți și realizări, inventariate în secțiunea 11.5. Catalogul și câmpurile de proveniență permit localizarea subsetului. Încărcarea fără erori de schemă nu dovedește că relațiile satisfac noul contract conceptual. |

Importatorul începe cu o obligație concretă din inventar, alege înregistrările care o pot susține și scrie maparea sensurilor și a relațiilor. Pentru o relație de sprijin, o adnotare on este un candidat de verificat: poate desemna contact, acoperire sau o expresie care cere alt sens. Reviewerul verifică obiectele și contextul înainte de a o admite drept sprijin funcțional. Geometria și partea care suportă greutatea se adaugă prin declarații sau măsurări justificate; nu rezultă doar din asemănarea cuvântului.

Pe aceeași cale, un nume de fel apropiat nu este suficient pentru transfer. Relația parte–întreg și relația de specializare rămân distincte, iar o observație frecventă se păstrează ca valoare obișnuită, cu context și proveniență. Numai după verificare poate alimenta completarea. Cerințele obligatorii au nevoie de o justificare separată; majoritatea observațiilor dintr-un lot nu stabilește necesitatea unei proprietăți.

For each source, inspect the exact source description, importer and admitted facts together. A source name does not imply that all its relation families were imported. Conversely, an old note about a missing download does not establish the present contents. Import descriptions state the included families and transformations so the system can justify actual semantic reads.

Condițiile surselor se verifică pentru artefactul exact: adnotări, imagini și rezultate derivate nu sunt presupuse interschimbabile. Referințele de mai sus identifică surse și formate de cercetat; nu autorizează un import nou și nu declară că toate componentele lor pot fi redistribuite în același mod. Informația admisă urmează lanțul de proveniență explicat în secțiunea următoare.

### 11.3.2 Un fapt importat și lanțul lui de proveniență

An imported assertion and its provenance are distinct facts. The following toy example uses `std.knowledge`, which imports `std.provenance`, `std.source` and `std.import`. It illustrates an authored table, not a claim about a real external record. `duck` and `bird` are conceptual vocabulary names whose semantic identity must be resolved separately from structural validation.

```sop
@source.toy std.source name=toy.kind.table version=1 status=illustrative
@map.kind std.import.mapping name=kind.parent version=1
@origin.duck std.provenance source=$source.toy record=duck.row mapping=$map.kind
@fact.duck std.knowledge.parent child=duck parent=bird provenance=$origin.duck status=candidate
```

Modulele resping câmpurile structurale lipsă, cheile nedeclarate, cardinalitățile greșite și referințele care nu indică tipul cerut. Ștergerea unei surse încă referite este refuzată tranzacțional. `std.source` cere name, version și status (`illustrative` sau `published`); license, url și digest sunt metadate opționale. `std.import.mapping` cere name și version; description și digest pot explica transformarea. `std.provenance` cere source, record și mapping. `std.knowledge.parent` cere child, parent, provenance și status (`candidate`, `accepted` sau `rejected`). Aceste stări descriu înregistrarea; biblioteca nu promovează automat un candidat. Încărcarea corectă nu verifică licența, adevărul relației ori adecvarea mapării: verificarea publicării și evaluarea semantică rămân distincte.


Primul fir fixează versiunea sursei. Al doilea identifică transformarea aplicată, care trebuie să poată fi regăsită și repetată; numele singur nu înlocuiește definiția mapării. Al treilea leagă o înregistrare originală de acea transformare. Ultimul exprimă relația conceptuală obținută și păstrează legătura cu dovada. `candidate` nu înseamnă fals, ci încă neadmis în cunoașterea activă. Reviewerul verifică sensul relației, identitatea conceptelor și condițiile sursei înainte de admitere.

Two independent sources for the same relation provide two pieces of evidence, not two ducks or two semantic relationships. Retracting a source revalidates dependent conclusions; remaining independent evidence can still support them. Reproducible provenance does not prove truth: a perfectly repeatable importer can faithfully reproduce a false statement.

## 11.4 Cine verifică și ce înseamnă acceptarea

Verificarea are niveluri distincte. Încărcarea fără erori demonstrează compatibilitatea cu schema, nu adevărul semantic al datelor. O schemă poate accepta două roluri inversate; un desen poate avea coordonate valide și părți denumite greșit. De aceea acceptarea unui pachet combină verificarea mecanică, citirea semantică și folosirea în probleme independente de exemplele care au motivat redactarea.

| Responsabilitate | Dovada cerută |
|---|---|
| Autorul sau importatorul | Sursă identificabilă, mapare explicabilă, ieșire reproductibilă și diferența față de versiunea precedentă. |
| Verificatorul de schemă | Tipuri, unități, cardinalități, referințe și restricții valide; lipsurile sunt raportate, nu completate prin etichete arbitrare. |
| Reviewerul semantic | Sensul relațiilor, caracterul tare sau obișnuit, excepțiile și coerența cu sursa; corectitudinea nu se reduce la faptul că un exemplu trece. |
| Autorul adaptorului | Capabilități și limite reale pentru datele oferite: ce părți poate modifica, ce poate măsura și ce nu poate verifica. |
| Usage evaluation | New requests and minimal pairs, uncertain reversible choices, explicit constraint conflicts and undo; repeated success on the same wording is insufficient. |

Un pachet devine activ numai cu dependențele necesare rezolvate și cu acoperirea declarată. O sursă încă neîncărcată se deosebește de o afirmație absentă într-o sursă completă. Dacă un shard lipsește temporar, sistemul nu deduce că obiectul nu există în catalog. Dacă două surse se contrazic, conflictul rămâne vizibil; alegerea unei surse trebuie justificată prin domeniu, versiune sau autoritate, nu prin ordinea accidentală a încărcării.

Când un concept se schimbă, se reverifică atât utilizările directe, cât și regulile care moștenesc proprietăți de la el. O parte devenită opțională poate schimba completarea multor întreguri; o regiune de culoare modificată poate schimba selecția obiectelor. Versionarea permite reproducerea explicației vechi, iar actualizarea nu rescrie dovezile unei execuții anterioare.

## 11.5 Inventarul existent și măsurarea acoperirii

Volumul se măsoară pentru un profil de capabilități și un vocabular declarat. Mai întâi se identifică lucrurile, părțile, însușirile și relațiile cerute; apoi se caută declarațiile care le pot susține. Numărul punctelor din contururi se păstrează separat de relațiile semantice. Altfel, un desen detaliat poate părea o bază bogată de cunoaștere, deși nu spune care parte susține un obiect.

Un inventar concret, extras din sesiunile de desen, diagrame și documente folosite la verificarea proiectului, arată următoarele cerințe. El este un punct de pornire măsurabil, nu un plafon al vocabularului. Calendarul cere în plus datele și relațiile descrise în secțiunea 11.2; sesiunile respective nu măsoară acoperirea lui.

| Familie de cerințe | Conținut care trebuie legat de declarații |
|---|---|
| Feluri și personaje | Duck, bird, child, grandfather, girl, robot, man, boy, woman și frog; diferențele dintre feluri trebuie păstrate și în realizare, nu numai în nume. |
| Întreguri și părți | Swing/seat, flower/petal, hair/beard, story/chapter/narrator; existența unei părți, rolul ei funcțional și posibilitatea de editare sunt cerințe distincte. |
| Scenă și întinderi | Grass, lake, pond, water, sky, ground, cloud, sun, house, fish și water plant; nivelurile numite trebuie să aibă întindere și ordine. |
| Diagrame și documente | Node, arrow, hexagon, circle și letter; forma de așezare nu este același lucru cu felul fiecărui nod, iar numele unui document nu îi furnizează conținutul. |
| Însușiri și relații | Verde, galben, azuriu, păr creț, expresie tristă/surprinsă; deasupra, aproape, înăuntru, pe suprafața de sprijin, primul/ultimul, mai sus/jos și păstrarea unei valori. Fiecare cere spațiu, reper sau relație declarată, nu doar un cuvânt recunoscut. |

An inventory is indexed by semantic family, source World, schema and tool dependency. It reports availability separately from actual use: a catalog entry is not evidence that reasoning consulted it. A loaded World can contain facts that are irrelevant to a particular request. The trace names the facts and rules actually read or activated.

| Coverage obligation | Concrete check |
|---|---|
| A drawable tree | Resolve the requested kind, find its editable representation and part roles, fill tool arguments and observe creation. A word or static image alone is insufficient. |
| A chapter | Resolve the document/section schema, parent and order policy; create and observe that section. A lexical search for the word chapter is not a semantic coverage test. |
| A chart of calendar events | Establish the event population and interval coverage, aggregate unique identities, map values through the chart method and observe the resulting nodes. |
| A happier avatar | Resolve editable parts and expression-to-feature rules; observe changed features and retain any expression measurement uncertainty. |
| A reused relation family | Exercise the same relation and reasoning mechanism across different kinds and contexts; acceptance examples do not define the whole imported family. |

Counts of wires, geometry points and vocabulary entries measure different things and must not be summed as “intelligence”. Knowledge is usable for a capability only when dependencies close through schemas, inference and concrete tool bindings. A lexical miss does not prove a missing concept: it may be represented by a role, synonym or another property. Search and execution evidence must settle that distinction.

Măsurarea de acoperire urmărește apoi pentru fiecare familie de probleme dacă lipsa apare la recunoaștere, descriere, referință, cunoaștere, realizare sau verificare. Se păstrează și rezultatele corecte de clarificare. Adăugarea unui catalog de nume poate îmbunătăți recunoașterea fără să câștige vreo execuție; raportul trebuie să arate acest lucru.

# 12. Parametrii numerici: origine, calibrare și stabilitatea deciziilor

Distanțele și costurile fac alegerile comparabile numai dacă numerele au o semnificație declarată. O pondere aleasă pentru a obține răspunsul dorit într-un singur exemplu poate ascunde aceeași regulă particulară pe care voiam să o eliminăm din program. Scopul acestui capitol este să arate cine stabilește un număr, la ce nivel se aplică și prin ce probe se verifică efectul lui. Parametrii sunt date versionate ale proiectului, nu constante fără sursă.

## 12.1 Numere cu roluri diferite

Înainte de a calcula, sistemul clasifică sursa și rolul valorii. Numărul măsurat descrie starea; limita cerută definește rezultatul dorit; normalizarea definește scara comparației. Ele pot apărea în aceeași formulă fără să devină interschimbabile. În particular, schimbarea unei ponderi de optimizare nu poate modifica o limită exactă a cererii.

| Categoria | Unde se declară și de unde vine |
|---|---|
| Măsurare | Pe observație, cu unitate, reper, procedură și versiunea stării; exemplu: distanța efectivă dintre contururi. |
| Cerință numerică | Pe cererea și ținta ei, cu sursa în mesaj; exemplu: cel puțin o anumită distanță, nu o limită permanentă pentru toate obiectele. |
| Conversie de unități | În definiția unității și transformării; schimbarea reprezentării nu trebuie să schimbe rezultatul fizic. |
| Normalizare | Pe axa sau metrica spațiului, cu populația ori convenția geometrică de referință; permite compararea unor diferențe. |
| Toleranță | Pe politica de aproximare aplicabilă și, când este cazul, pe cerere; exprimă abaterea permisă, nu probabilitatea că rezultatul este adevărat. |
| Pondere de cost | Pe obiectivul declarat; exprimă o preferință între candidați deja valizi. |
| Pas comparativ | Pe axă și tipul scării; stabilește schimbarea implicită pentru un comparativ fără cantitate explicită. |
| Valoare învățată | În instanță sau profilul declarat, cu episodul și contextul; nu modifică automat politica tuturor utilizatorilor. |

Un număr se declară o singură dată la cel mai general nivel unde are același sens. Reutilizarea nu cere ca toate domeniile să aibă aceeași valoare: un pas de timp și un pas de poziție au unități și efecte diferite. O particularizare numește politica pe care o înlocuiește și contextul ei; nu copiază o constantă în fiecare regulă. Cerința explicită rămâne separată și are prioritate în problema curentă.

## 12.2 Stabilirea scării unei distanțe

Pentru o axă liniară, diferența normalizată este diferența brută împărțită la o lungime pozitivă de referință. Dacă axa are limite finite care definesc domeniul de comparație, lungimea poate fi amplitudinea lui. Dacă nu are un plafon semnificativ, autorul spațiului declară o mărime tipică, rezultată dintr-o convenție geometrică sau dintr-un eșantion de referință. Eșantionul se fixează înainte de verificarea cazurilor țintă; nu se schimbă după fiecare mesaj pentru a-l face să treacă.

Să presupunem că o pagină folosește obiecte de referință cu lățimea mediană de 10 unități. Autorul spațiului poate declara normalizarea 10 pentru a exprima diferențele în raport cu această scară geometrică. Aceasta este o ipoteză ilustrativă explicită, nu o valoare universală pentru desen. Regula de alegere este „lățimea mediană a obiectelor din setul de referință declarat”, iar setul și versiunea lui sunt păstrate. Dacă mediana este zero sau setul lipsește, calculul nu inventează numitorul: se definește reperul lipsă înainte de activarea politicii.

| Normalizare pentru aceeași diferență brută de 4 | Distanță și efect asupra unei toleranțe de 0,5 |
|---|---|
| 1 | Distanța este 4; diferența depășește toleranța. |
| 10 | Distanța este 0,4; diferența este în toleranță. |
| 1000 | Distanța este 0,004; diferențe fizice mult mai mari ar putea fi acceptate sub aceeași toleranță. |

Tabelul arată de ce normalizarea și toleranța se revizuiesc împreună. Numitorul nu este doar un artificiu pentru a obține numere mici. Într-o cerere de tip „cel puțin 12”, însă, candidatul cu distanța 8 încalcă limita indiferent de normalizare: toleranța de selecție nu relaxează automat cerința exactă. Pentru conversia în altă unitate, atât diferența, cât și normalizarea se convertesc; raportul trebuie să rămână neschimbat.

Pe un graf de feluri, o muchie de specializare poate avea un cost inițial uniform numai ca politică explicită. Numărul de muchii depinde de felul în care a fost redactată taxonomia: introducerea unui nod intermediar nu trebuie să facă două concepte semantic mai îndepărtate fără o decizie. O migrare poate conserva costul total al drumului prin împărțirea costului vechi între muchiile noi, ori poate recalibra metrica și reverifica selecțiile afectate. Distanța grafică nu înlocuiește filtrele de identitate sau proveniență.

### 12.2.1 Declararea reperului de normalizare

The clearance axis can derive its normalisation from an explicit reference sample. This invented sample is in page units and measures width. Independent samples retain distinct identities, including when their values are equal. Load the `std.reference` schema for the following declarations.

```sop
@sample.width.a std.reference.sample value=8 unit=page.unit
@sample.width.b std.reference.sample value=10 unit=page.unit
@sample.width.c std.reference.sample value=12 unit=page.unit
@reference.widths std.reference.set version=1 property=width unit=page.unit member=$sample.width.a member=$sample.width.b member=$sample.width.c
```

The sample values 8, 10 and 12 have median 10. The generic median algorithm sorts the finite values and selects the middle value, averaging the two central values for an even count without overflowing intermediate arithmetic. Duplicate member references do not increase sample size; distinct observations with equal values do. Unit consistency is checked before calculation, and a nonpositive normalisation is rejected.

The calibration retains the exact sample identities, values, units, sources and definition version. Published evidence is a fixed revision: later changes to source measurements create another calibration rather than rewriting the meaning of an old explanation. The consuming axis records which calibration and unit conversion it uses. A version label alone does not make mutable data immutable or prove the measurements authentic.

```text
Pseudocode — calibration and its consumer
reference: widths at a fixed revision, values [8, 10, 12] page units
method: median
result: 10 page units
consumer: clearance axis normalisation
reuse condition: matching calibration revision, unit and declared frame
```

## 12.3 Toleranțe și pași comparativi

Toleranța se stabilește pentru o familie de substituții care păstrează intenția. Se pornește de la perechi de rezultate judecate ca acceptabile sau neacceptabile în contexte declarate, nu de la dorința de a executa cât mai multe comenzi. Se verifică separat cererile exacte, cele regionale și cele comparative. Pentru o valoare cerută exact, permisiunea de aproximare este absentă chiar dacă două valori sunt foarte apropiate numeric.

Un pas comparativ este alegerea implicită când omul spune numai „mai mare” ori „mai târziu”. Pe o axă de raport poate fi multiplicativ; pe una de interval este o deplasare în unități. Factorul ilustrativ 1,25 din secțiunea 4.5.1 este o ipoteză de calibrare: trebuie evaluată prin ajustările necesare, depășiri și stabilitatea rezultatului, nu păstrată doar fiindcă a funcționat într-un exemplu. O cantitate explicită, precum „by 15 minutes”, înlocuiește pasul implicit; o mărime de interval cere și ancora păstrată, care trebuie declarată în contractul schimbării.

| Situația verificată | Ce trebuie să rămână adevărat |
|---|---|
| Pas pozitiv pe o axă orientată | Rezultatul merge în direcția cerută; limitarea la margine nu inversează sensul. |
| Cantitate explicită | Se folosește cantitatea spusă, după conversia unităților; nu se multiplică suplimentar cu pasul implicit. |
| Frontiera unei toleranțe | Cazurile imediat sub, la și peste frontieră au comportamentul definit de comparație. |
| Incertitudine a măsurării | Un interval ce traversează frontiera nu este redus la centrul lui pentru a pretinde certitudine. |
| Ajustare învățată | Schimbă politica numai în contextul și episodul autorizat; o cerință exactă ulterioară o poate înlocui. |

Calibrarea poate produce o politică diferită pentru contexte diferite când există dovezi pentru această diferență. Nu produce o regulă distinctă pentru fiecare propoziție din test. Dacă o familie are prea puține observații, parametrul rămâne o ipoteză explicită de proiectare și se caută date suplimentare; sistemul nu transformă lipsa datelor într-o limită de principiu a capabilității.

### 12.3.1 Politica de toleranță și factorul local învățat

A tolerance policy names its metric and scope. In this invented example the metric is absolute difference divided by normalisation 10, and the permitted bound is 0.5 for requests explicitly allowing regional approximation. Exact requirements cannot be relaxed by that policy. The following pseudocode describes the data responsibilities rather than defining new SOP types.

```text
Pseudocode — tolerance policy
metric: absolute difference / calibrated normalisation
bound: less than or equal to 0.5
application: regional approximation permitted by the request
exclusion: exact requirements
evidence: calibration revision and axis definition
```

Distanța este `abs(a−b)/10`, iar acceptarea cere să fie cel mult 0,5 și să fie permisă aproximarea în cererea concretă. Legătura cu versiunea calibrării împiedică folosirea aceleiași toleranțe pe o scară schimbată în tăcere. Politica nu anulează o limită fermă precum „cel puțin 12”.

Factorul învățat are altă proveniență: un episod local. Firele următoare înregistrează exact calculul din secțiunea 4.5.1, presupunând instanța `drawing` și obiectul `fish` deja identificate. Valorile de mărime folosesc aceeași scară de raport; factorii sunt adimensionali.

```text
Pseudocode — local learning episode
scope: drawing instance / fish kind / size concept
reference: 1; initial factor: 1.6; observed accepted final value: 2.5
accepted factor: 2.5 / 1 = 2.5
updated local factor: mean(1.6, 2.5) = 2.05
retained evidence: explicit episode closure, observations and validity checks
```

An episode closes through a declared conversational event, not silence interpreted as agreement. Validity requires observed changes and no intervening external edit or undo that invalidates the example. The arithmetic is accepted factor `2.5 / 1`, then mean with 1.6, yielding 2.05. The result applies only in the recorded instance, kind and concept context; it does not become a universal fact about fish or override an explicit later size.

## 12.4 Costuri, ponderi și egalități între candidați

Un obiectiv combină termeni definiți și comparabili, după eliminarea candidaților care încalcă cerințe tari. O suprapunere interzisă nu este un cost mare pe care un avantaj suficient de mare îl poate compensa. Pentru preferințe slabe se poate folosi o sumă ponderată; pentru priorități care nu trebuie compensate se folosește o ordine lexicografică declarată. Alegerea uneia dintre aceste politici este parte din semantica obiectivului.

Să avem doi candidați valizi, cu doi termeni deja normalizați: deplasare și aglomerare. Candidatul A are valorile 0,2 și 0,6, iar B are 0,5 și 0,2. Cu ponderi egale, costurile sunt 0,8 și 0,7, deci B este preferat. Dacă deplasarea are ponderea 2, costurile devin 1,0 și 1,2, deci A este preferat. Aceste numere sunt un exemplu calculabil al sensibilității la politică, nu o calibrare recomandată pentru toate paginile.

| Ce declară obiectivul | De ce este necesar |
|---|---|
| Termenii și normalizarea lor | Fără ele se pot aduna minute cu unități de pagină sau număr de obiecte fără semnificație comună. |
| Ponderile și justificarea | Arată ce compromis este permis; se evaluează pe preferințe independente și familii de probleme. |
| Priorități necompensabile | Împiedică o îmbunătățire pe alt termen să anuleze o obligație sau o prioritate declarată. |
| Tratarea egalităților | Un identificator poate stabiliza afișarea, dar nu poate hotărî singur între intenții diferite. |
| Criteriul de oprire | Distinge cel mai bun candidat încercat de un optim demonstrat. |

O pondere modificată poate schimba mai multe cereri care folosesc același obiectiv. De aceea explicația păstrează descompunerea costului, nu doar scorul total. Un reviewer poate vedea ce termen a schimbat ordinea candidaților și poate verifica dacă aceasta corespunde preferinței declarate. Optimizarea unui număr opac nu oferă această justificare.

### 12.4.1 Un obiectiv cu ponderi și priorități

An objective combines lexicographic priorities with weighted sums inside each level. Load `std.objective` for this fragment. `displacement` and `crowding` name declared evaluators with normalised outputs; the objective does not define those measurement procedures merely by naming them.

```sop
@objective.layout std.objective order=lexicographic direction=minimise term=$term.move term=$term.crowding
@term.move std.objective.term evaluator=displacement normalisation=declared.by.evaluator weight=2 priority=1
@term.crowding std.objective.term evaluator=crowding normalisation=declared.by.evaluator weight=1 priority=2
```

Schema cere toate câmpurile exemplului și respinge cheile necunoscute, referințele la alt tip și termenii structurali incompleți. `order` este `lexicographic`, iar `direction` poate fi `minimise` sau `maximise`. `weight` este un număr finit nenegativ. Ponderea zero dezactivează contribuția unui termen; aceasta nu permite tratarea unei valori lipsă a unui termen activ drept zero. `priority` este un întreg nenegativ; the integer representation limits it la întregii reprezentabili exact în JavaScript, până la 9007199254740991, pentru a nu confunda priorități distincte prin rotunjire. Aceasta este o condiție a reprezentării curente, nu o limită conceptuală a numărului de niveluri.

Referințele `term` repetate către aceeași identitate se păstrează o singură dată; nu dublează contribuția. Două înregistrări cu identități diferite rămân termeni diferiți chiar dacă numesc același evaluator. Sunt admise priorități egale, tocmai pentru suma ponderată din interiorul unui nivel. Ștergerea unui termen încă referit este refuzată. Încărcarea verifică aceste proprietăți structurale, dar nu rezolvă evaluatorii, nu execută optimizarea și nu dovedește că normalizarea este justificată; aceste obligații trebuie îndeplinite înaintea evaluării unui candidat.

Prioritățile mai mici se compară întâi. Pentru fiecare prioritate se însumează termenii ponderați de la acel nivel; apoi vectorii se compară lexicografic. Cu A=(0,2; 0,6) și B=(0,5; 0,2), vectorii devin (0,4; 0,6) și (1,0; 0,2), deci A câștigă la primul nivel. Aglomerarea nu poate compensa deplasarea în această politică. Dacă ambii termeni primesc prioritatea 1, vectorul are o singură componentă și obținem sumele 1,0 și 1,2 discutate mai sus. Cu ponderi egale și aceeași prioritate, câștigă B prin 0,7 față de 0,8.

Ponderile au astfel efect de compromis între termenii aceluiași nivel; o pondere pozitivă aplicată singurului termen al unui nivel nu îi schimbă ordinea candidaților. Evaluatorii trebuie să fixeze formula, referința și versiunea normalizării. `declared.by.evaluator` cere această rezolvare și nu permite alegerea unei scări după observarea câștigătorului. O valoare lipsă nu este cost zero: candidatul rămâne incomplet evaluat. Cerințele tari se verifică înaintea obiectivului și nu apar ca termeni compensabili ai lui.

## 12.5 Calibrare și verificarea unei modificări

Parametrii se aleg pe un set de calibrare și se verifică pe cazuri independente, separate după familie de formulare și domeniu unde mecanismul este general. Replay-ul care a descoperit o lipsă poate deveni test de regresie, dar nu poate fi singurul criteriu după care se alege noua valoare. O reglare care câștigă exact acel caz și schimbă greșit o altă familie trebuie explicată sau retrasă.

| Probă | Ce detectează |
|---|---|
| Schimbarea unității cu conversie consecventă | Decizii dependente accidental de reprezentarea numerică. |
| Perturbarea fiecărui parametru în jurul valorii alese | Praguri fragile și candidați a căror ordine se inversează fără o diferență relevantă. |
| Perechi minimale | Pierderea unui număr exact, a negației, a direcției sau a unui obiect protejat. |
| Schimbarea taxonomiei fără schimbare de sens | Dependența distanței de numărul accidental al nodurilor intermediare. |
| Cazuri noi în alte domenii | Un parametru care a memorat o situație în loc să servească mecanismul general. |
| Reluarea cu aceeași versiune și aceleași intrări | Derivări sau alegeri care nu pot fi reproduse din datele consemnate. |

Înregistrarea unei modificări conține definiția parametrului, unitatea, domeniul de aplicare, valoarea veche și cea nouă, sursa alegerii și cazurile în care decizia se schimbă. Nu se cere ca orice decizie să rămână identică: unele modificări corectează tocmai decizii greșite. Se cere ca diferențele să fie vizibile și evaluate, fără a ascunde pierderile într-o medie globală.

Un parametru învățat este supus aceleiași discipline de proveniență și verificare, cu contextul local adăugat. Versiunea spațiului și a politicii numerice intră în justificarea planului; o explicație veche se reproduce cu acea versiune. Astfel, îmbunătățirea calibrării rămâne compatibilă cu un sistem care poate explica de ce a ales altfel ieri.

# 13. Compunerea răspunsului din efecte și dovezi

Un răspuns util nu recită lista apelurilor unei unelte. El spune ce s-a schimbat pentru om, ce a rămas nerezolvat și, când este necesar, ce alegere a făcut aplicația. Pentru aceasta se construiește mai întâi un plan de răspuns din afirmații justificate și abia apoi se aleg formulările engleze. Același mecanism servește un desen, un document sau un calendar; domeniul furnizează identități, concepte și observații, nu replici particulare.

## 13.1 De la jurnal la afirmații care pot fi comunicate

Datele de intrare sunt cererea situată, versiunea stării de dinainte, observațiile de după, rezultatele apelurilor și verificările constrângerilor. Fiecare afirmație candidată pentru răspuns are un conținut, un statut și sursele care îl susțin. Identificatorul unei operații permite corelarea confirmării cu observația corespunzătoare; simplul fapt că două evenimente sunt apropiate în timp nu dovedește că descriu același efect.

| Afirmație candidată | Dovada necesară și formularea permisă |
|---|---|
| Schimbare confirmată | Confirmarea operației și diferența observată satisfac cerința; se poate afirma efectul realizat. |
| Condiție deja satisfăcută | Verificarea de dinainte susține condiția; se spune că era deja așa, fără a pretinde o acțiune nouă. |
| Propunere | Planul sau candidatul a fost verificat, dar nu executat; se exprimă o posibilitate ori o propunere, nu un fapt îndeplinit. |
| Rezultat parțial | Există efecte independente confirmate și cerințe rămase; sunt păstrate ambele categorii. |
| Efect necunoscut | Observația lipsește, este incompletă sau nu poate fi corelată cu apelul; se spune ce nu s-a putut confirma. |
| Alegere presupusă | Valoarea folosită are caracter de presupunere și sursă în plan; se explică alegerea când influențează rezultatul. |
| Răspuns factual | Faptele citite ori derivate și acoperirea întrebării justifică afirmația; rezultatul nu este atribuit unei acțiuni a asistentului. |

Observațiile și confirmările pot fi întârziate sau incomplete. De aceea un „success” tehnic nu este transformat direct în „I moved it”. O contradicție între confirmare și stare produce o afirmație despre incertitudine și poate cere recitire, potrivit politicii execuției. Sistemul nu inventează o cauză doar pentru a face răspunsul să pară complet.

Afirmația internă păstrează rolurile actului și cerințele pe care le acoperă. O mutare are obiect, locul rezultat și relația verificată; o creare are identitatea nouă și întregul din care face parte. Rolurile sunt legate de obiecte și concepte, nu de numele unui mesaj de interfață. Această reprezentare permite gruparea înaintea realizării textului.

Consider “Change the colour of the circle to purple”. The reader retains change, the circle description and the required colour. LIB binds the subject using instance evidence, resolves purple through knowledge and the tool's declared colour representation, and emits a concrete property-change instruction. If there are several circles, the context policy ranks them and retains alternatives; the selected identity and assumption are named. Observation checks the concrete property and the semantic mapping before claiming the effect.

Request revisions preserve unchanged nodes and the parent revision. New wording receives a distinct source identity. A correction identifies the role being changed; preserving a graph does not itself interpret “the other one”. Selector evaluation binds historical subjects from a coherent population snapshot. Logical evaluation carries true, false or unknown, with completeness required only for exhaustive conclusions.

A batch has explicit dependencies. A confirmed creation may unlock a later call that consumes its returned identity; an unknown creation effect does not. Independent requests remain eligible. Successful structural validation of a batch is not proof that all tool contracts or semantic preconditions are satisfied.

Creation and removal claims compare lifecycle populations before and after a correlated invocation. An item disappearing from a filtered view is not proof of deletion. Empty partial observations do not establish absence. Property-change evidence instead compares the resolved expected property with observations of the same subject and field, plus the invocation outcome and relevant revisions. Neither assessment substitutes for the other.

Dacă înainte și după corespund valorii așteptate, rezultatul este `unchanged`: proprietatea era deja potrivită, fără a afirma executarea unei schimbări. Rezultatul `changed` cere o valoare de după potrivită, una de dinainte diferită, un pas confirmat și o versiune nouă a sursei. În celelalte cazuri corelate rezultatul este `unconfirmed`, cu motivul păstrat; legăturile contradictorii sau ambigue sunt refuzate. Comparația păstrează exact tokenurile, ordinea și repetițiile lor. Nu transformă automat numere, unități sau nume semantice în valori ale editorului.

Dovezile normalizate sunt copiate într-o definiție imuabilă din registrul de revizii. Afirmația `std.reply.property` conține proprietarul, revizia și statutul; validatorul recalculează statutul din copia păstrată, astfel încât modificarea ulterioară a jurnalului activ să nu rescrie evaluarea istorică. Aceasta protejează consistența datelor, nu autenticitatea unei observații fabricate. Adapterul rămâne responsabil pentru citirea reală, confirmarea operației și maparea declarată dintre concept și valoarea nativă.

O diferență în câmpul nativ nu dovedește automat o diferență vizuală. De exemplu, înlocuirea unei valori implicite cu aceeași culoare stocată explicit poate schimba datele fără să schimbe aspectul. Răspunsul poate spune că proprietatea a fost setată la valoarea rezolvată, dar nu inventează o schimbare perceptivă. A property assessment alone does not prove creation or removal or satisfaction of the whole request; other predicates and grouped claims require their own evidence.

### 13.1.1 Răspunsuri pentru propuneri, verificări și informație lipsă

Modul cererii din secțiunea 10.2 determină ce fel de rezultat trebuie comunicat. Pentru `check` sau `propose`, un plan satisfăcător nu este un efect realizat. Dovezile pot veni din disponibilitatea citită ori din verificarea unui candidat pe fork, fără apeluri care modifică starea reală.

| Rezultat și mod | Formulare engleză justificată |
|---|---|
| `check`, disponibilitate verificată pentru ambii participanți | „Monday 14:00 and Tuesday 10:00 are free for both.” Nu afirmă că o întâlnire a fost creată. |
| `propose`, aceleași două opțiuni | „I suggest Monday at 14:00; Tuesday at 10:00 also works.” Preferința pentru prima opțiune trebuie susținută de obiectiv, altfel opțiunile sunt prezentate fără clasament. |
| `ask`, informația necesară lipsește | „I have no information about your holiday calendar. Loading that calendar would let me check the dates.” Numește lipsa concretă și sursa care ar permite continuarea. |

În primele două exemple, săptămâna, fusul orar, durata și participanții trebuie să fie deja rezolvați în cerere; dacă nu sunt, formularea îi precizează sau cere datele lipsă. Dovada disponibilității poartă versiunea sursei și intervalul verificat. O eventuală confirmare ulterioară revalidează disponibilitatea înainte de rezervare, deoarece starea poate să se fi schimbat.

Lipsa informației nu devine negația faptului: „nu am date despre sărbători” nu înseamnă „nu există sărbători”. Nici nu este o afirmație de imposibilitate a sistemului în principiu. Sursa propusă trebuie să fie relevantă pentru informația cerută; dacă nu este cunoscută, sistemul cere o sursă potrivită fără să inventeze un fișier sau să pretindă că l-a consultat. Aceleași reguli se aplică unei proprietăți de desen, structurii unui document sau unui fapt dintr-o diagramă.

## 13.2 Selectarea conținutului și ordinea lui

Planul de răspuns are două categorii de conținut: ceea ce trebuie spus pentru a nu induce în eroare și detaliile care pot fi desfășurate la cerere. Bugetul de lungime se aplică detaliilor, nu adevărului rezultatului. O cerință fermă neîndeplinită, un efect neconfirmat ori o modificare neașteptată nu poate fi ascunsă pentru a obține un răspuns scurt.

| Prioritate de comunicare | Cum se aplică |
|---|---|
| Incertitudine sau efect neașteptat relevant | Apare devreme, înainte ca o formulare de succes global să creeze o impresie greșită. |
| Răspunsul la întrebarea ori scopul principal | Numește rezultatul la nivelul cerut de om, nu fiecare etapă tehnică. |
| Remaining obligations | Identify the missing evidence or unsatisfied requirement, the retained alternatives and any usable next action. |
| Adaptări și presupuneri semnificative | Explică diferența față de ce era explicit sau decizia care influențează interpretarea rezultatului. |
| Justificări detaliate | Rămân accesibile prin jurnal și „why?”, fără a încărca automat confirmarea obișnuită. |

Ordinea depinde de structura rezultatului. Pentru o reușită completă, răspunsul începe cu efectul principal. Pentru un rezultat parțial, începe cu delimitarea lui și spune imediat ce s-a realizat și ce nu. Pentru o întrebare, începe cu informația cerută. Nu se prefixează fiecare mesaj cu o formulă identică precum „Done” ori „I understood”; dacă nu adaugă informație, formula poate lipsi.

Un exemplu de rezultat parțial într-un document este: „I shortened the introduction; I could not confirm the change to the conclusion.” Prima parte are suport observat, a doua păstrează statutul necunoscut. Formularea „I shortened the document” ar generaliza peste partea neverificată. O propoziție în plus este justificată dacă evită această eroare.

## 13.3 Gruparea efectelor fără pierderea întinderii lor

Mai multe afirmații pot deveni o singură propoziție dacă au același act, același statut și roluri compatibile. Gruparea folosește identități unice și acoperirea cerințelor; nu numără câte apeluri au fost făcute. O reîncercare a aceleiași operații nu dublează numărul obiectelor, iar actualizarea unei părți nu înseamnă că întregul a fost recreat.

The following pseudocode groups three confirmed creation claims about sections of the same report. Its entries identify observed objects and correlated evidence; these are explanatory records, not extra SOP types.

```text
Pseudocode — response grouping
claim a: created section a in report, confirmed by evidence a
claim b: created section b in report, confirmed by evidence b
claim c: created section c in report, confirmed by evidence c
group: same act, status and parent; members [claim a, claim b, claim c]
count: distinct confirmed section identities = 3
```

`member` păstrează legătura către fiecare afirmație acoperită. Numărul comunicat se calculează din obiectele distincte ale membrilor confirmați, nu este copiat din cantitatea cerută. Dacă toate trei sunt secțiuni nou create în același raport, formularea poate fi „I added three sections to the report.” Dacă există numai două confirmări și un efect necunoscut, nu mai poate fi folosit același număr într-o propoziție de succes.

| Situația afirmațiilor | Regula de grupare |
|---|---|
| Același act, statut și întreg | Grupează obiectele unice și exprimă cantitatea observată. |
| Aceeași proprietate și aceeași valoare | Poate coordona obiectele; valoarea este spusă o singură dată. |
| Valori sau destinații diferite | Păstrează distribuția pe subgrupuri; nu atribuie tuturor reuniunea valorilor. |
| Întreg și părți create în același pas | Poate prezenta întregul cu părțile sale, dacă acoperă cerințele; nu enumeră redundant crearea întregului și apoi fiecare componentă. |
| Statut diferit între obiecte | Separă reușita, condiția deja satisfăcută și efectul necunoscut. |
| Parte modificată într-un întreg existent | Numește partea și schimbarea; nu afirmă refacerea întregului dacă diferența nu o dovedește. |

Pentru un document creat cu secțiunile sale, „I created the report with three sections” poate acoperi atât întregul, cât și structura cerută. Dacă raportul exista și numai secțiunile au fost adăugate, se folosește formularea despre adăugare. Astfel se elimină repetiția „I created a report. I created three sections” prin relația dintre efecte, fără o listă de excepții pentru genul report.

Condițiile diferite nu se amestecă în aceeași descriere colectivă. Dacă o secțiune a devenit mai scurtă și alta mai formală, „I made both sections shorter and more formal” ar fi fals. Gruparea poate spune separat cele două schimbări într-o propoziție coordonată, păstrând legătura fiecărui predicat cu obiectul său.

## 13.4 Presupuneri, adaptări și denumirea obiectelor

O presupunere este relevantă când decide o proprietate pe care omul ar putea dori să o corecteze sau când explică o diferență semnificativă a rezultatului. Nu se recită fiecare valoare tehnică aleasă de adaptor. Planul de răspuns marchează de ce detaliul este relevant: a completat un rol important, a ales între alternative cu efecte diferite sau a folosit o realizare aproximată. Această clasificare este generală și poate fi verificată în jurnal.

| Informație | Cum se exprimă fără repetiție inutilă |
|---|---|
| Valoare importantă completată | Leagă alegerea de rezultat: „I used a one-hour duration.” Nu prezintă presupunerea ca cerință explicită a omului. |
| Realizare împrumutată | Spune adaptarea relevantă o dată în contextul ei și păstrează felul semantic al obiectului. |
| Aceeași adaptare neschimbată la pasul următor | Nu repetă explicația dacă referentul, politica și diferența relevantă sunt aceleași; dovada rămâne accesibilă. |
| Adaptare nouă ori schimbată | O comunică din nou, deoarece explicația anterioară nu mai descrie rezultatul curent. |
| Nume tehnic intern | Îl înlocuiește prin forma lexicală declarată ori printr-o descriere identificabilă; nu inventează un nume aparent cunoscut. |

Pronumele sunt folosite numai dacă antecedentul este unic în contextul răspunsului. Altfel, o descriere precum „the introduction” sau numele obiectului este mai clară decât „it”. Pentru obiecte similare, descrierea include proprietatea distinctivă necesară identificării, nu toate sloturile lor. La numirea unei valori aproximative se păstrează diferența dintre „în regiunea cerută” și „cea mai apropiată realizare disponibilă”.

Presupunerile nu justifică renunțarea la cerințe explicite. O excepție cerută într-un calendar nu poate apărea în răspuns ca „I assumed no exceptions” după ce a fost omisă. Planificarea trebuie întâi să rezolve incompatibilitatea; formularea nu poate repara retroactiv o acțiune cu sens schimbat.

## 13.5 Realizarea în engleză și verificarea formulării

Din planul de răspuns, realizatorul alege o familie de cadre pentru act și statut, apoi construiește grupurile nominale, acordul, cuantitatea, timpul verbal și relațiile. Cadrele sunt date ale limbii și pot avea variante care păstrează aceeași structură semantică. Un domeniu nou furnizează concepte și forme lexicale; nu primește o colecție de propoziții pentru fiecare combinație de obiect și situație.

Realizarea păstrează o mapare între fragmentele textului și afirmațiile planului. Aceasta permite verificarea că fiecare propoziție are suport și că fiecare informație obligatorie a fost comunicată. Cantitățile, negațiile, numele, relațiile și statutul execuției sunt comparate structural cu planul, nu doar prin asemănarea globală a textului. O parafrază care pierde „not” sau schimbă „proposed” în „done” este respinsă chiar dacă restul cuvintelor seamănă.

| Verificare înainte de afișare | Ce previne |
|---|---|
| Fiecare afirmație textuală are suport | Adăugarea unei cauze, a unei calități ori a unei reușite neobservate. |
| Informația obligatorie este acoperită | Omiterea unui eșec parțial sau a unei incertitudini pentru a scurta mesajul. |
| Numere și întinderi păstrate | Confundarea cantității cerute cu cea realizată ori distribuirea greșită a unei proprietăți. |
| Referințe identificabile | Pronume ambigue și nume interne neexplicate. |
| Forma lingvistică este coerentă | Dezacorduri, repetiții și propoziții fragmentare rezultate din concatenări de șabloane. |

Un model de limbaj poate realiza sau reformula un plan de răspuns prin același contract: primește afirmațiile și dovezile, iar rezultatul este verificat înainte de afișare. Validarea de sens și cea de stil rămân distincte. Dacă o formulare candidată pierde informație, se reconstruiește din cadrul semantic sau se generează altă variantă; nu se inventează o propoziție de succes ca rezervă. Aceasta permite îmbunătățirea exprimării fără schimbarea sursei adevărului comunicat.

## 13.6 Concizie, explicație la cerere și evaluare

Răspunsul obișnuit comunică rezultatul și excepțiile relevante; explicația la cerere desfășoară dovezile. Concizia nu este un număr universal de cuvinte: o cerere simplă poate necesita o propoziție, iar un rezultat parțial cu efect necunoscut poate necesita mai mult. Prioritatea este ca omul să poată distinge ce s-a întâmplat și ce decizie mai este necesară.

Evaluarea separă corectitudinea factuală, acoperirea cerințelor și calitatea comunicării. Se folosesc perechi care schimbă numai statutul (confirmat sau necunoscut), un număr, o negație, un subgrup ori o relație parte–întreg. O formulare scurtă care trece peste aceste diferențe este mai slabă decât una puțin mai lungă care le păstrează. Repetiția se măsoară semantic: două propoziții despre același efect nu devin utile doar pentru că folosesc sinonime.

Pentru fiecare problemă de răspuns se păstrează planul semantic, textul generat și diferența identificată de verificare ori de om. Cazul conduce la o regulă generală de selecție, grupare sau realizare. Nu se adaugă o replică fixă pentru obiectele din acel exemplu. Aceasta închide legătura dintre explicația din secțiunea 6.11 și un răspuns natural: dovezile rămân complete, iar textul spune numai ceea ce este relevant pentru pasul curent.

# Anexe

## Anexa A. Cu ce seamănă

Ideile de aici nu sunt noi una câte una; nouă este punerea lor laolaltă sub o singură regulă. Referințele sunt date din memorie, cu autor și an, și trebuie verificate înainte de publicare.

| Ideea | Cu ce se înrudește |
|---|---|
| valori ca puncte, cuvinte ca regiuni cu centru | Spațiile conceptuale (Gärdenfors 2000); teoria prototipurilor (Rosch 1975). |
| cuvinte de grad față de o clasă de comparație | Semantica adjectivelor graduale (Kennedy 2007). |
| lumea legendelor | Ontologiile de nivel înalt (DOLCE, SUMO, BFO); rolurile tematice; schemele-imagine. |
| fir cu chei și sloturi | Cadrele lui Minsky (1974); structurile de trăsături. |
| lume = fapte + schemă | Logicile descriptive; constrângerile de integritate. |
| fire deduse, retrase când rămân fără temei | Menținerea adevărului (Doyle 1979; de Kleer 1986). |
| acte cu condiții și efecte; acte compuse | STRIPS (Fikes și Nilsson 1971); PDDL; planificarea ierarhică (Erol, Hendler și Nau 1994). |
| constrângeri tari și slabe; rezolvitor | Satisfacerea constrângerilor (Mackworth 1977). |
| valori obișnuite | Logica valorilor implicite (Reiter 1980). |
| completarea cu cost minim | Abducția cu costuri (Hobbs și colaboratorii 1993). |
| cererea, focusul, întrebarea deschisă | „Starea de informație” (Larsson și Traum 2000); GUS (Bobrow și colaboratorii 1977); SHRDLU (Winograd 1972). |
| corecția schimbă numai ce numește | Revizuirea convingerilor (Alchourrón, Gärdenfors și Makinson 1985). |
| starea observată și oglinda ei; desfacerea | Vederi actualizabile (Foster și colaboratorii 2007); tranzacții cu compensare (Garcia-Molina și Salem 1987). |
| proveniența | Proveniența datelor (Green și colaboratorii 2007). |
| răspunsul compus din date | Generarea de limbaj (Reiter și Dale 2000). |
| teste din declarații; perechi minimale | Testarea pe proprietăți (Claessen și Hughes 2000); seturi de contrast. |

## Anexa B. Vocabular

Fiecare termen are o explicație de un rând și secțiunea în care este explicat pe larg.

| Termen | Explicație |
|---|---|
| fir (wire) | O declarație pe un rând: identificator, tip, perechi cheie și valoare. Secțiunea 2.1. |
| cheie (key) | Numele unei informații dintr-un fir. Secțiunea 2.1. |
| referință (reference) | O valoare care trimite la alt fir, scrisă cu `$`. Secțiunea 2.1. |
| fapt (fact) | Un fir care spune că ceva există și cum este. Secțiunea 2.1. |
| spațiu de nume (namespace) | Un nume pus automat în fața identificatorilor faptelor unei lumi, ca să nu se ciocnească cu ai alteia. Îl dă programul când creează lumea. Secțiunea 2.6. |
| lume (world) | Fapte și schemă, ținute împreună și verificate. Secțiunea 1.2. |
| schemă (schema) | Firele care spun ce fapte au voie să existe și ce decurge din ele. Secțiunea 2.5. |
| tip (type) | Numele care spune ce fel de declarație este un fir. Este un nume, nu un fir. Secțiunile 2.1 și 2.4. |
| slot (slot) | Declarația, în schemă, a unei chei a unui tip de fire. Secțiunea 3.2. |
| moștenire (lineage) | Ce se declară despre un tip general este valabil pentru cele care îl extind. Secțiunea 3.1. |
| cheie deschisă (open key) | O cheie declarată obligatorie care nu are încă valoare; o sarcină de completat, de căutat sau de întrebat. Secțiunea 3.3. |
| încălcare (violation) | Ce dă biblioteca înapoi la un refuz: ce regulă și ce fire. Secțiunea 3.6. |
| validă, nevalidă, nedeterminată | Cele trei rezultate ale unei verificări. Secțiunea 3.9. |
| copie (fork) | O a doua lume, identică la pornire, pentru încercări. Secțiunea 3.9. |
| variabilă (variable) | Un loc cu nume, scris cu `?`, în care se potrivește orice valoare; apare numai în modele. Secțiunea 3.4. |
| model (pattern) | Un fir cu variabile, care descrie firele de căutat. Secțiunea 3.4. |
| regulă (rule) | Când modelele se potrivesc, adaugă un fir. Secțiunea 3.5. |
| fir dedus (derived) | Un fir adăugat de o regulă; dispare când rămâne fără temei. Secțiunea 3.5. |
| interdicție (deny) | Modele care nu au voie să se potrivească împreună. Secțiunea 3.6. |
| tare, slab (hard, soft) | O constrângere care refuză, față de una care doar notează o problemă. Secțiunea 3.6. |
| funcție (function) | Un calcul declarat, chemat de schemă. Secțiunea 3.7. |
| legend world | A World declaring reusable concepts, spaces, roles and their relationships. Section 4.2. |
| spațiu conceptual (conceptual space) | Spațiul valorilor unei însușiri: axe numerice sau un graf de părți. Secțiunea 4.4. |
| axă, regiune, centru | Părțile unui spațiu conceptual. Secțiunea 4.4. |
| cuvânt de grad (degree word) | „Big”, „short”: un cuvânt al cărui înțeles se calculează din situație. Secțiunea 4.5. |
| clasă de comparație (comparison class) | Față de ce se judecă un cuvânt de grad. Secțiunea 4.5. |
| schimbare de bază | Apariție, dispariție, schimbarea unei însușiri, schimbarea unei relații. Secțiunea 4.6. |
| act (act) | O schimbare cerută, definită o dată, cu roluri și cu condiții înainte și după. Secțiunea 4.6. |
| rol (role) | Partea pe care o joacă un lucru într-un act. Secțiunile 4.3 și 4.6. |
| tipar de lume, bază de cunoaștere, instanță de lume | Cele trei feluri de lumi. Secțiunea 5.1. |
| fapt de domeniu, normă, valoare obișnuită, euristică | Felurile de cunoaștere. Secțiunea 5.1. |
| realizare | Felul concret în care un domeniu face un lucru: o imagine, o formă. Secțiunea 5.2. |
| import, extindere, restrângere, conflict, legare | Operațiile de compunere a lumilor. Secțiunea 5.3. |
| rezolvitor (solver) | Căutarea de valori pentru multe chei deschise deodată. Secțiunea 5.4. |
| domeniu de capabilități, unealtă, capabilitate, legătură | Cum este legat un domeniu de programul lui. Secțiunea 6.1. |
| cerere (request) | Ce vrea omul, scris ca fire, în concepte generale. Secțiunea 6.3. |
| cerință (constraint) | Un singur lucru pe care omul îl vrea, cu identitatea lui. Secțiunea 6.3. |
| focus | Lucrurile și cererea despre care se vorbește acum. Secțiunea 6.4. |
| reacție, corecție, fragment | Feluri de mesaje care au sens numai față de dialog. Secțiunea 6.4. |
| întrebare deschisă | Întrebarea pusă de aplicație, ținută minte până la răspuns. Secțiunea 6.4. |
| toleranță (tolerance) | Câtă abatere este primită între ce s-a cerut și ce se poate face. Secțiunea 6.5. |
| sursă, caracter, context, cost | Cele patru informații purtate de fiecare valoare. Secțiunea 6.6. |
| cerință, preferință, presupunere | Cele trei caractere ale unei valori. Secțiunea 6.6. |
| whole; executable plan | A thing composed of parts; a concrete circuit of typed tool calls with dataflow and dependencies. Section 6.7. |
| deducție, completare cu cost minim, extinderea unei valori comune | Mecanismele de raționament. Secțiunea 6.8. |
| stare observată, stare primită pentru execuție | Ce există de fapt și ce propune aplicația. Secțiunea 6.9. |
| cadrul unui act | Forma generală a propoziției de răspuns pentru un act. Secțiunea 6.10. |
| proveniență (provenance) | De unde vine fiecare valoare. Secțiunea 6.10. |
| registrul cazurilor nerezolvate | Lista a ce nu se poate face încă, cu mecanismul general care lipsește. Secțiunea 6.10. |
