# SOP Worlds: teoria

*Versiunea 11, 16 noiembrie 2026. Text de lucru în română; termenul englez este dat în paranteză la prima apariție. Exemplele de fire sunt în engleză, fiindcă așa se scriu în sistem.*

*Documentul descrie tehnologia **așa cum trebuie să fie**, ca și cum schimbările ar fi deja făcute. Toate exemplele sunt din cele patru domenii ale aplicației: **desen, diagrame, documente, calendar**. Ce diferă azi și ce este de schimbat este în documentul pereche, `sop-worlds-schimbari.md`. Forma exactă a firelor noi este o propunere pe care biblioteca o va fixa.*

*Cum este scris. Fiecare lecție pornește de la o nevoie: ce problemă avem și de ce nu merge fără lucrul despre care urmează să vorbim. Abia apoi vine numele lui, un exemplu citit rând cu rând și, la sfârșit, ce face sistemul cu el. Un termen nu este folosit înainte de a fi explicat; singura excepție este lecția 2, care arată tot drumul o dată, pe scurt, și spune unde este explicat fiecare pas.*

---

# Partea întâi. Ideea

## Lecția 1. Ce este SOP Worlds și ce problemă rezolvă

Să pornim de la aplicația noastră. Un om scrie „draw three big red fish”, iar un program trebuie să deseneze. Alt om scrie „a meeting with Ana at ten thirty”, iar programul trebuie să pună o ședință în calendar sau să explice de ce nu poate. Felul obișnuit de a construi așa ceva este să scrii, pentru fiecare fel de propoziție, o bucată de program care o recunoaște și face ce trebuie. Merge pentru zece propoziții. La o sută, fiecare propoziție nouă cere încă o bucată de program, bucățile se contrazic între ele, iar când programul greșește nimeni nu mai poate spune de ce.

SOP Worlds pornește altfel. În loc să scriem program pentru fiecare propoziție, **descriem lumea despre care se vorbește**: ce lucruri pot exista pe o pagină desenată, ce însușiri au, ce este permis și ce nu, ce se știe în general despre pești, iazuri, scrisori și ședințe. Descrierea este făcută din declarații scurte, scrise într-un limbaj mic numit SOP Lang. O astfel de descriere, împreună cu lucrurile care există la un moment dat, se numește **lume (world)**.

Un singur program general, biblioteca numită sopworld, lucrează cu orice lume. El face patru lucruri, aceleași pentru desen și pentru calendar. Ține lumea **consistentă**: nu primește o schimbare care încalcă o regulă declarată. **Răspunde la întrebări** despre ce există. **Trage concluzii** din ce există și din reguli. Și **explică**: când refuză ceva, spune ce regulă a fost încălcată și de către ce lucruri.

Tehnologia are deci două niveluri, iar documentul le ia pe rând. Primul este **modelul general**: cum se scrie o lume, cum se leagă mai multe lumi între ele, cum se verifică și cum se trag concluzii. Acesta este util și fără nicio conversație, de exemplu pentru a verifica un document sau a găsi un orar. Al doilea este **folosirea conversațională**: un om scrie o propoziție, iar sistemul desenează, face o diagramă, scrie un document sau pune o ședință. Al doilea nivel este construit în întregime peste primul și nu are voie să îl ocolească.

O singură regulă ține totul laolaltă: **se merge de la general spre particular, întotdeauna.** Fiecare lucru se declară o singură dată, la nivelul cel mai general la care este adevărat, și este moștenit de tot ce este mai particular. Ce înseamnă „unde” se declară o dată, pentru toate lumile; desenul spune numai că locul lui este o pagină. Urmarea practică este că o propoziție nouă a omului nu cere un rând nou scris pentru ea. Dacă ajungem să scriem un rând pentru un caz, am greșit nivelul.

Ce câștigăm din aceasta se vede în trei lucruri.

| Câștig | Ce înseamnă concret |
|---|---|
| refolosire | Ce s-a declarat o dată (ce este o culoare, ce înseamnă „mai mare”, cum arată de obicei o scrisoare) este folosit de desen, de diagrame, de documente și de calendar, fără a fi copiat în fiecare. |
| extindere ieftină | Un domeniu nou, cum este calendarul, se adaugă scriind declarațiile lui proprii și câteva unelte mici de program. Nimic din partea generală nu se schimbă. |
| trasabilitate | Pentru orice valoare dintr-un rezultat se poate arăta de unde vine: a spus-o omul, a ales-o sistemul sau vine din cunoașterea generală. Sistemul spune și ce nu a înțeles, ce nu poate face și ce nu a putut verifica. |

## Lecția 2. Un exemplu urmărit de la un capăt la altul

Această lecție arată tot drumul unui mesaj, o singură dată, înainte de a explica piesele. Cuvintele noi sunt puse între ghilimele și au alături lecția în care sunt explicate. Nu trebuie înțelese acum în amănunt; trebuie doar văzut ce pași există.

Domeniul este desenul. Pe pagină sunt deja un iaz în stânga jos, o casă în dreapta și doi pești mici în iaz. Omul scrie: **„draw three big red fish”**.

| Pasul | Ce face sistemul |
|---|---|
| 1. Citește starea | Întreabă unealta de desen ce este pe pagină și află: un iaz, o casă, doi pești. Fără acest pas nu ar ști față de ce să judece „big”. |
| 2. Înțelege propoziția | Desparte propoziția în părți cu rost: ce se cere (a face ceva nou), ce fel de lucru (pește), câte (trei), ce culoare (roșu), ce mărime (mare). Rezultatul se numește „cerere” (lecția 21). |
| 3. O așază în dialog | Hotărăște dacă mesajul este o cerere nouă sau o corectare a celei dinainte. Aici este nouă. Observă că omul nu a spus unde să fie peștii (lecția 22). |
| 4. Transformă cuvintele în numere | „Big” nu are un înțeles fix: aici înseamnă vizibil mai mare decât cei doi pești de pe pagină. „Red” devine o culoare anume, ca numere (lecțiile 10, 11 și 23). |
| 5. Completează ce lipsește | Pentru loc există variante: în iaz sau altundeva pe pagină (lecția 24). |
| 6. Raționează | Cunoașterea generală spune că peștii trăiesc în apă. Varianta „în iaz” nu încalcă nimic, deci este aleasă. O căutare a desenului găsește trei poziții libere în iaz (lecția 26). |
| 7. Execută | Pornește unealta de desen de trei ori, cu numere: ce fel, la ce poziție, cât de mare, ce culoare. Apoi citește starea din nou și verifică: acum sunt cinci pești (lecția 27). |
| 8. Răspunde | „I drew 3 big red fish in the pond.” Locul este spus fiindcă l-a ales sistemul, nu omul (lecția 28). |

Omul scrie apoi doar **„in the sky”**. Nu este o propoziție întreagă. Sistemul o înțelege ca pe o valoare pentru ce lipsise din cererea dinainte, adică locul, și deci ca pe o corectare. Faptul că peștii trăiesc în apă este o regulă de bun-simț, nu o imposibilitate, iar omul a spus limpede ce vrea. Peștii sunt mutați în partea de sus a paginii: „I moved the 3 fish to the sky.”

Un refuz arată altfel. În calendar, Ana are o ședință de la zece la unsprezece. Omul scrie **„a meeting with Ana at ten thirty”**. De data aceasta se încalcă o regulă care nu poate fi ocolită: un om nu poate fi în două ședințe în același timp. Sistemul nu pune ședința și nici nu o mută pe tăcute la altă oră. Răspunde: „Ana is busy from 10 to 11. The nearest free time is 11:00. Shall I put it there?”

Schema de mai jos arată aceleași părți. Sus este ce se declară o dată; jos este ce se întâmplă la fiecare mesaj. Săgeata care se întoarce spre stare este cea mai importantă: după execuție, sistemul nu se crede pe cuvânt, ci citește din nou ce există de fapt.

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

Partea aceasta explică SOP Lang, limbajul în care se scrie o lume. Este mic: are un singur fel de propoziție, numit fir, și câteva semne. Tot restul documentului folosește numai ce se explică aici.

## Lecția 3. Firul: cum se scrie un singur lucru

Ca să descriem o lume avem nevoie de un fel de a spune un singur lucru despre ea: „există un pește roșu, în iaz, la poziția aceasta”. În SOP Lang, un astfel de lucru spus se numește **fir (wire)** și se scrie pe un rând.

```
@f1 fish colour=$c.red size=1.6 at=120,540 in=$pond1
```

Rândul se citește de la stânga la dreapta, în trei părți.

Prima parte, `@f1`, este **identificatorul (id)** firului: numele lui propriu. Este nevoie de el pentru ca alte fire să poată vorbi despre acest pește. Fără identificator nu am putea spune mai târziu „mută peștele acela”.

A doua parte, `fish`, este **tipul (type)** firului. Tipul spune despre ce fel de lucru vorbește firul și, prin aceasta, ce are voie să conțină: un fir de tipul `fish` poate avea o culoare; un fir de tipul `meeting` are o oră și o durată.

A treia parte este un șir de perechi de forma `key=value`. Cuvântul din stânga semnului egal este **cheia (key)**: numele unei informații despre lucru. Ce este în dreapta este **valoarea (value)** ei. Aici peștele are patru chei: `colour`, `size`, `at` și `in`.

O valoare poate fi de patru feluri. Poate fi un **număr**, ca `1.6`: peștele este de 1,6 ori mai mare decât un pește obișnuit. Poate fi un **punct**, adică mai multe numere despărțite prin virgulă, ca `120,540`: poziția pe pagină, pe orizontală și pe verticală. Poate fi un **text**, scris între ghilimele. Și poate fi o **referință (reference)** la alt fir, scrisă cu semnul `$` urmat de identificatorul acelui fir: `in=$pond1` spune că peștele este în lucrul descris de firul `@pond1`, adică în iaz, iar `colour=$c.red` trimite la firul care descrie culoarea roșie.

Referințele sunt cele care leagă firele între ele. Peștele trimite la iaz; o săgeată dintr-o diagramă trimite la cele două noduri pe care le unește. O mulțime de fire legate astfel se numește **circuit (circuit)**. De aici vine și numele de „fir”.

Un fir ca cel de mai sus, care spune că ceva există și este într-un anumit fel, se numește **fapt (fact)**. Vom vedea în lecția 5 că există și fire care nu descriu lucruri, ci regulile lumii.

Aceeași formă servește toate cele patru domenii. Mai jos sunt un nod și o săgeată dintr-o diagramă, o parte a unei scrisori și o ședință.

```
@n3 node    label="Bake" shape=$sh.rectangle at=300,220
@l2 link    from=$n2 to=$n3
@p2 section of=$letter1 role=body text="..." order=3
@m1 meeting title="Review" start=10.5 length=1 room=$r2 people=$ana
```

Primul rând spune că există un nod cu eticheta „Bake”, de formă dreptunghiulară, la o poziție. Al doilea spune că există o săgeată de la nodul `n2` la nodul `n3`. Al treilea spune că scrisoarea `letter1` are o parte care este cuprinsul ei și stă pe locul al treilea. Al patrulea spune că există o ședință numită „Review”, care începe la zece și jumătate, ține o oră, este în sala `r2` și o are ca participant pe Ana.

## Lecția 4. Numele și semnele

Lecția aceasta lămurește două lucruri care altfel încurcă la citire: ce înseamnă punctele din nume și ce înseamnă semnele `@`, `$`, `?` și `::`.

**Punctul nu înseamnă nimic pentru limbaj.** `core.type` este un singur nume, la fel ca `fish`. Punctele sunt puse pentru cititor, după o convenție: prima parte a numelui unui tip spune de unde vine acel tip, deci unde îi găsești definiția.

| Începutul numelui | De unde vine tipul |
|---|---|
| `core.` | Din limbajul însuși. Sunt tipurile cu care se scriu regulile unei lumi: `core.type`, `core.slot`, `core.rule`, `core.deny` (lecțiile 5 și 6). |
| `std.` | Din modulele generale ale bibliotecii: tipurile cu care se declară ce poate face un domeniu și ce unelte are (lecția 19). |
| `w.legend.` | Din lumea legendelor, unde stau conceptele generale (partea a treia). |
| `k.` | Dintr-o bază de cunoaștere: ce se știe în general despre lucruri (lecția 15). |
| `w.` | Dintr-o descriere refolosibilă a unui fel de lume: `w.drawing`, `w.diagram`, `w.document`, `w.calendar` (lecția 15). |

Aceeași convenție se folosește la identificatori: în exemple, `@t.` începe numele unui fir care declară un tip, iar `@s.` pe al unuia care declară un slot. Este doar un ajutor la citire.

**Semnul `::` are înțeles.** Să zicem că Anna și Tom au fiecare câte un desen și în fiecare există un fir `f1`. Ca să nu se confunde, fiecare desen are un **spațiu de nume (namespace)**: un nume pus în fața identificatorului și despărțit de el prin `::`. `anna::f1` și `tom::f1` sunt două fire diferite. Spațiile de nume ne lasă să ținem mai multe lumi una lângă alta fără ca numele lor să se ciocnească. O regulă lucrează într-un singur spațiu de nume, deci regulile desenului Annei nu văd peștii lui Tom.

| Semn | Ce spune |
|---|---|
| `@` | „Aici se declară firul cu acest nume.” Apare o singură dată pentru fiecare fir, la începutul rândului lui. |
| `$` | „Mă refer la firul cu acest nume.” Apare ca valoare a unei chei. |
| `?` | „Aici poate sta orice valoare.” Este o variabilă; apare numai în reguli (lecția 6). |
| `::` | Desparte spațiul de nume de identificator. |

## Lecția 5. Lumea și schema ei

Până aici am scris fapte. Dar nimic nu ne-a oprit să scriem un pește cu o durată sau o ședință fără oră. Ca programul să poată verifica faptele, trebuie să îi spunem ce fapte au voie să existe. Aceasta este treaba schemei.

