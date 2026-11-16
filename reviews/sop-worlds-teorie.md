# SOP Worlds: teoria

*Versiunea 10, 16 noiembrie 2026. Text de lucru în română; termenul englez este dat în paranteză la prima apariție. Exemplele de fire sunt în engleză, fiindcă așa se scriu în sistem.*

*Documentul descrie tehnologia **așa cum trebuie să fie**, ca și cum schimbările ar fi deja făcute. Toate exemplele sunt din cele patru domenii ale aplicației: **desen, diagrame, documente, calendar**. Ce diferă azi și ce este de schimbat este în documentul pereche, `sop-worlds-schimbari.md`. Forma exactă a firelor noi este o propunere pe care biblioteca o va fixa.*

---

# Partea întâi. Ideea

## Lecția 1. Ce este SOP Worlds

SOP Worlds este un fel de a descrie o bucată de realitate ca o mulțime de declarații verificate, numită **lume (world)**. O lume spune ce lucruri există, ce legături sunt între ele, ce este permis și ce decurge din ce. Declarațiile sunt scrise într-un limbaj mic, SOP Lang. Un program general, biblioteca sopworld, ține o lume consistentă, răspunde la întrebări despre ea, trage concluzii și explică de ce a refuzat o schimbare.

Tehnologia are două niveluri. Primul este **modelul general**: cum se reprezintă o lume, cum se compun mai multe lumi, cum se trag concluzii și cum se verifică. Al doilea este **folosirea conversațională**: un om scrie o propoziție, iar sistemul desenează, face o diagramă, scrie un document sau pune o ședință în calendar. Al doilea este construit în întregime peste primul.

Regula care ține totul laolaltă: **se merge de la general spre particular, întotdeauna.** Fiecare declarație stă pe conceptul cel mai general pentru care este adevărată și se moștenește în jos. Un domeniu declară numai ce are el diferit. Un caz nou nu cere niciodată un rând nou despre acel caz.

| Scop | Ce înseamnă |
|---|---|
| refolosire | Ce s-a declarat o dată (culori, mărimi, locuri, cum arată de obicei o scrisoare) este folosit de desen, de diagrame, de documente și de calendar, fără a fi copiat. |
| extindere cu cost mic | Un domeniu nou se adaugă prin declarațiile lui proprii și câteva unelte mici. |
| trasabilitate | Fiecare valoare dintr-un rezultat are o sursă care se poate arăta. Sistemul spune ce nu a înțeles, ce nu poate face și ce nu a putut verifica. |

Contribuția centrală este **un contract comun între intenția omului, modelul lumii, completarea valorilor, verificarea planului și evidența execuției**, același pentru cele patru domenii, sprijinit pe un singur set de concepte generale.

## Lecția 2. Un exemplu urmărit de la un capăt la altul

Domeniul este desenul. Starea de pornire: o pagină cu un iaz în stânga jos, o casă în dreapta și doi pești mici în iaz.

Omul scrie: **„draw three big red fish”**.

| Etapă | Ce se întâmplă |
|---|---|
| 1. Starea | Sistemul citește ce este pe pagină: un iaz, o casă, doi pești. |
| 2. Interpretarea | Propoziția devine o cerere, în roluri generale: actul este „a face”; lucrul este de felul „pește”; cantitatea este trei; „red” este o regiune în spațiul culorilor; „big” este un cuvânt de grad pe axa mărimii. |
| 3. Situarea | Este o cerere nouă. Rolul „loc” a rămas deschis. |
| 4. Înțelesul numeric | „Big” se calculează față de peștii care sunt deja pe pagină: vizibil mai mari decât ei. „Red” devine un punct în spațiul culorilor. |
| 5. Completarea | Locul are variante: în iaz, altundeva pe pagină. |
| 6. Raționamentul | Cunoașterea spune că peștii trăiesc în apă. „În iaz” nu încalcă nimic; alt loc ar încălca o regulă slabă. Se alege iazul. O căutare proprie desenului găsește trei poziții libere în iaz. |
| 7. Execuția | Actul „a face” are o definiție generală: după el, lucrurile există. Unealta de desen este pornită cu numere: fel, poziție, mărime, culoare. Starea este citită din nou și are cinci pești. |
| 8. Răspunsul | „I drew 3 big red fish in the pond.” Este cadrul general al actului, completat cu rolurile; locul este spus fiindcă l-a ales sistemul. |

Omul scrie apoi **„in the sky”**. Nu este o propoziție întreagă. Este o valoare pentru rolul „loc” al cererii dinainte, deci o corectează. Regula despre apă este slabă, iar omul a spus limpede ce vrea: peștii sunt mutați în regiunea de sus a paginii. „I moved the 3 fish to the sky.”

Un refuz arată diferit. În calendar, Ana are o ședință de la zece la unsprezece. Omul scrie **„a meeting with Ana at ten thirty”**. Aceasta încalcă o regulă tare: un om nu poate fi în două ședințe în același timp. Sistemul nu pune ședința și nu o mută pe tăcute. Răspunde: „Ana is busy from 10 to 11. The nearest free time is 11:00. Shall I put it there?”

Schema de mai jos arată părțile. Săgeata de întoarcere este esențială: după execuție, starea reală este citită din nou.

```
          LEGEND WORLD  (the general concepts: thing, kind, quality and its space,
                |         relation, place, time, change, act, role, statement ...)
                |  every type and every slot of every other world points to it
        ________|_________________________
       |                                  |
  world patterns                    knowledge bases
  (drawing, diagram,                (kinds of things, regions of spaces,
   document, calendar)               parts, norms, usual values)
        \                                 /
         v                               v
        WORLD INSTANCE  <------------------------------------.
        (this page, this diagram, this letter, this week)     |
              |                                               |
  message --> interpret --> situate --> meaning --> complete <--.
                                                       |         |
                                                       v         |
                                                decompose and reason
                                                       |
                                                       v
                                            bind to tools and execute
                                                       |
                                                       v
                                            observe the tools' state ----'
                                                       |
                                                       v
                                                     reply
```

---

# Partea a doua. Limbajul

## Lecția 3. Firul

Unitatea limbajului este **firul (wire)**: o singură declarație, scrisă pe un rând.

```
@f1 fish colour=$c.red size=1.6 at=120,540 in=$pond1
```

`@f1` este **identificatorul (id)** firului. `fish` este **tipul (type)**. Restul sunt perechi `key=value`: cuvântul din stânga este **cheia (key)**, cel din dreapta este valoarea. O valoare este un număr, un punct (mai multe numere), un text sau o **referință (reference)** la alt fir, scrisă cu `$`. Aici peștele are mărimea 1,6 față de obișnuit, o culoare care este un punct din spațiul culorilor, o poziție pe pagină și se află în iazul `pond1`.

Firele legate prin referințe formează un **circuit (circuit)**. Un fir care spune că ceva este așa se numește **fapt (fact)**.

Aceeași formă servește toate domeniile:

```
@n3 node    label="Bake" shape=$sh.rectangle at=300,220
@l2 link    from=$n2 to=$n3
@p2 section of=$letter1 role=body text="..." order=3
@m1 meeting title="Review" start=10.5 length=1 room=$r2 people=$ana
```

## Lecția 4. Numele: puncte, prefixe și spații de nume

**Punctul nu are înțeles pentru limbaj.** Convenția este că prima parte a numelui unui tip spune de unde vine.

| Prefixul tipului | Ce înseamnă |
|---|---|
| `core.` | Tipuri ale limbajului însuși: `core.type`, `core.slot`, `core.rule`, `core.deny`. |
| `std.` | Tipuri ale modulelor generale ale bibliotecii: capabilități, unelte. |
| `w.legend.` | Lumea legendelor: conceptele generale (partea a treia). |
| `k.` | Baze de cunoaștere. |
| `w.` | Tipare de lumi refolosibile: `w.drawing`, `w.diagram`, `w.document`, `w.calendar`. |

Identificatorii cu punct (`@t.` pentru tipuri, `@s.` pentru sloturi) sunt tot o convenție de citire.

**Semnul `::` are înțeles.** El desparte un **spațiu de nume (namespace)** de identificator: desenul Annei și desenul lui Tom au fiecare un `f1`, iar `anna::f1` și `tom::f1` sunt două fire. O regulă se potrivește într-un singur spațiu.

| Semn | Explicație |
|---|---|
| `@` | Aici se declară firul cu acest identificator. |
| `$` | Referință la un fir. |
| `?` | Variabilă (lecția 6). |
| `::` | Desparte spațiul de nume de identificator. |

## Lecția 5. Lumea, schema, tipurile și sloturile

