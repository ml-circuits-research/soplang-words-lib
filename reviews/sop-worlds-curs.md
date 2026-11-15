# SOP Worlds: curs de început

*Versiunea 3, 15 noiembrie 2026. Text de lucru în română, sursă pentru documentația și skill-urile din sopworld. Termenul englez este dat în paranteză la prima apariție. Exemplele de fire sunt în engleză, fiindcă așa se scriu în sistem.*

*Cursul descrie și lucruri care nu există încă. Ele poartă semnul **[propus]**. Lecția 24 spune, piesă cu piesă, ce există și ce nu.*

---

## Lecția 1. Ce problemă rezolvă tehnologia

Un om scrie o propoziție: „pune trei romane pe raftul de sus”. Sistemul trebuie să facă ceva real: să adauge trei cărți într-o bibliotecă pe care omul o vede pe ecran. Apoi omul scrie „mai puține”, iar sistemul trebuie să înțeleagă că este vorba despre romane, să păstreze raftul și să scoată o parte din ele.

Felul obișnuit de a construi un asemenea sistem este să scrii, pentru fiecare fel de propoziție, o bucată de program care o recunoaște și face ce trebuie. Metoda merge pentru propozițiile la care s-a gândit programatorul. Pentru celelalte nu merge, și fiecare propoziție nouă cere încă o bucată de program. După câteva sute de bucăți, nimeni nu mai știe ce face sistemul, iar o reparație într-un loc strică altceva în alt loc.

SOP Worlds pornește de la altă împărțire a muncii. Programul nu știe nimic despre propoziții anume și nimic despre cărți sau rafturi. El știe doar să lucreze cu **declarații**. Tot ce este specific este scris ca declarații, într-un limbaj mic numit SOP Lang: ce lucruri există, ce se poate face cu ele, ce este obișnuit, ce nu este voie. Câteva mecanisme generale citesc declarațiile și fac restul: înțeleg cererea, aleg valorile care lipsesc, verifică regulile, pornesc unealta potrivită și spun ce au făcut.

Tehnologia urmărește trei lucruri.

Primul este **refolosirea**. Ce s-a scris o dată despre culori, mărimi sau despre cum arată de obicei o schemă logică se folosește oriunde în sistem, fără a fi copiat.

Al doilea este **extinderea fără program nou**. O parte nouă a sistemului, de exemplu un calendar, se adaugă scriind declarații și câteva unelte mici. Înțelegerea limbii și luarea deciziilor nu se scriu din nou.

Al treilea este **cinstea**. Fiecare valoare vine dintr-o declarație, deci sistemul poate spune de unde a luat-o („am pus șapte noduri, cât este obișnuit”). Și poate spune limpede ce nu a înțeles sau ce nu poate face, în loc să ghicească.

Cursul are această ordine. Lecțiile 2–8 explică limbajul. Lecția 9 explică felurile de lumi și ce cunoaștere este deja scrisă. Lecțiile 10–12 explică ce declară o parte a sistemului despre sine. Lecțiile 13–16 urmăresc drumul unei propoziții. Lecțiile 17–18 explică legarea. Lecțiile 19–21 explică raționamentul și regulile scrise ca program. Lecția 22 explică execuția și răspunsul. Lecțiile 23–26 dau rețeta, starea de azi, regulile de revizie și legăturile cu alte sisteme.

Folosim peste tot același exemplu mic: **o bibliotecă cu rafturi și cărți**. Omul poate pune cărți pe rafturi, le poate muta, le poate schimba culoarea copertei și le poate scoate.

---

## Lecția 2. Firul

Unitatea limbajului este **firul (wire)**. Un fir este o singură declarație, scrisă pe un rând:

```
@b1 book title="Moby Dick" genre=novel cover=blue on=$s1
```

Rândul are trei părți.

Prima parte, `@b1`, este **identificatorul (id)** firului. Este numele lui propriu, ales de cine scrie firul. Prin el alte fire pot vorbi despre acesta.

A doua parte, `book`, este **tipul (type)** firului. Tipul spune ce fel de declarație este: aici, o carte.

A treia parte este un șir de perechi `key=value`. În fiecare pereche, cuvântul din stânga este **cheia (key)** și cel din dreapta este valoarea. Firul de mai sus are patru chei: `title`, `genre`, `cover` și `on`.

Valoarea `$s1` este specială. Semnul `$` înseamnă că valoarea nu este un cuvânt, ci arată spre alt fir, cel cu identificatorul `s1`. Aceasta se numește **referință (reference)**. Aici spune că volumul stă pe raftul `s1`. Prin referințe se leagă firele între ele.

O cheie poate apărea de mai multe ori într-un fir. Atunci are mai multe valori:

```
@k1 std.schema.kind of=book acts=make acts=remove
```

Firul spune că asupra unei cărți se pot face două lucruri, `make` și `remove`.

Un fir care spune că ceva este așa se numește **fapt (fact)**. Firul `@b1` este un fapt: există o carte cu titlul „Moby Dick”, roman, cu coperta albastră, pe raftul `s1`.

Tot ce urmează în curs se scrie cu această singură formă. De aceea un mecanism care știe să citească fire poate citi orice declarație din sistem.

---

## Lecția 3. Numele: puncte, prefixe și spații de nume

În exemple apar nume cu puncte, cum este `std.schema.kind`, și identificatori ca `@t.book`. Cititorul trebuie să știe ce înseamnă ele înainte de a merge mai departe.

**Punctul nu are niciun înțeles pentru limbaj.** `std.schema.kind` este un singur nume, la fel cum ar fi `kind`. Punctele sunt puse de oameni, pentru ordine, la fel ca dosarele pe un disc. Există însă o convenție respectată peste tot: prima parte a numelui unui tip spune de unde vine tipul.

| Prefixul tipului | Ce înseamnă |
|---|---|
| `core.` | Tipuri ale limbajului însuși. Cu ele se scrie schema: `core.type`, `core.slot`, `core.rule`, `core.deny`. Le întâlnim în lecțiile 5–8. |
| `std.` | Tipuri ale modulelor standard ale bibliotecii, adică mecanisme gata făcute. De exemplu `std.schema.kind` și `std.schema.honours`, cu care un domeniu spune ce poate face. |
| `k.` | Tipuri din lumile de cunoaștere: fapte generale, adevărate pentru toată lumea. De exemplu `k.expect.make` (ce este obișnuit când faci ceva). |
| `w.` | Tipuri din schemele de lumi refolosibile. De exemplu `w.seating` (un plan de mese), `w.request` (o cerere), `w.lang.en` (limba engleză). |
| fără prefix | Tipuri proprii ale unui exemplu sau ale unei aplicații: `book`, `shelf`. |

**Identificatorii cu punct sunt tot o convenție.** În `@t.book core.type of=book`, identificatorul este `t.book`. Litera `t` vine de la „type” și ajută omul să vadă dintr-o privire că firul declară un tip. La fel, `@s.` este folosit pentru sloturi, `@k.` pentru feluri de lucruri, `@h.` pentru capabilități, `@wd.` pentru cuvinte. Limbajul nu cere aceste litere. Un identificator trebuie doar să fie unic.

**Semnul `::` este altceva și are înțeles.** El desparte un **spațiu de nume (namespace)** de identificator. Să presupunem că doi oameni folosesc sistemul în același timp și fiecare are o carte cu identificatorul `b1`. Pentru ca faptele lor să nu se amestece, fiecare sesiune își ține faptele într-un spațiu de nume: `anna::b1` și `tom::b1` sunt două fire diferite. O referință simplă, `$b1`, caută numai în același spațiu de nume. Pentru a ajunge în altul, trebuie scris întreg: `$tom::b1`.

| Semn | Explicație |
|---|---|
| `.` în numele unui tip | Fără înțeles pentru limbaj. Convenție de ordine: prefixul spune de unde vine tipul. |
| `.` într-un identificator | Fără înțeles pentru limbaj. Convenție de citire: `t.` tip, `s.` slot și așa mai departe. |
| `::` | Desparte spațiul de nume de identificator. Faptele din spații diferite nu se amestecă niciodată din greșeală. |
| `$` | Înaintea unui identificator: referință la acel fir. |
| `?` | Înaintea unui nume: variabilă. O întâlnim în lecția 7. |
| `@` | Înaintea unui identificator, la începutul firului: aici se declară firul cu acest nume. |

Regulile care spun ce este permis (schema, lecția următoare) nu stau în niciun spațiu de nume: sunt aceleași pentru toți.

---

## Lecția 4. Lumea și schema ei

O **lume (world)** este o mulțime de fire ținute împreună și verificate. Într-o lume sunt două feluri de fire.

Primele sunt faptele: ce există acum. De exemplu două rafturi și cinci cărți.

Celelalte spun ce fapte au voie să existe și ce decurge din ele. Pe acestea le numim **schema (schema)** lumii. Schema bibliotecii noastre spune că o carte are un titlu, un gen și o culoare a copertei, că stă pe un raft și că pe un raft încap cel mult șase cărți.

