# SOP Worlds: curs de început

*Versiunea 4, 16 noiembrie 2026. Text de lucru în română, sursă pentru documentația și skill-urile din sopworld. Termenul englez este dat în paranteză la prima apariție. Exemplele de fire sunt în engleză, fiindcă așa se scriu în sistem.*

*Cursul descrie cum trebuie să lucreze tehnologia. Ce este deja făcut și ce nu este spus separat, în Anexa A. Exemplele de fire nu au fost încă rulate una câte una; biblioteca le va trece prin teste, iar unde un exemplu nu rulează, cursul se corectează.*

---

# Partea întâi. Privire de ansamblu

## Lecția 1. Ce este SOP Worlds

SOP Worlds este un fel de a descrie o bucată de realitate ca o mulțime de declarații verificate, numită **lume (world)**. O lume spune ce lucruri există, ce legături sunt între ele, ce este permis și ce decurge din ce. Declarațiile sunt scrise într-un limbaj mic, SOP Lang. Un program general, biblioteca sopworld, știe să țină o lume consistentă, să răspundă la întrebări despre ea, să tragă concluzii și să explice de ce a refuzat o schimbare.

Tehnologia are două niveluri, și este bine să fie ținute separat în minte de la început.

Primul nivel este **modelul general**: cum se reprezintă o lume, cum se compun mai multe lumi, cum se pun întrebări, cum se trag concluzii, cum se verifică. La acest nivel nu există nici om care scrie propoziții, nici ecran. O lume poate fi folosită pentru a verifica un document, pentru a găsi un orar fără suprapuneri sau pentru a simula ce s-ar întâmpla dacă s-ar face o schimbare. Partea a doua a cursului (lecțiile 3–13) este despre acest nivel.

Al doilea nivel este **folosirea conversațională**: un om scrie o propoziție, iar sistemul face ceva real într-o aplicație. Aici se adaugă înțelegerea propoziției, dialogul, alegerea valorilor pe care omul nu le-a spus și pornirea unor unelte. Partea a treia (lecțiile 14–26) este despre acest nivel. El este construit în întregime peste primul.

Problema pe care o rezolvă al doilea nivel este următoarea. Felul obișnuit de a face un sistem care ascultă de propoziții este să scrii, pentru fiecare fel de propoziție, o bucată de program care o recunoaște și face ce trebuie. Merge pentru propozițiile la care s-a gândit programatorul. Pentru celelalte nu merge, iar fiecare propoziție nouă cere încă o bucată de program. SOP Worlds împarte altfel munca: programul nu știe nimic despre propoziții anume și nimic despre domeniul în care lucrează. Tot ce este specific este declarat, iar mecanisme generale fac restul.

Tehnologia urmărește trei lucruri. **Refolosirea**: ce s-a declarat o dată despre culori, mărimi sau despre cum arată de obicei un raport se folosește oriunde. **Extinderea fără program nou**: o parte nouă a sistemului se adaugă prin declarații și câteva unelte mici. **Cinstea**: fiecare valoare vine dintr-o declarație, deci sistemul poate spune de unde a luat-o, ce a presupus, ce nu a înțeles și ce nu poate face.

Afirmația că mecanismele sunt generale nu se ia pe cuvânt. Ea este o ipoteză care se măsoară: cât program specific rămâne într-un domeniu și cât costă adăugarea unui domeniu nou fără a atinge mecanismele. Lecția 26 spune cum.

## Lecția 2. Un exemplu urmărit de la un capăt la altul

Înainte de a învăța limbajul, urmărim o singură cerere prin tot sistemul. Cuvintele noi sunt explicate pe rând în lecțiile următoare; aici contează doar drumul.

Exemplul cursului este **o bibliotecă cu rafturi și cărți**. Starea de pornire: două rafturi, cel de sus și cel de jos, fiecare cu șase locuri. Pe cel de jos sunt cinci atlase. Cel de sus este gol.

Omul scrie: **„add three blue novels”**.

| Etapă | Ce se întâmplă |
|---|---|
| 1. Starea | Sistemul citește ce este acum în bibliotecă: două rafturi, cinci atlase pe cel de jos. |
| 2. Interpretarea | Propoziția devine o cerere: actul este „a face”, lucrul este „roman”, numărul este trei, culoarea copertei este albastru. Niciun cuvânt nu a rămas neînțeles. |
| 3. Situarea | Este o cerere nouă, nu o reacție la ceva făcut înainte. Nu vorbește despre lucruri care există deja. |
| 4. Adaptarea valorilor | „Blue” este o culoare cunoscută și unealta o primește. Nu este nimic de adaptat. |
| 5. Completarea | Omul nu a spus mărimea și nici raftul. Mărimea se ia din declarația cărții: de obicei mică. Pentru raft există două variante. |
| 6. Raționamentul | Raftul de jos are un singur loc liber; trei romane acolo ar încălca numărul de locuri. Raftul de sus are loc. Se alege raftul de sus. |
| 7. Legătura și execuția | Actul „a face o carte” este legat de unealta care adaugă cărți. Unealta este pornită cu valorile alese. Sistemul citește starea din nou și vede trei romane pe raftul de sus. |
| 8. Răspunsul | „I added 3 blue novels on the top shelf. I assumed they are small.” Raftul și mărimea sunt spuse fiindcă au fost alese de sistem. |

Omul scrie apoi: **„add ten atlases”**. Cererea este înțeleasă întreagă. La etapa 6 sistemul numără locurile libere: trei pe raftul de sus, unul pe cel de jos. Zece cărți nu încap nicăieri și nici împărțite. Aceasta este o cerință a omului care nu poate fi îndeplinită, nu o presupunere a sistemului care poate fi schimbată. Sistemul nu pune patru atlase și tace. Răspunde: „I cannot add 10 atlases: there are 4 free places. I can add 4, or you can add a shelf.” Nimic nu este executat.

Din acest exemplu se văd deja ideile care revin în tot cursul: propoziția devine o cerere scrisă ca declarații; ce nu a spus omul este completat din declarații și este spus înapoi; regulile lumii opresc ce nu este permis; iar ce a spus omul nu este schimbat pe tăcute.

---

# Partea a doua. Modelul general

## Lecția 3. Firul

Unitatea limbajului este **firul (wire)**. Un fir este o singură declarație, scrisă pe un rând:

```
@b1 novel title="Moby Dick" cover=blue on=$s1
```

Rândul are trei părți.

Prima, `@b1`, este **identificatorul (id)** firului: numele lui propriu, ales de cine îl scrie.

A doua, `novel`, este **tipul (type)** firului. Tipul spune ce fel de declarație este: aici, un roman.

A treia este un șir de perechi `key=value`. Cuvântul din stânga semnului egal este **cheia (key)**, cel din dreapta este valoarea. Firul de mai sus are trei chei: `title`, `cover` și `on`.

Valoarea `$s1` este o **referință (reference)**: semnul `$` spune că valoarea arată spre alt fir, cel numit `s1`. Aici înseamnă că romanul stă pe raftul `s1`. Prin referințe firele se leagă între ele. Firele legate astfel formează un **circuit (circuit)**.

O cheie poate apărea de mai multe ori într-un fir; atunci are mai multe valori:

```
@k1 std.schema.kind of=book acts=make acts=remove
```

Un fir care spune că ceva este așa se numește **fapt (fact)**. Firul `@b1` este un fapt.

Tot ce urmează în curs se scrie cu această singură formă.

## Lecția 4. Numele: puncte, prefixe și spații de nume

**Punctul nu are niciun înțeles pentru limbaj.** `std.schema.kind` este un singur nume. Punctele sunt puse de oameni, pentru ordine. Există însă o convenție respectată peste tot: prima parte a numelui unui tip spune de unde vine.

| Prefixul tipului | Ce înseamnă |
|---|---|
| `core.` | Tipuri ale limbajului însuși. Cu ele se scrie schema: `core.type`, `core.slot`, `core.rule`, `core.deny`. |
| `std.` | Tipuri ale modulelor standard ale bibliotecii, adică mecanisme gata făcute. De exemplu `std.schema.kind`. |
| `k.` | Tipuri din lumile de cunoaștere: fapte generale. De exemplu `k.expect.make`. |
| `w.` | Tipuri din schemele de lumi refolosibile. De exemplu `w.person`, `w.request`, `w.lang.en`. |
| fără prefix | Tipuri proprii ale unui exemplu sau ale unei aplicații: `book`, `shelf`. |

