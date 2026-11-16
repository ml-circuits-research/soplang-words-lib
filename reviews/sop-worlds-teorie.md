# SOP Worlds: teoria

*Versiunea 9, 16 noiembrie 2026. Text de lucru în română; termenul englez este dat în paranteză la prima apariție. Exemplele de fire sunt în engleză, fiindcă așa se scriu în sistem.*

*Acest document descrie tehnologia **așa cum trebuie să fie**, ca și cum schimbările ar fi deja făcute: lumea legendelor, spațiile conceptuale în locul categoriilor, actele definite o singură dată. Ce diferă azi și ce este de schimbat, pe fiecare zonă de cod și de date, este în documentul pereche, „SOP Worlds: schimbările necesare” (`sop-worlds-schimbari.md`). Forma exactă a firelor noi din acest document este o propunere pe care biblioteca o va fixa.*

---

# Partea întâi. Ideea

## Lecția 1. Ce este SOP Worlds

SOP Worlds este un fel de a descrie o bucată de realitate ca o mulțime de declarații verificate, numită **lume (world)**. O lume spune ce lucruri există, ce legături sunt între ele, ce este permis și ce decurge din ce. Declarațiile sunt scrise într-un limbaj mic, SOP Lang. Un program general, biblioteca sopworld, ține o lume consistentă, răspunde la întrebări despre ea, trage concluzii și explică de ce a refuzat o schimbare.

Tehnologia are două niveluri. Primul este **modelul general**: cum se reprezintă o lume, cum se compun mai multe lumi, cum se trag concluzii și cum se verifică. Al doilea este **folosirea conversațională**: un om scrie o propoziție, iar sistemul face ceva real într-o aplicație. Al doilea este construit în întregime peste primul.

Regula care ține totul laolaltă este una singură: **se merge de la general spre particular, întotdeauna.** Fiecare declarație stă pe conceptul cel mai general pentru care este adevărată și se moștenește în jos. O lume particulară declară numai ce are ea diferit. Un caz nou nu cere niciodată un rând nou despre acel caz: ori este acoperit de ce există mai sus, ori lipsește o afirmație generală, care se adaugă sus și folosește tuturor domeniilor.

Tehnologia urmărește trei lucruri, fiecare măsurabil.

| Scop | Ce înseamnă |
|---|---|
| refolosire | Ce s-a declarat o dată este folosit în toate domeniile, fără a fi copiat. |
| extindere cu cost mic | Un domeniu nou se adaugă prin declarațiile lui proprii și câteva unelte mici. Înțelegerea limbii, luarea deciziilor și răspunsul nu se rescriu. |
| trasabilitate | Fiecare valoare dintr-un rezultat are o sursă care se poate arăta. Limitele sunt declarate: sistemul spune ce nu a înțeles, ce nu poate face și ce nu a putut verifica. |

Contribuția centrală este **un contract comun între intenția omului, modelul lumii, completarea valorilor, verificarea planului și evidența execuției**, același pentru orice domeniu, sprijinit pe un singur set de concepte generale.

## Lecția 2. Un exemplu urmărit de la un capăt la altul

Exemplul cursului este **o bibliotecă cu rafturi și cărți**. Starea de pornire: două rafturi, cel de sus și cel de jos, fiecare cu șase locuri. Pe cel de jos sunt cinci atlase.

Omul scrie: **„add three big blue novels”**.

| Etapă | Ce se întâmplă |
|---|---|
| 1. Starea | Sistemul citește ce este acum în bibliotecă. |
| 2. Interpretarea | Propoziția devine o cerere, în roluri generale: actul este „a face”; lucrul este de felul „roman”; cantitatea este trei; „blue” este o regiune în spațiul culorilor; „big” este un cuvânt de grad pe dimensiunea mărimii. |
| 3. Situarea | Este o cerere nouă. Rolul „loc” a rămas deschis. |
| 4. Înțelesul numeric | „Big” se calculează față de ce este în jur: cărțile de pe rafturi au mărimea obișnuită, deci „mare” înseamnă vizibil peste ea. „Blue” devine un punct în spațiul culorilor. |
| 5. Completarea | Locul are două variante: cele două rafturi. |
| 6. Raționamentul | Raftul de jos are un singur loc liber; trei cărți acolo ar depăși resursa lui. Se alege raftul de sus. |
| 7. Execuția | Actul „a face” are o definiție generală: după el, lucrurile există. Unealta domeniului este pornită cu valorile alese. Starea este citită din nou și conține trei romane. |
| 8. Răspunsul | „I added 3 big blue novels on the top shelf.” Propoziția este cadrul general al actului „a face”, completat cu rolurile; locul este spus fiindcă l-a ales sistemul. |

Omul scrie apoi **„on the bottom one”**. Nu este o propoziție întreagă. Este o valoare pentru rolul „loc” al cererii dinainte, deci o corectează: cărțile ar trebui să stea jos. Acolo nu încap. Sistemul răspunde: „There is 1 free place on the bottom shelf. I can move one novel there, or all three if you add places.”

Schema de mai jos arată părțile. Săgeata de întoarcere este esențială: după execuție, starea reală este citită din nou.

```
          LEGEND WORLD  (the general concepts: thing, kind, quality and its space,
                |         relation, place, time, change, act, role, statement ...)
                |  every type and every slot of every other world points to it
        ________|_________________________
       |                                  |
  world patterns                    knowledge bases
  (kinds, slots, rules, words)      (facts, norms, usual values, regions of spaces)
        \                                 /
         v                               v
        WORLD INSTANCE  <------------------------------------.
        (what exists now)                                     |
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
@b1 novel title="Moby Dick" cover=$c.navy size=1.4 on=$s1
```

`@b1` este **identificatorul (id)** firului. `novel` este **tipul (type)**. Restul sunt perechi `key=value`: cuvântul din stânga este **cheia (key)**, cel din dreapta este valoarea. O valoare este un număr, un text sau o **referință (reference)** la alt fir, scrisă cu `$`. Aici romanul are mărimea 1,4 (față de obișnuitul 1), o copertă care este un punct anume din spațiul culorilor și stă pe raftul `s1`.