Lumea verifică fiecare schimbare față de schemă. Dacă cineva încearcă să pună a șaptea carte pe un raft de șase, lumea refuză. Refuzul nu este un mesaj de eroare scris de un programator. Este o declarație care spune ce regulă a fost încălcată și de către ce fire. Se numește **încălcare (violation)**. Pentru că este o declarație, sistemul o poate citi și poate explica omului de ce a refuzat.

O lume mai are două însușiri de care ne vom folosi. Ține minte ce s-a schimbat, deci poate reveni la o stare anterioară; aceasta este anularea (undo). Și poate fi copiată: o **copie (fork)** este o a doua lume, identică la pornire, în care se poate încerca ceva fără a atinge originalul.

> **Despre cuvântul „schemă”.** În programul și în documentația de azi ale bibliotecii, ceea ce numim aici schemă poartă alt nume englez, *matrix*. „Schemă” este mai ușor de înțeles și îl folosim în tot cursul. Biblioteca folosește deja expresia „schema lumii” (world schema) pentru o schemă publicată cu nume, spre a fi refolosită, cum este `w.seating`. Cele două se potrivesc: *schema* este partea de reguli a oricărei lumi; *schema lumii* este o schemă împachetată și publicată. Redenumirea în bibliotecă așteaptă hotărârea proprietarului.

---

## Lecția 5. Tipuri și feluri de lucruri

Fiecare fir are un tip (lecția 2). Tipurile se declară și ele prin fire, cu `core.type`:

```
@t.shelf core.type of=shelf extends=std.schema.thing
@t.book  core.type of=book  extends=std.schema.thing
@t.novel core.type of=novel extends=book
@t.atlas core.type of=atlas extends=book
@t.comic core.type of=comic extends=book
```

Primul fir se citește: există un tip numit `shelf`. Cheia `extends` spune că un tip îl **extinde** pe altul. Firul `@t.novel` spune că `novel` extinde `book`. Urmarea este că tot ce se declară despre `book` este valabil și pentru `novel`. Aceasta se numește **moștenire (lineage)**.

Unele tipuri descriu lucruri pe care omul le face, le mută sau le șterge: cărți, rafturi, copaci dintr-un desen, noduri dintr-o diagramă, paragrafe dintr-un document. Pe acestea le numim **feluri de lucruri (kinds of things)**. Semnul lor este că extind tipul `std.schema.thing`, direct sau prin alt tip.

Un fel de lucru este deci un tip de fir. Dar nu orice tip este un fel de lucru. `core.type` este un tip, însă nimeni nu „pune un core.type pe raft”. `book` este și tip, și fel de lucru.

| Termen | Explicație |
|---|---|
| tip (type) | Al doilea cuvânt al oricărui fir. Spune ce fel de declarație este firul. |
| fel de lucru (kind of thing) | Un tip care extinde `std.schema.thing`. Firele de acest tip sunt lucrurile asupra cărora omul acționează. |
| moștenire (lineage) | Lanțul de tipuri extinse. Ce se spune despre un tip este valabil pentru toate tipurile care îl extind. |

---

## Lecția 6. Sloturi: ce are voie să conțină o cheie

Un fir are chei (lecția 2). Rămâne de spus ce chei are voie să aibă un fir de tip `book`, ce valori pot avea și care sunt obligatorii. Acestea se spun prin fire de tip `core.slot`. Un **slot (slot)** este declarația unei chei pentru un tip.

```
@s.book.title core.slot of=book  key=title kind=string
@s.book.genre core.slot of=book  key=genre kind=atom enum=novel enum=atlas enum=comic enum=dictionary
@s.book.cover core.slot of=book  key=cover kind=atom
@s.book.size  core.slot of=book  key=size  kind=atom enum=small enum=big default=small
@s.book.on    core.slot of=book  key=on    type=shelf required=true ask="Which shelf should it go on?"
@s.shelf.room core.slot of=shelf key=room  kind=integer min=1 max=12 default=6
```

Firul `@s.book.size` se citește: tipul `book` are cheia `size`; valoarea este un cuvânt dintr-o listă închisă, `small` sau `big`; dacă nimeni nu spune mărimea, se ia `small`.

Firul `@s.book.on` spune că cheia `on` ține un alt lucru, de tip `shelf`, și că este obligatorie.

Firul `@s.shelf.room` spune că un raft are un număr de locuri, între 1 și 12, de obicei 6.

| Ce poate spune un slot | Explicație |
|---|---|
| `kind=` | Ce fel de valoare ține cheia: `integer` (număr întreg), `number` (număr), `string` (text), `atom` (un cuvânt), o cantitate cu unitate, un moment de timp. |
| `type=` | Valoarea este un alt lucru, de tipul numit. Așa apar legăturile între lucruri. |
| `enum=` | Lista închisă a valorilor permise. |
| `min=`, `max=`, `step=` | Intervalul permis și pasul. |
| `required=true` | Cheia este obligatorie. |
| `default=` | Valoarea care se ia când nimeni nu a dat una. |
| `ask=` | Întrebarea care se pune omului când cheia este obligatorie și nu are valoare. Explicată în lecția 16. |

O cheie obligatorie care nu are încă valoare se numește **cheie deschisă (open key)**. O cheie deschisă este un lucru pe care lumea știe că nu îl știe.

Trei cuvinte se confundă ușor. Le ținem separat în tot cursul.

| Termen | Explicație |
|---|---|
| cheie (key) | Numele unei valori dintr-un fir concret. Firul `@b1 book title="Moby Dick"` are cheia `title`. |
| slot (slot) | Declarația unei chei pentru un tip. Stă în schemă și spune ce are voie să conțină cheia. |
| rol (role) | Locul pe care îl ocupă o valoare într-o acțiune cerută: ce lucru, unde, cât. Apare în cereri, nu în fire. Îl întâlnim în lecția 13. |

Întrebarea „cum se pune o schemă pe un tip de fir” are deci un răspuns scurt: schema unui tip este mulțimea firelor `core.slot` care îl numesc după `of=`. Nu există un al doilea format.

---

## Lecția 7. Reguli și constrângeri

Un slot spune ce poate conține un fir luat singur. Unele lucruri privesc mai multe fire deodată: „pe un raft nu încap mai multe cărți decât locuri”. Pentru ele există reguli și constrângeri, scrise tot ca fire.

Ca să vorbim despre „orice carte”, avem nevoie de o **variabilă (variable)**. O variabilă se scrie `?name` în locul unei valori și înseamnă „o valoare de găsit”. Un fir care conține variabile se numește **model (pattern)**: nu spune că ceva există, ci descrie firele de căutat.

O **interdicție (deny)** spune că anumite modele nu au voie să se potrivească toate deodată:

```
@p.big  book size=big on=?s
@p.top  shelf id=?s level=top
@d.top  core.deny when=$p.big when=$p.top why="a big book does not go on the top shelf"
```

Primele două fire sunt modele. `@p.big` descrie orice carte mare, aflată pe un raft oarecare `?s`. `@p.top` descrie raftul `?s`, dacă este cel de sus. Aceeași variabilă în ambele modele înseamnă același raft. Al treilea fir interzice ca ambele să se potrivească: o carte mare nu stă pe raftul de sus. Cheia `why` ține explicația care va fi dată omului.

O **regulă (rule)** are aceeași formă, dar în loc să interzică, adaugă: „dacă aceste modele se potrivesc, atunci și acest fir este adevărat”.

O constrângere poate fi **tare (hard)** sau **slabă (soft)**. La una tare, schimbarea este refuzată. La una slabă, schimbarea este primită, dar lumea ține o **problemă (issue)** cât timp situația durează. Diferența va conta în lecția 20: constrângerile tari elimină variante, iar cele slabe le ordonează de la mai bună la mai puțin bună.

| Formă de constrângere | Explicație |
|---|---|
| limitele unui slot | `min`, `max`, `enum` (lecția 6). Privesc o singură valoare. |
| limită de număr | `std.schema.limit of=shelf max=8`: cel mult opt rafturi. |
| capacitate | `std.schema.capacity of=shelf key=room holds=book via=on`: un raft ține cel mult atâtea cărți câte spune cheia lui `room`; cărțile sunt legate de raft prin cheia `on`. |
| interdicție | `core.deny`: o combinație de fapte care nu are voie să existe. |
| verificare cu funcție | `core.check`: o condiție calculată de o funcție. Explicată în lecția următoare. |

---

## Lecția 8. Când o constrângere are nevoie de program

Multe constrângeri se pot spune numai prin modele, ca în lecția 7. Unele au nevoie de un calcul: o comparație, o distanță, o suprapunere de intervale. Pentru ele, schema poate chema o **funcție (function)**.

Cazul simplu folosește o funcție care vine cu biblioteca. Exemplul următor interzice două rezervări ale aceleiași săli la aceeași oră:

```
@p.a    booking room=?r hour=?h
@p.b    booking room=?r hour=?h
@c.diff core.check fn=neq args=$p.a args=$p.b
@d.room core.deny when=$p.a when=$p.b if=$c.diff why="room ?r is taken at ?h"
```