O **lume (world)** are deci două feluri de fire. **Faptele** spun ce există acum: acest pește, această ședință. **Schema (schema)** spune ce fapte au voie să existe și ce decurge din ele. Schema este scrisă tot cu fire, numai că tipurile acestor fire încep cu `core.`. Nu există un al doilea limbaj pentru reguli.

**Declararea tipurilor de fire.** Am văzut că fiecare fir are un tip: `fish`, `node`, `meeting`. Un tip de fire trebuie declarat în schemă înainte de a fi folosit, iar declarația este ea însăși un fir, de tipul `core.type`.

```
@t.drawn core.type of=drawn extends=std.schema.thing is=thing
```

Citit pe rând: `of=drawn` spune că se declară tipul de fire numit `drawn`, adică „lucru desenat”. `extends=std.schema.thing` spune că tipul `drawn` **extinde** tipul mai general `std.schema.thing`: tot ce s-a declarat despre firele de tipul general este valabil și pentru firele de tipul `drawn`. Aceasta este **moștenirea (lineage)** și este felul în care se aplică regula „de la general la particular”: ce este comun se scrie o dată, sus. `is=thing` leagă tipul de un concept general din lumea legendelor; despre aceasta este partea a treia.

**Declararea cheilor unui tip.** Un tip de fire are anumite chei. Fiecare cheie se declară printr-un fir de tipul `core.slot`. Un **slot (slot)** este deci declarația, în schemă, a unei chei a unui tip de fire: spune cum se numește cheia, ce fel de valoare are voie să țină și alte câteva lucruri. Cheia este ce scriem în fapt (`size=1.6`); slotul este regula din schemă care spune că firele `drawn` au o cheie `size` și că valoarea ei este un număr.

```
@s.drawn.at   core.slot of=drawn key=at     kind=point  means=place   space=page   required=true
@s.drawn.size core.slot of=drawn key=size   kind=number means=quality space=size
@s.drawn.col  core.slot of=drawn key=colour kind=point  means=quality space=colour
@s.drawn.in   core.slot of=drawn key=in     type=drawn  means=place   relation=in
```

Primul rând se citește așa: firele de tipul `drawn` (`of=drawn`) au o cheie numită `at` (`key=at`); valoarea ei este un punct (`kind=point`); cheia este obligatorie (`required=true`), adică un lucru desenat trebuie să aibă o poziție. Ultimele două perechi, `means=place space=page`, spun ce înseamnă această cheie în termeni generali: este un loc, iar locul se măsoară pe pagină. Ele sunt explicate în lecția 14; deocamdată este de ajuns că fiecare slot spune și ce înseamnă.

Al patrulea rând arată celălalt fel de valoare: `type=drawn` spune că valoarea cheii `in` nu este un număr, ci o referință la alt fir de tipul `drawn`. Un pește poate fi „în” alt lucru desenat, de exemplu în iaz.

Un slot mai poate spune câte valori are voie să țină cheia. Fără nicio precizare, ține una singură. Cu `many=true` ține mai multe: participanții unei ședințe.

**Ce se întâmplă când o cheie obligatorie nu are valoare.** Să zicem că schema spune că un lucru desenat trebuie să aibă o poziție, iar omul a cerut „draw a fish” fără să spună unde. Firul peștelui există, dar cheia lui `at` nu are valoare. Am putea refuza firul ca greșit. Nu o facem, fiindcă aceasta este cea mai obișnuită situație dintr-o conversație: omul spune o parte, iar restul trebuie aflat. De aceea situația are un nume: o cheie pe care schema o declară obligatorie și care nu are încă valoare se numește **cheie deschisă (open key)**.

O cheie deschisă nu este o eroare. Este o **sarcină neterminată**, iar lumea ține socoteala tuturor: se poate întreba oricând „ce chei deschise există?” și se primește lista lor. Aceasta este lista cu ce mai trebuie hotărât înainte ca cererea omului să poată fi îndeplinită. Cu fiecare cheie deschisă se poate face unul din trei lucruri, iar sistemul le încearcă în această ordine. Poate fi **completată**: dacă regulile lumii lasă o singură valoare posibilă, ea este pusă; dacă lasă mai multe, este aleasă cea mai potrivită (lecțiile 24 și 26). Peștele ajunge în iaz. Poate fi **căutată împreună cu altele**: când sunt multe chei deschise care depind una de alta, cum sunt orele și sălile tuturor ședințelor unei săptămâni, un program de căutare găsește valori pentru toate deodată (lecția 18). Sau poate deveni o **întrebare** pusă omului, când nimic din ce se știe nu poate alege: „In which room?” (lecția 22).

Așadar cheile deschise sunt legătura dintre schemă și tot ce urmează în conversație: ele spun, într-un fel pe care programul îl poate număra, ce lipsește. Legătura lor cu variabilele este explicată în lecția 6, după ce apar variabilele.

**Verificarea.** De fiecare dată când se cere o schimbare (un fir nou, o valoare nouă, o ștergere), lumea o verifică față de schemă înainte de a o primi. Rezultatul are trei valori, nu două, iar a treia este cea care ne ferește de răspunsuri false.

| Rezultat | Ce înseamnă |
|---|---|
| validă (valid) | Nicio regulă tare nu este încălcată și toate regulile au putut fi verificate. Schimbarea este primită. |
| nevalidă (invalid) | Cel puțin o regulă tare este încălcată. Schimbarea este refuzată, iar refuzul este el însuși o declarație, numită **încălcare (violation)**, care spune ce regulă și ce fire sunt în cauză. Din ea se compune explicația „Ana is busy from 10 to 11”. |
| nedeterminată (undetermined) | Nu s-a găsit nicio încălcare, dar o regulă nu a putut fi verificată, fiindcă îi lipsește o valoare. O ședință fără durată nu poate fi verificată pentru suprapuneri: nu știm dacă este în regulă. |

De ce contează a treia valoare: dacă am trata „nu am găsit nicio problemă” ca „este în regulă”, sistemul ar pune ședința fără durată peste alta și ar spune că a reușit. Regula este deci următoarea. Înainte de a executa ceva, toate regulile tari despre lucrurile care se schimbă trebuie să fi fost verificate până la capăt. Dacă una rămâne nedeterminată, nu se execută nimic, iar sistemul cere valoarea care lipsește.

**Anularea și copia de încercare.** O lume ține minte fiecare schimbare, deci o poate anula. Și poate fi copiată: o **copie (fork)** este o a doua lume, la început identică, în care se poate încerca o schimbare fără a atinge originalul. Cu ea sistemul încearcă un plan înainte de a-l executa: pune peștii în copia paginii, vede dacă se încalcă ceva și abia apoi pornește unealta adevărată.

## Lecția 6. Variabile, reguli, interdicții, funcții

Schema din lecția 5 spune ce chei are un fir. Nu poate spune încă lucruri care privesc mai multe fire deodată: „un nod spre care nu vine nicio săgeată este un început”, „un om nu poate fi în două ședințe în același timp”. Pentru acestea este nevoie de un fel de a vorbi despre **orice** fir de un anumit fel, nu despre unul anume.

**Variabila și modelul.** Să zicem că vrem să vorbim despre orice săgeată care ajunge la un nod oarecare. Scriem un fir care arată ca o săgeată, dar în locul valorii punem un nume care începe cu `?`:

```
@p.in link to=?n
```

`?n` este o **variabilă (variable)**: un loc gol cu nume, în care se potrivește orice valoare. Firul întreg se numește **model (pattern)**. Un model nu spune că ceva există. Este o întrebare pusă lumii: „care sunt săgețile, și spre ce nod duce fiecare?”. Lumea răspunde cu toate faptele care se potrivesc, iar pentru fiecare dintre ele `?n` ia valoarea găsită. Dacă aceeași variabilă apare în două modele ale aceleiași reguli, trebuie să ia aceeași valoare în amândouă; așa se leagă modelele între ele.

Modelele stau numai în schemă. Un fapt nu conține niciodată variabile și nu este folosit niciodată ca model.

**Cum se deosebește o variabilă de o cheie deschisă.** Amândouă sunt „un loc fără valoare”, deci se confundă ușor, dar sunt lucruri diferite. O variabilă stă într-un model, în schemă, și înseamnă „oricare ar fi valoarea”; nu lipsește nimic, este felul de a scrie o regulă generală. O cheie deschisă stă într-un fapt și înseamnă „aici trebuie să fie o valoare și încă nu o știm”; ceva lipsește și trebuie aflat. Se întâlnesc într-un singur loc: când sistemul caută valori pentru cheile deschise, le tratează ca pe niște necunoscute și încearcă valori până când toate regulile sunt mulțumite. Cine cunoaște programarea cu constrângeri va recunoaște în cheile deschise variabilele problemei; în SOP Lang nu le scriem cu `?`, fiindcă nu sunt parte a unei reguli, ci goluri într-un lucru anume.

**Regula.** O **regulă (rule)** spune: când aceste modele se potrivesc, adaugă acest fir. Exemplul este din diagrame: un nod spre care nu vine nicio săgeată este un nod de început.

```
@p.node  node id=?n
@p.in    link to=?n
@t.start node.start of=$p.node
@r.start core.rule when=$p.node not=$p.in then=$t.start
```

Primele două rânduri sunt modele: „orice nod, numit `?n`” și „orice săgeată care duce la `?n`”. Al treilea este firul care trebuie adăugat: un fir de tipul `node.start` despre acel nod. Al patrulea este regula propriu-zisă, un fir de tipul `core.rule`: când există un nod (`when=$p.node`) și nu există nicio săgeată spre el (`not=$p.in`), adaugă firul de început (`then=$t.start`).

Firul adăugat de o regulă se numește **dedus (derived)**, ca să se deosebească de faptele puse de cineva. Lumea ține minte din ce a fost dedus. Când omul trage o săgeată spre acel nod, temeiul dispare, iar firul dedus este retras singur. Nimeni nu trebuie să scrie program care „ține la zi” începuturile diagramei.

**Interdicția.** O **interdicție (deny)** spune că anumite modele nu au voie să se potrivească împreună. Exemplul este din calendar: un om nu poate fi în două ședințe care se suprapun.

```
@p.m1   meeting people=?p start=?s1 length=?l1
@p.m2   meeting people=?p start=?s2 length=?l2
@c.two  core.check fn=neq args=$p.m1 args=$p.m2
@c.hit  core.check fn=overlaps args=?s1 args=?l1 args=?s2 args=?l2
@d.busy core.deny when=$p.m1 when=$p.m2 if=$c.two if=$c.hit why="?p already has something at that time"
```

Primele două rânduri sunt două modele de ședință. Variabila `?p` apare în amândouă, deci amândouă ședințele au același participant. Al treilea rând este o verificare, un fir de tipul `core.check`: cele două ședințe nu sunt una și aceeași (`fn=neq` înseamnă „nu sunt egale”). Al patrulea este a doua verificare: intervalele lor de timp se suprapun; `overlaps` este o funcție, despre care vorbim imediat. Ultimul rând este interdicția: când se potrivesc cele două modele și amândouă verificările sunt adevărate, schimbarea este refuzată, iar `why=` dă textul din care se compune explicația.

**Tare și slab.** Nu toate regulile sunt la fel de stricte. O constrângere **tare (hard)** nu poate fi încălcată: schimbarea este refuzată. Suprapunerea ședințelor este tare. O constrângere **slabă (soft)**, declarată cu `soft=true`, descrie ce este firesc, nu ce este posibil: schimbarea este primită, dar lumea notează o **problemă (issue)**. „Peștii stau în apă” este slabă. De aceea sistemul pune singur peștii în iaz, dar îi mută pe cer când omul o cere, și tot de aceea poate spune, dacă este întrebat, ce este neobișnuit în desen.

**Funcția.** Unele verificări cer un calcul pe care firele nu îl pot exprima: dacă două intervale de timp au un moment comun, câte cuvinte are un text. Pentru acestea schema cheamă o **funcție (function)**. Biblioteca are câteva funcții generale, cum este `neq`. Un domeniu poate adăuga funcții proprii, scrise ca program obișnuit, cu două condiții: funcția este declarată în schemă, cu nume și cu ce primește, și face numai calculul, fără să schimbe ceva. Acesta este singurul loc în care o regulă a lumii se sprijină pe program, și este un loc declarat și vizibil.

| Domeniu | Funcție proprie, ca exemplu |
|---|---|
| calendar | `overlaps`: două intervale de timp au un moment comun. |
| desen | `covers`: două lucruri se acoperă pe pagină. |
| diagrame | `crossings`: câte săgeți se încrucișează într-o așezare. |
| documente | `words`: câte cuvinte are un text. |

## Lecția 7. Întrebări pe care le pune oricine citește fire

Câteva lucruri trebuie spuse limpede, fiindcă de ele depinde ce înseamnă exact o declarație.

**Ce înseamnă că o valoare lipsește?** Înseamnă că nu este cunoscută. Nu înseamnă „nu” și nu înseamnă „fals”. Dacă ședința nu are sală, nu știm în ce sală este; nu am spus că nu are nevoie de sală. Când vrem să spunem un „nu”, îl scriem explicit.

**Ce face o regulă căreia îi lipsește o valoare?** Nu se potrivește, iar verificarea rămâne nedeterminată pentru acea regulă (lecția 5). Nu presupune nimic în locul valorii.

**Poate un fapt să fie folosit ca model?** Nu. Modelele stau în schemă, iar o regulă poate numi numai modele. Dacă o regulă numește un fir care există ca fapt, lumea refuză să se încarce și spune de ce. Astfel o regulă nu ajunge, din greșeală, să vorbească despre un singur pește.

**Unde este valabilă o variabilă?** Numai în regula sau interdicția în care apare. `?p` din regula despre ședințe nu are nicio legătură cu `?p` din altă regulă.

**Câte valori poate avea o cheie?** Cât spune slotul ei: una singură (locul unui lucru), mai multe fără ordine (participanții unei ședințe) sau mai multe în ordine (părțile unui document).