O **lume (world)** este o mulțime de fire ținute împreună și verificate. Are fapte, care spun ce există, și o **schemă (schema)**, care spune ce fapte au voie să existe și ce decurge din ele.

Tipurile se declară cu `core.type`. Un tip poate **extinde** alt tip; ce se declară despre unul este valabil pentru toate cele care îl extind. Aceasta este **moștenirea (lineage)**.

Un **slot (slot)** este declarația unei chei pentru un tip. Spune ce fel de valoare ține cheia, dacă este obligatorie, câte valori poate avea și **ce concept general realizează** (lecția 14).

```
@t.drawn      core.type of=drawn extends=std.schema.thing is=thing
@s.drawn.at   core.slot of=drawn key=at     kind=point  means=place space=page
@s.drawn.size core.slot of=drawn key=size   kind=number means=quality space=size
@s.drawn.col  core.slot of=drawn key=colour kind=point  means=quality space=colour
@s.drawn.in   core.slot of=drawn key=in     type=drawn  means=place relation=in many=one
```

O cheie obligatorie fără valoare se numește **cheie deschisă (open key)**.

Lumea verifică fiecare schimbare. Rezultatul unei verificări are trei valori.

| Rezultat | Ce înseamnă |
|---|---|
| validă (valid) | Nicio încălcare tare, iar verificarea a fost completă. |
| nevalidă (invalid) | Cel puțin o încălcare tare. Refuzul este o declarație, numită **încălcare (violation)**: ce regulă și ce fire. De aici vine explicația „Ana is busy from 10 to 11”. |
| nedeterminată (undetermined) | Nicio încălcare găsită, dar lipsește o valoare de care o regulă are nevoie: o ședință fără durată nu poate fi verificată pentru suprapuneri. |

Înaintea unui act, constrângerile tari despre lucrurile pe care actul le schimbă trebuie verificate complet; dacă una rămâne nedeterminată, actul nu se execută și sistemul cere valoarea care lipsește.

O lume ține minte ce s-a schimbat, deci poate anula. Și poate fi copiată: o **copie (fork)** este o a doua lume, identică la pornire, în care se poate încerca ceva fără a atinge originalul.

## Lecția 6. Reguli, interdicții, funcții

O **variabilă (variable)** se scrie `?name`. Un fir folosit pentru a căuta alte fire este un **model (pattern)**. Modelele aparțin schemei; un fapt nu devine niciodată model.

O **regulă (rule)** adaugă un fir când modelele ei se potrivesc. Exemplu din diagrame: un nod spre care nu vine nicio săgeată este un nod de început.

```
@p.node  node id=?n
@p.in    link to=?n
@t.start node.start of=$p.node
@r.start core.rule when=$p.node not=$p.in then=$t.start
```

Firul adăugat este **dedus (derived)**. Când cineva trage o săgeată spre acel nod, temeiul dispare și firul este retras.

O **interdicție (deny)** spune că anumite modele nu au voie să se potrivească împreună. Exemplu din calendar: un om nu poate fi în două ședințe care se suprapun.

```
@p.m1   meeting people=?p start=?s1 length=?l1
@p.m2   meeting people=?p start=?s2 length=?l2
@c.two  core.check fn=neq args=$p.m1 args=$p.m2
@c.hit  core.check fn=overlaps args=?s1 args=?l1 args=?s2 args=?l2
@d.busy core.deny when=$p.m1 when=$p.m2 if=$c.two if=$c.hit why="?p already has something at that time"
```

O constrângere este **tare (hard)**, și atunci schimbarea este refuzată, sau **slabă (soft)**, și atunci schimbarea este primită, dar lumea ține o **problemă (issue)**: un pește pe cer.

Unde este nevoie de un calcul, schema cheamă o **funcție (function)**. O funcție proprie, scrisă ca program, este permisă dacă este declarată în schemă și face numai calculul.

| Domeniu | Funcție proprie |
|---|---|
| calendar | `overlaps`: două intervale de timp au un moment comun. |
| desen | `covers`: două lucruri se acoperă pe pagină. |
| diagrame | `crossings`: câte săgeți se încrucișează într-o așezare. |
| documente | `words`: câte cuvinte are un text. |

## Lecția 7. Ce înseamnă exact declarațiile

| Întrebare | Răspuns |
|---|---|
| Ce înseamnă că o valoare lipsește? | Că nu este cunoscută. Nu înseamnă „fals”. O afirmație negativă se scrie explicit. |
| Ce face o regulă când îi lipsește o valoare? | Nu se potrivește, iar verificarea este nedeterminată pentru acea regulă. |
| Cum se deosebește un model de un fapt? | Modelele stau în schemă. Un fir care există ca fapt nu poate fi numit de o regulă; aceasta este o eroare la încărcare. |
| Unde este valabilă o variabilă? | În regula în care apare. |
| Câte valori are o cheie? | Cât declară slotul: una (locul unui lucru), o mulțime (participanții unei ședințe) sau o listă ordonată (părțile unui document). |
| Când dispare un fir dedus? | Când nu mai are niciun temei. |

---

# Partea a treia. Lumea legendelor

## Lecția 8. De ce o lume a legendelor

Dacă desenul, diagramele, documentele și calendarul și-ar descrie fiecare singure cheile, fiecare ar inventa propriul fel de a spune „unde”, „cât de mare”, „ce culoare”, iar mecanismele ar trebui să învețe fiecare domeniu în parte. De aceea există un singur loc în care stau conceptele generale: **lumea legendelor (the legend world)**. Este un tipar de lume. Nu conține lucruri; conține conceptele prin care se descrie orice lume. Orice tip și orice slot din orice altă lume arată spre un concept din ea.

Conceptele generale sunt puține, fiindcă sunt foarte abstracte. Se găsesc întrebând ce se poate întreba despre orice lucru și despre orice întâmplare.

| Întrebarea | Conceptul general |
|---|---|
| ce este? | lucru și fel |
| care anume? | identitate și trimitere |
| din ce este făcut? | parte și întreg |
| câte? cât? | cantitate |
| cum este? | însușire, într-un spațiu conceptual |
| unde? | loc |
| când? cât timp? | timp |
| al cui? | apartenență |
| ce s-a întâmplat? | schimbare |
| ce se face? | act |
| cine? cui? cu ce? de unde? încotro? | roluri ale unui act |
| cum? | mod |
| de ce? pentru ce? | cauză și scop |
| este adevărat? trebuie? de obicei? | felul unei afirmații |
| toate? unele? niciunul? fiecare? | cuprindere |

## Lecția 9. Conceptele

Fiecare concept are câte un exemplu din fiecare domeniu, ca să se vadă că este același.

**Ce există.**

| Concept | Ce este, și cum apare în cele patru domenii |
|---|---|
| lucru (thing) | Orice despre care se poate vorbi și care poate fi arătat: un pește desenat, un nod, un paragraf, o ședință. |
| fel (kind) | Ce este un lucru. Felurile formează un singur arbore: o rață este o pasăre; un romb este o formă; o scrisoare este un text; o ședință este un eveniment. |
| parte și întreg (part, whole) | Un iaz cu pești și stuf; o diagramă cu noduri și săgeți; o scrisoare cu formulă de început, cuprins și încheiere; o zi cu ședințele ei. |
| grup și ordine (collection, sequence) | Copacii unei păduri; pașii unui flux; capitolele unui raport; ședințele unei săptămâni. |
| nume și semn (name, sign) | Eticheta unui nod, titlul unui document, numele unei ședințe; și cuvintele limbii prin care sunt numite felurile și regiunile. |

**Cum este.**

| Concept | Ce este |
|---|---|
| însușire (quality) | O proprietate a unui lucru: culoarea unui pește, forma unui nod, tonul unei scrisori, durata unei ședințe. Valoarea ei este un punct într-un spațiu conceptual. |
| spațiu conceptual (conceptual space) | Spațiul valorilor unei însușiri: axe numerice, sau un graf de relații și constrângeri (lecția 10). |
| cantitate (quantity) | Un număr, cu sau fără unitate: trei pești, șase noduri, 200 de cuvinte, o oră. |
| stare (state) | Valorile însușirilor și relațiilor unui lucru la un moment. |

**Cum se leagă.**

| Concept | Ce este |
|---|---|
| relație (relation) | Ceva care ține între două lucruri: o săgeată între două noduri, un pește în iaz, o ședință într-o sală. |
| loc (place) | Unde este un lucru: pe pagină, în diagramă, în document (după a doua secțiune), într-o sală (lecția 13). |
| timp (time) | Când: ora și durata unei ședințe; ordinea pașilor unui flux (lecția 13). |
| apartenență (belonging) | Al cui este: calendarul Anei; participanții unei ședințe. |
| asemănare (likeness) | Cât de apropiate sunt două valori sau două lucruri; se calculează în spațiul lor. |
| dependență (dependence) | Un pas al unui flux urmează altuia; o săgeată are nevoie de cele două noduri ale ei. |