Firele legate prin referințe formează un **circuit (circuit)**. Un fir care spune că ceva este așa se numește **fapt (fact)**.

Dacă o cheie poate avea mai multe valori și dacă ordinea lor contează este declarat de slotul ei (lecția 5).

## Lecția 4. Numele: puncte, prefixe și spații de nume

**Punctul nu are înțeles pentru limbaj.** Convenția este că prima parte a numelui unui tip spune de unde vine.

| Prefixul tipului | Ce înseamnă |
|---|---|
| `core.` | Tipuri ale limbajului însuși: `core.type`, `core.slot`, `core.rule`, `core.deny`. |
| `std.` | Tipuri ale modulelor generale ale bibliotecii: capabilități, unelte. |
| `w.legend.` | Lumea legendelor: conceptele generale (partea a treia). |
| `k.` | Baze de cunoaștere. |
| `w.` | Tipare de lumi refolosibile. |
| fără prefix | Tipuri proprii ale unui domeniu sau ale unui exemplu. |

Identificatorii cu punct (`@t.` pentru tipuri, `@s.` pentru sloturi) sunt tot o convenție de citire.

**Semnul `::` are înțeles.** El desparte un **spațiu de nume (namespace)** de identificator: `anna::b1` și `tom::b1` sunt două fire. O referință simplă rămâne în spațiul ei; o regulă se potrivește într-un singur spațiu; a putea scrie o referință nu înseamnă a avea drept de acces.

| Semn | Explicație |
|---|---|
| `@` | Aici se declară firul cu acest identificator. |
| `$` | Referință la un fir. |
| `?` | Variabilă (lecția 6). |
| `::` | Desparte spațiul de nume de identificator. |

## Lecția 5. Lumea, schema, tipurile și sloturile

O **lume (world)** este o mulțime de fire ținute împreună și verificate. Are fapte, care spun ce există, și o **schemă (schema)**, care spune ce fapte au voie să existe și ce decurge din ele.

Tipurile se declară cu `core.type`. Un tip poate **extinde** alt tip (`extends=`); ce se declară despre unul este valabil pentru toate cele care îl extind. Aceasta este **moștenirea (lineage)** și se urmează până la capăt.

Un **slot (slot)** este declarația unei chei pentru un tip, cu `core.slot`. Spune ce fel de valoare ține cheia, dacă este obligatorie, câte valori poate avea și, mai ales, **ce concept general realizează** (lecția 14).

```
@t.book       core.type of=book  extends=std.schema.thing is=thing
@s.book.title core.slot of=book  key=title kind=string  means=name
@s.book.size  core.slot of=book  key=size  kind=number  means=quality space=size
@s.book.cover core.slot of=book  key=cover kind=point   means=quality space=colour
@s.book.on    core.slot of=book  key=on    type=shelf   means=place relation=on required=true many=one
```

O cheie obligatorie fără valoare se numește **cheie deschisă (open key)**.

Lumea verifică fiecare schimbare. Rezultatul unei verificări are trei valori.

| Rezultat | Ce înseamnă |
|---|---|
| validă (valid) | Nicio încălcare tare, iar verificarea a fost completă. |
| nevalidă (invalid) | Cel puțin o încălcare tare. Refuzul este el însuși o declarație, numită **încălcare (violation)**, cu regula și firele în cauză. |
| nedeterminată (undetermined) | Nicio încălcare găsită, dar lipsește o valoare de care o regulă are nevoie sau căutarea a fost oprită. |

Înaintea unui act, constrângerile tari despre lucrurile pe care actul le schimbă trebuie verificate complet; dacă una rămâne nedeterminată, actul nu se execută și sistemul cere valoarea care lipsește. Constrângerile slabe pot rămâne nedeterminate și se spun în răspuns.

O lume ține minte ce s-a schimbat, deci poate anula. Și poate fi copiată: o **copie (fork)** este o a doua lume, identică la pornire, în care se poate încerca ceva fără a atinge originalul.

## Lecția 6. Reguli, interdicții, funcții

O **variabilă (variable)** se scrie `?name`. Un fir folosit pentru a căuta alte fire este un **model (pattern)**. Modelele aparțin schemei; un fapt nu devine niciodată model.

O **interdicție (deny)** spune că anumite modele nu au voie să se potrivească împreună. O **regulă (rule)** adaugă un fir când modelele ei se potrivesc; firul adăugat este **dedus (derived)** și este retras numai când nu mai are niciun temei.

```
@p.shelf  shelf room=?n
@p.books  book on=$p.shelf
@c.count  core.aggregate over=$p.books count=?have
@c.full   core.check fn=gte args=?have args=?n
@t.full   shelf.full of=$p.shelf
@r.full   core.rule when=$p.shelf with=$c.count if=$c.full then=$t.full
```

O constrângere este **tare (hard)**, și atunci schimbarea este refuzată, sau **slabă (soft)**, și atunci schimbarea este primită, dar lumea ține o **problemă (issue)**.

Unde este nevoie de un calcul, schema cheamă o **funcție (function)**. O funcție proprie, scrisă ca program, este permisă dacă este declarată în schemă și face numai calculul: două intervale de timp care se suprapun, două dreptunghiuri care se acoperă, locuri vecine la o masă rotundă.

## Lecția 7. Ce înseamnă exact declarațiile

| Întrebare | Răspuns |
|---|---|
| Ce înseamnă că o valoare lipsește? | Că nu este cunoscută. Nu înseamnă „fals”. O afirmație negativă se scrie explicit. |
| Ce face o regulă când îi lipsește o valoare? | Nu se potrivește, iar verificarea este nedeterminată pentru acea regulă. |
| Cum se deosebește un model de un fapt? | Modelele stau în schemă. Un fir care există ca fapt nu poate fi numit de o regulă; aceasta este o eroare la încărcare. |
| Unde este valabilă o variabilă? | În regula în care apare. |
| Câte valori are o cheie? | Cât declară slotul: una, o mulțime sau o listă ordonată. |
| Când dispare un fir dedus? | Când nu mai are niciun temei. |

---

# Partea a treia. Lumea legendelor

## Lecția 8. De ce o lume a legendelor