`@c.diff` este o verificare: cheamă funcția `neq` („nu sunt egale”) pe cele două fire găsite, ca o rezervare să nu fie comparată cu ea însăși. Interdicția ține numai dacă verificarea este adevărată.

Cazul al doilea are nevoie de o funcție proprie, scrisă ca program. Se poate, cu două condiții: funcția este **declarată** în schemă, cu nume și argumente, iar programul ei este mic și nu face altceva decât calculul.

Exemplul 1, un calendar: două evenimente ale aceleiași persoane nu au voie să se suprapună în timp.

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

Primele cinci fire declară funcția `overlaps` și cele patru argumente ale ei. Programul propriu-zis este o singură linie, scrisă în aplicație: întoarce adevărat dacă primul interval începe înainte ca al doilea să se termine și invers.

Exemplul 2, biblioteca: o carte încape pe un raft numai dacă lățimile cărților de pe raft, adunate, nu depășesc lățimea raftului. Adunarea se face cu un mecanism al bibliotecii (un **agregat**, adică un calcul peste toate firele găsite de un model), iar comparația cu funcția standard `gt`. Aici nu este nevoie de program propriu.

Exemplul 3, un desen: două lucruri nu au voie să se acopere unul pe altul. Aceasta cere geometrie: funcția `boxes_overlap` primește pozițiile și dimensiunile a două lucruri și spune dacă dreptunghiurile lor se ating. Este o funcție proprie, declarată la fel ca `overlaps`.

Exemplul 4, un plan de mese: la o masă rotundă, doi invitați certați nu au voie să stea pe locuri vecine. „Vecin” la o masă rotundă cere un calcul (locul 1 este vecin cu ultimul loc). Funcția `adjacent_seats` îl face.

| Ce este permis într-o funcție proprie | Explicație |
|---|---|
| un calcul pe valorile primite | Geometrie, timp, aritmetică, o căutare într-o structură. |
| un rezultat simplu | Un număr, un cuvânt, adevărat sau fals. |
| nimic despre cerere | Funcția nu vede ce a spus omul și nu alege nimic în locul lui. |
| o declarație în schemă | Cu `core.function`, ca oricine citește schema să știe că funcția există și ce primește. |

Ideea de reținut: programul este permis acolo unde este nevoie de un calcul, dar *faptul că există o regulă*, *asupra căror lucruri* și *ce se spune omului când este încălcată* rămân declarații.

---

## Lecția 9. Trei feluri de lumi și ce este deja scris

O lume este fapte plus schemă (lecția 4). În practică lumile sunt de trei feluri, după ce conțin.

| Fel de lume | Explicație |
|---|---|
| schema lumii (world schema) | Descrie un fel de lume, fără lucruri anume: felurile de lucruri, sloturile, constrângerile, cuvintele. Se poate refolosi. Exemplu: `w.seating` descrie ce este un plan de mese, oricare ar fi el. |
| lume de cunoaștere (knowledge world) | Fapte generale, adevărate pentru toată lumea, fără legătură cu vreo sesiune. Exemplu: faptele despre ce este obișnuit când faci o diagramă. |
| lume vie (live world) | O lume care rulează acum, pentru un om anume: lucrurile pe care le-a făcut, valorile lor, ce s-a schimbat. Exemplu: planul de mese pentru nunta de sâmbătă. |

O lume vie se obține încărcând una sau mai multe scheme de lumi, citind cunoașterea de care are nevoie și adăugând ce face omul.

Sunt trei feluri, și nu unul singur, pentru că schema și cunoașterea se scriu o dată și se folosesc de foarte multe ori, pe când lumea vie este scurtă și particulară. Dacă le amesteci, ajungi să copiezi cunoaștere în fiecare loc.

Schemele de lumi și lumile de cunoaștere sunt publicate într-un loc comun, depozitul *sop-knowledge-worlds*. Ce se află acolo este **standardizat**: are un nume fix, o schemă verificată și o licență, și orice aplicație îl poate încărca după nume. Tabelul dă câteva exemple din ce există.

| Lume standard | Ce conține |
|---|---|
| `k.expect` | Ce este obișnuit: câte părți are de regulă un lucru, ce mărimi, ce așezare. Folosită la completarea a ceea ce omul nu spune (lecția 18). |
| `k.actions` | Verbele și actele pe care le numesc: „draw”, „make”, „create” înseamnă toate `make`. |
| `k.colours` | Numele culorilor și valorile lor. |
| `k.animals` și alte lumi despre feluri de lucruri | Ce este fiecare, din ce se trage, unde stă de obicei. |
| `k.layouts` | Structuri obișnuite: din ce părți este făcut un raport, o scrisoare. |
| `k.charts` | Ce fel de grafic se potrivește cu ce fel de date. |
| `k.time.zone` | Fusuri orare. |
| `w.lang.en` | Limba engleză: cuvintele de legătură, numeralele, pluralul, cuvintele care arată negația sau cantitatea. |
| `w.lang.ro` | Vocabularul și formele limbii române, folosite la traducere. |
| `w.request` | Schema unei cereri (lecția 13). |
| `w.dialogue` | Schema dialogului: ce face o reacție, ce întrebare este deschisă (lecțiile 14 și 16). |
| `w.person` | O persoană: nume, preferințe. |
| `w.list`, `w.tasks` | Liste și sarcini. |
| `w.seating` | Un plan de mese. |
| `w.timeline`, `w.calendar` | O cronologie; un calendar. |

Ce nu este standardizat este ceea ce ține de o singură aplicație sau de un singur om: felul în care arată ecranul, lucrurile unei sesiuni, stilul propriu de desen. Biblioteca cu rafturi din acest curs este un exemplu inventat și nu este publicată.

---

## Lecția 10. Domeniul de capabilități

Sistemul poate face lucruri reale în mai multe părți ale lui: desenează, face diagrame, scrie documente, așază invitați la mese, ține un calendar. Numim o astfel de parte **domeniu de capabilități (capability domain)**: un loc în care sistemul poate face un anumit fel de lucruri.

| Parte a unui domeniu | Explicație |
|---|---|
| lumea vie | Starea domeniului, ca fire: ce lucruri există acum și ce valori au. Este o lume vie în sensul lecției 9. |
| uneltele (tools) | Bucăți mici de program care produc efectul real: pun o formă pe pagină, mută un nod, inserează un paragraf. |
| vederea stării (state view) | O funcție care citește ce este cu adevărat în unelte și îl dă ca fire, pentru ca lumea vie să arate realitatea. |

Pe ecran, un domeniu apare de obicei ca o filă sau ca un document separat: pagina de desen, pagina de diagrame. Dar aceasta este numai înfățișarea lui. Același domeniu poate fi folosit și fără ecran, de exemplu de alt program.

Biblioteca noastră cu rafturi este un domeniu de capabilități. Lumea ei vie conține rafturile și cărțile. Uneltele ei sunt patru: adaugă o carte, mută o carte, schimbă o însușire a unei cărți, scoate o carte.

---

## Lecția 11. Capabilitate, unealtă, legătură

Aceste trei cuvinte sunt miezul cursului.

O **capabilitate (capability)** este o promisiune declarată a domeniului. Spune trei lucruri: ce act, asupra cărui fel de lucru, și de ce cerințe ale omului ține cont. De exemplu: „pot **adăuga** **cărți** și țin cont de **câte**, **ce gen**, **ce culoare** și **pe ce raft**”. Capabilitatea este o declarație. Nu spune cum se face lucrul.

O **unealtă (tool)** este o operație de program cu parametri, care produce un efect. De exemplu `add(kind, n, size, cover, on)`. Unealta nu știe nimic despre propoziții, despre ce a cerut omul sau despre ce este obișnuit. Primește valori și le execută.

O **legătură (binding)** este declarația care spune ce unealtă îndeplinește ce capabilitate și de unde vine valoarea fiecărui parametru.

| Situație | Explicație |
|---|---|
| capabilitate fără unealtă | O promisiune care nu poate fi ținută. Sistemul trebuie să spună: „înțeleg ce ceri, dar nu am cu ce să o fac”. |
| unealtă fără capabilitate | O operație care există în program, dar pe care nimeni nu o poate cere prin limbaj. |
| o capabilitate, mai multe unelte | „Fă un iaz” într-un desen se îndeplinește prin mai mulți pași: apă, pești, stuf. Împărțirea în pași vine din cunoaștere, nu din unealtă. |
| o unealtă, mai multe capabilități | Aceeași `add` servește și „pune trei romane”, și fiecare parte a unui întreg mai mare. |

Cele trei sunt ținute separat dintr-un motiv practic. Capabilitatea este ceea ce înțelege omul și ceea ce verifică mecanismul care decide. Unealta este ceea ce poate face programul. Dacă sunt lipite într-o singură funcție, acea funcție ajunge să citească cererea, să aleagă valori și să scrie răspunsul. Adică devine o bucată de program pe caz, exact lucrul descris ca problemă în lecția 1.

---

## Lecția 12. Ce declară un domeniu

Un domeniu declară șase grupe de fire. Le arătăm pentru bibliotecă.

**Grupa 1: felurile de lucruri și sloturile lor.** Sunt cele din lecțiile 5 și 6.

