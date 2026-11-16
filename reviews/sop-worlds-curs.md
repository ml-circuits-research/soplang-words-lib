# SOP Worlds: curs de început

*Versiunea 8, 16 noiembrie 2026. Text de lucru în română, sursă pentru documentația și skill-urile din sopworld. Termenul englez este dat în paranteză la prima apariție. Exemplele de fire sunt în engleză, fiindcă așa se scriu în sistem.*

*Cursul descrie cum trebuie să lucreze tehnologia. Sub titlul fiecărei lecții, rândul „Stare” spune ce există azi și ce este numai propus. Starea implementării este în Anexa A. Partea a patra (lecțiile 27–30) este propunerea de generalizare: lumea legendelor și ce se reface din bibliotecă. Exemplele de fire nu au fost încă rulate una câte una; biblioteca le va trece prin teste și cursul se corectează unde un exemplu nu rulează.*

---

# Partea întâi. Privire de ansamblu

## Lecția 1. Ce este SOP Worlds

SOP Worlds este un fel de a descrie o bucată de realitate ca o mulțime de declarații verificate, numită **lume (world)**. O lume spune ce lucruri există, ce legături sunt între ele, ce este permis și ce decurge din ce. Declarațiile sunt scrise într-un limbaj mic, SOP Lang. Un program general, biblioteca sopworld, ține o lume consistentă, răspunde la întrebări despre ea, trage concluzii și explică de ce a refuzat o schimbare.

Tehnologia are două niveluri.

Primul este **modelul general**: cum se reprezintă o lume, cum se compun mai multe lumi, cum se pun întrebări, cum se trag concluzii, cum se verifică. Aici nu există nici om care scrie propoziții, nici ecran. Partea a doua a cursului (lecțiile 3–13) este despre acest nivel.

Al doilea este **folosirea conversațională**: un om scrie o propoziție, iar sistemul face ceva real într-o aplicație. Se adaugă înțelegerea propoziției, dialogul, alegerea valorilor pe care omul nu le-a spus și pornirea unor unelte. Partea a treia (lecțiile 14–26) este despre acest nivel. El este construit peste primul.

Problema pe care o rezolvă al doilea nivel: felul obișnuit de a face un sistem care ascultă de propoziții este să scrii, pentru fiecare fel de propoziție, o bucată de program care o recunoaște și face ce trebuie. Merge pentru propozițiile la care s-a gândit programatorul; pentru celelalte nu, iar fiecare propoziție nouă cere încă o bucată de program. SOP Worlds împarte altfel munca: ce este specific unui domeniu este declarat, iar aceleași mecanisme servesc toate domeniile.

Tehnologia urmărește trei lucruri, fiecare măsurabil.

| Scop | Ce înseamnă |
|---|---|
| refolosire | Ce s-a declarat o dată (culori, mărimi, cum arată de obicei un raport) este folosit în mai multe domenii fără a fi copiat. |
| extindere cu cost mic | Un domeniu nou se adaugă prin declarații și câteva unelte mici, fără a rescrie înțelegerea limbii și luarea deciziilor. |
| trasabilitate | Fiecare valoare dintr-un rezultat are o sursă care se poate arăta: spusă de om, luată din cunoaștere, presupusă. Limitele sunt declarate: sistemul spune ce nu a înțeles, ce nu poate face și ce nu a putut verifica. |

Contribuția centrală nu este limbajul în sine. Este **un contract comun între intenția omului, modelul lumii, completarea valorilor, verificarea planului și evidența execuției**, același pentru orice domeniu. Limbajul unic face acest contract posibil; nu îl dovedește. Dovada este măsurată: lecția 26 spune cum.

Cursul nu promite că sistemul înțelege limba naturală în general. Promite că, pentru limbajul pe care îl acoperă, fiecare pas se poate urmări și fiecare refuz are un motiv declarat.

## Lecția 2. Un exemplu urmărit de la un capăt la altul

Exemplul cursului este **o bibliotecă cu rafturi și cărți**. Starea de pornire: două rafturi, cel de sus și cel de jos, fiecare cu șase locuri. Pe cel de jos sunt cinci atlase. Cel de sus este gol.

Omul scrie: **„add three blue novels”**.

| Etapă | Ce se întâmplă |
|---|---|
| 1. Starea | Sistemul citește ce este acum în bibliotecă: două rafturi, cinci atlase pe cel de jos. |
| 2. Interpretarea | Propoziția devine o cerere: actul este „a face”, lucrul este „roman”, numărul este trei, culoarea copertei este albastru. Niciun cuvânt nu a rămas neînțeles. |
| 3. Situarea | Este o cerere nouă, nu o reacție la ceva făcut înainte. |
| 4. Adaptarea valorilor | „Blue” este o culoare cunoscută și unealta o primește. Nimic de adaptat. |
| 5. Completarea | Omul nu a spus mărimea și nici raftul. Mărimea are o valoare obișnuită: mică. Raftul rămâne deschis, cu două variante. |
| 6. Raționamentul | Raftul de jos are un singur loc liber; trei romane acolo ar încălca numărul de locuri. Raftul de sus are loc. Se alege raftul de sus. |
| 7. Legătura și execuția | Actul „a face o carte” este legat de unealta care adaugă cărți. Unealta este pornită cu valorile alese. Sistemul citește starea din nou și vede trei romane pe raftul de sus. |
| 8. Răspunsul | „I added 3 blue novels on the top shelf. I assumed they are small.” Raftul și mărimea sunt spuse fiindcă au fost alese de sistem. |

Pornind din nou de la aceeași stare de pornire, omul scrie: **„add ten atlases”**. Cererea este înțeleasă întreagă. La etapa 6 sistemul numără locurile libere: șase sus, unul jos. Zece cărți nu încap. Aceasta este o cerință a omului care nu poate fi îndeplinită, nu o presupunere a sistemului care poate fi schimbată. Sistemul nu pune șapte atlase și tace. Răspunde: „I cannot add 10 atlases: there are 7 free places. I can add 7, or you can add a shelf.” Nimic nu este executat.

Schema de mai jos arată părțile și drumul. Săgeata de întoarcere este esențială: după execuție, starea reală este citită din nou.

