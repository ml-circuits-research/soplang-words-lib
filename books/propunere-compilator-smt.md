# Compilatorul de cereri cu un pas de căutare SMT/Z3: propunere

*Propunere tehnică, 19 noiembrie 2026. Stă lângă [`sumar-compilator-de-cereri.md`](sumar-compilator-de-cereri.md) și [`sumar-scop-si-algoritmi.md`](sumar-scop-si-algoritmi.md) și se sprijină pe experimentul comparativ rulat în [`experiments/`](../experiments/README.md) (runda 1: 14 cazuri, patru tehnologii; runda 2: 12 cazuri reale, compilatorul `z3world` care citește toată cunoașterea din lume). Nu e cod nou — e o decizie de arhitectură, argumentată pe măsurători.*

---

## 1. De ce SMT/Z3 ca pas de căutare, nu ca compilator întreg

Compilatorul din carte (cap. 6.2) are deja formă: citire → context → cantități → **completare** → **elaborare** → execuție → răspuns. Propunerea nu înlocuiește niciun dintre acești pași. Ea umple doar un slot din catalogul fix de operații (cap. 6.8.2): operația **`search`** — „variabile, generator de candidați, constrângeri, obiectiv și buget; întoarce candidați, dovada de verificare și un rezultat de căutare".

Azi acel slot e umplut ad-hoc, de fiecare familie: plasarea e o metodă separată cu exact două ținte și o relație; depozitarea e o căutare scrisă cu mâna. Experimentul a măsurat ce se întâmplă când slotul e umplut de un singur motor general:

- **z3**: toate cele trei domenii (desen, calendar, depozit) au trecut prin aceeași encodare — 14/14 cazuri compilate, median 10 ms/caz, 191 de rânduri de encodor, calitate judecată de agent 8.9/10 — fără nicio orchestrare externă pe domeniu.
- **baseline** (căutări mărginite scrise cu mâna): 14/14, 0 ms, 158 de rânduri, dar calitate 8.5 — plasări „în colț", valabile mecanic, și o formă de întreținere: fiecare familie nouă de relații cere căutare nouă scrisă cu mâna.
- **cassowary (kiwi.js)**: cele mai bune plasări (9.6), dar fără disjuncții native — „sau"-urile au fost enumerate în afara solverului, iar depozitarea a căzut înapoi pe un DFS mărginit: 405 de rânduri, semantică „scurgând" din tehnologie.

Concluzia măsurată: **z3 e singura tehnologie care a ținut toată semantică (disjuncție, întregi, explicație) într-un singur limbaj de constrângeri**, deci e singura care poate ocupa slotul `search` fără ca restul compilatorului să se rescrie în jurul ei.