**Ce se întâmplă.**

| Concept | Ce este |
|---|---|
| schimbare (change) | Trecerea de la o stare la alta. Sunt patru schimbări de bază (lecția 12). |
| act (act) | O schimbare cerută, definită o singură dată pentru toate domeniile. |
| rol (role) | Locul unui lucru într-un act: ce se face, asupra a ce, unde ajunge, cu cine. |
| mod (manner) | Cum este făcut: „neatly”, „at random”, „formally”. |
| cauză și scop (cause, purpose) | De ce; pentru ce: o ședință „for the budget”, o scrisoare „to complain”. |

**Ce se știe și ce se vrea.**

| Concept | Ce este |
|---|---|
| afirmație (statement) | Ceva spus despre lucruri. Felul ei: fapt, normă, valoare obișnuită, euristică, preferință, cerință a omului, presupunere a sistemului. |
| siguranță și sursă (certainty, source) | Cât de sigură este o afirmație și de unde vine. |
| negație și cuprindere (negation, scope) | Nu; toate, unele, niciunul, fiecare. |
| condiție și limită (condition, limit) | Când este valabilă; între ce margini. |
| întrebare și răspuns (question, answer) | Ce nu se știe și se cere; ce se dă înapoi. |

**Cine și cu ce.**

| Concept | Ce este |
|---|---|
| cel care acționează (agent) | Omul, sistemul, un participant. |
| capabilitate (capability) | Ce acte poate îndeplini un domeniu, și asupra a ce. |
| unealtă și resursă (tool, resource) | Cu ce se îndeplinește un act; ce se ocupă: spațiul paginii, o sală, timpul unui om. |

## Lecția 10. Spațiile conceptuale

De această lecție depinde generalizarea. **O valoare nu este o etichetă dintr-o listă. Este un punct într-un spațiu.**

Un spațiu conceptual are una sau mai multe **axe (axes)**, fiecare numerică.

| Însușire | Axele spațiului ei |
|---|---|
| mărime | O axă: cât de mare, față de obișnuit. |
| culoare | Trei axe: nuanță, saturație, luminozitate. |
| formă (a unui nod, a unui lucru desenat) | Câteva axe: număr de laturi, rotunjime, alungire, simetrie. |
| poziție pe pagină sau în diagramă | Două axe: orizontală și verticală. |
| timp | O axă: momentul; durata este o lungime pe ea. |
| lungimea unui text | O axă: număr de cuvinte. |
| tonul unui text | Câteva axe: formalitate, căldură, fermitate. |

```
@sp.colour w.legend.space name=colour
@ax.hue    w.legend.axis  of=colour name=hue        kind=angle
@ax.sat    w.legend.axis  of=colour name=saturation min=0 max=1
@ax.light  w.legend.axis  of=colour name=lightness  min=0 max=1
@sp.shape  w.legend.space name=shape
@ax.sides  w.legend.axis  of=shape  name=sides      min=0
@ax.round  w.legend.axis  of=shape  name=roundness  min=0 max=1
@ax.long   w.legend.axis  of=shape  name=elongation min=0
```

Un cuvânt ca „roșu”, „oval”, „romb”, „formal” nu este o categorie rigidă. Este o **regiune (region)** a spațiului, cu un **centru tipic** și o întindere. Regiunile stau în bazele de cunoaștere.

```
@rg.red     w.legend.region of=colour name=red     centre.hue=0 centre.saturation=0.9 centre.lightness=0.5 spread=0.12
@rg.ellipse w.legend.region of=shape  name=ellipse centre.sides=0 centre.roundness=1 centre.elongation=1.6
@rg.circle  w.legend.region of=shape  name=circle  centre.sides=0 centre.roundness=1 centre.elongation=1 inside=ellipse
@rg.diamond w.legend.region of=shape  name=diamond centre.sides=4 centre.roundness=0 centre.elongation=1
```

Din aceasta decurg, prin calcul și pentru orice spațiu, lucruri care altfel ar trebui scrise pe caz.

| Operație | Ce dă, în domeniile noastre |
|---|---|
| distanță | Cât de apropiate sunt două culori, două forme, două ore. |
| cel mai apropiat | „Turquoise” la un desen cu puține culori; „oval” la o diagramă care are elipsă; ora liberă cea mai apropiată de cea cerută. |
| apartenență | Dacă un nod este „rotund”; dacă o ședință este „dimineața”. |
| pas | „Darker”, „bigger”, „rounder”, „later”, „longer”, „more formal”: un pas pe axa potrivită. Același mecanism. |
| între | O culoare între două culori; o oră între două ședințe. |
| cuprindere | Un cerc este o elipsă; „navy” este „blue”; „dimineața” este în „azi”. |

Unele concepte nu se măsoară pe axe: un gen de text, un fel de diagramă, un fel de scenă. Pentru ele spațiul este un **graf de relații și constrângeri**: din ce părți este făcut conceptul, în ce ordine, ce este obligatoriu.

| Concept | Graful lui |
|---|---|
| scrisoare | Formulă de început, introducere, cuprins, încheiere, semnătură, în această ordine; primele și ultimele sunt obligatorii. |
| raport | Titlu, introducere, secțiuni, concluzie; concluzia este obligatorie. |
| diagramă de flux | Noduri legate într-o singură direcție; un început, un sfârșit, eventual ramificări. |
| grafic cu bare | Un fel de diagramă: bare a căror înălțime este o cantitate, așezate pe o axă; etichete. |
| iaz (ca scenă) | Apă; în ea pești și nuferi; pe margine stuf. |

Apropierea dintre două astfel de concepte se calculează pe graf: câte părți și relații au în comun. De aici vine răspunsul la „cu ce seamănă cel mai mult ce am cerut”: un „memo” fără graf propriu seamănă cel mai mult cu o scrisoare scurtă.

Câteva lucruri rămân discrete prin natura lor, fiindcă țin de un sistem formal închis: persoana și timpul unui verb, da sau nu. Acestea sunt excepții declarate și motivate.

## Lecția 11. Cuvintele și spațiile: înțelesul vine din context

„Mare”, „mic”, „uriaș”, „scurt”, „lung”, „multe”, „târziu” sunt **cuvinte de grad (degree words)**. Sunt subiective. Nu sunt valori ale lucrului și nu stau în schema lui: acolo mărimea, lungimea și ora sunt numere.

Înțelesul unui cuvânt de grad se calculează de fiecare dată față de o **clasă de comparație (comparison class)**, luată în această ordine.

| De unde vine clasa de comparație | Exemple |
|---|---|
| lucrurile de același fel care sunt acum în instanța de lume | „a big fish” într-un iaz cu doi pești: mai mare decât ei. „A long meeting” într-o săptămână cu ședințe de o jumătate de oră: o oră. |
| ce a făcut omul până acum în această instanță | Dacă a cerut de două ori „shorter” la scrisori, „short” pentru el este mai scurt. |
| ce este obișnuit pentru acel fel în acest fel de lume | Mărimea obișnuită a unui copac într-un desen; lungimea obișnuită a unei scrisori; numărul obișnuit de pași ai unui flux. Vine din cunoaștere și se învață din folosire, pentru fiecare fel de lume. |
| spațiul disponibil | Pagina, diagrama, ziua. |

Cuvântul de grad dă un factor față de clasa de comparație, iar rezultatul este un număr. Un comparativ este un pas numeric față de valoarea de acum.

```
@dg.big   w.legend.degree word=big   direction=up   factor=1.6
@dg.huge  w.legend.degree word=huge  direction=up   factor=2.5
@dg.small w.legend.degree word=small direction=down factor=0.6
@dg.long  w.legend.degree word=long  direction=up   factor=1.8
```

Factorii sunt puncte de pornire. Când omul corectează („bigger” imediat după „big”), factorul se mută pentru acel fel de lume. Aceasta este învățarea.

Cuvintele care numesc regiuni („red”, „round”, „formal”, „morning”) se înțeleg la fel: sunt nume ale unor regiuni, iar o lume poate avea regiunea ei puțin diferită.

## Lecția 12. Schimbări și acte

Sunt patru **schimbări de bază**. Orice se întâmplă într-o lume este una dintre ele sau o înșiruire a lor.