**Când dispare un fir dedus?** Când nu mai are niciun temei: când nu se mai potrivește nicio regulă care să îl ceară.

---

# Partea a treia. Lumea legendelor

## Lecția 8. De ce este nevoie de un loc comun pentru concepte

Să ne închipuim că desenul, diagramele, documentele și calendarul își scriu fiecare schema fără să se uite una la alta. Desenul are o cheie `at` pentru poziție. Diagrama are și ea `at`. Documentul are `order` pentru locul unei părți în text. Calendarul are `room`. Toate patru răspund, de fapt, la aceeași întrebare: **unde?** Dar programul general nu are de unde să știe aceasta. Pentru el sunt patru chei cu nume diferite. Urmarea este că tot ce ține de „unde” ar trebui scris de patru ori: cum se întreabă când lipsește, cum se înțelege „move it up”, cum se spune în răspuns unde a ajuns lucrul. Și încă o dată pentru fiecare domeniu nou.

Aici a fost greșeala de până acum și de aici au venit peticele: declarațiile erau scrise la nivelul fiecărui domeniu, uneori al fiecărui lucru, așa că fiecare caz nou cerea un rând nou.

Soluția este un singur loc în care stau conceptele generale, cu câte un singur nume fiecare: loc, timp, însușire, cantitate și celelalte. Acest loc este o lume, numită **lumea legendelor (the legend world)**. Numele vine de la legenda unei hărți: bucata care spune ce înseamnă fiecare semn. Lumea legendelor nu conține lucruri (niciun pește, nicio ședință). Conține numai conceptele prin care se descrie orice altă lume.

Legătura se face simplu: fiecare tip de fire și fiecare slot din orice altă lume spune ce concept din lumea legendelor realizează. Cheia `at` a desenului și cheia `room` a calendarului spun amândouă „eu sunt un loc”. Din acel moment, tot ce știe programul general despre locuri li se aplică amândurora, fără niciun rând în plus. Cum se scrie această legătură este în lecția 14.

Conceptele generale sunt puține, tocmai fiindcă sunt foarte abstracte. Le găsim întrebându-ne ce se poate întreba despre orice lucru și despre orice întâmplare, oricare ar fi lumea.

| Întrebarea | Conceptul general care îi răspunde |
|---|---|
| ce este? | lucru și fel |
| care anume? | identitate și trimitere |
| din ce este făcut? | parte și întreg |
| câte? cât? | cantitate |
| cum este? | însușire |
| unde? | loc |
| când? cât timp? | timp |
| al cui? | apartenență |
| ce s-a întâmplat? | schimbare |
| ce se cere să se facă? | act |
| cine? cui? cu ce? de unde? încotro? | roluri ale unui act |
| cum? | mod |
| de ce? pentru ce? | cauză și scop |
| este adevărat? trebuie? de obicei? | felul unei afirmații |
| toate? unele? niciunul? fiecare? | cuprindere |

## Lecția 9. Conceptele, pe rând

Lecția aceasta este un dicționar al conceptelor generale. Fiecare are un exemplu din toate patru domeniile, ca să se vadă că este același concept sub patru înfățișări. Conceptele care cer mai multă explicație au lecția lor, arătată în paranteză.

**Ce există.** Primele concepte privesc lucrurile însele.

| Concept | Ce este |
|---|---|
| lucru (thing) | Orice despre care se poate vorbi și care poate fi arătat cu degetul: un pește desenat, un nod, un paragraf, o ședință. |
| fel (kind) | Ce este un lucru: pește, nod, scrisoare, ședință. Felurile sunt așezate într-un singur arbore, de la general la particular: o rață este o pasăre, un romb este o formă, o scrisoare este un text, o ședință este un eveniment (lecția 16). |
| parte și întreg (part, whole) | Un lucru făcut din alte lucruri: un iaz cu pești și stuf; o diagramă cu noduri și săgeți; o scrisoare cu formulă de început, cuprins și încheiere; o zi cu ședințele ei. |
| grup și ordine (collection, sequence) | Mai multe lucruri luate împreună, cu sau fără ordine: copacii unei păduri; pașii unui flux; capitolele unui raport; ședințele unei săptămâni. |
| nume (name) | Cum este numit un lucru: eticheta unui nod, titlul unui document, numele unei ședințe. Tot aici intră cuvintele limbii prin care sunt numite felurile. |

**Cum este un lucru.**

| Concept | Ce este |
|---|---|
| însușire (quality) | O proprietate a unui lucru: culoarea unui pește, forma unui nod, tonul unei scrisori, durata unei ședințe. Valoarea unei însușiri nu este un cuvânt dintr-o listă, ci un punct într-un spațiu (lecția 10). |
| cantitate (quantity) | Un număr, cu sau fără unitate de măsură: trei pești, șase noduri, 200 de cuvinte, o oră. |
| stare (state) | Toate valorile însușirilor și legăturilor unui lucru la un moment dat. Starea paginii este tot ce este desenat pe ea acum. |

**Cum se leagă lucrurile între ele.**

| Concept | Ce este |
|---|---|
| relație (relation) | Ceva adevărat despre două lucruri luate împreună: o săgeată între două noduri, un pește în iaz, o ședință într-o sală. |
| loc (place) | Unde este un lucru: pe pagină, în diagramă, în document (după a doua secțiune), într-o sală (lecția 13). |
| timp (time) | Când și cât: ora și durata unei ședințe; ordinea pașilor unui flux (lecția 13). |
| apartenență (belonging) | Al cui este un lucru: calendarul Anei; participanții unei ședințe. |
| asemănare (likeness) | Cât de apropiate sunt două valori sau două lucruri. Se calculează, nu se scrie de mână (lecția 10). |
| dependență (dependence) | Un lucru are nevoie de altul: un pas al unui flux urmează altuia; o săgeată are nevoie de cele două noduri ale ei. |

**Ce se întâmplă.**

| Concept | Ce este |
|---|---|
| schimbare (change) | Trecerea de la o stare la alta. Există numai patru schimbări de bază (lecția 12). |
| act (act) | O schimbare cerută de cineva: a face, a șterge, a muta. Fiecare act este definit o singură dată, pentru toate domeniile (lecția 12). |
| rol (role) | Partea pe care o joacă un lucru într-un act. În „move the duck to the lake”, rața este lucrul asupra căruia se lucrează, iar lacul este ținta. |
| mod (manner) | Cum se face actul: „neatly”, „at random”, „formally”. |
| cauză și scop (cause, purpose) | De ce și pentru ce: o ședință „for the budget”, o scrisoare „to complain”. |

**Ce se știe și ce se vrea.**

| Concept | Ce este |
|---|---|
| afirmație (statement) | Ceva spus despre lucruri. Afirmațiile sunt de mai multe feluri, iar sistemul le tratează diferit: un fapt („există un pește”), o normă („o scrisoare are semnătură”), o valoare obișnuită („o ședință ține de obicei o oră”), o preferință, o cerință a omului, o presupunere a sistemului (lecțiile 15 și 24). |
| siguranță și sursă (certainty, source) | Cât de sigură este o afirmație și de unde vine. |
| negație și cuprindere (negation, scope) | „Nu”; și despre câte lucruri se vorbește: toate, unele, niciunul, fiecare. |
| condiție și limită (condition, limit) | Când este valabilă o afirmație și între ce margini. |
| întrebare și răspuns (question, answer) | Ce nu se știe și se cere; ce se dă înapoi. |

**Cine face și cu ce.**

| Concept | Ce este |
|---|---|
| cel care acționează (agent) | Omul, sistemul, un participant la o ședință. |
| capabilitate (capability) | Ce acte poate îndeplini un domeniu și asupra a ce (lecția 19). |
| unealtă (tool) | Bucata de program cu care se îndeplinește un act (lecția 19). |
| resursă (resource) | Ceva care se ocupă și se poate termina: spațiul paginii, o sală, timpul unui om. |

## Lecția 10. Spațiile conceptuale: o valoare este un punct, nu o etichetă

De această lecție depinde cel mai mult generalizarea, așa că pornim de la problema pe care o rezolvă.

Felul la îndemână de a declara culoarea unui pește este o listă: culoarea poate fi `red`, `blue`, `green`, `yellow`. Pare firesc și este greșit, din trei motive care se văd imediat în folosire. Omul spune „turquoise”, care nu este în listă, și sistemul nu știe ce să facă. Omul spune „darker”, iar într-o listă de cuvinte „mai închis” nu are niciun înțeles. Și fiecare domeniu ajunge să aibă lista lui, puțin diferită de a celorlalte. O listă de cuvinte este rigidă tocmai acolo unde limba este elastică.

Ieșirea este să nu mai tratăm valoarea ca pe un cuvânt. **Valoarea unei însușiri este un punct într-un spațiu, iar cuvintele sunt nume date unor zone ale acelui spațiu.** Spațiul se numește **spațiu conceptual (conceptual space)**.

**Spațiile cu axe.** Cele mai multe însușiri se pot măsura. Spațiul lor are una sau mai multe **axe (axes)**, iar pe fiecare axă valoarea este un număr. Culoarea are trei axe: nuanța, cât de vie este și cât de luminoasă. O culoare anume este un punct, adică trei numere.

| Însușirea | Axele spațiului ei |
|---|---|
| mărime | O axă: de câte ori mai mare sau mai mic decât obișnuit. |
| culoare | Trei axe: nuanță, saturație, luminozitate. |
| formă (a unui nod, a unui lucru desenat) | Câteva axe: număr de laturi, rotunjime, alungire. |
| poziție pe pagină sau în diagramă | Două axe: orizontală și verticală. |
| timp | O axă: momentul. Durata este o lungime pe această axă. |
| lungimea unui text | O axă: numărul de cuvinte. |
| tonul unui text | Câteva axe: formalitate, căldură, fermitate. |

Un spațiu și axele lui se declară o singură dată, în lumea legendelor, tot prin fire.

```
@sp.colour w.legend.space name=colour
@ax.hue    w.legend.axis  of=colour name=hue        kind=angle
@ax.sat    w.legend.axis  of=colour name=saturation min=0 max=1
@ax.light  w.legend.axis  of=colour name=lightness  min=0 max=1
```

Primul rând declară spațiul numit `colour`. Următoarele trei îi declară axele: nuanța, care este un unghi pe cercul culorilor, apoi saturația și luminozitatea, fiecare între 0 și 1. Spațiul formelor se declară la fel, cu axele `sides`, `roundness` și `elongation`.

**Cuvintele sunt regiuni.** Unde sunt atunci „roșu”, „oval”, „formal”? Un astfel de cuvânt numește o **regiune (region)** a spațiului: o zonă cu un **centru**, care este exemplul cel mai tipic (roșul cel mai roșu), și cu o întindere în jurul lui. Un punct apropiat de centru este limpede roșu; unul de la margine este roșu „cam portocaliu”. Regiunile nu stau în lumea legendelor, ci în bazele de cunoaștere, fiindcă sunt conținut, nu concept: sunt multe și pot fi adăugate oricând.

```
@rg.red     w.legend.region of=colour name=red     centre.hue=0 centre.saturation=0.9 centre.lightness=0.5 spread=0.12
@rg.ellipse w.legend.region of=shape  name=ellipse centre.sides=0 centre.roundness=1 centre.elongation=1.6
@rg.circle  w.legend.region of=shape  name=circle  centre.sides=0 centre.roundness=1 centre.elongation=1 inside=ellipse
```

Primul rând spune: în spațiul culorilor există o regiune numită `red`; centrul ei are nuanța 0, saturația 0,9 și luminozitatea 0,5; `spread` spune cât de departe de centru mai este încă roșu. Al treilea rând spune că cercul este o regiune a spațiului formelor aflată în interiorul regiunii elipsei (`inside=ellipse`): un cerc este o elipsă care nu este alungită deloc.

**Ce câștigăm.** Odată ce valorile sunt puncte, o mulțime de lucruri care altfel ar trebui scrise caz cu caz se obțin prin calcul, la fel pentru orice spațiu. Acesta este rostul întregii construcții.

| Calculul | Ce rezolvă, în domeniile noastre |
|---|---|
| distanța dintre două puncte | Cât de apropiate sunt două culori, două forme, două ore. |
| cel mai apropiat punct posibil | Omul cere „oval” într-o diagramă care are numai opt forme: se alege elipsa, cea mai apropiată. Omul cere ora zece și jumătate, care este ocupată: se propune cea mai apropiată oră liberă. |
| dacă un punct este într-o regiune | Dacă un nod este „round”; dacă o ședință este „in the morning”. Așa se găsește „the red fish”. |
| un pas pe o axă | „Darker”, „bigger”, „rounder”, „later”, „longer”, „more formal”. Toate sunt același lucru: un pas pe axa potrivită, pornind de la valoarea de acum. |
| un punct între alte două | O culoare între două culori; o oră între două ședințe. |
| o regiune în alta | Un cerc este o elipsă; „navy” este un fel de „blue”; dimineața este o parte a zilei. |

**Spațiile care nu au axe.** Unele concepte nu se pot măsura cu numere: ce este o scrisoare, ce este o diagramă de flux, ce este un iaz ca scenă desenată. Și acestea nu sunt etichete. Fiecare este descris de un **graf de relații și constrângeri**: din ce părți este făcut, în ce ordine stau ele, care sunt obligatorii.

| Conceptul | Graful lui |
|---|---|
| scrisoare | Formulă de început, introducere, cuprins, încheiere, semnătură, în această ordine. Formula de început și semnătura sunt obligatorii. |
| raport | Titlu, introducere, secțiuni, concluzie. Concluzia este obligatorie. |
| diagramă de flux | Noduri legate într-o singură direcție, cu un început, un sfârșit și, eventual, ramificări. |
| grafic cu bare | Un fel de diagramă: bare a căror înălțime este o cantitate, așezate pe o axă, cu etichete. |
| iaz (ca scenă) | Apă; în ea, pești și nuferi; pe margine, stuf. |