Dacă fiecare lume și-ar descrie singură cheile, fiecare ar inventa propriul fel de a spune „unde”, „cât de mare”, „ce culoare”, iar mecanismele ar trebui să învețe fiecare lume în parte. De aceea există un singur loc în care stau conceptele generale: **lumea legendelor (the legend world)**. Este un tipar de lume. Nu conține lucruri; conține conceptele prin care se descrie orice lume. Orice tip și orice slot din orice altă lume arată spre un concept din ea.

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

**Ce există.**

| Concept | Ce este |
|---|---|
| lucru (thing) | Orice despre care se poate vorbi și care poate fi arătat: o carte, o ședință, un nor, un capitol. |
| fel (kind) | Ce este un lucru. Felurile formează un singur arbore: o rață este o pasăre, o pasăre este un animal. |
| parte și întreg (part, whole) | Un lucru făcut din alte lucruri: o pădure din copaci, o scrisoare din părțile ei. |
| grup și ordine (collection, sequence) | Mai multe lucruri luate împreună, cu sau fără ordine. |
| nume și semn (name, sign) | Cuvântul prin care un lucru, un fel sau o regiune a unui spațiu este numit. Aici se leagă limba. |

**Cum este.**

| Concept | Ce este |
|---|---|
| însușire (quality) | O proprietate a unui lucru. Valoarea ei este un punct într-un spațiu conceptual. |
| spațiu conceptual (conceptual space) | Spațiul valorilor unei însușiri: una sau mai multe axe numerice, sau un graf de relații și constrângeri (lecția 10). |
| cantitate (quantity) | Un număr, cu sau fără unitate. Este cazul cel mai simplu de spațiu: o singură axă. |
| stare (state) | Valorile însușirilor și relațiilor unui lucru la un moment. |

**Cum se leagă.**

| Concept | Ce este |
|---|---|
| relație (relation) | Ceva care ține între două lucruri. |
| loc (place) | Unde este un lucru: o poziție, o regiune, o relație cu alt lucru, o direcție, o distanță (lecția 13). |
| timp (time) | Când: un moment, un interval, o durată, o ordine, o repetare (lecția 13). |
| apartenență (belonging) | Al cui este un lucru; cine face parte dintr-un grup. |
| asemănare (likeness) | Cât de apropiate sunt două lucruri sau două valori; se calculează în spațiul lor. |
| dependență (dependence) | Un lucru are nevoie de altul. |

**Ce se întâmplă.**

| Concept | Ce este |
|---|---|
| schimbare (change) | Trecerea de la o stare la alta. Sunt patru schimbări de bază (lecția 12). |
| act (act) | O schimbare cerută sau făcută de cineva, definită o singură dată. |
| rol (role) | Locul unui lucru într-un act: cine face, asupra a ce, ce rezultă, cu ce, de unde, încotro, pentru cine. |
| mod (manner) | Cum este făcut un act. |
| cauză și scop (cause, purpose) | De ce s-a întâmplat ceva; pentru ce se face. |

**Ce se știe și ce se vrea.**

| Concept | Ce este |
|---|---|
| afirmație (statement) | Ceva spus despre lucruri. Felul ei: fapt, normă, valoare obișnuită, euristică, preferință, cerință a omului, presupunere a sistemului. |
| siguranță și sursă (certainty, source) | Cât de sigură este o afirmație și de unde vine. |
| negație și cuprindere (negation, scope) | Nu; toate, unele, niciunul, fiecare. |
| condiție și limită (condition, limit) | Când este valabilă o afirmație; între ce margini poate fi o valoare. |
| întrebare și răspuns (question, answer) | Ce nu se știe și se cere; ce se dă înapoi. |

**Cine și cu ce.**

| Concept | Ce este |
|---|---|
| cel care acționează (agent) | Omul, sistemul, o altă parte. |
| capabilitate (capability) | Ce acte poate îndeplini un domeniu, și asupra a ce. |
| unealtă și resursă (tool, resource) | Cu ce se îndeplinește un act; ce se consumă sau se ocupă: un loc pe raft, o sală, o oră. |

## Lecția 10. Spațiile conceptuale

Aceasta este lecția de care depinde generalizarea. **O valoare nu este o etichetă dintr-o listă. Este un punct într-un spațiu.**

Un spațiu conceptual are una sau mai multe **axe (axes)**, fiecare numerică. Mărimea are o axă. Durata are o axă. Culoarea are trei: nuanța, saturația, luminozitatea. Forma are câteva: numărul de laturi, rotunjimea, alungirea, simetria. Vârsta are o axă.

```
@sp.colour w.legend.space name=colour
@ax.hue    w.legend.axis  of=colour name=hue        kind=angle
@ax.sat    w.legend.axis  of=colour name=saturation min=0 max=1
@ax.light  w.legend.axis  of=colour name=lightness  min=0 max=1
@sp.size   w.legend.space name=size
@ax.mag    w.legend.axis  of=size   name=magnitude  min=0 unit=relative
```

Un cuvânt ca „roșu”, „oval”, „tânăr” nu este o categorie rigidă. Este o **regiune (region)** a spațiului, cu un **centru tipic** și o întindere. Regiunile stau în bazele de cunoaștere, nu în sloturi.

```
@rg.red   w.legend.region of=colour name=red  centre.hue=0   centre.saturation=0.9 centre.lightness=0.5 spread=0.12
@rg.navy  w.legend.region of=colour name=navy centre.hue=240 centre.saturation=0.8 centre.lightness=0.25 spread=0.06 inside=blue
```

Din aceasta decurg, prin calcul și pentru orice spațiu, lucruri care altfel ar trebui scrise pe caz.

| Operație | Ce dă |
|---|---|
| distanță | Cât de apropiate sunt două valori: două culori, două forme, două mărimi. |
| cel mai apropiat | Dintre valorile pe care o unealtă le poate realiza, care este cea mai aproape de cea cerută. |
| apartenență | Dacă un punct este „roșu”: cât de aproape este de centrul regiunii. |
| pas | „Mai închis” este un pas pe axa luminozității; „mai mare” pe axa mărimii; „mai târziu” pe axa timpului. Același mecanism. |
| între | O valoare la mijloc între alte două. |
| cuprindere | „Navy” este în „blue”: o regiune în alta. |