**Identificatorii cu punct sunt tot o convenție.** În `@t.book core.type of=book`, litera `t` vine de la „type” și ajută cititorul. La fel `@s.` pentru sloturi, `@p.` pentru modele, `@d.` pentru interdicții, `@h.` pentru capabilități. Limbajul cere doar ca identificatorul să fie unic.

**Semnul `::` are înțeles.** El desparte un **spațiu de nume (namespace)** de identificator. Dacă doi oameni folosesc sistemul în același timp și fiecare are o carte numită `b1`, faptele lor stau în spații diferite: `anna::b1` și `tom::b1` sunt două fire. O referință simplă, `$b1`, caută numai în același spațiu. Pentru altul se scrie întreg: `$tom::b1`. Regulile unei lumi nu stau în niciun spațiu de nume: sunt aceleași pentru toți.

| Semn | Explicație |
|---|---|
| `@` | La începutul firului: aici se declară firul cu acest identificator. |
| `$` | Înaintea unui identificator: referință la acel fir. |
| `?` | Înaintea unui nume: variabilă (lecția 8). |
| `::` | Desparte spațiul de nume de identificator. |
| `.` | Fără înțeles pentru limbaj; convenție de ordine. |

## Lecția 5. Lumea și schema ei

O **lume (world)** este o mulțime de fire ținute împreună și verificate. Într-o lume sunt două feluri de fire.

Primele sunt faptele: ce există acum.

Celelalte spun ce fapte au voie să existe și ce decurge din ele. Pe acestea le numim **schema (schema)** lumii. Schema bibliotecii spune că o carte are un titlu și o culoare a copertei, că stă pe un raft și că pe un raft încap cel mult atâtea cărți câte locuri are.

Lumea verifică fiecare schimbare față de schemă. Dacă cineva încearcă să pună a șaptea carte pe un raft cu șase locuri, lumea refuză. Refuzul este el însuși o declarație, care spune ce regulă a fost încălcată și de către ce fire. Se numește **încălcare (violation)**. De aceea sistemul poate explica omului de ce a refuzat.

Trebuie făcută o deosebire. O lume poate fi **în construcție** sau **gata de folosit**. În construcție, unele valori obligatorii pot lipsi încă: o carte fără raft este primită, iar lumea ține minte că îi lipsește raftul. Ce nu se primește niciodată este o valoare *greșită*: un raft care nu există, un număr în afara limitelor. Înainte ca lumea să fie folosită pentru un efect real, valorile obligatorii trebuie să fie toate prezente.

O lume mai are două însușiri de care ne vom folosi. Ține minte ce s-a schimbat, deci poate reveni la o stare anterioară (anulare, undo). Și poate fi copiată: o **copie (fork)** este o a doua lume, identică la pornire, în care se poate încerca ceva fără a atinge originalul.

> **Despre cuvântul „schemă”.** În programul bibliotecii, schema unei lumi poartă azi alt nume englez, *matrix*. Folosim „schemă”, fiind mai ușor de înțeles. Redenumirea în bibliotecă este de hotărât (Anexa B).

## Lecția 6. Tipuri și feluri de lucruri

Tipurile se declară prin fire, cu `core.type`:

```
@t.shelf core.type of=shelf extends=std.schema.thing
@t.book  core.type of=book  extends=std.schema.thing
@t.novel core.type of=novel extends=book
@t.atlas core.type of=atlas extends=book
@t.dict  core.type of=dictionary extends=book
```

Cheia `extends` spune că un tip îl **extinde** pe altul. `novel` extinde `book`, deci tot ce se declară despre `book` este valabil și pentru `novel`. Aceasta este **moștenirea (lineage)**. Moștenirea se urmează până la capăt, oricât de lung ar fi lanțul.

În acest curs, felul unei cărți (roman, atlas, dicționar) este spus într-un singur loc: prin tip. Nu există și o cheie „gen” care să spună același lucru a doua oară; două locuri pentru aceeași informație ajung să se contrazică.

Unele tipuri descriu lucruri asupra cărora se acționează: cărți, rafturi, noduri dintr-o diagramă, paragrafe. Pe acestea le numim **feluri de lucruri (kinds of things)**. Semnul lor este că extind `std.schema.thing`, direct sau prin alt tip.

| Termen | Explicație |
|---|---|
| tip (type) | Al doilea cuvânt al oricărui fir. |
| fel de lucru (kind of thing) | Un tip care extinde `std.schema.thing`. Orice fel de lucru este un tip; nu orice tip este un fel de lucru. |
| moștenire (lineage) | Lanțul de tipuri extinse. |

## Lecția 7. Sloturi: ce are voie să conțină o cheie

Un **slot (slot)** este declarația unei chei pentru un tip. Se scrie cu `core.slot`.

```
@s.book.title core.slot of=book  key=title kind=string
@s.book.cover core.slot of=book  key=cover kind=atom
@s.book.size  core.slot of=book  key=size  kind=atom enum=small enum=big default=small
@s.book.on    core.slot of=book  key=on    type=shelf required=true ask="Which shelf should it go on?"
@s.shelf.room core.slot of=shelf key=room  kind=integer min=1 max=12 default=6
```

Firul `@s.book.size` se citește: tipul `book` are cheia `size`; valoarea este un cuvânt din lista `small`, `big`; dacă nimeni nu o spune, se ia `small`. Firul `@s.book.on` spune că cheia `on` ține un raft și este obligatorie.

| Ce poate spune un slot | Explicație |
|---|---|
| `kind=` | Ce fel de valoare: `integer`, `number`, `string` (text), `atom` (un cuvânt), o cantitate cu unitate, un moment de timp. |
| `type=` | Valoarea este un alt lucru, de tipul numit. |
| `enum=` | Lista închisă a valorilor permise. |
| `min=`, `max=`, `step=` | Intervalul permis și pasul. |
| `required=true` | Cheia este obligatorie. |
| `default=` | Valoarea luată când nimeni nu a dat una. |
| `ask=` | Întrebarea pregătită pentru om, dacă valoarea lipsește și nu poate fi găsită altfel (lecția 18). |

O cheie obligatorie fără valoare se numește **cheie deschisă (open key)**. Este un lucru pe care lumea știe că nu îl știe.

Trei cuvinte se confundă ușor.

| Termen | Explicație |
|---|---|
| cheie (key) | Numele unei valori dintr-un fir concret. |
| slot (slot) | Declarația unei chei pentru un tip. Stă în schemă. |
| rol (role) | Locul unei valori într-o acțiune cerută: ce lucru, unde, cât. Apare în cereri (lecția 17), nu în fire. |

Schema unui tip este, așadar, mulțimea firelor `core.slot` care îl numesc după `of=`.

## Lecția 8. Reguli și constrângeri

Unele lucruri privesc mai multe fire deodată. Pentru ele există reguli și constrângeri, scrise tot ca fire.

O **variabilă (variable)** se scrie `?name` în locul unei valori și înseamnă „o valoare de găsit”. Un fir folosit pentru a căuta alte fire se numește **model (pattern)**. Un model nu spune că ceva există; descrie ce se caută. Aceeași variabilă în două modele ale aceleiași reguli înseamnă aceeași valoare.

O **interdicție (deny)** spune că anumite modele nu au voie să se potrivească împreună:

```
@p.top  shelf level=top
@p.big  book size=big on=$p.top
@d.top  core.deny when=$p.top when=$p.big why="a big book does not go on the top shelf"
```

`@p.top` descrie raftul de sus. `@p.big` descrie o carte mare aflată pe raftul găsit de `@p.top`. `@d.top` interzice ca amândouă să se potrivească. Cheia `why` ține explicația dată omului.

O **regulă (rule)** are aceeași formă, dar adaugă: „dacă aceste modele se potrivesc, atunci și acest fir este adevărat”. Un fir adăugat de o regulă este **dedus (derived)**. Lumea ține minte din ce a fost dedus, iar când premisele dispar, dispare și el.

O constrângere poate fi **tare (hard)** sau **slabă (soft)**. La una tare, schimbarea este refuzată. La una slabă, schimbarea este primită, dar lumea ține o **problemă (issue)** cât timp situația durează.

