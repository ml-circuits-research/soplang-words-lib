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

## 2. Cum se rezolvă așezarea (placement)

Encodarea reală din [`experiments/z3world/compiler.mjs`](../experiments/z3world/compiler.mjs), redată simplificat, are patru piese:

**Marginile.** Fiecare obiect nou primește două variabile întregi, ținute în chenarul declarat al uneltei (la experiment: pagina 800×600; în bibliotecă: domeniul din `dc.parameter`/`std.tool.param`):

```js
const x = z.Int.const(`x${k}`), y = z.Int.const(`y${k}`);
hard.push([`bounds${k}`, z.And(x.ge(minX), y.ge(minY),
                               x.add(w).le(maxX), y.add(h).le(maxY))]);
```

**Conținutul în ancore.** Relațiile `on`/`in` cer ca dreptunghiul obiectului să stea în dreptunghiul ancării:

```js
hard.push([`inside:${anchor}`, z.And(x.ge(a.x), y.ge(a.y),
                                     x.add(w).le(a.x + a.w), y.add(h).le(a.y + a.h))]);
```

**Fără suprapunere — o disjuncție nativă.** Orice două dreptunghiuri trebuie separate pe cel puțin o axă; asta e un „sau" pe care z3 îl înțelege nativ, iar cassowary nu:

```js
hard.push([`disj${k}:${q.id}`,
  z.Or(x.add(w).le(q.x), q.x + q.w <= x, y.add(h).le(q.y), q.y + q.h <= y)]);
```

**Gap-ul prin termeni `If`.** „Lângă, cu o distanță vizibilă" cere distanța pe axa separată condiționat de partea în care cade obiectul — un termen cu ramuri:

```js
const dx = z.If(x.add(w).le(a.x), a.x - (x + w),
            z.If(a.x + a.w <= x, x - (a.x + a.w), 0));
hard.push([`near:${anchor}`, z.And(disjoint, dx.le(gap), dy.le(gap))]);
```

Unde intră preferințele și unde intră cerința — asta e granița care contează:

- **Intenția dură** (ceea ce a cerut omul: `on`, `in`, `near` cu gap, mulțimea de obstacole) intră ca **constrângeri**. Dacă încalcă una, soluția nici nu există.
- **Preferințele** (lipsă din cerere) intră ca **obiectiv de minimizat**: experimentul a folosit „apropiere de centrul paginii" — sumă de termeni `dist(centrul obiectului, centrul paginii)`, minimizați. Cassowary ajunge la același lucru prin ierarhia de tării (`required/strong/medium/weak` — exact scara cerință/preferință/presupunere din cap. 6.6); z3 prin `Optimize`: constrângerile tari mereu „câștigă", obiectivul doar ordonează soluțiile valide. Nicio preferință nu poate cumpăra o încălcare.

La scară, adevărul e mai dureros decât un simplu „rapid" — și e măsurat pe trei căi: **s-draw (6 cercuri printre 40 de obstacole)**: un encodor a terminat în **55 ms**, o re-rulare a aceleiași forme pe `z3world` a durat **37 de secunde**, iar o variantă cu buget declarat de 8 s pe `Optimize` s-a oprit la **timp epuizat („unknown")** — refuz de buget, nu imposibilitate. Lecțiile: (1) `Optimize` pe instanțe disjunctive are variație dramatică între rulări — 55 ms nu e o promisiune, e o mostră; (2) **bugetul declarat e obligatoriu, nu opțional** (cap. 6.8: buget epuizat ≠ imposibilitate dovedită); (3) concurenții nu scapă nici ei: cassowary a căzut cu **OOM** pe același caz, glpk a rulat **peste 10 minute**. La dimensiuni reale de scenă, prima-acceptabilă (secțiunea 4) nu e o opțiune de lux — e disciplina care ține sistemul interactiv.

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

**Dimensiunea WASM (~40 MB).** z3-solver vine ca ~40 MB de WASM — nepotrivit pentru bundle-ul de browser al unui asistent care rulează offline (obiectivul din sumar: „rulează în browser, fără LLM"). De aceea **nu propunem z3 în browser**:
- în browser, plasarea rămâne pe **kiwi.js** (cassowary) — cele mai bune plasări din experiment (9.6), ierarhia lui de tării hărțește exact scara cerință/preferință/presupunere, instant și minuscul (0 ms);
- z3 rămâne **oracle-ul de CI** (rulare de corpus în pipeline, exact ca experimentul) și motorul de explicație pe node, plus backend opțional node pentru aplicații care îl pot servi.

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

**Furnizorii, în spatele contractului:**

- **intern** — căutare mărginită cu proprietățile de azi, pentru cazurile mărunte („instant, 0 ms" ca baseline; și ca fallback de browser);
- **kiwi** — furnizorul de plasare din browser (cele mai bune plasări, fără disjuncții native: cazurile cu „sau" trec pe furnizorul intern sau pe node);
- **z3** — oracle-ul de CI și motorul de explicație pe node; singurul care întoarce **nucleul unsat** ca dovadă a refuzului, purtat în `Issue`.

Rutele de azi (placement-method, capability-method, rule-circuit) nu se desființează peste noapte: ele devin furnizori de **domenii și costuri** pentru același contract — exact drumul „o singură buclă, nu șapte ramuri" din sumarul compilatorului, iar `solve.mjs` (cu verificarea lui prin oracle) rămâne nucleul pe care z3 îl însoțește, nu înlocuiește.

**Testul de acceptare** rămâne cel din recenzii și din cap. 1.3/7.5, neschimbat de această propunere: o lume nouă (**w.inventory**, un registru de inventar) intră pe catalog, își declară capabilitățile și uneltele — și **niciun fișier din `src/` nu se schimbă**. Experimentul dă măsura de încredere: un compilator care a citit reguli, preferințe, tabele de cuvinte și părți reale **doar din fire** a mutat o ședință de la 09:00 la 13:30 și a pus o barcă în lac, dintr-o singură linie de SOP în plus. Forma asta de generalitate — comportament nou din declarație nouă — e exact ce promite contractul; și acum e demonstrată, nu doar declarată.

---

*Cifrele citate sunt din rulările din 19 noiembrie 2026 (`experiments/results*`); ce depășește datele (forma lexicografică exactă, enumerarea cu clauze de blocare, stratul de judecător ca gate) e marcat «propun».*