Unele concepte nu se măsoară pe axe: un gen de text, un fel de diagramă, o așezare. Pentru ele spațiul este un **graf de relații și constrângeri**: din ce părți este făcut conceptul, în ce ordine, ce este obligatoriu, ce exclude ce. O scrisoare are o formulă de început, un cuprins și o încheiere, în această ordine; un raport are titlu, introducere, secțiuni și concluzie. Apropierea dintre două astfel de concepte se calculează pe graf: câte părți și relații au în comun. De aici vine răspunsul la „ce seamănă cel mai mult cu ce am cerut”.

Câteva lucruri rămân discrete prin natura lor, fiindcă țin de un sistem formal închis: persoana și timpul unui verb, da sau nu, starea unei cereri. Acestea sunt excepții declarate și motivate, nu regula.

## Lecția 11. Cuvintele și spațiile: înțelesul vine din context

„Mare”, „mic”, „uriaș”, „scurt”, „multe” sunt **cuvinte de grad (degree words)**. Sunt subiective: un șoarece mare este mai mic decât un elefant mic. Nu sunt valori ale lucrului și nu stau în schema lui. În schemă, mărimea este un număr.

Înțelesul unui cuvânt de grad se calculează de fiecare dată față de o **clasă de comparație (comparison class)**, luată în această ordine.

| De unde vine clasa de comparație | Exemplu |
|---|---|
| lucrurile de același fel care sunt acum în instanța de lume | „a big tree” într-un desen cu cinci copaci: mai mare decât cei de acolo. |
| ce a făcut omul până acum în această instanță | Dacă a micșorat de două ori casele, „mare” pentru el este mai puțin. |
| ce este obișnuit pentru acel fel în acest fel de lume | Mărimea obișnuită a unui copac într-un desen; lungimea obișnuită a unei scrisori. Vine din cunoaștere și se învață din folosire, pentru fiecare fel de lume. |
| spațiul disponibil | O pagină, un raft, o zi. |

Cuvântul de grad dă un factor față de clasa de comparație, iar rezultatul este un număr. Un comparativ („bigger”, „later”, „more”) este un pas numeric față de valoarea de acum a lucrului.

```
@dg.big   w.legend.degree word=big   direction=up   factor=1.6
@dg.huge  w.legend.degree word=huge  direction=up   factor=2.5
@dg.small w.legend.degree word=small direction=down factor=0.6
```

Factorii sunt puncte de pornire. Când omul corectează („bigger” imediat după ce a cerut „big”), factorul cuvântului se mută pentru acel fel de lume. Aceasta este învățarea: ține de instanță întâi și poate deveni cunoaștere a felului de lume.

Cuvintele care numesc regiuni („red”, „round”, „formal”) se înțeleg la fel: sunt nume ale unor regiuni, iar o lume poate avea regiunea ei puțin diferită.

## Lecția 12. Schimbări și acte

Sunt patru **schimbări de bază**. Orice se întâmplă într-o lume este una dintre ele sau o înșiruire a lor.

| Schimbare | Ce este |
|---|---|
| apariție (appear) | Un lucru care nu exista există. |
| dispariție (disappear) | Un lucru care exista nu mai există. |
| schimbarea unei însușiri (quality change) | Un punct se mută în spațiul lui: altă culoare, altă mărime. |
| schimbarea unei relații (relation change) | Un lucru ajunge în altă relație: alt loc, alt timp, alt posesor. |

Un **act (act)** este o schimbare cerută. Fiecare act este definit o singură dată, în lumea legendelor: ce roluri are, ce trebuie să fie adevărat înainte și ce este adevărat după.

```
@act.make   w.legend.act name=make   change=appear    role=result  after="result exists"
@act.remove w.legend.act name=remove change=disappear role=object  before="object exists" after="object does not exist"
@act.change w.legend.act name=change change=quality   role=object  role=quality before="object exists"
@act.place  w.legend.act name=place  change=relation  role=object  role=goal    before="object exists" after="object is at goal"
```

Din aceste definiții decurg actele compuse, fără a fi scrise. „Put a child on the swing”, când nu există niciun copil: actul „a așeza” cere ca lucrul să existe; nu există; singurul act care îl poate face să existe este „a face”; deci planul este „fă un copil, apoi așază-l”. La fel „replace” este „remove” și „make”, iar „copy” este „make” cu aceleași însușiri.

Tot din definiție decurge verificarea de după execuție: după „a face”, lucrul trebuie să existe în stare; după „a așeza”, relația trebuie să țină. Dacă nu, actul nu s-a făcut și răspunsul spune asta.

Cuvintele unui act („draw”, „add”, „create”, „put” pentru „a face”) sunt nume ale actului și stau în lumea limbii și în baza verbelor.

## Lecția 13. Locul și timpul

**Locul** este general, nu al fiecărui domeniu. Are patru forme, toate numerice sau relaționale.

| Formă | Ce este |
|---|---|
| poziție | Un punct în spațiul domeniului: coordonate pe o pagină, un loc pe un raft. |
| regiune | O parte a spațiului: sus, jos, stânga, dreapta, centru, margine, colț. Fiecare este o regiune pe axele poziției. |
| relație cu alt lucru | Pe, în, lângă, deasupra, sub, între, în fața. Fiecare are o definiție numerică: „lângă” este o distanță mică; „deasupra” este o diferență pe axa verticală. |
| direcție și distanță | Un pas pe o axă: în sus, la stânga, mai aproape. |

Un domeniu își leagă regiunile proprii de acestea: cerul unui desen este regiunea de sus; apa unui iaz este un lucru, iar „pe apă” este relația „pe” cu acel lucru. „Over water” nu devine niciodată „marea” dacă în desen nu este nicio mare.

**Timpul** are aceleași forme: un moment, un interval, o durată, o ordine (înainte, după, în timpul), o repetare. „In the afternoon” este o regiune pe axa orelor. „Later” este un pas. Două intervale care se suprapun sunt o relație calculată.

## Lecția 14. Cum se leagă o lume de lumea legendelor

Fiecare tip spune ce concept este (`is=`). Fiecare slot spune ce concept realizează (`means=`), cu precizarea lui: care spațiu, care relație, care rol. Un slot fără concept este refuzat la verificare.