Și aici se poate calcula apropierea: două concepte sunt cu atât mai apropiate cu cât grafurile lor au mai multe părți și legături în comun. De aici vine răspunsul la „cu ce seamănă cel mai mult ce am cerut”. Dacă omul cere un „memo” și cunoașterea nu are un graf pentru el, cel mai apropiat este o scrisoare scurtă, iar sistemul face aceea și spune că a făcut-o.

**Excepțiile.** Câteva lucruri rămân liste închise, fiindcă țin de un sistem formal care chiar are numai câteva valori: persoana și timpul unui verb, da sau nu. Acestea sunt excepții declarate și fiecare are motivul scris lângă ea.

## Lecția 11. Cuvintele de grad: „mare” nu are un înțeles fix

În lecția 10, „red” a devenit o regiune cu un centru fix. Cu „big” nu se poate face la fel. Un pește mare și o casă mare nu au aceeași mărime. Un pește mare într-un iaz cu pești mici nu este cât unul mare într-un iaz cu pești mari. Iar ce i se pare mare unui om poate fi potrivit pentru altul. Cuvinte ca „big”, „small”, „huge”, „short”, „long”, „many”, „late” se numesc **cuvinte de grad (degree words)** și sunt subiective prin natura lor.

De aici decurg două lucruri. Întâi, un cuvânt de grad nu este valoarea unei însușiri. În firul peștelui, mărimea este un număr; „big” nu apare nicăieri în stare. Apoi, înțelesul lui nu poate fi scris o dată pentru totdeauna: trebuie calculat de fiecare dată, din situația de față.

Calculul are doi pași. Întâi se află **față de ce** se compară; aceasta se numește **clasa de comparație (comparison class)**. Apoi cuvântul spune **în ce direcție și cât** față de ea. Clasa de comparație se ia din patru surse, în ordinea de mai jos; prima care are ceva de spus hotărăște.

| Sursa | Ce spune |
|---|---|
| lucrurile de același fel care există acum | „A big fish” într-un iaz cu doi pești: mai mare decât ei. „A long meeting” într-o săptămână cu ședințe de o jumătate de oră: o oră. |
| ce a făcut omul până acum | Dacă a cerut de două ori „shorter” la scrisori, atunci „short” înseamnă, pentru el, mai scurt decât pentru altcineva. |
| ce este obișnuit pentru acel fel de lucru, în acest fel de lume | Mărimea obișnuită a unui copac într-un desen; lungimea obișnuită a unei scrisori; numărul obișnuit de pași ai unui flux. Vine din cunoaștere și se îndreaptă cu timpul, din folosire. |
| cât loc este | Pagina, diagrama, ziua. Un lucru „huge” nu poate fi mai mare decât pagina. |

Cuvântul de grad însuși este declarat o singură dată, ca direcție și factor.

```
@dg.big   w.legend.degree word=big   direction=up   factor=1.6
@dg.huge  w.legend.degree word=huge  direction=up   factor=2.5
@dg.small w.legend.degree word=small direction=down factor=0.6
```

Primul rând spune: „big” înseamnă în sus pe axă, cam de 1,6 ori față de clasa de comparație. Dacă peștii din iaz au mărimea 1, un pește „big” primește 1,6, iar unul „huge”, 2,5. Rezultatul este întotdeauna un număr, iar numărul este cel care ajunge în firul peștelui.

Factorii sunt numai puncte de pornire. Dacă omul scrie „bigger” imediat după ce a primit un pește „big”, înseamnă că 1,6 a fost prea puțin pentru el, în acest fel de lume. Factorul este mutat, pentru desene, și data viitoare „big” va însemna mai mult. Aceasta este învățarea de care este nevoie aici: nu se învață cuvinte noi, se îndreaptă numere.

Comparativele („bigger”, „shorter”, „later”) sunt mai simple: nu au nevoie de clasă de comparație, fiindcă se compară cu valoarea pe care lucrul o are acum. Sunt un pas pe axă, cum s-a spus în lecția 10.

## Lecția 12. Schimbări și acte

Până aici am descris cum este o lume. Acum trebuie să descriem ce i se poate întâmpla, fiindcă omul cere tocmai schimbări. Dacă am lăsa fiecare domeniu să își descrie singur operațiile, am avea „add fish”, „add node”, „add paragraph”, „add meeting”, fiecare cu regulile, întrebările și răspunsurile ei. Mergem deci, din nou, la general.

**Patru schimbări de bază.** Orice i se poate întâmpla unei lumi este una dintre următoarele patru schimbări sau o înșiruire a lor. Nu există a cincea.

| Schimbarea | Ce este, în cele patru domenii |
|---|---|
| apariție (appear) | Un lucru care nu exista există: se desenează un pește; se adaugă un nod; se scrie un paragraf; se pune o ședință. |
| dispariție (disappear) | Un lucru care exista nu mai există: se șterge un pește, un nod, un paragraf, o ședință. |
| schimbarea unei însușiri (quality change) | Lucrul rămâne, dar o valoare a lui este alta: peștele devine roșu; nodul devine romb; scrisoarea devine mai formală; ședința devine mai lungă. |
| schimbarea unei relații (relation change) | Lucrul rămâne, dar legătura lui cu alt lucru este alta: peștele ajunge în alt loc; săgeata pleacă din alt nod; paragraful urcă înaintea altuia; ședința se mută vineri. |

**Actul.** Un **act (act)** este o schimbare cerută de cineva. Fiecare act este definit o singură dată, în lumea legendelor, și definiția spune patru lucruri: ce schimbare de bază este, ce roluri are, ce trebuie să fie adevărat înainte și ce trebuie să fie adevărat după.

```
@act.make   w.legend.act name=make   change=appear    role=result  after="result exists"
@act.remove w.legend.act name=remove change=disappear role=object  before="object exists" after="object does not exist"
@act.change w.legend.act name=change change=quality   role=object  role=quality before="object exists"
@act.place  w.legend.act name=place  change=relation  role=object  role=goal    before="object exists" after="object is at goal"
```

Ultimul rând, de exemplu, se citește așa. Actul se numește `place`, adică „a așeza”. Este o schimbare de relație. Are două roluri: `object`, lucrul care este așezat, și `goal`, locul unde ajunge. Înainte de act, lucrul trebuie să existe. După act, lucrul trebuie să fie la țintă.

Aceste patru rânduri sunt tot ce se scrie despre acte. Din ele decurg trei lucruri, fără niciun alt rând.

**Întâi, actele compuse.** Omul cere adesea ceva care nu este un singur act. Sistemul îl descompune folosind condițiile „înainte”.

| Omul spune | Cum se descompune |
|---|---|
| „put a child on the swing”, când pe pagină nu este niciun copil | „A așeza” cere ca lucrul să existe. Copilul nu există. Deci întâi „fă un copil”, apoi „așază-l pe leagăn”. |
| „replace the circle with a diamond” | „Șterge” cercul și „fă” un romb în același loc, cu aceleași săgeți. |
| „copy the first paragraph to the end” | „Fă” un paragraf cu aceleași însușiri, în alt loc. |
| „move the meeting to Friday and make it shorter” | O schimbare de relație și una de însușire, anulate împreună dacă omul se răzgândește. |

**Apoi, verificarea de după execuție.** Condiția „după” este ce trebuie să se vadă în stare când actul s-a încheiat. După „a face”, lucrul trebuie să existe; după „a așeza”, lucrul trebuie să fie la țintă. Sistemul citește starea și verifică. Dacă nu este așa, răspunsul nu are voie să spună „am făcut”. Aceasta este apărarea împotriva răspunsurilor care pretind că s-a făcut ceva când nu s-a făcut nimic.

**În sfârșit, cuvintele.** „Draw”, „add”, „create”, „write”, „schedule” sunt cuvinte diferite pentru același act, „a face”. Ele sunt nume ale actului și stau în lumea limbii, nu în domenii. Desenul nu trebuie să știe că „draw” înseamnă „a face”.

## Lecția 13. Locul și timpul

Locul și timpul apar în aproape orice cerere, de aceea au lecția lor. Ideea este aceeași ca până acum: se spune o dată ce forme poate lua un loc, iar fiecare domeniu spune numai care este spațiul lui.

**Locul.** Oricare ar fi domeniul, un loc poate fi spus în patru feluri.

| Felul | Ce este |
|---|---|
| poziție | Un punct anume: coordonate pe pagină; al treilea loc în ordinea unui document. |
| regiune | O parte a spațiului, cu nume: sus, jos, stânga, dreapta, centru, margine, colț; începutul, mijlocul, sfârșitul unui text. |
| relație cu alt lucru | Pe, în, lângă, deasupra, sub, între, înainte de, după. Fiecare are o definiție prin numere: „lângă” înseamnă o distanță mică; „deasupra” înseamnă mai sus pe axa verticală; „după” înseamnă mai departe pe axa ordinii. |
| direcție și distanță | Un pas pornind de unde este lucrul acum: în sus, la stânga, mai aproape, mai jos în text. |

Un domeniu își leagă locurile proprii de acestea. În desen, cerul este regiunea de sus a paginii. Apa unui iaz, în schimb, nu este o regiune a paginii, ci un lucru desenat: „on the water” este relația „pe” cu acel lucru. De aici decurge o regulă importantă: „over water” nu devine niciodată „pe mare” dacă pe pagină nu este nicio mare; relația se leagă de apa care există. În diagramă, „at the top” este regiunea de sus, iar „between Start and Bake” este o relație cu două noduri. În document, „after the introduction” este o relație de ordine cu o parte a textului.

**Timpul.** Timpul are aceleași forme, pe o singură axă: un moment („at ten thirty”), un interval („from ten to eleven”), o durată („for an hour”), o ordine („before lunch”), o repetare („every Monday”). „In the afternoon” este o regiune pe axa orelor, la fel cum „red” este o regiune în spațiul culorilor. „Later” este un pas pe axă. Faptul că două ședințe se suprapun este o relație calculată din momentele și duratele lor.

## Lecția 14. Cum se leagă o lume de lumea legendelor

Am spus în lecția 8 că fiecare tip de fire și fiecare slot arată spre un concept. Acum vedem cum se scrie aceasta și, mai ales, ce primește un domeniu în schimb.

Se folosesc două chei. Pe firul care declară un tip, cheia `is=` spune ce concept este acel tip. Pe firul care declară un slot, cheia `means=` spune ce concept realizează cheia, iar o a doua pereche precizează: pentru o însușire, în ce spațiu este valoarea (`space=`); pentru un loc dat printr-o relație, ce relație (`relation=`); pentru un rol, ce rol (`role=`). Un slot care nu spune ce înseamnă este refuzat la verificarea schemei, fiindcă programul general nu ar ști ce să facă cu el.

Iată cele patru domenii, fiecare cu câteva sloturi.

Desenul:

```
@t.drawn       core.type of=drawn extends=std.schema.thing is=thing
@s.drawn.at    core.slot of=drawn key=at     kind=point  means=place   space=page
@s.drawn.in    core.slot of=drawn key=in     type=drawn  means=place   relation=in
@s.drawn.size  core.slot of=drawn key=size   kind=number means=quality space=size
@s.drawn.col   core.slot of=drawn key=colour kind=point  means=quality space=colour
```

Un lucru desenat este un lucru. Cheia `at` este un loc, ca poziție pe pagină. Cheia `in` este tot un loc, dat prin relația „în” cu alt lucru desenat. Cheile `size` și `colour` sunt însușiri, fiecare în spațiul ei.

Diagrama:

```
@t.node        core.type of=node extends=std.schema.thing is=thing
@t.link        core.type of=link extends=std.schema.thing is=relation
@s.node.label  core.slot of=node key=label kind=string means=name
@s.node.shape  core.slot of=node key=shape kind=point  means=quality space=shape
@s.node.at     core.slot of=node key=at    kind=point  means=place   space=page
@s.link.from   core.slot of=link key=from  type=node   means=role    role=source
@s.link.to     core.slot of=link key=to    type=node   means=role    role=goal
```

Un nod este un lucru; o săgeată este o relație între două noduri. Eticheta nodului este numele lui. Capetele săgeții sunt două roluri: de unde pleacă și unde ajunge.

Documentul:

```
@t.text        core.type of=text    extends=std.schema.thing is=whole
@t.section     core.type of=section extends=std.schema.thing is=part
@s.text.tone   core.slot of=text    key=tone   kind=point  means=quality  space=tone
@s.sec.of      core.slot of=section key=of     type=text   means=part
@s.sec.order   core.slot of=section key=order  kind=number means=place    space=order
@s.sec.length  core.slot of=section key=length kind=number means=quantity unit=word
```

Un text este un întreg, iar secțiunile sunt părțile lui. Tonul este o însușire. Ordinea unei secțiuni este locul ei în text. Lungimea este o cantitate, măsurată în cuvinte.

Calendarul:

```
@t.meeting     core.type of=meeting extends=std.schema.thing is=thing
@s.meet.start  core.slot of=meeting key=start  kind=number   means=time  part=start
@s.meet.length core.slot of=meeting key=length kind=number   means=time  part=duration
@s.meet.room   core.slot of=meeting key=room   type=room     means=place relation=in
@s.meet.people core.slot of=meeting key=people type=w.person means=role  role=participant many=true
```

O ședință este un lucru. Ora de început și durata sunt cele două părți ale timpului ei. Sala este locul ei, prin relația „în”. Oamenii sunt participanții, iar cheia poate ține mai mulți.

Ce trebuie observat este **ce lipsește** din aceste declarații. Niciun slot nu are o întrebare de pus omului, o propoziție de răspuns sau o listă de valori permise. Toate acestea sunt purtate de concept și vin de la sine. Tabelul de mai jos arată ce primesc, deodată, cheia `at` a desenului, cheia `at` a diagramei, cheia `order` a documentului și cheia `room` a calendarului, numai fiindcă au spus `means=place`.