**Grupa 2: cuvintele domeniului.**

```
@wd.book  core.word text=volume text=tome means=book
@wd.shelf core.word text=ledge means=shelf
```

Primul fir spune că „volume” și „tome” înseamnă `book`. Aici stau numai cuvintele proprii domeniului. Cuvintele generale ale limbii, cum sunt „without”, „three” sau „smaller”, stau în lumea limbii (`w.lang.en`, lecția 9) și servesc toate domeniile.

**Grupa 3: capabilitățile.**

```
@k.book   std.schema.kind    of=book world=library acts=make acts=place acts=change acts=remove
@h.make   std.schema.honours world=library act=make   on=kind on=count on=size on=attribute on=place of=book
@h.place  std.schema.honours world=library act=place  on=place of=book
@h.change std.schema.honours world=library act=change on=attribute on=size of=book
@h.remove std.schema.honours world=library act=remove of=book
```

Firul `@k.book` spune ce acte se aplică unei cărți: `make` (a face), `place` (a așeza), `change` (a schimba), `remove` (a scoate).

Firul `@h.make` spune de ce cerințe ține cont actul `make` pentru cărți. Verbul englez *honours* înseamnă „respectă”, adică „ține cont de”. Cheile de după `on=` sunt cerințele: felul lucrului (`kind`), numărul (`count`), mărimea (`size`), o însușire cum este culoarea (`attribute`) și locul (`place`). Lista întreagă a acestor chei este dată în lecția 13.

**Grupa 4: descrierea uneltelor [propus; există în biblioteca 0.152].**

```
@op.add      std.tool.op    world=library name=add effect=makes
@pa.add.kind std.tool.param op=add name=kind  of=book required=true
@pa.add.n    std.tool.param op=add name=n     kind=integer min=1 max=20 default=1
@pa.add.size std.tool.param op=add name=size  accepts=small accepts=big
@pa.add.cov  std.tool.param op=add name=cover kind=atom
@pa.add.on   std.tool.param op=add name=on    type=shelf
@nd.add      std.tool.needs op=add exists=shelf
```

Aceste fire descriu unealta `add` din afară. `@op.add` spune că există și că efectul ei este să facă un lucru nou. Fiecare `std.tool.param` descrie un parametru. La `kind`, `of=book` înseamnă: valoarea este numele unui fel de lucru din neamul lui `book` (de exemplu `novel`). La `on`, `type=shelf` înseamnă: valoarea este un raft anume, care există deja. `@nd.add` spune ce trebuie să existe înainte ca unealta să poată lucra: cel puțin un raft.

**Grupa 5: legătura [propus; există în biblioteca 0.152].**

```
@b.make  std.tool.bind world=library act=make of=book op=add
@a.make1 std.tool.arg  bind=$b.make param=kind  from=step.kind
@a.make2 std.tool.arg  bind=$b.make param=n     from=step.count
@a.make3 std.tool.arg  bind=$b.make param=size  from=request.size
@a.make4 std.tool.arg  bind=$b.make param=cover from=request.attribute.colour
@a.make5 std.tool.arg  bind=$b.make param=on    from=request.place
```

Firul `@b.make` spune: actul `make` asupra unei cărți se îndeplinește cu unealta `add`. Fiecare fir `std.tool.arg` spune de unde se ia valoarea unui parametru. Sursele sunt explicate în lecția 18.

**Grupa 6: ce este obișnuit în acest domeniu, dacă diferă de cunoașterea generală.** De regulă nu este nevoie. Explicată în lecția 18.

În afara firelor, domeniul are două bucăți de program: uneltele și vederea stării. Alt program nu are.

---

## Lecția 13. Cererea

Când omul scrie o propoziție, sistemul o preface mai întâi într-o **cerere (request)**. Cererea este o mică lume de fire, cu schema `w.request` (lecția 9). După acest pas, nimic din ce urmează nu mai lucrează cu cuvinte.

Să luăm propoziția „add three blue novels, no big ones”.

| Parte a cererii | Explicație |
|---|---|
| actul (act) | Ce se vrea făcut. Aici `make`, din verbul „add”. |
| ținta (target) | Asupra cărui fel de lucru. Aici `novel`. |
| cerințele (constraints) | Fiecare cerință are o cheie, un sens și o valoare. Aici sunt trei: numărul este 3; însușirea culoare este `blue`; mărimea `big` este nedorită. Fiecare cerință păstrează și cuvintele exacte din care a fost citită. |
| reacțiile (reactions) | Cuvinte care judecă ce s-a făcut înainte: „too many”, „smaller”, „nice”. Aici nu sunt. |
| necititul (unread) | Cuvintele pe care nimic nu le-a înțeles. Aici nu sunt. |

Sensul unei cerințe este unul din trei: „vreau” (`yes`), „nu vreau” (`no`) sau „nu toate” (`not_all`).

Aici apare cuvântul **rol (role)**, anunțat în lecția 6. În propoziția de mai sus, „novels” ocupă rolul lucrului făcut, iar „three” rolul numărului. Rolurile sunt locurile dintr-o acțiune. Legarea (lecțiile 17 și 18) duce valorile din roluri în cheile lumii vii și în parametrii uneltelor.

Cerințele au un set mic de chei, aceleași în toate domeniile.

| Cheia cerinței | Ce spune omul prin ea |
|---|---|
| `kind` | Ce fel de lucru: „novels”, „no birds”. |
| `count` | Câte: „three”, „at most five”, „fewer”. |
| `size` | Cât de mare: „big”, „tiny”. |
| `extent` | Cât de mult din spațiu ocupă întregul: „a small pond in the corner”. |
| `attribute` | O însușire: culoare, stil. |
| `place` | Unde: „on the top shelf”, „on the left”. |
| `manner` | Cum: „neatly”, „at random”. |
| `layout` | Ce așezare: „in a row”, „as a tree”. |
| `with` | Cu ce părți: „with arrows”. |
| `about` | Despre ce: „about volcanoes”. |
| `length` | Cât de lung: „two chapters”, „short”. |

Acestea sunt aceleași chei pe care le numesc capabilitățile după `on=` (lecția 12). Aici se întâlnesc ce cere omul și ce promite domeniul.

Cuvintele pe care le recunoaște sistemul sunt toate declarații: cuvintele limbii din `w.lang.en`, cuvintele domeniului, valorile sloturilor (`small`, `big`), numele felurilor de lucruri și cunoașterea (numele culorilor).

Două reguli țin de cinste. Dacă rămân cuvinte necitite într-un loc care contează, cererea nu se execută pe ghicite. Și un cuvânt care pare greșit scris este corectat numai dacă există un singur candidat limpede; un cuvânt corect nu se schimbă niciodată.

---

## Lecția 14. Cerere nouă sau reacție

Al doilea mesaj al omului poate fi o cerere nouă („add a shelf”) sau o reacție la ce tocmai s-a făcut („fewer”). Sistemul hotărăște care dintre ele, tot din declarații.

Un mesaj care are un act și un lucru nou este o cerere nouă. Altfel este o reacție. Ce face fiecare reacție este scris ca fapt în lumea dialogului (`w.dialogue`):

```
@rv.reduce w.dialogue.revision reaction=reduce does=step on=count direction=down
```

Firul spune: reacția numită `reduce` (citită din „fewer” sau „too many”) face un pas în jos pe număr.

| Ce face o reacție | Explicație |
|---|---|
| un pas (`step`) | Urcă sau coboară o treaptă: mai multe, mai puține, mai mare, mai mic. |
| întoarce (`flip`) | Ce s-a făcut devine nedorit: „not circles”. |
| adaugă (`add`) | Cerința spusă acum o înlocuiește pe cea veche cu aceeași cheie. |
| păstrează (`keep`) | Aceeași cerere, altă variantă: „another one”. |
| anulează (`undo`) | Se revine la cererea dinainte. |
| nimic (`none`) | O laudă sau o mulțumire. Nu se schimbă și nu se reface nimic. |

Regula cea mai importantă a acestui pas: **o reacție schimbă numai ce numește.** „Fewer novels” schimbă numărul romanelor. Culoarea, mărimea și raftul rămân exact cum erau.

---

## Lecția 15. Vorbirea despre lucruri care există deja

Multe mesaje vorbesc despre lucruri făcute mai devreme: „move the blue atlas up”, „make it red”, „remove the second one”. Sistemul trebuie să găsească despre ce lucru este vorba. Caută în starea lumii vii, adică în faptele ei (lecția 2).

| Fel de trimitere | Exemplu |
|---|---|
| după o valoare proprie | „the atlas called Europe”: cartea cu acel titlu. |
| după fel și însușire | „the blue atlas”: lucrul de felul `atlas` cu coperta `blue`. |
| după ordine | „the second one”. |
| după pronume | „it”, „them”: lucrurile din ultimul rezultat. |
| după relație | „the one next to the dictionary”. |

Sunt trei urmări posibile. Dacă se potrivește un singur lucru, acela este. Dacă nu se potrivește niciunul, sistemul spune asta. Dacă se potrivesc mai multe, sistemul pune o singură întrebare: „Which novel? There are 5.” Ce se întâmplă cu întrebarea este subiectul lecției următoare.

