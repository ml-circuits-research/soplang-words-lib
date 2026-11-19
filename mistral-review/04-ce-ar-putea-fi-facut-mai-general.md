# 04. Ce ar putea fi făcut mai general

Generalizarea nu înseamnă „încă un strat de abstractizare”. Înseamnă să identifici noțiunile care se
repetă în cele șapte ramuri de compilare și în cele trei motoare, și să le exprimi o singură dată.
Mai jos este forma generală, apoi maparea de la codul actual la ea.

## 1. Cererea ca graf de scopuri, nu ca tip de wire

Astăzi fiecare fel de cerere are un tip propriu: `std.request`, `std.choice.request`,
`std.ground.request`, `std.knowledge.request`, `std.interpret.input`, `std.placement.context`,
`std.capability.context`. Fiecare are alt contract și alt compilator.

Forma generală:

```
Goal      = { act, target*, constraint*, result? }
Target    = { kind | ref | pattern, mode: new|existing|bound, selector? }
Constraint= { on, operator, value, scope, polarity, strength: hard|soft(weight) }
Result    = { type, from: Step }
Step      = { act, inputs, outputs, pre: Condition*, post: Effect* }
Plan      = { steps: Step[], bindings, assumptions, evidence }
```

O cerere compusă este un graf de `Goal`-uri cu muchii `Result → input`. Un „choice” este un `Goal`
cu mai multe căi și un criteriu de cost. Un „grounding” este un `Goal` cu candidați lexicali și un
criteriu de cost. O „placement” este un `Goal` cu constrângeri geometrice. Toate sunt **instanțe**,
nu tipuri de wire.

**Ce câștigi:** un singur validator, un singur plan, un singur diagnostic. Un tip nou de cerere
înseamnă o nouă **schemă de domeniu**, nu un nou `if` în `compilePacket`.

## 2. O singură algebră de constrângeri și efecte

Astăzi:

- `core.deny` pentru hard;
- `std.decide.criterion` pentru ranking;
- `REASON_RULES` pentru `placed`/`open`/`join`;
- `placement-method` pentru geometrie;
- `choice-method` pentru selecție;
- `ground-method` pentru cost lexical.

Forma generală: un singur limbaj de constrângeri cu:

| Noțiune | Semnificație |
| --- | --- |
| `hard` | încălcarea elimină planul |
| `soft(w)` | încălcarea costă `w` |
| `scope` | `each`, `group`, `exists`, `forall` |
| `polarity` | pozitiv/negativ |
| `priority` | ordine lexicografică între criterii |
| `source` | spunere, cunoaștere, inducție, implicit |

Compilarea produce un `Problem` neutru (variabile, domenii, nogoods, cost) și îl dă solverului
existent. `placement`, `choice` și `grounding` devin **furnizori de domenii și costuri**, nu algoritmi
separati. `core.deny`, `std.decide`, `REASON_RULES` devin **surse de nogoods și criterii**.

**Ce câștigi:** o singură semantică pentru „de ce a fost ales X”. Un singur `explain` care spune
„cost 2 din regula R, hard din constrângerea C”.

## 3. Capabilități ca contracte tipizate, nu ca ramuri de cod

Astăzi `capability-method.mjs` are 587 de linii și cere exact un target; `placement-method.mjs` are
214 linii și cere exact două; `tool.mjs` are 705 linii și leagă acte de primitive prin `std.tool.*`.

Forma generală:

```
Capability = {
  act, inputs: Port[], outputs: Port[],
  pre: Condition[], post: Effect[],
  cost, provider, version
}
Port = { name, type, required, accepts, scale }
```

Uneltele sunt **declarații**, nu cod special. Planificatorul caută un lanț de capabilități care
satisface `pre` și produce `post`, cu `outputs` legate la `inputs`. Asta acoperă:

- o unealtă simplă (draw);
- un lanț Calendar → chart → document;
- o alternativă între doi provideri;
- compensarea (un `post` opus sau un `undo` declarat).