| Formă de constrângere | Explicație |
|---|---|
| limitele unui slot | `min`, `max`, `enum`. Privesc o singură valoare. |
| limită de număr | `std.schema.limit of=shelf max=8`: cel mult opt rafturi. |
| capacitate | `std.schema.capacity of=shelf key=room holds=book via=on`: un raft ține cel mult atâtea cărți câte spune cheia lui `room`. |
| interdicție | `core.deny`: o combinație de fapte care nu are voie să existe. |
| verificare cu funcție | `core.check`: o condiție calculată (lecția 9). |

## Lecția 9. Când o constrângere are nevoie de calcul

Unele constrângeri au nevoie de un calcul: o comparație, o distanță, o suprapunere de intervale. Pentru ele schema cheamă o **funcție (function)**.

Cazul simplu folosește o funcție care vine cu biblioteca. Exemplul interzice două rezervări ale aceleiași săli la aceeași oră:

```
@p.a    booking room=?r hour=?h
@p.b    booking room=?r hour=?h
@c.diff core.check fn=neq args=$p.a args=$p.b
@d.room core.deny when=$p.a when=$p.b if=$c.diff why="room ?r is taken at ?h"
```

`@c.diff` cheamă funcția `neq` („nu sunt același fir”), ca o rezervare să nu fie comparată cu ea însăși.

Al doilea caz are nevoie de o funcție proprie, scrisă ca program. Este permis, cu două condiții: funcția este **declarată** în schemă, cu nume și argumente, iar programul ei face numai calculul. Exemplu, într-un calendar: două evenimente ale aceleiași persoane nu au voie să se suprapună.

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

Programul funcției `overlaps` este o singură linie, scrisă în aplicație.

| Alte exemple unde este nevoie de o funcție proprie | Explicație |
|---|---|
| desen | Două lucruri nu au voie să se acopere: `boxes_overlap` compară dreptunghiurile lor. |
| plan de mese | La o masă rotundă, doi oameni certați nu stau pe locuri vecine: `adjacent_seats` știe că primul loc este vecin cu ultimul. |
| bibliotecă | Lățimile cărților de pe un raft, adunate, nu depășesc lățimea raftului. Aici ajunge un mecanism al bibliotecii (adunarea peste toate firele găsite) și comparația standard. |

Ideea de reținut: programul este permis unde este nevoie de calcul. Faptul că există o regulă, asupra căror lucruri și ce se spune omului când este încălcată rămân declarații.

## Lecția 10. Ce înseamnă exact declarațiile

Forma unui fir nu spune tot. Câteva întrebări de înțeles trebuie să aibă răspuns limpede, fiindcă de ele depinde ce face programul. Tabelul spune ce este stabilit și ce rămâne de scris precis în documentația bibliotecii.

| Întrebare | Răspuns |
|---|---|
| Ce înseamnă că o valoare lipsește? | Că nu este cunoscută. Nu înseamnă „fals”. Dacă cheia este obligatorie, este o cheie deschisă. |
| Cum se deosebește un model de un fapt, dacă nu are variabile? | După cum este folosit: un fir numit de o regulă sau de o interdicție (după `when=`) este model. Singur, este fapt. |
| Unde este valabilă o variabilă? | În regula sau interdicția în care apare. |
| Ce se întâmplă cu un fir dedus când premisa dispare? | Dispare și el; lumea ține minte din ce l-a dedus. |
| Când este o lume „validă”? | Când nu are încălcări tari. Poate avea chei deschise cât este în construcție (lecția 5). |
| Valorile repetate ale unei chei au ordine? | De precizat în documentația bibliotecii. |
| Poate un model să ceară un anumit identificator? | De precizat. În curs folosim numai referințe între modele, ca în lecția 8. |

Biblioteca are de scris o pagină cu aceste răspunsuri, fiecare cu un exemplu care rulează.

## Lecția 11. Specificație, conținut, instanță

În practică lumile sunt de trei feluri. Ele nu sunt trei categorii de aceeași natură; sunt trei roluri diferite.

| Fel de lume | Ce este |
|---|---|
| schema lumii (world schema) | O **specificație**: descrie un fel de lume, fără lucruri anume. Felurile de lucruri, sloturile, constrângerile, cuvintele. Se refolosește. Exemplu: `w.seating` descrie ce este un plan de mese. |
| lume de cunoaștere (knowledge world) | **Conținut**: fapte generale, adevărate pentru toată lumea, scrise după o schemă a lor. Exemplu: ce este obișnuit când faci o diagramă. |
| lume vie (live world) | O **instanță** cu stare: lucrurile concrete ale unui om sau ale unei sarcini, valorile lor de acum, ce s-a schimbat. Exemplu: planul de mese pentru sâmbătă. |

O lume vie se obține încărcând una sau mai multe scheme, citind cunoașterea de care are nevoie și adăugând lucrurile concrete.

O observație: și schema, și cunoașterea sunt scrise tot ca fire, deci sunt și ele lumi. Aceasta este o însușire a limbajului (se poate descrie pe sine), nu un al patrulea fel de lume.

Schemele de lumi și lumile de cunoaștere sunt publicate într-un depozit comun, *sop-knowledge-worlds*. Ce se află acolo este **standardizat**: are un nume fix, o schemă verificată și o licență, și orice aplicație îl poate încărca după nume.

| Lume standard | Ce conține |
|---|---|
| `k.expect` | Ce este obișnuit: câte părți are de regulă un lucru, ce mărimi, ce așezare. |
| `k.actions` | Verbele și actele pe care le numesc: „draw”, „make”, „create” înseamnă `make`. |
| `k.colours` | Numele culorilor și valorile lor. |
| `k.animals` și alte lumi despre feluri de lucruri | Ce este fiecare, din ce se trage, unde stă de obicei. |
| `k.layouts` | Din ce părți este făcut un raport, o scrisoare. |
| `k.charts` | Ce fel de grafic se potrivește cu ce fel de date. |
| `k.time.zone` | Fusuri orare. |
| `w.lang.en` | Engleza: cuvintele de legătură, numeralele, pluralul, cuvintele de negație și de cantitate. |
| `w.lang.ro` | Vocabularul și formele limbii române. |
| `w.request`, `w.dialogue` | Schema unei cereri și a unui dialog (partea a treia). |
| `w.person` | O persoană: nume, preferințe. |
| `w.list`, `w.tasks`, `w.seating`, `w.timeline`, `w.calendar` | Liste, sarcini, plan de mese, cronologie, calendar. |

Biblioteca cu rafturi din curs este un exemplu inventat și nu este publicată.

## Lecția 12. Compunerea lumilor

Puterea vine din punerea mai multor lumi la un loc. Exemplu: biblioteca noastră, lumea persoanelor (`w.person`) și o lume mică a **împrumuturilor**.

```
@t.loan      core.type of=loan extends=std.schema.thing
@s.loan.book core.slot of=loan key=book   type=book required=true
@s.loan.who  core.slot of=loan key=person type=w.person by=name required=true
@s.loan.till core.slot of=loan key=until  kind=time.date
@p.l1  loan book=?b
@p.l2  loan book=?b
@c.two core.check fn=neq args=$p.l1 args=$p.l2
@d.one core.deny when=$p.l1 when=$p.l2 if=$c.two why="that book is already on loan"
```

Slotul `@s.loan.book` leagă împrumutul de o carte din bibliotecă. Slotul `@s.loan.who` leagă împrumutul de o persoană din altă lume, găsită după nume; aceasta se numește **îmbinare (join)**. Interdicția `@d.one` are nevoie de ambele: aceeași carte nu poate fi împrumutată de două ori.

Când se pun lumi la un loc apar întrebări care trebuie să aibă un răspuns scris și verificat prin teste. Tabelul spune principiul; forma exactă este o sarcină a bibliotecii (Anexa A).

| Întrebare la compunere | Principiu |
|---|---|
| Două scheme declară același tip sau același slot | Dacă declarațiile sunt identice, se consideră una. Dacă diferă, este o încălcare, spusă la încărcare; nu câștigă pe tăcute una dintre ele. |
| Două valori implicite diferite pentru aceeași cheie | La fel: se spune, nu se alege pe tăcute. |
| O referință spre altă lume | Poate fi spre un lucru anume (acest om) sau spre un fel de lucru (orice persoană). Slotul spune care. |
| Lumea încărcată își schimbă versiunea | O lume se încarcă la o versiune fixată. Schimbarea versiunii este o hotărâre, urmată de rularea testelor. |

## Lecția 13. Folosirea fără dialog

Două exemple arată primul nivel al tehnologiei, fără om care scrie propoziții și fără unelte.