---

## Lecția 16. Întrebările: de unde vin și unde ajunge răspunsul

În lecția 6 am văzut cheia `ask=` pe un slot:

```
@s.book.on core.slot of=book key=on type=shelf required=true ask="Which shelf should it go on?"
```

Textul de după `ask=` este o întrebare pregătită pentru om. Lecția aceasta explică atunci când este pusă și ce se face cu răspunsul.

Sistemul pune o întrebare în două situații.

Prima: o cheie obligatorie a rămas deschisă și nimic nu o poate completa. Să zicem că omul scrie „add a novel” și există trei rafturi. Sistemul încearcă întâi să găsească singur raftul, din sursele descrise în lecția 18: ce a spus omul mai devreme, ce se vede în bibliotecă, ce este obișnuit. De cele mai multe ori reușește și nu întreabă nimic. Numai dacă nicio sursă nu dă o valoare, pune întrebarea din `ask=`.

A doua: o trimitere se potrivește cu mai multe lucruri (lecția 15).

Regula este: **cel mult o întrebare pe mesaj, și numai când nu există o presupunere rezonabilă.** Un sistem care întreabă la fiecare pas este obositor; unul care ghicește tot este nesigur.

Când pune o întrebare, sistemul nu execută nimic și ține minte, în lumea dialogului, o **întrebare deschisă (open question)**: ce cerere aștepta, ce cheie lipsea și ce valori ar fi bune. Mesajul următor al omului este citit mai întâi ca posibil răspuns. Dacă omul scrie „the top one”, iar întrebarea deschisă era despre raft, „the top one” este căutat printre rafturi, cheia `on` primește valoarea și cererea care aștepta se execută. Dacă mesajul nu se potrivește ca răspuns (omul a schimbat subiectul), întrebarea deschisă se închide și mesajul este citit ca o cerere obișnuită.

| Parte | Stare |
|---|---|
| întrebarea din `ask=` și lista cheilor deschise | Există în bibliotecă. |
| întrebarea „care dintre ele?” la o trimitere nelămurită | Există în biblioteca 0.152. |
| legarea mesajului următor de întrebarea deschisă | În lucru. Este următoarea piesă comandată bibliotecii. |

Întrebarea este scrisă în engleză în schemă, ca tot restul. Când omul vorbește altă limbă, întrebarea trece prin același strat de traducere ca răspunsurile (lecția 22).

---

## Lecția 17. Legarea, partea întâi: cazurile directe

Am ajuns la partea care dă numele cursului. Să reamintim ce avem: o **cerere**, cu act, țintă și cerințe (lecția 13); **capabilitățile** domeniului, care spun de ce cerințe ține cont fiecare act (lecția 12); **sloturile** lucrurilor (lecția 6); și **parametrii** uneltelor (lecția 12).

**Legarea** înseamnă a duce fiecare valoare din cerere la locul ei: într-o cheie a lumii vii și într-un parametru al unei unelte. Există mai multe tehnici. Se încearcă în ordine, de la cea mai simplă. Fiecare are un semn limpede că nu ajunge, și atunci se trece la următoarea.

### Tehnica 1. Potrivirea directă

Omul spune „a big atlas”. Cerința are cheia `size` și valoarea `big`. Slotul `size` al cărții primește `big`. Parametrul `size` al uneltei `add` primește `big`. Valoarea trece direct, fără nicio gândire.

Semnul că nu ajunge: valoarea spusă nu este printre cele primite, sau nu există un slot pentru ea.

### Tehnica 2. Moștenirea

Reamintire: `novel` extinde `book` (lecția 5). Ce s-a declarat pentru `book` este valabil pentru `novel`.

| Domeniu | Exemplu |
|---|---|
| bibliotecă | Capabilitatea „scoate o carte” este valabilă pentru un atlas, fiindcă `atlas` extinde `book`. |
| desen | „No fish” exclude și peștișorul auriu, fiindcă `goldfish` extinde `fish`. |
| plan de mese | „Move a guest” este valabil și pentru un copil, fiindcă `child` extinde `guest`. |

Semnul că nu ajunge: felul spus nu este nici declarat, nici urmaș al unuia declarat.

### Tehnica 3. Înlocuirea declarată

Uneori omul cere un fel de lucru pe care unealta nu îl are, dar are unul apropiat. Domeniul poate declara înlocuirea:

```
@as.reed std.schema.drawn world=drawing kind=reed as=flower
```

Firul spune: în desen, stuful (`reed`) este desenat ca floare.

| Domeniu | Exemplu |
|---|---|
| desen | Stuful este desenat ca floare. |
| diagramă | Ovalul este desenat ca elipsă. |
| bibliotecă | Un „encyclopedia” este pus ca dicționar, dacă domeniul nu are alt fel de carte de referință. |

Regula de cinste: înlocuirea este trecută între presupunerile planului, deci omul află că a primit altceva decât a cerut.

### Tehnica 4. Traducerea unei valori pe o scară

Omul spune „a tiny atlas”. Unealta primește doar `small` și `big`. Cunoașterea are o scară a mărimilor:

```
@sc.1 k.expect.scale step=tiny    order=1
@sc.2 k.expect.scale step=small   order=2
@sc.3 k.expect.scale step=default order=3
@sc.4 k.expect.scale step=big     order=4
@sc.5 k.expect.scale step=huge    order=5
```

Mecanismul general ia valoarea spusă, se uită la valorile pe care le primește parametrul și o alege pe cea mai apropiată pe scară: `small`. În program nu există niciun tabel de sinonime.

Aceeași tehnică servește orice fel de valoare pentru care cunoașterea are o ordine sau o măsură de apropiere.

| Fel de valoare | Exemplu |
|---|---|
| mărime | „Tiny” devine `small`, pe scara mărimilor. |
| culoare | „Turquoise”, la o unealtă cu opt culori, devine cea mai apropiată dintre ele. |
| loc | „Top right”, la o unealtă cu regiuni numite, devine regiunea corespunzătoare. |
| timp | „In the afternoon”, într-un calendar cu ore, devine intervalul de după-amiază. |

Semnul că nu ajunge: cunoașterea nu are nicio ordine pentru acel fel de valoare. Atunci cerința este trecută la „nu am putut ține cont de”, cu motivul.

### Tehnica 5. Îmbinarea cu altă lume

Un slot poate spune că valoarea lui este un lucru dintr-o altă lume, găsit după o cheie:

```
@s.book.cover core.slot of=book key=cover type=k.colours.basic by=name
```

Firul spune: culoarea copertei este o culoare din lumea de cunoaștere a culorilor, găsită după nume. Se numește **îmbinare (join)**. Prin ea, lumea vie folosește cunoașterea altei lumi fără să o copieze.

| Domeniu | Exemplu |
|---|---|
| bibliotecă | Culoarea copertei este o culoare din `k.colours`; un nume care nu este culoare este refuzat. |
| plan de mese | Invitatul este o persoană din `w.person`; de acolo se știu preferințele ei. |
| calendar | Locul unui eveniment este legat de un fus orar din `k.time.zone`. |

Îmbinarea este strictă: un nume care nu există în lumea numită este o încălcare.

### Tehnica 6. Trimiterea la ce există

Când cererea vorbește despre un lucru care există deja, valoarea rolului este identificatorul acelui lucru. Felurile de trimitere sunt cele din lecția 15.

---

## Lecția 18. Legarea, partea a doua: când omul nu spune tot

Omul nu spune aproape niciodată tot. „Make a flowchart” nu spune câte noduri, ce forme, cum așezate. Tehnicile următoare completează ce lipsește.

### Tehnica 7. Completarea din surse, într-o ordine fixă

Fiecare loc rămas gol se completează din prima sursă care are o valoare. Ordinea surselor este aceeași în toate domeniile.

| Sursa, în ordine | Explicație |
|---|---|
| 1. spus (`said`) | Ce a spus omul în acest mesaj. |
| 2. dialog (`dialogue`) | Ce a spus mai devreme despre același lucru. |
| 3. dedus din ce există (`induced`) | Ce se vede în lumea vie: dacă toate cărțile sunt albastre, și cea nouă va fi albastră. |
| 4. lume (`world`) | Valoarea din `default=` a slotului (lecția 6). |
| 5. obișnuit (`expect`) | Ce este obișnuit, din cunoaștere. |
| 6. ales variat (`sampled`) | O alegere între limitele permise, ca rezultatele să nu fie mereu la fel. |

Locul în această listă este și **costul** presupunerii. O valoare luată de mai jos este o presupunere mai slabă. Costul va conta în lecția 20.

Ce este obișnuit se scrie ca fapte de **așteptare (expectation)**, în lumea `k.expect`:

```
@e.flow k.expect.make thing=flowchart unit=node min=5 max=9 typical=7 kinds_min=2 kinds_max=3 layout=flow
@e.tree k.expect.part of=forest part=tree min=5 max=7 typical=6 needed=yes
```

Primul fir spune: o schemă logică are de obicei între 5 și 9 noduri, cel mai des 7, cu două sau trei forme diferite, așezate în flux. Al doilea: o pădure are între 5 și 7 copaci, iar copacii sunt obligatorii.