| Ce se primește | Cum arată în cele patru domenii |
|---|---|
| întrebarea, când valoarea lipsește | „Where?”, făcută mai precisă de tipul valorii: „In which room?” |
| înțelegerea unui loc spus singur | „in the sky”, „at the top”, „after the introduction”, „in the big room” sunt înțelese ca loc și completează sau corectează cererea dinainte. |
| găsirea unui lucru după loc | „the fish in the pond”, „the node under Start”, „the paragraph after the greeting”, „the meeting in room 2”. |
| mutarea | „move it up”, „move it left”, „move it earlier in the text”. |
| răspunsul | Propoziția de răspuns spune locul în același fel peste tot. |

La fel, un slot care spune `means=quality` și un spațiu primește comparativele („bigger”, „rounder”, „more formal”), superlativele („the biggest one”), comparația cu alt lucru („as big as the house”), cuvintele de grad, alegerea celei mai apropiate valori pe care o poate face unealta și întrebarea („How big?”). Un slot care spune `means=time` primește „later”, „earlier”, „longer”, „the next one”, „on Friday”.

Acesta este câștigul lumii legendelor, spus într-o propoziție: un domeniu nou scrie câteva rânduri despre ce are el și primește tot ce s-a construit deja pentru conceptele de care se leagă.

---

# Partea a patra. Tipare, cunoaștere, instanțe

## Lecția 15. Trei feluri de lumi, după ce țin în ele

Până acum am spus „lume” pentru orice mulțime de fire verificate. În practică, lumile se împart în trei feluri, după ce conțin și cât de des se schimbă. Împărțirea contează fiindcă cele trei sunt scrise de oameni diferiți, la momente diferite, și sunt refolosite diferit.

Primul fel este **tiparul de lume (world pattern)**. Un tipar este numai schemă: spune ce tipuri de fire există într-un fel de lume, ce sloturi au și ce reguli se aplică. Nu conține niciun lucru anume. Avem patru: tiparul desenului, al diagramei, al documentului și al calendarului. Un tipar se scrie o dată și se schimbă rar. Lumea legendelor este și ea un tipar, cel mai general dintre toate.

Al doilea fel este **baza de cunoaștere (knowledge base)**. Ea ține ce se știe în general și nu depinde de nicio pagină anume: că o rață este o pasăre, unde este regiunea „red” în spațiul culorilor, din ce părți este făcută o scrisoare, cât ține de obicei o ședință. Bazele de cunoaștere sunt mari, cresc mereu și sunt folosite de toate domeniile deodată.

Al treilea fel este **instanța de lume (world instance)**. Ea ține starea unui lucru anume, acum: această pagină desenată, această diagramă, această scrisoare, această săptămână din calendar. Se schimbă la fiecare mesaj al omului. O instanță folosește un tipar, care îi spune ce fapte are voie să conțină, și se sprijină pe bazele de cunoaștere.

> **Numele vechi.** În programul și documentele mai vechi, cele trei se numesc *schema lumii* (world schema), *lume de cunoaștere* (knowledge world) și *lume vie* (live world).

**Felurile de cunoaștere.** Nu tot ce stă într-o bază de cunoaștere are aceeași greutate, iar sistemul trebuie să știe ce are în față. „Peștii trăiesc în apă” și „o ședință ține de obicei o oră” nu se folosesc la fel: prima poate opri o greșeală, a doua doar umple un gol. De aceea fiecare rând al unei baze de cunoaștere își declară felul.

| Felul | Ce este și la ce folosește |
|---|---|
| fapt de domeniu | Ceva adevărat despre lume: „Peștele trăiește în apă.” Pe el se poate sprijini o constrângere. |
| normă | Cum trebuie să fie ceva ca să fie corect: „O scrisoare se încheie cu o semnătură.” „Un flux are un singur început.” Se verifică. |
| valoare obișnuită | Cum este ceva de obicei: „Un flux are în jur de șapte pași.” „O ședință ține o oră.” Completează numai ce omul nu a spus. |
| euristică | O regulă de bună alegere, valabilă într-un context: „Un lucru mic stă bine într-un colț.” „Ședințele scurte se pun dimineața.” Ajută la alegerea între variante la fel de permise. |

Tiparele și bazele de cunoaștere publicate în depozitul comun sunt **standardizate**: au nume fix, schemă verificată și licență. O bază de cunoaștere nu pomenește niciodată domeniile unei aplicații; ea nu știe că există un „desen”. Legătura se face în sens invers: domeniul spune ce cunoaștere folosește.

## Lecția 16. Un singur arbore al felurilor și ce se moștenește pe el

Omul poate cere să fie desenat orice: o rață, un bunic, un leagăn. Nu putem scrie câte un rând pentru fiecare lucru care poate fi cerut. Dar nici nu este nevoie, dacă știm cum se leagă felurile între ele.

Toate felurile de lucruri stau într-un singur arbore, în cunoaștere, de la general la particular: o rață este o pasăre, o pasăre este un animal; un bunic este un bărbat, un bărbat este un om; un romb este o formă cu patru laturi; o scrisoare este un text; un grafic cu bare este o diagramă. Arborele este unul singur pentru toate domeniile.

Pe acest arbore se moștenesc patru lucruri, de sus în jos. Datorită lor, un fel nou adăugat în arbore funcționează imediat, fără alt rând.

| Ce se moștenește | Ce înseamnă |
|---|---|
| ce se poate face | Ce se poate face cu orice lucru desenat (a-l face, a-l muta, a-l colora, a-l șterge) se poate face cu o rață. Ce se poate face cu o diagramă se poate face cu un grafic. |
| cum este realizat | Dacă desenul nu are o imagine pentru rață, o folosește pe a păsării; pentru „grandfather”, pe a bărbatului. Lucrul rămâne însă o rață: „the duck” îl găsește mai târziu, iar culoarea cerută i se aplică. Omului i se spune o dată ce imagine a fost folosită. |
| ce este obișnuit | Ce este obișnuit pentru orice text este valabil și pentru o scrisoare; scrisoarea declară numai ce are ea diferit, adică părțile ei. Ce este obișnuit pentru orice scenă desenată este valabil pentru un iaz. |
| cuvintele | „Bird” găsește și rațele; „shape” găsește și romburile. |

Cuvântul **realizare** din al doilea rând va reveni: înseamnă felul concret în care un domeniu face un lucru, de exemplu imaginea cu care desenul arată o rață sau forma cu care diagrama arată un început.

Din aceeași cunoaștere vin și părțile lucrurilor: o față are ochi și gură; o pădure are copaci; o scrisoare are formulă de început. Un domeniu nu le scrie din nou.

## Lecția 17. Cum se compun lumile

O lume nu se scrie de la zero. Ea ia ce există deja și adaugă ce are propriu. Sunt trei operații.

**Importul.** O lume încarcă un tipar sau o bază de cunoaștere publicată, la o versiune anume. Versiunea este fixată pentru ca o schimbare făcută de altcineva să nu ne strice lumea pe neștiute.

**Extinderea.** O lume poate specializa ce a importat. Poate adăuga un tip nou de fire, care extinde unul importat. Sau poate **restrânge** un slot moștenit: diagrama poate spune că forma unui nod stă numai într-o parte a spațiului formelor. O restrângere este permisă, fiindcă tot ce este adevărat în general rămâne adevărat. Ce nu este permis sunt două declarații care se contrazic; acesta este un **conflict**, iar lumea îl spune la încărcare, nu mai târziu, când ar fi greu de găsit.

**Legarea.** Un slot al unei lumi poate ține un lucru din altă lume. Calendarul este exemplul: importă tiparul persoanelor, iar cheia `people` a unei ședințe ține referințe la persoane. Legarea se face întotdeauna de un lucru anume, cu identitatea lui, nu de un nume. Dacă omul spune „Ana” și există două persoane cu acest nume, numele dă doi candidați, iar sistemul întreabă care.

Domeniile aplicației se pot compune între ele prin aceleași operații. O diagramă poate arăta ședințele unei săptămâni; un document poate cuprinde un desen; un grafic poate arăta câte ședințe are fiecare om. În fiecare caz, un slot al unei lumi ține un lucru din cealaltă. O regulă care are nevoie de amândouă lumile stă în lumea care le încarcă pe amândouă.

## Lecția 18. La ce folosește o lume și fără conversație

Înainte de a trece la conversație, merită văzut că modelul general este util și singur. Trei exemple, câte unul pentru trei dintre domenii.

**Verificarea unui document.** Cunoașterea are graful raportului: titlu, introducere, secțiuni, concluzie, cu concluzia obligatorie. Un document este încărcat ca fapte, câte un fir pentru fiecare parte. Lumea răspunde la trei întrebări: ce lipsește (concluzia), ce este încălcat și ce nu a putut verifica. Poate spune și cu ce gen seamănă cel mai mult documentul, comparând grafurile.

**Găsirea unui orar.** Avem săli, oameni și ședințe care trebuie puse într-o săptămână. Ora și sala fiecărei ședințe sunt chei deschise (lecția 5). Nu pot fi completate una câte una, fiindcă depind una de alta: dacă pun prima ședință luni la zece, a doua nu mai poate fi acolo. Pentru asemenea situații există un **rezolvitor (solver)**: un program de căutare care încearcă valori pentru toate cheile deschise deodată, până găsește o așezare în care nicio interdicție nu este încălcată și cât mai multe preferințe sunt îndeplinite. Rezolvitorul nu știe nimic despre calendare; lucrează cu orice lume care are chei deschise și reguli.

**Verificarea unei diagrame.** Normele unui flux spun că are un singur început și că la fiecare nod se poate ajunge. Lumea deduce începuturile (regula din lecția 6) și spune ce nod a rămas nelegat.

---

# Partea a cincea. Conversația

Partea aceasta explică al doilea nivel: cum ajunge o propoziție a omului să schimbe ceva și cum se compune răspunsul. Tot ce urmează folosește numai piesele din părțile dinainte.

## Lecția 19. Cum este legat un domeniu de programul lui

O lume, oricât de bine descrisă, nu desenează nimic. Undeva trebuie să existe program care pune efectiv un pește pe ecran. Întrebarea este cum ținem acest program cât mai mic și cum îl legăm de lume fără să scriem, din nou, program pentru fiecare propoziție. Răspunsul are patru piese.

Un **domeniu de capabilități (capability domain)** este o parte a aplicației care poate face lucruri reale: desenul, diagramele, documentele, calendarul. Fiecare are instanța lui de lume, uneltele lui și un fel de a-și citi starea.

O **unealtă (tool)** este o operație de program, cât se poate de simplă, care face un singur lucru: pune o imagine la o poziție, mută un lucru, schimbă o valoare, șterge. Primește numai numere și referințe. Nu vede niciodată propoziția omului și nu știe ce înseamnă „big”.

O **capabilitate (capability)** este o promisiune declarată a domeniului: ce act general poate îndeplini, asupra cărui fel de lucru și de ce roluri ține seama. Desenul promite că poate „face” lucruri desenate și că ține seama de fel, cantitate, însușiri și loc.

O **legătură (binding)** este declarația care unește cele două: spune ce unealtă îndeplinește ce act și din ce rol al cererii vine fiecare parametru al uneltei.

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

Citit pe rând. Primul rând: în lumea desenului, cu lucrurile desenate se pot face patru acte, a face, a așeza, a schimba și a șterge. Al doilea: când face un lucru desenat, desenul ține seama de fel, cantitate, însușiri și loc; dacă omul cere altceva, de exemplu un sunet, domeniul spune cinstit că de aceasta nu ține seama. Al treilea: există o unealtă numită `add`, care realizează actul „a face”. Următoarele patru îi declară parametrii: felul lucrului, poziția pe pagină, mărimea (unealta poate desena numai între 0,3 și 3 ori mărimea obișnuită) și culoarea. Ultimul rând este legătura: actul „a face”, pentru lucruri desenate, se îndeplinește cu unealta `add`.

Două lucruri merită observate. Parametrul nu spune doar ce nume are, ci în ce spațiu este valoarea lui și cât din acel spațiu poate realiza unealta. De aici va ști sistemul, mai târziu, că un pește de zece ori mai mare nu se poate desena și că trebuie să aleagă cea mai apropiată mărime posibilă. Și: efectul uneltei nu este scris nicăieri pe unealtă. Unealta `add` realizează actul „a face”, iar ce trebuie să fie adevărat după „a face” s-a spus o dată, în lecția 12.

**Care domeniu răspunde.** Domeniul care răspunde unei cereri este cel care o poate îndeplini, iar aceasta se află din capabilități, nu din ce este deschis pe ecran. „Schedule a meeting with Ana”, spus în timp ce omul se uită la desen, ajunge la calendar, fiindcă numai calendarul promite că poate face ședințe.

## Lecția 20. Drumul unui mesaj, pe etape

Am văzut drumul în lecția 2, pe un exemplu. Acum îl numim. Fiecare etapă primește ceva și dă ceva mai departe, iar lecțiile următoare iau etapele pe rând.

| Etapa | Ce primește și ce dă |
|---|---|
| 1. Starea | Citește ce există în unelte și îl scrie ca fapte în instanța de lume. |
| 2. Interpretarea | Din propoziție face cererea: ce se vrea, spus în concepte generale (lecția 21). |
| 3. Situarea | Hotărăște ce este mesajul față de dialogul de până acum: cerere nouă, corectare, răspuns la o întrebare (lecția 22). |
| 4. Înțelesul numeric | Din cuvinte face numere și le potrivește cu ce pot face uneltele (lecția 23). |
| 5. Completarea | Pentru ce a rămas nespus propune valori (lecția 24). |
| 6. Descompunerea și raționamentul | Împarte întregul în părți, alege între variante și verifică; iese un plan (lecțiile 25 și 26). |
| 7. Execuția | Pornește uneltele după plan și citește starea din nou (lecția 27). |
| 8. Răspunsul | Din ce s-a schimbat de fapt compune propoziția de răspuns (lecția 28). |