**Verificarea unui document.** Cunoașterea (`k.layouts`) spune că un raport are titlu, introducere, cel puțin două secțiuni și o concluzie. Un document este încărcat ca fapte: aceste secțiuni, în această ordine. Lumea răspunde ce lipsește (concluzia), ce este în plus și ce regulă este încălcată (o secțiune fără titlu este o cheie deschisă). Nu se schimbă nimic; rezultatul este o listă de încălcări și de chei deschise, fiecare cu explicația ei.

**Un orar cu resurse.** Sunt declarate săli, oameni și ședințe; fiecare ședință are nevoie de o sală și de anumiți oameni. Constrângerile tari: o sală ține o singură ședință la o oră; un om nu poate fi în două locuri (funcția `overlaps` din lecția 9). Constrângeri slabe: unii preferă dimineața. Ora și sala fiecărei ședințe sunt chei deschise. Un **rezolvitor (solver)** caută valori pentru toate deodată, astfel încât nicio constrângere tare să nu fie încălcată și cât mai puține slabe. Dacă nu există nicio soluție, lumea spune care constrângeri se bat cap în cap.

Aceleași mecanisme — schema, constrângerile, căutarea, explicația — sunt cele folosite în partea a treia, sub o conversație.

---

# Partea a treia. Folosirea conversațională

## Lecția 14. Domeniul, capabilitatea, unealta, legătura

Sistemul poate face lucruri reale în mai multe părți ale lui: desenează, face diagrame, scrie documente, așază invitați, ține un calendar. Numim o astfel de parte **domeniu de capabilități (capability domain)**.

| Parte a unui domeniu | Explicație |
|---|---|
| lumea vie | Starea domeniului, ca fire (lecția 11). |
| uneltele (tools) | Bucăți mici de program care produc efectul real. |
| vederea stării (state view) | O funcție care citește ce este cu adevărat în unelte și îl dă ca fire. |

Pe ecran un domeniu apare de obicei ca o filă sau ca un document separat. Aceasta este numai înfățișarea lui.

Trei cuvinte sunt miezul acestei părți.

O **capabilitate (capability)** este o promisiune declarată: ce act, asupra cărui fel de lucru, și de ce cerințe ale omului se ține cont. De exemplu: „pot adăuga cărți și țin cont de câte, ce culoare, ce mărime și pe ce raft”. Nu spune cum.

O **unealtă (tool)** este o operație de program cu parametri, care produce un efect: `add(kind, n, size, cover, on)`. Nu știe nimic despre propoziții sau despre ce este obișnuit.

O **legătură (binding)** este declarația care spune ce unealtă îndeplinește ce capabilitate și de unde vine valoarea fiecărui parametru. Păstrăm cuvântul „legătură” numai pentru aceasta.

| Situație | Explicație |
|---|---|
| capabilitate fără unealtă | O promisiune care nu poate fi ținută. Sistemul spune: „înțeleg ce ceri, dar nu am cu ce”. |
| unealtă fără capabilitate | O operație pe care nimeni nu o poate cere prin limbaj. |
| o capabilitate, mai multe unelte | „Fă un iaz” se îndeplinește prin mai mulți pași. Împărțirea vine din cunoaștere. |
| o unealtă, mai multe capabilități | Aceeași `add` servește mai multe acte. |

Sunt ținute separat dintr-un motiv practic. Dacă sunt lipite într-o singură funcție, acea funcție ajunge să citească cererea, să aleagă valori și să scrie răspunsul: adică devine programul pe caz din lecția 1.

## Lecția 15. Ce declară un domeniu

Le arătăm pentru bibliotecă. Felurile de lucruri și sloturile sunt cele din lecțiile 6 și 7.

**Cuvintele domeniului.**

```
@wd.book  core.word text=volume text=tome means=book
```

Aici stau numai cuvintele proprii domeniului. Cuvintele generale ale limbii stau în `w.lang.en`.

**Capabilitățile.**

```
@k.book   std.schema.kind    of=book world=library acts=make acts=place acts=change acts=remove
@h.make   std.schema.honours world=library act=make   on=kind on=count on=size on=attribute on=place of=book
@h.place  std.schema.honours world=library act=place  on=place of=book
@h.change std.schema.honours world=library act=change on=attribute on=size of=book
@h.remove std.schema.honours world=library act=remove of=book
```

`@k.book` spune ce acte se aplică unei cărți. `@h.make` spune de ce cerințe ține cont actul `make` pentru cărți (*honours* înseamnă „ține cont de”). Cheile de după `on=` sunt explicate în lecția 17.

**Descrierea uneltelor.**

```
@op.add      std.tool.op    world=library name=add effect=makes
@pa.add.kind std.tool.param op=add name=kind  of=book required=true
@pa.add.n    std.tool.param op=add name=n     kind=integer min=1 max=20 default=1
@pa.add.size std.tool.param op=add name=size  accepts=small accepts=big
@pa.add.cov  std.tool.param op=add name=cover type=k.colours.basic by=name
@pa.add.on   std.tool.param op=add name=on    type=shelf
@nd.add      std.tool.needs op=add exists=shelf
```

`@op.add` spune că unealta există și că face un lucru nou. Fiecare `std.tool.param` descrie un parametru. La `kind`, `of=book` înseamnă: valoarea este numele unui fel de carte. La `on`, `type=shelf` înseamnă: valoarea este un raft anume, care există. `@nd.add` spune ce trebuie să existe înainte: cel puțin un raft.

**Legătura.**

```
@b.make  std.tool.bind world=library act=make of=book op=add
@a.make1 std.tool.arg  bind=$b.make param=kind  from=step.kind
@a.make2 std.tool.arg  bind=$b.make param=n     from=step.count
@a.make3 std.tool.arg  bind=$b.make param=size  from=request.size
@a.make4 std.tool.arg  bind=$b.make param=cover from=request.attribute.colour
@a.make5 std.tool.arg  bind=$b.make param=on    from=request.place
```

`@b.make` spune: actul `make` asupra unei cărți se îndeplinește cu unealta `add`. Fiecare `std.tool.arg` spune de unde se ia un parametru (lecția 23).

În afara firelor, domeniul are ca program uneltele și vederea stării. Mai poate avea funcții de calcul declarate (lecția 9) și căutări proprii declarate (lecția 22). Altceva nu.

## Lecția 16. Etapele unui mesaj

Fiecare mesaj trece prin aceleași etape, în orice domeniu. Sunt etapele din exemplul lecției 2. Fiecare are o intrare și o ieșire limpede.

| Etapă | Intră → iese |
|---|---|
| 1. Starea | Ce este în unelte → fapte despre ce există. |
| 2. Interpretarea | Propoziția → cererea, ca fire. (lecția 17) |
| 3. Situarea | Cererea și dialogul → cerere nouă sau reacție; lucrurile la care se referă; eventual o întrebare. (lecția 18) |
| 4. Adaptarea valorilor | Valori spuse → valori pe care domeniul le primește. (lecția 19) |
| 5. Completarea | Cerere cu locuri goale → cerere completă, cu sursa fiecărei valori. (lecția 20) |
| 6. Descompunerea și raționamentul | Cerere completă → plan: pași cu toate valorile alese și verificate. (lecțiile 21–22) |
| 7. Legătura și execuția | Plan → unelte pornite → stare nouă. (lecția 23) |
| 8. Răspunsul | Diferența de stare, presupunerile, ce nu s-a putut → propoziția de răspuns. (lecția 24) |

Limba apare numai la etapele 2 și 8. Între ele totul este fire. De aceea sistemul poate lucra în română printr-un strat de traducere, fără a învăța fiecare domeniu din nou.

## Lecția 17. Interpretarea: propoziția devine cerere

O **cerere (request)** este o mică lume de fire, cu schema `w.request`. Pentru „add three blue novels, no big ones”, cererea arată, în schiță, așa:

```
@q1    w.request act=make target=novel text="add three blue novels, no big ones"
@q1.c1 w.request.constraint of=$q1 on=count     want=yes number=3    target=novel words="three"
@q1.c2 w.request.constraint of=$q1 on=attribute want=yes key=colour value=blue target=novel words="blue"
@q1.c3 w.request.constraint of=$q1 on=size      want=no  value=big   target=novel words="no big ones"
```