Unele valori obișnuite depind de altele. Ele se scriu cu o condiție:

```
@e.corner k.expect.value on=place  value=corner when.size=small
@e.row    k.expect.value on=layout value=row    when.count.max=6
@e.grid   k.expect.value on=layout value=grid   when.count.min=7
@e.start  k.expect.value of=node on=shape value=ellipse when.role=start
```

Se citesc: un lucru mic se pune într-un colț; până la șase lucruri se așază pe un rând; de la șapte în sus, pe o grilă; nodul de început al unei diagrame este o elipsă.

O regulă apără de răspunsuri absurde: **o valoare obișnuită completează numai ce omul a lăsat gol. Nu înlocuiește niciodată ce a spus.** Dacă omul cere o diagramă despre „how bread is baked” și cunoașterea nu are pașii, răspunsul corect este „I do not know the steps; I can make five empty steps, or you can name them”. Nu este o diagramă despre altceva.

### Tehnica 8. Întregul făcut din părți

Omul cere adesea un **întreg (whole)**: o pădure, o schemă logică, un raport. Unealta știe să facă doar părți: un copac, un nod, o secțiune. Faptele de așteptare spun din ce părți este făcut întregul, iar planul primește câte un pas pentru fiecare parte.

| Domeniu | Exemplu |
|---|---|
| desen | O pădure: 5–7 copaci, eventual păsări și flori. |
| diagramă | O schemă logică: 5–9 noduri legate în flux. |
| document | Un raport: titlu, introducere, trei secțiuni, concluzie (din `k.layouts`). |
| bibliotecă | „A reference shelf”: un raft, două dicționare, un atlas. |

Cerințele se împart între părți după felul lor. Un număr aparține felului pe care îl numără: în „two dictionaries and an atlas”, doi este al dicționarelor. O excludere se aplică tuturor părților. O mărime se aplică întregului.

### Tehnica 9. Operații asupra structurii

Unele hotărâri nu țin de niciun domeniu, ci de forma generală „un întreg cu părți și legături între ele”. Ele sunt mecanisme ale bibliotecii, aceleași pentru o diagramă, pentru un document cu capitole sau pentru o listă cu subpuncte.

| Operație | Explicație |
|---|---|
| taie la n | Reduce întregul la n părți, păstrându-i structura: rădăcina și nivelurile de sus ale unui arbore, primele capitole ale unui text. |
| completează la n | Adaugă părți până la numărul cerut. |
| nu toate la fel | Asigură cel puțin două feluri între părți. |
| mai multe feluri deodată | „A sky and a sun”: fiecare fel cu numărul lui. |
| leagă tot | „Connect them all”: fiecare parte nelegată primește o legătură. |

### Tehnica 10. Regula dedusă din ce există

Dacă toate lucrurile de același fel din lumea vie au o valoare comună, un lucru nou o primește și el. Dacă omul a corectat de două ori în același sens, a treia oară corecția se aplică de la început.

| Domeniu | Exemplu |
|---|---|
| bibliotecă | Toate atlasele sunt pe raftul de jos, deci atlasul nou merge tot acolo. |
| diagramă | Toate nodurile sunt albastre, deci nodul nou este albastru. |
| document | Toate titlurile sunt scurte, deci titlul nou este scurt. |

De aceea această sursă stă înaintea valorii din slot și a celei obișnuite: ce a făcut omul aici contează mai mult decât ce este obișnuit în general.

### Tehnica 11. De la pasul de plan la pornirea uneltei

După tehnicile de mai sus există un **plan (plan)**: o listă de pași, fiecare cu actul, felul lucrului și toate valorile alese. Ultima legare duce fiecare pas la o unealtă. Reamintire: firele `std.tool.arg` din lecția 12 spun, pentru fiecare parametru, de unde vine valoarea, prin cheia `from=`.

| Sursa din `from=` | Explicație |
|---|---|
| `step.` | Din pasul de plan: felul părții (`step.kind`), numărul ei (`step.count`). |
| `request.` | Din cerința cu acea cheie (`request.size`), după traducerea pe valorile primite (tehnica 4). |
| `state.` | Din starea lumii vii: un lucru care există deja, numit în cerere (`state.shelf`). |
| `result.` | Un lucru făcut de un pas anterior al aceluiași plan. |

Unealta nu vede cererea. Primește doar valori gata alese.

---

## Lecția 19. Când este nevoie de raționament

Cele mai multe cereri se leagă direct și se execută. Raționamentul costă timp, deci pornește numai când apare un **semnal**. Un semnal este o stare a datelor, pe care oricine o poate verifica. Nu este o bănuială a programatorului.

Pe scurt, este nevoie de raționament când legarea directă lasă **un loc gol, o contradicție sau o alegere**.

| Semnal | Ce se face |
|---|---|
| un loc obligatoriu este gol | Se completează din surse (tehnica 7). Dacă nicio sursă nu are valoare, se pune o întrebare (lecția 16). |
| valoarea spusă nu este primită | Se traduce pe scară (tehnica 4) sau se înlocuiește declarat (tehnica 3). |
| cerința nu este printre cele promise de act | Refuz cinstit: „here I cannot take that into account”. |
| o constrângere tare ar fi încălcată | Varianta se respinge și se încearcă alta (lecția 20). |
| o constrângere slabă ar fi încălcată | Varianta primește un cost; se alege cea mai ieftină (lecția 20). |
| sunt posibile mai multe planuri | Se propun câteva, se încearcă pe o copie, se alege (lecția 20). |
| o trimitere se potrivește cu mai multe lucruri | O întrebare (lecțiile 15 și 16). |
| excluderile nu mai lasă nimic | Cea mai veche excludere cedează, și se spune. |
| după execuție nu s-a schimbat nimic | Răspunsul spune că nu s-a schimbat nimic și de ce. |
| au rămas cuvinte necitite care contează | Nu se execută. Se spune ce parte s-a înțeles și ce parte nu. |

---

## Lecția 20. Cele trei feluri de raționament și căutarea

Toate lucrează pe aceeași bază, numită **vederea ca fapte (facts view)**. În ea, orice lume vie arată la fel, indiferent de domeniu. Are **lucruri**, fiecare cu felurile lui. Are **însușiri**: triplete de forma (lucru, însușire, valoare), de exemplu (b1, cover, blue). Are **relații**: triplete de forma (lucru, relație, alt lucru), de exemplu (b1, on, s1). La acestea se adaugă ce spune cunoașterea despre fiecare fel de lucru.

Aceasta este traducerea în ceva general: regulile de raționament sunt scrise o singură dată, pe lucruri, însușiri și relații, și merg pe o bibliotecă, pe un desen sau pe un calendar.

### Deducția: ce decurge și ce se încalcă

**Deducția (deduction)** pornește de la faptele lumii vii și de la cunoaștere și află ce decurge din ele și ce reguli sunt încălcate. Este mărginită la doi pași: ce spune cunoașterea despre felul lucrului, apoi despre felul din care acesta se trage.

| Domeniu | Exemplu |
|---|---|
| bibliotecă | Raftul are șase locuri; a șaptea carte încalcă o constrângere tare (capacitatea, lecția 7). |
| desen | Cunoașterea spune că peștele trăiește în apă; un pește pus pe cer încalcă o constrângere slabă. |
| plan de mese | Doi invitați certați pe locuri vecine încalcă interdicția din lecția 8. |
| calendar | Două evenimente ale aceleiași persoane care se suprapun (lecția 8). |

### Căutarea: propune, încearcă, respinge, alege

Când există o alegere, sistemul face un ciclu scurt. Propune câteva variante, cel mult cinci. Pe fiecare o încearcă pe o copie a lumii vii (lecția 4), deci nimic real nu se atinge. Pe copie rulează deducția. Variantele care încalcă o constrângere tare sunt respinse. Cele rămase sunt ordonate după cost. Prima este aleasă. Dacă nu rămâne niciuna, sistemul spune ce constrângere a blocat.

Pentru probleme mari, cum este așezarea a patruzeci de invitați la cinci mese, aceleași declarații de constrângeri sunt date unui **rezolvitor (solver)**, care caută mai eficient. Declarațiile nu se schimbă; se schimbă numai felul de a căuta.

Fiecare căutare are un **buget (budget)** de pași. Când bugetul se termină, sistemul spune că s-a oprit. Nu inventează un rezultat.

### Abducția: cea mai ieftină completare

**Abducția (abduction)** răspunde la întrebarea: dintre felurile în care pot completa ce lipsește, care cere cele mai puține și mai slabe presupuneri? Costul unei variante este suma costurilor presupunerilor ei (locul sursei, din lecția 18) și a constrângerilor slabe pe care le încalcă.

| Domeniu | Exemplu |
|---|---|
| bibliotecă | „Add a novel”, fără raft numit. Se alege primul raft care mai are loc; un raft plin ar încălca o constrângere tare. |
| desen | „Add a fish”, într-un desen cu un iaz și un cer. Varianta „în iaz” nu încalcă nimic. Varianta „pe cer” încalcă o constrângere slabă. Se alege iazul. |
| calendar | „Move the meeting later”. Se alege cel mai apropiat interval liber care nu încalcă nimic. |