Etapele 5 și 6 se repetă până când planul nu mai are goluri. Limba omului apare numai la capete, în etapele 2 și 8; între ele, totul este fire și numere. De aceea adăugarea unei limbi nu atinge mijlocul.

## Lecția 21. Interpretarea: din propoziție, o cerere

Prima sarcină este să trecem de la cuvinte la ceva cu care programul poate lucra. Acest ceva se numește **cerere (request)** și este o mică lume de fire care spune ce vrea omul.

Lucrul important despre cerere este în ce termeni este scrisă. Nu are chei proprii fiecărui domeniu și nici o listă fixă de câmpuri. Este scrisă în conceptele lumii legendelor: un act, lucrul sau lucrurile despre care este vorba, cu felul lor, și cerințele despre ele, fiecare legată de un concept. De aceea aceeași formă servește toate domeniile.

| Propoziția | Cererea, spusă în cuvinte |
|---|---|
| „draw three big red fish in the pond” | Act: a face. Fel: pește. Cantitate: 3. Mărime: cuvântul de grad „big”. Culoare: regiunea „red”. Loc: relația „în” cu iazul. |
| „make a flowchart of how bread is baked, with no circles” | Act: a face. Fel: diagramă de flux. Subiect: coacerea pâinii. Forma părților: regiunea „circle”, nedorită. |
| „write a short formal letter about a late delivery” | Act: a face. Fel: scrisoare. Lungime: cuvântul de grad „short”. Ton: regiunea „formal”. Subiect: livrarea întârziată. |
| „a long meeting with Ana tomorrow afternoon” | Act: a face. Fel: ședință. Durată: cuvântul de grad „long”. Participant: Ana. Timp: regiunea „afternoon” a zilei de mâine. |

De observat că în această etapă „big” și „red” rămân cuvinte: cererea ține minte că omul a spus „big”. Numărul vine abia în etapa 4, fiindcă depinde de ce este pe pagină.

**Cerințele.** Fiecare lucru pe care omul îl vrea este o **cerință (constraint)** a cererii. Ca să poată fi urmărită până la capăt și pomenită în răspuns, o cerință ține minte mai mult decât valoarea ei. Ține minte despre ce concept este (mărime, loc, culoare); dacă omul o vrea sau nu o vrea („no circles”); despre care lucru din cerere este vorba; dacă privește fiecare lucru în parte sau pe toate la un loc; dacă este o cerință sau doar o preferință („if possible”); și cuvintele din care a fost citită. Toate acestea împreună sunt **identitatea** cerinței. Datorită ei, când omul scrie mai târziu „red, actually”, sistemul știe ce cerință anume se schimbă.

**De ce lucru se leagă fiecare cuvânt.** Partea grea a interpretării nu este recunoașterea cuvintelor, ci legarea lor. Tabelul arată perechi de propoziții în care o mică diferență schimbă înțelesul.

| Propoziția | Ce trebuie hotărât |
|---|---|
| „a big pond with small fish” | Sunt două mărimi și două lucruri: „big” este al iazului, „small” al peștilor. |
| „a report with no pictures in the introduction” | Interdicția privește numai introducerea, nu tot raportul. |
| „two arrows from each box” față de „two arrows” | Câte două la fiecare nod, sau două în total. |
| „do not move all the meetings” față de „do not move any meeting” | „Nu pe toate” față de „pe niciuna”. |
| „put the duck next to the red house” | Roșie este casa, nu rața. |

Aceste legări le face lumea limbii, prin reguli generale de gramatică, nu fiecare domeniu.

**Cum știm că citirea este bună.** Sunt două verificări diferite și niciuna nu o înlocuiește pe cealaltă. Prima se face la fiecare mesaj: cererea este spusă înapoi în cuvinte și citită din nou; dacă iese altă cerere, citirea este nesigură. A doua se face la măsurare: citirea este comparată cu interpretarea corectă, scrisă de un om, pe exemple și mai ales pe perechi ca cele din tabel.

**Ce se face când ceva nu a fost înțeles.** Dacă rămân cuvinte necitite într-un loc care contează, cererea nu se execută; sistemul spune ce nu a înțeles, cu cuvintele omului. A executa jumătate de propoziție și a tăcea despre rest este mai rău decât a refuza. Un cuvânt scris greșit este corectat numai dacă nu este cunoscut de nicio sursă și există un singur candidat limpede; altfel „villa” ar deveni „via”. Limba mesajului este cea pe care omul a ales-o în aplicație.

## Lecția 22. Situarea: ce este acest mesaj față de ce s-a spus înainte

Oamenii nu vorbesc în propoziții întregi. După „draw three fish” urmează „bigger”, „in the sky”, „two more”, „not that one”. Fiecare dintre acestea are sens numai față de ce s-a spus înainte. Etapa aceasta hotărăște ce fel de mesaj a sosit.

Pentru aceasta dialogul ține un **focus**: lucrurile despre care se vorbește acum, lucrurile pe care omul le-a selectat și ultima cerere, cea care mai poate fi corectată.

| Felul mesajului | Cum se recunoaște și ce face |
|---|---|
| cerere nouă | Are un act și un lucru nou: „draw a house”. Pornește un drum nou. |
| reacție | Judecă ce tocmai s-a făcut: „fewer”, „too big”, „another one”, „shorter”, „later”. Schimbă numai ce numește. După „fewer fish”, casa și iazul rămân neatinse. |
| corecție | Dă altă valoare pentru ceva ce omul ceruse deja: „red, actually”, „make that Friday”. |
| fragment | Este o bucată de propoziție care dă o valoare pentru ceva rămas nespus sau pentru ultimul lucru despre care s-a vorbit: „on the lake”, „down”, „two of them”, „with Tom too”, „after the greeting”. |
| răspuns | Vine după o întrebare pusă de sistem și îi răspunde. |
| laudă sau mulțumire | Nu schimbă nimic. |

Fragmentul este locul în care se vede cel mai bine câștigul lumii legendelor. „On the lake” este recunoscut ca loc fiindcă „on” este o relație de loc și „lake” este un fel de lucru; apoi este pus în cerința de loc a cererii dinainte. Nimic din aceasta nu este scris pentru desen.

**Despre care lucru vorbește omul.** Omul numește lucrurile care există în multe feluri, iar sistemul trebuie să găsească lucrul. Găsirea se face tot prin concepte.

| Cum este numit lucrul | Exemple |
|---|---|
| după nume | „the Start box”, „the meeting called Review”. |
| după fel și însușire | „the red fish” este peștele a cărui culoare este cea mai aproape de regiunea „red”; „the round node”; „the long meeting”. |
| după ordine | „the second paragraph”, „the first one”. |
| după o relație | „the house next to the pond”, „the box under Start”, „the meeting before lunch”. |
| printr-un pronume | „it”, „them”: lucrurile din focus. |
| printr-un plural hotărât | „the fish”, „the arrows”: lucrurile selectate, dacă sunt; altfel toate cele de acel fel. |

Dacă se potrivesc mai multe lucruri și omul a vorbit la singular, sistemul nu ghicește. Întreabă și enumeră candidații, mereu în aceeași ordine: „Which house? 1. the red one on the left, 2. the blue one by the pond.”

**Întrebările.** Întrebările pe care le pune sistemul nu sunt scrise de mână pentru fiecare cheie. Fiecare concept are întrebarea lui generală („Where?”, „How big?”, „Which one?”, „When?”, „With whom?”), făcută mai precisă de tipul valorii așteptate. Sistemul pune cel mult o întrebare pe mesaj și numai când nu are nicio presupunere rezonabilă. Întrebarea pusă este ținută minte ca **întrebare deschisă** până vine răspunsul, pentru ca „room 2”, scris de om în mesajul următor, să fie înțeles ca răspuns la ea.

## Lecția 23. Înțelesul numeric și potrivirea cu ce poate unealta

Cererea conține încă cuvinte: „big”, „red”, „afternoon”. Uneltele primesc numai numere. Etapa aceasta face trecerea, în doi pași.

În primul pas, cuvintele de grad și numele de regiuni devin puncte în spațiile lor, așa cum s-a explicat în lecțiile 10 și 11: „red” devine centrul regiunii roșii, iar „big” devine un număr calculat față de peștii de pe pagină.

În al doilea pas, punctul cerut este comparat cu ce poate realiza unealta, lucru declarat pe parametrul ei (lecția 19). Pot apărea patru situații.

| Situația | Ce face sistemul |
|---|---|
| unealta poate realiza chiar punctul cerut | Îl folosește întocmai. Desenul poate picta orice culoare. |
| unealta poate realiza un punct apropiat | Diagrama are numai opt forme; „oval” cade în regiunea elipsei. Se folosește elipsa. Omului i se spune o singură dată, și numai dacă diferența se vede. |
| cel mai apropiat punct posibil este prea departe | „A two-hour meeting” într-o zi cu o singură jumătate de oră liberă. Ședința nu este scurtată pe tăcute; sistemul explică și propune. |
| felul cerut nu are o realizare proprie | „A duck” este desenată cu imaginea păsării. Lucrul rămâne rață; omului i se spune o dată. |

Cât de departe este „prea departe” se declară, și se numește **toleranță (tolerance)**: câtă abatere este primită între ce s-a cerut și ce se poate face.

Regula comună este cea hotărâtă pentru întreaga aplicație: sistemul face cât poate de bine și spune ce a făcut altfel; nu oprește omul cu o întrebare pentru o înlocuire măruntă. Cerința omului nu este înlocuită în cerere. Ea rămâne așa cum a fost spusă, cu transformarea notată lângă ea, pentru ca răspunsul să poată spune adevărul și pentru ca „the duck” să găsească mai târziu rața.

## Lecția 24. Completarea: ce facem cu ce omul nu a spus

Omul spune puțin. „Draw a fish” nu spune unde, cât de mare, ce culoare. Dacă sistemul ar întreba de fiecare dată, nu l-ar folosi nimeni. Dacă ar alege singur și ar tăcea, omul nu ar ști ce a hotărât el și ce a hotărât sistemul. Etapa aceasta rezolvă amândouă părțile: propune valori și ține minte, pentru fiecare, de unde vine.

**Fiecare valoare își cunoaște originea.** Orice valoare din cerere poartă patru informații. **Sursa**: de unde vine, de la om, din cunoaștere, din ce este pe pagină. **Caracterul**: cât de tare ține de ea, lucru explicat imediat. **Contextul**: despre ce lucru este și cât timp rămâne valabilă. **Costul**: cât de nesigură este, dacă a fost presupusă.

Caracterul are trei valori, iar ele hotărăsc ce îi datorează sistemul omului.

| Caracterul | Ce înseamnă |
|---|---|
| cerință | A spus-o omul și trebuie îndeplinită. Dacă nu se poate, sistemul explică sau întreabă; nu o lasă deoparte. „In the sky” pentru pești este o cerință și se îndeplinește, chiar dacă este neobișnuită. |
| preferință | A spus-o omul, dar cu „dacă se poate”: „in the morning if possible”. Se îndeplinește după cerințe, cât se poate. |
| presupunere | A ales-o sistemul. Poate fi schimbată oricând, iar omului i se spune când contează: locul ales pentru pești, ora aleasă pentru ședință. |

Dacă două cerințe ale omului nu pot fi îndeplinite împreună, niciuna nu cedează numai fiindcă este mai veche. „With Ana, on Monday morning”, când Ana lipsește luni: sistemul spune ce anume se bate cap în cap și întreabă.

**De unde vin valorile propuse.** Cheile rămase deschise primesc valori candidate din patru surse, luate în ordine. Întâi, ce a spus omul mai devreme despre același lucru. Apoi, ce au în comun lucrurile pe care omul le-a cerut până acum: dacă toate nodurile cerute de el sunt albastre, următorul este tot albastru. Apoi, ce este obișnuit pentru acel fel de lucru, moștenit pe arborele felurilor (lecția 16). La urmă, dacă nimic nu alege, o valoare variată din zona obișnuită, ca desenele să nu arate toate la fel.

Ce este obișnuit are forma unei regiuni, nu a unei valori fixe. Numărul de pași ai unui flux nu este „șapte”; este o regiune pe axa cantității, cu centrul în jurul lui șapte.

O valoare obișnuită umple numai un gol. Nu are voie să înlocuiască ce a cerut omul. Dacă omul cere un flux despre „how bread is baked” și cunoașterea nu are pașii coacerii pâinii, răspunsul este „I do not know the steps; I can make empty steps, or you can name them”. Nu este un flux despre altceva, cu pași luați de unde s-a nimerit.

**Mai multe lucruri într-o cerere.** Când omul cere mai multe lucruri deodată („a house and a swing”), sistemul verifică dacă sunt independente: nu se bat pe aceeași resursă, nicio regulă nu le leagă și omul nu a spus că le vrea numai împreună. Dacă sunt independente și unul nu se poate face, celelalte se fac, iar omului i se spune ce a rămas nefăcut.

## Lecția 25. Întregul și părțile

Omul cere adesea un lucru mare: un iaz, un flux, o scrisoare. Uneltele fac lucruri mici: o imagine, un nod, un paragraf. Între ele trebuie cineva care să știe din ce este făcut întregul. Acest „cineva” este cunoașterea: graful conceptului (lecția 10) spune din ce părți este făcut un **întreg (whole)** și cum se leagă ele.

| Întregul | Părțile lui |
|---|---|
| un iaz | Apă; pești și nuferi în ea; stuf pe margine. |
| un flux | Câte un nod pentru fiecare pas, legate într-o direcție; începutul și sfârșitul au forma lor. |
| un grafic cu bare | Câte o bară pentru fiecare valoare; înălțimea barei este cantitatea; etichete. |
| o scrisoare | Formulă de început, introducere, cuprins, încheiere, semnătură. |
| o zi de lucru | Ședințele ei, în ordine, fără suprapuneri. |

Cerințele omului trebuie duse la partea potrivită, după cum au fost legate în lecția 21. O cantitate rămâne la felul pe care îl numără: în „two ducks and a swan”, „two” este al rațelor.