| Schimbare | Ce este, în cele patru domenii |
|---|---|
| apariție (appear) | Se desenează un pește; se adaugă un nod; se scrie un paragraf; se pune o ședință. |
| dispariție (disappear) | Se șterge un lucru de pe pagină, un nod, un paragraf, o ședință. |
| schimbarea unei însușiri (quality change) | Peștele devine roșu; nodul devine romb; scrisoarea devine mai formală; ședința devine mai lungă. |
| schimbarea unei relații (relation change) | Peștele ajunge în alt loc; săgeata pleacă din alt nod; paragraful urcă înaintea altuia; ședința se mută vineri. |

Un **act (act)** este o schimbare cerută. Fiecare act este definit o singură dată, în lumea legendelor.

```
@act.make   w.legend.act name=make   change=appear    role=result  after="result exists"
@act.remove w.legend.act name=remove change=disappear role=object  before="object exists" after="object does not exist"
@act.change w.legend.act name=change change=quality   role=object  role=quality before="object exists"
@act.place  w.legend.act name=place  change=relation  role=object  role=goal    before="object exists" after="object is at goal"
```

Din aceste definiții decurg actele compuse, fără a fi scrise.

| Omul spune | Ce decurge |
|---|---|
| „put a child on the swing”, fără niciun copil pe pagină | „A așeza” cere ca lucrul să existe; nu există; deci „fă un copil”, apoi „așază-l”. |
| „replace the circle with a diamond” | „Șterge” și „fă”, cu aceleași săgeți. |
| „copy the first paragraph to the end” | „Fă” un paragraf cu aceleași însușiri, la alt loc. |
| „move the meeting to Friday and make it shorter” | O schimbare de relație și una de însușire, un singur pas de anulare. |

Tot din definiție decurge verificarea de după execuție: după „a face”, lucrul trebuie să existe în stare; după „a așeza”, relația trebuie să țină. Dacă nu, răspunsul nu spune „am făcut”.

Cuvintele unui act („draw”, „add”, „create”, „write”, „schedule” pentru „a face”) sunt nume ale actului și stau în lumea limbii.

## Lecția 13. Locul și timpul

**Locul** este general. Are patru forme, aceleași pe o pagină, într-o diagramă, într-un document.

| Formă | Ce este |
|---|---|
| poziție | Un punct în spațiul domeniului: coordonate pe pagină; locul în ordinea unui document. |
| regiune | O parte a spațiului: sus, jos, stânga, dreapta, centru, margine, colț; începutul, mijlocul, sfârșitul unui text. |
| relație cu alt lucru | Pe, în, lângă, deasupra, sub, între, înainte de, după. Fiecare are o definiție numerică: „lângă” este o distanță mică; „deasupra” este o diferență pe axa verticală; „după” este o diferență pe axa ordinii. |
| direcție și distanță | Un pas pe o axă: în sus, la stânga, mai aproape, mai jos în text. |

Un domeniu își leagă regiunile proprii de acestea. În desen, cerul este regiunea de sus a paginii, iar apa unui iaz este un lucru: „on the water” este relația „pe” cu acel lucru. „Over water” nu devine niciodată „marea” dacă pe pagină nu este nicio mare. În diagramă, „at the top” este regiunea de sus; „between Start and Bake” este o relație cu două noduri. În document, „after the introduction” este o relație de ordine.

**Timpul** are aceleași forme: un moment, un interval, o durată, o ordine, o repetare. „In the afternoon” este o regiune pe axa orelor. „Later” este un pas. „Every Monday” este o repetare. Două ședințe care se suprapun sunt o relație calculată.

## Lecția 14. Cum se leagă o lume de lumea legendelor

Fiecare tip spune ce concept este (`is=`). Fiecare slot spune ce concept realizează (`means=`), cu precizarea lui: care spațiu, care relație, care rol. Un slot fără concept este refuzat la verificare.

Desenul:

```
@t.drawn       core.type of=drawn extends=std.schema.thing is=thing
@s.drawn.at    core.slot of=drawn key=at     kind=point  means=place space=page
@s.drawn.in    core.slot of=drawn key=in     type=drawn  means=place relation=in
@s.drawn.size  core.slot of=drawn key=size   kind=number means=quality space=size
@s.drawn.col   core.slot of=drawn key=colour kind=point  means=quality space=colour
```

Diagrama:

```
@t.node        core.type of=node extends=std.schema.thing is=thing
@t.link        core.type of=link extends=std.schema.thing is=relation
@s.node.label  core.slot of=node key=label kind=string means=name
@s.node.shape  core.slot of=node key=shape kind=point  means=quality space=shape
@s.node.at     core.slot of=node key=at    kind=point  means=place space=page
@s.link.from   core.slot of=link key=from  type=node   means=role role=source
@s.link.to     core.slot of=link key=to    type=node   means=role role=goal
```

Documentul:

```
@t.text        core.type of=text    extends=std.schema.thing is=whole
@t.section     core.type of=section extends=std.schema.thing is=part
@s.text.about  core.slot of=text    key=about  kind=string means=topic
@s.text.tone   core.slot of=text    key=tone   kind=point  means=quality space=tone
@s.sec.of      core.slot of=section key=of     type=text   means=part
@s.sec.order   core.slot of=section key=order  kind=number means=place space=order
@s.sec.length  core.slot of=section key=length kind=number means=quantity unit=word
```

Calendarul:

```
@t.meeting     core.type of=meeting extends=std.schema.thing is=thing
@s.meet.start  core.slot of=meeting key=start  kind=number  means=time part=start
@s.meet.length core.slot of=meeting key=length kind=number  means=time part=duration
@s.meet.room   core.slot of=meeting key=room   type=room    means=place relation=in
@s.meet.people core.slot of=meeting key=people type=w.person means=role role=participant many=set
```

Niciunul dintre aceste sloturi nu are o întrebare, un răspuns sau o listă de valori scrisă de mână. Tot ce urmează decurge din concept.

| Ce decurge dintr-un slot `means=place` | Desen, diagramă, document, calendar |
|---|---|
| întrebarea când lipsește valoarea | „Where?”, cu tipul valorii: „In which room?” |
| fragmentul | „in the sky”, „at the top”, „after the introduction”, „in the big room”, spuse singure, completează sau corectează rolul loc. |
| trimiterea | „the fish in the pond”, „the node under Start”, „the paragraph after the greeting”, „the meeting in room 2”. |
| mutarea | „move it up”, „move it left”, „move it earlier in the text”. |
| răspunsul | Cadrul general al actului, cu relația și numele locului. |

Dintr-un slot `means=quality space=...` decurg comparativele („bigger”, „rounder”, „more formal”), superlativele („the biggest one”), comparația („as big as the house”), cuvintele de grad, aproximarea la ce poate unealta și întrebarea („How big?”). Dintr-un slot `means=time` decurg „later”, „earlier”, „longer”, „the next one”, „on Friday”.

---

# Partea a patra. Tipare, cunoaștere, instanțe

## Lecția 15. Trei roluri ale lumilor

| Rol | Ce este |
|---|---|
| tipar de lume (world pattern) | O **specificație** refolosibilă: felurile de lucruri ale unui fel de lume, sloturile lor legate de concepte, constrângerile. Avem patru: desenul, diagrama, documentul, calendarul. |
| bază de cunoaștere (knowledge base) | **Conținut** general, valabil într-un context declarat: arborele felurilor, regiunile spațiilor, părțile lucrurilor, ce este obișnuit. |
| instanță de lume (world instance) | O **stare concretă**: această pagină desenată, această diagramă, această scrisoare, această săptămână. |

> **Numele vechi.** În programul și documentele mai vechi, cele trei se numesc *schema lumii* (world schema), *lume de cunoaștere* (knowledge world) și *lume vie* (live world).

Lumea legendelor este un tipar, cel mai general. Celelalte tipare și toate bazele de cunoaștere se sprijină pe ea.

Fiecare rând al unei baze de cunoaștere își declară felul, fiindcă mecanismele le tratează diferit.

| Fel de cunoaștere | Exemple |
|---|---|
| fapt de domeniu | „Peștele trăiește în apă.” Poate întemeia o constrângere. |
| normă | „O scrisoare se încheie cu o semnătură.” „Un flux are un singur început.” Se verifică. |
| valoare obișnuită | „Un flux are de obicei în jur de șapte pași.” „O ședință ține de obicei o oră.” Completează ce omul nu a spus. |
| euristică | „Un lucru mic stă bine într-un colț.” „Ședințele scurte se pun dimineața.” O regulă de bună alegere, într-un context. |

Ce este publicat în depozitul comun este **standardizat**: nume fix, schemă verificată, licență. Cunoașterea nu enumeră niciodată domeniile unei aplicații.

## Lecția 16. Un singur arbore al felurilor și moștenirea