```
@t.book        core.type of=book  extends=std.schema.thing is=thing
@t.shelf       core.type of=shelf extends=std.schema.thing is=thing
@s.book.title  core.slot of=book  key=title kind=string means=name
@s.book.cover  core.slot of=book  key=cover kind=point  means=quality space=colour
@s.book.size   core.slot of=book  key=size  kind=number means=quality space=size
@s.book.on     core.slot of=book  key=on    type=shelf  means=place relation=on required=true
@s.shelf.room  core.slot of=shelf key=room  kind=number means=quantity counts=book resource=true
```

Din `means=place relation=on` decurg, fără niciun rând scris pentru rafturi:

| Ce decurge | Cum |
|---|---|
| întrebarea când lipsește valoarea | Întrebarea generală a locului, cu tipul valorii: „Which shelf?”. |
| fragmentul | „on the top shelf”, spus singur, completează sau corectează rolul loc al cererii dinainte. |
| trimiterea | „the book on the top shelf” găsește cartea prin relație. |
| mutarea | „move it up” este un pas pe direcția „sus”. |
| verificarea | Raftul este o resursă care numără cărți, deci are o limită. |
| răspunsul | Cadrul general al actului, cu relația „on” și numele locului. |

Din `means=quality space=size` decurg „bigger”, „the biggest one”, „as big as the atlas”, „a huge one”, aproximarea la ce poate unealta și întrebarea „How big?”.

---

# Partea a patra. Tipare, cunoaștere, instanțe

## Lecția 15. Trei roluri ale lumilor

| Rol | Ce este |
|---|---|
| tipar de lume (world pattern) | O **specificație** refolosibilă: felurile de lucruri ale unui fel de lume, sloturile lor legate de concepte, constrângerile, cuvintele proprii. Exemplu: `w.seating`, ce este un plan de mese. |
| bază de cunoaștere (knowledge base) | **Conținut** general, valabil într-un context declarat: arborele felurilor, regiunile spațiilor, părțile lucrurilor, ce este obișnuit. |
| instanță de lume (world instance) | O **stare concretă**: lucrurile unui om sau ale unei sarcini, cu valorile lor de acum. |

> **Numele vechi.** În programul și documentele mai vechi, cele trei se numesc *schema lumii* (world schema), *lume de cunoaștere* (knowledge world) și *lume vie* (live world).

Lumea legendelor este un tipar, cel mai general dintre toate. Celelalte tipare și toate bazele de cunoaștere se sprijină pe ea.

Fiecare rând al unei baze de cunoaștere își declară felul, fiindcă mecanismele le tratează diferit.

| Fel de cunoaștere | Exemplu și cum se folosește |
|---|---|
| fapt de domeniu | „Peștele trăiește în apă.” Despre realitate. Poate întemeia o constrângere. |
| normă | „Un raport are o concluzie.” Cum trebuie să fie ceva într-o practică. Se verifică. |
| valoare obișnuită | „O diagramă de flux are de obicei șapte pași.” Completează ce omul nu a spus; cedează oricărei cerințe. |
| euristică | „Un lucru mic stă într-un colț.” O regulă de bună alegere, valabilă într-un context. |

Ce este publicat în depozitul comun este **standardizat**: nume fix, schemă verificată, licență. Cunoașterea nu enumeră niciodată domeniile unei aplicații.

## Lecția 16. Un singur arbore al felurilor și moștenirea

Toate felurile de lucruri stau într-un singur arbore: o rață este o pasăre, un bunic este un bărbat, un bărbat este un om, o scrisoare este un text. Patru lucruri se moștenesc pe acest arbore, și aceasta scutește de rânduri pe caz.

| Ce se moștenește | Exemplu |
|---|---|
| capabilitățile | Ce se poate face cu o carte se poate face cu un atlas. |
| realizarea | Dacă un domeniu nu are o imagine pentru rață, o folosește pe a păsării. Lucrul rămâne o rață: „the duck” îl găsește, iar culoarea spusă i se aplică. Se spune o dată ce imagine a fost folosită. |
| ce este obișnuit | Ce este obișnuit pentru orice text este valabil pentru o scrisoare; scrisoarea declară numai ce are diferit: părțile ei. |
| cuvintele | „Bird” găsește și rațele. |

Părțile unui lucru vin din aceeași cunoaștere: o față are ochi și gură; o pădure are copaci. Un domeniu nu le rescrie.

## Lecția 17. Compunerea lumilor

Compunerea are trei operații.

| Operație | Ce înseamnă |
|---|---|
| import | O lume încarcă un tipar publicat, la o versiune fixată. Tipurile, sloturile și regulile lui devin ale ei. |
| extindere | O lume specializează ce a importat: un tip nou, sau o **restrângere** a unui slot moștenit (un interval mai îngust, o regiune mai mică a unui spațiu). O restrângere este permisă. Două definiții de neîmpăcat sunt un **conflict**, spus la încărcare. |
| legare | Un slot ține un lucru din altă lume. Legarea se face de un lucru anume, cu identitate stabilă; un nume spus de om dă candidați. |

Exemplu: biblioteca, tiparul persoanelor și o lume a împrumuturilor.

```
@t.loan      core.type of=loan extends=std.schema.thing is=thing
@s.loan.book core.slot of=loan key=book   type=book     means=role role=object required=true
@s.loan.who  core.slot of=loan key=person type=w.person means=belonging required=true
@s.loan.till core.slot of=loan key=until  kind=number   means=time part=end
@p.l1  loan book=?b
@p.l2  loan book=?b
@c.two core.check fn=neq args=$p.l1 args=$p.l2
@d.one core.deny when=$p.l1 when=$p.l2 if=$c.two why="that book is already on loan"
```

## Lecția 18. Folosirea fără dialog

**Verificarea unui document.** Cunoașterea are norma că un raport are titlu, introducere, cel puțin două secțiuni și o concluzie. Un document este încărcat ca fapte. Lumea răspunde ce lipsește, ce este încălcat și ce nu a putut verifica. Poate spune și cu ce gen seamănă cel mai mult documentul, din graful părților.