| Parte a cererii | Explicație |
|---|---|
| actul (act) | Ce se vrea făcut. Aici `make`, din „add”. |
| lucrul cerut (target) | Asupra cărui fel de lucru. Aici `novel`. |
| cerințele (constraints) | Câte una pentru fiecare lucru spus. Vezi mai jos. |
| reacțiile (reactions) | Cuvinte care judecă ce s-a făcut înainte: „too many”, „nice”. |
| necititul (unread) | Cuvintele pe care nimic nu le-a înțeles. |

Aici apare **rolul (role)**: „novels” ocupă rolul lucrului făcut, „three” rolul numărului. Rolurile sunt locurile dintr-o acțiune.

Fiecare **cerință (constraint)** are cinci părți, și toate contează.

| Parte a unei cerințe | Explicație |
|---|---|
| cheia (`on`) | Despre ce este cerința. Lista este mai jos. |
| sensul (`want`) | „Vreau”, „nu vreau” sau „nu toate”. |
| ținta (`target`) | Despre care lucru este vorba. În „a big library with small books”, „big” are ținta bibliotecă, iar „small” are ținta cărți. |
| domeniul de aplicare | Unde este valabilă. În „a report with no images in the introduction”, excluderea privește numai introducerea, nu tot raportul. |
| cuantificatorul | „Fiecare” sau „în total”. „Two books on each shelf” și „two books” nu cer același lucru. |

Fiecare cerință păstrează și cuvintele exacte din care a fost citită.

| Cheia cerinței | Ce spune omul prin ea |
|---|---|
| `kind` | Ce fel de lucru. |
| `count` | Câte. |
| `size` | Cât de mare. |
| `extent` | Cât din spațiu ocupă întregul. |
| `attribute` | O însușire: culoare, stil. |
| `place` | Unde. |
| `manner` | Cum: „neatly”. |
| `layout` | Ce așezare: „in a row”. |
| `with` | Cu ce părți. |
| `about` | Despre ce. |
| `length` | Cât de lung. |

Acestea sunt aceleași chei pe care le numesc capabilitățile după `on=`. Aici se întâlnesc ce cere omul și ce promite domeniul.

Înțelegerea unei propoziții nu este numai recunoașterea cuvintelor. Trebuie hotărât la ce se leagă fiecare cuvânt. Trei exemple arată unde este greul.

| Propoziție | Ce trebuie hotărât |
|---|---|
| „do not move all the books” / „do not move any book” | Prima înseamnă „nu toate” (unele pot fi mutate). A doua înseamnă „niciuna”. Negația are întindere diferită. |
| „two books on each shelf” / „two books on the shelves” | Prima cere două pe fiecare raft. A doua cere două în total. |
| „move the book next to the blue atlas” | „Blue” se leagă de atlas, cuvântul cel mai apropiat, nu de carte. |

Regulile după care se fac aceste legări (negația, cuantificatorii, apropierea) sunt date ale lumii limbii, nu program pe domeniu.

O cerere corectă ca formă nu este neapărat fidelă propoziției. De aceea există o verificare: cererea este spusă înapoi ca propoziție simplă, iar acea propoziție, citită din nou, trebuie să dea aceeași cerere. Când sistemul nu este sigur de citire, spune omului ce a înțeles înainte de a face ceva ce nu se poate desface ușor.

Două reguli țin de cinste. Dacă rămân cuvinte necitite într-un loc care contează, cererea nu se execută pe ghicite. Un cuvânt care pare greșit scris este corectat numai dacă există un singur candidat limpede; un cuvânt corect nu se schimbă niciodată.

## Lecția 18. Situarea: reacții, trimiteri, întrebări

**Cerere nouă sau reacție.** Un mesaj cu un act și un lucru nou este o cerere nouă. Altfel poate fi o **reacție (reaction)** la ce tocmai s-a făcut, dar numai dacă are un cuvânt de reacție recunoscut („fewer”, „too big”, „another one”). Un mesaj fără act și fără cuvânt de reacție nu schimbă nimic din ce s-a făcut. Ce face fiecare reacție este un fapt în lumea dialogului:

```
@rv.reduce w.dialogue.revision reaction=reduce does=step on=count direction=down
```

| Ce face o reacție | Explicație |
|---|---|
| un pas (`step`) | Urcă sau coboară o treaptă: mai multe, mai puține, mai mare, mai mic. |
| întoarce (`flip`) | Ce s-a făcut devine nedorit. |
| adaugă (`add`) | Cerința spusă acum o înlocuiește pe cea veche cu aceeași cheie și aceeași țintă. |
| păstrează (`keep`) | Aceeași cerere, altă variantă. |
| anulează (`undo`) | Se revine la cererea dinainte. |
| nimic (`none`) | O laudă sau o mulțumire. Nu se schimbă și nu se reface nimic. |

Regula acestui pas: **o reacție schimbă numai ce numește.** „Fewer novels” schimbă numărul romanelor; culoarea, mărimea și raftul rămân.

**Trimiteri la lucruri care există.** „Move the blue atlas up”, „make it red”, „remove the second one”. Sistemul caută lucrul în starea lumii vii.

| Fel de trimitere | Exemplu |
|---|---|
| după o valoare proprie | „the atlas called Europe” |
| după fel și însușire | „the blue atlas” |
| după ordine | „the second one” |
| după pronume | „it”, „them”: lucrurile din ultimul rezultat |
| după relație | „the one next to the dictionary” |
| toate | „the atlases”, „everything”: pluralul hotărât înseamnă toate lucrurile de acel fel |

Dacă se potrivește un lucru, acela este. Dacă nu se potrivește niciunul, sistemul spune asta. Dacă omul a vorbit la singular și se potrivesc mai multe, sistemul întreabă: „Which atlas? There are 5.”

**Întrebările.** Sistemul pune o întrebare în trei situații: o trimitere nelămurită; o valoare obligatorie care lipsește și pe care nicio sursă nu o poate da (atunci se folosește textul din `ask=`, lecția 7); două cerințe ale omului care nu pot fi îndeplinite împreună (lecția 20). Regula: cel mult o întrebare pe mesaj, și numai când nu există o presupunere rezonabilă.

Când întreabă, sistemul nu execută nimic și ține minte, în lumea dialogului, o **întrebare deschisă (open question)**: ce cerere aștepta și ce lipsea. Mesajul următor este citit întâi ca posibil răspuns. Dacă omul scrie „the top one” și întrebarea era despre raft, cererea care aștepta se execută. Dacă mesajul nu se potrivește ca răspuns, întrebarea se închide și mesajul este citit ca o cerere obișnuită.

## Lecția 19. Adaptarea valorilor

Uneori omul spune o valoare pe care domeniul nu o primește întocmai. Sunt trei situații diferite și nu trebuie amestecate, fiindcă nu păstrează la fel ce a cerut omul.

| Fel de adaptare | Ce este și ce se face |
|---|---|
| echivalență | Alt cuvânt pentru același lucru: „oval” și elipsă. Sensul se păstrează. Se face fără a fi anunțat. |
| aproximare | Cea mai apropiată valoare pe o scară sau într-un spațiu: „tiny” devine mic, „turquoise” devine cea mai apropiată culoare disponibilă. Se pierde ceva. Se face și se spune ce s-a luat în loc. |
| substituție | Alt lucru în locul celui cerut: stuful desenat ca floare. Se schimbă obiectul. Nu se face pe tăcute: se întreabă înainte sau, dacă se poate anula dintr-un pas, se face și se spune limpede. |

Aproximarea se sprijină pe cunoaștere. Scara mărimilor este un exemplu:

```
@sc.1 k.expect.scale step=tiny    order=1
@sc.2 k.expect.scale step=small   order=2
@sc.3 k.expect.scale step=default order=3
@sc.4 k.expect.scale step=big     order=4
@sc.5 k.expect.scale step=huge    order=5
```

Mecanismul ia valoarea spusă, se uită la ce primește parametrul și alege valoarea cea mai apropiată pe scară. În program nu există tabele de sinonime.

Fiecare înlocuire declarată de un domeniu își spune felul. Dacă pentru o valoare nu există nici echivalență, nici o scară, nici o substituție declarată, cerința este trecută la „nu am putut ține cont de”, cu motivul.

Un caz aparte este **interpretarea**: „in the afternoon” devine un interval de ore. Aceasta nu este o apropiere pe o scară, ci înțelesul expresiei, dat de cunoașterea despre timp.

Tot aici intră **moștenirea** (lecția 6): „no fish” îl exclude și pe peștișorul auriu, fiindcă `goldfish` extinde `fish`. Și **îmbinarea** (lecția 12): culoarea copertei trebuie să fie o culoare din `k.colours`; un nume care nu este culoare este refuzat.