Toate felurile de lucruri stau într-un singur arbore: o rață este o pasăre, un bunic este un bărbat, un romb este o formă cu patru laturi, o scrisoare este un text, un grafic cu bare este o diagramă. Patru lucruri se moștenesc pe acest arbore.

| Ce se moștenește | Exemple |
|---|---|
| capabilitățile | Ce se poate face cu orice lucru desenat se poate face cu o rață. Ce se poate face cu o diagramă se poate face cu un grafic. |
| realizarea | Dacă desenul nu are o imagine pentru rață, o folosește pe a păsării; pentru „grandfather”, pe a bărbatului. Lucrul rămâne o rață: „the duck” îl găsește, iar culoarea spusă i se aplică. Se spune o dată ce imagine a fost folosită. |
| ce este obișnuit | Ce este obișnuit pentru orice text este valabil pentru o scrisoare; scrisoarea declară numai părțile ei. Ce este obișnuit pentru orice scenă desenată este valabil pentru un iaz. |
| cuvintele | „Bird” găsește și rațele; „shape” găsește și romburile. |

Părțile unui lucru vin din aceeași cunoaștere: o față are ochi și gură; o pădure are copaci; o scrisoare are formulă de început. Un domeniu nu le rescrie.

## Lecția 17. Compunerea lumilor

| Operație | Ce înseamnă |
|---|---|
| import | O lume încarcă un tipar publicat, la o versiune fixată. |
| extindere | O lume specializează ce a importat: un tip nou, sau o **restrângere** a unui slot moștenit (o regiune mai mică a unui spațiu). O restrângere este permisă. Două definiții de neîmpăcat sunt un **conflict**, spus la încărcare. |
| legare | Un slot ține un lucru din altă lume. Legarea se face de un lucru anume, cu identitate stabilă; un nume spus de om dă candidați. |

Calendarul este un exemplu de compunere: importă tiparul persoanelor și leagă ședințele de persoane și de săli. Dacă sunt două persoane „Ana”, numele dă doi candidați și sistemul întreabă.

Domeniile se pot compune între ele prin aceleași operații. O diagramă poate arăta ședințele unei săptămâni ca un flux; un document poate cuprinde un desen; un grafic poate arăta câte ședințe are fiecare om. În fiecare caz, un slot al unei lumi ține un lucru din cealaltă, iar regula care are nevoie de amândouă stă în lumea care le încarcă.

## Lecția 18. Folosirea fără dialog

**Verificarea unui document.** Cunoașterea are graful raportului: titlu, introducere, secțiuni, concluzie. Un document este încărcat ca fapte. Lumea răspunde ce lipsește, ce este încălcat și ce nu a putut verifica. Poate spune și cu ce gen seamănă cel mai mult documentul.

**Găsirea unui orar.** Săli, oameni, ședințe. O sală și un om sunt resurse. Ora și sala fiecărei ședințe sunt chei deschise. Un **rezolvitor (solver)** caută valori pentru toate deodată, fără suprapuneri și cu cât mai multe preferințe îndeplinite.

**Verificarea unei diagrame.** Un flux are un singur început și fiecare nod este atins. Lumea spune ce nod a rămas nelegat.

---

# Partea a cincea. Conversația

## Lecția 19. Domeniu, capabilitate, unealtă, legătură

Un **domeniu de capabilități (capability domain)** este o parte a sistemului care poate face lucruri reale: desen, diagrame, documente, calendar. Are o instanță de lume, unelte și vederea stării. Pe ecran apare de obicei ca o filă sau ca un document separat.

O **capabilitate (capability)** este o promisiune declarată: ce act general, asupra cărui fel de lucru, și de ce roluri ține cont.

O **unealtă (tool)** este o operație de program cu parametri numerici sau de referință. Nu știe nimic despre propoziții.

O **legătură (binding)** spune ce unealtă îndeplinește ce act și din ce rol vine fiecare parametru.

```
@k.drawn   std.schema.kind    of=drawn world=drawing acts=make acts=place acts=change acts=remove
@h.make    std.schema.honours world=drawing act=make of=drawn role=kind role=quantity role=quality role=place
@op.add    std.tool.op        world=drawing name=add realises=make
@pa.kind   std.tool.param     op=add name=kind   role=kind
@pa.at     std.tool.param     op=add name=at     space=page
@pa.size   std.tool.param     op=add name=size   space=size   min=0.3 max=3
@pa.colour std.tool.param     op=add name=colour space=colour
@b.make    std.tool.bind      world=drawing act=make of=drawn op=add
```

Parametrul spune în ce spațiu este valoarea lui și ce parte a spațiului poate realiza unealta: un interval, câteva puncte sau tot spațiul. Efectul uneltei nu se declară pe unealtă: este efectul actului pe care îl realizează.

**Domeniul care răspunde este cel care poate îndeplini cererea.** Se alege din capabilități, nu după ce este deschis pe ecran: „schedule a meeting with Ana”, spus în timp ce este deschis desenul, ajunge la calendar.

## Lecția 20. Etapele unui mesaj

| Etapă | Intră → iese |
|---|---|
| 1. Starea | Ce este în unelte → fapte. |
| 2. Interpretarea | Propoziția → cererea, în roluri generale. (lecția 21) |
| 3. Situarea | Cererea și dialogul → cerere nouă, reacție, fragment sau răspuns la o întrebare. (lecția 22) |
| 4. Înțelesul numeric | Cuvintele de grad și regiunile → puncte în spații; adaptarea la ce pot uneltele. (lecția 23) |
| 5. Completarea | Roluri deschise → valori candidate. (lecția 24) |
| 6. Descompunerea și raționamentul | → plan verificat. (lecțiile 25–26) |
| 7. Execuția | Plan → unelte → stare observată. (lecția 27) |
| 8. Răspunsul | Diferența de stare și evidența execuției → propoziția de răspuns. (lecția 28) |

Etapele 5 și 6 se repetă până când planul este complet. Limba apare numai la etapele 2 și 8.

## Lecția 21. Interpretarea: cererea, în roluri

O **cerere (request)** este o mică lume de fire. Nu are chei proprii: folosește conceptele lumii legendelor. Aceeași formă servește toate domeniile.

| Propoziția | Cererea |
|---|---|
| „draw three big red fish in the pond” | act: a face; fel: pește; cantitate: 3; mărime: cuvântul de grad „big”; culoare: regiunea „red”; loc: relația „în”, cu iazul. |
| „make a flowchart of how bread is baked, with no circles” | act: a face; fel: diagramă de flux; subiect: coacerea pâinii; formă: regiunea „circle”, nedorită, pentru părțile diagramei. |
| „write a short formal letter about a late delivery” | act: a face; fel: scrisoare; lungime: cuvântul de grad „short”; ton: regiunea „formal”; subiect: livrarea întârziată. |
| „a long meeting with Ana tomorrow afternoon” | act: a face; fel: ședință; durată: cuvântul de grad „long”; participant: Ana; timp: regiunea „afternoon” a zilei de mâine. |

Fiecare **cerință (constraint)** a cererii are: conceptul (ce rol sau ce însușire), sensul (vreau, nu vreau, nu toate), ținta (despre care lucru sau grup din cerere), domeniul de aplicare, cuantificatorul (fiecare sau în total), caracterul (cerință sau preferință) și cuvintele din care a fost citită. Acestea formează **identitatea** cerinței.

La ce se leagă fiecare cuvânt hotărăște lumea limbii, prin reguli generale.

| Propoziție | Ce trebuie hotărât |
|---|---|
| „a big pond with small fish” | Două mărimi, două ținte: iazul și peștii. |
| „a report with no pictures in the introduction” | Excluderea privește numai introducerea. |
| „two arrows from each box” / „two arrows” | Pe fiecare nod, sau în total. |
| „do not move all the meetings” / „do not move any meeting” | „Nu toate” față de „niciuna”. |
| „put the duck next to the red house” | Roșie este casa. |

Sunt două verificări diferite ale citirii. **Consistența recodificării**: cererea, spusă înapoi și citită din nou, dă aceeași cerere. **Fidelitatea**: se măsoară pe exemple cu interpretare de referință și pe perechi minimale, cum sunt cele din tabel.

Dacă rămân cuvinte necitite într-un loc care contează, cererea nu se execută. Un cuvânt este corectat numai dacă nicio sursă nu îl cunoaște și există un singur candidat limpede. Limba mesajului este cea aleasă de om în aplicație.

## Lecția 22. Situarea: focus, reacții, fragmente, trimiteri, întrebări

Dialogul ține un **focus**: lucrurile despre care se vorbește, selecția activă și cererea care este corectată.