**Un orar cu resurse.** Săli, oameni, ședințe. O sală și un om sunt resurse; două ședințe ale aceluiași om nu se suprapun. Ora și sala fiecărei ședințe sunt chei deschise. Un **rezolvitor (solver)** caută valori pentru toate deodată.

---

# Partea a cincea. Conversația

## Lecția 19. Domeniu, capabilitate, unealtă, legătură

Un **domeniu de capabilități (capability domain)** este o parte a sistemului care poate face lucruri reale: desen, diagrame, documente, calendar. Are o instanță de lume, unelte și vederea stării. Pe ecran apare de obicei ca o filă sau ca un document separat; aceasta este numai înfățișarea lui.

O **capabilitate (capability)** este o promisiune declarată: ce act general, asupra cărui fel de lucru, și de ce roluri ține cont.

O **unealtă (tool)** este o operație de program cu parametri numerici sau de referință. Nu știe nimic despre propoziții.

O **legătură (binding)** spune ce unealtă îndeplinește ce act și din ce rol vine fiecare parametru.

```
@k.book    std.schema.kind    of=book world=library acts=make acts=place acts=change acts=remove
@h.make    std.schema.honours world=library act=make of=book role=kind role=quantity role=quality role=place
@op.add    std.tool.op        world=library name=add realises=make
@pa.size   std.tool.param     op=add name=size  space=size   can=0.7 can=1 can=1.5 tolerance=0.4
@pa.cover  std.tool.param     op=add name=cover space=colour
@pa.on     std.tool.param     op=add name=on    role=place
@b.make    std.tool.bind      world=library act=make of=book op=add
```

Parametrul `size` spune ce puncte ale spațiului poate realiza unealta și câtă abatere este primită. Efectul uneltei nu se declară pe unealtă: este efectul actului pe care îl realizează.

**Domeniul care răspunde este cel care poate îndeplini cererea.** Se alege din capabilități, nu după ce este deschis pe ecran: „make the avatar a robot”, spus în timp ce este deschis desenul, ajunge la domeniul avatarului.

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

O **cerere (request)** este o mică lume de fire. Nu are chei proprii: folosește conceptele lumii legendelor.

Pentru „add three big blue novels on the top shelf”:

| Parte a cererii | Valoare |
|---|---|
| actul | `make` |
| rolul rezultat, felul | `novel` |
| cantitatea | 3 |
| însușire, spațiul mărimii | cuvântul de grad „big” |
| însușire, spațiul culorilor | regiunea „blue” |
| locul | relația „on”, cu raftul găsit prin „top” |

Fiecare **cerință (constraint)** a cererii are: conceptul (ce rol sau ce însușire), sensul (vreau, nu vreau, nu toate), ținta (despre care lucru sau grup din cerere), domeniul de aplicare, cuantificatorul (fiecare sau în total), caracterul (cerință sau preferință) și cuvintele din care a fost citită. Acestea formează **identitatea** cerinței.

La ce se leagă fiecare cuvânt hotărăște lumea limbii, prin reguli generale: întinderea negației („not all” față de „none”), cuantificatorii („on each shelf” față de „on the shelves”), apropierea („the blue atlas”: albastru este atlasul).

Sunt două verificări diferite ale citirii. **Consistența recodificării**: cererea, spusă înapoi și citită din nou, dă aceeași cerere. **Fidelitatea**: se măsoară pe exemple cu interpretare de referință și pe perechi minimale, în care schimbarea unei negații, a unei ținte sau a unui cuantificator trebuie să schimbe cererea.

Dacă rămân cuvinte necitite într-un loc care contează, cererea nu se execută. Un cuvânt este corectat numai dacă nicio sursă nu îl cunoaște și există un singur candidat limpede.

Limba mesajului este cea aleasă de om în aplicație.

## Lecția 22. Situarea: focus, reacții, fragmente, trimiteri, întrebări

Dialogul ține un **focus**: lucrurile despre care se vorbește, selecția activă și cererea care este corectată.

| Ce poate fi un mesaj | Cum se recunoaște și ce face |
|---|---|
| cerere nouă | Are un act și un lucru nou. |
| reacție | Judecă ce s-a făcut: „fewer”, „too big”, „another one”. Schimbă numai ce numește: un pas pe o axă, o cerință întoarsă, altă variantă. |
| corecție | Dă o valoare pentru o cerință care există: „red, actually”. O înlocuiește pe cea cu aceeași identitate. |
| fragment | Dă o valoare pentru un rol deschis sau pentru rolul cel mai recent: „on the lake”, „down”, „two of them”. |
| răspuns | Urmează unei întrebări puse de sistem și o completează. |
| laudă sau mulțumire | Nu schimbă nimic. |

Trimiterile la lucruri care există se rezolvă prin concepte: după nume, după fel și însușire („the blue atlas”: cel mai aproape de regiunea „blue”), după ordine, după relație („the one next to the dictionary”), după pronume (lucrurile din focus), după plural hotărât (selecția activă, altfel toate de acel fel).

Dacă se potrivesc mai multe și omul a vorbit la singular, sistemul întreabă și enumeră candidații într-o ordine stabilă.

Întrebările nu sunt scrise de mână pentru fiecare slot. Fiecare concept are întrebarea lui generală („Where?”, „How big?”, „Which one?”, „When?”), completată cu tipul valorii. Sistemul întreabă cel mult o dată pe mesaj, numai când nu există o presupunere rezonabilă, și ține minte **întrebarea deschisă** până vine răspunsul.

## Lecția 23. Înțelesul numeric și adaptarea

Cuvintele de grad și numele de regiuni devin puncte în spații, după lecțiile 10 și 11. Apoi punctul cerut este comparat cu ce poate realiza unealta.

| Situație | Ce se face |
|---|---|
| unealta poate realiza punctul | Se folosește întocmai. |
| unealta poate realiza un punct apropiat, în toleranța declarată | Se folosește cel mai apropiat și se spune o dată. |
| punctul cel mai apropiat este dincolo de toleranță | Nu se aproximează; se explică ce poate unealta. |
| felul cerut nu are o realizare proprie | Se folosește realizarea strămoșului cel mai apropiat din arbore; lucrul își păstrează felul; se spune o dată. |