## Lecția 20. Completarea: ce a spus omul și ce presupune sistemul

Omul nu spune aproape niciodată tot. Înainte de a completa, trebuie despărțite trei feluri de valori, pentru că sistemul le datorează lucruri diferite.

| Fel | Ce îi datorează sistemul |
|---|---|
| cerință (requirement) | Ce a spus omul. Trebuie îndeplinită. Dacă nu se poate, sistemul explică sau întreabă. Nu o schimbă și nu o lasă deoparte pe tăcute. |
| preferință (preference) | Ce ar fi bine: spus cu „if possible”, sau venit din cunoaștere ca regulă slabă. Se îndeplinește cât se poate. |
| presupunere (assumption) | Ce a ales sistemul fiindcă omul nu a spus. Poate fi schimbată oricând și se spune omului când contează. |

Dacă două cerințe ale omului nu pot fi îndeplinite împreună, niciuna nu cedează pentru că este mai veche. Sistemul spune ce se bate cap în cap și întreabă: „You said no novels and no atlases; there is nothing else here. Which may I use?” O cerință veche este înlocuită numai când omul o revizuiește limpede (aceeași țintă, aceeași cheie).

Fiecare loc gol se completează din prima sursă care are o valoare. Ordinea este aceeași în toate domeniile.

| Sursa, în ordine | Explicație |
|---|---|
| 1. spus (`said`) | Ce a spus omul în acest mesaj. |
| 2. dialog (`dialogue`) | Ce a spus mai devreme despre același lucru. |
| 3. dedus din ce a făcut omul (`induced`) | Ce au în comun lucrurile pe care omul le-a cerut așa (lecția 22). |
| 4. lume (`world`) | Valoarea din `default=` a slotului. |
| 5. obișnuit (`expect`) | Ce este obișnuit, din cunoaștere. |
| 6. ales variat (`sampled`) | O alegere între limitele permise. |

Locul în listă este și **costul** presupunerii: cu cât este mai jos, cu atât presupunerea este mai slabă.

Ce este obișnuit se scrie ca fapte de **așteptare (expectation)**:

```
@e.flow   k.expect.make  thing=flowchart unit=node min=5 max=9 typical=7 kinds_min=2 kinds_max=3 layout=flow
@e.corner k.expect.value on=place  value=corner when.size=small
@e.row    k.expect.value on=layout value=row    when.count.max=6
@e.start  k.expect.value of=node on=shape value=ellipse when.role=start
```

Primul fir: o schemă logică are de obicei 5–9 noduri, cel mai des 7. Celelalte sunt așteptări cu o condiție: un lucru mic se pune într-un colț; până la șase lucruri stau pe un rând; nodul de început este o elipsă.

Regula care apără de răspunsuri absurde: **o valoare obișnuită completează numai ce omul a lăsat gol.** Dacă omul cere o diagramă despre „how bread is baked” și cunoașterea nu are pașii, răspunsul este „I do not know the steps; I can make five empty steps, or you can name them”, nu o diagramă despre altceva.

## Lecția 21. Descompunerea: întregul și părțile

Omul cere adesea un **întreg (whole)**: o pădure, o schemă logică, un raport. Uneltele fac părți. Faptele de așteptare spun din ce părți este făcut întregul:

```
@e.tree k.expect.part of=forest part=tree min=5 max=7 typical=6 needed=yes
```

| Domeniu | Exemplu |
|---|---|
| desen | O pădure: 5–7 copaci, eventual păsări și flori. |
| diagramă | O schemă logică: 5–9 noduri legate în flux. |
| document | Un raport: titlu, introducere, secțiuni, concluzie. |
| bibliotecă | „A reference shelf”: un raft, două dicționare, un atlas. |

Cerințele ajung la părți după ținta și domeniul lor de aplicare (lecția 17), nu după o regulă generală. Un număr rămâne cu felul pe care îl numără: în „two dictionaries and an atlas”, doi este al dicționarelor.

Unele operații țin de forma „un întreg cu părți și legături”, nu de un domeniu. Sunt mecanisme ale bibliotecii, aceleași pentru o diagramă, un document sau o listă.

| Operație | Explicație |
|---|---|
| taie la n | Reduce întregul la n părți, păstrându-i structura. |
| completează la n | Adaugă părți până la numărul cerut. |
| nu toate la fel | Asigură cel puțin două feluri între părți. |
| leagă tot | Fiecare parte nelegată primește o legătură. |

Rezultatul acestei etape este un **plan (plan)**: o listă de pași, fiecare cu actul, felul lucrului și valorile lui.

## Lecția 22. Raționamentul

Cele mai multe cereri se completează direct. Raționamentul pornește numai la un **semnal**: o stare a datelor pe care oricine o poate verifica. Pe scurt, este nevoie de el când rămâne **un loc gol, o contradicție sau o alegere**.

| Semnal | Ce se face |
|---|---|
| un loc obligatoriu gol, fără sursă | O întrebare (lecția 18). |
| o constrângere tare ar fi încălcată de o presupunere | Presupunerea se schimbă: se încearcă altă variantă. |
| o constrângere tare ar fi încălcată de o cerință a omului | Se explică și nu se execută (ca la „ten atlases”). |
| o constrângere slabă ar fi încălcată | Varianta primește un cost. |
| sunt posibile mai multe variante | Căutare. |
| după execuție nu s-a schimbat nimic | Răspunsul spune că nu s-a schimbat nimic și de ce. |

Toate felurile de raționament lucrează pe aceeași **vedere ca fapte (facts view)**. În ea orice lume arată la fel: **lucruri** cu felurile lor; **însușiri**, triplete (lucru, însușire, valoare), de exemplu (b1, cover, blue); **relații**, triplete (lucru, relație, alt lucru), de exemplu (b1, on, s1). De aceea regulile de raționament se scriu o dată și merg pe orice domeniu.

**Deducția (deduction)** află ce decurge din fapte și din cunoaștere și ce reguli sunt încălcate. Raftul are șase locuri; a șaptea carte încalcă o constrângere tare. Cunoașterea spune că peștele trăiește în apă; un pește pus pe cer încalcă una slabă.

**Căutarea.** Când există o alegere, sistemul propune câteva variante, le încearcă pe o copie a lumii (lecția 5), rulează deducția pe fiecare, respinge variantele cu încălcări tari și alege dintre cele rămase pe cea mai ieftină. O căutare se poate încheia în patru feluri, și ele nu trebuie confundate.

| Sfârșitul unei căutări | Ce înseamnă și ce se spune |
|---|---|
| plan valabil | S-a găsit o variantă fără încălcări tari. Se execută. |
| cerere nevalabilă | Ce a spus omul încalcă o regulă tare. Se explică. |
| fără soluție, dovedit | Toate variantele au fost încercate și niciuna nu merge. Se poate spune „nu se poate”. |
| căutare oprită | S-a atins limita de variante sau de timp. Nu s-a dovedit nimic. Se spune „nu am găsit”, nu „nu se poate”. |

**Abducția (abduction)** este felul în care se alege între variante: se ia cea care cere cele mai puține și mai slabe presupuneri. Exemplu: „add a fish”, într-un desen cu un iaz și un cer. Lipsește locul. Variantele sunt „în iaz” și „pe cer”. Ce trebuie împăcat este cererea cu cunoașterea că peștii trăiesc în apă. „În iaz” nu încalcă nimic; „pe cer” încalcă o regulă slabă și costă mai mult. Se alege iazul. Costul unei variante este suma costurilor presupunerilor ei (locul sursei, lecția 20) și a regulilor slabe încălcate.

**Inducția (induction)** propune pentru un lucru nou valoarea pe care o au în comun lucrurile de același fel. Are o condiție esențială: se numără numai valorile care vin de la om. Dacă sistemul a făcut singur toate nodurile albastre, fiindcă albastrul era valoarea obișnuită, aceasta nu este o dovadă că omul vrea albastru. Sursa fiecărei valori (lecția 24) este folosită tocmai pentru a evita ca sistemul să învețe din propriile alegeri.

**Limitele sunt politici, nu proprietăți.** Câte variante se încearcă, câte exemple sunt de ajuns pentru inducție, cât de departe merge deducția prin cunoaștere sunt valori care se pot seta, cu valori de pornire rezonabile (azi: cinci variante, trei exemple, doi pași prin cunoaștere). Moștenirea între tipuri nu are o asemenea limită.