### Inducția: regula din exemple

**Inducția (induction)** caută ce au în comun lucrurile existente și propune aceeași valoare pentru un lucru nou. Am întâlnit-o ca tehnica 10. Este mărginită cu bună știință: are nevoie de cel puțin trei lucruri sau de două corecții. Sub aceste praguri nu trage nicio concluzie.

### Cum lucrează împreună

Inducția propune valori. Abducția alege varianta cea mai ieftină. Deducția o verifică și o respinge dacă încalcă o regulă tare. Niciuna dintre ele nu știe în ce domeniu se află.

---

## Lecția 21. Căutări scrise ca program

Lecția 8 a arătat că o constrângere poate chema o funcție proprie. La fel, unele alegeri au nevoie de un algoritm pe care ciclul general din lecția 20 nu îl poate înlocui bine. Acestea sunt permise, în aceleași condiții: sunt declarate cu nume, primesc numai valori și nu citesc cererea.

| Domeniu | Căutare proprie |
|---|---|
| diagramă | Așezarea nodurilor astfel încât săgețile să se încrucișeze cât mai puțin. Este un algoritm de așezare a grafurilor. Planul hotărăște *ce* noduri și *ce* fel de așezare; algoritmul găsește doar coordonatele. |
| desen | Găsirea unui loc liber pentru un lucru nou, fără a acoperi altele. Planul hotărăște regiunea; algoritmul găsește punctul. |
| plan de mese | Așezarea multor invitați cu multe preferințe. Se dă rezolvitorului; constrângerile rămân declarații. |
| bibliotecă | Așezarea cărților pe un raft după înălțime. Planul hotărăște că se ordonează și după ce; unealta face ordonarea. |

Împărțirea este mereu aceeași: *ce* se face și *cu ce valori* hotărăște planul, din declarații; *cum* se obține efectul fizic este treaba programului.

---

## Lecția 22. Execuția și răspunsul

### Execuția

Un mecanism general al bibliotecii ia planul pas cu pas. Pentru fiecare pas găsește legătura potrivită după act și fel de lucru (lecția 12). Completează parametrii din sursele lor (tehnica 11). Verifică în starea lumii vii ce trebuie să existe înainte. Pornește unealta. Apoi citește din nou starea și verifică dacă efectul declarat s-a produs.

### Anularea

Câteva reguli sunt aceleași în orice domeniu. O cerere executată este un singur pas de anulare, oricâte unelte a pornit. O reacție înlocuiește pasul pe care îl corectează. O întrebare nu este un pas. Un mesaj înțeles numai pe jumătate nu execută nimic.

### Răspunsul

Răspunsul nu este scris de mână în domeniu. Se compune din date, în patru părți.

| Parte a răspunsului | De unde vine |
|---|---|
| ce s-a făcut | Din deosebirea dintre starea de dinainte și cea de după. Dacă nu este nicio deosebire, răspunsul spune că nu s-a schimbat nimic. |
| ce s-a presupus | Din sursa fiecărei valori (lecția 18). Se spun doar presupunerile care contează. |
| ce nu s-a putut | Fiecare cerință de care nu s-a ținut cont, cu cuvintele omului și cu motivul. |
| ce nu s-a înțeles | Cuvintele necitite. |

Cuvintele răspunsului vin din lumea limbii, ca **fapte de răspuns (reply facts)**: propoziții cu locuri de completat. De aceea același răspuns poate fi dat și în română, prin `w.lang.ro`.

Două întrebări ale omului se rezolvă prin același mecanism. „What is on the shelf?” se răspunde din starea lumii vii. „What can you do here?” se răspunde din capabilitățile declarate (lecția 12).

### De unde vine fiecare valoare

Fiecare valoare din plan ține minte de unde a fost luată. Aceasta se numește **proveniență (provenance)**. Servește la trei lucruri. Răspunsul poate spune ce a presupus. La o reacție se știe ce este voie să se schimbe (presupunerile) și ce nu (ce a spus omul). La revizia programului se vede dacă o valoare a venit din cunoaștere sau dintr-un număr ascuns în program.

### Lista cinstită

Când o cerere nu poate fi rezolvată cu piesele generale existente, nu se scrie o regulă pentru acel caz. Cazul se trece pe **lista cinstită (honest list)**, împreună cu piesa generală care lipsește: o declarație, o bucată de cunoaștere, un cuvânt, o legare între lumi, o metodă de raționament sau un mecanism de bibliotecă. Lucrul următor se alege după câte cereri reale ar debloca o piesă.

---

## Lecția 23. Cum se face un domeniu nou

Pașii, în ordine. Se scriu felurile de lucruri și sloturile lor. Se scriu cuvintele domeniului. Se declară capabilitățile, cu grijă să fie promise numai cerințele de care domeniul ține cont cu adevărat. Se scriu uneltele: puține, mici, fără text și fără valori ascunse. Se scrie vederea stării. Se declară uneltele și legăturile. Se caută în cunoașterea standard (lecția 9) ce există deja și se adaugă fapte proprii numai unde domeniul diferă. La sfârșit se rulează testele și se încearcă propoziții noi.

Biblioteca, toată:

```
@w        std.schema.world name=library
@t.shelf  core.type of=shelf extends=std.schema.thing
@t.book   core.type of=book  extends=std.schema.thing
@t.novel  core.type of=novel extends=book
@t.atlas  core.type of=atlas extends=book
@t.comic  core.type of=comic extends=book
@t.dict   core.type of=dictionary extends=book
@s.shelf.room  core.slot of=shelf key=room  kind=integer min=1 max=12 default=6
@s.shelf.level core.slot of=shelf key=level kind=atom enum=top enum=middle enum=bottom
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
@b.make   std.tool.bind world=library act=make   of=book op=add
@b.place  std.tool.bind world=library act=place  of=book op=move
@b.change std.tool.bind world=library act=change of=book op=set
@b.remove std.tool.bind world=library act=remove of=book op=delete
```

Programul domeniului: patru unelte (`add`, `move`, `set`, `delete`) și vederea stării.

Ce trebuie să meargă fără nimic în plus:

| Omul spune | Ce se întâmplă și de ce |
|---|---|
| „add three blue novels” | Trei romane albastre, mici, pe primul raft cu loc. Potrivire directă pentru număr și culoare; valoarea din slot pentru mărime; abducție pentru raft. |
| „fewer” | Mai puține romane; culoarea și raftul rămân. Reacție cu un pas pe număr. |
| „move the blue tome up” | Dacă sunt trei volume albastre: „Which one? There are 3.” Cuvânt al domeniului; trimitere nelămurită; o întrebare. |
| „the first one” | Răspunsul la întrebarea deschisă; cererea care aștepta se execută. |
| „add ten atlases” | Refuz, cu motivul: raftul are șase locuri. Deducție, constrângere tare. |
| „a huge dictionary” | Un dicționar mare, și se spune că „huge” a fost luat ca „big”. Traducere pe scară. |
| „paint the comic blue” | Coperta benzii desenate devine albastră. Trimitere după fel; act `change`. |
| „what can you do here?” | Lista actelor și a cerințelor de care se ține cont. Din capabilități. |
| „undo” | Ultimul pas întreg înapoi. |

---

## Lecția 24. Ce există azi și ce nu

| Piesă | Stare |
|---|---|
| fire, tipuri, sloturi, reguli, interdicții, funcții declarate | Există în bibliotecă. |
| lume, copie, anulare, încălcări ca declarații, spații de nume | Există în bibliotecă. |
| declararea capabilităților | Există în bibliotecă. |
| limite, capacități, îmbinări | Există în bibliotecă. |
| citirea propoziției într-o cerere; cerere nouă sau reacție | Există în bibliotecă. |
| planul cu surse ordonate; ciclul propune–încearcă–respinge–alege | Există în bibliotecă. |
| vederea ca fapte; deducție, abducție, inducție mărginite | Există în bibliotecă. |
| rezolvitoare pentru probleme mari | Există în bibliotecă. |
| descrierea uneltelor și legătura (`std.tool.*`) | Există în biblioteca 0.152, livrată în ziua scrierii cursului. Aplicația nu o folosește încă. |
| traducerea valorilor pe scară; valori obișnuite cu condiție; operații asupra structurii | Există în biblioteca 0.152. Aplicația le are încă scrise ca program. |
| execuția cu unelte și compararea stării | Există în biblioteca 0.152. Aplicația nu o folosește încă. |
| întrebarea la o trimitere nelămurită | Există în biblioteca 0.152. |
| legarea răspunsului de întrebarea deschisă | În lucru. |
| cheile cerințelor ca declarații | În lucru. Azi lista este fixă în programul bibliotecii, deci un domeniu nu poate aduce o cheie nouă, de exemplu „tempo” pentru muzică. |
| înlocuirea declarată | Provizoriu: există numai în aplicație și numai pentru feluri de lucruri. |
| răspuns compus numai din date | Parțial. Mecanismul există; domeniile aplicației își scriu încă propriile propoziții. |
| lista cinstită ca fire | Propus. |