Regula comună: sistemul face cât poate de bine și spune ce a făcut altfel. Nu oprește omul cu întrebări pentru o înlocuire. Cerința originală se păstrează în cerere, cu transformarea notată lângă ea.

## Lecția 24. Completarea

Fiecare valoare dintr-o cerere are patru însușiri separate: **sursa** (de unde vine), **caracterul** (cerință, preferință sau presupunere), **contextul** (pentru ce lucru și cât timp) și **costul** (cât de slabă este presupunerea).

| Caracter | Ce îi datorează sistemul |
|---|---|
| cerință | Trebuie îndeplinită. Dacă nu se poate, sistemul explică sau întreabă. |
| preferință | Se îndeplinește cât se poate, după cerințe. |
| presupunere | Poate fi schimbată oricând și se spune când contează. |

Dacă două cerințe nu pot fi îndeplinite împreună, niciuna nu cedează pentru că este mai veche: sistemul spune ce se bate cap în cap și întreabă.

Rolurile rămase deschise primesc valori candidate din: ce a spus omul mai devreme despre același lucru; ce au în comun lucrurile pe care omul le-a cerut așa; ce este obișnuit pentru acel fel, moștenit pe arbore; o alegere variată în regiunea obișnuită. O valoare obișnuită completează numai ce omul a lăsat gol.

Ce este obișnuit se scrie pe felul cel mai general și are forma unei regiuni, nu a unei valori fixe: numărul pașilor unei diagrame de flux este o regiune pe axa cantității, cu un centru.

Când omul cere mai multe lucruri deodată, se verifică în plan dacă sunt independente: nu împart o resursă sau o limită, nicio regulă nu le leagă și omul nu a cerut „numai împreună”. Pentru lucruri independente se face ce se poate și se spune ce lipsește.

## Lecția 25. Întregul și părțile

Omul cere adesea un **întreg (whole)**: o pădure, o diagramă, un raport. Uneltele fac părți. Din ce părți este făcut un întreg vine din cunoaștere: din graful conceptului (lecția 10) și din ce este obișnuit pentru felul lui.

Cerințele ajung la părți după ținta și domeniul lor de aplicare. O cantitate rămâne cu felul pe care îl numără.

Operațiile asupra unui întreg cu părți și legături sunt generale, iar tiparul lumii spune ce este legitim: tăierea la un număr de părți păstrează părțile obligatorii; completarea adaugă numai părți permise; „nu toate la fel” schimbă felul unor părți numai între felurile permise; „leagă tot” adaugă numai legături cu sens în tipar.

Rezultatul este un **plan (plan)**: o listă de schimbări de bază, fiecare cu rolurile ei.

## Lecția 26. Raționamentul

Raționamentul pornește la un semnal verificabil: un rol deschis, o contradicție sau o alegere. Toate mecanismele lucrează pe aceeași **vedere ca fapte**: lucruri cu felurile lor, însușiri ca puncte în spații, relații.

| Mecanism | Definiție |
|---|---|
| deducție (deduction) | Aplică regulile și cunoașterea; dă ce decurge și ce se încalcă. Garantează numai ce a ajuns să verifice. |
| completare cu cost minim | Dintre valorile candidate ale rolurilor deschise, respinge variantele cu încălcări tari și o alege pe cea mai ieftină. Costul include distanța, în spațiul ei, față de ce este obișnuit. În literatură, o formă de abducție. |
| extinderea unei valori comune | Dacă lucrurile de același fel au valori apropiate **venite de la om**, propune centrul lor pentru un lucru nou. În literatură, o formă de inducție. |
| rezolvitor (solver) | Caută valori pentru multe chei deschise deodată. |

O căutare se încheie într-unul din cinci feluri: plan valabil; plan nedeterminat, cu ce nu s-a verificat; cerere nevalabilă; fără soluție, dovedit; căutare oprită, fără nicio concluzie. Limitele căutării sunt politici care se pot seta.

Căutările proprii ale unui domeniu (așezarea nodurilor unei diagrame, găsirea unui loc liber) sunt permise ca funcții declarate: planul hotărăște ce și cu ce valori, algoritmul găsește cum.

## Lecția 27. Execuția

Fiecare schimbare din plan este dusă la o unealtă prin legătură. Unealta primește numere și referințe, niciodată cuvinte.

Sunt ținute două stări: **starea observată**, citită din unelte, care poate fi și nevalidă, și **starea primită pentru execuție**, care trebuie să treacă verificarea. Unealta are dreptate despre stare; instanța de lume este oglinda ei.

După fiecare pas, starea este citită din nou și comparată cu efectul actului. Rezultatul execuției este unul dintre: executat; executat în parte; desfăcut; efect necunoscut; compensare eșuată. O compensare nu este o anulare exactă.

O cerere executată este un singur pas de anulare, pentru uneltele care declară că pot anula. O reacție înlocuiește pasul pe care îl corectează. O întrebare nu este un pas.

## Lecția 28. Răspunsul

Răspunsul se compune din diferența de stare și din evidența execuției. Nu există propoziții scrise pe situație. Fiecare act are **un singur cadru de propoziție**, completat cu rolurile care s-au schimbat; cuvintele rolurilor, ale relațiilor și ale regiunilor vin din lumea limbii.

| Parte a răspunsului | De unde vine |
|---|---|
| ce s-a făcut | Din diferența netă de stare și din confirmările uneltelor. Un răspuns spune „am făcut” numai pentru o schimbare care este în stare. |
| ce s-a presupus | Din sursa și caracterul fiecărei valori; numai ce contează. |
| ce s-a adaptat | Aproximările și realizările împrumutate, o dată. |
| ce nu s-a putut | Fiecare cerință neîndeplinită, cu cuvintele omului și motivul. |
| ce nu s-a verificat | Verificările rămase nedeterminate. |
| ce nu s-a înțeles | Cuvintele necitite. |

„What is on the shelf?” se răspunde din stare. „What can you do here?” se răspunde din capabilități. Valorile se spun cu numele regiunii celei mai apropiate: o copertă se numește „navy”, nu trei numere.

Fiecare valoare ține minte sursa ei: aceasta este **proveniența (provenance)**. Ce nu poate fi rezolvat cu mecanismele existente se trece în **registrul cazurilor nerezolvate**, cu conceptul sau mecanismul general care lipsește.