Omul cere apoi schimbări ale întregului, cu cuvinte foarte scurte: „fewer”, „connect them”, „make it nicer”. Acestea sunt operații generale asupra oricărui întreg. Ce le face sigure este că fiecare știe ce trebuie păstrat.

| Operația | Ce face și ce păstrează |
|---|---|
| mai puține părți | Scoate părți, dar păstrează părțile obligatorii și legăturile dintre cele rămase. Un flux scurtat rămâne legat de la început la sfârșit; o scrisoare scurtată își păstrează formula de început și semnătura. |
| mai multe părți | Adaugă numai părți pe care graful conceptului le permite. |
| nu toate la fel | Schimbă o însușire la unele părți, numai în regiunile permise. |
| leagă tot | Adaugă numai legături care au sens în tiparul lumii. |
| așază mai bine | Mută părțile spre locurile pe care cunoașterea le socotește potrivite: apa jos, cerul sus, rața pe apă; nodurile așezate astfel încât săgețile să se încrucișeze cât mai puțin. |

Rezultatul acestei etape este un **plan (plan)**: o listă de schimbări de bază (lecția 12), fiecare cu rolurile ei completate. Planul este încă pe hârtie; nimic nu s-a executat.

## Lecția 26. Raționamentul: când și cum alege sistemul

Cele mai multe cereri nu cer nicio gândire: omul a spus tot, iar planul se scrie direct. Raționamentul pornește numai când există un semn limpede că este nevoie de el, iar semnele sunt trei și pot fi verificate de program: a rămas o cheie deschisă, s-a găsit o contradicție sau există mai multe variante între care trebuie ales.

Toate mecanismele de raționament lucrează pe același lucru: starea lumii văzută ca fapte, adică lucruri cu felurile lor, însușiri ca puncte în spații și relații între lucruri. De aceea niciunul nu trebuie rescris pentru un domeniu.

| Mecanismul | Ce face |
|---|---|
| deducția (deduction) | Aplică regulile și cunoașterea și spune ce decurge și ce se încalcă. Un nod fără săgeți spre el este un început. Două ședințe ale Anei se suprapun. |
| completarea cu cost minim | Ia valorile candidate pentru cheile deschise, le aruncă pe cele care încalcă o regulă tare și o alege, dintre cele rămase, pe cea mai ieftină. Costul crește cu fiecare regulă slabă încălcată și cu depărtarea de ce este obișnuit. Așa ajung peștii în iaz și ședința la cea mai apropiată oră liberă. În literatură, aceasta este o formă de abducție. |
| extinderea unei valori comune | Dacă lucrurile de același fel au valori apropiate, iar aceste valori au venit de la om, propune aceeași valoare pentru un lucru nou. Toate nodurile sunt albastre fiindcă omul le-a cerut așa; nodul nou va fi albastru. În literatură, aceasta este o formă de inducție. |
| rezolvitorul (solver) | Caută valori pentru multe chei deschise deodată, când depind una de alta: orarul unei săptămâni (lecția 18). |

**Cum se poate încheia o căutare.** Pentru ca sistemul să nu spună „nu se poate” când de fapt doar nu a căutat destul, o căutare are cinci încheieri posibile, iar ele sunt ținute deosebit: s-a găsit un plan valid; s-a găsit un plan, dar ceva a rămas neverificat; cererea însăși este nevalidă; s-a dovedit că nu există nicio soluție; căutarea a fost oprită la limită, fără nicio concluzie. Numai a patra îi dă voie sistemului să spună „nu se poate”.

**Căutările proprii unui domeniu.** Unele căutări țin de meseria domeniului și sunt făcute de program: găsirea unui loc liber pe pagină; așezarea nodurilor unei diagrame; compunerea textului unui paragraf. Sunt permise ca funcții declarate (lecția 6). Împărțirea este limpede: planul hotărăște ce se face și cu ce valori; funcția găsește numai cum.

## Lecția 27. Execuția

Planul este o listă de schimbări. Fiecare este dusă la unealta ei prin legătura declarată (lecția 19), iar unealta primește numere și referințe.

Greutatea este că lumea reală nu ascultă întotdeauna. Unealta poate eșua, sau omul poate schimba ceva cu mâna între timp. De aceea se țin două stări, cu rosturi diferite. **Starea observată** este ce se citește din unelte; ea poate fi și nevalidă, de exemplu când omul a tras cu mâna un pește pe cer. **Starea primită pentru execuție** este ce propune sistemul; ea trebuie să treacă verificarea. Regula dintre ele: unealta are întotdeauna dreptate despre ce există; instanța de lume este oglinda ei, nu invers.

După fiecare pas, starea este citită din nou și comparată cu condiția „după” a actului (lecția 12). Rezultatul unei execuții este unul din cinci: executat; executat în parte; desfăcut, adică s-a dat înapoi tot; efect necunoscut; desfacere eșuată. Ultimele două sunt rare, dar trebuie să aibă nume, fiindcă în ele sistemul nu are voie să spună nici „am făcut”, nici „nu am făcut”.

Pentru om, o cerere executată este un singur pas care se poate anula, oricâte unelte au pornit pentru ea. O reacție („bigger”) înlocuiește pasul pe care îl corectează, nu adaugă altul. O întrebare pusă de sistem nu este un pas.

## Lecția 28. Răspunsul

Ultima etapă compune ce i se spune omului. Greșeala la îndemână este să scrii propoziții gata făcute pentru fiecare situație: „I added a fish.”, „I could not add the fish.” Aceasta duce la sute de rânduri și, mai rău, la răspunsuri care spun ce ar fi trebuit să se întâmple, nu ce s-a întâmplat.

Aici răspunsul se compune din două surse care nu pot minți: **diferența de stare**, adică ce este acum altfel față de dinainte, și **evidența execuției**, adică ce a reușit și ce nu. Fiecare act are un singur **cadru de propoziție**, general, completat cu rolurile care s-au schimbat. Cuvintele pentru roluri, relații și regiuni vin din lumea limbii. Un domeniu nu scrie nicio propoziție.

| Partea răspunsului | De unde vine |
|---|---|
| ce s-a făcut | Din diferența de stare. „I moved the duck to the lake” se spune numai dacă rața este acum pe lac. |
| ce a presupus sistemul | Din sursa și caracterul fiecărei valori (lecția 24). Se spune numai ce contează pentru om. |
| ce s-a făcut altfel decât s-a cerut | Apropierile și realizările împrumutate (lecția 23), o singură dată. |
| ce nu s-a putut face | Fiecare cerință neîndeplinită, cu cuvintele omului și cu motivul. |
| ce nu s-a putut verifica | Verificările rămase nedeterminate (lecția 5). |
| ce nu s-a înțeles | Cuvintele necitite, așa cum le-a scris omul. |

Întrebările omului despre ce există se răspund din stare: „What is in the picture?”, „What does the diagram show?”, „What is on Friday?”. „What can you do here?” se răspunde din capabilitățile declarate. În răspuns, valorile sunt spuse cu numele celei mai apropiate regiuni: un pește este „red”, nu trei numere; o ședință este „long”, față de celelalte.

Fiecare valoare ține minte de unde vine; aceasta se numește **proveniență (provenance)** și din ea se poate răspunde la „de ce este peștele acolo?”. Ce nu poate fi rezolvat cu mecanismele existente se trece în **registrul cazurilor nerezolvate**, împreună cu conceptul sau mecanismul general care lipsește. Registrul este lista de lucru pentru partea generală, nu o listă de petice de scris.

---

# Partea a șasea. Cele patru domenii

Această parte arată cum arată fiecare domeniu când tot ce s-a explicat este pus la lucru. Fiecare lecție are aceeași formă: declarația întreagă a domeniului, citită pe scurt; ce rămâne program; și un tabel cu propoziții ale omului, fiecare cu ce se întâmplă și cu lecția din care decurge.

De urmărit este cât de puțin declară un domeniu. Declară felurile lui de fire, sloturile lor legate de concepte, ce poate face, uneltele și legăturile. Nu are cuvinte de mărime, liste de culori sau de forme, întrebări, propoziții de răspuns ori valori obișnuite proprii.

## Lecția 29. Desenul

```
@w          std.schema.world name=drawing
@t.page     core.type of=page  extends=std.schema.thing is=whole
@t.drawn    core.type of=drawn extends=std.schema.thing is=thing
@s.drawn.kind  core.slot of=drawn key=kind   type=k.kinds.kind means=kind
@s.drawn.at    core.slot of=drawn key=at     kind=point  means=place   space=page
@s.drawn.in    core.slot of=drawn key=in     type=drawn  means=place   relation=in
@s.drawn.on    core.slot of=drawn key=on     type=drawn  means=place   relation=on
@s.drawn.size  core.slot of=drawn key=size   kind=number means=quality space=size
@s.drawn.col   core.slot of=drawn key=colour kind=point  means=quality space=colour
@k.drawn    std.schema.kind of=drawn world=drawing acts=make acts=place acts=change acts=remove
@op.add     std.tool.op world=drawing name=add    realises=make
@op.move    std.tool.op world=drawing name=move   realises=place
@op.set     std.tool.op world=drawing name=set    realises=change
@op.delete  std.tool.op world=drawing name=delete realises=remove
@f.free     core.function name=free_spot out.kind=point pure=true doc="a free position inside a region"
```

Lumea desenului are două tipuri de fire: pagina, care este un întreg, și lucrul desenat. Un lucru desenat are un fel, luat din arborele felurilor; un loc, ca poziție și ca relație „în” sau „pe” cu alt lucru; o mărime și o culoare. Cu lucrurile desenate se pot face cele patru acte, iar pentru fiecare există o unealtă. Ultimul rând declară o funcție proprie: găsirea unei poziții libere într-o regiune.

Ce lucruri se pot desena nu este declarat aici. Se poate desena orice fel din arbore care are o imagine sau un strămoș cu imagine (lecția 16). Programul desenului este deci: patru unelte, citirea paginii, căutarea unui loc liber și imaginile.

| Omul spune | Ce se întâmplă și din ce decurge |
|---|---|
| „draw a landscape with water, ground, sky, clouds, sun, two different houses” | Un întreg cu părțile numite de om (lecția 25). „Different” cere ca însușirile celor două case să fie depărtate în spațiile lor (lecția 10). Fiecare parte ajunge în regiunea paginii pe care o dă cunoașterea. |
| „put a duck” | „Put” fără un lucru existent înseamnă „a face” și apoi „a așeza” (lecția 12). Rața este desenată cu imaginea păsării, dacă nu are una, și rămâne rață (lecția 16). Locul, pe apă, vine din cunoaștere (lecția 26). |
| „on the lake” | Un fragment care dă locul (lecția 22). |
| „move the house down”, apoi „down” | Un pas pe axa verticală (lecția 13). Al doilea mesaj este un fragment care repetă pasul, cu același lucru (lecția 22). |
| „put a child on the swing” | Copilul nu există: întâi „fă”, apoi „așază” (lecția 12). |
| „arrange everything more naturally” | Operația „așază mai bine” asupra întregii pagini (lecția 25). |
| „random colours for the petals” | O alegere variată în spațiul culorilor, pentru părțile „petal” ale florilor (lecțiile 24 și 25). |
| „what is in the picture?” | Se răspunde din stare, cu numele regiunilor (lecția 28). |

## Lecția 30. Diagramele, cu graficele ca fel de diagramă

```
@w          std.schema.world name=diagram
@t.diagram  core.type of=diagram extends=std.schema.thing is=whole
@t.node     core.type of=node    extends=std.schema.thing is=thing
@t.link     core.type of=link    extends=std.schema.thing is=relation
@s.node.label core.slot of=node key=label  kind=string means=name
@s.node.shape core.slot of=node key=shape  kind=point  means=quality  space=shape
@s.node.col   core.slot of=node key=colour kind=point  means=quality  space=colour
@s.node.at    core.slot of=node key=at     kind=point  means=place    space=page
@s.node.value core.slot of=node key=value  kind=number means=quantity
@s.link.from  core.slot of=link key=from   type=node   means=role     role=source
@s.link.to    core.slot of=link key=to     type=node   means=role     role=goal
@k.node     std.schema.kind of=node world=diagram acts=make acts=place acts=change acts=remove
@k.link     std.schema.kind of=link world=diagram acts=make acts=remove
@f.layout   core.function name=layout out.kind=points pure=true doc="positions for nodes with few crossings"
```

Lumea diagramei are trei tipuri de fire: diagrama, care este un întreg; nodul, care este un lucru; săgeata, care este o relație între două noduri. Un nod are o etichetă, o formă, o culoare, o poziție și, dacă este cazul, o cantitate. Funcția proprie este așezarea nodurilor astfel încât săgețile să se încrucișeze cât mai puțin.

**Graficele.** Un grafic nu este un domeniu separat. Este un fel de diagramă: nodurile lui sunt bare sau puncte, iar cantitatea fiecăruia, ținută în cheia `value`, este arătată ca înălțime sau ca poziție pe o axă a paginii. De aceea nodul are cheia `value`. Felurile de diagrame (flux, arbore, hartă mentală, grafic cu bare, grafic cu linie) sunt grafuri de părți în cunoaștere (lecția 10), deci adăugarea unui fel nou de diagramă nu cere program.

| Omul spune | Ce se întâmplă și din ce decurge |
|---|---|
| „make a flowchart with six steps, no circles” | Șase noduri legate (lecția 25). Forma fiecăruia este aleasă în afara regiunii „circle” (lecția 10). Începutul și sfârșitul au forma dată de cunoaștere. |
| „fewer” | O reacție (lecția 22). Mai puține noduri; fluxul rămâne legat (lecția 25). |
| „make the second one red” | Lucrul este găsit după ordine (lecția 22); se schimbă o însușire (lecția 12). |
| „connect them all” | Operația „leagă tot” (lecția 25). |
| „make it nicer” | Operația „așază mai bine”: mai puține încrucișări, distanțe egale (lecția 25). |
| „a bar chart of meetings per person” | Un grafic. Valorile vin din calendar, prin compunerea lumilor (lecția 17). |
| „rounder boxes” | Un pas pe axa rotunjimii, în spațiul formelor (lecția 10). |