Problema principală de azi, spusă direct: în cele trei domenii ale aplicației care folosesc drumul nou (desen, diagrame, documente), între plan și unealtă stă câte o funcție mare de program. Ea alege din nou valori, ține tabele de cuvinte și scrie propoziția de răspuns. Lucrul următor este înlocuirea acestor funcții cu declarațiile din lecția 12 și cu mecanismele din biblioteca 0.152.

---

## Lecția 25. Ce are voie să fie program și cum se verifică

În programul unui domeniu au voie trei lucruri: uneltele, vederea stării și, unde este nevoie de calcul, funcții și căutări proprii declarate cu nume (lecțiile 8 și 21).

La revizie se resping următoarele, oriunde ar apărea în programul unui domeniu.

| Ce se respinge | De ce |
|---|---|
| citirea cererii | Unealta trebuie să primească valori gata alese. |
| tabele de cuvinte sau de sinonime | Cuvintele sunt declarații în lumea limbii sau a domeniului. |
| valori ascunse în program | Sunt sloturi sau fapte de așteptare. |
| alegerea numărului, a felului, a formei, a locului | Este treaba planului. |
| numele unui fel de lucru scris în program | Programul nu are voie să știe ce feluri există. |
| propoziții de răspuns | Răspunsul se compune din date. |
| căutarea de tipare în textul omului | Citirea este treaba mecanismului de înțelegere. |
| un prag potrivit pe un singur caz | Este o regulă pe caz, ascunsă într-un număr. |
| o verificare slăbită ca să treacă un test | Ascunde o greșeală. |

Verificarea se face în patru feluri. Un numărător arată câte astfel de abateri sunt în programul fiecărui domeniu; numărul are voie doar să scadă. Orice rezultat se raportează pe două coloane, „numai prin declarații” și „prin program scris de mână”, și contează prima. Din fiecare capabilitate declarată se generează teste automat: dacă actul promite că ține cont de număr, atunci numărul spus trebuie să apară în rezultat sau în „nu am putut”. Iar dovada de generalitate este un domeniu mic, cum este biblioteca, care merge numai cu fire și câteva unelte.

---

## Lecția 26. Cu ce seamănă

Ideile nu sunt noi luate una câte una. Nou este că sunt puse într-un singur limbaj și folosite împreună. Tabelul arată înrudirile, pentru cine vrea să citească mai departe. Referințele sunt date din memorie, cu autor și an, și trebuie verificate înainte de publicare.

| Ideea din curs | Înrudirea |
|---|---|
| fir cu chei; sloturi cu valori implicite | Cadrele lui Minsky (1974); structurile de trăsături din gramaticile de unificare. |
| lume = fapte + schemă | Bazele de cunoștințe din logicile descriptive; constrângerile de integritate din bazele de date. |
| lumea ține minte din ce a dedus fiecare valoare | Sistemele de menținere a adevărului (Doyle 1979; de Kleer 1986). |
| capabilitate, unealtă, condiții și efecte | Planificarea clasică: STRIPS (Fikes și Nilsson 1971), limbajul PDDL. |
| întregul din părți | Planificarea ierarhică pe rețele de sarcini (Erol, Hendler și Nau 1994). |
| constrângeri tari și slabe; căutare | Problemele de satisfacere a constrângerilor (Mackworth 1977) și varianta lor cu costuri. |
| valori obișnuite ca fapte | Logica valorilor implicite (Reiter 1980). |
| abducția cu costuri | Peirce; „interpretarea ca abducție” (Hobbs și colaboratorii 1993). |
| inducția din exemple | Anti-unificarea (Plotkin 1970). |
| deducția mărginită | Datalog și înlănțuirea înainte. |
| cererea și întrebarea deschisă ca stare a dialogului | Abordarea „stării de informație” (Larsson și Traum 2000); sistemul GUS (Bobrow și colaboratorii 1977). |
| înțelegerea sprijinită pe o lume mică | SHRDLU (Winograd 1972). Deosebirea: aici lumea este declarată, nu programată, și sunt mai multe domenii. |
| reacția schimbă numai ce numește | Revizuirea convingerilor cu schimbare minimă (Alchourrón, Gärdenfors și Makinson 1985). |
| proveniența valorilor | Proveniența datelor (Green și colaboratorii 2007). |
| răspunsul compus din date | Generarea de limbaj natural (Reiter și Dale 2000). |
| teste generate din declarații | Testarea bazată pe proprietăți (Claessen și Hughes 2000). |
| descrierea uneltelor | Descrierile de funcții date modelelor de limbaj. Deosebirea: aici valorile sunt alese de un mecanism care poate arăta de unde a luat fiecare. |

---

## Vocabular

| Termen | Explicație |
|---|---|
| fir (wire) | O declarație: identificator, tip, perechi cheie=valoare. Lecția 2. |
| cheie (key) | Numele unei valori dintr-un fir. Lecția 2. |
| referință (reference) | O valoare `$id` care arată spre alt fir. Lecția 2. |
| fapt (fact) | Un fir care spune că ceva este așa. Lecția 2. |
| spațiu de nume (namespace) | Partea dinaintea lui `::`; ține faptele unor sesiuni diferite despărțite. Lecția 3. |
| lume (world) | Fapte ținute în acord cu o schemă. Lecția 4. |
| schemă (schema) | Firele unei lumi care spun ce fapte pot exista și ce decurge din ele. Lecția 4. |
| încălcare (violation) | Motivul unui refuz, ca declarație. Lecția 4. |
| copie (fork) | O a doua lume, identică la pornire, pentru încercări. Lecția 4. |
| tip (type) | Al doilea cuvânt al unui fir. Lecția 5. |
| fel de lucru (kind of thing) | Un tip ale cărui fire sunt lucruri asupra cărora omul acționează. Lecția 5. |
| moștenire (lineage) | Lanțul de tipuri extinse. Lecția 5. |
| slot (slot) | Declarația unei chei pentru un tip. Lecția 6. |
| cheie deschisă (open key) | O cheie obligatorie fără valoare. Lecția 6. |
| variabilă, model (variable, pattern) | `?name`; un fir care descrie fire de căutat. Lecția 7. |
| interdicție, regulă (deny, rule) | Ce nu are voie să existe; ce decurge. Lecția 7. |
| constrângere tare, slabă (hard, soft) | Una refuză schimbarea; cealaltă o primește și ține o problemă. Lecția 7. |
| funcție (function) | Un calcul declarat în schemă și scris ca program. Lecția 8. |
| schema lumii (world schema) | O schemă publicată pentru refolosire. Lecția 9. |
| lume de cunoaștere (knowledge world) | Fapte generale, fără stare de sesiune. Lecția 9. |
| lume vie (live world) | O lume care rulează pentru un om. Lecția 9. |
| domeniu de capabilități (capability domain) | O parte a sistemului: o lume vie, uneltele ei și vederea stării. Lecția 10. |
| capabilitate (capability) | Promisiune declarată: act, fel de lucru, cerințe de care se ține cont. Lecția 11. |
| unealtă (tool) | Operație de program cu parametri și efect. Lecția 11. |
| legătură (binding) | Declarația care leagă o capabilitate de o unealtă. Lecția 11. |
| cerere (request) | Propoziția omului, ca fire. Lecția 13. |
| cerință (constraint) | O parte a cererii: cheie, sens, valoare. Lecția 13. |
| rol (role) | Locul unei valori într-o acțiune. Lecția 13. |
| reacție (reaction) | Un mesaj care judecă rezultatul dinainte. Lecția 14. |
| întrebare deschisă (open question) | O întrebare pusă omului, ținută minte până vine răspunsul. Lecția 16. |
| legare | Ducerea fiecărei valori din cerere la locul ei. Lecțiile 17–18. |
| așteptare (expectation) | Un fapt despre ce este obișnuit. Lecția 18. |
| întreg (whole) | Un lucru cerut care este făcut din părți. Lecția 18. |
| plan (plan) | Lista de pași, cu toate valorile alese. Lecția 18. |
| deducție, abducție, inducție | Ce decurge; cea mai ieftină completare; regula din exemple. Lecția 20. |
| rezolvitor, buget (solver, budget) | Căutarea pentru probleme mari; numărul de pași permis. Lecția 20. |
| proveniență (provenance) | De unde vine o valoare. Lecția 22. |
| listă cinstită (honest list) | Cazurile nerezolvate, fiecare cu piesa generală care îi lipsește. Lecția 22. |

---

## De hotărât de către proprietar

| Întrebare | Explicație |
|---|---|
| „schemă” ca nume unic | Nu văd o piedică, cu lămurirea din lecția 4. Cere o redenumire în bibliotecă și în documentația ei. |
| numele firelor de unealtă | `std.tool.*`, cum sunt acum în biblioteca 0.152, sau în familia `std.schema.*`, lângă `honours`. |
| limba întrebărilor din `ask=` | Rămân în engleză în schemă și trec prin traducere, ca în lecția 16, sau se scriu ca fapte de răspuns în lumea fiecărei limbi. |