**Căutări proprii.** Unele alegeri au nevoie de un algoritm anume: așezarea nodurilor unei diagrame ca săgețile să se încrucișeze puțin; găsirea unui loc liber într-un desen; așezarea a patruzeci de invitați (dată rezolvitorului din lecția 13). Sunt permise în aceleași condiții ca funcțiile din lecția 9: declarate cu nume, primesc numai valori, nu citesc cererea. Planul hotărăște *ce* și *cu ce valori*; algoritmul găsește *cum*.

## Lecția 23. Legătura și execuția

Fiecare pas al planului este dus la o unealtă prin legătura declarată în lecția 15. Cheia `from=` spune de unde vine fiecare parametru.

| Sursa din `from=` | Explicație |
|---|---|
| `step.` | Din pasul de plan: felul părții, numărul ei. |
| `request.` | Din cerința cu acea cheie, după adaptare (lecția 19). |
| `state.` | Din starea lumii vii: un lucru care există și este numit în cerere. |
| `result.` | Un lucru făcut de un pas anterior al aceluiași plan. |

Unealta nu vede cererea. Primește valori gata alese.

Încercarea pe o copie a lumii arată ce *ar trebui* să se întâmple. Unealta reală poate face altceva. De aceea există un contract între ce s-a încercat și ce se execută.

| Situație | Ce se face |
|---|---|
| Cine are dreptate despre stare | Unealta. Lumea vie este o oglindă a ei, citită prin vederea stării. |
| Efectul văzut diferă de cel declarat | Pasul nu se socotește făcut. Se spune ce s-a întâmplat de fapt. |
| O unealtă dă greș la jumătatea planului | Pașii făcuți se desfac prin anularea uneltei. Unde o unealtă nu poate anula, se face operația de compensare declarată. Se spune omului ce s-a desfăcut. |
| Starea s-a schimbat între plan și execuție (omul a mutat ceva cu mâna) | Planul se reface pe starea nouă; nu se execută orbește. |

**Anularea.** O cerere executată este un singur pas de anulare, oricâte unelte a pornit. O reacție înlocuiește pasul pe care îl corectează. O întrebare nu este un pas. Un mesaj înțeles pe jumătate nu execută nimic. Toate acestea sunt valabile pentru uneltele care declară că pot anula; pentru celelalte, sistemul spune dinainte că acțiunea nu se poate desface.

## Lecția 24. Răspunsul

Răspunsul nu este scris de mână în domeniu. Se compune din date.

| Parte a răspunsului | De unde vine |
|---|---|
| ce s-a făcut | Din deosebirea netă dintre starea de dinainte și cea de după. Fără deosebire, răspunsul spune că nu s-a schimbat nimic. |
| ce s-a presupus | Din sursa fiecărei valori. Se spun presupunerile care contează; ce a spus omul nu se repetă ca presupunere. |
| ce s-a adaptat | Aproximările și substituțiile (lecția 19), cu ce s-a luat în loc. |
| ce nu s-a putut | Fiecare cerință neîndeplinită, cu cuvintele omului și cu motivul. |
| ce nu s-a înțeles | Cuvintele necitite. |

Cuvintele vin din lumea limbii, ca **fapte de răspuns (reply facts)**: propoziții cu locuri de completat. De aceea același răspuns poate fi dat și în română.

Două întrebări ale omului se rezolvă prin același mecanism. „What is on the shelf?” se răspunde din starea lumii vii. „What can you do here?” se răspunde din capabilitățile declarate.

Fiecare valoare ține minte de unde a fost luată: aceasta este **proveniența (provenance)**. Servește răspunsului, reacțiilor (se știe ce este presupunere și se poate schimba), inducției (lecția 22) și reviziei programului.

Când o cerere nu poate fi rezolvată cu piesele generale existente, nu se scrie o regulă pentru acel caz. Cazul se trece pe **lista cinstită (honest list)**, cu piesa generală care lipsește: o declarație, o bucată de cunoaștere, un cuvânt, o compunere de lumi, o metodă de raționament sau un mecanism de bibliotecă.

## Lecția 25. Cum se face un domeniu nou

Pașii, în ordine. Se scriu felurile de lucruri și sloturile. Se scriu cuvintele domeniului. Se declară capabilitățile, promițând numai ce domeniul îndeplinește cu adevărat. Se scriu uneltele: puține, mici, fără text și fără valori alese în ele. Se scrie vederea stării. Se declară uneltele și legăturile. Se caută în cunoașterea standard ce există deja. Se rulează testele și se încearcă propoziții noi.