## Lecția 31. Documentele

```
@w          std.schema.world name=document
@t.text     core.type of=text    extends=std.schema.thing is=whole
@t.section  core.type of=section extends=std.schema.thing is=part
@s.text.genre  core.slot of=text    key=genre  type=k.kinds.kind means=kind
@s.text.about  core.slot of=text    key=about  kind=string means=topic
@s.text.title  core.slot of=text    key=title  kind=string means=name
@s.text.tone   core.slot of=text    key=tone   kind=point  means=quality  space=tone
@s.sec.of      core.slot of=section key=of     type=text   means=part
@s.sec.role    core.slot of=section key=role   type=k.kinds.kind means=kind
@s.sec.order   core.slot of=section key=order  kind=number means=place    space=order
@s.sec.length  core.slot of=section key=length kind=number means=quantity unit=word
@k.text     std.schema.kind of=text    world=document acts=make acts=change acts=remove
@k.section  std.schema.kind of=section world=document acts=make acts=place acts=change acts=remove
@f.compose  core.function name=compose out.kind=string doc="text for a part, from what the knowledge has about the topic"
```

Lumea documentului are două tipuri de fire: textul, care este un întreg, și secțiunea, care este o parte a lui. Textul are un gen, un subiect, un titlu și un ton. Secțiunea spune al cărui text este, ce fel de parte este (formulă de început, cuprins, încheiere), pe ce loc stă și cât de lungă este.

Genurile (scrisoare, raport, poveste, notă) și părțile fiecăruia sunt grafuri în cunoaștere. Scrierea textului propriu-zis este o funcție declarată, `compose`. Împărțirea este cea din lecția 26: planul hotărăște ce parte se scrie, despre ce și cât de lungă; funcția scrie cuvintele.

| Omul spune | Ce se întâmplă și din ce decurge |
|---|---|
| „write a short formal letter about a late delivery” | O scrisoare cu părțile ei (lecția 25). „Short” se judecă față de lungimea obișnuită a scrisorilor (lecția 11). „Formal” este o regiune în spațiul tonului (lecția 10). |
| „longer” | O reacție: un pas pe axa lungimii; părțile se păstrează (lecțiile 22 și 25). |
| „move the apology before the explanation” | Schimbarea unei relații de ordine între două părți (lecțiile 12 și 13). |
| „a story about a fox, in three chapters” | Cantitatea este a părților „chapter” (lecția 25). Dacă despre vulpi cunoașterea are prea puțin, se spune cât s-a putut scrie (lecția 24). |
| „warmer” | Un pas pe axa căldurii, în spațiul tonului (lecția 10). |
| „what is in the document?” | Se răspunde din stare: genul, titlul, părțile (lecția 28). |

## Lecția 32. Calendarul

```
@w          std.schema.world name=calendar
@use        core.use world=w.person
@t.meeting  core.type of=meeting extends=std.schema.thing is=thing
@t.room     core.type of=room    extends=std.schema.thing is=thing resource=true
@s.meet.title  core.slot of=meeting key=title  kind=string   means=name
@s.meet.start  core.slot of=meeting key=start  kind=number   means=time  part=start
@s.meet.length core.slot of=meeting key=length kind=number   means=time  part=duration
@s.meet.room   core.slot of=meeting key=room   type=room     means=place relation=in
@s.meet.people core.slot of=meeting key=people type=w.person means=role  role=participant many=true
@s.room.seats  core.slot of=room    key=seats  kind=number   means=quantity counts=w.person
@k.meeting  std.schema.kind of=meeting world=calendar acts=make acts=place acts=change acts=remove
```

Lumea calendarului importă tiparul persoanelor (`core.use`, lecția 17). Are două tipuri de fire: ședința și sala. Sala este declarată ca resursă. O ședință are un titlu, un început și o durată, o sală și participanți. O sală are un număr de locuri, care numără persoane.

La acestea se adaugă interdicția din lecția 6, că un om nu poate fi în două ședințe care se suprapun, și aceeași interdicție pentru o sală. Mai mult nu este de scris.

Calendarul este domeniul de probă al întregii construcții, din două motive. Este nou, deci arată cât costă cu adevărat adăugarea unui domeniu. Și seamănă, în adânc, cu desenul: timpul unui om și o sală sunt resurse care se ocupă, la fel cum spațiul paginii este resursa desenului. Dacă partea generală este bine făcută, „cea mai apropiată oră liberă” și „un loc liber în iaz” sunt același mecanism.

| Omul spune | Ce se întâmplă și din ce decurge |
|---|---|
| „a long meeting with Ana tomorrow afternoon” | „Long” se judecă față de ședințele din acest calendar (lecția 11). „Afternoon” este o regiune pe axa orelor (lecția 13). Ora exactă este cea mai apropiată liberă pentru Ana (lecția 26). |
| „later” | O reacție: un pas pe axa timpului. Dacă noul interval se suprapune cu altceva, se alege cel mai apropiat liber (lecțiile 22 și 10). |
| „in the big room” | Un fragment care dă locul. „Big” se judecă față de sălile care există (lecțiile 22 și 11). |
| „with Tom too” | Un fragment care adaugă un participant. Se verifică și timpul lui Tom (lecțiile 22 și 5). |
| „a meeting with Ana at ten thirty”, când Ana este ocupată | Refuz cu explicație, compusă din încălcare, și cu cea mai apropiată oră liberă (lecțiile 5 și 10). |
| „move everything on Friday to Monday” | Toate ședințele din regiunea „Friday”. Rezolvitorul le găsește ore fără suprapuneri (lecția 18). |
| „who is in the review?” | Întrebarea generală a rolului de participant, răspunsă din stare (lecția 28). |
| „what is on Friday?” | Se răspunde din stare (lecția 28). |

## Lecția 33. Ce are voie să fie program și cum știm că nu ne păcălim

Toată construcția are rost numai dacă programul unui domeniu rămâne mic și nu ia, pe ascuns, hotărâri care trebuiau declarate. Altfel am avea declarații frumoase și, lângă ele, program care face de fapt treaba, pentru fiecare caz în parte.

Regula: programul unui domeniu face numai trei lucruri. Îndeplinește operațiile simple ale uneltelor. Își citește starea. Și calculează funcțiile declarate. O unealtă are voie să știe lucrurile meseriei ei: unealta de desen știe cum arată un pește.

| Ce nu are voie să facă programul unui domeniu | De ce |
|---|---|
| să citească propoziția omului | Unealta primește numere și referințe. Citirea este treaba interpretării, una pentru toate domeniile. |
| să țină cuvinte, sinonime sau liste de valori | Acestea sunt nume de regiuni și stau în cunoaștere. |
| să aleagă cantitatea, felul, forma, locul, ora | Alegerea este treaba planului, unde poate fi explicată. |
| să țină valori obișnuite | Sunt regiuni, în cunoaștere. |
| să scrie propoziții de răspuns sau întrebări | Vin din cadrele actelor și din concepte. |

Și o declarație poate fi un petic. Un rând scris pentru un lucru anume („rața se desenează cu imaginea păsării”), când un rând mai general îl putea purta („un fel fără imagine o folosește pe a strămoșului”), este tot o cârpeală, numai că scrisă în fire. Asemenea rânduri sunt refuzate la verificare.

**Cum măsurăm.** Măsurile de mai jos sunt alese ca să nu poată fi îndeplinite prin cârpeli.

| Măsura | Ce arată |
|---|---|
| sesiunile reale ale omului | Mesajele scrise de om în aplicație, rulate din nou. Fiecare este socotit corect, parțial, refuzat cu motiv sau greșit. Verificarea afirmă ce a vrut omul și ce nu avea voie să se schimbe. Numărul celor greșite trebuie să rămână zero. |
| numărul declarațiilor particulare | Liste de cuvinte, propoziții de răspuns, realizări scrise pe un fel, valori obișnuite pentru un singur lucru. Trebuie să scadă spre zero. |
| ce trece neschimbat de la un domeniu la altul | Limba, conceptele, spațiile, actele, cadrele de răspuns, completarea, verificarea. |
| costul calendarului | Câte rânduri de declarații, câte linii de unelte și câte ore a cerut, fără nicio schimbare în partea generală. |
| perechi minimale și propoziții nevăzute | Cât de bine este citită o propoziție care nu a fost folosită la construire. |

---

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

Fiecare termen are o explicație de un rând și lecția în care este explicat pe larg.

| Termen | Explicație |
|---|---|
| fir (wire) | O declarație pe un rând: identificator, tip, perechi cheie și valoare. Lecția 3. |
| cheie (key) | Numele unei informații dintr-un fir. Lecția 3. |
| referință (reference) | O valoare care trimite la alt fir, scrisă cu `$`. Lecția 3. |
| fapt (fact) | Un fir care spune că ceva există și cum este. Lecția 3. |
| spațiu de nume (namespace) | Un nume pus în fața identificatorilor unei lumi, ca să nu se ciocnească cu ai alteia. Lecția 4. |
| lume (world) | Fapte și schemă, ținute împreună și verificate. Lecția 5. |
| schemă (schema) | Firele care spun ce fapte au voie să existe și ce decurge din ele. Lecția 5. |
| tip (type) | Felul unui fir; spune despre ce vorbește și ce chei poate avea. Lecția 5. |
| slot (slot) | Declarația, în schemă, a unei chei a unui tip de fire. Lecția 5. |
| moștenire (lineage) | Ce se declară despre un tip general este valabil pentru cele care îl extind. Lecția 5. |
| cheie deschisă (open key) | O cheie declarată obligatorie care nu are încă valoare; o sarcină de completat, de căutat sau de întrebat. Lecția 5. |
| încălcare (violation) | Declarația unui refuz: ce regulă și ce fire. Lecția 5. |
| validă, nevalidă, nedeterminată | Cele trei rezultate ale unei verificări. Lecția 5. |
| copie (fork) | O a doua lume, identică la pornire, pentru încercări. Lecția 5. |
| variabilă (variable) | Un loc cu nume, scris cu `?`, în care se potrivește orice valoare; apare numai în modele. Lecția 6. |
| model (pattern) | Un fir cu variabile, folosit ca întrebare pusă lumii. Lecția 6. |
| regulă (rule) | Când modelele se potrivesc, adaugă un fir. Lecția 6. |
| fir dedus (derived) | Un fir adăugat de o regulă; dispare când rămâne fără temei. Lecția 6. |
| interdicție (deny) | Modele care nu au voie să se potrivească împreună. Lecția 6. |
| tare, slab (hard, soft) | O constrângere care refuză, față de una care doar notează o problemă. Lecția 6. |
| funcție (function) | Un calcul declarat, chemat de schemă. Lecția 6. |
| lumea legendelor (legend world) | Lumea care ține conceptele generale. Lecția 8. |
| spațiu conceptual (conceptual space) | Spațiul valorilor unei însușiri: axe numerice sau un graf de părți. Lecția 10. |
| axă, regiune, centru | Părțile unui spațiu conceptual. Lecția 10. |
| cuvânt de grad (degree word) | „Big”, „short”: un cuvânt al cărui înțeles se calculează din situație. Lecția 11. |
| clasă de comparație (comparison class) | Față de ce se judecă un cuvânt de grad. Lecția 11. |
| schimbare de bază | Apariție, dispariție, schimbarea unei însușiri, schimbarea unei relații. Lecția 12. |
| act (act) | O schimbare cerută, definită o dată, cu roluri și cu condiții înainte și după. Lecția 12. |
| rol (role) | Partea pe care o joacă un lucru într-un act. Lecțiile 9 și 12. |
| tipar de lume, bază de cunoaștere, instanță de lume | Cele trei feluri de lumi. Lecția 15. |
| fapt de domeniu, normă, valoare obișnuită, euristică | Felurile de cunoaștere. Lecția 15. |
| realizare | Felul concret în care un domeniu face un lucru: o imagine, o formă. Lecția 16. |
| import, extindere, restrângere, conflict, legare | Operațiile de compunere a lumilor. Lecția 17. |
| rezolvitor (solver) | Căutarea de valori pentru multe chei deschise deodată. Lecția 18. |
| domeniu de capabilități, unealtă, capabilitate, legătură | Cum este legat un domeniu de programul lui. Lecția 19. |
| cerere (request) | Ce vrea omul, scris ca fire, în concepte generale. Lecția 21. |
| cerință (constraint) | Un singur lucru pe care omul îl vrea, cu identitatea lui. Lecția 21. |
| focus | Lucrurile și cererea despre care se vorbește acum. Lecția 22. |
| reacție, corecție, fragment | Feluri de mesaje care au sens numai față de dialog. Lecția 22. |
| întrebare deschisă | Întrebarea pusă de sistem, ținută minte până la răspuns. Lecția 22. |
| toleranță (tolerance) | Câtă abatere este primită între ce s-a cerut și ce se poate face. Lecția 23. |
| sursă, caracter, context, cost | Cele patru informații purtate de fiecare valoare. Lecția 24. |
| cerință, preferință, presupunere | Cele trei caractere ale unei valori. Lecția 24. |
| întreg, plan | Un lucru făcut din părți; lista schimbărilor de făcut. Lecția 25. |
| deducție, completare cu cost minim, extinderea unei valori comune | Mecanismele de raționament. Lecția 26. |
| stare observată, stare primită pentru execuție | Ce există de fapt și ce propune sistemul. Lecția 27. |
| cadrul unui act | Forma generală a propoziției de răspuns pentru un act. Lecția 28. |
| proveniență (provenance) | De unde vine fiecare valoare. Lecția 28. |
| registrul cazurilor nerezolvate | Lista a ce nu se poate face încă, cu mecanismul general care lipsește. Lecția 28. |