| Ce poate fi un mesaj | Exemple |
|---|---|
| cerere nouă | Are un act și un lucru nou: „draw a house”. |
| reacție | Judecă ce s-a făcut: „fewer”, „too big”, „another one”, „shorter”, „later”. Schimbă numai ce numește: după „fewer fish”, casa și iazul rămân neatinse. |
| corecție | Dă o valoare pentru o cerință care există: „red, actually”, „make that Friday”. |
| fragment | Dă o valoare pentru un rol deschis sau pentru rolul cel mai recent: „on the lake”, „down”, „two of them”, „with Tom too”, „after the greeting”. |
| răspuns | Urmează unei întrebări puse de sistem. |
| laudă sau mulțumire | Nu schimbă nimic. |

Trimiterile la lucruri care există se rezolvă prin concepte.

| Fel de trimitere | Exemple |
|---|---|
| după nume | „the Start box”, „the meeting called Review”. |
| după fel și însușire | „the red fish”: cel mai aproape de regiunea „red”; „the round node”; „the long meeting”. |
| după ordine | „the second paragraph”, „the first one”. |
| după relație | „the house next to the pond”, „the box under Start”, „the meeting before lunch”. |
| după pronume | Lucrurile din focus. |
| după plural hotărât | „the fish”, „the arrows”: selecția activă, altfel toate de acel fel. |

Dacă se potrivesc mai multe și omul a vorbit la singular, sistemul întreabă și enumeră candidații într-o ordine stabilă: „Which house? 1. the red one on the left, 2. the blue one by the pond.”

Întrebările nu sunt scrise de mână pentru fiecare slot. Fiecare concept are întrebarea lui generală („Where?”, „How big?”, „Which one?”, „When?”, „With whom?”), completată cu tipul valorii. Sistemul întreabă cel mult o dată pe mesaj, numai când nu există o presupunere rezonabilă, și ține minte **întrebarea deschisă** până vine răspunsul.

## Lecția 23. Înțelesul numeric și adaptarea

Cuvintele de grad și numele de regiuni devin puncte în spații, după lecțiile 10 și 11. Apoi punctul cerut este comparat cu ce poate realiza unealta.

| Situație | Exemple |
|---|---|
| unealta poate realiza punctul | Se folosește întocmai: desenul poate picta orice culoare. |
| unealta poate realiza un punct apropiat, în toleranța declarată | Diagrama are opt forme; „oval” este în regiunea elipsei. Se folosește și se spune o dată numai dacă diferența se vede. |
| punctul cel mai apropiat este dincolo de toleranță | „A two-hour meeting” într-o zi cu o singură jumătate de oră liberă: nu se scurtează pe tăcute; se explică și se propune. |
| felul cerut nu are o realizare proprie | „A duck” este desenată cu imaginea păsării; „a grandfather” cu a bărbatului. Lucrul își păstrează felul; se spune o dată. |

Regula comună: sistemul face cât poate de bine și spune ce a făcut altfel. Nu oprește omul cu întrebări pentru o înlocuire. Cerința originală se păstrează în cerere, cu transformarea notată lângă ea.

## Lecția 24. Completarea

Fiecare valoare dintr-o cerere are patru însușiri separate: **sursa** (de unde vine), **caracterul** (cerință, preferință sau presupunere), **contextul** (pentru ce lucru și cât timp) și **costul** (cât de slabă este presupunerea).

| Caracter | Ce îi datorează sistemul |
|---|---|
| cerință | Trebuie îndeplinită. Dacă nu se poate, sistemul explică sau întreabă. „In the sky” pentru pești este o cerință și se îndeplinește, chiar dacă este neobișnuit. |
| preferință | Se îndeplinește cât se poate, după cerințe: „in the morning if possible”. |
| presupunere | Poate fi schimbată oricând și se spune când contează: locul ales pentru pești, ora aleasă pentru ședință. |

Dacă două cerințe nu pot fi îndeplinite împreună, niciuna nu cedează pentru că este mai veche: „with Ana, on Monday morning”, când Ana lipsește luni. Sistemul spune ce se bate cap în cap și întreabă.

Rolurile rămase deschise primesc valori candidate din: ce a spus omul mai devreme despre același lucru; ce au în comun lucrurile pe care omul le-a cerut așa; ce este obișnuit pentru acel fel, moștenit pe arbore; o alegere variată în regiunea obișnuită. O valoare obișnuită completează numai ce omul a lăsat gol: dacă omul cere un flux despre „how bread is baked” și cunoașterea nu are pașii, răspunsul este „I do not know the steps; I can make empty steps, or you can name them”, nu un flux despre altceva.

Ce este obișnuit are forma unei regiuni, nu a unei valori fixe: numărul pașilor unui flux este o regiune pe axa cantității, cu un centru.

Când omul cere mai multe lucruri deodată („a house and a swing”), se verifică în plan dacă sunt independente: nu împart o resursă, nicio regulă nu le leagă și omul nu a cerut „numai împreună”. Pentru lucruri independente se face ce se poate și se spune ce lipsește.

## Lecția 25. Întregul și părțile

Omul cere adesea un **întreg (whole)**. Uneltele fac părți. Din ce părți este făcut un întreg vine din graful conceptului (lecția 10) și din ce este obișnuit pentru felul lui.

| Întreg | Părți |
|---|---|
| un iaz | Apă; pești și nuferi în ea; stuf pe margine. |
| un flux | Noduri pentru pași, legate într-o direcție; începutul și sfârșitul au forma lor. |
| un grafic cu bare | Câte o bară pentru fiecare valoare; înălțimea barei este cantitatea; etichete. |
| o scrisoare | Formulă de început, introducere, cuprins, încheiere, semnătură. |
| o zi de lucru | Ședințele ei, în ordine, fără suprapuneri. |

Cerințele ajung la părți după ținta și domeniul lor de aplicare. O cantitate rămâne cu felul pe care îl numără: în „two ducks and a swan”, doi este al rațelor.

Operațiile asupra unui întreg sunt generale, iar tiparul lumii spune ce este legitim.

| Operație | Ce păstrează |
|---|---|
| mai puține părți | Părțile obligatorii și legăturile dintre cele rămase: un flux scurtat rămâne legat; o scrisoare scurtată își păstrează formula de început și semnătura. |
| mai multe părți | Adaugă numai părți permise de graful conceptului. |
| nu toate la fel | Schimbă însușirea unor părți numai în regiunile permise. |
| leagă tot | Adaugă numai legături care au sens în tipar. |
| așază mai bine | Mută părțile spre locurile pe care cunoașterea le socotește potrivite: apa jos, cerul sus, rața pe apă; nodurile cu cât mai puține săgeți încrucișate. |

Rezultatul este un **plan (plan)**: o listă de schimbări de bază, fiecare cu rolurile ei.

## Lecția 26. Raționamentul

Raționamentul pornește la un semnal verificabil: un rol deschis, o contradicție sau o alegere. Toate mecanismele lucrează pe aceeași **vedere ca fapte**: lucruri cu felurile lor, însușiri ca puncte în spații, relații.

| Mecanism | Definiție și exemplu |
|---|---|
| deducție (deduction) | Aplică regulile și cunoașterea; dă ce decurge și ce se încalcă. Un nod fără săgeți spre el este un început; două ședințe ale Anei se suprapun. |
| completare cu cost minim | Dintre valorile candidate ale rolurilor deschise, respinge variantele cu încălcări tari și o alege pe cea mai ieftină. Peștii merg în iaz; ședința merge în cea mai apropiată oră liberă. Costul include distanța față de ce este obișnuit. În literatură, o formă de abducție. |
| extinderea unei valori comune | Dacă lucrurile de același fel au valori apropiate **venite de la om**, propune centrul lor pentru un lucru nou: toate nodurile sunt albastre fiindcă omul le-a cerut așa, deci nodul nou este albastru. În literatură, o formă de inducție. |
| rezolvitor (solver) | Caută valori pentru multe chei deschise deodată: orarul unei săptămâni. |

O căutare se încheie într-unul din cinci feluri: plan valabil; plan nedeterminat, cu ce nu s-a verificat; cerere nevalabilă; fără soluție, dovedit; căutare oprită, fără nicio concluzie. Limitele căutării sunt politici care se pot seta.

Căutările proprii ale unui domeniu sunt permise ca funcții declarate: găsirea unui loc liber pe pagină; așezarea nodurilor unei diagrame; compunerea textului unui paragraf din ce știe cunoașterea despre subiect. Planul hotărăște ce și cu ce valori, algoritmul găsește cum.

## Lecția 27. Execuția

Fiecare schimbare din plan este dusă la o unealtă prin legătură. Unealta primește numere și referințe, niciodată cuvinte.