---

# Partea a șasea. Domenii

## Lecția 29. Structura unui domeniu

Un domeniu declară numai ce este al lui: felurile proprii, sloturile lor legate de concepte, capabilitățile, uneltele și legăturile. Tot restul vine de sus.

```
@w        std.schema.world name=library
@t.shelf  core.type of=shelf extends=std.schema.thing is=thing
@t.book   core.type of=book  extends=k.kinds.book     is=thing
@s.shelf.room  core.slot of=shelf key=room  kind=number means=quantity counts=book resource=true
@s.shelf.at    core.slot of=shelf key=at    kind=point  means=place space=position
@s.book.title  core.slot of=book  key=title kind=string means=name
@s.book.cover  core.slot of=book  key=cover kind=point  means=quality space=colour
@s.book.size   core.slot of=book  key=size  kind=number means=quality space=size
@s.book.on     core.slot of=book  key=on    type=shelf  means=place relation=on required=true
@k.shelf  std.schema.kind    of=shelf world=library acts=make
@k.book   std.schema.kind    of=book  world=library acts=make acts=place acts=change acts=remove
@op.add    std.tool.op world=library name=add      realises=make
@op.shelf  std.tool.op world=library name=addShelf realises=make
@op.move   std.tool.op world=library name=move     realises=place
@op.set    std.tool.op world=library name=set      realises=change
@op.delete std.tool.op world=library name=delete   realises=remove
```

Felurile de cărți (roman, atlas, dicționar) nu sunt declarate aici: vin din arborele felurilor, sub `book`. Domeniul nu are cuvinte de mărime, liste de culori, întrebări, răspunsuri sau valori obișnuite proprii.

Programul domeniului: cinci unelte și vederea stării.

| Omul spune | Ce se întâmplă și din ce decurge |
|---|---|
| „add three blue novels” | Trei romane pe raftul cu loc. Regiunea „blue”; completare cu cost minim pentru loc. |
| „bigger” | Aceleași romane, un pas pe axa mărimii. Reacție. |
| „on the bottom shelf” | Fragment: corectează rolul loc. Dacă nu încap, explică. |
| „move the atlas up” | „Which atlas? 1. Europe, 2. Asia…”: singular, mai multe potriviri. |
| „remove the atlases” | Toate atlasele: plural hotărât, fără selecție activă. |
| „add ten atlases” | Refuz cu explicație: resursa raftului. |
| „put an encyclopedia next to the dictionary” | Nu există enciclopedia: act compus, „fă” și apoi „așază”; „next to” este relația generală de loc. |
| „a turquoise one” | Cea mai apropiată culoare pe care unealta o poate realiza, spusă o dată. |
| „what can you do here?” | Din capabilități. |
| „undo” | Ultimul pas întreg înapoi. |

## Lecția 30. Un al doilea domeniu: calendarul

Calendarul folosește aceleași concepte și alte lucruri. Nimic din înțelegerea limbii, completare, raționament sau răspuns nu se scrie pentru el.

```
@w          std.schema.world name=calendar
@t.meeting  core.type of=meeting extends=std.schema.thing is=thing
@t.room     core.type of=room    extends=std.schema.thing is=thing resource=true
@s.meet.title  core.slot of=meeting key=title  kind=string means=name
@s.meet.start  core.slot of=meeting key=start  kind=number means=time part=start
@s.meet.long   core.slot of=meeting key=length kind=number means=time part=duration
@s.meet.room   core.slot of=meeting key=room   type=room   means=place relation=in
@s.meet.people core.slot of=meeting key=people type=w.person means=role role=participant many=set
@p.m1  meeting people=?p start=?s1 length=?l1
@p.m2  meeting people=?p start=?s2 length=?l2
@c.two core.check fn=neq args=$p.m1 args=$p.m2
@c.hit core.check fn=overlaps args=?s1 args=?l1 args=?s2 args=?l2
@d.busy core.deny when=$p.m1 when=$p.m2 if=$c.two if=$c.hit why="?p already has something at that time"
```

| Omul spune | Din ce decurge |
|---|---|
| „a long meeting with Ana tomorrow afternoon” | „Long” față de durata obișnuită a ședințelor din acest calendar; „afternoon” este o regiune pe axa orelor; Ana este rolul participant. |
| „later” | Un pas pe axa timpului; dacă noul interval se suprapune, se caută cel mai apropiat liber. |
| „in the big room” | Fragment pentru rolul loc; „big” față de sălile care există. |
| „who is in it?” | Întrebarea generală a rolului. |
| „move it to Friday” | Schimbarea unei relații de timp; verificarea suprapunerilor. |

## Lecția 31. Ce are voie să fie program și cum se măsoară

Programul unui domeniu nu dublează interpretarea și hotărârile care sunt declarate. O unealtă poate cunoaște lucrurile ei.

| Ce nu are voie să facă programul unui domeniu | De ce |
|---|---|
| să citească cererea | Unealta primește numere și referințe. |
| să țină cuvinte, sinonime sau liste de valori | Sunt nume de regiuni, în cunoaștere. |
| să aleagă cantitatea, felul, forma, locul | Este treaba planului. |
| să țină valori obișnuite | Sunt regiuni, în cunoaștere. |
| să scrie propoziții de răspuns sau întrebări | Vin din cadrele actelor și din concepte. |

Și o declarație poate fi un petic: un rând scris pentru un lucru particular, când un strămoș îl putea purta, este refuzat la verificare.

| Măsură | Ce arată |
|---|---|
| sesiunile reale ale omului | Corecte, parțiale, refuzuri cu motiv, greșite. Verificările afirmă intenția și ce nu are voie să se schimbe. Greșitele rămân la zero. |
| inventarul declarațiilor particulare | Liste de cuvinte, rânduri de răspuns, realizări scrise pe fel, așteptări pe lucru, tabele de regiuni. Trebuie să scadă spre zero. |
| costul unui domeniu nou, cu motorul înghețat | Rânduri de declarații, linii de unelte, ore; niciun mecanism schimbat. |
| ce trece neschimbat între domenii | Limba, conceptele, spațiile, actele, cadrele de răspuns. |
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