```
  world patterns        knowledge bases
  (kinds, slots,        (facts, norms, usual values)
   rules, words)                |
        \                       |
         v                      v
        WORLD INSTANCE  <------------------------------.
        (what exists now)                               |
              |                                         |
  message --> interpret --> situate --> adapt --> complete <--.
                                                     |         |
                                                     v         |
                                              decompose and reason
                                              (try on a copy, check)
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

Schema are două întoarceri. Una mică, între completare și raționament: completarea lasă unele valori deschise, raționamentul le alege, iar o alegere poate deschide altele. Una mare, de la observarea stării înapoi la instanța de lume.

---

# Partea a doua. Modelul general

## Lecția 3. Firul

*Stare: există în bibliotecă și în aplicație.*

Unitatea limbajului este **firul (wire)**: o singură declarație, scrisă pe un rând.

```
@b1 novel title="Moby Dick" cover=blue on=$s1
```

Rândul are trei părți. `@b1` este **identificatorul (id)** firului, numele lui propriu. `novel` este **tipul (type)**, care spune ce fel de declarație este. Restul sunt perechi `key=value`: cuvântul din stânga este **cheia (key)**, cel din dreapta este valoarea. Firul are trei chei: `title`, `cover`, `on`.

Valoarea `$s1` este o **referință (reference)**: arată spre alt fir, cel numit `s1`. Aici înseamnă că romanul stă pe raftul `s1`. Firele legate prin referințe formează un **circuit (circuit)**.

O cheie poate apărea de mai multe ori; atunci are mai multe valori:

```
@k1 std.schema.kind of=book acts=make acts=remove
```

Dacă valorile repetate au o ordine și câte sunt permise depinde de cheie și se declară (lecția 7).

Un fir care spune că ceva este așa se numește **fapt (fact)**. Firul `@b1` este un fapt.

## Lecția 4. Numele: puncte, prefixe și spații de nume

*Stare: există; evitarea coliziunii numelor de tipuri este de stabilit.*

**Punctul nu are niciun înțeles pentru limbaj.** `std.schema.kind` este un singur nume. Convenția respectată peste tot este că prima parte a numelui unui tip spune de unde vine.

| Prefixul tipului | Ce înseamnă |
|---|---|
| `core.` | Tipuri ale limbajului însuși: `core.type`, `core.slot`, `core.rule`, `core.deny`. |
| `std.` | Tipuri ale modulelor standard ale bibliotecii: `std.schema.kind`, `std.tool.bind`. |
| `k.` | Tipuri din bazele de cunoaștere: `k.expect.make`. |
| `w.` | Tipuri din tiparele de lumi refolosibile: `w.person`, `w.request`, `w.lang.en`. |
| fără prefix | Tipuri proprii ale unui exemplu sau ale unei aplicații: `book`, `shelf`. |

Fiindcă prefixul este numai o convenție, două tipare publicate ar putea alege același nume de tip. Cum se evită aceasta la încărcare este de stabilit (Anexa A).

**Identificatorii cu punct sunt tot o convenție**: `@t.` pentru tipuri, `@s.` pentru sloturi, `@p.` pentru modele, `@d.` pentru interdicții. Limbajul cere doar ca identificatorul să fie unic.

**Semnul `::` are înțeles.** El desparte un **spațiu de nume (namespace)** de identificator. Dacă doi oameni folosesc sistemul în același timp, faptele lor stau în spații diferite: `anna::b1` și `tom::b1` sunt două fire. Trei reguli țin de spațiile de nume.

| Regulă | Explicație |
|---|---|
| o referință simplă rămâne în spațiul ei | `$b1` caută numai în același spațiu. Pentru altul se scrie întreg: `$tom::b1`. |
| o regulă se potrivește într-un singur spațiu | Regulile sunt aceleași pentru toți, dar o potrivire a unei reguli nu amestecă fapte din spațiul Annei cu fapte din spațiul lui Tom. |
| a putea scrie o referință nu înseamnă a avea voie | Spațiile de nume despart faptele; nu sunt un mecanism de drepturi de acces. |

| Semn | Explicație |
|---|---|
| `@` | La începutul firului: aici se declară firul cu acest identificator. |
| `$` | Referință la un fir. |
| `?` | Variabilă (lecția 8). |
| `::` | Desparte spațiul de nume de identificator. |
| `.` | Fără înțeles pentru limbaj. |

## Lecția 5. Lumea, schema și ce înseamnă „validă”

*Stare: lumea, schema, încălcările, copia și anularea există; cele trei rezultate ale unei verificări și regula pentru verificarea nedeterminată sunt propuse.*

O **lume (world)** este o mulțime de fire ținute împreună și verificate. Are două feluri de fire: faptele, care spun ce există acum, și **schema (schema)**, care spune ce fapte au voie să existe și ce decurge din ele.

Lumea verifică fiecare schimbare față de schemă. Dacă cineva încearcă să pună a șaptea carte pe un raft cu șase locuri, lumea refuză. Refuzul este el însuși o declarație, numită **încălcare (violation)**: spune ce regulă a fost încălcată și de către ce fire.

Rezultatul unei verificări are trei valori, nu două.

| Rezultat | Ce înseamnă |
|---|---|
| validă (valid) | Nu există nicio încălcare tare **și** verificarea a fost completă: toate valorile de care regulile au nevoie sunt cunoscute și nicio limită de căutare nu a oprit-o. |
| nevalidă (invalid) | Există cel puțin o încălcare tare. |
| nedeterminată (undetermined) | Nu s-a găsit nicio încălcare, dar verificarea nu a fost completă: lipsește o valoare de care o regulă are nevoie, sau o limită a oprit căutarea. |

O verificare nedeterminată nu este o garanție. Ce se întâmplă cu un act în acest caz este o regulă explicită, nu o chestiune de reversibilitate (propus):

| Constrângere | Ce se cere înaintea execuției |
|---|---|
| tare, despre lucrurile pe care actul le schimbă | Trebuie verificată complet. Dacă rămâne nedeterminată, actul nu se execută; sistemul cere valoarea care lipsește. |
| tare, despre alte lucruri | Nu oprește actul; rămâne cum era. |
| slabă | Poate rămâne nedeterminată; se spune în răspuns. |
| declarată de domeniu ca „poate rămâne neverificată” | Excepție explicită, cu motiv, numărată. |

O lume poate fi **în construcție**: unele valori obligatorii pot lipsi încă. O carte fără raft este primită, iar lumea ține minte că îi lipsește raftul. Ce nu se primește niciodată este o valoare greșită: un raft care nu există, un număr în afara limitelor. Înainte de un efect real, valorile obligatorii trebuie să fie prezente.

O lume ține minte ce s-a schimbat, deci poate reveni la o stare anterioară (anulare, undo). Și poate fi copiată: o **copie (fork)** este o a doua lume, identică la pornire, în care se poate încerca ceva fără a atinge originalul.

> **Despre cuvântul „schemă”.** În programul bibliotecii, schema unei lumi poartă azi alt nume englez, *matrix*. Redenumirea este de hotărât (Anexa B).

## Lecția 6. Tipuri și feluri de lucruri

*Stare: există.*

Tipurile se declară prin fire, cu `core.type`:

```
@t.shelf core.type of=shelf extends=std.schema.thing
@t.book  core.type of=book  extends=std.schema.thing
@t.novel core.type of=novel extends=book
@t.atlas core.type of=atlas extends=book
@t.dict  core.type of=dictionary extends=book
```

Cheia `extends` spune că un tip îl **extinde** pe altul. `novel` extinde `book`, deci ce se declară despre `book` este valabil și pentru `novel`. Aceasta este **moștenirea (lineage)** și se urmează până la capăt.

Felul unei cărți este spus într-un singur loc: prin tip. Nu există și o cheie „gen” care să spună același lucru a doua oară.

Tipurile care descriu lucruri asupra cărora se acționează se numesc **feluri de lucruri (kinds of things)**. Ele extind `std.schema.thing`, direct sau prin alt tip. Orice fel de lucru este un tip; nu orice tip este un fel de lucru.

## Lecția 7. Sloturi: ce are voie să conțină o cheie

*Stare: există; declararea numărului și a ordinii valorilor este propusă.*

Un **slot (slot)** este declarația unei chei pentru un tip.

```
@s.book.title core.slot of=book  key=title kind=string
@s.book.cover core.slot of=book  key=cover type=k.colours.basic by=name
@s.book.size  core.slot of=book  key=size  kind=atom enum=small enum=big default=small
@s.book.on    core.slot of=book  key=on    type=shelf required=true ask="Which shelf should it go on?"
@s.shelf.room core.slot of=shelf key=room  kind=integer min=1 max=12 default=6
```

`@s.book.size` se citește: tipul `book` are cheia `size`; valoarea este un cuvânt din lista `small`, `big`; dacă nimeni nu o spune, se ia `small`. `@s.book.cover` spune că valoarea copertei este o culoare dintr-o bază de cunoaștere, găsită după nume (lecția 12).

| Ce poate spune un slot | Explicație |
|---|---|
| `kind=` | Ce fel de valoare: `integer`, `number`, `string`, `atom` (un cuvânt), o cantitate cu unitate, un moment de timp. |
| `type=` | Valoarea este un alt lucru, de tipul numit. |
| `enum=` | Lista închisă a valorilor permise. |
| `min=`, `max=`, `step=` | Intervalul permis și pasul. |
| `required=true` | Cheia este obligatorie. |
| `default=` | Valoarea luată când nimeni nu a dat una. |
| `ask=` | Întrebarea pregătită pentru om (lecția 18). |
| câte valori și în ce ordine (propus) | Dacă o cheie repetată este o mulțime (ordinea nu contează), o listă ordonată sau are o singură valoare. O carte stă pe un singur raft; actele unui fel de lucru sunt o mulțime; argumentele unei funcții sunt o listă. |

O cheie obligatorie fără valoare se numește **cheie deschisă (open key)**.

| Termen | Explicație |
|---|---|
| cheie (key) | Numele unei valori dintr-un fir concret. |
| slot (slot) | Declarația unei chei pentru un tip. Descrie structura lucrurilor. |
| rol (role) | Locul unei valori într-o acțiune: ce lucru, unde, cât. Ține de modelul acțiunii (lecția 17), nu de structura lucrurilor. |

## Lecția 8. Reguli, interdicții și constrângeri

*Stare: există.*

O **variabilă (variable)** se scrie `?name` și înseamnă „o valoare de găsit”. Un fir folosit pentru a căuta alte fire se numește **model (pattern)**. Aceeași variabilă în două modele ale aceleiași reguli înseamnă aceeași valoare; o variabilă este valabilă numai în regula ei.

O **interdicție (deny)** spune că anumite modele nu au voie să se potrivească împreună:

```
@p.top  shelf level=top
@p.big  book size=big on=$p.top
@d.top  core.deny when=$p.top when=$p.big why="a big book does not go on the top shelf"
```

O **regulă (rule)** adaugă un fir când modelele ei se potrivesc. Exemplu: un raft ale cărui locuri sunt toate ocupate este plin.

```
@p.shelf  shelf room=?n
@c.count  core.aggregate over=$p.books count=?have
@p.books  book on=$p.shelf
@c.full   core.check fn=gte args=?have args=?n
@t.full   shelf.full of=$p.shelf
@r.full   core.rule when=$p.shelf with=$c.count if=$c.full then=$t.full
```

`@p.shelf` găsește un raft și numărul lui de locuri. `@c.count` numără cărțile de pe acel raft. `@c.full` verifică dacă numărul lor a ajuns la numărul de locuri. Dacă da, regula `@r.full` adaugă firul din `@t.full`: acest raft este plin. Alte reguli și răspunsurile pot folosi apoi faptul „plin” fără a mai număra.

Un fir adăugat de o regulă este **dedus (derived)**. Lumea ține minte din ce l-a dedus. El este retras numai când nu mai are niciun temei: dacă două reguli duc la aceeași concluzie, sau concluzia a fost și spusă direct, dispariția unei singure premise nu o retrage.

O constrângere poate fi **tare (hard)**: schimbarea este refuzată. Sau **slabă (soft)**: schimbarea este primită, dar lumea ține o **problemă (issue)** cât timp situația durează.

| Formă de constrângere | Explicație |
|---|---|
| limitele unui slot | `min`, `max`, `enum`. |
| limită de număr | `std.schema.limit of=shelf max=8`: cel mult opt rafturi. |
| capacitate | `std.schema.capacity of=shelf key=room holds=book via=on`: un raft ține cel mult atâtea cărți câte spune cheia lui `room`. |
| interdicție | `core.deny`. |
| verificare cu funcție | `core.check` (lecția 9). |

## Lecția 9. Când o constrângere are nevoie de calcul

*Stare: există.*

Schema poate chema o **funcție (function)**. Cazul simplu folosește o funcție a bibliotecii:

```
@p.a    booking room=?r hour=?h
@p.b    booking room=?r hour=?h
@c.diff core.check fn=neq args=$p.a args=$p.b
@d.room core.deny when=$p.a when=$p.b if=$c.diff why="room ?r is taken at ?h"
```

O funcție proprie, scrisă ca program, este permisă cu două condiții: este **declarată** în schemă, cu nume și argumente, și face numai calculul. Exemplu, într-un calendar:

```
@f.overlap    core.function name=overlaps out.kind=boolean pure=true doc="true when two time spans share a moment"
@f.overlap.a1 core.function.arg of=$f.overlap name=start_a kind=number
@f.overlap.a2 core.function.arg of=$f.overlap name=end_a   kind=number
@f.overlap.b1 core.function.arg of=$f.overlap name=start_b kind=number
@f.overlap.b2 core.function.arg of=$f.overlap name=end_b   kind=number
@p.e1   event person=?p start=?s1 end=?e1
@p.e2   event person=?p start=?s2 end=?e2
@c.two  core.check fn=neq args=$p.e1 args=$p.e2
@c.hit  core.check fn=overlaps args=?s1 args=?e1 args=?s2 args=?e2
@d.busy core.deny when=$p.e1 when=$p.e2 if=$c.two if=$c.hit why="?p already has something at that time"
```

Aici ordinea argumentelor contează: `args` este o listă (lecția 7).

| Alte exemple | Explicație |
|---|---|
| desen | Două lucruri nu au voie să se acopere: `boxes_overlap` compară dreptunghiurile lor. |
| plan de mese | La o masă rotundă, doi oameni certați nu stau pe locuri vecine: `adjacent_seats`. |

Programul este permis unde este nevoie de calcul. Faptul că există o regulă, asupra căror lucruri și ce se spune omului rămân declarații.

## Lecția 10. Ce înseamnă exact declarațiile

*Stare: parțial stabilit; rândurile marcate sunt hotărâri încă deschise.*

Forma unui fir nu spune tot. Tabelul arată întrebările de înțeles și răspunsul fiecăreia. Unde scrie „de stabilit”, biblioteca are de hotărât și de scris, cu un exemplu care rulează; cursul nu inventează răspunsul.

| Întrebare | Răspuns |
|---|---|
| Ce înseamnă că o valoare lipsește? | Că nu este cunoscută. Nu înseamnă „fals”. |
| Cum se spune că ceva *nu* este așa? | Printr-o afirmație negativă explicită, diferită de lipsă. Forma ei: de stabilit. |
| Ce face o regulă când îi lipsește o valoare? | Nu se potrivește. Dacă valoarea este una de care depinde o interdicție, verificarea este nedeterminată pentru acea interdicție (lecția 5). Exemplu: o carte fără mărime pe raftul de sus — interdicția „carte mare pe raftul de sus” nu este nici îndeplinită, nici încălcată. |
| Cum se deosebește un model de un fapt? | Hotărârea propusă: modelele și șabloanele aparțin schemei, nu faptelor. Un fir este model din clipa în care este declarat într-o schemă și numit de o regulă; un fir care există deja ca fapt nu poate fi numit de o regulă după `when=` sau `then=` — aceasta este o eroare la încărcare. Astfel încărcarea unei reguli nu schimbă niciodată rolul unui fapt. De confirmat de bibliotecă. |
| Unde este valabilă o variabilă? | În regula sau interdicția în care apare. |
| Când dispare un fir dedus? | Când nu mai are niciun temei (lecția 8). |
| Valorile repetate au ordine? | După cum declară slotul: mulțime, listă sau o singură valoare (propus, lecția 7). |
| Când este o lume validă? | Fără încălcări tari și cu verificare completă (lecția 5). |

## Lecția 11. Tipar, cunoaștere, instanță

*Stare: există; numele noi sunt în curs de adoptare; felurile de cunoaștere declarate pe fiecare rând sunt propuse.*

Lumile au trei roluri. Nu sunt trei categorii de aceeași natură: una este o specificație, una este conținut, una este o stare concretă.

| Rol | Ce este |
|---|---|
| tipar de lume (world pattern) | O **specificație** refolosibilă: felurile de lucruri, sloturile, constrângerile, cuvintele. Fără lucruri anume. Exemplu: `w.seating` descrie ce este un plan de mese. |
| bază de cunoaștere (knowledge base) | **Conținut** general, scris după un tipar al lui și valabil într-un context declarat. Exemplu: ce este obișnuit când faci o diagramă. |
| instanță de lume (world instance) | O **stare concretă**: lucrurile unui om sau ale unei sarcini, valorile lor de acum. Construită din tipare și din cunoașterea de care are nevoie. |

> **Numele vechi.** În programul și în documentele scrise până acum, cele trei se numesc *schema lumii* (world schema), *lume de cunoaștere* (knowledge world) și *lume vie* (live world). Rămân valabile o vreme; ce se scrie sau se modifică de acum folosește numele noi.

Cuvântul **schemă** rămâne cu înțelesul din lecția 5: partea de reguli a unei lumi. Un tipar este o schemă împachetată și publicată cu nume, împreună cu cuvintele ei.

Și tiparele, și bazele de cunoaștere sunt scrise ca fire, deci sunt lumi în sensul lecției 5. Aceasta este o însușire a limbajului, nu un al patrulea rol.

Într-o bază de cunoaștere nu stau numai adevăruri despre realitate. Stau patru feluri de conținut, și ele trebuie deosebite, altfel o convenție de desen ajunge să fie luată drept o proprietate a lucrului desenat.

| Fel de cunoaștere | Exemplu și cum se folosește |
|---|---|
| fapt de domeniu | „Peștele trăiește în apă.” Este despre realitate. Poate întemeia o constrângere. |
| normă | „Un raport are o concluzie.” Spune cum trebuie să fie ceva într-o practică. Se verifică. |
| valoare obișnuită | „O schemă logică are de obicei șapte noduri.” Completează ce omul nu a spus; cedează oricărei cerințe. |
| euristică | „Un lucru mic se pune într-un colț.” O regulă de bună alegere, valabilă într-un context de folosire (aici: așezarea pe o pagină). |

Că fiecare rând al unei baze își declară felul și contextul este propus (Anexa A). Azi felul reiese din tipul firului (`k.expect.*` sunt valori obișnuite).

Tiparele și bazele de cunoaștere sunt publicate într-un depozit comun, *sop-knowledge-worlds*. Ce se află acolo este **standardizat**: are un nume fix, o schemă verificată și o licență.

| Publicat | Ce conține |
|---|---|
| `k.objects`, `k.animals`, `k.food`, `k.people` | Feluri de lucruri: ce este fiecare, din ce se trage. |
| `k.attributes` | Însușiri ale lucrurilor, inclusiv cum sunt desenate. |
| `k.expect` | Valori obișnuite: câte părți, ce mărimi, ce așezare. |
| `k.actions` | Verbele și actele pe care le numesc. |
| `k.colours` | Numele culorilor și valorile lor. |
| `k.layouts`, `k.genres` | Din ce părți este făcut un raport, o scrisoare; ce genuri de text există. |
| `k.charts` | Ce fel de grafic se potrivește cu ce fel de date. |
| `k.time.zone` | Fusuri orare. |
| `w.lang.en`, `w.lang.ro` | Engleza; vocabularul și formele limbii române. |
| `w.request`, `w.dialogue` | Tiparul unei cereri și al unui dialog. |
| `w.person`, `w.list`, `w.tasks`, `w.seating`, `w.timeline`, `w.calendar` | Persoană, liste, sarcini, plan de mese, cronologie, calendar. |

Biblioteca cu rafturi din curs este un exemplu inventat și nu este publicată.

## Lecția 12. Compunerea lumilor

*Stare: legarea de altă lume există; restrângerea și conflictul la import sunt propuse.*

Compunerea are trei operații: importul, extinderea și legarea de lucruri din altă lume.

**Importul.** O lume încarcă un tipar publicat, la o versiune fixată. Tipurile, sloturile și regulile tiparului devin ale ei. Schimbarea versiunii este o hotărâre, urmată de rularea testelor.

**Extinderea.** O lume poate specializa ce a importat: un tip nou care extinde unul importat, sau o **restrângere** a unui slot moștenit (un interval mai îngust, o listă mai scurtă de valori). O restrângere este permisă. Două definiții care nu se pot împăca (același slot cu două feluri de valori, două valori implicite diferite pentru același tip) sunt un **conflict**, spus la încărcare; nu câștigă pe tăcute una dintre ele.

**Legarea.** Un slot poate spune că valoarea lui este un lucru din altă lume. Exemplu: biblioteca, tiparul persoanelor (`w.person`) și o lume mică a **împrumuturilor**.

```
@t.loan      core.type of=loan extends=std.schema.thing
@s.loan.book core.slot of=loan key=book   type=book required=true
@s.loan.who  core.slot of=loan key=person type=w.person required=true
@s.loan.till core.slot of=loan key=until  kind=time.date
@p.l1  loan book=?b
@p.l2  loan book=?b
@c.two core.check fn=neq args=$p.l1 args=$p.l2
@d.one core.deny when=$p.l1 when=$p.l2 if=$c.two why="that book is already on loan"
```

Împrumutul este legat de o carte din bibliotecă și de o persoană din altă lume. Interdicția are nevoie de ambele.

Legarea se face de un lucru anume, cu identitate stabilă, nu de un nume. Când omul spune un nume, numele dă **candidați**: dacă sunt două persoane „Maria Pop”, sistemul întreabă care. O persoană care își schimbă numele rămâne aceeași persoană. Slotul `cover` din lecția 7 este cazul simplu: valorile unei baze de cunoaștere au nume unice, deci legarea după nume este de ajuns (`by=name`).

| Întrebare la compunere | Principiu |
|---|---|
| ce se importă și ce rămâne local | Tiparul importat aduce tipuri, sloturi, reguli și cuvinte. Faptele rămân ale instanței. |
| specializare | O restrângere a ceea ce s-a moștenit este permisă. |
| conflict | Două definiții de neîmpăcat se spun la încărcare. |
| unde se verifică o constrângere comună | În lumea care le încarcă pe amândouă: regula despre împrumuturi stă în lumea împrumuturilor. |
| referința spre altă lume | Spre un lucru anume sau spre un fel de lucru; slotul spune care. |

## Lecția 13. Folosirea fără dialog

*Stare: mecanismele există; cele două exemple nu sunt încă scrise și rulate.*

Două exemple arată primul nivel al tehnologiei, fără propoziții și fără unelte.

**Verificarea unui document.** Cunoașterea (`k.layouts`) are norma că un raport are titlu, introducere, cel puțin două secțiuni și o concluzie. Un document este încărcat ca fapte. Lumea răspunde ce lipsește (concluzia), ce regulă este încălcată și ce nu a putut verifica (nedeterminat, dacă lipsește o informație de care o regulă are nevoie). Nu se schimbă nimic.

**Un orar cu resurse.** Sunt declarate săli, oameni și ședințe. Constrângeri tari: o sală ține o singură ședință la o oră; un om nu poate fi în două locuri (funcția `overlaps`). Constrângeri slabe: unii preferă dimineața. Ora și sala fiecărei ședințe sunt chei deschise. Un **rezolvitor (solver)** caută valori pentru toate deodată. Dacă nu există soluție, lumea spune care constrângeri se bat cap în cap.

Aceleași mecanisme sunt folosite în partea a treia, sub o conversație.

---

# Partea a treia. Folosirea conversațională

## Lecția 14. Domeniul, capabilitatea, unealta, legătura

*Stare: există.*

Sistemul poate face lucruri reale în mai multe părți ale lui: desenează, face diagrame, scrie documente, așază invitați. O astfel de parte se numește **domeniu de capabilități (capability domain)**.

| Parte a unui domeniu | Explicație |
|---|---|
| instanța de lume | Starea domeniului, ca fire. |
| uneltele (tools) | Bucăți mici de program care produc efectul real. |
| vederea stării (state view) | O funcție care citește ce este cu adevărat în unelte și îl dă ca fire. |

Pe ecran un domeniu apare de obicei ca o filă sau ca un document separat. Aceasta este numai înfățișarea lui.

O **capabilitate (capability)** este o promisiune declarată: ce act, asupra cărui fel de lucru, și de ce cerințe ale omului se ține cont.

O **unealtă (tool)** este o operație de program cu parametri, care produce un efect. Nu știe nimic despre propoziții sau despre ce este obișnuit.

O **legătură (binding)** este declarația care spune ce unealtă îndeplinește ce capabilitate și de unde vine valoarea fiecărui parametru.

| Situație | Explicație |
|---|---|
| capabilitate fără unealtă | O promisiune care nu poate fi ținută. Sistemul spune: „înțeleg ce ceri, dar nu am cu ce”. |
| unealtă fără capabilitate | O operație pe care nimeni nu o poate cere prin limbaj. |
| o capabilitate, mai multe unelte | „Fă un iaz” se îndeplinește prin mai mulți pași. |
| o unealtă, mai multe capabilități | Aceeași unealtă servește mai multe acte. |

Dacă cele trei sunt lipite într-o singură funcție, acea funcție ajunge să citească cererea, să aleagă valori și să scrie răspunsul: programul pe caz din lecția 1.

## Lecția 15. Ce declară un domeniu

*Stare: există în bibliotecă și în patru domenii ale aplicației; scara, toleranța și efectul așteptat complet sunt propuse.*

Pentru bibliotecă. Felurile de lucruri și sloturile sunt cele din lecțiile 6 și 7.

**Cuvintele domeniului.**

```
@wd.book  core.word text=volume text=tome means=book
```

**Capabilitățile.**

```
@k.shelf  std.schema.kind    of=shelf world=library acts=make
@k.book   std.schema.kind    of=book  world=library acts=make acts=place acts=change acts=remove
@h.shelf  std.schema.honours world=library act=make   on=count of=shelf
@h.make   std.schema.honours world=library act=make   on=kind on=count on=size on=attribute on=place of=book
@h.place  std.schema.honours world=library act=place  on=place of=book
@h.change std.schema.honours world=library act=change on=attribute on=size of=book
@h.remove std.schema.honours world=library act=remove of=book
```

`@k.book` spune ce acte se aplică unei cărți. `@h.make` spune de ce cerințe ține cont actul `make` pentru cărți (*honours* înseamnă „ține cont de”).

**Descrierea uneltelor.**

```
@op.add      std.tool.op    world=library name=add effect=makes
@pa.add.kind std.tool.param op=add name=kind  of=book required=true
@pa.add.n    std.tool.param op=add name=n     kind=integer min=1 max=20 default=1
@pa.add.size std.tool.param op=add name=size  accepts=small accepts=big scale=k.expect.scale tolerance=1
@pa.add.cov  std.tool.param op=add name=cover type=k.colours.basic by=name
@pa.add.on   std.tool.param op=add name=on    type=shelf
@nd.add      std.tool.needs op=add exists=shelf
@op.shelf    std.tool.op    world=library name=addShelf effect=makes
```

`of=book` la parametrul `kind` înseamnă: valoarea este numele unui fel de carte. `type=shelf` la `on` înseamnă: valoarea este un raft anume, care există. `@nd.add` spune ce trebuie să existe înainte.

`effect=makes` spune numai că apare ceva. Pentru verificarea de după execuție (lecția 23) este nevoie de mai mult: ce apare, cu ce valori și ce alte efecte are unealta. Declararea completă a efectului așteptat este propusă.

**Legătura.**

```
@b.make  std.tool.bind world=library act=make of=book op=add
@a.make1 std.tool.arg  bind=$b.make param=kind  from=step.kind
@a.make2 std.tool.arg  bind=$b.make param=n     from=step.count
@a.make3 std.tool.arg  bind=$b.make param=size  from=request.size
@a.make4 std.tool.arg  bind=$b.make param=cover from=request.attribute.colour
@a.make5 std.tool.arg  bind=$b.make param=on    from=request.place
@b.shelf std.tool.bind world=library act=make of=shelf op=addShelf
```

În afara firelor, domeniul are ca program uneltele și vederea stării. Mai poate avea funcții de calcul declarate (lecția 9) și căutări proprii declarate (lecția 22).

## Lecția 16. Etapele unui mesaj

*Stare: există.*

| Etapă | Intră → iese |
|---|---|
| 1. Starea | Ce este în unelte → fapte despre ce există. |
| 2. Interpretarea | Propoziția → cererea, ca fire. (lecția 17) |
| 3. Situarea | Cererea și dialogul → cerere nouă sau reacție; lucrurile la care se referă; eventual o întrebare. (lecția 18) |
| 4. Adaptarea valorilor | Valori spuse → valori pe care domeniul le primește, cu transformarea notată. (lecția 19) |
| 5. Completarea | Cerere cu locuri goale → cerere cu valori candidate și cu locuri rămase deschise. (lecția 20) |
| 6. Descompunerea și raționamentul | → plan: pași cu toate valorile alese și verificate. (lecțiile 21–22) |
| 7. Legătura și execuția | Plan → unelte pornite → stare observată. (lecția 23) |
| 8. Răspunsul | Diferența de stare, evidența execuției, presupunerile, ce nu s-a putut → propoziția de răspuns. (lecția 24) |

Etapele 5 și 6 nu sunt strict una după alta. Completarea dă valori candidate și lasă deschis ce nu poate hotărî singură (raftul, în exemplul din lecția 2). Raționamentul alege, iar descompunerea unui întreg poate aduce părți cu locuri deschise noi. Cele două se repetă până când planul este complet sau până când se dovedește că nu poate fi.

Limba apare numai la etapele 2 și 8. Între ele totul este fire.

## Lecția 17. Interpretarea: propoziția devine cerere

*Stare: cererea și cheile ei există; ținta ca grup, domeniul de aplicare, cuantificatorul, identitatea cerinței și perechile minimale sunt propuse.*

O **cerere (request)** este o mică lume de fire, după tiparul `w.request`. Pentru „add three blue novels, no big ones”, în schiță:

```
@q1    w.request act=make target=novel text="add three blue novels, no big ones"
@q1.c1 w.request.constraint of=$q1 on=count     want=yes number=3    target=novel words="three"
@q1.c2 w.request.constraint of=$q1 on=attribute want=yes key=colour value=blue target=novel words="blue"
@q1.c3 w.request.constraint of=$q1 on=size      want=no  value=big   target=novel words="no big ones"
```

| Parte a cererii | Explicație |
|---|---|
| actul (act) | Ce se vrea făcut. |
| lucrul cerut (target) | Asupra cărui fel de lucru. |
| cerințele (constraints) | Câte una pentru fiecare lucru spus. |
| reacțiile (reactions) | Cuvinte care judecă ce s-a făcut înainte. |
| necititul (unread) | Cuvintele pe care nimic nu le-a înțeles. |

**Rolul (role)** este locul unei valori în acțiune: „novels” ocupă rolul lucrului făcut, „three” rolul numărului.

O **cerință (constraint)** are aceste părți.

| Parte a unei cerințe | Explicație |
|---|---|
| cheia (`on`) | Despre ce este: fel, număr, mărime, însușire, loc și celelalte din tabelul următor. |
| proprietatea | Când cheia este `attribute`: care însușire (culoare, stil). Două însușiri sunt două cerințe. |
| sensul (`want`) | „Vreau”, „nu vreau” sau „nu toate”. |
| ținta | Despre care lucru **sau grup din structura cererii** este vorba, nu doar ce tip. În „a big library with small books”, „big” are ținta bibliotecă, „small” are ținta cărți. |
| domeniul de aplicare | Unde este valabilă. În „a report with no images in the introduction”, excluderea privește numai introducerea. |
| cuantificatorul | „Fiecare” sau „în total”: „two books on each shelf” față de „two books”. |
| caracterul | Obligatorie sau preferință (lecția 20). |
| cuvintele | Textul exact din care a fost citită. |

Proprietatea, ținta, domeniul de aplicare și cuantificatorul formează împreună **identitatea** cerinței. O revizuire ulterioară înlocuiește cerința cu aceeași identitate, nu orice cerință cu aceeași cheie.

| Cheia cerinței | Ce spune omul prin ea |
|---|---|
| `kind` | Ce fel de lucru. |
| `count` | Câte. |
| `size` | Cât de mare. |
| `extent` | Cât din spațiu ocupă întregul. |
| `attribute` | O însușire. |
| `place` | Unde. |
| `manner` | Cum. |
| `layout` | Ce așezare. |
| `with` | Cu ce părți. |
| `about` | Despre ce. |
| `length` | Cât de lung. |

Înțelegerea unei propoziții nu este numai recunoașterea cuvintelor. Trebuie hotărât la ce se leagă fiecare.

| Propoziție | Ce trebuie hotărât |
|---|---|
| „do not move all the books” / „do not move any book” | „Nu toate” față de „niciuna”: întinderea negației. |
| „two books on each shelf” / „two books on the shelves” | Pe fiecare raft, sau în total. |
| „move the book next to the blue atlas” | „Blue” se leagă de atlas, nu de carte. |

Regulile după care se fac aceste legări sunt date ale lumii limbii. Ele sunt **convenții ale limbajului acoperit**: sistemul nu pretinde că interpretează limba naturală în general.

Că o cerere este corectă ca formă nu arată că este fidelă propoziției. Sunt două verificări diferite.

| Verificare | Ce arată |
|---|---|
| consistența recodificării | Cererea, spusă înapoi ca propoziție simplă și citită din nou, dă aceeași cerere. Arată că reprezentarea este stabilă. O citire greșită o poate trece. |
| fidelitatea | Se măsoară pe exemple cu interpretare de referință scrisă de mână și pe **perechi minimale**: două propoziții care diferă printr-o negație, o țintă sau un cuantificator trebuie să dea cereri diferite. |

Când sistemul nu este sigur de citire, spune omului ce a înțeles înainte de a face ceva greu de desfăcut. Dacă rămân cuvinte necitite într-un loc care contează, cererea nu se execută. Un cuvânt este corectat numai dacă nicio sursă nu îl cunoaște și există un singur candidat limpede.

## Lecția 18. Situarea: focus, reacții, trimiteri, întrebări

*Stare: reacțiile, trimiterile și întrebarea la mai multe potriviri există; focusul, enumerarea stabilă și legarea răspunsului de întrebare sunt propuse.*

**Focusul conversației.** Dialogul ține minte trei lucruri: lucrurile despre care se vorbește, selecția activă (dacă omul a ales ceva) și cererea care este corectată acum. Trimiterile și reacțiile se citesc față de acest focus.

**Cerere nouă sau reacție.** Un mesaj cu un act și un lucru nou este o cerere nouă. Altfel poate fi o **reacție (reaction)** la ce tocmai s-a făcut. Ce face fiecare reacție este un fapt în lumea dialogului:

```
@rv.reduce w.dialogue.revision reaction=reduce does=step on=count direction=down
```

| Ce face o reacție | Explicație |
|---|---|
| un pas (`step`) | Urcă sau coboară o treaptă: mai multe, mai puține, mai mare, mai mic. |
| întoarce (`flip`) | Ce s-a făcut devine nedorit. |
| adaugă (`add`) | Cerința spusă acum o înlocuiește pe cea veche cu aceeași identitate (lecția 17). „Red, actually” este o astfel de corecție, deși nu are un cuvânt de reacție. |
| păstrează (`keep`) | Aceeași cerere, altă variantă. |
| anulează (`undo`) | Se revine la cererea dinainte. |
| nimic (`none`) | O laudă sau o mulțumire. Nu se schimbă nimic. |

Regula acestui pas: **o reacție schimbă numai ce numește.** Un mesaj pe care sistemul nu îl poate citi nici ca cerere, nici ca reacție, nici ca corecție nu schimbă nimic.

**Trimiteri la lucruri care există.**

| Fel de trimitere | Exemplu și convenție |
|---|---|
| după o valoare proprie | „the atlas called Europe” |
| după fel și însușire | „the blue atlas” |
| după ordine | „the second one”: ordinea este cea în care sistemul a enumerat lucrurile. |
| după pronume | „it”, „them”: lucrurile din focus; de obicei ultimul rezultat. |
| după relație | „the one next to the dictionary” |
| plural hotărât | „the atlases”: selecția activă dacă există una; altfel toate lucrurile de acel fel. |

Dacă se potrivește un lucru, acela este. Dacă nu se potrivește niciunul, sistemul spune asta. Dacă omul a vorbit la singular și se potrivesc mai multe, sistemul întreabă și **enumeră candidații într-o ordine stabilă**: „Which atlas? 1. Europe, 2. Asia, 3. Africa…”. Răspunsul „the first one” se leagă de această enumerare.

**Întrebările.** Sistemul întreabă în trei situații: o trimitere nelămurită; o valoare obligatorie care lipsește și pe care nicio sursă nu o dă (se folosește textul din `ask=`); două cerințe obligatorii care nu pot fi îndeplinite împreună. Cel mult o întrebare pe mesaj.

Când întreabă, sistemul nu execută nimic și ține minte o **întrebare deschisă (open question)**: ce cerere aștepta și ce lipsea. Mesajul următor este citit întâi ca posibil răspuns. Dacă nu se potrivește, întrebarea se închide.

## Lecția 19. Adaptarea valorilor

*Stare: echivalența declarată și aproximarea pe scară există; toleranța declarată separat este propusă.*

Uneori omul spune o valoare pe care domeniul nu o primește întocmai. Sunt trei situații. Regula comună: sistemul face cât poate de bine și spune ce a făcut altfel; nu oprește omul cu întrebări pentru o înlocuire.

| Fel de adaptare | Ce este și când este permisă |
|---|---|
| echivalență | Alt cuvânt pentru același lucru **în vocabularul domeniului**: domeniul declară că „oval” este felul lui `ellipse`. Sensul se păstrează. Se face fără a fi anunțat. |
| aproximare | Cea mai apropiată valoare: „tiny” devine mic, „turquoise” devine culoarea disponibilă cea mai apropiată. Are nevoie de două declarații diferite: o **scară**, care spune cum se compară valorile, și o **toleranță**, care spune câtă abatere este primită. Fără toleranță declarată, sau dincolo de ea, nu se aproximează. Se face și se spune ce s-a luat în loc. |
| substituție | Alt lucru în locul celui cerut, când domeniul nu are altceva: o rață desenată cu imaginea unei păsări. Se face și se spune o dată ce s-a folosit în loc. Lucrul își păstrează felul spus de om: în stare este o rață, deci „rața” poate fi mutată sau colorată apoi. |

Aproximarea se sprijină pe cunoaștere. Scara mărimilor:

```
@sc.1 k.expect.scale step=tiny    order=1
@sc.2 k.expect.scale step=small   order=2
@sc.3 k.expect.scale step=default order=3
@sc.4 k.expect.scale step=big     order=4
@sc.5 k.expect.scale step=huge    order=5
```

Scara nu este o toleranță. Dacă unealta primește numai `tiny` și `small`, existența scării nu îndreptățește transformarea lui „huge” în `small`: sunt trei trepte distanță. Toleranța se declară pe parametru, de exemplu „cel mult o treaptă”; „huge” spre `big` este primit, „huge” spre `small` este refuzat cu explicație.

Cerința originală a omului se păstrează în cerere; transformarea se notează lângă ea. Răspunsul le poate arăta pe amândouă.

Dacă pentru o valoare nu există nici echivalență, nici toleranță, cerința nu poate fi îndeplinită. Ce se întâmplă cu restul cererii depinde de structura ei (lecția 20).

Un caz aparte este **interpretarea**: „in the afternoon” devine un interval de ore prin cunoașterea despre timp. Nu este o apropiere pe o scară.

Tot aici intră moștenirea (lecția 6): „no fish” îl exclude și pe peștișorul auriu.

## Lecția 20. Completarea: ce a spus omul și ce presupune sistemul

*Stare: completarea din surse și așteptările există; cele patru însușiri separate ale unei valori, conflictul dus la întrebare și verificarea independenței sunt propuse.*

Fiecare valoare dintr-o cerere are patru însușiri separate. Ele nu trebuie amestecate.

| Însușire | Explicație |
|---|---|
| sursa | De unde vine valoarea: spusă acum, spusă mai devreme, văzută în ce a făcut omul, din slot, din cunoaștere, aleasă variat. |
| caracterul | **Cerință**: ce a spus omul că trebuie. **Preferință**: ce ar fi bine („if possible”, o regulă slabă din cunoaștere). **Presupunere**: ce a ales sistemul. |
| contextul | Pentru ce lucru și cât timp este valabilă: o cerință despre romane nu se aplică atlaselor; o valoare spusă pentru un desen nu trece la următorul. |
| costul | Cât de slabă este o presupunere. Se calculează din sursă și din regulile slabe încălcate; nu este pur și simplu locul într-o listă. |

Ce datorează sistemul fiecărui fel:

| Caracter | Ce îi datorează sistemul |
|---|---|
| cerință | Trebuie îndeplinită. Dacă nu se poate, sistemul explică sau întreabă. Nu o schimbă și nu o lasă deoparte pe tăcute. |
| preferință | Se îndeplinește cât se poate, după ce cerințele sunt îndeplinite. |
| presupunere | Poate fi schimbată oricând și se spune omului când contează. |

Dacă două cerințe nu pot fi îndeplinite împreună, niciuna nu cedează pentru că este mai veche. Exemplu, în biblioteca cu două rafturi: „add a novel, not on the top shelf and not on the bottom one”. Sistemul răspunde: „You said not the top shelf and not the bottom one; there is no other shelf. Which may I use, or shall I add a shelf?” O cerință veche este înlocuită numai când omul o revizuiește (aceeași identitate).

O cerere care poate fi îndeplinită numai în parte se tratează după structura ei.

| Structura | Ce se face |
|---|---|
| lucruri independente cerute împreună („a villa and a swing”) | Se face ce se poate și se spune ce lipsește. Independența nu se deduce din cuvântul „și”: se verifică în plan. Două lucruri sunt independente dacă nu împart o resursă sau o limită (un loc, un buget, un număr total), dacă nicio regulă nu le leagă și dacă omul nu a cerut „amândouă” sau „numai împreună”. |
| o parte a unui singur lucru cerut („a house with a swing in the garden”) | Nu se execută pe jumătate: se întreabă sau se refuză cu explicație. |

Locurile goale se completează cu **valori candidate**, luate din surse în această ordine: ce a spus omul mai devreme despre același lucru; ce au în comun lucrurile pe care omul le-a cerut așa; valoarea din slot; valoarea obișnuită din cunoaștere; o alegere variată între limite. Unde o sursă dă mai multe valori posibile sau niciuna, locul rămâne deschis pentru raționament (lecția 22).

Valorile obișnuite se scriu ca fapte de **așteptare (expectation)**:

```
@e.flow   k.expect.make  thing=flowchart unit=node min=5 max=9 typical=7 kinds_min=2 kinds_max=3 layout=flow
@e.corner k.expect.value on=place  value=corner when.size=small
@e.row    k.expect.value on=layout value=row    when.count.max=6
@e.start  k.expect.value of=node on=shape value=ellipse when.role=start
```

Regula care apără de răspunsuri absurde: **o valoare obișnuită completează numai ce omul a lăsat gol.** Dacă omul cere o diagramă despre „how bread is baked” și cunoașterea nu are pașii, răspunsul este „I do not know the steps; I can make five empty steps, or you can name them”.

## Lecția 21. Descompunerea: întregul și părțile

*Stare: întregul din părți există; operațiile care declară ce păstrează sunt propuse.*

Omul cere adesea un **întreg (whole)**: o pădure, o schemă logică, un raport. Uneltele fac părți. Faptele de așteptare și normele spun din ce părți este făcut întregul:

```
@e.tree k.expect.part of=forest part=tree min=5 max=7 typical=6 needed=yes
```

| Domeniu | Exemplu |
|---|---|
| desen | O pădure: 5–7 copaci, eventual păsări și flori. |
| diagramă | O schemă logică: 5–9 noduri legate în flux. |
| document | O scrisoare: formulă de început, introducere, cuprins, încheiere, semnătură. |
| bibliotecă | „A reference shelf”: un raft, două dicționare, un atlas. |

Cerințele ajung la părți după ținta și domeniul lor de aplicare (lecția 17). Un număr rămâne cu felul pe care îl numără.

Unele operații țin de forma „un întreg cu părți și legături”. Mecanismul este comun; dacă o transformare este legitimă hotărăște tiparul lumii. Fiecare operație declară ce păstrează și când refuză (propus).

| Operație | Ce păstrează și când refuză |
|---|---|
| taie la n | Păstrează părțile obligatorii și legăturile dintre cele rămase. Refuză dacă ar trebui să scoată o parte obligatorie (concluzia unui raport) sau să rupă un flux. |
| completează la n | Adaugă numai părți pe care tiparul le permite. |
| nu toate la fel | Schimbă felul unor părți numai între felurile permise. |
| leagă tot | Adaugă numai legături care au sens în tipar; nu leagă orice de orice. |

Rezultatul este un **plan (plan)**: o listă de pași, fiecare cu actul, felul lucrului și valorile lui, unele încă deschise.

## Lecția 22. Raționamentul

*Stare: deducția, completarea cu cost minim, extinderea valorii comune și rezolvitorul există; cele cinci sfârșituri, limitele ca politici și „numai valori venite de la om” sunt propuse.*

Raționamentul pornește la un **semnal**: o stare a datelor pe care oricine o poate verifica. Este nevoie de el când rămâne **un loc deschis, o contradicție sau o alegere**.

| Semnal | Ce se face |
|---|---|
| un loc obligatoriu deschis, fără valoare candidată | O întrebare. |
| o constrângere tare ar fi încălcată de o presupunere | Se încearcă altă variantă. |
| o constrângere tare ar fi încălcată de o cerință | Se explică și nu se execută. |
| o constrângere slabă ar fi încălcată | Varianta primește un cost. |
| mai multe variante posibile | Căutare. |
| o verificare a rămas nedeterminată | Se spune ce nu a putut fi verificat; pentru acte greu de desfăcut, se întreabă. |

Toate lucrează pe aceeași **vedere ca fapte (facts view)**: **lucruri** cu felurile lor; **însușiri**, triplete (lucru, însușire, valoare); **relații**, triplete (lucru, relație, alt lucru). La fel pentru orice domeniu.

Fiecare mecanism este definit prin ce primește, ce variante ia în seamă, după ce criteriu primește una și ce garantează.

| Mecanism | Definiție |
|---|---|
| deducție (deduction) | Primește faptele și cunoașterea. Aplică regulile. Dă ce decurge și ce se încalcă. Garantează numai ce a ajuns să verifice: mersul prin cunoaștere are o limită, iar dincolo de ea rezultatul este nedeterminat. |
| completare cu cost minim | Primește un plan cu locuri deschise. Variantele sunt valorile candidate ale fiecărui loc. Respinge variantele cu încălcări tari; dintre celelalte o alege pe cea cu cel mai mic cost. În literatură este o formă de **abducție (abduction)**: alegerea presupunerilor care împacă cererea cu ce se știe. |
| extinderea unei valori comune | Primește lucrurile de același fel din instanță. Dacă toate au aceeași valoare **venită de la om**, o propune pentru un lucru nou. În literatură este o formă simplă de **inducție (induction)**. Nu garantează nimic; dă o presupunere. |
| rezolvitor (solver) | Primește multe chei deschise și constrângerile. Caută valori pentru toate deodată. |

Exemplu de completare cu cost minim: „add a fish”, într-un desen cu un iaz și un cer. Locul este deschis. Variantele: în iaz, pe cer. Cunoașterea are faptul că peștii trăiesc în apă, folosit ca regulă slabă. „Pe cer” o încalcă și costă mai mult. Se alege iazul, și se poate spune de ce.

Extinderea unei valori comune are o condiție: se numără numai valorile care vin de la om. Dacă sistemul a făcut singur toate nodurile albastre, aceasta nu este o dovadă că omul vrea albastru.

O căutare se poate încheia în cinci feluri.

| Sfârșit | Ce înseamnă și ce se spune |
|---|---|
| plan valabil | O variantă fără încălcări tari, cu verificare completă. Se execută. |
| plan nedeterminat | O variantă fără încălcări găsite, dar cu ceva neverificat. Se spune ce. |
| cerere nevalabilă | Ce a spus omul încalcă o regulă tare. Se explică. |
| fără soluție, dovedit | Toate variantele din spațiul de căutare au fost încercate. Se poate spune „nu se poate” numai dacă variantele generate acoperă tot spațiul relevant. |
| căutare oprită | S-a atins o limită. Nu s-a dovedit nimic. Se spune „nu am găsit”. |

**Limitele sunt politici.** Câte variante se încearcă, câte exemple sunt de ajuns, cât de departe merge deducția prin cunoaștere se pot seta. Moștenirea între tipuri nu are o asemenea limită.

**Căutări proprii.** Așezarea nodurilor unei diagrame, găsirea unui loc liber într-un desen. Sunt permise în condițiile din lecția 9: declarate cu nume, primesc numai valori, nu citesc cererea. Planul hotărăște *ce* și *cu ce valori*; algoritmul găsește *cum*.

## Lecția 23. Legătura și execuția

*Stare: legătura, execuția și verificarea schimbării față de stare există; starea observată ținută separat, rezultatele execuției și compensarea sunt propuse.*

Fiecare pas al planului este dus la o unealtă prin legătura declarată. Cheia `from=` spune de unde vine fiecare parametru.

| Sursa din `from=` | Explicație |
|---|---|
| `step.` | Din pasul de plan: felul părții, numărul ei. |
| `request.` | Din cerința cu acea cheie, după adaptare. |
| `state.` | Din starea instanței: un lucru care există și este numit în cerere. |
| `result.` | Un lucru făcut de un pas anterior al aceluiași plan. |

Încercarea pe o copie arată ce *ar trebui* să se întâmple. Unealta reală poate face altceva. De aceea sunt ținute două stări: **starea observată**, citită din unelte, care poate fi și nevalidă (omul a mutat ceva cu mâna într-un loc nepermis), și **starea primită pentru execuție**, care trebuie să treacă verificarea.

| Situație | Ce se face |
|---|---|
| cine are dreptate despre stare | Unealta. Instanța de lume este o oglindă a ei. |
| starea s-a schimbat între plan și execuție | Planul se reface pe starea nouă. |
| efectul văzut diferă de cel așteptat | Pasul nu se socotește făcut. Se spune ce s-a întâmplat de fapt. |
| o unealtă dă greș la jumătatea planului | Pașii făcuți se desfac prin anularea uneltei sau, unde nu există, prin operația de compensare declarată. O compensare nu este o anulare exactă și poate da greș ea însăși. |

O execuție se încheie într-unul din aceste feluri, și răspunsul îl numește.

| Rezultatul execuției | Explicație |
|---|---|
| executat | Toți pașii, cu efectul așteptat văzut în stare. |
| executat în parte | Unii pași, la o cerere cu lucruri independente (lecția 20). |
| desfăcut | Un pas a dat greș și cei dinainte au fost anulați. |
| efect necunoscut | Unealta a fost pornită, dar starea nu arată dacă a avut efect. |
| compensare eșuată | Nici desfacerea nu a reușit. Starea se spune așa cum este. |

**Anularea.** O cerere executată este un singur pas de anulare, pentru uneltele care declară că pot anula. O reacție înlocuiește pasul pe care îl corectează. O întrebare nu este un pas. Pentru unelte care nu pot anula (trimiterea unui mesaj), sistemul spune dinainte că acțiunea nu se poate desface.

## Lecția 24. Răspunsul

*Stare: răspunsul din diferența de stare există; evidența execuției în răspuns este propusă.*

Răspunsul se compune din date: diferența de stare **și** evidența execuției.

| Parte a răspunsului | De unde vine |
|---|---|
| ce s-a făcut | Din diferența netă dintre starea de dinainte și cea de după, împreună cu evidența uneltelor pornite și confirmările lor. O unealtă poate avea un efect care nu se vede în stare (o notificare trimisă); două operații se pot anula una pe alta. „Starea este aceeași” nu înseamnă „nu s-a întâmplat nimic”. |
| ce s-a presupus | Din sursa și caracterul fiecărei valori. Se spun presupunerile care contează. |
| ce s-a adaptat | Aproximările, cu cerința originală alături. |
| ce nu s-a putut | Fiecare cerință neîndeplinită, cu cuvintele omului și cu motivul. |
| ce nu s-a verificat | Verificările rămase nedeterminate. |
| ce nu s-a înțeles | Cuvintele necitite. |

Cuvintele vin din lumea limbii, ca **fapte de răspuns (reply facts)**: propoziții cu locuri de completat.

„What is on the shelf?” se răspunde din starea instanței. „What can you do here?” se răspunde din capabilitățile declarate.

Fiecare valoare ține minte sursa ei: aceasta este **proveniența (provenance)**. Servește răspunsului, reacțiilor, extinderii valorilor comune și reviziei programului.

Când o cerere nu poate fi rezolvată cu mecanismele existente, nu se scrie o regulă pentru acel caz. Cazul se trece în **registrul cazurilor nerezolvate** (în depozite: *honest list*), cu piesa generală care lipsește: o declarație, o bucată de cunoaștere, un cuvânt, o compunere de lumi, o metodă de raționament sau un mecanism de bibliotecă.

## Lecția 25. Structura unui domeniu

*Stare: structura există în patru domenii; exemplul nu a fost rulat ca atare.*

Pașii pentru un domeniu nou: felurile de lucruri și sloturile; cuvintele; capabilitățile, promițând numai ce domeniul îndeplinește; uneltele, puține și mici; vederea stării; descrierea uneltelor și legăturile; ce există deja în cunoașterea publicată; testele și propoziții noi.

Lecția arată structura; nu este încă un exemplu rulat de la un capăt la altul. Declarațiile bibliotecii, la un loc. Pentru scurtime, descrierea parametrilor și sursele lor sunt date numai pentru `add` (lecția 15); celelalte unelte se descriu la fel.

```
@w        std.schema.world name=library
@t.shelf  core.type of=shelf extends=std.schema.thing
@t.book   core.type of=book  extends=std.schema.thing
@t.novel  core.type of=novel extends=book
@t.atlas  core.type of=atlas extends=book
@t.dict   core.type of=dictionary extends=book
@s.shelf.room  core.slot of=shelf key=room  kind=integer min=1 max=12 default=6
@s.shelf.level core.slot of=shelf key=level kind=atom enum=top enum=bottom
@s.book.title  core.slot of=book  key=title kind=string
@s.book.cover  core.slot of=book  key=cover type=k.colours.basic by=name
@s.book.size   core.slot of=book  key=size  kind=atom enum=small enum=big default=small
@s.book.on     core.slot of=book  key=on    type=shelf required=true ask="Which shelf should it go on?"
@cap      std.schema.capacity of=shelf key=room holds=book via=on
@wd.book  core.word text=volume text=tome means=book
@k.shelf  std.schema.kind of=shelf world=library acts=make
@k.book   std.schema.kind of=book  world=library acts=make acts=place acts=change acts=remove
@h.shelf  std.schema.honours world=library act=make   on=count of=shelf
@h.make   std.schema.honours world=library act=make   on=kind on=count on=size on=attribute on=place of=book
@h.place  std.schema.honours world=library act=place  on=place of=book
@h.change std.schema.honours world=library act=change on=attribute on=size of=book
@h.remove std.schema.honours world=library act=remove of=book
@op.add    std.tool.op world=library name=add      effect=makes
@op.shelf  std.tool.op world=library name=addShelf effect=makes
@op.move   std.tool.op world=library name=move     effect=changes
@op.set    std.tool.op world=library name=set      effect=changes
@op.delete std.tool.op world=library name=delete   effect=removes
@b.make   std.tool.bind world=library act=make   of=book  op=add
@b.shelf  std.tool.bind world=library act=make   of=shelf op=addShelf
@b.place  std.tool.bind world=library act=place  of=book  op=move
@b.change std.tool.bind world=library act=change of=book  op=set
@b.remove std.tool.bind world=library act=remove of=book  op=delete
```

Starea de pornire, ca fire:

```
@s1 shelf level=top    room=6
@s2 shelf level=bottom room=6
@a1 atlas title="Europe"   on=$s2
@a2 atlas title="Asia"     on=$s2
@a3 atlas title="Africa"   on=$s2
@a4 atlas title="Americas" on=$s2
@a5 atlas title="Oceania"  on=$s2
```

Programul domeniului: cinci unelte și vederea stării.

Fiecare rând din tabel pornește, separat, de la starea de pornire de mai sus, în afară de rândurile marcate „după rândul anterior”.

| Omul spune | Ce se întâmplă și de ce |
|---|---|
| „add three blue novels” | Trei romane albastre, mici, pe raftul de sus. Mărimea este o presupunere; raftul este ales prin completare cu cost minim. |
| „fewer” (după rândul anterior) | Mai puține romane; culoarea și raftul rămân. |
| „move the atlas up” | „Which atlas? 1. Europe, 2. Asia, 3. Africa, 4. Americas, 5. Oceania.” Singular, mai multe potriviri. |
| „the first one” (după rândul anterior) | Atlasul „Europe” este mutat pe raftul de sus. Răspunsul se leagă de enumerare. |
| „remove the atlases” | Toate cele cinci sunt scoase. Nu există o selecție activă, deci pluralul înseamnă toate. |
| „add ten atlases” | Refuz cu explicație: sunt șapte locuri libere. O cerință nu este redusă pe tăcute. |
| „add a shelf” | Un raft nou, cu șase locuri (valoarea din slot). |
| „a huge dictionary” | Un dicționar mare, și se spune că „huge” a fost luat ca „big”: parametrul `size` declară o scară și o toleranță de o treaptă (lecția 15). |
| „what can you do here?” | Lista actelor și a cerințelor de care se ține cont, din capabilități. |
| „undo” (după oricare rând care a schimbat ceva) | Ultimul pas întreg înapoi. |

## Lecția 26. Ce are voie să fie program și cum se măsoară

*Stare: măsurile sunt în parte folosite; proba cu motorul înghețat și perechile minimale sunt propuse.*

Criteriul: **programul unui domeniu nu are voie să dubleze pe ascuns interpretarea și hotărârile care trebuie să fie declarate.** O unealtă poate cunoaște lucrurile ei: unealta de desen știe ce este un cerc.

| Ce nu are voie să facă programul unui domeniu | De ce |
|---|---|
| să citească cererea omului | Unealta primește valori gata alese. |
| să țină tabele de cuvinte sau de sinonime | Cuvintele sunt declarații. |
| să aleagă numărul, felul, forma, locul | Este treaba planului. |
| să țină valori obișnuite | Sunt sloturi sau fapte de așteptare. |
| să scrie propoziții de răspuns | Răspunsul se compune din date. |
| să caute tipare în textul omului | Este treaba interpretării. |
| să aibă un prag potrivit pe un singur caz | Este o regulă pe caz, ascunsă într-un număr. |

Și declarațiile pot ascunde reguli pe caz: un fapt de așteptare scris pentru o singură propoziție este tot un petic. De aceea mutarea din program în declarații nu dovedește singură generalitatea. Ipoteza de verificat este: **același contract (cerere, completare, verificare, execuție, răspuns) și aceleași declarații refolosite servesc domenii diferite, cu un cost mic pentru fiecare domeniu nou și fără creșterea execuțiilor greșite.**

| Măsură | Ce arată |
|---|---|
| costul unui domeniu nou, cu motorul înghețat | Rânduri de declarații, linii de unelte, ore. Mecanismele generale nu se ating în timpul acestui test. |
| extinderea deliberată a motorului | Se măsoară separat: un mecanism nou este acceptat dacă servește cel puțin două domenii. |
| proporția de declarații refolosite | Câte dintre declarațiile folosite de domeniu existau deja (limba, culorile, scările, tiparul cererii). |
| acoperirea cererilor | Câte cereri reale sunt îndeplinite corect, pe două coloane: „numai prin declarații” și „prin program scris de mână”. |
| rata execuțiilor greșite | Se numără separat de refuzuri. O acțiune greșită este mai rea decât un refuz cu motiv. |
| teste generate din declarații | Verifică respectarea promisiunilor. Pot repeta scăpările declarațiilor. |
| teste independente | Reformulări, propoziții cu două înțelesuri, cerințe care se contrazic, perechi minimale, compuneri de lumi. |

Ce trece neschimbat de la un domeniu la altul este dovada cea mai directă.

| Piesă | Bibliotecă, calendar, documente |
|---|---|
| limba (`w.lang.en`), tiparul cererii și al dialogului | Aceleași în toate trei. |
| scările de mărime, culorile, verbele | Aceleași, unde domeniul le folosește. |
| completarea, verificarea, căutarea, anularea, răspunsul | Aceleași mecanisme. |
| felurile de lucruri, sloturile, capabilitățile, legăturile | Proprii fiecărui domeniu: rafturi și cărți; evenimente și persoane; texte și părțile lor. |
| unelte și vederea stării | Proprii fiecărui domeniu. |
| funcții de calcul | Calendarul aduce `overlaps`; celelalte două nu au nevoie. |

---

# Partea a patra. Lumea legendelor și refacerea bibliotecii

*Această parte este o propunere, scrisă pentru ca proprietarul să poată hotărî în cunoștință de cauză. Nimic din ea nu este încă făcut.*

## Lecția 27. De ce o lume a legendelor

*Stare: propunere.*

Lecțiile de până aici au un cusur comun, găsit pe sesiunile reale: multe declarații sunt scrise pe lucrul particular. Întrebarea pentru raftul unei cărți este „Which shelf should it go on?”. Rața are un rând care spune că se desenează ca o pasăre. Fiecare fel de răspuns are rândul lui. De aceea fiecare caz nou a cerut un rând nou, iar rândurile noi au fost, de fapt, petice.

Regula care îndreaptă aceasta: **se pornește de la general spre particular, întotdeauna.** Fiecare declarație stă pe conceptul cel mai general pentru care este adevărată și se moștenește în jos. O lume particulară declară numai ce are ea diferit.

Pentru aceasta este nevoie de un singur loc în care stau conceptele generale: **lumea legendelor (the legend world)**. Este un tipar de lume (lecția 11). Nu conține lucruri; conține conceptele abstracte prin care se descrie orice lume. Orice tip de fir și orice slot din orice altă lume se leagă de un concept din ea.

Conceptele generale nu sunt multe. Un fel simplu de a le găsi pe toate este să ne întrebăm ce se poate întreba despre orice lucru sau despre orice întâmplare.

| Întrebarea | Conceptul general |
|---|---|
| ce este? | lucru și fel |
| care anume? | identitate și trimitere |
| din ce este făcut? al cui întreg este? | parte și întreg |
| câte? cât? | cantitate, cu unitate |
| cum este? | însușire, cu valorile și scara ei |
| unde? | loc |
| când? cât timp? | timp |
| al cui? | apartenență |
| cu ce se leagă? | relație |
| ce s-a întâmplat? | schimbare |
| ce se face? | act |
| cine? cui? cu ce? de unde? încotro? | roluri ale unui act |
| cum? în ce fel? | mod |
| de ce? pentru ce? | cauză și scop |
| este adevărat? trebuie? se poate? de obicei? | felul unei afirmații |
| toate? unele? niciunul? fiecare? | cuprindere |

## Lecția 28. Conceptele lumii legendelor

*Stare: propunere; există numai bucăți nelegate.*

Sunt șase grupe. Lista este gândită să fie completă la acest nivel de abstracție: un concept nou ar trebui să apară rar, iar dacă apar multe, înseamnă că am coborât prea jos.

**Grupa întâi: ce există.**

| Concept | Ce este |
|---|---|
| lucru (thing) | Orice despre care se poate vorbi și care poate fi arătat: o carte, o ședință, un nor, un capitol. |
| fel (kind) | Ce este un lucru. Felurile formează un singur arbore: o rață este o pasăre, o pasăre este un animal. Ce se spune despre un fel este valabil pentru toate felurile de sub el. |
| parte și întreg (part, whole) | Un lucru făcut din alte lucruri: o pădure din copaci, o scrisoare din părțile ei, o față din ochi și gură. |
| grup și ordine (collection, sequence) | Mai multe lucruri luate împreună, cu sau fără ordine: cărțile de pe un raft, pașii unei rețete. |
| nume și semn (name, sign) | Cuvântul sau semnul prin care un lucru sau un fel este numit. Aici se leagă limba. |

**Grupa a doua: cum este.**

| Concept | Ce este |
|---|---|
| însușire (quality) | O proprietate a unui lucru, cu valori dintr-un spațiu al ei: culoare, mărime, formă, stare de spirit. |
| scară (scale) | Ordinea valorilor unei însușiri, când există: minuscul, mic, obișnuit, mare, uriaș. Orice însușire cu scară primește aceleași operații: mai mult, mai puțin, cel mai. |
| cantitate (quantity) | Un număr, cu sau fără unitate: trei cărți, 150 de cuvinte, două ore. |
| stare (state) | Valorile însușirilor și relațiilor unui lucru la un moment. |

**Grupa a treia: cum se leagă.**

| Concept | Ce este |
|---|---|
| relație (relation) | Ceva care ține între două lucruri. Familiile de mai jos sunt relații. |
| loc (place) | Unde este un lucru: o regiune (sus, jos, stânga, dreapta, centru, margine), o relație cu alt lucru (pe, în, lângă, deasupra, sub, între), o direcție, o distanță. |
| timp (time) | Când: un moment, un interval, o durată, o ordine (înainte, după, în timpul), o repetare. |
| apartenență (belonging) | Al cui este un lucru; cine face parte dintr-un grup. |
| asemănare și comparație (likeness, comparison) | La fel ca, altfel decât, mai mult decât. |
| dependență (dependence) | Un lucru are nevoie de altul ca să existe sau să fie valabil. |

**Grupa a patra: ce se întâmplă.**

| Concept | Ce este |
|---|---|
| schimbare (change) | Trecerea de la o stare la alta. Sunt patru schimbări de bază: un lucru apare, un lucru dispare, o însușire își schimbă valoarea, o relație se schimbă (de exemplu locul). |
| act (act) | O schimbare cerută sau făcută de cineva. Fiecare act se definește o singură dată: ce roluri are, ce trebuie să fie adevărat înainte, ce este adevărat după. „A face”, „a șterge”, „a schimba”, „a muta” sunt cele patru schimbări de bază; celelalte acte se compun din ele. |
| rol (role) | Locul unui lucru într-un act: cine face, asupra a ce, ce rezultă, cu ce unealtă, de unde, încotro, pentru cine. |
| mod (manner) | Cum este făcut un act: cu grijă, la întâmplare, repede. |
| cauză și scop (cause, purpose) | De ce s-a întâmplat ceva; pentru ce se face ceva. |

**Grupa a cincea: ce se știe și ce se vrea.**

| Concept | Ce este |
|---|---|
| afirmație (statement) | Ceva spus despre lucruri. Felul ei: fapt, normă (cum trebuie să fie), valoare obișnuită, preferință, cerință a omului, presupunere a sistemului. |
| siguranță și sursă (certainty, source) | Cât de sigură este o afirmație și de unde vine. |
| negație și cuprindere (negation, scope) | Nu; toate, unele, niciunul, fiecare. |
| condiție și limită (condition, limit) | Când este valabilă o afirmație; între ce margini poate fi o valoare. |
| întrebare și răspuns (question, answer) | Ce nu se știe și se cere; ce se dă înapoi. |

**Grupa a șasea: cine și cu ce.**

| Concept | Ce este |
|---|---|
| cel care acționează (agent) | Omul, sistemul, o altă parte. |
| capabilitate (capability) | Ce acte poate îndeplini cineva sau ceva, și asupra a ce. |
| unealtă și resursă (tool, resource) | Cu ce se îndeplinește un act; ce se consumă sau se ocupă (o sală, un loc pe raft, o oră). |

Ce avem deja din acestea, ca bucăți nelegate între ele: arborele felurilor (`k.kinds`), însușirile (`k.attributes`), locul (`k.space`), părțile (`k.parts`), unitățile și valorile (`k.units`, `k.values`), verbele și actele (`k.actions`), timpul (`k.time`). Lipsesc ca concepte: relația, rolul, schimbarea, scara ca mecanism unic, felul unei afirmații. Și lipsește legătura obligatorie de la celelalte lumi spre acestea.

## Lecția 29. Cum se leagă o lume de lumea legendelor

*Stare: propunere.*

Fiecare tip spune ce concept este. Fiecare slot spune ce concept realizează. Forma firelor de mai jos este propusă; biblioteca o va stabili.

Biblioteca cu rafturi:

```
@t.book        core.type of=book  extends=std.schema.thing is=thing
@t.shelf       core.type of=shelf extends=std.schema.thing is=thing
@s.book.title  core.slot of=book  key=title kind=string     means=name
@s.book.cover  core.slot of=book  key=cover type=k.colours.basic by=name means=quality quality=colour
@s.book.size   core.slot of=book  key=size  kind=atom enum=small enum=big means=quality quality=size
@s.book.on     core.slot of=book  key=on    type=shelf required=true means=place relation=on
@s.shelf.room  core.slot of=shelf key=room  kind=integer    means=quantity counts=book resource=true
```

Slotul `on` nu mai are o întrebare scrisă de mână. Spune că realizează conceptul **loc**, cu relația **pe**. De aici decurg, fără niciun rând în plus, lucrurile care până acum erau scrise pe caz.

| Ce decurge din `means=place relation=on` | Cum |
|---|---|
| întrebarea când lipsește valoarea | Întrebarea generală a locului, „Where should it go?”, cu tipul valorii: „Which shelf?”. |
| un fragment al omului | „on the top shelf”, spus singur după „add a novel”, completează rolul loc rămas deschis. |
| trimiterea | „the book on the top shelf” găsește cartea prin aceeași relație. |
| mutarea | „move it up” este un pas pe direcția „sus” a locului; răspunsul vine din propoziția generală a mutării. |
| verificarea | Locul are capacitate fiindcă `room` este o resursă care numără cărți. |

Un calendar, cu aceleași concepte și alte lucruri:

```
@t.meeting      core.type of=meeting extends=std.schema.thing is=thing
@s.meet.title   core.slot of=meeting key=title  kind=string    means=name
@s.meet.start   core.slot of=meeting key=start  kind=time.moment means=time part=start
@s.meet.long    core.slot of=meeting key=length kind=quantity.time means=time part=duration
@s.meet.room    core.slot of=meeting key=room   type=room      means=place relation=in
@s.meet.people  core.slot of=meeting key=people type=w.person  means=role role=participant
@t.room         core.type of=room extends=std.schema.thing is=thing resource=true
```

„Move the meeting later” este același pas pe o scară, de data aceasta scara timpului. „Who is in the meeting?” este întrebarea generală a rolului. „In which room?” este întrebarea generală a locului. Nimic din acestea nu se scrie pentru calendar.

Desenul: o rață este un fel de pasăre în arborele felurilor. Dacă desenul nu are o imagine pentru rață, o ia pe a păsării; lucrul rămâne o rață. Pentru aceasta nu este nevoie de niciun rând despre rațe.

## Lecția 30. Straturile bibliotecii și ce înseamnă „refacem”

*Stare: descriere a stării de azi și două variante de hotărât.*

Biblioteca sopworld are trei straturi, unul peste altul. Pentru a hotărî ce se reface, trebuie văzut ce face fiecare și unde sunt greșelile.

| Strat | Ce face |
|---|---|
| 1. Motorul limbajului | Citește firele; ține tipurile și sloturile; verifică regulile și interdicțiile la fiecare schimbare; ține minte ce a dedus și din ce; anulează; face copii; caută valori cu rezolvitorul. Nu știe nimic despre propoziții, cereri sau domenii. Seamănă cu motorul unei baze de date: păstrează datele corecte, oricare ar fi ele. |
| 2. Modulele generale | Capabilități, limite, capacități, legarea de altă lume, descrierea uneltelor. Sunt scrise ca fire, peste motor. Seamănă cu tabelele de sistem ale unei baze de date. |
| 3. Stratul conversației | Citește propoziția într-o cerere; hotărăște dacă este cerere nouă sau reacție; completează ce lipsește; face planul; pornește uneltele; compune răspunsul. Seamănă cu programul care folosește baza de date pentru o aplicație anume. |

Unde sunt greșelile găsite:

| Strat | Ce am găsit |
|---|---|
| 1. Motorul | Nicio greșeală de felul celor din sesiuni. Sunt câteva lucruri de lămurit (ce înseamnă o valoare care lipsește, câte valori poate avea o cheie); acestea sunt precizări, nu refaceri. |
| 2. Modulele generale | Sunt bune ca formă, dar nu se leagă de concepte generale: un slot nu spune ce concept realizează. |
| 3. Stratul conversației | Aici sunt aproape toate: o listă fixă de unsprezece chei scrisă în program; câte un mecanism adăugat pentru fiecare comparativ; câte un rând de răspuns pentru fiecare situație; reguli despre o propoziție anume. |
| datele (bazele de cunoaștere) | Multe fapte sunt scrise pe lucrul particular; bucățile generale există, dar nu sunt legate între ele. |

Cele două variante și urmările lor:

| Variantă | Urmări |
|---|---|
| A. Refacem stratul 3 și datele; stratul 2 primește legătura spre concepte; motorul rămâne, cu precizările lui. | Cele peste șase sute de teste ale motorului rămân valabile. Se pierde numai ce era oricum greșit ca abordare. După estimarea mea, câteva zile de lucru. Riscul: dacă o greșeală este totuși în motor, o vom găsi mai târziu. |
| B. Refacem totul, inclusiv motorul. | Se pierde un motor verificat, fără un câștig pe care să-l pot arăta, fiindcă greșelile nu sunt acolo. Săptămâni în loc de zile. Riscul: greșeli noi într-o parte care azi merge. |

Recomandarea revizorului este varianta A. În ambele variante, lucrul începe cu lumea legendelor (lecțiile 27–29), aprobată pe hârtie înainte de orice program, și se încheie cu o probă: calendarul, făcut numai din lumea legendelor, lucrurile lui și uneltele lui, fără niciun rând scris pe caz.

Ce se schimbă pentru cine folosește aplicația, în varianta A: câteva zile aplicația nu arată mai bine; apoi cele patru domenii și calendarul merg pe același strat general, iar o cerere nouă este rezolvată printr-un concept, nu printr-un rând.

---

# Anexe

## Anexa A. Starea implementării (16 noiembrie 2026)

Etichete: **bibliotecă** = făcut și testat în sopworld; **aplicație** = folosit și în aplicația demonstrativă; **comandat** = sarcină dată, nefăcută încă; **de stabilit** = întrebare de înțeles fără răspuns scris.

| Piesă | Stare |
|---|---|
| fire, tipuri, sloturi, reguli, interdicții, funcții declarate, spații de nume | bibliotecă, aplicație |
| lume, copie, anulare, încălcări ca declarații | bibliotecă, aplicație |
| capabilități, limite, capacități, legarea de altă lume | bibliotecă, aplicație |
| interpretarea propoziției într-o cerere; reacții; „o reacție schimbă numai ce numește” | bibliotecă, aplicație |
| completarea din surse; așteptări cu condiție | bibliotecă, aplicație |
| vederea ca fapte; deducție, completare cu cost minim, extinderea valorii comune | bibliotecă, aplicație |
| rezolvitoare | bibliotecă |
| descrierea uneltelor, legătura, execuția cu compararea stării | bibliotecă (0.152–0.166); aplicație, în patru domenii: desen, diagrame, documente, avatar |
| răspuns din diferența netă de stare; întrebări despre stare și capabilități | bibliotecă, aplicație |
| un mesaj citit în parte nu execută; lucruri independente: se face ce se poate | bibliotecă (0.157, 0.166) |
| corectarea de cuvinte numai pentru cuvinte pe care nicio sursă nu le cunoaște | aplicație |
| trei rezultate ale unei verificări (validă, nevalidă, nedeterminată) | comandat |
| necunoscut, negație explicită, lipsă | comandat, de stabilit |
| un fapt nu devine model la încărcarea unei reguli | comandat, de stabilit |
| sloturile declară câte valori și în ce ordine | comandat |
| retragerea unui fir dedus numai fără niciun temei | de verificat în bibliotecă și scris |
| import, extindere cu restrângere, conflict | comandat |
| coliziunea numelor de tipuri între tipare | de stabilit |
| felul și contextul fiecărui rând de cunoaștere | comandat |
| ținta ca lucru sau grup, domeniul de aplicare, cuantificatorul, identitatea cerinței | comandat (ținta ca tip există) |
| cerință, preferință, presupunere; sursă, caracter, context, cost separate | comandat (azi ordinea surselor ține loc de cost) |
| conflictul între cerințe duce la întrebare | comandat |
| extinderea valorii comune numai din valori venite de la om | comandat |
| echivalență, aproximare cu toleranță declarată, substituție cu acord | comandat |
| focusul conversației; enumerarea stabilă a candidaților | comandat |
| cele cinci sfârșituri ale unei căutări; limitele ca politici | comandat |
| stare observată și stare primită; rezultatele execuției; efectul așteptat declarat | comandat |
| răspunsul din diferență și din evidența execuției | comandat |
| operațiile de structură declară ce păstrează | comandat |
| consistența recodificării; perechi minimale pentru fidelitate | comandat |
| legarea răspunsului de întrebarea deschisă; cheile cerințelor ca declarații | comandat |
| exemplele cursului rulate ca teste; pagina de semantică | comandat |

## Anexa B. Hotărâri ale proprietarului (16 noiembrie 2026)

| Subiect | Hotărâre |
|---|---|
| un singur drum pentru toate domeniile | Da, fără excepții; avatarul trece pe același drum ca celelalte. Uniformizarea nu se mai întreabă. |
| substituția | Nu se întreabă. Se face cât se poate de bine și se anunță. |
| traducerea | Se folosesc mecanismele de traducere ale browserului când există; apoi modelul de pe dispozitiv; apoi regulile. Se alege traducerea pe care citirea o înțelege cel mai bine. |
| „schemă” în loc de *matrix* în program | Treptat, ca la numele lumilor. |
| numele firelor de unealtă | Rămân `std.tool.*`. |
| limba textelor din nucleu, inclusiv `ask=` | Numai engleză; ajung în alte limbi prin drumul răspunsurilor. |
| termeni | „Trasabilitate” și „explicabilitate”; „registrul cazurilor nerezolvate”. |

## Anexa C. Cu ce seamănă

Referințele sunt date din memorie, cu autor și an, și trebuie verificate înainte de publicare.

| Ideea din curs | Înrudirea |
|---|---|
| fir cu chei; sloturi cu valori implicite | Cadrele lui Minsky (1974); structurile de trăsături. |
| lume = fapte + schemă | Bazele de cunoștințe din logicile descriptive; constrângerile de integritate. |
| fire deduse retrase când rămân fără temei | Menținerea adevărului (Doyle 1979; de Kleer 1986). |
| lipsă, necunoscut, verificare nedeterminată | Lumea deschisă față de lumea închisă; logici cu trei valori. |
| capabilitate, unealtă, condiții, efecte | STRIPS (Fikes și Nilsson 1971); PDDL. |
| întregul din părți | Planificarea ierarhică (Erol, Hendler și Nau 1994). |
| constrângeri tari și slabe; rezolvitor | Satisfacerea constrângerilor (Mackworth 1977), cu costuri. |
| valori obișnuite | Logica valorilor implicite (Reiter 1980). |
| completarea cu cost minim | Abducția cu costuri (Hobbs și colaboratorii 1993). |
| extinderea unei valori comune | Anti-unificarea (Plotkin 1970). |
| cererea, focusul și întrebarea deschisă ca stare | „Starea de informație” (Larsson și Traum 2000); GUS (Bobrow și colaboratorii 1977). |
| înțelegerea sprijinită pe o lume mică | SHRDLU (Winograd 1972). |
| revizuirea schimbă numai ce numește | Revizuirea convingerilor (Alchourrón, Gärdenfors și Makinson 1985). |
| stare observată și oglinda ei | Vederi actualizabile; lentile (Foster și colaboratorii 2007). |
| compensare în loc de anulare | Tranzacții lungi cu compensare (Garcia-Molina și Salem 1987). |
| proveniența valorilor | Proveniența datelor (Green și colaboratorii 2007). |
| răspunsul compus din date | Generarea de limbaj (Reiter și Dale 2000); maximele lui Grice (1975). |
| teste din declarații; perechi minimale | Testarea pe proprietăți (Claessen și Hughes 2000); seturi de contrast în evaluarea limbajului. |

## Anexa D. Vocabular

| Termen | Explicație |
|---|---|
| fir, cheie, referință, fapt, circuit | Lecția 3. |
| spațiu de nume (namespace) | Lecția 4. |
| lume, schemă, încălcare, copie | Lecția 5. |
| validă, nevalidă, nedeterminată | Cele trei rezultate ale unei verificări. Lecția 5. |
| tip, fel de lucru, moștenire | Lecția 6. |
| slot, cheie deschisă, rol | Lecția 7. |
| variabilă, model, interdicție, regulă, fir dedus | Lecția 8. |
| constrângere tare, slabă | Lecția 8. |
| funcție | Lecția 9. |
| tipar de lume, bază de cunoaștere, instanță de lume | Lecția 11. |
| fapt de domeniu, normă, valoare obișnuită, euristică | Felurile de cunoaștere. Lecția 11. |
| import, extindere, restrângere, conflict | Lecția 12. |
| rezolvitor | Lecția 13. |
| domeniu de capabilități, capabilitate, unealtă, legătură | Lecția 14. |
| cerere, cerință, identitatea cerinței | Lecția 17. |
| consistența recodificării, fidelitate, pereche minimală | Lecția 17. |
| focus, reacție, întrebare deschisă | Lecția 18. |
| echivalență, aproximare, substituție, interpretare | Lecția 19. |
| sursă, caracter, context, cost | Însușirile unei valori. Lecția 20. |
| cerință, preferință, presupunere | Lecția 20. |
| așteptare, întreg, plan | Lecțiile 20–21. |
| deducție, completare cu cost minim, extinderea unei valori comune | Lecția 22. |
| stare observată, stare primită pentru execuție, compensare | Lecția 23. |
| proveniență, registrul cazurilor nerezolvate | Lecția 24. |

## Anexa E. Hotărâri deschise ale limbajului

Acestea sunt hotărâri de bază. Trebuie închise și scrise în specificația bibliotecii înainte ca exemplele cursului să fie luate drept specificație.

| Hotărâre | Starea ei |
|---|---|
| un fapt nu poate deveni model la încărcarea unei reguli | Propusă în lecția 10; de confirmat. |
| cum se scrie o afirmație negativă explicită | Deschisă. |
| câte valori are o cheie și dacă au ordine | Propusă în lecția 7. |
| ce verificări trebuie încheiate înaintea execuției | Propusă în lecția 5. |
| scara și toleranța ca două declarații | Propusă în lecția 19. |
| cum se verifică independența a două lucruri cerute împreună | Propusă în lecția 20. |
| cum se evită același nume de tip în două tipare | Deschisă. |
| ce este în lumea legendelor și cum se leagă celelalte lumi de ea | Propusă în lecțiile 27–29; de aprobat de proprietar. |
| ce se reface din bibliotecă | De hotărât de proprietar; lecția 30. |