Declarațiile bibliotecii, toate la un loc:

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
@h.make   std.schema.honours world=library act=make   on=kind on=count on=size on=attribute on=place of=book
@h.place  std.schema.honours world=library act=place  on=place of=book
@h.change std.schema.honours world=library act=change on=attribute on=size of=book
@h.remove std.schema.honours world=library act=remove of=book
@op.add    std.tool.op world=library name=add    effect=makes
@op.move   std.tool.op world=library name=move   effect=changes
@op.set    std.tool.op world=library name=set    effect=changes
@op.delete std.tool.op world=library name=delete effect=removes
@b.make   std.tool.bind world=library act=make   of=book op=add
@b.place  std.tool.bind world=library act=place  of=book op=move
@b.change std.tool.bind world=library act=change of=book op=set
@b.remove std.tool.bind world=library act=remove of=book op=delete
```

La acestea se adaugă descrierea parametrilor fiecărei unelte și sursele lor, ca în lecția 15 pentru `add`. Programul domeniului: patru unelte și vederea stării.

Starea de pornire pentru tabelul următor este cea din lecția 2: două rafturi cu câte șase locuri, cinci atlase pe cel de jos.

| Omul spune | Ce se întâmplă și de ce |
|---|---|
| „add three blue novels” | Trei romane albastre, mici, pe raftul de sus. Mărimea este o presupunere din slot; raftul este ales prin căutare. |
| „fewer” | Mai puține romane; culoarea și raftul rămân. Reacție cu un pas pe număr. |
| „move the atlas up” | „Which atlas? There are 5.” Singular, mai multe potriviri: o întrebare. |
| „the first one” | Răspunsul la întrebarea deschisă; cererea care aștepta se execută. |
| „remove the atlases” | Toate atlasele sunt scoase. Pluralul hotărât înseamnă toate. |
| „add ten atlases” | Refuz cu explicație: nu sunt atâtea locuri. O cerință a omului nu este redusă pe tăcute. |
| „a huge dictionary” | Un dicționar mare, și se spune că „huge” a fost luat ca „big”. Aproximare. |
| „what can you do here?” | Lista actelor și a cerințelor de care se ține cont, din capabilități. |
| „undo” | Ultimul pas întreg înapoi. |

## Lecția 26. Ce are voie să fie program și cum se măsoară generalitatea

Criteriul nu este „cât program există”, ci acesta: **programul unui domeniu nu are voie să dubleze pe ascuns interpretarea și hotărârile care trebuie să fie declarate.**

O unealtă poate cunoaște lucrurile ei: unealta de desen știe ce este un cerc, iar adaptorul unui calendar știe ce este un eveniment. Aceasta este treaba ei.

| Ce nu are voie să facă programul unui domeniu | De ce |
|---|---|
| să citească cererea omului | Unealta primește valori gata alese. |
| să țină tabele de cuvinte sau de sinonime | Cuvintele sunt declarații. |
| să aleagă numărul, felul, forma, locul | Este treaba planului. |
| să țină valori obișnuite | Sunt sloturi sau fapte de așteptare. |
| să scrie propoziții de răspuns | Răspunsul se compune din date. |
| să caute tipare în textul omului | Este treaba interpretării. |
| să aibă un prag potrivit pe un singur caz | Este o regulă pe caz, ascunsă într-un număr. |

Afirmația că mecanismele sunt generale este o ipoteză care se verifică: **reprezentarea comună reduce programul specific fiecărui domeniu și permite ca aceleași mecanisme de interpretare, verificare și execuție să treacă de la un domeniu la altul.** Se măsoară astfel.

| Măsură | Ce arată |
|---|---|
| costul unui domeniu nou | Câte linii de declarații, câte linii de unelte, câte ore, și câte mecanisme generale a trebuit schimbate. Ultimul număr trebuie să fie zero. |
| abaterile din programul domeniului | Câte citiri ale cererii, alegeri, valori obișnuite și propoziții de răspuns au rămas în program. Trebuie să ajungă la zero. |
| două coloane la orice rezultat | „Numai prin declarații” și „prin program scris de mână”. Contează prima. |
| teste generate din declarații | Dacă un act promite că ține cont de număr, numărul spus apare în rezultat sau în „nu am putut”. Verifică respectarea promisiunilor. |
| teste independente, scrise de mână | Reformulări ale aceleiași cereri, propoziții cu două înțelesuri, cerințe care se contrazic, compuneri de lumi. Testele generate pot repeta scăpările declarațiilor; acestea nu. |
| fidelitatea citirii | Cererea spusă înapoi și citită din nou dă aceeași cerere (lecția 17). |
| execuții greșite | Se numără separat de refuzurile cinstite. O acțiune greșită este mai rea decât un refuz. |

---

# Anexe

## Anexa A. Starea implementării (16 noiembrie 2026)

Etichetele: **bibliotecă** = făcut și testat în sopworld; **aplicație** = folosit și în aplicația demonstrativă; **comandat** = sarcină dată, nefăcută încă; **propus** = numai în acest curs.

| Piesă | Stare |
|---|---|
| fire, tipuri, sloturi, reguli, interdicții, funcții declarate, spații de nume | bibliotecă, aplicație |
| lume, copie, anulare, încălcări ca declarații | bibliotecă, aplicație |
| capabilități, limite, capacități, îmbinări | bibliotecă, aplicație |
| interpretarea propoziției într-o cerere; reacții | bibliotecă, aplicație |
| completarea din surse ordonate; așteptări cu condiție | bibliotecă, aplicație |
| vederea ca fapte; deducție, abducție, inducție | bibliotecă, aplicație |
| rezolvitoare | bibliotecă |
| descrierea uneltelor, legătura, execuția cu compararea stării (0.152–0.154) | bibliotecă; în aplicație pentru desen (lucruri simple) și diagrame |
| răspuns din diferența netă de stare; întrebări despre stare și capabilități | bibliotecă, aplicație (desen, diagrame) |
| „pluralul hotărât înseamnă toate”; un mesaj fără cuvânt de reacție nu revizuiește | bibliotecă 0.154; aplicația nu a preluat-o încă |
| scenele din desen (iaz, pădure); documentele | aplicație, încă prin program scris de mână |
| ținta, domeniul de aplicare și cuantificatorul fiecărei cerințe | comandat (parțial: ținta există) |
| cerințe, preferințe, presupuneri ca trei clase; conflictul între cerințe duce la întrebare | comandat (azi cea mai veche excludere cedează: greșit) |
| inducția numai din valori venite de la om | comandat |
| echivalență, aproximare, substituție ca feluri declarate | comandat (azi înlocuirea este un singur fel) |
| cele patru sfârșituri ale unei căutări; limitele ca politici | comandat |
| contractul dintre încercare și execuție | comandat |
| cererea spusă înapoi și recitită | comandat |
| legarea răspunsului de întrebarea deschisă | comandat |
| cheile cerințelor ca declarații | comandat |
| regulile de compunere a lumilor, cu exemplul bibliotecă–persoane–împrumuturi | comandat |
| exemplele fără dialog (verificarea unui document, orarul) | comandat ca exemple; mecanismele există |
| pagina de semantică; exemplele cursului rulate ca teste | comandat |
| lista cinstită ca fire | propus |

## Anexa B. De hotărât de către proprietar

| Întrebare | Explicație |
|---|---|
| „schemă” ca nume unic | Înlocuiește *matrix* în bibliotecă și în documentația ei. |
| numele firelor de unealtă | `std.tool.*`, cum sunt acum, sau în familia `std.schema.*`. |
| limba întrebărilor din `ask=` | Engleză în schemă și traducere, sau fapte de răspuns în lumea fiecărei limbi. |
| numele celor trei feluri de lumi | Păstrăm „schema lumii”, „lume de cunoaștere”, „lume vie”, cu explicația din lecția 11 (specificație, conținut, instanță). O redenumire ar atinge trei depozite și nu o recomand. |

## Anexa C. Cu ce seamănă

Referințele sunt date din memorie, cu autor și an, și trebuie verificate înainte de publicare.

| Ideea din curs | Înrudirea |
|---|---|
| fir cu chei; sloturi cu valori implicite | Cadrele lui Minsky (1974); structurile de trăsături. |
| lume = fapte + schemă | Bazele de cunoștințe din logicile descriptive; constrângerile de integritate. |
| fire deduse care dispar odată cu premisa | Menținerea adevărului (Doyle 1979; de Kleer 1986). |
| capabilitate, unealtă, condiții, efecte | STRIPS (Fikes și Nilsson 1971); PDDL. |
| întregul din părți | Planificarea ierarhică (Erol, Hendler și Nau 1994). |
| constrângeri tari și slabe; rezolvitor | Satisfacerea constrângerilor (Mackworth 1977), cu costuri. |
| valori obișnuite | Logica valorilor implicite (Reiter 1980). |
| abducția cu costuri | Peirce; Hobbs și colaboratorii (1993). |
| inducția din exemple | Anti-unificarea (Plotkin 1970). |
| cererea și întrebarea deschisă ca stare | „Starea de informație” (Larsson și Traum 2000); GUS (Bobrow și colaboratorii 1977). |
| înțelegerea sprijinită pe o lume mică | SHRDLU (Winograd 1972). |
| reacția schimbă numai ce numește | Revizuirea convingerilor (Alchourrón, Gärdenfors și Makinson 1985). |
| oglinda stării uneltei | Vederi actualizabile; lentile (Foster și colaboratorii 2007). |
| proveniența valorilor | Proveniența datelor (Green și colaboratorii 2007). |
| răspunsul compus din date | Generarea de limbaj (Reiter și Dale 2000); maximele lui Grice (1975). |
| teste din declarații | Testarea pe proprietăți (Claessen și Hughes 2000). |

## Anexa D. Vocabular

| Termen | Explicație |
|---|---|
| fir (wire) | O declarație: identificator, tip, perechi cheie=valoare. Lecția 3. |
| cheie, referință, fapt | Numele unei valori; o valoare care arată spre alt fir; un fir care spune că ceva este așa. Lecția 3. |
| spațiu de nume (namespace) | Partea dinaintea lui `::`. Lecția 4. |
| lume, schemă (world, schema) | Fapte ținute în acord cu o schemă; firele care spun ce fapte pot exista. Lecția 5. |
| încălcare, copie (violation, fork) | Motivul unui refuz; o a doua lume pentru încercări. Lecția 5. |
| tip, fel de lucru, moștenire | Lecția 6. |
| slot, cheie deschisă | Declarația unei chei; o cheie obligatorie fără valoare. Lecția 7. |
| variabilă, model, interdicție, regulă | Lecția 8. |
| constrângere tare, slabă | Una refuză; cealaltă primește și ține o problemă. Lecția 8. |
| funcție (function) | Un calcul declarat și scris ca program. Lecția 9. |
| schema lumii, lume de cunoaștere, lume vie | Specificație, conținut, instanță. Lecția 11. |
| îmbinare (join) | Legarea unui slot de un lucru din altă lume. Lecția 12. |
| rezolvitor (solver) | Căutarea de valori pentru multe chei deschise deodată. Lecția 13. |
| domeniu de capabilități | O lume vie, uneltele ei și vederea stării. Lecția 14. |
| capabilitate, unealtă, legătură | Promisiunea; operația; declarația care le leagă. Lecția 14. |
| cerere, cerință, rol | Propoziția ca fire; o parte a ei; locul unei valori într-o acțiune. Lecția 17. |
| țintă, domeniu de aplicare, cuantificator | Despre ce lucru, unde și „fiecare” sau „în total”. Lecția 17. |
| reacție, întrebare deschisă | Lecția 18. |
| echivalență, aproximare, substituție | Cele trei feluri de adaptare. Lecția 19. |
| cerință, preferință, presupunere | Ce a spus omul; ce ar fi bine; ce a ales sistemul. Lecția 20. |
| așteptare (expectation) | Un fapt despre ce este obișnuit. Lecția 20. |
| întreg, plan | Lecția 21. |
| deducție, abducție, inducție | Ce decurge; cea mai ieftină completare; regula din exemplele omului. Lecția 22. |
| proveniență, listă cinstită | De unde vine o valoare; cazurile nerezolvate, cu piesa care lipsește. Lecția 24. |