Sunt ținute două stări: **starea observată**, citită din unelte, care poate fi și nevalidă (omul a tras cu mâna un pește pe cer), și **starea primită pentru execuție**, care trebuie să treacă verificarea. Unealta are dreptate despre stare; instanța de lume este oglinda ei.

După fiecare pas, starea este citită din nou și comparată cu efectul actului. Rezultatul execuției este unul dintre: executat; executat în parte; desfăcut; efect necunoscut; compensare eșuată.

O cerere executată este un singur pas de anulare, oricâte unelte a pornit. O reacție înlocuiește pasul pe care îl corectează. O întrebare nu este un pas.

## Lecția 28. Răspunsul

Răspunsul se compune din diferența de stare și din evidența execuției. Nu există propoziții scrise pe situație. Fiecare act are **un singur cadru de propoziție**, completat cu rolurile care s-au schimbat; cuvintele rolurilor, ale relațiilor și ale regiunilor vin din lumea limbii.

| Parte a răspunsului | De unde vine |
|---|---|
| ce s-a făcut | Din diferența netă de stare și din confirmările uneltelor. „I moved the duck to the lake” se spune numai dacă rața este acum pe lac. |
| ce s-a presupus | Din sursa și caracterul fiecărei valori; numai ce contează. |
| ce s-a adaptat | Aproximările și realizările împrumutate, o dată. |
| ce nu s-a putut | Fiecare cerință neîndeplinită, cu cuvintele omului și motivul. |
| ce nu s-a verificat | Verificările rămase nedeterminate. |
| ce nu s-a înțeles | Cuvintele necitite, în cuvintele omului. |

„What is in the picture?”, „What does the diagram show?”, „What is on Friday?” se răspund din stare. „What can you do here?” se răspunde din capabilități. Valorile se spun cu numele regiunii celei mai apropiate: un pește se numește „red”, nu trei numere; o ședință se numește „long”, față de celelalte.

Fiecare valoare ține minte sursa ei: aceasta este **proveniența (provenance)**. Ce nu poate fi rezolvat cu mecanismele existente se trece în **registrul cazurilor nerezolvate**, cu conceptul sau mecanismul general care lipsește.

---

# Partea a șasea. Cele patru domenii

Fiecare domeniu declară numai ce este al lui: felurile proprii, sloturile lor legate de concepte, capabilitățile, uneltele și legăturile. Niciunul nu are cuvinte de mărime, liste de culori sau de forme, întrebări, răspunsuri ori valori obișnuite proprii.

## Lecția 29. Desenul

```
@w          std.schema.world name=drawing
@t.page     core.type of=page  extends=std.schema.thing is=whole
@t.drawn    core.type of=drawn extends=std.schema.thing is=thing
@s.drawn.kind  core.slot of=drawn key=kind   type=k.kinds.kind means=kind
@s.drawn.at    core.slot of=drawn key=at     kind=point  means=place space=page
@s.drawn.in    core.slot of=drawn key=in     type=drawn  means=place relation=in
@s.drawn.on    core.slot of=drawn key=on     type=drawn  means=place relation=on
@s.drawn.size  core.slot of=drawn key=size   kind=number means=quality space=size
@s.drawn.col   core.slot of=drawn key=colour kind=point  means=quality space=colour
@k.drawn    std.schema.kind of=drawn world=drawing acts=make acts=place acts=change acts=remove
@op.add     std.tool.op world=drawing name=add    realises=make
@op.move    std.tool.op world=drawing name=move   realises=place
@op.set     std.tool.op world=drawing name=set    realises=change
@op.delete  std.tool.op world=drawing name=delete realises=remove
@f.free     core.function name=free_spot out.kind=point pure=true doc="a free position inside a region"
```

Ce lucruri se pot desena nu se declară aici: orice fel din arborele felurilor care are o imagine sau un strămoș cu imagine. Programul domeniului: patru unelte, vederea paginii, căutarea unui loc liber și imaginile.

| Omul spune | Ce se întâmplă și din ce decurge |
|---|---|
| „draw a landscape with water, ground, sky, clouds, sun, two different houses” | Un întreg cu părțile spuse; „different” cere ca cele două case să fie depărtate în spațiul însușirilor lor. Fiecare parte ajunge în regiunea pe care o dă cunoașterea. |
| „put a duck” | O rață, cu imaginea păsării dacă nu are una; rămâne rață. Locul: pe apă, din cunoaștere. |
| „on the lake” | Fragment pentru rolul loc. |
| „move the house down” apoi „down” | Un pas pe axa verticală; al doilea mesaj repetă același pas, cu același lucru. |
| „put a child on the swing” | Dacă nu există copil: „fă”, apoi „așază”. |
| „arrange everything more naturally” | „Așază mai bine”: fiecare lucru spre locul pe care cunoașterea îl socotește potrivit. |
| „random colours for the petals” | O alegere variată în spațiul culorilor, pentru părțile „petal” ale florilor. |
| „what is in the picture?” | Din stare, cu numele regiunilor. |

## Lecția 30. Diagramele, cu graficele ca fel de diagramă

```
@w          std.schema.world name=diagram
@t.diagram  core.type of=diagram extends=std.schema.thing is=whole
@t.node     core.type of=node    extends=std.schema.thing is=thing
@t.link     core.type of=link    extends=std.schema.thing is=relation
@s.node.label core.slot of=node key=label  kind=string means=name
@s.node.shape core.slot of=node key=shape  kind=point  means=quality space=shape
@s.node.col   core.slot of=node key=colour kind=point  means=quality space=colour
@s.node.at    core.slot of=node key=at     kind=point  means=place space=page
@s.node.value core.slot of=node key=value  kind=number means=quantity
@s.link.from  core.slot of=link key=from   type=node   means=role role=source
@s.link.to    core.slot of=link key=to     type=node   means=role role=goal
@k.node     std.schema.kind of=node world=diagram acts=make acts=place acts=change acts=remove
@k.link     std.schema.kind of=link world=diagram acts=make acts=remove
@f.layout   core.function name=layout out.kind=points pure=true doc="positions for nodes with few crossings"
```

Un **grafic** este un fel de diagramă: nodurile lui sunt bare sau puncte, iar o cantitate a fiecăruia (`value`) este pusă pe o axă a paginii. Nu este un domeniu separat. Felurile de diagrame (flux, arbore, hartă mentală, grafic cu bare, grafic cu linie) sunt grafuri de părți în cunoaștere.

| Omul spune | Ce se întâmplă și din ce decurge |
|---|---|
| „make a flowchart with six steps, no circles” | Șase noduri legate; forma fiecăruia în afara regiunii „circle”; începutul și sfârșitul cu forma dată de cunoaștere pentru rolul lor. |
| „fewer” | Mai puține noduri, fluxul rămâne legat. |
| „make the second one red” | Trimitere după ordine; schimbarea unei însușiri. |
| „connect them all” | Fiecare nod nelegat primește o legătură cu sens în tipar. |
| „make it nicer” | „Așază mai bine”: mai puține încrucișări, distanțe egale. |
| „a bar chart of meetings per person” | Un grafic; valorile vin din calendar, prin compunere. |
| „rounder boxes” | Un pas pe axa rotunjimii, în spațiul formelor. |

## Lecția 31. Documentele

```
@w          std.schema.world name=document
@t.text     core.type of=text    extends=std.schema.thing is=whole
@t.section  core.type of=section extends=std.schema.thing is=part
@s.text.genre  core.slot of=text    key=genre  type=k.kinds.kind means=kind
@s.text.about  core.slot of=text    key=about  kind=string means=topic
@s.text.title  core.slot of=text    key=title  kind=string means=name
@s.text.tone   core.slot of=text    key=tone   kind=point  means=quality space=tone
@s.sec.of      core.slot of=section key=of     type=text   means=part
@s.sec.role    core.slot of=section key=role   type=k.kinds.kind means=kind
@s.sec.order   core.slot of=section key=order  kind=number means=place space=order
@s.sec.length  core.slot of=section key=length kind=number means=quantity unit=word
@k.text     std.schema.kind of=text    world=document acts=make acts=change acts=remove
@k.section  std.schema.kind of=section world=document acts=make acts=place acts=change acts=remove
@f.compose  core.function name=compose out.kind=string doc="text for a part, from what the knowledge has about the topic"
```

Genurile (scrisoare, raport, poveste, notă) și părțile fiecăruia sunt grafuri în cunoaștere. Compunerea textului este o funcție declarată: planul hotărăște ce parte, despre ce și cât de lungă; funcția scrie.