**Ce câștigi:** fluxul de date devine generic, nu un caz special în `request-batch.mjs`.

## 4. Cunoașterea ca pachet versionat, cu import/export explicit

Astăzi cunoașterea este un arbore de fișiere `.sop` validat cu un build pinned. Nu are manifest de
compatibilitate, nu are semnătură, nu are versiune de schemă comparată.

Forma generală:

```
Pack = {
  id, version, requires: { engine: range },
  imports: [PackRef], exports: [Type],
  vocabulary: { language, terms },
  shards: [{ id, path, hash, bytes, keys }],
  sources: [{ id, version, license }]
}
```

Reguli:

- un `Pack` poate importa doar ce este în `exports`;
- un `Type` are un `owner` și o `version`;
- un shard valid este valid **împotriva versiunii declarate**, nu împotriva ultimului build;
- `createCatalog` rezolvă un cuvânt la un `shard` prin index, nu prin descărcarea întregului vocabular.

**Ce câștigi:** poți avea mai multe repositorii de cunoaștere, cu precedență, fără să copiezi și fără
să ghicești compatibilitatea. Exact ce promite `repos.pin`, dar cu mașină în loc de comentariu.

## 5. Limbajul ca pachet de limbă, nu ca default în bibliotecă

Astăzi biblioteca are:

- `KIND_FACTS` cu `k.commonsense`, `k.scenes`, `k.kinds`;
- `REASON_RULES` cu `at`, `place`, `in`, `on`, `material`;
- `I18N` implicit englez în `kit.mjs`, `say.mjs`, `reader.mjs`, `statements.mjs`;
- `localeCompare` și `toLowerCase` în decizii.

Forma generală: un `LanguagePack` declară:

```
morphology: inflect, lemma, article, plural
segmentation: clauses, cut points, joiners
lexicon: closed words, frames, templates, cues
realisation: reply templates, registers
normalisation: fold, case, diacritics
```

Biblioteca nu are un limbaj implicit. Are un **contract** pe care orice pachet de limbă îl
implementează. Engleză și română devin două pachete, nu două ramuri în cod.

**Ce câștigi:** „limba intră doar la citire și la spunere” devine adevărat prin construcție, nu prin
disciplină.

## 6. Timp, spațiu și cantități ca teorii generale

Astăzi:

- `cycles.mjs` are `k.time.ordered` ca default;
- `point-space.mjs` are legend/axis/unit;
- `builtins.mjs` are quantity cu unități;
- `motion-facts.mjs` are schimbări de stare;
- `diagram.mjs` are layout.

Forma generală: trei teorii independente, fiecare cu un contract:

| Teorie | Primitive | Operații |
| --- | --- | --- |
| Timp | interval, instant, recurență | `before`, `overlap`, `expand`, `diff` |
| Spațiu | regiune, cadru, axă, unitate | `place`, `distance`, `contains`, `align` |
| Cantitate | scalar + unitate + incertitudine | `convert`, `compare`, `sum`, `rate` |

Un `w.diagram` sau un `w.document` le **compune**, nu le implementează. Biblioteca nu are nevoie să
știe ce este un „legend” sau un „chart”; are nevoie să știe ce este o axă și o unitate.

## 7. Provenance și truth maintenance ca prim nivel

Astăzi `explain` există pentru kernel, dar rezultatul de compilare are `evidence` doar în unele
ramuri, iar `reason.mjs` are propriul calcul de cost.

Forma generală: fiecare valoare și fiecare refuz poartă o **justificare**:

```
Justification = {
  claim: Value | Rejection,
  rule: RuleRef,
  from: [WireRef] | [Justification],
  source: said | knowledge | induced | default | sampled,
  cost,
  span?
}
```

Un singur graful de justificări alimentează:

- `why` pentru utilizator;
- `explain` pentru dezvoltator;
- ranking-ul pentru alegere;
- învățarea din corecții;
- cache-ul (invalidezi pe sursă, nu pe tot).

**Ce câștigi:** „de ce?” devine o operație a bibliotecii, nu o reconstrucție din codul aplicației.

## 8. Distribuție generală: pachete mici, artefact mare

Forma generală:

```
@sopworld/core        parser, world, matrix, solve, query
@sopworld/schema      contracte std.*
@sopworld/reader      limbaj, frames, morph
@sopworld/host        kit, tool, request, instance
@sopworld/bundle      build single-file pentru Pages/demo
```

Fiecare pachet are `exports`, tipuri, teste și versiune. `psys2` depinde de `@sopworld/core` și
`@sopworld/host`, nu de un fișier de 1,66 MB. Build-ul single-file rămâne un **artefact de release**,
generat din pachete, nu sursa.

**Ce câștigi:** poți livra un subset, poți versiona independent, poți testa contractul dintre pachete.

## Maparea de la codul actual la forma generală

| Cod actual | Formă generală | Observație |
| --- | --- | --- |
| `compilePacket` cu 7 ramuri | pipeline + registry de providere | fazele sunt aceleași pentru toate |
| `placementCircuit` | `Problem` cu domenii geometrice | 2 ținte/1 relație devine un caz al domeniului |
| `compileChoice` | `Problem` cu criterii `std.decide` | deja are assessments; mută căutarea în solver |
| `compileGrounding` | abducție ponderată peste candidați | costurile sunt deja date |
| `reason.mjs` | `std.reason` ca reguli `core.rule` | view-ul rămâne, forward-chaining pleacă |
| `plan.mjs` / `PlanLive` | planner peste `World` | `factStore` rămâne adaptor |
| `kit.mjs` / `tool.mjs` | `@sopworld/host` | nu mai stă în core |
| `w.legend`, `w.document`, `w.diagram` | pack-uri în `sop-knowledge-worlds` | biblioteca le încarcă, nu le știe |
| `index.json` + 9,8 MB vocab | manifest + index pe shard | lazy, hash, versiune |
| `fns`/`actions` JS | porturi + provideri declarati | sandbox și cost uniform |

## Invarianții noului nucleu

1. **Un singur model de stare:** orice fapt este într-un `World`; orice simulare este un `fork`.
2. **Un singur motor de decizie:** orice alegere este un `Problem` cu cost și dovadă.
3. **Un singur contract de rezultat:** `Plan | Issue[]`, niciodată string.
4. **O singură graniță:** `core` nu cunoaște niciun nume de lume publicată.
5. **O singură versiune:** fiecare artefact declară `requires` și este verificat la încărcare.
6. **Un singur limbaj de constrângeri:** hard/soft/scope/prioritate, indiferent de domeniu.
7. **Un singur graful de justificări:** `why` este derivat, nu reconstruit.

## Ce nu se generalizează

- **Sintaxa SOP Lang.** Este mică și bună; nu are nevoie de operatori, liste sau expresii.
- **Kernelul tranzacțional.** `tell`, `retract`, `fork`, `undo` sunt deja general.
- **Solverul CDCL.** Este general; trebuie folosit, nu înlocuit.
- **Testele care verifică documentația.** Sunt un activ; trebuie mutate pe contracte, nu eliminate.

## Testul final de generalitate

O generalizare este reală dacă poți adăuga o lume nouă, într-un repo separat, fără să modifici
`src/`. Concret:

1. Creezi `w.inventory` în `sop-knowledge-worlds`, cu `core.module imports/exports`.
2. Îi dai un manifest cu `requires` și hash.
3. `psys2` o încarcă din catalog și o conduce prin `toolSession`.
4. Nu modifici niciun fișier din `soplang-words-lib/src/`.
5. `npm test` în toate cele trei proiecte trece.

Cât timp pasul 4 cere o modificare, generalizarea este declarativă, nu reală.