Exact unde nu intră z3 ne spune chiar experimentul: cazul **w5** („câte bărci sunt pe pagină?") a fost răspuns cu „2" **fără solver** — pe calea de citire: un `match` simplu peste faptele instanței, un fir de răspuns la ieșire. Întrebările (act=`inspect`, cap. 9.1) sunt proiecții pe o populație observată, nu căutări; ele rămân pe `collect`/`match`. z3 este **pasul de căutare al pipeline-ului, nu compilatorul întreg**: potrivirea cerere–unealtă (join pe contracte, cap. 6.1), completarea cu surse și tării, alegerea sub criterii cu alternativele păstrate și execuția cu dovadă (cap. 6.9) rămân exact cum le descrie sumarul compilatorului. Ce se schimbă: odată ce variabilele libere și constrângerile sunt adunate, ele se predau ca **o problemă unică**, ca să se rezolve împreună — „small house near the tree" cere înălțime, gap, evitarea lacului și încăpere pe pagină *într-o* decizie, nu în patru.

Un câștig structural, nu doar de viteză: `search` din catalog cere să distingem cinci rezultate (cap. 6.8) — circuit validat, candidat cu obligațiuni neverificate, cerere invalidă, **imposibilitate dovedită**, buget epuizat. z3 dă exact cele două extremități care altfel se confundă: dovada imposibilității (unsat core) și timpul măsurat de căutare. Un refuz care numește constrângerile în conflict nu e un string de eroare, e o **dovadă verificabilă**.

## 2. Compilatorul, mecanic: fir → z3 → fire

*Nu e cod aici; codul întreg, verificat, e în [`experiments/z3world/compiler.mjs`](../experiments/z3world/compiler.mjs). Aici e doar tabela de traducere pe care un implementator o urmează.*

**Pasul 1 — Variabilele, din contractul uneltei.** Fiecare parametru `required` nerezolvat al operației alese devine o variabilă întregi. Marginile ei NU se inventează: vin din declarație (`std.tool.param min/max`, sau `dc.parameter`): `x: 0..800`, `start: 0..480`. Parametrul cu `accepts=a|b|c` devine `Int 0..2` plus o **tabelă de decodare** index→șir, ținută lângă problemă.

**Pasul 2 — Constrângerile, dintr-o bibliotecă mică de predicate.** Fiecare relație pe care o cere omul sau o regulă a lumii are O construire. Biblioteca întreagă, până acum:

| firul / regula | construirea z3 (formulă, sintaxă liberă) |
|---|---|
| `on`/`in` (în/o ancore) | `x ≥ a.x ∧ y ≥ a.y ∧ x+w ≤ a.x+a.w ∧ y+h ≤ a.y+a.h` |
| `near` (aproape de, gap ≤ G) | disjuncția de „fără suprapunere" `∧ gapX ≤ G ∧ gapY ≤ G`, unde `gapX = dacă x+w ≤ a.x atunci a.x-(x+w), altfel dacă a.x+a.w ≤ x atunci x-(a.x+a.w), altfel 0` (idem `gapY`) |
| fără suprapunere (două dreptunghiuri) | `x+w ≤ q.x ∨ q.x+q.w ≤ x ∨ y+h ≤ q.y ∨ q.y+q.h ≤ y` |
| `right`/`left`/`below` | `x ≥ a.x+a.w (∧ gap ≤ G)` — simetric pe fiecare axă |
| intervale disjuncte (calendar) | `t_i+dur ≤ t_j ∨ t_j+dur ≤ t_i` |
| capacitate (raft/room) | `Σ dacă(item pe ra) atunci size, altfel 0 ≤ cap` — un `If` pe item |
| `lr.rule for=K relation=in anchor-kind=L` | predicatul `on/in`, aplicat tuturor obiectelor cu felul L — constrângere, nu preferință |
| `lr.rule … relation=avoid` | predicatul „fără suprapunere", aplicat felului L |
| `x.option strength=hard` | constrângerea lui, ca atare |
| `lr.pref` / `option` soft / implicit de scenă | termeni de obiectiv cu greutate (ex. `+1000 dacă t < 240`) |

Orice cerere formează problemă DOAR compunând rândurile din tabelul ăsta — **compilatorul nu are cazuri de propoziție, are predicate**.

**Pasul 3 — Solve.** `Optimize` cu buget declarat: constrângerile tari, minimizarea sumei soft, `timeout` explicit. Unsatisfiable → nucleul unsat numește rândurile de mai jos în conflict → `Issue` cu dovadă. `unknown` (buget) → `Issue` de buget, nu de imposibilitate.

**Pasul 4 — Decodarea, prin același contract.** Modelul întoarce întregi; fiecare întreg trece înapoi prin declarația care l-a născut: variabila `x` → fir cu numele parametrului TOCMAI din `std.tool.param`; enum index → șirul din `accepts`-ul DECLARAT; valorile → firele elementare de fapt. O micro-rulare cap-coadă, „draw a small house near the tree", în lumea cu `lr.grade small=0.5` și regula „casele evită lacul":

- declarat: `w=200 h=160`, ×0.5 prin tabela `lr.grade` → **100×80**; variabile `x,y` cu marginile paginii.
- constrângeri: `near tree gap≤40`, `avoid lake`, suprapunere interzisă cu pomul și cu lacul.
- solve: `x=200, y=220`.
- decodare: `@n1 draw.thing kind=house w=100 h=80 x=200 y=220` — fire elementar, respectă schema, fiecare valoare cu izvorul ei în contractul original.

Fire în, fire out, mapa o dă schema. Asta e tot compilatorul; restul documentului e argumentație și măsurători, nu pași suplimentari.

Unde intră preferințele și unde intră cerința: cerința și regulile lumii sunt constrângeri (nu pot fi cumpărate), preferințele sunt obiectiv de minimizat (doar ordonează soluțiile valide). La scară, adevărul e mai dureros decât „rapid" — și e măsurat pe trei căi: s-draw: **55 ms** într-o rulare, **37 s** în alta pe aceeași formă, **buget epuizat în 8 s** cu timeout declarat — refuz de buget, nu imposibilitate; cassowary **OOM**, glpk **>10 min**. Concluziile rămân: `Optimize` pe disjuncții are variație dramatică; bugetul declarat e obligatoriu (cap. 6.8); prima-acceptabilă (secțiunea 4) la scară nu e lux, e disciplina care ține sistemul interactiv.

## 3. Cum se leagă firele

Secțiunea de bază: maparea dintre familiile de fire și piesele problemei SMT. Experimental, fiecare rând de mai jos a rulat (runda 2, `z3world`) — compilatorul nu conține nicio semantică hardcoded.

| Familia de fire | Devine în problema SMT | Exemplu măsurat |
|---|---|---|
| `x.intent` (act) | familia de caz: căutare, mutare sau citire | w5: `inspect` → calea de citire, zero solver |
| `x.target` | variabile + mărimi (w, h, count) | w3: casa 200×160 |
| `x.rel` (on/in/near/right/left/below) | constrângeri dure peste ancoră, cu gap | w6: barca dreapta casei, disjuncție + rând „same-row" |
| `x.option` cu `strength` | hard → constrângere; soft → termen de obiectiv | s-store: `with-pair` hard; w1b: preferință soft |
| `lr.rule` (reguli de forme în lume) | constrângeri dure condiționale | w2a/w2b (mai jos) |
| `lr.grade` (tabele de cuvinte în lume) | derivare de mărimi înainte de căutare | w3 (mai jos) |
| `lr.pref` (preferințe persistate) | termeni de obiectiv | w1a/w1b (mai jos) |
| `dc.operation`/`dc.parameter` (unelta declarată) | numele variabilelor + domeniile (enum/margini) | calendar 0–480, `accepts=Ana/Dan/Bob` |
| `demo.part` (părți reale din k.objects) | un grup rigid: un singur (ox, oy) pentru toate părțile | w4: veliera Noto |
| schema lumii (tipuri închise, enum-uri, rangi, cardinalități) | poartă **circuitul de ieșire** (tell) | toate cazurile: fiecare fir emis respectă schema |

**Firele omului → variabile și constrângeri.** Un `x.intent` cu `act=make` spune doar scopul; țintele lui `x.target` (`mode=new`) devin variabilele poziției și mărimii; fiecare `x.rel` devine constrângerea ei peste ancora legată cu `$`; fiecare `x.option` cu `strength=hard` (perechea q0+q1 pe același raft) intră ca constrângere, iar cele fără tărie declarată intră în obiectiv. Iar w6 arată `change` — mutarea obiectului existent: un `match` pe instanță găsește identul (barca), apoi două variabile `mx`,`my`, constrângerea „dreapta casei cu gap ≤ 40", `same-row` (y neschimbat), disjuncții cu toate obiectele și un obiectiv care preferă cea mai mică mutare — ieșirea e `x.set object=boat key=x value=…`.

**Lumile de cunoaștere → valori, domenii și grupuri de compunere.** w4, veliera reală Noto: `demo.part` dă două părți reale în cadru 0–100 (catarg 5.8×83.4 gri, velă roșie 48.7×77.5). Encodorul a compus **un singur grup rigid**: două variabile (ox, oy), toată geometria internă a părților fixă, constrângeri de margini și conținut în lac pe *chenarul grupului* — dar la ieșire **fiecare parte e emisă ca fir elementar separat** (`draw.thing kind=mast …`, `kind=sail …`), ambele integral în lac. Detaliu de encodor care contează: geometria fracționară a părților trebuie rotunjită pentru domeniile solverului pe `Int`, fără a altera părțile emise.

**`lr.pref` → termeni de obiectiv.** Perechea w1a/w1b: aceeași cerere („o ședință de 60 de minute pentru Ana"), aceeași zi ocupată. w1a, fără preferință declarată: slotul rezolvat a fost 0–60 (cel mai devreme liber). w1b, cu un singur fir nou în lume — `lr.pref person=Ana value=late strength=soft` — slotul s-a **mutat la 270–330, cu zero cod nou**. Așa arată o preferință învățată consumată corect: nu o regulă care interzice devreme, o componentă de obiectiv care face târziul mai ieftin. Perechea w2a/w2b arată versiunea dură: fără regulă, barca oriunde; cu `lr.rule for=boat relation=in anchor-kind=lake strength=hard`, barca a intrat **în lac** — o constrângere condiționată generată din faptul lumii, nu o ramură de `if` în cod. w3 reunește ambele mecanisme: `lr.grade word=small scale=0.5` a **înjumătățit** casa la 100×80 înainte de căutare, iar regula „casele evită lacul" (o disjuncție cu fiecare faptă de tip lac) a ținut-o departe — plasată lângă pom, cu gap.

**Schema lumii → poartă circuitul de ieșire.** Partea cel mai ușor trecută cu vederea: tipurile închise (`closed=true`), enum-urile, rangii (start/end 0–480, person ∈ {Ana, Dan, Bob}) și cardinalitățile din schemă nu alimentează doar solverul — ele **validează firele rezultate**. `tellOk` pe o lume proaspătă cu schema cazului a fost judecătorul mecanic al tuturor cazurilor. Declarațiile de parametri (`dc.parameter`) rezolvă o altă capcană: ele fixează **contractul uneltei**, deci domeniile variabilelor vin direct din declarație, nu din constante în cod — exact ce cere cap. 6.1 („min=0.3 max=3" pentru `size`, nu o limită inventată de encodor).

Mărturia de control a experimentului e usturătoare: compilatoarele v1, care **nu** citesc faptele lumii, au produs circuite valide dar care **contrazic chiar faptele lumii** — ședința la 09:00 deși lumea spune că Ana preferă târziu; barca lângă lac deși regulile lumii spun că bărcile merg în lac; casa neînjumătățită deși tabela lumii spune small=0.5. Circuit „valid", lume contrazisă: fără a citi lumea în obiectiv și în constrângeri, compilatorul nu încalcă schema — încalcă bunul-simț al lumii.

## 4. Mai multe soluții plauzibile vs prima acceptabilă

O singură soluție întoarsă e o decizie ascunsă. Cartea cere alternativele păstrate pentru „no, the other one" (Review 29), iar `rank` din catalog cere explicit o politică de egalități. Propun trei adâncimi de căutare, alese printr-o preferință a omului: `x.option key=depth value=quick | alternatives | pareto`:

- **quick** (implicitul): primul model al problemei `Optimize` — ce a rulat toate experimentele, zeci de milisecunde. Întoarce prima soluție acceptabilă: validă contra constrângerilor dure, ordonată de obiectiv, fără garanție de optim global.
- **alternatives**: enumerăm **k soluții diverse** rezolvând o dată, apoi adăugând clauze de blocare (negarea fiecărui model găsit) și rezolvând din nou; lista se reordonează după obiectivul soft și rămâne în jurnal, cu sursa și costul fiecăreia — exact acordul Review 29 («propun»: formulă ne-rulată încă; mecanismul de blocare e standard în SMT, nu o invenție). Costul: timpul de rezolvare multiplicat la k; forma rămâne milisecunde pe corpus, cu k declarat, nu implicit.
- **pareto**: obiectivele separate devin priorități **lexicografice**: întâi minimizează „târziu vs devreme", abia apoi costul deplasării — z3 `Optimize` suportă priorități native («propun» trecerea la forma exactă). Experimentul a folosit forma ieftină: penalizarea preferinței late cu greutatea 1000 pe orele de dinainte de 240 — un lexicografic „prins în greutăți", care funcționează dar poate fi cumpărat de altă preferință suficient de grea. Forma exactă nu poate: întâi cerința, apoi preferințele.

Argumentul de cost, măsurat pe ambele capete: ieftin — s-cal (14 ședințe ocupate + 4 noi de 30 minute) în ~15 ms, s-draw uneori în 55 ms. Și scump, tot măsurat: **s-store** (45 de piese pe 12 rafturi, obiectiv „folosește cât mai puține rafturi") nu s-a terminat nici în **9+ minute la z3 `Optimize`**, nici în **8+ minute la glpk** — bin-packing cu optimizare e NP-hard, iar motoarele generale nu-l repară. Exact aici intervin adâncimea și bugetul: o cerere care acceptă **prima soluție acceptabilă** (fără obiectiv combinatorial), sau un buget declarat, transformă minutele într-un răspuns onest (refuz de buget, nu imposibilitate); baseline-ul cu FFD a rezolvat s-store valid în milisecunde — **suboptimal dar utilizabil** — lecție: obiectivul combinatorial e o alegere per cerere, nu un obicei al compilatorului. Alegerea adâncimii trebuie să rămână o preferință declarată per cerere, nu o constantă în cod.

## 5. Ce tipuri de raționament se reduc la SMT și ce nu
Tabelul onest, rând cu rând:

| Raționament | Se reduce la SMT? | Ce rămâne în afara z3 și de ce |
|---|---|---|
| **Deducție** (aplicare de reguli declarate) | **Da**, dar nu e locul lui natural. Când regulile doar **derivează consecințe** (fapte din fapte, cap. 9.3), motorul `core.rule` pe fire e drumul simplu și ieftin. SMT câștigă doar când derivarea trebuie și să **aleagă valori**: „casele evită lacul" nu e o consecință, e o alegere de poziție sub constrângere. | `derive` (motorul de reguli al bibliotecii) — pentru că faptele fără alegeri nu au nevoie de căutare; adăugarea lor în z3 ar fi cost fără câștig. |
| **Abducție ponderată** (ipoteze cu cost, ex. std.ground „man"→person cost 0.5 vs moon 1.5) | **Da**: candidații devin domenii enum cu costuri, aleși de variabile de selecție; cel mai bun set de ipoteze devine minimul obiectivului. | std.ground rămâne calea rapidă pentru ancorarea lexicală; SMT intră doar când ipotezele se leagă de alte constrângeri (alegerea cuvântului schimbă ce poziție e validă). |
| **Inducție** (învățarea unei preferințe din repetarea alegerilor) | **Nu.** Învățarea se întâmplă în afara z3: e o decizie de politică (când o corecție repetată devine preferință), nu o căutare. | Regulile de învățare declarate și jurnalul. Dar — și aici e cuplajul — preferința **învățată**, odată devenită fapt în lume (lr.pref), e consumată de z3 ca termen de obiectiv. Inducția alimentează abducția; abducția se reduce; inducția nu. |
| **Satisfacerea de constrângeri / planificare cu buget finit** | **Da** — întregul corpus măsurat: plasare (cu disjuncții), calendar (intervale disjunctive), depozit (alocare întreagă), inclusiv refuzul dovedit. | Completarea cu surse și tării, execuția, compensarea (cap. 6.9) — pentru că sunt semantică de orchestrare, nu căutare. |
| **Cuantificare / agregare** (count/sum/grup pe populații) | **Da, mărginit**: `If`-sum-uri pe populații finite (capacitatea raftului: sumă de `If(item e pe raft, size, 0)` ≤ capacity). **Nu** pentru populații nemărginite sau acoperire necunoscută. | `collect` rămâne operația de bibliotecă cu acoperire declarată (cap. 9.1): un număr fără dovada populației complete e „măcar 1", nu „exact 1". |
| **Citirea textului** (text → fire) | **Nu.** SMT nu are limbă în el. | Cititorul (neural sau gramatical) — el **propune**, z3 **decide** dacă cererea propusă e satisfiabilă pe starea reală. |
| **Explicația** | **Jumate.** Unsat core-urile sunt **dovezi reale** pentru refuz: măsurat, nucleul a numit întotdeauna constrângerile în conflict („capacity" în w7) — și a prins chiar bugurile encodorului, numindu-le. | Întrebările „de ce" peste stare rămân mecanismului `explain` al bibliotecii; propunem ca fiecare `Issue` să poarte nucleul, ca refuzul să fie o afirmație verificabilă, nu un mesaj. |
| **Planificarea ierarhică** (HTN, k.procedures) | **Parțial.** Termene și domenii mărginite se encodează ca scheduling. Descompunerea deschisă (scop → sub-scopuri nedeterminate dinainte) nu. | `plan` rămâne operatorul care **apelează** pasul SMT per sub-obiectiv — descompunerea deschisă nu e o problemă unică de satisfacere. |

Firul comun al coloanei din dreapta: z3 nu preia bugetele, acoperirea, limba sau învățarea — și nici nu ar trebui. El preia doar partea în care **mai multe valori trebuie alese simultan sub constrângeri**, și acolo este singura tehnologie din comparație care a păstrat toată semantică înăuntru (cassowary: fără disjuncții, milp: fără explicații).

## 6. Riscuri, măsurate

**Profilul de eșec: greșit, nu zgomotos.** Două bugs ale binding-ului z3-solver au fost prinse de experiment: (1) `addAndTrack` pe `Optimize` își lasă tag-urile libere, deci optimizerul **stinge în tăcere constrângeri** ca să minimizeze obiectivul — rezolvarea trebuie să facă `add` simplu pe `Optimize` și să folosească tag-uri urmărite doar pe un `Solver` simplu, pentru nucleul unsat; (2) `term.add(...)` **nu e variadic** — o sumă „împrăștiată" se prăbușește silențios la primul ei element. Ambele au produs ieșiri **valide ca formă, acceptate de `tellOk`, semantic greșite**. Și mai important: același bug a **revenit câteva minute mai târziu** în encodorul nou `z3world` — și l-a expus abia un caz intenționat infeasibil din corpus, nu vreo verificare standard. Lecția: **bugurile encodor–solver eșuează cu încredere, nu cu zgomot.** De aceea propun două porți obligatorii:

1. **Verificare prin recitire (read-back)**: un predicat ortogonal („abia emis, acum verifică independent: chenar, disjuncții, conținut") aplicat pe circuitul înapoi, nu pe modelul solverului.
2. **Un judecător care citește** lângă validarea de schemă: în experiment, judecătorul mecanic a acceptat toate ieșirile silențios-greșite; doar un agent care a comparat starea dinainte cu starea de după le-a prins. În bibliotecă: un strat de plausibilitate ca gate, lângă `tellOk`.

**Dimensiunea WASM — revizuită cu măsurători reale, la decizia ownerului.** Prima ediție a
acestei propuneri spunea „~40 MB → nu în browser". Ambele jumătăți erau greșite ca fapt
(owner, 2026-11-20):
- **~40 MB e dimensiunea de pe disk a pachetului npm**, nu ce plătește un browser:
  z3-built.wasm are **8,6 MB gzipped** la transfer — mai puțin decât multe PNG-uri de hartă.
- **Latența de încărcare e irelevantă pentru experiență**: 27 ms modul + 79 ms init
  (măsurat), iar într-un demo pe browser încărcarea poate fi **lazy**: fetch+compile la
  primul request ce cere elaborare, nu la deschidere — timpul de până ajunge utilizatorul
  la prima cerere acoperă init-ul de <100 ms.
- **kiwi.js NU e inlocuitor**, și asta e măsurat, nu opinie: la scară reală, resolva
  s-cal și s-draw au **căzut cu OOM la 4 GB de RAM** — enumerarea disjuncțiilor
  explodează combinatorial, nu degradează gradual. z3 le rezolvă în ~15 ms (s-cal) și
  55 ms–37 s (s-draw, cu/fără obiectiv). Pentru un „demo de ce poate tehnologia",
  **singurul motor care refuză cu dovadă se numește** e z3; kiwi nu poate ține un demo
  care trebuie să supraviețuiască oricărei cereri.
- **Decizia ownerului**: **z3 intra în browser ca furnizorul principal de căutare,
  lazy-loaded**, fiindcă e curat și simplu de folosit prin contract; kiwi rămâne
  furnizorul instant de plasare pentru cazurile mici (subpackage mic, încărcat eager
  pentru oferingă imediată în vreme ce z3 se fetch-uiește); nu este înlocuitor.
- z3 rămâne în plus **oracle-ul de CI** (rulare de corpus în pipeline, exact ca
  experimentul) și motorul de explicație pe node, plus backend opțional node pentru
  aplicații care pot servi alte adâncimi.

**Determinismul.** Măsurat: toți cei patru compilatori au fost determiniști pe toate rulările, z3 inclusiv. Un compilator care dă răspunsuri diferite pe aceeași solicitare n-ar putea fi antrenat sau testat; ăsta poate.

**Refuzurile trebuie separate.** „Nu știu, bugetul s-a terminat" și „am dovedit că nu se poate" sunt rezultate diferite (cap. 6.8). Măsurat: cazul imposibil (w7: trei piese de mărime 4 pe un raft de capacitate 5) a fost **refuzat cu „capacity" numit în nucleu** — forma canonică pentru codul `Issue` cerut de review. Orice altă ieșire (suprasarcină silențioasă, aruncare de piese) ar fi fost „validă" mecanic și greșită.

## 7. Propunerea concretă de adoptare în bibliotecă

**Un singur contract de elaborare, mulți furnizori.** Piesa centrală e un **Problem IR** — un tip intern, nu un API public:

```
Problem {
  variables:  { nume, tip, domeniu }          // numele folosit și în nucleul unsat
  hard:       [ { nume, constrângere } ]       // cerințele, regulile lumii
  soft:       [ { nume, termen, greutate } ]   // preferințele, pre-supunerile
  objective:  minimizarea sumei soft           // sau priorități lexicografice
  depth:      quick | alternatives(k) | pareto // preferința omului, nu constantă
  budget:     declarat                         // epuizare ≠ imposibilitate
}
```

`x.option`-urile cu `strength=hard`, regulile `lr.rule` și valorile cerute de om devin `hard`; `lr.pref`, tabelul `lr.grade` și impliciturile de unealtă devin `soft`/valori; domeniile vin din declarațiile de parametri. Construcția e aceeași indiferent de furnizor.

**Furnizorii, în spatele contractului (revizuit, decizia ownerului 2026-11-20):**

- **intern** — căutare mărginită cu proprietățile de azi, pentru cazurile mărunte („instant, 0 ms" ca baseline; și ca fallback când nimic altceva nu e încărcat);
- **kiwi** — furnizorul **instant de plasare**, încărcat eager (subpackage minuscul), pentru spaieri mici fără „sau"-uri grele; NU e inlocuitor de căutare generală — măsurat: OOM la scară (s-cal, s-draw);
- **z3 în browser, lazy-loaded (8,6 MB gzipped, init <100 ms)** — furnizorul principal de căutare al demo-ului: singurul care ține disjuncții native la scară și singurul care întoarce **nucleul unsat** ca dovadă a refuzului, purtat în `Issue`. Un demo care trebuie să spună „nu se poate, și iată de ce" are nevoie de el;
- **z3 pe node** — rămâne și oracle-ul de CI (corpus integrationat în pipeline, exact ca experimentul) și motorul de explicație pentru adâncimi mari, prin backend opțional.

Rutele de azi (placement-method, capability-method, rule-circuit) nu se desființează peste noapte: ele devin furnizori de **domenii și costuri** pentru același contract — exact drumul „o singură buclă, nu șapte ramuri" din sumarul compilatorului, iar `solve.mjs` (cu verificarea lui prin oracle) rămâne nucleul pe care z3 îl însoțește, nu înlocuiește.

**Testul de acceptare** rămâne cel din recenzii și din cap. 1.3/7.5, neschimbat de această propunere: o lume nouă (**w.inventory**, un registru de inventar) intră pe catalog, își declară capabilitățile și uneltele — și **niciun fișier din `src/` nu se schimbă**. Experimentul dă măsura de încredere: un compilator care a citit reguli, preferințe, tabele de cuvinte și părți reale **doar din fire** a mutat o ședință de la 09:00 la 13:30 și a pus o barcă în lac, dintr-o singură linie de SOP în plus. Forma asta de generalitate — comportament nou din declarație nouă — e exact ce promite contractul; și acum e demonstrată, nu doar declarată.

---

*Cifrele citate sunt din rulările din 19 noiembrie 2026 (`experiments/results*`); ce depășește datele (forma lexicografică exactă, enumerarea cu clauze de blocare, stratul de judecător ca gate) e marcat «propun».*

---

## 8. Stare la 20 noiembrie 2026: ce e integrat

- **În bibliotecă (0.226.0): `std.problem`**, IR-ul din secțiunea 7, ca fire SOP: variabile cu domenii, cutii și intervale din variabile sau numere, constrângeri dure și termeni soft peste predicatele din secțiunea 2 (`inside`, `near`, `apart`, `left`, `right`, `above`, `below`, `disjoint`, `within`, `le`, `ge`, `eq`, plus `minimise`/`maximise` doar soft), buget și adâncime (`quick` sau `alternatives` cu `count`). Intră prin `compileRequest`.
- **Furnizorul intern** (fără dependențe, merge în browser): caută pe grila fiecărei variabile și spune `exhausted` când niciun punct de pe grilă nu merge, niciodată „imposibil”.
- **Furnizorul Z3** (`node/smt-z3.mjs`, cu pachetul opțional `z3-solver`): aceeași problemă, exact; spune `unsatisfiable` cu nucleul unsat în `conflict`. Capcanele binding-ului din secțiunea 6 sunt tratate: tag-urile urmărite merg doar pe un `Solver` simplu, sumele se construiesc pereche cu pereche.
- **Poarta de recitire** din secțiunea 6 e obligatorie: orice soluție a oricărui furnizor e verificată din nou contra constrângerilor dure înainte de a fi întoarsă.
- Teste: `test/problem.test.mjs` (casa lângă pom, departe de lac, pe pagină; imposibilitatea dovedită de Z3 cu `in_lake` și `off_lake`; alternative; o ședință de 60 de minute între intervale ocupate).

Ce urmează: metoda de plasare (`placement-method`) și calendarul construiesc un `std.problem` din cerere, din politicile `k.spatial2d` și din contractul uneltei, în loc de căutarea lor proprie; apoi relațiile multiple și subiectele multiple.