| Omul spune | Ce se întâmplă și din ce decurge |
|---|---|
| „write a short formal letter about a late delivery” | O scrisoare cu părțile ei; „short” față de lungimea obișnuită a scrisorilor; „formal” este o regiune în spațiul tonului. |
| „longer” | Un pas pe axa lungimii; părțile se păstrează. |
| „move the apology before the explanation” | Schimbarea unei relații de ordine între două părți. |
| „a story about a fox, in three chapters” | Cantitatea este a părților „chapter”. Dacă cunoașterea nu are destul despre vulpi, se spune cât s-a putut scrie. |
| „warmer” | Un pas pe axa căldurii, în spațiul tonului. |
| „what is in the document?” | Din stare: genul, titlul, părțile. |

## Lecția 32. Calendarul

```
@w          std.schema.world name=calendar
@use        core.use world=w.person
@t.meeting  core.type of=meeting extends=std.schema.thing is=thing
@t.room     core.type of=room    extends=std.schema.thing is=thing resource=true
@s.meet.title  core.slot of=meeting key=title  kind=string  means=name
@s.meet.start  core.slot of=meeting key=start  kind=number  means=time part=start
@s.meet.length core.slot of=meeting key=length kind=number  means=time part=duration
@s.meet.room   core.slot of=meeting key=room   type=room    means=place relation=in
@s.meet.people core.slot of=meeting key=people type=w.person means=role role=participant many=set
@s.room.seats  core.slot of=room    key=seats  kind=number  means=quantity counts=w.person resource=true
@k.meeting  std.schema.kind of=meeting world=calendar acts=make acts=place acts=change acts=remove
```

La acestea se adaugă interdicția din lecția 6: un om nu poate fi în două ședințe care se suprapun; și aceeași interdicție pentru o sală. Calendarul seamănă cu orice lume în care lucrurile ocupă resurse: timpul unui om și o sală sunt resurse, la fel cum spațiul paginii este o resursă a desenului.

| Omul spune | Ce se întâmplă și din ce decurge |
|---|---|
| „a long meeting with Ana tomorrow afternoon” | „Long” față de ședințele din acest calendar; „afternoon” este o regiune pe axa orelor; ora exactă este cea mai apropiată liberă pentru Ana. |
| „later” | Un pas pe axa timpului; dacă noul interval se suprapune, cel mai apropiat liber. |
| „in the big room” | Fragment pentru rolul loc; „big” față de sălile care există. |
| „with Tom too” | Fragment pentru rolul participant; se verifică și timpul lui Tom. |
| „a meeting with Ana at ten thirty”, când Ana este ocupată | Refuz cu explicație și cu cea mai apropiată oră liberă. |
| „move everything on Friday to Monday” | Toate ședințele din regiunea „Friday”; rezolvitorul găsește ore fără suprapuneri. |
| „who is in the review?” | Întrebarea generală a rolului. |
| „what is on Friday?” | Din stare. |

## Lecția 33. Ce are voie să fie program și cum se măsoară

Programul unui domeniu nu dublează interpretarea și hotărârile care sunt declarate. O unealtă poate cunoaște lucrurile ei: unealta de desen știe cum arată un pește.

| Ce nu are voie să facă programul unui domeniu | De ce |
|---|---|
| să citească cererea | Unealta primește numere și referințe. |
| să țină cuvinte, sinonime sau liste de valori | Sunt nume de regiuni, în cunoaștere. |
| să aleagă cantitatea, felul, forma, locul, ora | Este treaba planului. |
| să țină valori obișnuite | Sunt regiuni, în cunoaștere. |
| să scrie propoziții de răspuns sau întrebări | Vin din cadrele actelor și din concepte. |

Și o declarație poate fi un petic: un rând scris pentru un lucru particular, când un strămoș îl putea purta, este refuzat la verificare.

| Măsură | Ce arată |
|---|---|
| sesiunile reale ale omului | Corecte, parțiale, refuzuri cu motiv, greșite. Verificările afirmă intenția și ce nu are voie să se schimbe. Greșitele rămân la zero. |
| inventarul declarațiilor particulare | Liste de cuvinte, rânduri de răspuns, realizări scrise pe fel, valori obișnuite pe un lucru, tabele de regiuni. Trebuie să scadă spre zero. |
| ce trece neschimbat între cele patru domenii | Limba, conceptele, spațiile, actele, cadrele de răspuns, completarea, verificarea. |
| costul calendarului, cu motorul înghețat | Rânduri de declarații, linii de unelte, ore; niciun mecanism schimbat. |
| perechi minimale și propoziții ținute deoparte | Fidelitatea citirii, pe ce nu s-a văzut. |

---

# Anexe

## Anexa A. Cu ce seamănă

Referințele sunt date din memorie, cu autor și an, și trebuie verificate înainte de publicare.

| Ideea | Înrudirea |
|---|---|
| valori ca puncte, cuvinte ca regiuni cu centru | Spațiile conceptuale (Gärdenfors 2000); teoria prototipurilor (Rosch 1975). |
| cuvinte de grad față de o clasă de comparație | Semantica adjectivelor graduale (Kennedy 2007). |
| lumea legendelor | Ontologiile de nivel înalt (DOLCE, SUMO, BFO); rolurile tematice; schemele-imagine. |
| fir cu chei și sloturi | Cadrele lui Minsky (1974); structurile de trăsături. |
| lume = fapte + schemă | Logicile descriptive; constrângerile de integritate. |
| fire deduse retrase fără temei | Menținerea adevărului (Doyle 1979; de Kleer 1986). |
| acte cu condiții și efecte; acte compuse | STRIPS (Fikes și Nilsson 1971); PDDL; planificarea ierarhică (Erol, Hendler și Nau 1994). |
| constrângeri tari și slabe; rezolvitor | Satisfacerea constrângerilor (Mackworth 1977). |
| valori obișnuite | Logica valorilor implicite (Reiter 1980). |
| completarea cu cost minim | Abducția cu costuri (Hobbs și colaboratorii 1993). |
| cererea, focusul, întrebarea deschisă | „Starea de informație” (Larsson și Traum 2000); GUS (Bobrow și colaboratorii 1977); SHRDLU (Winograd 1972). |
| corecția schimbă numai ce numește | Revizuirea convingerilor (Alchourrón, Gärdenfors și Makinson 1985). |
| starea observată și oglinda ei; compensarea | Vederi actualizabile (Foster și colaboratorii 2007); tranzacții cu compensare (Garcia-Molina și Salem 1987). |
| proveniența | Proveniența datelor (Green și colaboratorii 2007). |
| răspunsul compus din date | Generarea de limbaj (Reiter și Dale 2000). |
| teste din declarații; perechi minimale | Testarea pe proprietăți (Claessen și Hughes 2000); seturi de contrast. |

## Anexa B. Vocabular

| Termen | Explicație |
|---|---|
| fir, cheie, referință, fapt, circuit | Lecția 3. |
| spațiu de nume | Lecția 4. |
| lume, schemă, tip, slot, moștenire, cheie deschisă | Lecția 5. |
| validă, nevalidă, nedeterminată; încălcare; copie | Lecția 5. |
| variabilă, model, interdicție, regulă, fir dedus, funcție | Lecția 6. |
| lumea legendelor | Tiparul conceptelor generale. Lecția 8. |
| lucru, fel, parte și întreg, însușire, cantitate, relație, loc, timp, schimbare, act, rol, afirmație | Conceptele. Lecția 9. |
| spațiu conceptual, axă, regiune, centru, distanță | Lecția 10. |
| cuvânt de grad, clasă de comparație | Lecția 11. |
| schimbări de bază, act compus | Lecția 12. |
| tipar de lume, bază de cunoaștere, instanță de lume | Lecția 15. |
| fapt de domeniu, normă, valoare obișnuită, euristică | Lecția 15. |
| realizare | Felul în care un domeniu face un lucru: o imagine, o formă. Lecția 16. |
| import, extindere, restrângere, conflict, legare | Lecția 17. |
| domeniu de capabilități, capabilitate, unealtă, legătură | Lecția 19. |
| cerere, cerință, identitatea cerinței | Lecția 21. |
| focus, reacție, corecție, fragment, întrebare deschisă | Lecția 22. |
| toleranță | Câtă abatere este primită între punctul cerut și cel realizat. Lecția 23. |
| sursă, caracter, context, cost; cerință, preferință, presupunere | Lecția 24. |
| întreg, plan | Lecția 25. |
| deducție, completare cu cost minim, extinderea unei valori comune, rezolvitor | Lecția 26. |
| stare observată, stare primită pentru execuție, compensare | Lecția 27. |
| cadrul unui act, proveniență, registrul cazurilor nerezolvate | Lecția 28. |
