# SOP Worlds: teoria

*Versiunea 29, 16 noiembrie 2026. Text de lucru în română; termenul englez este dat în paranteză la prima apariție. Exemplele de fire sunt în engleză, fiindcă așa se scriu în sistem.*

---

# 1. Despre ce este vorba

## 1.1 Aplicația de la care pornim

Avem o singură aplicație, folosită de un singur om. Pe ecran este o conversație și patru zone de lucru: un desen, o diagramă, un document și un calendar. Omul scrie în conversație ce vrea, în cuvinte obișnuite, iar aplicația trebuie să facă lucrul cerut în zona potrivită: să deseneze, să construiască diagrama, să scrie documentul, să pună o ședință în calendar. Dacă nu poate, trebuie să spună ce anume nu poate și de ce.

Fiecare dintre cele patru zone se numește în acest document un **domeniu**. Cele patru domenii sunt singurele din care sunt luate exemplele.

## 1.2 Problema și ideea

Felul obișnuit de a construi o asemenea aplicație este să se scrie, pentru fiecare fel de propoziție a omului, o bucată de program care o recunoaște și face ce trebuie. Aceasta merge pentru puține propoziții. Pe măsură ce se adaugă, fiecare propoziție nouă cere încă o bucată de program, bucățile ajung să se contrazică, iar când aplicația greșește nu se mai poate spune de ce.

SOP Worlds înlocuiește programul scris pentru fiecare propoziție cu o **descriere** a lucrurilor despre care se vorbește. Descrierea spune patru feluri de lucruri: ce poate exista (pe o pagină pot exista lucruri desenate, fiecare cu o poziție, o mărime și o culoare), ce nu este permis (un om nu poate fi în două ședințe în același timp), ce decurge din ce există (un nod spre care nu vine nicio săgeată este începutul diagramei) și ce se știe în general (peștii trăiesc în apă; o scrisoare se încheie cu o semnătură).

Descrierea este scrisă într-un limbaj mic, numit **SOP Lang**. O descriere, împreună cu lucrurile care există la un moment dat, se numește **lume (world)**. Un singur program general, biblioteca **sopworld**, lucrează cu orice lume: nu primește o schimbare care încalcă descrierea, răspunde la întrebări despre ce există, trage concluzii și, când refuză ceva, spune ce regulă a fost încălcată.

Principiul care conduce tot documentul este: **de la general la particular.** Fiecare lucru se declară o singură dată, la nivelul cel mai general la care este adevărat, și este moștenit de tot ce este mai particular. Semnul că principiul a fost încălcat este ușor de recunoscut: pentru o propoziție nouă a omului trebuie scris un rând nou anume pentru ea.

## 1.3 Ce există astăzi și ce este propunere

Documentul descrie două lucruri și le ține deosebite, pentru ca o hotărâre să poată fi luată în cunoștință de cauză.

Capitolele 2 și 3 descriu **limbajul și biblioteca așa cum sunt astăzi**. Tot ce este acolo a fost luat din documentația normativă a bibliotecii (`docs/language.md` și `docs/reference.md`) și este verificat de testele ei. Tabelele din aceste capitole sunt complete: toate tipurile predefinite ale limbajului, cu toate cheile lor.

Capitolul 4 descrie **lumea legendelor, care este o propunere** și nu există încă. Capitolele 5, 6 și 7 descriu cum arată folosirea când propunerea este pusă la lucru; ele amestecă lucruri care există cu lucruri propuse. Peste tot, ce este propus poartă cuvântul **(propus)**. Anexa C adună într-un singur loc tot ce este propus și tot ce există astăzi și ar trebui schimbat.

Contractele semantice sunt explicate lângă conceptele pe care le precizează: valori și identitate în capitolul 2, validare în capitolul 3, spații și acte în capitolul 4, moștenire în capitolul 5, interpretare și execuție în capitolul 6. Identificatorii R servesc trimiterilor între text și plan, fără a forma un capitol separat. Diferențele dintre comportamentul țintă și programul actual sunt consemnate în anexa C. Alegerile tehnice încă deschise sunt în anexa D.

## 1.4 Un exemplu, de la un capăt la altul

Înainte de explicații, iată o dată tot drumul unei propoziții, ca să se vadă ce piese există. Fiecare pas este explicat mai târziu, în secțiunea arătată.

Pe pagina de desen sunt un iaz, o casă și doi pești mici în iaz. Omul scrie **„draw three big red fish”**.

| Pasul | Ce face aplicația |
|---|---|
| 1. Citește starea | Află ce este acum pe pagină: un iaz, o casă, doi pești (secțiunea 6.2). |
| 2. Înțelege propoziția | O desparte în părți cu rost: se cere a face ceva nou; felul este pește; sunt trei; culoarea este roșu; mărimea este „mare”. Rezultatul se numește cerere (secțiunea 6.3). |
| 3. O așază în conversație | Hotărăște că este o cerere nouă, nu o corectare a celei dinainte. Observă că omul nu a spus unde să fie peștii (secțiunea 6.4). |
| 4. Trece de la cuvinte la numere | „Mare” nu are un înțeles fix: aici înseamnă vizibil mai mare decât cei doi pești de pe pagină. „Roșu” devine o culoare anume (secțiunile 4.4, 4.5 și 6.5). |
| 5. Completează ce lipsește | Pentru loc sunt două variante: în iaz sau altundeva pe pagină (secțiunea 6.6). |
| 6. Alege | Cunoașterea generală spune că peștii trăiesc în apă, deci alege iazul și găsește în el trei poziții libere (secțiunea 6.8). |
| 7. Execută | Pornește de trei ori operația de desenare, cu numere. Apoi citește din nou pagina și verifică: sunt cinci pești (secțiunea 6.9). |
| 8. Răspunde | „I drew 3 big red fish in the pond.” Locul este spus fiindcă l-a ales aplicația, nu omul (secțiunea 6.10). |

Omul scrie apoi numai **„in the sky”**. Nu este o propoziție întreagă. Aplicația o înțelege ca pe locul care lipsise din cererea dinainte, deci ca pe o corectare, și mută peștii în partea de sus a paginii. Că peștii trăiesc în apă este o regulă de bun-simț, iar omul a spus limpede altceva.

În calendar, același om are o colegă, Ana, care are deja o ședință de la zece la unsprezece. Omul scrie **„a meeting with Ana at ten thirty”**. De data aceasta se încalcă o regulă care nu poate fi ocolită: un om nu poate fi în două ședințe în același timp. Aplicația nu pune ședința și nici nu o mută pe tăcute. Răspunde: „Ana is busy from 10 to 11. The nearest free time for a 1-hour meeting is 11:00. Shall I put it there?”

---

# 2. Limbajul SOP Lang

Capitolul acesta introduce sintaxa declarațiilor, categoriile de valori și regulile de interpretare. Descriem mecanismul existent și marcăm separat contractele propuse pentru valori compuse, identitate persistentă și organizarea proiectelor.

## 2.1 Sintaxa unei declarații

Tot ce se scrie în SOP Lang este un șir de declarații. O declarație se numește **fir (wire)**. Un fir are întotdeauna aceeași formă, în trei părți, în această ordine:

```
@identificator  tip  cheie=valoare  cheie=valoare  ...
```

**Identificatorul (id)** este numele propriu al firului. Este scris cu semnul `@` în față. Rostul lui este ca alte fire să se poată referi la acesta. Într-un text, un identificator poate fi declarat o singură dată.

**Tipul (type)** este un nume care spune ce fel de declarație este firul. De tip depinde ce chei are voie să aibă firul și ce face biblioteca cu el.

**Perechile cheie și valoare** dau conținutul. **Cheia (key)** este numele unei informații; **valoarea (value)** este informația. Între cheie, semnul egal și valoare nu se pune spațiu. Aceeași cheie poate fi scrisă de mai multe ori pe un fir; atunci cheia are mai multe valori, în ordinea în care au fost scrise.

Un fir se termină acolo unde începe următorul, adică la următorul `@` de la începutul unui cuvânt. Poate fi scris pe mai multe rânduri. Limbajul nu are altceva: nu are paranteze, nu are liste, nu are fire în interiorul altor fire. Această sărăcie este voită și are o urmare care se vede peste tot în document: **orice lucru care are mai multe părți se scrie ca mai multe fire legate între ele.**

Un exemplu din desen:

```
@f1 fish size=1.6 at=120,540 in=$pond1
```

Identificatorul firului este `f1`. Tipul lui este `fish`. Are trei chei. Cheia `size` are valoarea `1.6`. Cheia `at` are valoarea `120,540`. Cheia `in` are valoarea `$pond1`, care este o trimitere la firul cu identificatorul `pond1`. În cuvinte: există un pește, de 1,6 ori mai mare decât unul obișnuit, la poziția 120 pe orizontală și 540 pe verticală, aflat în lucrul descris de firul `pond1`.

## 2.2 Categorii lexicale și valori

Analiza lexicală separă textul în unități lexicale (tokens). La acest nivel, o valoare aparține uneia dintre categoriile de mai jos. Categoria lexicală nu este încă tipul semantic al valorii: `10:30` este recunoscut ca atom, apoi schema poate cere interpretarea lui ca oră.

| Felul | Cum se scrie și ce este |
|---|---|
| atom | Orice șir de caractere fără spații care nu începe cu `$`, `?`, `@` sau `#`: `fish`, `1.6`, `120,540`, `10:30`, `5kg`. Numerele, cantitățile, orele și numele sunt toate atomi. Limbajul nu le deosebește între ele; ce înseamnă un atom hotărăște schema (secțiunea 3.2). |
| text (string) | Scris între ghilimele: `"Review"`. Poate conține spații. |
| referință (reference) | `$` urmat de identificatorul unui fir: `$pond1`. Înseamnă „firul cu acest identificator”. |
| variabilă (variable) | `?` urmat de un nume: `?n`. Înseamnă „orice valoare”. Este permisă numai în reguli și în întrebări, niciodată într-un fapt (secțiunea 3.4). |

De exemplu, `label="Review"` furnizează un text, `source=$m1` furnizează o referință, iar `label=?text` cere legarea unei variabile în timpul potrivirii. Textul `"$m1"` rămâne text: ghilimelele împiedică interpretarea lui ca referință. Schimbarea categoriei schimbă sensul declarației, chiar dacă literele din interior sunt aceleași.

### 2.2.1 Reprezentarea valorilor compuse și semantica ordinii

O poziție pe pagină este o singură valoare: coordonatele ei au sens împreună, în spațiul declarat de slot. În reprezentarea propusă, `at=120,540` are `kind=point` și `space=page`; coordonatele urmează ordinea axelor declarată prin `order`, orizontala înaintea verticalei. Egalitatea este numerică, axă cu axă: `120,540` și `120.0,540` sunt egale, dar `540,120` este alt punct. Un punct cu prea puține sau prea multe coordonate este refuzat ca încălcare `domain`. Cererea „move it up” poate viza numai verticala, însă planul citește poziția existentă și construiește un punct complet după modificare; nu salvează `at=120` ca poziție incompletă. Motorul actual nu are `kind=point`: folosește numere repetate sub o cheie `many=true` sau valori `json`. Forma propusă păstrează punctul ca valoare unitară și îi explicitează spațiul. *(R1)* *(R2)* *(R3)* *(R4)*

Mai multe valori ale aceleiași chei reprezintă altceva: o colecție de elemente independente. Limbajul actual le păstrează ca listă ordonată. Pentru participanții unei ședințe, ordinea poate fi declarată nerelevantă prin `order=ignored` **(propus)**: aceeași colecție de persoane rămâne egală după reordonare, iar duplicatele se reduc la o singură apariție. Pentru paragrafele unui document, ordinea rămâne semnificativă. Schema decide această proprietate a slotului; faptul că ambele cazuri folosesc valori repetate nu le dă automat aceeași semantică. *(R5)*

| Valori comparate | Interpretarea în schema declarată |
|---|---|
| `at=120,540` și `at=120.0,540` | Același punct numeric al paginii. |
| `at=120,540` și `at=540,120` | Puncte diferite: coordonatele nu sunt o mulțime fără ordine. |
| Aceiași participanți, enumerați invers | Aceeași colecție numai dacă slotul declară ordinea nerelevantă. |
| Aceleași paragrafe, enumerate invers | Alt document când slotul păstrează ordinea textului. |

### 2.2.2 Alegerea reprezentării unui punct

Un punct este o valoare fără identitate proprie. Două obiecte pot ocupa aceeași poziție fără să devină același obiect. Reprezentarea trebuie să permită compararea coordonatelor și citirea unei axe într-o regulă, fără să introducă o identitate separată pentru fiecare număr.

Avem trei variante: valoarea dedicată propusă `at=120,540`, un obiect JSON existent cu câmpurile `x` și `y`, sau fire separate pentru punct și coordonate. Variantele presupun sloturi diferite și nu se încarcă împreună ca declarații ale aceluiași tip. Forma dedicată cere `kind=point space=page`. Forma JSON cere `kind=json`, iar valoarea este un text SOP al cărui conținut decodat este obiectul JSON. Ghilimelele și barele inverse interioare trebuie escapate conform regulilor textelor din secțiunea 2.2.

Exemplul JSON existent arată cele două niveluri de citire: ghilimelele exterioare sunt ale textului SOP, iar cele escapate aparțin cheilor obiectului JSON. După decodare, ordinea cheilor nu schimbă egalitatea valorii.

```sop
@s.node.at core.slot of=node key=at kind=json
@n1 node at="{\"x\":120,\"y\":540}"
```

În varianta cu fire separate, aceeași poziție ar putea fi scrisă astfel, cu tipuri ilustrative care trebuie declarate în schemă:

```sop
@n1 node at=$position1
@position1 pointValue space=page
@coordx coordinate of=$position1 axis=x value=120
@coordy coordinate of=$position1 axis=y value=540
```

`position1` are acum identitate, iar fiecare coordonată este un fapt. Schema trebuie să impună exact o coordonată pentru fiecare axă și să definească egalitatea semantică dintre puncte cu identificatori diferiți. Fără această regulă, două poziții numeric egale pot părea diferite numai pentru că se numesc `position1` și `position2`.

| Criteriu | Consecințele celor trei variante |
|---|---|
| Citirea unei axe | Valoarea dedicată trebuie să ofere `at.x=?x`; JSON oferă deja citirea prin cale; firele separate cer potrivirea obiectului, punctului și coordonatei legate. |
| Egalitate | Valoarea dedicată compară coordonate tipizate în același spațiu; JSON folosește forma canonică, indiferent de ordinea cheilor; firele separate cer comparație structurală peste identități diferite. |
| Identitatea faptului | Primele două variante compară slotul ca valoare; varianta cu referință introduce o identitate suplimentară. Niciuna nu autorizează îmbinarea obiectelor numai pentru că au aceeași poziție. |
| Lizibilitate și volum | Forma dedicată păstrează un singur fir compact; JSON păstrează un fir, cu numele axelor și escapare; exemplul cu fire separate cere un fir al obiectului, unul al punctului și câte unul pentru fiecare axă. |
| Schimbarea motorului | Punctul dedicat cere validare, canonizare și acces prin axă; JSON are deja canonizare și căi, dar nu impune singur axele și unitățile; firele separate folosesc potrivirea existentă, cu restricții structurale suplimentare. |
| Evoluția schemei | Punctul dedicat depinde de ordinea axelor din versiunea spațiului; JSON și firele separate păstrează numele axelor, dar tot cer migrare dacă sensul ori unitățile lor se schimbă. |

Alegerea pentru proiect este `kind=point`, cu acces prin numele axei, reutilizând ideea căilor din mecanismul JSON. Motivul este semantic: poziția rămâne o valoare cu spațiu declarat, fără identități artificiale. JSON rămâne disponibil, dar `kind=json` singur nu dovedește că valoarea are exact axele și unitățile unui spațiu. Firele separate sunt potrivite când coordonatele sunt măsurări cu surse și istoric propriu; atunci descriu observații despre un punct, nu reprezentarea elementară a valorii lui.

În contractul propus, pattern-ul `@p node at.x=?x` citește axa numită `x` chiar dacă valoarea este serializată prin virgule. O interdicție poate folosi variabila numerică într-un `core.check`. Numele axei se rezolvă prin schema spațiului, nu prin poziția curentă pe ecran. Șablonul unei reguli produce întregul punct; modificarea unei axe reconstruiește și validează valoarea completă înainte de înlocuire, așa cum mecanismul JSON actual scrie valoarea întreagă.

Serializarea dedicată folosește numere finite, separate prin virgulă, fără spații; separatorul zecimal este punctul. `at=-12.5,540` are două coordonate; `at=12,5,540` are trei și se refuză într-un spațiu cu două axe. Această formă numerică nu cere ghilimele sau escapare. Egalitatea se calculează după canonizarea numerică, nu după textul original. Dacă slotul participă la cheia de identitate a unui fapt, folosește aceeași egalitate canonică. Două valori diferite pentru poziția aceluiași obiect nu se împacă prin medie sau alegere arbitrară.

Ordinea axelor este imutabilă în interiorul unei versiuni publicate. Datele persistente se încarcă împreună cu versiunea spațiului care le-a definit. Dacă noua versiune schimbă ordinea din `(x,y)` în `(y,x)`, migrarea citește vechea ordine și rescrie `120,540` ca `540,120`. Aceiași octeți nu se reinterpretează tacit după noua schemă. Adăugarea unei axe cere o regulă explicită de completare sau lasă migrarea incompletă. Fără migrare, versiunea incompatibilă se refuză. Punctele din spații ori unități diferite nu sunt declarate egale fără o transformare explicită.

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

**Punctul nu are niciun înțeles pentru limbaj.** `core.type` este un singur nume, la fel ca `fish`. Punctele sunt folosite după o convenție, pentru cititor: începutul numelui unui tip spune cine a definit acel tip.

| Începutul | Cine a definit tipul |
|---|---|
| `core.` | Limbajul însuși. Sunt tipurile predefinite, cu care se scrie schema unei lumi (capitolul 3). |
| `std.` | Modulele standard ale bibliotecii, folosite pentru conversație (secțiunea 6.1). |
| `w.legend.` | Lumea legendelor (capitolul 4; propus). |
| `k.` | O bază de cunoaștere publicată (secțiunea 5.1). |
| `w.` | O descriere publicată a unui fel de lume (secțiunea 5.1). |
| nimic | Un tip propriu lumii în care apare: `fish`, `node`, `meeting`. |

Un lucru trebuie spus limpede, fiindcă produce confuzie: **un tip nu este un fir și nu are identificator.** Un tip este un nume. Oriunde limbajul așteaptă un tip, se scrie numele lui, fără `$`: ca al doilea cuvânt al unui fir (`@f1 fish`), sau ca valoare a unor chei care cer un tip (`of=fish`, `extends=fish`, `type=fish`). Un tip nici nu trebuie declarat ca să fie folosit: firul `@f1 fish size=1.6` este primit și într-o lume care nu a auzit de `fish`. Declararea unui tip adaugă informații despre el; cum se face este în secțiunea 3.1.

### 2.4.1 Identitate, referințe și ciclul de viață al faptelor

Identitatea permite recunoașterea aceluiași lucru după ce i se schimbă numele, poziția sau fișierul în care este salvat. O etichetă servește cititorului; o referință servește legăturilor dintre fapte. Dacă o ședință este redenumită din „Review” în „Planning”, nodul diagramei care o reprezintă trebuie să continue să indice aceeași ședință.

Regulile de mai jos separă identitatea persistentă de rezolvarea unei referințe și de verificarea existenței țintei. Acestea sunt trei operații distincte: un identificator poate fi bine format și totuși să nu desemneze niciun fapt disponibil.

Identitatea persistentă a unui fapt este perechea dintre identitatea imutabilă a instanței și identificatorul local al faptului. **(Propus)** Numele afișat al lumii, numele modulului și calea pe disc nu sunt această identitate. Încărcătorul poate deduce un nume inițial din calea relativă, dar salvează separat identitatea instanței. Un spațiu de nume lizibil precum `calendar` se rezolvă în contextul proiectului la această identitate. În formatul persistent propus, referința stochează perechea dintre identitatea imutabilă a instanței și identificatorul local; `calendar` este numai numele lizibil folosit la introducere și afișare. Salvarea rezolvă acest nume și scrie identitatea, nu textul aliasului. La redenumirea în `agenda`, afișarea se schimbă, dar perechea stocată nu se schimbă. Importul unui text vechi cu `$calendar::m1` cere un alias declarat sau o mapare explicită; nu ghicește noul nume. Redenumirea ori mutarea directorului păstrează astfel referințele persistente; copierea independentă remapează identitățile și referințele interne împreună. Secțiunea 2.6 descrie contractul și deosebirea față de prefixele textuale actuale. *(R6)*

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

**Schema (schema)** este mulțimea firelor care spun ce fapte au voie să existe și ce decurge din ele. Schema se scrie o dată, de către cel care descrie domeniul, și se schimbă rar. În programul și documentația bibliotecii, schema se numește încă *matrix*; trecerea la numele „schema” se face treptat.

Biblioteca hotărăște în care din cele două categorii intră un fir după două reguli. Un fir este al schemei dacă tipul lui este unul dintre tipurile predefinite de schemă (cele din capitolul 3, de exemplu `core.type` sau `core.rule`). Un fir este al schemei și dacă o regulă din același text îl folosește drept condiție sau concluzie: în primul caz este un pattern, în al doilea un șablon de concluzie (secțiunile 3.4–3.5). Orice alt fir este un fapt.

Faptele și firele schemei au identificatori separați: un fapt `p` și un fir de schemă `p` nu se ciocnesc.

## 2.6 Spații de nume, module și organizarea proiectului

Un **spațiu de nume (namespace)** stabilește contextul în care un nume este rezolvat. Problema nu este doar că două obiecte se pot numi `n1`. Trebuie să știm și din ce modul vine tipul lor, ce fișier îi conține și din ce instanță provin atunci când sunt salvați sau legați de altă lume.

Aceste patru informații nu sunt identice. Calea unui fișier este adresa de stocare. Modulul este unitatea de schemă reutilizabilă. Instanța este o stare concretă construită cu acea schemă. Identificatorul local numește un fapt în acea instanță. Același modul al diagramei poate fi folosit de două diagrame diferite; o diagramă poate fi salvată în mai multe fișiere.

În aplicația demonstrativă, desenul, diagrama, documentul și calendarul au fiecare câte o instanță distinctă. Descriptorul proiectului leagă numele lor lizibile de identități persistente, fișiere și scheme. Chiar dacă desenul și diagrama au amândouă un obiect `n1`, acestea nu sunt același lucru. La cererea unui grafic din calendar, aplicația citește instanța calendarului și creează obiecte în instanța diagramei; aici calificarea referințelor face vizibilă trecerea dintre cele două stări.

Exemplele locale din capitolul 7 folosesc schema proprie a aplicației, deci păstrează tipuri precum `node` și `meeting`. Directorul `worlds/diagram/` din organizarea propusă nu califică singur tipul `node`. Dacă schema este publicată și importată printr-un modul calificat, tipul poate deveni `diagram.node`; atunci și sloturile, pattern-urile și folosirile sale trebuie calificate consecvent la import. Această operație asupra numelor de schemă este separată de prefixul `diagram::` al faptelor unei instanțe.

### 2.6.1 Calificarea referințelor

În mecanismul existent al bibliotecii sopworld, programul gazdă furnizează un spațiu de nume la încărcarea faptelor. `@n1 node` încărcat în spațiul de nume `diagram` devine faptul `diagram::n1`. O referință locală `$n1` din același context îl numește pe acesta. O referință calificată `$calendar::m1` numește un fapt al calendarului. `$::x` numește un fapt din contextul fără prefix.

O legătură activă este potrivită când documentul încorporează un desen care trebuie să rămână accesibil ca stare distinctă. În exemplul propus, încărcat în instanța documentului, inserția desemnează scena din instanța desenului:

```sop
@insert1 embeddedDrawing drawing=$drawing::scene1
```

`insert1` este obiectul documentului care deține inserția; `embeddedDrawing` este tipul propus al inserției, nu un cuvânt rezervat. Cheia `drawing` trebuie declarată ca referință la tipul scenei. `$drawing::scene1` desemnează o țintă activă care trebuie încărcată și rezolvată. Referința nu importă singură desenul. Modificările lui pot fi afișate de document numai după citirea unei versiuni coerente a acelei scene.

Graficul derivat din calendar este diferit: el prezintă datele citite la un moment dat. Următorul fragment propus, încărcat în diagramă, păstrează un fapt local de proveniență și valorile consumate, fără referință activă spre calendar:

```sop
@snapshot1 sourceSnapshot source.instance="calendar-instance-id" source.id="m1" source.version="state-17" captured.label="Review"
@n1 node label="Review" provenance=$snapshot1
```

`source.instance` păstrează identitatea imutabilă a calendarului; `source.id` și `source.version` identifică faptul și versiunea citite. Sunt valori istorice, nu legături `$` care ar cere existența curentă a ședinței. `captured.label` este valoarea copiată pentru acest exemplu. Nodul `n1` are o singură referință activă, `$snapshot1`, către înregistrarea locală existentă. Schema finală a instantaneului trebuie să declare toate valorile utilizate la construire; pentru un grafic agregat nu ar ajunge numai eticheta unei ședințe.

Dacă sursa dispare, nodul și proveniența sa rămân consultabile. „Update the chart” cere o nouă citire a calendarului; în lipsa lui, actualizarea este refuzată, iar graficul istoric se păstrează. În schimb, inserția activă a desenului nu poate fi activată fără ținta sa. Deosebirea rezultă din tipurile de date declarate, nu din tratarea arbitrară a unei referințe nerezolvate drept text.

Într-o regulă, o referință la un pattern, precum `$p.node`, are un rol diferit: identifică pattern-ul declarat în schemă. La evaluare poate desemna faptul găsit de acel pattern. Secțiunile 3.4–3.5 urmăresc exact această legare. Numele fișierului nu schimbă sensul lui `$`.

### 2.6.2 Organizarea pe disc — contract propus

Organizarea proiectului trebuie să poată furniza spații de nume implicite. Propunerea este ca încărcătorul proiectului să citească un descriptor de proiect (manifest): o declarație a rădăcinii proiectului, modulelor, importurilor și instanțelor. Descriptorul poate deduce numele inițiale din căi relative. Forma concretă a descriptorului rămâne de stabilit; tabelul următor descrie contractul, nu o funcționalitate implementată.

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

| Situație la încărcare sau copiere | Comportamentul propus |
|---|---|
| Două căi diferite deduc același nume de instanță | Se refuză deducerea ambiguă; descriptorul trebuie să declare nume distincte. Regula acoperă și diferențele numai de majuscule pe un sistem de fișiere care nu le distinge. |
| Calendarul este mutat în afara rădăcinilor declarate, iar diagrama conține `$calendar::m1` | Activarea contextului care conține referința se refuză, cu sursa și ținta lipsă în diagnostic. Nu se alterează fișierele salvate și nu se prezintă contextul ca valid. |
| O copie independentă are referințe spre o instanță din afara copiei | Referințele externe își păstrează ținta originală numai dacă descriptorul copiei declară explicit dependența externă. Altfel copierea se refuză înainte de publicarea copiei. |
| Aceeași instanță este repartizată în mai multe fișiere | Fiecare fapt are o singură destinație declarată. Salvarea nu dublează faptul în fișiere concurente. |

Coliziunea de nume și coliziunea de identități sunt erori diferite. `instances/diagram/main.sop` și `instances/diagram.sop` pot deduce amândouă numele `diagram` fără să reprezinte aceeași instanță. Încărcătorul nu rezolvă această situație alegând primul fișier găsit. De asemenea, numele diferite nu autorizează încărcarea de două ori a aceleiași identități cu stări incompatibile.

Politica referinței lipsă păstrează cerința R8: o legătură factuală activă trebuie să aibă țintă. Un grafic salvat ca instantaneu poate rămâne consultabil fără calendar dacă proveniența lui este o înregistrare istorică autonomă, cu identitatea sursei, versiunea citită și valorile folosite. Acea înregistrare nu este o referință factuală activă spre un obiect absent. Formatul ei trebuie declarat distinct; exemplul `drawing=$drawing::scene1` presupune ținta disponibilă, în timp ce `sourceSnapshot` păstrează date istorice locale. Afișarea unui rezultat istoric nu autorizează actualizarea lui fără reîncărcarea sursei.

### 2.6.3 Sublumi și limitele vizibilității

Un subdirector nu este automat o sublume. Putem împărți o diagramă în fișiere doar pentru organizare, fără să schimbăm ce văd regulile. O **sublume (subworld)** există când este declarată o instanță distinctă, cu stare și identitate proprii, legată de instanța care o conține. Conținerea nu înseamnă automat import, moștenire de tipuri sau acces la toate faptele.

În demo, cele patru zone nu cer automat o ierarhie de sublumi. Un document care încorporează un desen poate justifica o asemenea compunere: documentul păstrează locul și dimensiunea inserției, iar desenul își păstrează propria schemă și stare. O imagine statică inserată în document este însă doar o resursă; nu devine sublume pentru că are un fișier separat.

Pentru a reuni date din două instanțe, un context de compunere declară ce scheme și ce fapte citește, la ce versiuni și cu ce drept de modificare. Referințele între lumi sunt explicite. Nu se leagă două fapte numai fiindcă numele local sau o valoare textuală coincid. Excepțiile intenționate, precum tipurile partajate, trebuie declarate; mecanismul existent folosește `shared=true` pentru participarea faptelor unui tip între spații de nume.

Firele schemei au identități în module; spațiul de nume al faptelor nu trebuie confundat cu calificarea tipurilor. `diagram.node` poate fi un tip public, iar `diagram::n1` un fapt. Punctul și `::` au roluri distincte. Nici `core.namespace`, în implementarea de astăzi, nu declară un spațiu de nume de instanță: el permite un prefix de chei. Acest nume istoric trebuie schimbat sau explicat până la migrare.

---

# 3. Schema unei lumi

Capitolul acesta descrie tipurile predefinite existente ale limbajului și, separat, contractele propuse de validare: tipurile de fire cu care se scrie o schemă. Pentru fiecare se spune la ce folosește, se dă tabelul complet al cheilor și un exemplu. Ordinea este de la cele folosite cel mai des.

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
| `is` | **(propus)** Conceptul general din lumea legendelor pe care îl realizează tipul (secțiunea 4.7). |

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

Tabelul de mai jos este complet: toate cheile pe care le poate avea astăzi un fir `core.slot`, urmate de cele propuse.

| Cheia | Ce spune |
|---|---|
| `of` | Numele tipului căruia îi aparține cheia. Obligatorie. |
| `key` | Numele cheii. Obligatorie. |
| `required` | `true`: cheia este obligatorie. Un fir de acest tip căruia îi lipsește are o cheie deschisă (secțiunea 3.3). |
| `many` | `true`: cheia poate avea mai multe valori. Fără ea, una singură. |
| `kind` | Felul valorii, când valoarea este scrisă direct. Valorile posibile sunt în tabelul următor. Poate fi repetată; valoarea trebuie să se potrivească cu unul dintre feluri. |
| `type` | Numele unui tip: valoarea trebuie să fie o referință la un fir de acel tip. Poate fi repetată. |
| `enum` | O valoare permisă; repetată, lista valorilor permise. *Există astăzi. În forma propusă nu se mai folosește pentru cuvinte ca nume de culori sau de forme (secțiunea 4.4).* |
| `min`, `max` | Marginile, pentru valori care sunt numere sau cantități. |
| `step` | Împreună cu `min` și `max`: valorile permise sunt `min`, `min+step` și așa mai departe. |
| `default` | Valoarea presupusă când nimeni nu a dat una. *Există astăzi. În forma propusă, valorile obișnuite stau în cunoaștere, ca regiuni (secțiunea 6.6).* |
| `ask` | Textul întrebării de pus când cheia este deschisă. *Există astăzi. În forma propusă, întrebarea vine din conceptul cheii și nu se mai scrie pe fiecare slot (secțiunea 6.4).* |
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
| `means` | **(propus)** Conceptul general pe care îl realizează cheia (secțiunea 4.7). |
| `space`, `relation`, `role`, `part`, `unit` | **(propus)** Precizarea conceptului: în ce spațiu este valoarea, ce relație, ce rol, ce parte a timpului, ce unitate de măsură (secțiunea 4.7). |

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
| `point` | **(propus)** Un punct într-un spațiu conceptual: câte un număr pentru fiecare axă (secțiunea 4.4). Astăzi un punct se scrie ca mai multe numere (`many=true`) sau ca `json`. |

**Moștenirea sloturilor.** Un slot declarat pentru un tip este valabil pentru toate tipurile care se trag din el. Un tip mai particular poate declara din nou aceeași cheie; atunci este valabilă declarația cea mai apropiată.

## 3.3 Cheile deschise

**Ce sunt.** Să presupunem că schema declară cheia `at` a tipului `drawn` ca obligatorie, iar în lume apare faptul `@f2 drawn size=1`, fără `at`. Biblioteca nu refuză acest fapt. Îl primește și ține minte că îi lipsește ceva. O cheie pe care schema o declară obligatorie și care nu are încă valoare pe un fapt se numește **cheie deschisă (open key)**.

**De ce există.** Într-o conversație, aceasta este situația obișnuită, nu o greșeală: omul spune „draw a fish” și nu spune unde. Dacă faptele incomplete ar fi refuzate, aplicația nu ar avea unde să țină ce a înțeles până în acel moment. Cheia deschisă este felul în care lumea ține, într-o formă pe care programul o poate număra, răspunsul la întrebarea „ce mai trebuie hotărât?”.

**Ce se face cu ele.** Biblioteca oferă patru operații asupra cheilor deschise.

| Operația | Ce face |
|---|---|
| lista | Dă toate cheile deschise ale lumii sau ale unui fir: ce fir, ce cheie și, dacă slotul are `ask`, întrebarea. |
| completarea (complete) | Pentru fiecare cheie deschisă calculează ce valori mai sunt permise de schemă. Dacă a rămas una singură, o pune. |
| sfatul | Fără să schimbe nimic, spune ce se poate face pentru fiecare cheie deschisă: ce valoare s-ar putea pune sau ce întrebare ar trebui pusă omului. |
| rezolvarea (solve) | Caută valori pentru toate cheile deschise deodată, astfel încât nicio regulă să nu fie încălcată. Este pentru cazul în care cheile depind una de alta: orele și sălile tuturor ședințelor unei săptămâni. |

În conversație, aceste operații sunt folosite în ordine: întâi se încearcă completarea din ce se știe (secțiunile 6.6 și 6.8), iar omul este întrebat numai dacă nimic nu poate alege (secțiunea 6.4).

**Legătura cu variabilele.** Cheia deschisă și variabila par același lucru, fiindcă amândouă sunt „un loc fără valoare”. Sunt lucruri diferite. Variabila (secțiunea 3.4) stă într-o regulă, în schemă, și înseamnă „oricare ar fi valoarea”; nu lipsește nimic, este felul de a scrie o regulă generală. Cheia deschisă stă pe un fapt și înseamnă „aici trebuie o valoare și încă nu o știm”. Cele două se întâlnesc numai în operația de rezolvare, care tratează cheile deschise ca pe necunoscutele unei probleme și caută valori care mulțumesc toate regulile.

## 3.4 Pattern-uri, variabile și legarea la fapte

Un **pattern (model de potrivire)** este o condiție structurală de căutare a faptelor. Nu este un model de învățare automată, o imagine și nici un exemplu pe care programul trebuie să îl imite. Spune ce tip de fapt căutăm și ce relații trebuie să aibă valorile lui. În continuare folosim termenul tehnic „pattern” pentru a evita aceste confuzii.

Un fapt spune „acest nod există și are această culoare”. Un pattern spune „găsește un nod cu această culoare”. Amândouă folosesc sintaxa firelor, însă au roluri semantice diferite. În mecanismul existent, un fir numit de o regulă drept condiție este înregistrat ca pattern în schema acelei reguli; nu este introdus ca obiect în starea diagramei. Simpla prezență a semnului `?` nu este o declarație suficientă a acestui rol.

Să avem următoarele fapte ale diagramei:

```
@n1 node label="Review" colour=red
@n2 node label="Decision" colour=blue
@n3 node label="Finish" colour=red
```

`node` este aici numele tipului de obiect grafic „nod de diagramă”. Nu este un cuvânt rezervat al limbajului. `n1`, `n2` și `n3` sunt identități ale celor trei obiecte. `label` și `colour` sunt cheile lor; schema trebuie să le permită. Un pattern folosit de o regulă poate fi:

```
@p.red node colour=red label=?text
```

`p.red` numește condiția de căutare, nu un al patrulea nod. Căutarea se limitează la tipul `node` și descendenții lui. Constanta `colour=red` trebuie să coincidă cu valoarea faptului. Variabila `?text` preia valoarea cheii `label`. O cheie pe care pattern-ul nu o menționează nu este verificată de acel pattern.

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

```
@p.node  node
@p.in    link to=$p.node
@t.start node core.on=$p.node start=true
@r.start core.rule when=$p.node not=$p.in then=$t.start
```

Primul fir definește pattern-ul `p.node`: caută orice fapt de tip `node`. Nu îi cere nicio cheie, deci poate găsi orice nod. Al doilea definește pattern-ul `p.in`: caută un fapt de tip `link`, adică o legătură din diagramă, al cărui capăt `to` este faptul găsit de `p.node`. Aici `$p.node` nu este textul `p.node` și nici un nod din diagramă cu acest nume. Motorul îl interpretează ca referință la faptul deja asociat acelui pattern.

Al treilea fir este un **șablon de concluzie (conclusion template)**. `core.on=$p.node` cere adăugarea cheii `start=true` pe nodul găsit, nu crearea unui obiect numit `t.start`. Al patrulea fir leagă piesele: `when=$p.node` numește condiția pozitivă, `not=$p.in` numește condiția negativă, iar `then=$t.start` numește concluzia.

Prin urmare, `when=$p.node` este o referință reală la o declarație din schemă. Nu este o formulă incompletă și nu cere programului să ghicească ce înseamnă „model”. Încărcătorul rezolvă `p.node` în unitatea regulii. Dacă declarația lipsește sau nu poate fi folosită drept pattern, schema trebuie refuzată. Prefixele `p.` și `t.` sunt convenții de citire; rolul vine din folosirea declarației de către regulă.

Pentru a urmări execuția, încărcăm regula împreună cu schema tipurilor, apoi spunem aceste fapte:

```
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

```
@p.m1   meeting people=?p start=?s1 length=?l1
@p.m2   meeting people=?p start=?s2 length=?l2
@c.two  core.check fn=neq args=$p.m1 args=$p.m2
@c.hit  core.check fn=overlaps args=?s1 args=?l1 args=?s2 args=?l2
@d.busy core.deny when=$p.m1 when=$p.m2 if=$c.two if=$c.hit why="?p already has something at that time"
```

Primele două fire sunt modele de ședință. Variabila `?p` apare în amândouă, deci cele două ședințe au același participant. Al treilea fir este o condiție: cele două ședințe găsite nu sunt una și aceeași. Al patrulea este a doua condiție: intervalele lor se suprapun. Al cincilea este interdicția: dacă amândouă modelele se potrivesc și amândouă condițiile sunt adevărate, schimbarea este refuzată. Textul din `why` este motivul; `?p` este înlocuit cu valoarea variabilei.

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

**Trei rezultate, nu două (propus).** Astăzi, o schimbare este fie primită, fie refuzată. Aceasta ascunde un caz: o interdicție care nu a putut fi verificată fiindcă îi lipsește o valoare. O ședință fără durată nu poate fi verificată pentru suprapuneri; nu s-a găsit nicio încălcare, dar nici nu se știe că este în regulă. Propunerea este ca verificarea să aibă trei rezultate.

| Rezultatul | Ce înseamnă |
|---|---|
| validă (valid) | Nicio interdicție tare nu este încălcată și toate au putut fi verificate. |
| nevalidă (invalid) | Cel puțin o interdicție tare este încălcată. |
| nedeterminată (undetermined) | Nicio încălcare găsită, dar cel puțin o interdicție tare nu a putut fi verificată. |

Regula care decurge: înainte de a executa ceva, interdicțiile tari care privesc lucrurile schimbate trebuie să fi fost verificate până la capăt. Dacă una rămâne nedeterminată, nu se execută nimic și se cere valoarea care lipsește. Fără această regulă, aplicația ar pune ședința fără durată peste alta și ar spune că a reușit.

**Întrebările.** Unei lumi i se pot pune întrebări scrise ca modele: „care sunt nodurile și ce etichetă are fiecare?”. Răspunsul este lista potrivirilor. La o întrebare de felul „există…?”, răspunsul este da, nu sau nu se știe.

**Anularea.** O lume ține minte fiecare schimbare și o poate anula sau reface.

**Copia de încercare.** O lume poate fi copiată. O **copie (fork)** este o a doua lume, la început identică, în care se poate încerca o schimbare fără a atinge originalul. Aplicația o folosește ca să încerce un plan înainte de a-l executa.

### 3.9.1 Informație incompletă, negație și validare

Absența unei valori nu spune de ce lipsește aceasta. Într-un calendar, sala poate să nu fie aleasă încă sau ședința poate să nu aibă nevoie de sală. Prima situație cere completare; a doua este o informație pozitivă despre lipsa unei resurse. Dacă le confundăm, fie întrebăm inutil, fie declarăm disponibilă o rezervare pe care încă nu o putem verifica.

Trebuie separate și două întrebări: „am găsit o încălcare?” și „am suficiente informații ca să dovedesc validitatea?”. Un rezultat fără încălcări găsite nu răspunde automat afirmativ la a doua întrebare. Starea valorii, potrivirea unui pattern și concluzia verificării trebuie deci urmărite separat.

O cheie a unui fapt este în una din trei stări semantice. Are o valoare. Nu are valoare, și atunci valoarea este necunoscută. Sau se știe că nu are: aceasta se scrie cu valoarea `none` **(propus)**, permisă numai dacă slotul spune `none=allowed`. În această notație provizorie, o ședință fără sală este scrisă `room=none`; lipsa cheii `room` înseamnă că nu știm încă sala. Forma finală trebuie să distingă absența cunoscută de atomul obișnuit `none`, care ar putea fi un nume valid. Exemplele de aici explică distincția semantică; nu stabilesc încă serializarea finală. *(R9)*

Potrivirea unui pattern depinde de informația efectiv prezentă. Un pattern care cere `room=?r` se potrivește numai cu fapte a căror cheie `room` are o valoare. În contractul propus, nu se potrivește nici cu „necunoscut”, nici cu absența cunoscută. Extinderea testului `core.absent=room` la ambele stări trebuie legată de reprezentarea finală a absenței; un atom obișnuit `none` nu are astăzi această semantică specială. *(R10)*

`not=` vorbește despre ce ține lumea acum. O regulă cu `not=$p` se aplică atunci când niciun fapt de acum nu se potrivește cu `p`. Nu afirmă că așa ceva nu există în realitate. De aceea un fir dedus printr-un `not=` este retras de îndată ce apare faptul care lipsea. *(R11)*

Întrebarea „există?” are trei răspunsuri. Da, dacă un fapt se potrivește. Nu, dacă niciunul nu se potrivește și tipul este declarat `complete`. Nu se știe, în rest. *(R12)*

Verificarea unei schimbări privește toate interdicțiile ale căror modele se pot potrivi cu cel puțin un fir atins de schimbare (adăugat, modificat sau șters). Fiindcă modelele unei interdicții se leagă între ele prin variabile, aici intră și firele neatinse: la mutarea unei ședințe sunt verificate toate ședințele care au aceeași sală sau un participant comun. *(R13)*

Verificarea unei interdicții este nedeterminată când un fir atins se potrivește cu un model al ei la toate cheile pe care le are, dar îi lipsește o cheie pe care modelul sau o condiție a interdicției o citește. *(R14)*

| Starea ședinței noi | Rezultatul verificării suprapunerii |
|---|---|
| are început și durată; nu se suprapune | Validă. |
| are început și durată; se suprapune cu alta a Anei | Nevalidă, cu încălcarea care numește cele două ședințe. |
| are început, dar durata este necunoscută | Nedeterminată. Nu se execută; se cere durata. |
| are `room=none` | Interdicția despre săli nu o privește. Cea despre oameni rămâne. |
| primește două ore de început diferite | Refuzată ca `conflict`, înainte de orice interdicție. |

În tabelul ședinței, „nedeterminată” este un rezultat propriu al verificării. Nu este o eroare de parsare și nici o interdicție demonstrată. De exemplu, începutul 10:30 fără durată nu spune dacă ședința ajunge până la următoarea rezervare. Aplicația păstrează cererea incompletă și caută informația necesară, fără să pretindă că a rezervat intervalul.

Completitudinea privește un domeniu de căutare identificat: instanța, tipurile și starea încărcată. O listă completă de ședințe pentru un calendar nu dovedește că au fost încărcate toate regulile de cunoaștere. Similar, `not` poate produce o concluzie revocabilă despre starea curentă, dar aceasta nu poate fi prezentată ca adevăr despre date pe care sistemul nu le-a citit.

## 3.10 Câteva precizări

**O valoare care lipsește** înseamnă că nu este cunoscută. Nu înseamnă „nu” și nu înseamnă „fals”. Dacă ședința nu are sală, nu se știe în ce sală este. Un „nu” se scrie explicit.

**O regulă căreia îi lipsește o valoare** nu se potrivește. Nu presupune nimic în locul valorii.

**Un fapt nu poate fi folosit ca model.** O regulă poate numi numai fire din același text cu ea. Un fir cu identificatorul unui model, spus mai târziu de unul singur, este un fapt și nu are legătură cu modelul.

**Un fir dedus dispare** când nu mai are niciun temei, adică atunci când nicio regulă nu îl mai cere.

---

# 4. Lumea legendelor (propus)

Tot acest capitol este o propunere. Nimic din el nu există încă în bibliotecă sub această formă; există numai bucăți nelegate între ele, răspândite în bazele de cunoaștere.

## 4.1 Problema

Să luăm patru sloturi, câte unul din fiecare domeniu, scrise cu ce există astăzi.

```
@s1 core.slot of=drawn   key=at    kind=number many=true
@s2 core.slot of=node    key=at    kind=number many=true
@s3 core.slot of=section key=order kind=integer
@s4 core.slot of=meeting key=room  type=room
```

Poziția unui lucru desenat, poziția unui nod, locul unei secțiuni în text și sala unei ședințe răspund toate la aceeași întrebare: **unde?** Biblioteca nu are de unde să știe aceasta. Pentru ea sunt patru chei fără nicio legătură între ele. Urmarea este că tot ce ține de „unde” trebuie scris separat pentru fiecare: ce întrebare se pune când lipsește valoarea, cum se înțelege „move it up”, cum se înțelege „in the sky” spus singur, cum se spune în răspuns unde a ajuns lucrul. Și încă o dată pentru fiecare domeniu nou.

Aceasta este cauza cârpelilor de până acum. Declarațiile au fost scrise la nivelul fiecărui domeniu, uneori al fiecărui lucru, astfel încât fiecare caz nou a cerut un rând nou.

## 4.2 Soluția

Se adaugă o singură lume, numită **lumea legendelor (legend world)**, care conține conceptele generale: loc, timp, însușire, cantitate și celelalte. Numele vine de la legenda unei hărți, care spune ce înseamnă fiecare semn. Lumea legendelor nu conține lucruri. Conține numai conceptele prin care se descrie orice altă lume.

Fiecare tip și fiecare slot din orice altă lume spune apoi ce concept din lumea legendelor realizează. Cele patru sloturi de mai sus primesc toate aceeași pereche, `means=place`. Din acel moment, tot ce știe biblioteca despre locuri li se aplică tuturor, fără niciun alt rând. Cum se scrie aceasta este în secțiunea 4.7.

## 4.3 Conceptele generale

Conceptele sunt puține, fiindcă sunt foarte abstracte. Se găsesc întrebând ce se poate întreba despre orice lucru și despre orice întâmplare, oricare ar fi lumea. Tabelul de mai jos este lista propusă, completă. Prima coloană este numele conceptului așa cum se scrie în fire.

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

**Problema.** Cum se declară valorile permise ale culorii unui lucru desenat? Cu ce există astăzi, răspunsul este o listă: `enum=red enum=blue enum=green`. Lista are trei neajunsuri care se văd imediat în folosire. Omul spune „turquoise”, care nu este în listă, și aplicația nu are ce face. Omul spune „darker”, iar într-o listă de cuvinte „mai închis” nu are niciun înțeles. Și fiecare domeniu ajunge să aibă lista lui, puțin diferită de a celorlalte. În cele 40 de lumi publicate sunt astăzi 336 de sloturi declarate cu asemenea liste.

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

Pe o axă circulară (`kind=angle`, cu perioada 360), diferența este drumul cel mai scurt pe cerc, împărțit la jumătate de perioadă. Între nuanțele 350 și 0 diferența este 10/180, adică 0,056. *(R19)*

Distanța dintre două puncte este `sqrt(sum(weight_i * delta_i²))`, unde `delta_i` este diferența normalizată pe axa `i`. Ponderile trebuie să fie pozitive; o axă nerelevantă pentru o regiune este omisă din restricția acelei regiuni, nu transformată într-o axă cu distanță nedefinită. *(R20)*

O regiune poate lăsa axe nespuse. „Dark” spune numai `centre.lightness=0.25`; orice nuanță și orice saturație sunt primite. Distanța până la o asemenea regiune se calculează numai pe axele spuse. *(R21)*

În reprezentarea propusă, două regiuni ale aceluiași spațiu pot restrânge axe diferite:

```sop
@rg.dark w.legend.region of=colour name=dark centre.lightness=0.25 spread=0.10
@rg.red w.legend.region of=colour name=red centre.hue=0 centre.saturation=0.9 centre.lightness=0.5 spread=0.12
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

Relația de includere este un rezultat calculat, nu o afirmație primită fără dovadă. Poate servi la explicarea relației dintre două regiuni; găsirea unui pește albastru folosește direct apartenența punctului său la regiunea albastră. Cheia `inside` se retrage din propunerea de declarație: o relație derivată poate fi memorată împreună cu dovada și versiunile regiunilor, apoi invalidată când acestea se schimbă.

Când două valori posibile sunt la fel de aproape de cea cerută, se face una din două, după caracterul valorii (secțiunea 6.6). Dacă valoarea este o cerință a omului, aplicația le oferă pe amândouă și întreabă: la zece și jumătate cerut, cu zece și unsprezece libere, „10:00 or 11:00?”. Dacă este o presupunere a aplicației, se ia cea mai mică pe prima axă și se spune. *(R25)*

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

Dacă doi strămoși la aceeași depărtare au grafuri diferite, aplicația întreabă.

Moștenirea unei structuri nu schimbă identitatea semantică a obiectului. Un gen cunoscut ca specializare a textului poate primi structura disponibilă pentru text și poate rămâne de genul cerut. Sistemul trebuie să spună ce structură a reutilizat și ce particularități nu sunt cunoscute; nu poate afirma că a respectat cerințe pe care nu le deține.

Pentru a calcula apropierea a două grafuri, părțile trebuie aliniate prin conceptele lor, nu prin identificatorii locali ai declarațiilor. Două secțiuni numite diferit pot realiza același rol, iar două părți cu aceeași etichetă pot avea roluri diferite. Formula de suprapunere presupune această corespondență; în lipsa ei, un scor numeric ar ascunde o comparație nedefinită.

### 4.4.3 Sisteme de coordonate și semantica timpului

Un număr de poziție nu poate fi interpretat fără un reper, iar o oră locală nu identifică singură un moment. În ambele cazuri, sistemul trebuie să cunoască regulile prin care reprezentarea este legată de spațiul sau timpul folosit de aplicație. Aceste reguli trebuie păstrate și atunci când datele trec între lumi.

Poziția, relația geometrică, momentul și seria recurentă sunt niveluri distincte. Fiecare cere propriile declarații și propriile verificări înainte de acțiune.

Fiecare spațiu de loc își declară reperul: originea, sensul axelor și unitatea. Pagina are originea în colțul din stânga sus, axa orizontală spre dreapta, axa verticală în jos, iar unitatea este unitatea paginii. „Above” înseamnă deci un număr mai mic pe axa verticală. Poziția unui lucru este întotdeauna în reperul paginii, chiar dacă lucrul este „în” altul. *(R44)*

Relațiile de loc sunt definite prin numere, în funcția `test` a fiecărei relații (R15). „Near”: distanța dintre marginile celor două lucruri este mai mică decât o fracțiune din diagonala paginii (propus 0,15). „Above”: mai sus pe axa verticală și suprapus pe cea orizontală. *(R45)*

Pentru a declara verificarea geometrică, o relație numește funcția care o decide. Următorul fir este propus, iar `page.above` este numele unui contract de funcție ce trebuie furnizat de adaptorul geometric:

```sop
@rel.above w.legend.relation name=above space=page test=page.above
```

`name=above` numește relația; `space=page` stabilește reperul; `test=page.above` leagă relația de operația de verificare. Funcția primește limitele geometrice observate ale obiectului și țintei în același reper. În convenția acestui exemplu, întoarce adevărat când marginea de jos a obiectului este cel mult marginea de sus a țintei și proiecțiile lor orizontale se intersectează pe o lungime pozitivă. Lipsa limitelor geometrice produce un rezultat nedeterminat, nu fals. Firul nu implementează funcția prin simpla numire: dacă operația lipsește, relația nu poate fi verificată.

| Limite verticale și proiecții orizontale | Rezultatul testului `above` |
|---|---|
| Obiectul are baza la 20, ținta începe la 30; proiecțiile se suprapun | Adevărat: obiectul este deasupra și există suprapunere orizontală. |
| Obiectul are baza la 20, ținta începe la 30; proiecțiile sunt disjuncte | Fals: poziția este mai sus, dar nu satisface relația declarată. |
| Limitele țintei nu sunt disponibile | Nedeterminat: nu există date suficiente pentru test. |

În calendar, o ședință ține un moment absolut de început și o durată. Calendarul își declară fusul orar; orele spuse de om sunt înțelese în acel fus. Intervalul este semideschis, `[început, sfârșit)`: își cuprinde începutul și nu își cuprinde sfârșitul. Astfel, o ședință care se termină la 11:00 și una care începe la 11:00 nu se suprapun, deci sala este liberă. *(R46)*

La trecerea între orele sezoniere, dacă ora cerută nu există în ziua aceea, aplicația refuză și spune de ce. Dacă există de două ori, întreabă care dintre ele. *(R47)*

Recurența descrie o serie de apariții ale unei ședințe. Seria păstrează regula de repetare, fusul orar și excepțiile; fiecare apariție are identitate stabilă. Modificarea uneia trebuie deosebită de modificarea întregii serii. Verificarea conflictelor privește aparițiile din intervalul verificat, nu o expansiune infinită. O serie fără sfârșit nu poate fi declarată liberă pentru tot viitorul după verificarea unui număr finit de apariții. Reprezentarea persistentă trebuie să lege fiecare apariție de serie și de excepțiile aplicabile. Formatul complet al acestor declarații rămâne deschis; comportamentul editării și al verificării este descris mai jos. *(R48)*

Durata și fusul orar trebuie cunoscute înainte de compararea momentelor; textul „Monday at ten” singur nu este o reprezentare persistentă suficientă.

Pentru recurență, „move the Monday meeting” nu stabilește singur dacă se modifică o apariție, întreaga serie sau aparițiile de acum înainte. Dacă întinderea editării nu rezultă explicit din cerere și context, aplicația cere această alegere. O verificare pe următoarele opt zile de luni se raportează ca atare, nu ca disponibilitate perpetuă. Anularea restaurează regula seriei, excepțiile și aparițiile afectate de editare, păstrând identitățile aparițiilor neschimbate.

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

Pasul unui comparativ este declarat pe axă, cu `step`. Pe o axă `ratio` este un factor (propus 1,25); pe o axă `interval` este o mărime în unitățile axei (propus: 30 de minute pentru oră, o zecime din pagină pentru poziție). „Much bigger” face doi pași. *(R31)*

Axa declară explicit felul scării și sensul pasului. Exemplul următor este propus și presupune spațiul `size` deja declarat:

```sop
@ax.size w.legend.axis of=size name=ratio min=0 max=10 scale=ratio step=1.25
```

`of=size` alege spațiul, iar `name=ratio` numește axa. `scale=ratio` spune că un pas crescător înmulțește valoarea cu 1,25; un pas descrescător o împarte la 1,25. De la 2 rezultă 2,5 în sus sau 1,6 în jos. Limitele 0 și 10 delimitează domeniul acestui exemplu, nu toate mărimile posibile din orice aplicație. Pe o axă `scale=interval`, aceeași cheie `step` ar desemna o deplasare aditivă în unitatea declarată. Cele două semantici nu se aleg după numele axei.

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

**Problema.** Astăzi, modulele standard cunosc paisprezece acte, cu nume fixe (secțiunea 6.1), iar fiecare domeniu spune pentru fiecare ce face. Nicăieri nu este scris ce înseamnă un act în general: ce trebuie să fie adevărat înainte și ce trebuie să fie adevărat după. De aceea aplicația nu poate verifica singură că a făcut ce a spus că face.

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
| `exists=<rol>` | Lucrul din acel rol există în stare. |
| `absent=<rol>` | Lucrul din acel rol nu există în stare. |
| `has=<rol>,<rol>` | Lucrul din primul rol are, la însușirea din al doilea rol, valoarea cerută. |
| `holds=<rol>,<rol>` | Relația cerută ține între lucrurile din cele două roluri. |

```
@act.make   w.legend.act name=make   change=appear    role=result              after.exists=result
@act.remove w.legend.act name=remove change=disappear role=object              before.exists=object after.absent=object
@act.change w.legend.act name=change change=quality   role=object role=quality before.exists=object after.has=object,quality
@act.place  w.legend.act name=place  change=relation  role=object role=goal    before.exists=object after.holds=object,goal
```

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

**Regula.** Fiecare fir `core.type` primește cheia `is`, cu numele unui concept. Fiecare fir `core.slot` primește cheia `means`, cu numele unui concept, și, după concept, o a doua cheie care îl precizează. Un slot fără `means` este refuzat la verificarea schemei.

| `means=` | Cheia de precizare și valorile ei |
|---|---|
| `kind` | Niciuna. Valoarea cheii este un fel din arborele felurilor. |
| `name` | Niciuna. |
| `quality` | `space=` numele spațiului conceptual: `size`, `colour`, `shape`, `tone` și altele declarate. |
| `quantity` | `unit=` unitatea de măsură, dacă are: `word`, `minute`. Sau `counts=` felul de lucruri pe care le numără. |
| `place` | Una din două. `space=` numele spațiului în care este poziția: `page`, `order`. Sau `relation=` numele relației cu alt lucru: `in`, `on`, `next_to`, `above`, `under`, `between`, `before`, `after`. |
| `time` | `part=` care parte a timpului: `start`, `end`, `duration`, `repeat`. |
| `part` | Niciuna. Valoarea este întregul din care face parte lucrul. |
| `role` | `role=` numele rolului: `source`, `goal`, `participant`, `owner`. |
| `topic`, `manner`, `cause`, `purpose` | Niciuna. |

**Exemplu.** Cele patru sloturi din secțiunea 4.1, cu legarea adăugată.

```
@s1 core.slot of=drawn   key=at    kind=point  means=place space=page
@s2 core.slot of=node    key=at    kind=point  means=place space=page
@s3 core.slot of=section key=order kind=number means=place space=order
@s4 core.slot of=meeting key=room  type=room   means=place relation=in
```

**Ce primește un slot legat.** Niciunul dintre aceste sloturi nu are `ask`, `enum` sau `default`. Tot ce țineau acele chei vine acum din concept. Pentru `means=place`, cele patru chei primesc deodată:

| Ce se primește | Cum arată |
|---|---|
| întrebarea, când valoarea lipsește | „Where?”, făcută mai precisă de tipul valorii: „In which room?” |
| înțelegerea unui loc spus singur | „in the sky”, „at the top”, „after the introduction”, „in the big room”. |
| găsirea unui lucru după loc | „the fish in the pond”, „the node under Start”, „the meeting in room 2”. |
| mutarea | „move it up”, „move it earlier in the text”. |
| răspunsul | Locul este spus în același fel în toate domeniile. |

La fel, un slot cu `means=quality` și un spațiu primește comparativele, superlativele („the biggest one”), comparația cu alt lucru („as big as the house”), cuvintele de grad și alegerea celei mai apropiate valori posibile. Un slot cu `means=time` primește „later”, „earlier”, „longer”, „on Friday”.

**Locul și timpul.** Un loc poate fi spus în patru feluri, aceleași în orice domeniu: ca poziție (un punct), ca regiune cu nume (sus, jos, centru; începutul unui text), ca relație cu alt lucru (pe, în, lângă, după) sau ca pas față de locul de acum (în sus, mai la stânga). Fiecare relație are o definiție prin numere: „lângă” este o distanță mică; „deasupra” este mai sus pe axa verticală. Timpul are aceleași forme pe o singură axă: un moment, un interval, o durată, o ordine, o repetare. „In the afternoon” este o regiune pe axa orelor, la fel cum „red” este o regiune în spațiul culorilor.

## 4.8 Tipurile de fire ale lumii legendelor

Acestea sunt tipurile de fire propuse pentru a scrie lumea legendelor și conținutul legat de ea. Numele și cheile sunt o propunere pe care sesiunea bibliotecii o va fixa.

**`w.legend.space`** declară un spațiu conceptual.

| Cheia | Ce spune |
|---|---|
| `name` | Numele spațiului: `colour`, `size`, `shape`, `page`, `tone`. |
| `form` | `axes` sau `graph`: cu axe numerice sau ca graf de părți. |

**`w.legend.axis`** declară o axă a unui spațiu.

| Cheia | Ce spune |
|---|---|
| `of` | Numele spațiului. |
| `name` | Numele axei: `hue`, `saturation`, `lightness`. |
| `min`, `max` | Marginile axei. |
| `kind` | `angle` pentru o axă circulară, cum este nuanța; altfel lipsește. |
| `scale` | `ratio` pentru pași multiplicativi; `interval` pentru pași aditivi. |
| `step` | Factorul sau deplasarea unui pas, conform scării; vezi 4.5.1. |
| `order`, `weight` | Poziția axei în serializarea unui punct și ponderea pozitivă în metrică. |
| `normalisation` | Lungimea pozitivă de normalizare, în unitatea axei; înlocuiește numitorul `max−min` când este declarată. Pentru o axă liniară fără limite finite este obligatorie dacă se cere distanța normalizată. Vezi 8.2.1. |

**`w.legend.region`** declară o regiune a unui spațiu, adică înțelesul unui cuvânt. Firele de acest tip stau în bazele de cunoaștere.

| Cheia | Ce spune |
|---|---|
| `of` | Numele spațiului. |
| `name` | Numele regiunii: `red`, `circle`, `formal`, `morning`. |
| `centre.<axă>` | Valoarea centrului pe fiecare axă. |
| `spread` | Întinderea în jurul centrului. |
| includere calculată | Nu este o cheie declarată. Se deduce numai când testul R24 dovedește includerea. |

**`w.legend.degree`** declară un cuvânt de grad.

| Cheia | Ce spune |
|---|---|
| `word` | Cuvântul: `big`, `huge`, `small`, `long`. |
| `direction` | `up` sau `down`. |
| `factor` | Factorul de pornire față de clasa de comparație. |

**`w.legend.act`** declară un act.

| Cheia | Ce spune |
|---|---|
| `name` | Numele actului: `make`, `remove`, `change`, `place`. |
| `change` | Schimbarea de bază: `appear`, `disappear`, `quality`, `relation`. |
| `role` | Un rol al actului. Repetată. |
| `before` | Ce trebuie să fie adevărat înainte. |
| `after` | Ce trebuie să fie adevărat după. |

Un exemplu din fiecare:

```
@sp.colour w.legend.space  name=colour form=axes
@ax.hue    w.legend.axis   of=colour name=hue kind=angle
@rg.red    w.legend.region of=colour name=red centre.hue=0 centre.saturation=0.9 centre.lightness=0.5 spread=0.12
@dg.big    w.legend.degree word=big direction=up factor=1.6
@act.place w.legend.act    name=place change=relation role=object role=goal before="object exists" after="object is at goal"
```

Primul fir declară spațiul culorilor. Al doilea, una dintre axele lui. Al treilea, regiunea numită „red”, cu centrul ei. Al patrulea, cuvântul de grad „big”. Al cincilea, actul „a așeza”: o schimbare de relație, cu două roluri, lucrul și ținta, cu condiția dinainte și cu cea de după.

### 4.8.1 Metamodelul conceptual și ordinea de încărcare

Lumea legendelor este vocabularul prin care schemele unor domenii diferite își declară semnificația. Fără această legătură, `at`, `position` și `start` sunt doar nume locale. Legarea lor de concepte permite alegerea operațiilor potrivite: poziția se măsoară într-un spațiu, începutul este un moment, iar participantul joacă un rol într-un act.

Metamodelul trebuie să poată fi încărcat fără a presupune că el există deja. De aceea distingem primitivele limbajului de conceptele descrise cu acele primitive. Tabelul tipurilor arată ce informații declară autorul cunoașterii; regulile de încărcare arată în ce ordine pot fi interpretate.

Tipurile de fire ale lumii legendelor sunt cele din secțiunea 4.8, la care se adaugă patru, pentru ca toate conceptele din secțiunea 4.3 să aibă unde fi declarate. *(R15)*

| Tipul | Ce declară și cu ce chei |
|---|---|
| `w.legend.concept` | Un concept general. Chei: `name`; `group` (grupa din care face parte); `specialises` (conceptul mai general, dacă are unul); `question` (întrebarea generală: „Where?”). |
| `w.legend.role` | Un rol. Chei: `name`; `of` (actul sau relația în care apare). |
| `w.legend.relation` | O relație generală. Chei: `name` (`in`, `on`, `next_to`); `space` (în ce spațiu se măsoară); `inverse`; `test` (funcția care spune, din pozițiile a două lucruri, dacă relația ține). |
| `w.legend.unit` | O unitate de măsură. Chei: `name`; `of` (axa); `factor` (câte unități de bază face). |

Felurile de afirmații, cuprinderea și negația sunt fire `w.legend.concept`. O resursă nu are tip propriu: un tip de lucruri se declară resursă cu `resource=true` pe firul lui `core.type`.

Încărcarea urmează patru straturi, fiecare scris numai cu ce este sub el. Tipurile `core.` sunt fixe, fac parte din limbaj și nu sunt descrise de nimic. Lumea legendelor este scrisă cu `core.type` și `core.slot`; sloturile tipurilor `w.legend.` sunt singurele scutite de cheia `means`. Tiparele și bazele de cunoaștere folosesc lumea legendelor. Instanțele folosesc tiparele. *(R16)*

Suprapunerile aparente sunt specializări. Durata este timp (`means=time part=duration`); fiindcă timpul are o axă, pe ea funcționează și „longer”, ca pentru orice însușire. Participantul este un rol (`role=participant`); că ședința „este a” participanților se deduce, nu se declară a doua oară. Locul unei secțiuni în text este un loc, în spațiul `order`. Regula generală: un slot are un singur `means`; ce mai decurge vine din faptul că acel concept are un spațiu. *(R17)*

Un `w.legend.unit` care declară un factor de conversie furnizează date pentru o operație numerică deja definită; nu inventează singur operația de conversie. În același fel, cheia `test` a unei relații trebuie să desemneze o funcție cu intrări și rezultat cunoscute. Un nume precum `near` fără o asemenea definiție nu permite verificarea distanței.

Ordinea straturilor evită o definiție circulară a cheii `means`: tipurile de bază ale metamodelului sunt definite prin primitive, apoi celelalte scheme își exprimă semnificația prin ele. O durată are un singur concept principal; faptul că permite comparații numerice rezultă din axa asociată, fără duplicarea aceleiași informații în sloturi concurente.

---

# 5. Feluri de lumi și compunerea lor

## 5.1 Trei feluri de lumi, după ce țin în ele

Până acum am spus „lume” pentru orice mulțime de fire verificate. În practică, lumile se împart în trei feluri, după ce conțin și cât de des se schimbă. Împărțirea contează fiindcă cele trei sunt scrise de oameni diferiți, la momente diferite, și sunt refolosite diferit.

Primul fel este **tiparul de lume (world pattern)**. Un tipar este numai schemă: spune ce tipuri de fire există într-un fel de lume, ce sloturi au și ce reguli se aplică. Nu conține niciun lucru anume. Avem patru: tiparul desenului, al diagramei, al documentului și al calendarului. Un tipar se scrie o dată și se schimbă rar. Lumea legendelor (capitolul 4) este și ea un tipar, cel mai general dintre toate.

Al doilea fel este **baza de cunoaștere (knowledge base)**. Ea ține ce se știe în general și nu depinde de nicio pagină anume: că o rață este o pasăre, unde este regiunea „red” în spațiul culorilor, din ce părți este făcută o scrisoare, cât ține de obicei o ședință. Bazele de cunoaștere sunt mari, cresc mereu și sunt folosite de toate domeniile deodată.

Al treilea fel este **instanța de lume (world instance)**. Ea ține starea unui lucru anume, acum: această pagină desenată, această diagramă, această scrisoare, această săptămână din calendar. Se schimbă la fiecare mesaj al omului. O instanță folosește un tipar, care îi spune ce fapte are voie să conțină, și se sprijină pe bazele de cunoaștere.

> **Numele vechi.** În programul și documentele mai vechi, cele trei se numesc *schema lumii* (world schema), *lume de cunoaștere* (knowledge world) și *lume vie* (live world).

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

Pe acest arbore se moștenesc patru lucruri, de sus în jos. Datorită lor, un fel nou adăugat în arbore funcționează imediat, fără alt rând.

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

**Legarea.** Un slot al unei lumi poate ține un lucru din altă lume. Calendarul este exemplul: importă tiparul persoanelor, iar cheia `people` a unei ședințe ține referințe la persoane. Legarea se face întotdeauna de un lucru anume, cu identitatea lui, nu de un nume. Dacă omul spune „Ana” și există două persoane cu acest nume, numele dă doi candidați, iar aplicația întreabă care.

Domeniile aplicației se pot compune între ele prin aceleași operații. O diagramă poate arăta ședințele unei săptămâni; un document poate cuprinde un desen; un grafic poate arăta câte ședințe are fiecare om. În fiecare caz, un slot al unei lumi ține un lucru din cealaltă. O regulă care are nevoie de amândouă lumile stă în lumea care le încarcă pe amândouă.

## 5.4 La ce folosește o lume și fără conversație

Înainte de a trece la conversație, merită văzut că modelul general este util și singur. Trei exemple, câte unul pentru trei dintre domenii.

**Verificarea unui document.** Cunoașterea are graful raportului: titlu, introducere, secțiuni, concluzie, cu concluzia obligatorie. Un document este încărcat ca fapte, câte un fir pentru fiecare parte. Lumea răspunde la trei întrebări: ce lipsește (concluzia), ce este încălcat și ce nu a putut verifica. Poate spune și cu ce gen seamănă cel mai mult documentul, comparând grafurile.

**Găsirea unui orar.** Avem săli, oameni și ședințe care trebuie puse într-o săptămână. Ora și sala fiecărei ședințe sunt chei deschise (secțiunea 3.3). Nu pot fi completate una câte una, fiindcă depind una de alta: dacă pun prima ședință luni la zece, a doua nu mai poate fi acolo. Pentru asemenea situații există un **rezolvitor (solver)**: un program de căutare care încearcă valori pentru toate cheile deschise deodată, până găsește o așezare în care nicio interdicție nu este încălcată și cât mai multe preferințe sunt îndeplinite. Rezolvitorul nu știe nimic despre calendare; lucrează cu orice lume care are chei deschise și reguli.

**Verificarea unei diagrame.** Normele unui flux spun că are un singur început și că la fiecare nod se poate ajunge. Lumea deduce începuturile (regula din secțiunea 3.5) și spune ce nod a rămas nelegat.

---

# 6. Conversația

Capitolul acesta explică al doilea nivel: cum ajunge o propoziție a omului să schimbe ceva și cum se compune răspunsul. Tot ce urmează folosește numai piesele din capitolele dinainte.

## 6.1 Cum este legat un domeniu de programul lui

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

Două lucruri merită observate. Parametrul nu spune doar ce nume are, ci în ce spațiu este valoarea lui și cât din acel spațiu poate realiza unealta. De aici va ști aplicația, mai târziu, că un pește de zece ori mai mare nu se poate desena și că trebuie să aleagă cea mai apropiată mărime posibilă. Și: efectul uneltei nu este scris nicăieri pe unealtă. Unealta `add` realizează actul „a face”, iar ce trebuie să fie adevărat după „a face” s-a spus o dată, în secțiunea 4.6.

**Ce există astăzi și ce este propus.** Tipurile de fire folosite mai sus sunt ale modulelor standard ale bibliotecii (`std.schema` și `std.tool`) și există astăzi. Trei chei din exemplu sunt propuse: `realises=` pe `std.tool.op`, `space=` pe `std.tool.param` și `role=` pe `std.schema.honours`. Tabelele de mai jos dau tipurile așa cum sunt astăzi și spun, la fiecare, ce se propune.

| Tipul din `std.schema` | La ce folosește și ce chei are |
|---|---|
| `std.schema.thing` | Tipul părinte al oricărui lucru dintr-o lume în care se pot face lucruri. Nu are chei proprii. |
| `std.schema.world` | Declară o lume care face lucruri. Chei: `name`, `doc`, `bundle`. |
| `std.schema.kind` | Spune ce acte se pot face cu firele unui tip. Chei: `of` (tipul), `world`, `acts` (repetată). |
| `std.schema.kinds` | Același lucru pentru orice fel numit de o bază de cunoaștere, fără a le enumera. Chei: `world`, `from` (tipul firelor care numesc felurile), `key`, `acts`, `stand_in`. |
| `std.schema.honours` | Spune de ce părți ale cererii ține seama un domeniu pentru un act. Chei astăzi: `act`, `of`, `on` (repetată, cu valorile `kind`, `count`, `place` și celelalte chei fixe ale cererii). *Propus: `role=` în loc de `on=`, cu nume de concepte din lumea legendelor.* |
| `std.schema.limit` | Cel mult atâtea lucruri de un fel. Chei: `of`, `max`. |
| `std.schema.capacity` | Un lucru care ține alte lucruri are loc pentru un număr dat. Chei: `of`, `key`, `holds`, `via`. |
| `std.schema.relation` | O relație pe care o are lumea. Chei: `name`, `kind` (`spatial`, `containment`, `flow`), `inverse`. *Propus: relațiile se declară o dată, în lumea legendelor.* |
| `std.schema.region` | O regiune cu nume a paginii. Chei: `name`, `x`, `y`, `w`, `h`. *Propus: devine un fir `w.legend.region` al spațiului paginii.* |
| `std.schema.effect` | Spune că un act asupra unui fel este îndeplinit de program. Chei: `of`, `act`, `action`. |
| `std.schema.needs` | Ce trebuie încărcat înainte de a acționa într-o lume. Chei: `of`, `type`, `from`. |

| Tipul din `std.tool` | La ce folosește și ce chei are |
|---|---|
| `std.tool.op` | O operație a uneltei. Chei astăzi: `name`, `world`, `param`, `effect` (cu valorile `makes`, `removes`, `changes`), `doc`. *Propus: `realises=` cu numele actului, în loc de `effect`.* |
| `std.tool.param` | Un parametru al unei operații. Chei astăzi: `op`, `name`, `kind`, `type`, `accepts` (lista valorilor primite), `scale`, `by`, `order`, `min`, `max`, `default`, `required`. *Propus: `space=` cu numele spațiului conceptual, în loc de `accepts` și `scale`.* |
| `std.tool.bind` | Legătura: un act asupra unui fel pornește o operație. Chei: `act`, `of`, `op`, `arg`, `needs`, `makes`, `removes`, `changes`. |
| `std.tool.arg` | Un argument al unei legături și sursele lui, în ordine. Chei: `bind`, `param`, `from`. |
| `std.tool.needs` | Ce trebuie să fie adevărat în stare înainte de o operație. Chei: `op`, `exists`, `absent`, `check`, `args`. |
| `std.tool.custom` | O constrângere sau o căutare proprie a uneltei, cu ce primește și ce dă. Chei: `name`, `world`, `kind` (`constraint`, `search`), `in`, `out`, `fails`, `doc`. |

**Actele de astăzi.** Cheia `acts` a firului `std.schema.kind` primește astăzi paisprezece nume fixe: `make`, `remove`, `change`, `place`, `connect`, `group`, `pick`, `ask`, `copy`, `send`, `save`, `load`, `undo`, `redo`. Propunerea din secțiunea 4.6 este ca numai cele patru de bază să fie definite direct, iar `connect`, `group` și `copy` să decurgă din ele. `pick` și `ask` nu schimbă nimic, deci sunt întrebări, nu acte. `save`, `load`, `undo`, `redo` și `send` sunt operații ale aplicației asupra lumii întregi și rămân cum sunt.

**Alte module standard.** Mai există astăzi: `std.fill`, care alege valoarea unei chei lăsate nespuse dintre mai multe surse puse în ordine (omul, focusul, scena, cunoașterea, valoarea implicită); `std.focus`, care ține minte despre ce se vorbește; `std.dialogue`, care recunoaște felul unui mesaj; `std.know`, care completează din cunoaștere; `std.turn`, care declară etapele prin care trece un mesaj.

**Care domeniu răspunde.** Capabilitățile spun care domenii pot îndeplini o cerere. „Schedule a meeting with Ana”, spus în timp ce omul se uită la desen, ajunge la calendar, fiindcă numai calendarul promite că poate face ședințe. Zona deschisă pe ecran nu hotărăște deci cine poate. Când pot mai multe domenii („a red circle” poate fi făcut și de desen, și de diagramă), se alege în ordinea din secțiunea 6.1.1: domeniul numit în mesaj, apoi cel al lucrului despre care se vorbește, apoi cel la care omul se uită; dacă tot rămân mai multe, aplicația întreabă.

### 6.1.1 Selectarea domeniului și transferul între lumi

O capabilitate răspunde la întrebarea „cine poate realiza această cerere?”. Contextul răspunde la întrebarea „în care dintre aceste locuri vrea omul să lucreze?”. Alegerea domeniului combină cele două informații, fără ca simpla deschidere a unei zone pe ecran să creeze capabilități pe care ea nu le are.

Cererile între lumi introduc încă o distincție: lumea din care se citesc datele poate fi diferită de lumea în care se creează rezultatul. Regulile separă selectarea destinației de politica de actualizare a rezultatului.

Capabilitățile aleg cine poate; nu ajung ca să aleagă cine răspunde. Dintre domeniile care pot îndeplini cererea, se alege în această ordine: cel numit în mesaj („in the diagram”); cel al lucrului la care trimite mesajul sau al focusului; cel la care omul se uită acum. Dacă tot rămân mai multe, aplicația întreabă. În această alegere, zona deschisă pe ecran nu hotărăște cine poate, dar desparte egalitățile. „A red circle” poate fi făcut și de desen, și de diagramă, deci merge la cel la care se uită omul. *(R57)*

O cerere peste două lumi citește dintr-una și scrie în cealaltă. „A bar chart of meetings per person” citește calendarul și scrie în diagramă. Citirea se face o singură dată, la alcătuirea planului. Graficul ține minte de unde vine: sursa și momentul citirii. *(R58)*

Graficul nu se schimbă singur când se schimbă calendarul. Dacă o ședință este ștearsă, graficul rămâne cum era, iar la întrebare spune când a fost făcut. „Update the chart” îl reface. *(R59)*

Un grafic al ședințelor pe persoană este construit dintr-o stare identificată a calendarului. Diagrama păstrează proveniența citirii, astfel încât o întrebare ulterioară să poată primi un răspuns despre datele folosite. Dacă ședințele se schimbă, graficul nu trebuie prezentat drept imagine a calendarului actual fără o nouă citire.

„Update the chart” produce o actualizare explicită, verificabilă și anulabilă. Anularea ei restaurează graficul anterior; nu anulează schimbările calendarului care au avut loc între cele două citiri. Această separare a responsabilităților împiedică o operație de prezentare să modifice accidental sursa.

## 6.2 Drumul unui mesaj, pe etape

Am văzut drumul în secțiunea 1.4, pe un exemplu. Acum îl numim. Fiecare etapă primește ceva și dă ceva mai departe, iar secțiunile următoare iau etapele pe rând.

| Etapa | Ce primește și ce dă |
|---|---|
| 1. Starea | Citește ce există în unelte și îl scrie ca fapte în instanța de lume. |
| 2. Interpretarea | Din propoziție face cererea: ce se vrea, spus în concepte generale (secțiunea 6.3). |
| 3. Situarea | Hotărăște ce este mesajul față de dialogul de până acum: cerere nouă, corectare, răspuns la o întrebare (secțiunea 6.4). |
| 4. Înțelesul numeric | Din cuvinte face numere și le potrivește cu ce pot face uneltele (secțiunea 6.5). |
| 5. Completarea | Pentru ce a rămas nespus propune valori (secțiunea 6.6). |
| 6. Descompunerea și raționamentul | Împarte întregul în părți, alege între variante și verifică; iese un plan (secțiunile 6.7 și 6.8). |
| 7. Execuția | Pornește uneltele după plan și citește starea din nou (secțiunea 6.9). |
| 8. Răspunsul | Din ce s-a schimbat de fapt compune propoziția de răspuns (secțiunea 6.10). |

Etapele 5 și 6 se repetă până când planul nu mai are goluri. Limba omului apare numai la capete, în etapele 2 și 8; între ele, totul este fire și numere. De aceea adăugarea unei limbi nu atinge mijlocul.

## 6.3 Interpretarea: din propoziție, o cerere

Prima sarcină este să trecem de la cuvinte la ceva cu care programul poate lucra. Acest ceva se numește **cerere (request)** și este o mică lume de fire care spune ce vrea omul.

Lucrul important despre cerere este în ce termeni este scrisă. Nu are chei proprii fiecărui domeniu și nici o listă fixă de câmpuri. Este scrisă în conceptele lumii legendelor: un act, lucrul sau lucrurile despre care este vorba, cu felul lor, și cerințele despre ele, fiecare legată de un concept. De aceea aceeași formă servește toate domeniile.

| Propoziția | Cererea, spusă în cuvinte |
|---|---|
| „draw three big red fish in the pond” | Act: a face. Fel: pește. Cantitate: 3. Mărime: cuvântul de grad „big”. Culoare: regiunea „red”. Loc: relația „în” cu iazul. |
| „make a flowchart of how bread is baked, with no circles” | Act: a face. Fel: diagramă de flux. Subiect: coacerea pâinii. Forma părților: regiunea „circle”, nedorită. |
| „write a short formal letter about a late delivery” | Act: a face. Fel: scrisoare. Lungime: cuvântul de grad „short”. Ton: regiunea „formal”. Subiect: livrarea întârziată. |
| „a long meeting with Ana tomorrow afternoon” | Act: a face. Fel: ședință. Durată: cuvântul de grad „long”. Participant: Ana. Timp: regiunea „afternoon” a zilei de mâine. |

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

Aceste legări le face lumea limbii, prin reguli generale de gramatică, nu fiecare domeniu.

**Cum știm că citirea este bună.** Sunt două verificări diferite și niciuna nu o înlocuiește pe cealaltă. Prima se face la fiecare mesaj: cererea este spusă înapoi în cuvinte și citită din nou; dacă iese altă cerere, citirea este nesigură. A doua se face la măsurare: citirea este comparată cu interpretarea corectă, scrisă de un om, pe exemple și mai ales pe perechi ca cele din tabel.

**Ce se face când ceva nu a fost înțeles.** Dacă rămân cuvinte necitite într-un loc care contează, cererea nu se execută; aplicația spune ce nu a înțeles, cu cuvintele omului. A executa jumătate de propoziție și a tăcea despre rest este mai rău decât a refuza. Un cuvânt scris greșit este corectat numai dacă nu este cunoscut de nicio sursă și există un singur candidat limpede; altfel „villa” ar deveni „via”. Nucleul citește engleză; alegerea limbii interfeței și traducerea sunt responsabilități ale aplicației, în afara acestui contract.

### 6.3.1 Interpretări candidate și clarificarea ambiguității

Interpretarea unei propoziții produce ipoteze despre intenție. Fiecare ipoteză trebuie să păstreze corespondența cu mesajul: obiectele desemnate, cerințele și cuvintele care nu au fost încă interpretate. Altfel, eliminarea unei interpretări ar putea însemna eliminarea tacită a unei cerințe a omului.

Filtrarea folosește starea și capabilitățile declarate, apoi preferințele limbii. Când două interpretări încă posibile ar produce schimbări diferite, o alegere arbitrară nu este o rezolvare a ambiguității. Regulile de mai jos precizează când se poate continua și când trebuie formulată o întrebare.

Citirea dă una sau mai multe cereri candidate. Fiecare ține cerințele ei, cuvintele rămase necitite și legarea fiecărui cuvânt de un lucru. *(R51)*

Alegerea între candidate se face în această ordine. Cad cele care trimit la lucruri ce nu există în stare. Cad cele pe care niciun domeniu nu le poate îndeplini. Dintre cele rămase câștigă cea preferată de o regulă declarată a limbii. Dacă rămân două care ar schimba lumea diferit, nu se execută nimic și aplicația întreabă. *(R52)*

Exemplu: „make the red and blue nodes bigger”. Prima citire: nodurile roșii și nodurile albastre. A doua: nodurile care sunt și roșii, și albastre. Dacă niciun nod nu este în amândouă regiunile, a doua citire nu găsește nimic și cade. Contraexemplu: „add red and blue nodes”. Prima citire: câte un nod din fiecare culoare. A doua: noduri în două culori. Dacă unealta diagramei declară că nu poate realiza un nod în două culori, a doua interpretare cade. Limitarea trebuie să vină din contractul uneltei, nu dintr-o presupunere despre toate diagramele.

Un cuvânt cu conținut (substantiv, adjectiv, verb, număr) rămas necitit oprește execuția. Un cuvânt fără contribuție semantică, recunoscut astfel de gramatică, nu o oprește. *(R53)*

O întrebare de clarificare rămâne deschisă până când omul îi răspunde, până când aplicația pune alta sau până când se execută o cerere nouă. Un mesaj care se potrivește ca răspuns (are felul de valoare așteptat) este luat ca răspuns. Unul care nu se potrivește este o cerere nouă și închide întrebarea. *(R54)*

În exemplul cu nodurile roșii și albastre, diferența este între reuniunea a două grupuri și intersecția lor. Interpretările trebuie păstrate separat până la rezolvarea referințelor. Faptul că intersecția este goală poate elimina o citire a unei referințe la obiecte existente, dar nu justifică eliminarea unei culori dintr-o cerere de creare.

Un cuvânt neinterpretat poate părea mic și totuși să schimbe cererea: „not” inversează o condiție. De aceea categoria „cuvânt de legătură” nu este o autorizație de a ignora negația, ordinea ori întinderea unei expresii. Ignorarea este admisibilă numai când gramatica îi declară rolul nerelevant pentru cererea structurată. Întrebarea de clarificare păstrează candidații și valoarea așteptată, pentru ca răspunsul următor să poată fi legat de problema corectă.

### 6.3.2 Reprezentarea cererii și identitatea unei cerințe

Cererea este o stare distinctă de desen: faptul că omul cere trei pești nu înseamnă că aceștia există deja. Un obiect al cererii poate desemna un grup de rezultate încă de creat sau un lucru existent care trebuie găsit. Planificarea leagă aceste ținte de identități concrete; nu folosește identificatorul unui obiect al cererii drept identificatorul unui pește real.

Următoarea formă este propusă pentru mesajul „draw three big red fish in the pond”. Tipurile `std.request.*` de mai jos descriu contractul de proiectare; nu sunt o afirmație că motorul actual implementează această schemă. Câmpurile fixe descriu structura generală a cererii, iar conceptele precum culoare, loc sau cantitate sunt date rezolvate prin vocabularul conceptual, nu chei noi în program pentru fiecare domeniu.

```sop
@src1 std.request.source text="draw three big red fish in the pond"
@r1 std.request act=make source=$src1
@fish1 std.request.target request=$r1 mode=new kind=fish
@pond1 std.request.target request=$r1 mode=existing kind=pond determiner=definite
@c.count std.request.constraint request=$r1 target=$fish1 concept=quantity operator=eq value=3 scope=group polarity=positive character=requirement source=$src1 source.start=5 source.end=10
@c.size std.request.constraint request=$r1 target=$fish1 concept=size operator=degree value=big scope=each polarity=positive character=requirement source=$src1 source.start=11 source.end=14
@c.colour std.request.constraint request=$r1 target=$fish1 concept=colour operator=region value=red scope=each polarity=positive character=requirement source=$src1 source.start=15 source.end=18
@c.place std.request.constraint request=$r1 target=$fish1 concept=place operator=relation relation=in goal=$pond1 scope=each polarity=positive character=requirement source=$src1 source.start=24 source.end=35
```

`src1` păstrează textul englez primit de nucleu. Intervalele de proveniență sunt poziții de caractere, de la zero, cu sfârșitul exclus, în acest text exact. `r1` identifică cererea și actul general `make`.

`fish1` desemnează grupul de rezultate noi, nu un pește deja creat. `pond1` este o descriere de căutare: iazul trebuie să existe și să fie identificat univoc. Dacă sunt două iazuri și contextul nu le deosebește, cererea rămâne nerezolvată și aplicația întreabă; nu schimbă `mode=existing` în `mode=new` pentru a evita ambiguitatea.

| Cerință | Interpretare și verificare |
|---|---|
| `c.count` | Cantitatea grupului este exact trei. `scope=group` numără rezultatele, nu cere trei copii pentru fiecare pește. |
| `c.size` | Fiecare rezultat primește mărimea calculată din conceptul de grad `big`, clasa de comparație și sursa ei. `degree` amână calculul numeric până când există context. |
| `c.colour` | Culoarea fiecărui rezultat trebuie să aparțină regiunii `red`; numele se rezolvă la declarația regiunii și versiunea ei. |
| `c.place` | Pentru fiecare rezultat trebuie să țină relația `in` cu iazul găsit pentru `pond1`. Locul nu este dedus din cuvântul fish, fiindcă omul l-a cerut explicit. |

`operator` selectează verificarea cerinței, nu o unealtă: egalitate de cantitate, calcul de grad, apartenență la regiune sau relație. `polarity=positive` cere satisfacerea ei; `negative` cere ca predicatul să fie fals. `character=requirement` exprimă obligația, `preference` o preferință care poate ceda cerințelor, iar `assumption` o alegere a aplicației pentru o informație omisă. Negarea nu slăbește obligația: „no circles” poate fi o cerință negativă tare a cererii. O presupunere nu inventează un interval în mesaj: ea indică declarația sau pasul de justificare care a propus-o.

Schema trebuie să verifice variantele operatorului. `relation` cere `relation` și `goal`; `eq`, `less.equal`, `degree` și `region` cer o valoare de tipul acceptat de concept; `less.equal` este admis numai pe valori ordonabile, în unități compatibile. O cheie `goal` rămasă pe o egalitate numerică este o eroare de schemă a cererii. Rezolvitorul păstrează separat descrierea țintei, identitățile găsite și versiunea stării citite. Această legare permite verificarea fiecărui rezultat și explicarea unei ambiguități fără modificarea sensului inițial al cererii.

Să urmeze mesajul „in the sky”. Situarea din secțiunea 6.4 îl leagă de locul grupului de pești din ultima cerere. În versiunea nouă a acelei cereri, se adaugă sursa și ținta cerute de corectare, iar `c.place` este înlocuit, păstrându-și identitatea:

```sop
@src2 std.request.source text="in the sky"
@sky1 std.request.target request=$r1 mode=existing kind=sky determiner=definite
@c.place std.request.constraint request=$r1 target=$fish1 concept=place operator=relation relation=in goal=$sky1 scope=each polarity=positive character=requirement source=$src2 source.start=0 source.end=10
```

Acest bloc descrie schimbarea dintre două versiuni ale stării cererii. Nu se concatenează cu declarația veche `c.place` în același text de încărcare: două declarații diferite cu același identificator ar fi o eroare. Cantitatea, mărimea și culoarea rămân neschimbate, la fel ca identitatea grupului vizat. Jurnalul păstrează versiunea anterioară și legătura cu mesajul corectiv.

Dacă peștii au fost deja creați, legarea grupului `fish1` la acele identități se păstrează, iar planul mută acei pești. Nu execută din nou `make` pentru încă trei. Dacă prima cerere nu a ajuns la execuție, corectarea schimbă locul în planul încă neexecutat. Aplicarea asupra ultimului grup, distincția dintre corectare și repetare și controlul efectelor sunt obligații separate ale situării și planificării; schimbarea unui fir nu le rezolvă singură.

Aceeași structură permite ca mesajul real cu două case diferite să aibă o țintă pentru case și o cantitate a acelui grup. Dar semnificația lui „diferite” și părțile complete ale peisajului trebuie declarate separat. Exemplul de aici nu închide aceste lacune din replay și nu face, singur, un domeniu executabil.

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

Dacă se potrivesc mai multe lucruri și omul a vorbit la singular, aplicația nu ghicește. Întreabă și enumeră candidații, mereu în aceeași ordine: „Which house? 1. the red one on the left, 2. the blue one by the pond.”

**Întrebările.** Întrebările pe care le pune aplicația nu sunt scrise de mână pentru fiecare cheie. Fiecare concept are întrebarea lui generală („Where?”, „How big?”, „Which one?”, „When?”, „With whom?”), făcută mai precisă de tipul valorii așteptate. Aplicația pune cel mult o întrebare pe mesaj și numai când nu are nicio presupunere rezonabilă. Întrebarea pusă este ținută minte ca **întrebare deschisă** până vine răspunsul, pentru ca „room 2”, scris de om în mesajul următor, să fie înțeles ca răspuns la ea.

### 6.4.1 Descrieri și rezolvarea referințelor

O descriere este un graf de ținte și condiții: feluri, însușiri, relații și surse. Structura cererii din secțiunea 6.3.2 folosește o asemenea descriere și îi adaugă actul. O referință o folosește pentru a găsi ceva; un subiect de document o poate folosi pentru a descrie ceva despre care se va scrie. Aceste utilizări au aceeași formă de bază, dar angajamente diferite: descrierea unui personaj într-o poveste nu afirmă că există în lumea observată și nu autorizează crearea lui acolo. Rolul descrierii este declarat, nu dedus din simpla prezență a unui fir.

Rezolvarea urmează un mecanism comun: stabilește mulțimea de candidați, aplică filtrele obligatorii, apoi ordonează potrivirile admisibile folosind distanțele declarate. Nu există o singură distanță universală care să poată compensa orice nepotrivire. Un nume exact, o identitate, o proveniență cerută sau o limită temporală sunt filtre tari; distanța de culoare nu poate compensa încălcarea lor. Aproximarea se aplică numai componentelor pentru care este permisă, cu toleranța lor. O potrivire exactă are prioritate față de relaxarea aceleiași descrieri. Dacă nu rămâne un candidat unic justificat, sistemul păstrează ambiguitatea și întreabă.

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

O parte așteptată, dar absentă, nu este un referent observat. Sistemul poate găsi în graful unui întreg rolul cerut și poate propune crearea lui când actul este de editare, rolul este declarat construibil, întregul este identificat și nu există o constrângere de absență. Astfel, „add the signature” poate completa rolul semnăturii unei scrisori fără să pretindă că semnătura exista. O întrebare despre semnătură nu o creează. Pentru un rol opțional sau o intenție neclară, constatarea că rolul este posibil nu este suficientă: se cere clarificarea. Aceasta este excepția controlată de completare structurală la regula R37, nu o regulă „nu găsesc, deci fac”.

Reparația unui cuvânt poate traversa o limită de cuvinte, dar trebuie să producă o citire completă și compatibilă, cu modificarea păstrată în proveniență. Un cuvânt necunoscut poate fi un nume propriu; costul mic de editare nu autorizează rescrierea lui. Pentru o realizare lipsă, compunerea din părți rămâne o capabilitate de implementat, nu un efect al acestei metode de selecție. Pentru o valoare istorică lipsă, răspunsul este că istoricul nu o conține, nu alegerea unei valori recente de la alt obiect.

## 6.5 Înțelesul numeric și potrivirea cu ce poate unealta

Cererea conține încă cuvinte: „big”, „red”, „afternoon”. Uneltele primesc numai numere. Etapa aceasta face trecerea, în doi pași.

În primul pas, cuvintele de grad și numele de regiuni devin puncte în spațiile lor, așa cum s-a explicat în secțiunile 4.4 și 4.5: „red” devine centrul regiunii roșii, iar „big” devine un număr calculat față de peștii de pe pagină.

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
| cerință | A spus-o omul și trebuie îndeplinită. Dacă nu se poate, aplicația explică sau întreabă; nu o lasă deoparte. „In the sky” pentru pești este o cerință și se îndeplinește, chiar dacă este neobișnuită. |
| preferință | A spus-o omul, dar cu „dacă se poate”: „in the morning if possible”. Se îndeplinește după cerințe, cât se poate. |
| presupunere | A ales-o aplicația. Poate fi schimbată oricând, iar omului i se spune când contează: locul ales pentru pești, ora aleasă pentru ședință. |

Dacă două cerințe ale omului nu pot fi îndeplinite împreună, niciuna nu cedează numai fiindcă este mai veche. „With Ana, on Monday morning”, când Ana lipsește luni: aplicația spune ce anume se bate cap în cap și întreabă.

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

Omul cere apoi schimbări ale întregului, cu cuvinte foarte scurte: „fewer”, „connect them”, „make it nicer”. Acestea sunt operații generale asupra oricărui întreg. Ce le face sigure este că fiecare știe ce trebuie păstrat.

| Operația | Ce face și ce păstrează |
|---|---|
| mai puține părți | Scoate părți, dar păstrează părțile obligatorii și legăturile dintre cele rămase. Un flux scurtat rămâne legat de la început la sfârșit; o scrisoare scurtată își păstrează formula de început și semnătura. |
| mai multe părți | Adaugă numai părți pe care graful conceptului le permite. |
| nu toate la fel | Schimbă o însușire la unele părți, numai în regiunile permise. |
| leagă tot | Adaugă numai legături care au sens în tiparul lumii. |
| așază mai bine | Mută părțile spre locurile pe care cunoașterea le socotește potrivite: apa jos, cerul sus, rața pe apă; nodurile așezate astfel încât săgețile să se încrucișeze cât mai puțin. |

Rezultatul acestei etape este un **plan (plan)**: o listă de schimbări de bază (secțiunea 4.6), fiecare cu rolurile ei completate. Planul este încă pe hârtie; nimic nu s-a executat.

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

Nu orice reacție înseamnă aceeași recompletare. „Another one” poate cere adăugarea unui obiect, în timp ce „something else instead” cere înlocuirea rezultatului respins. Interpretarea stabilește identitatea rezultatului și dacă se adaugă sau se înlocuiește înainte de căutare. Costul nu poate hotărî această intenție. „Too much” fără dimensiune oferă un candidat de corectare numai dacă o abatere comparabilă este clar dominantă; altfel se întreabă, fără mutarea arbitrară a unei alte proprietăți.

Pentru varietate, jurnalul păstrează generatorul și alegerile efective. Dacă nu există alternativă validă la distanța cerută, aplicația raportează limita căutării sau imposibilitatea dovedită, după caz. Nu modifică cerințele ferme pentru a garanta un rezultat diferit. Explicația numește condițiile îmbunătățite și ce s-a păstrat; faptul că un cost a scăzut nu dovedește singur că întregul este „frumos”.

## 6.8 Raționamentul: când și cum alege aplicația

Cele mai multe cereri nu cer nicio gândire: omul a spus tot, iar planul se scrie direct. Raționamentul pornește numai când există un semn limpede că este nevoie de el, iar semnele sunt trei și pot fi verificate de program: a rămas o cheie deschisă, s-a găsit o contradicție sau există mai multe variante între care trebuie ales.

Toate mecanismele de raționament lucrează pe același lucru: starea lumii văzută ca fapte, adică lucruri cu felurile lor, însușiri ca puncte în spații și relații între lucruri. De aceea niciunul nu trebuie rescris pentru un domeniu.

| Mecanismul | Ce face |
|---|---|
| deducția (deduction) | Aplică regulile și cunoașterea și spune ce decurge și ce se încalcă. Un nod fără săgeți spre el este un început. Două ședințe ale Anei se suprapun. |
| completarea cu cost minim | Ia valorile candidate pentru cheile deschise, le aruncă pe cele care încalcă o regulă tare și o alege, dintre cele rămase, pe cea mai ieftină. Costul crește cu fiecare regulă slabă încălcată și cu depărtarea de ce este obișnuit. Așa ajung peștii în iaz și ședința la cea mai apropiată oră liberă. În literatură, aceasta este o formă de abducție. |
| extinderea unei valori comune | Dacă lucrurile de același fel au valori apropiate, iar aceste valori au venit de la om, propune aceeași valoare pentru un lucru nou. Toate nodurile sunt albastre fiindcă omul le-a cerut așa; nodul nou va fi albastru. În literatură, aceasta este o formă de inducție. |
| rezolvitorul (solver) | Caută valori pentru multe chei deschise deodată, când depind una de alta: orarul unei săptămâni (secțiunea 5.4). |

**Cum se poate încheia o căutare.** Pentru ca aplicația să nu spună „nu se poate” când de fapt doar nu a căutat destul, o căutare are cinci încheieri posibile, iar ele sunt ținute deosebit: s-a găsit un plan valid; s-a găsit un plan, dar ceva a rămas neverificat; cererea însăși este nevalidă; s-a dovedit că nu există nicio soluție; căutarea a fost oprită la limită, fără nicio concluzie. Numai a patra îi dă voie aplicației să spună „nu se poate”.

**Căutările proprii unui domeniu.** Unele căutări țin de meseria domeniului și sunt făcute de program: găsirea unui loc liber pe pagină; așezarea nodurilor unei diagrame; compunerea textului unui paragraf. Sunt permise ca funcții declarate (secțiunea 3.7). Împărțirea este limpede: planul hotărăște ce se face și cu ce valori; funcția găsește numai cum.

### 6.8.1 Planificarea semantică și funcțiile specializate

Planificatorul alege o intenție realizabilă: ce obiecte sunt implicate, ce relații trebuie obținute și ce constrângeri trebuie păstrate. O funcție specializată caută o realizare concretă în interiorul acelei alegeri. Separarea permite reutilizarea raționamentului fără a pretinde că geometria desenului și compunerea unui text sunt aceeași operație.

Tabelul funcțiilor trebuie citit ca un contract de intrare, rezultat și verificare. Un rezultat furnizat de o funcție nu este adevărat doar pentru că funcția l-a returnat; verificatorul îl compară cu cerința și starea relevantă.

Planul alege între lucruri cu înțeles diferit; funcția caută înăuntrul alegerii. Planul hotărăște că peștii stau în iaz, nu pe cer. Funcția desenului găsește în iaz trei poziții libere. *(R67)*

| Funcția | Ce primește, ce dă și cum este verificată |
|---|---|
| `free_spot` (desen) | Primește regiunea sau relația aleasă de plan, mărimea lucrului și lucrurile de acolo. Dă un punct, sau eșecul „nu este loc”. Planul verifică punctul cu `test`-ul relației (R45). |
| `layout` (diagrame) | Primește nodurile și săgețile. Dă câte un punct pentru fiecare nod. Verificare: niciun nod peste altul. |
| `compose` (documente) | Primește partea de scris, lista afirmațiilor pe care cunoașterea le are despre subiect, lungimea cerută și punctul de ton. Dă textul și lista afirmațiilor folosite. |

`compose` nu inventează. Are voie să folosească numai afirmațiile primite și formule legate de partea scrisă (salutul, încheierea). Lungimea se verifică prin numărare. Afirmațiile folosite se verifică față de lista dată. Dacă lista este goală, se scriu numai formulele, iar răspunsul spune că despre subiect nu se știe nimic. **Tonul nu poate fi verificat automat în prima versiune;** răspunsul nu afirmă că tonul cerut a fost atins (anexa D). *(R68)*

Dacă planul cere ca peștele să fie în iaz, `free_spot` nu poate răspunde cu o poziție pe cer pentru că acolo a găsit loc. Poate returna un punct verificabil în regiunea permisă sau poate declara că nu a găsit o soluție. Distincția dintre căutare epuizată și imposibilitate demonstrată rămâne cea din secțiunea 8.5.

Pentru `compose`, verificarea afirmațiilor cere identificarea surselor, nu doar compararea unor cuvinte. Dacă această verificare nu este disponibilă pentru o proprietate, răspunsul trebuie limitat la proprietățile efectiv verificate. Lungimea măsurată a textului nu dovedește că tonul cerut a fost respectat și nici că afirmațiile sunt justificate.

### 6.8.2 Catalogul operațiilor generale

Un concept nou nu adaugă singur o putere nouă programului. Dacă autorul declară o culoare, sistemul o poate folosi fiindcă știe deja să compare valori și să verifice apartenența la o regiune. Dacă autorul scrie numele unei operații de recunoaștere a unei imagini, acel nume nu produce un recognoscător. Pentru a deosebi aceste situații trebuie fixat vocabularul de operații pe care declarațiile îl pot cere.

Catalogul de mai jos este contractul propus al programului general. Este închis pentru această versiune a proiectului: o declarație poate compune operațiile din el, dar nu poate introduce printr-un nume nou o semantică executabilă. Nu este lista API-urilor implementării actuale și nici lista verbelor omului. `make`, de exemplu, este un act definit prin condiții; realizarea lui folosește potrivire, verificare, planificare și apelul unei unelte. Operațiile de mai jos lucrează cu valori tipizate, fire, scheme și versiuni de stare.

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

Un exemplu propus arată diferența dintre compunere și operație nouă. Într-un document, vrem ca o secțiune deja identificată să aibă cel mult 120 de cuvinte. Citirea stării oferă textul și versiunea lui; numărarea cuvintelor cere o segmentare declarată, apoi `collect` cu `count`. Limita este o cerință a cererii, nu limita permanentă a tipului secțiune. O propunere mai scurtă se verifică pe o copie izolată:

```sop
@source.limit std.request.source text="at most 120 words"
@request.limit std.request act=change source=$source.limit
@target.section std.request.target request=$request.limit mode=existing kind=section
@constraint.length std.request.constraint request=$request.limit target=$target.section concept=length operator=less.equal value=120 unit=word scope=each polarity=positive character=requirement source=$source.limit source.start=0 source.end=17
```

Aceste fire descriu ce se verifică, nu generează rezumatul. `target.section` trebuie legat separat la identitatea secțiunii alese. Operatorul `less.equal` compară numărul observat cu limita; metadatele conceptului stabilesc că lungimea se măsoară aici în cuvinte, prin segmentarea declarată. Dacă textul candidat are 117 cuvinte, condiția numerică este adevărată. Aceasta nu dovedește că sensul a fost păstrat: acea proprietate cere propriul contract și poate rămâne neverificată. Dacă nu există un compozitor capabil să propună textul, numărarea singură nu rezolvă cererea.

Cazul permite delimitarea concretă a extensiilor. O altă limită, de 90 de cuvinte, este o dată nouă. O regulă care verifică aceeași lungime numai pentru introduceri este o declarație nouă compusă din operațiile existente. Un nou algoritm care produce text sau măsoară o proprietate încă nesuportată cere o implementare de funcție, declarată și înregistrată; numirea ei într-un fir nu ajunge. Extinderea programului general însuși este necesară dacă apar valori, condiții sau efecte care nu pot fi reprezentate prin contractele catalogului. În acel caz se revizuiește explicit catalogul și se verifică din nou compatibilitatea declarațiilor.

## 6.9 Execuția

Planul este o listă de schimbări. Fiecare este dusă la unealta ei prin legătura declarată (secțiunea 6.1), iar unealta primește numere și referințe.

Greutatea este că lumea reală nu ascultă întotdeauna. Unealta poate eșua, sau omul poate schimba ceva cu mâna între timp. De aceea se țin două stări, cu rosturi diferite. **Starea observată** este ce se citește din unelte; ea poate fi și nevalidă, de exemplu când omul a tras cu mâna o ședință peste alta a aceluiași om. **Starea primită pentru execuție** este ce propune aplicația; ea trebuie să treacă verificarea. Regula dintre ele: unealta are întotdeauna dreptate despre ce există; instanța de lume este oglinda ei, nu invers.

După fiecare pas, starea este citită din nou și comparată cu condiția „după” a actului (secțiunea 4.6). Rezultatul unei execuții este unul din cinci: executat; executat în parte; desfăcut, adică s-a dat înapoi tot; efect necunoscut; desfacere eșuată. Ultimele două sunt rare, dar trebuie să aibă nume, fiindcă în ele aplicația nu are voie să spună nici „am făcut”, nici „nu am făcut”.

Pentru om, o cerere executată este un singur pas care se poate anula, oricâte unelte au pornit pentru ea. O reacție („bigger”) înlocuiește pasul pe care îl corectează, nu adaugă altul. O întrebare pusă de aplicație nu este un pas.

### 6.9.1 Consistența execuției și recuperarea după eșec

Un plan verificat descrie ce ar trebui să se întâmple pornind de la o anumită stare. Între verificare și execuție, starea poate fi schimbată de om sau de o altă operație. În plus, o unealtă poate eșua după ce a aplicat numai o parte din modificări. Execuția trebuie deci să urmărească atât versiunile citite, cât și efectele confirmate.

Independența semantică a operațiilor nu rezultă din simpla lor separare în apeluri. Două apeluri sunt dependente dacă împart o restricție sau o resursă, chiar când modifică identificatori diferiți.

Două părți ale unui plan sunt independente dacă nu citesc și nu scriu aceleași fire, dacă nicio interdicție nu se poate potrivi cu fire din amândouă și dacă nu ocupă aceeași resursă. Dacă una dintre aceste condiții nu poate fi dovedită, părțile sunt socotite dependente: se execută amândouă sau niciuna. *(R60)*

Starea este citită din nou chiar înainte de execuție. Dacă firele pe care planul le citește s-au schimbat de când a fost făcut, planul este refăcut o dată. Dacă s-au schimbat din nou, cererea este oprită și omului i se spune de ce. *(R61)*

La eșecul unui pas, pașii executați ai aceleiași părți sunt desfăcuți în ordine inversă, fiecare prin actul lui invers. O operație nu este încercată a doua oară decât dacă unealta o declară fără urmări la repetare. *(R62)*

Dacă desfacerea eșuează, starea este citită din nou și spusă omului așa cum este: ce a rămas făcut și ce nu. Aplicația nu pretinde nici că a făcut, nici că nu a făcut. *(R63)*

Uneltele celor patru domenii trebuie să permită anularea. Contractul fiecărei operații include informația necesară refacerii stării dinainte și verificarea rezultatului anulării. Un eșec al anulării se raportează conform R63. O unealtă viitoare fără anulare are nevoie de o politică explicită; nu moștenește automat permisiunea de a executa. *(R64)*

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

Aici răspunsul se compune din două surse care nu pot minți: **diferența de stare**, adică ce este acum altfel față de dinainte, și **evidența execuției**, adică ce a reușit și ce nu. Fiecare act are un singur **cadru de propoziție**, general, completat cu rolurile care s-au schimbat. Cuvintele pentru roluri, relații și regiuni vin din lumea limbii. Un domeniu nu scrie nicio propoziție.

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
| întrebare | Lipsește o valoare, sau sunt mai mulți candidați. |
| efect necunoscut | Vezi R63. |
| răspuns despre stare | „What is on Friday?” |
| explicație | „Why is the fish there?”, din proveniența valorilor. |

O confirmare tehnică a uneltei poate arăta că cererea a fost primită fără să dovedească rezultatul. Pentru „put the duck on the lake”, sistemul trebuie să regăsească rața și lacul în observația de după și să verifice relația cerută. Dacă poziția nu s-a schimbat și relația nu ținea înainte, mesajul „done” ar fi fals chiar dacă apelul a returnat succes.

Explicația ulterioară reconstruiește aceeași justificare: cerința, faptele citite, regula aplicată și observația finală. Ea trebuie să poată distinge un efect confirmat de o presupunere de planificare. Într-o execuție parțială numește separat părțile independente reușite și cele rămase, fără a prezenta întregul plan ca realizat.

---

## 6.11 Cum explică sistemul un răspuns

Regula este simplă: explicația se construiește din evidența păstrată în timpul lucrului. Nu se inventează după răspuns o poveste plauzibilă. Când omul întreabă „why?”, sistemul arată legătura dintre cererea lui, regulile aplicate și rezultatul observat.

O **urmă de justificare (justification trace)** este înregistrarea acestei legături. Fiecare pas numește intrările, operația, rezultatul și pasul care l-a cerut. O intrare este fie un fragment al cererii, fie un fapt identificat din starea citită, fie o declarație dintr-o versiune fixată a cunoașterii. O concluzie derivată trimite la regula și intrările ei. O observație a uneltei poartă identitatea operației și versiunea stării observate.

În proiectul propus, urma este alcătuită din fapte într-o instanță de jurnal a sesiunii. Nu este numai un obiect temporar al componentei de răspuns. Instanța jurnalului are o schemă publicată, astfel încât pașii să poată fi căutați prin pattern-uri, salvați și reîncărcați. Nu introducem aceste fapte ca obiecte desenate sau ca ședințe: ele descriu cererea și evaluarea ei, nu domeniul asupra căruia s-a lucrat.

Jurnalul se salvează cu proiectul și se reîncarcă la redeschidere, cu aceleași identități de cereri și pași. Închiderea sesiunii nu îl golește. Astfel, o întrebare de a doua zi poate selecta o acțiune anterioară. Dacă istoricul a fost eliminat explicit sau lipsește din proiectul încărcat, sistemul declară că justificarea nu este disponibilă; nu o reconstruiește ca și cum ar fi fost păstrată.

Fiecare răspuns păstrează identificatorul cererii și al pasului care îl justifică. „Why?” se leagă de ultimul răspuns relevant din contextul conversației; o întrebare explicită despre o acțiune mai veche selectează răspunsul acelei acțiuni. Dacă sunt mai multe candidate, sistemul cere precizarea. El nu înlocuiește explicația unei acțiuni vechi cu justificarea stării curente numai pentru că aceasta este mai ușor de obținut.

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

Reprezentarea următoare este o propunere minimală pentru legături, nu schema completă a jurnalului și nici o facilitate deja implementată:

```sop
@req1 std.trace.request message="put the duck on the lake"
@input1 std.trace.input source="drawing-instance/duck1" version="state-17" key=at value="120,540"
@step1 std.trace.step request=$req1 act=place operation=move status=confirmed input=$input1
@reply1 std.trace.reply request=$req1 step=$step1 text="I moved the duck onto the lake."
@undo1 std.trace.undo target=$step1 status=confirmed after.version="state-19"
```

`req1` identifică mesajul, iar `input1` fixează o valoare citită din starea 17. `source` este aici o valoare istorică explicită, nu o referință `$` către un obiect care ar trebui să existe pentru totdeauna. `step1` distinge actul semantic `place` de operația uneltei `move`; împreună cu `reply1`, folosește referințe reale către înregistrările jurnalului. `undo1` păstrează legătura cu pasul anulat și versiunea observată după anulare. Tipurile și valorile complete ale intrărilor trebuie păstrate în schema finală; textul din `value` ilustrează valoarea, fără a decide serializarea generală a punctelor. Fragmentul omite observațiile detaliate: singur, `status=confirmed` nu este o dovadă suficientă pentru răspuns.

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

Explicația pentru om este: „Ana already has a meeting from 10:00 to 11:00. Your 30-minute meeting at 10:30 overlaps it, so I did not schedule it.” Fiecare afirmație corespunde unui pas. Dacă numele Ana are doi candidați, explicația este în schimb „Two people named Ana match your request; I need to know which one.” Nu se calculează disponibilitatea unei persoane alese arbitrar.

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

Acest traseu explică alegerea unei ținte, nu dovedește că textul final are 180 de cuvinte. După compunere, lungimea efectivă trebuie măsurată și comparată cu toleranța permisă. Dacă sursa obișnuită lipsește, sistemul nu poate produce aceeași explicație; trebuie să folosească următoarea sursă justificată sau să întrebe. Pentru ton, lipsa unei verificări nu poate fi ascunsă prin „I made it formal”: se explică numai transformarea și proprietățile efectiv verificate.

Pentru toate domeniile, explicația scurtă poate fi desfășurată în pașii ei, cu identitățile și versiunile reale. Numele de reguli dintr-un exemplu al cărții nu sunt dovezi dintr-o execuție. Dacă urma s-a pierdut, răspunsul corect este că justificarea nu mai este disponibilă, nu o reconstrucție prezentată ca certitudine.

### 6.11.1 Mesaje despre conversație și referințe la istoric

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

# 7. Cele patru domenii

Capitolul acesta arată cum arată fiecare domeniu când tot ce s-a explicat este pus la lucru. Secțiunile prezintă fragmentele de declarații disponibile, ce rămâne program și exemple de utilizare. Fragmentele actuale nu sunt încă domenii complete: dependențele, parametrii uneltelor și legăturile lipsă trebuie declarate înainte de a putea verifica întregul traseu. Secțiunea 7.4.1 precizează aceste dependențe.

De urmărit este cât de puțin declară un domeniu. Declară felurile lui de fire, sloturile lor legate de concepte, ce poate face, uneltele și legăturile. Nu are cuvinte de mărime, liste de culori sau de forme, întrebări, propoziții de răspuns ori valori obișnuite proprii.

## 7.1 Desenul

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

Ce lucruri se pot desena nu este declarat aici. Se poate desena orice fel din arbore care are o imagine sau un strămoș cu imagine (secțiunea 5.2). Programul desenului este deci: patru unelte, citirea paginii, căutarea unui loc liber și imaginile.

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

**Graficele.** Un grafic nu este un domeniu separat. Este un fel de diagramă: nodurile lui sunt bare sau puncte, iar cantitatea fiecăruia, ținută în cheia `value`, este arătată ca înălțime sau ca poziție pe o axă a paginii. De aceea nodul are cheia `value`. Felurile de diagrame (flux, arbore, hartă mentală, grafic cu bare, grafic cu linie) sunt grafuri de părți în cunoaștere (secțiunea 4.4), deci adăugarea unui fel nou de diagramă nu cere program.

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

Genurile (scrisoare, raport, poveste, notă) și părțile fiecăruia sunt grafuri în cunoaștere. Scrierea textului propriu-zis este o funcție declarată, `compose`. Împărțirea este cea din secțiunea 6.8: planul hotărăște ce parte se scrie, despre ce și cât de lungă; funcția scrie cuvintele.

| Omul spune | Ce se întâmplă și din ce decurge |
|---|---|
| „write a short formal letter about a late delivery” | O scrisoare cu părțile ei (secțiunea 6.7). „Short” se judecă față de lungimea obișnuită a scrisorilor (secțiunea 4.5). „Formal” este o regiune în spațiul tonului (secțiunea 4.4). |
| „longer” | O reacție: un pas pe axa lungimii; părțile se păstrează (secțiunile 6.4 și 6.7). |
| „move the apology before the explanation” | Schimbarea unei relații de ordine între două părți (secțiunile 4.6 și 4.7). |
| „a story about a fox, in three chapters” | Cantitatea este a părților „chapter” (secțiunea 6.7). Dacă despre vulpi cunoașterea are prea puțin, se spune cât s-a putut scrie (secțiunea 6.6). |
| „warmer” | Un pas pe axa căldurii, în spațiul tonului (secțiunea 4.4). |
| „what is in the document?” | Se răspunde din stare: genul, titlul, părțile (secțiunea 6.10). |

## 7.4 Calendarul

```
@w          std.schema.world name=calendar
@use        core.use world=w.person
@t.meeting  core.type of=meeting extends=std.schema.thing is=thing complete=true
@t.room     core.type of=room    extends=std.schema.thing is=thing resource=true
@s.meet.title  core.slot of=meeting key=title  kind=string   means=name
@s.meet.start  core.slot of=meeting key=start  kind=number   means=time  part=start
@s.meet.length core.slot of=meeting key=length kind=number   means=time  part=duration
@s.meet.room   core.slot of=meeting key=room   type=room     means=place relation=in
@s.meet.people core.slot of=meeting key=people type=w.person means=role  role=participant many=true
@s.room.seats  core.slot of=room    key=seats  kind=number   means=quantity counts=w.person
@k.meeting  std.schema.kind of=meeting world=calendar acts=make acts=place acts=change acts=remove
```

Lumea calendarului importă tiparul persoanelor (`core.use`, secțiunea 5.3). Are două tipuri de fire: ședința și sala. Sala este declarată ca resursă. O ședință are un titlu, un început și o durată, o sală și participanți. O sală are un număr de locuri, care numără persoane.

La acestea se adaugă interdicția din secțiunea 3.6, că un om nu poate fi în două ședințe care se suprapun, și aceeași interdicție pentru o sală. Mai mult nu este de scris.

Calendarul este domeniul de probă al întregii construcții, din două motive. Este nou, deci arată cât costă cu adevărat adăugarea unui domeniu. Și seamănă, în adânc, cu desenul: timpul unui om și o sală sunt resurse care se ocupă, la fel cum spațiul paginii este resursa desenului. Dacă partea generală este bine făcută, „cea mai apropiată oră liberă” și „un loc liber în iaz” sunt același mecanism.

| Omul spune | Ce se întâmplă și din ce decurge |
|---|---|
| „a long meeting with Ana tomorrow afternoon” | „Long” se judecă față de ședințele din acest calendar (secțiunea 4.5). „Afternoon” este o regiune pe axa orelor (secțiunea 4.7). Ora exactă este cea mai apropiată liberă pentru Ana (secțiunea 6.8). |
| „later” | O reacție: un pas pe axa timpului. Dacă noul interval se suprapune cu altceva, se alege cel mai apropiat liber (secțiunile 6.4 și 4.4). |
| „in the big room” | Un fragment care dă locul. „Big” se judecă față de sălile care există (secțiunile 6.4 și 4.5). |
| „with Tom too” | Un fragment care adaugă un participant. Se verifică și timpul lui Tom (secțiunile 6.4 și 3.9). |
| „a meeting with Ana at ten thirty”, când Ana este ocupată | Refuz cu explicație, compusă din încălcare, și cu cea mai apropiată oră liberă (secțiunile 3.9 și 4.4). |
| „move everything on Friday to Monday” | Toate ședințele din regiunea „Friday”. Rezolvitorul le găsește ore fără suprapuneri (secțiunea 5.4). |
| „who is in the review?” | Întrebarea generală a rolului de participant, răspunsă din stare (secțiunea 6.10). |
| „what is on Friday?” | Se răspunde din stare (secțiunea 6.10). |

### 7.4.1 Aplicarea contractelor într-un scenariu de calendar

Un scenariu complet leagă reprezentarea datelor, interpretarea, verificarea și efectul observat. Exemplele de declarații din capitolul 7 ilustrează componentele, dar nu conțin singure toate importurile și contractele necesare rulării unui domeniu. Tabelul dependențelor arată ce cunoaștere trebuie să fie disponibilă înainte ca un exemplu să poată susține concluzii.

Calendarul de mai jos este un exemplu de aplicare a contractelor. Cazurile pornesc separat din starea descrisă; cazul ambiguu adaugă explicit o a doua ședință, iar anularea continuă cazul de reușită. Astfel, rezultatul unui caz nu devine accidental premisa altuia.

Blocurile de fire din capitolul 7 sunt extrase schematice, nu declarații complete. Un domeniu complet are în plus: importul lumii legendelor și al bazelor de cunoaștere folosite; parametrii și legăturile fiecărei unelte; citirea stării; funcțiile proprii, cu argumentele lor. *(R72)*

| Domeniul | De ce depinde |
|---|---|
| desen | Lumea legendelor; arborele felurilor; regiunile de culoare și de mărime; părțile scenelor; cuvintele engleze. |
| diagrame | Lumea legendelor; regiunile de formă și de culoare; grafurile felurilor de diagrame. |
| documente | Lumea legendelor; grafurile genurilor; regiunile de ton; afirmațiile despre subiecte. |
| calendar | Lumea legendelor; tiparul persoanelor; regiunile zilei; unitățile de timp. |

Scenariile următoare arată cum aceleași date pot conduce la execuție, clarificare, refuz sau anulare, în funcție de cerere.

Starea de pornire, aceeași pentru toate: Ana are ședința `m1`, „Review”, luni, de la 10:00 la 11:00, în sala `r1`. Sălile `r1` și `r2` sunt altfel libere.

| Cazul | Ce se întâmplă, pas cu pas |
|---|---|
| reușită | „a meeting with Ana on Monday at 14:00 for an hour”. Cererea: a face; ședință; participant Ana; început luni 14:00, exact; durată 1 oră. Sala nu este spusă: este o cheie deschisă; candidate sunt `r1` și `r2`, amândouă libere; se ia prima și se notează ca presupunere. Verificare: validă. Execuție: apare `m2`. Răspuns: „I put a 1-hour meeting with Ana on Monday at 14:00, in room 1.” |
| două înțelesuri | „move Ana's meeting to Tuesday”, când Ana are două ședințe luni. Trimiterea „Ana's meeting” găsește două. Nu se execută nimic. „Which one? 1. Review, 10:00, 2. the meeting at 14:00.” |
| valoare lipsă | „a meeting with Ana on Monday”. Începutul lipsește. Valoarea obișnuită pentru durată este o oră. Pentru început nu există o presupunere rezonabilă, fiindcă ziua are multe ore libere. Întrebarea conceptului de timp: „When on Monday?” |
| refuz | „a meeting with Ana on Monday at 10:30”. Ora este exactă. Interdicția despre oameni se potrivește cu `m1`. Nu se execută. Pentru durata presupusă de o oră, 9:30 nu este liber: intervalul 9:30–10:30 se suprapune cu rezervarea existentă. 11:00 permite întreaga durată, în ipoteza calendarului complet citit. „Ana is busy from 10 to 11. The nearest free time for a 1-hour meeting is 11:00. Shall I put it there?” |
| anulare | După cazul de reușită, „undo”. Pasul șters este facerea lui `m2`. Starea citită din nou are numai `m1`. „I removed the meeting on Monday at 14:00.” |

În cazul de reușită, alegerea sălii este o presupunere explicită, iar ora este o cerință exactă. Aceste două valori pot apărea în aceeași rezervare, dar au justificări diferite. În cazul ambiguu, lipsa unei identități unice oprește execuția înainte de orice mutare. În cazul incomplet, durata presupusă nu rezolvă lipsa începutului.

Refuzul cere verificarea întregii durate, nu doar a momentului de început. O ședință de o oră începută la 9:30 s-ar suprapune cu rezervarea 10:00–11:00; nu este o alternativă liberă. Anularea se verifică prin recitire și prin dispariția rezervării create, nu prin simpla confirmare a comenzii de ștergere.

## 7.5 Ce are voie să fie program și cum știm că nu ne păcălim

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

# 8. De la declarații la un rezultat: piesele care trebuie construite

*Capitol nou, versiunea 14. Propunere de arhitectură pentru review. Explică un contract de construit; nu pretinde că implementarea curentă îl îndeplinește. Numele concrete ale noilor tipuri de fire rămân de stabilit prin schema completă.*

## 8.1 Ce trebuie să știe programul general

Catalogul închis al operațiilor generale, intrările, rezultatele și limita dintre o declarație nouă și o implementare nouă sunt definite în secțiunea 6.8.2, lângă mecanismele de raționament. Exemplul de mai jos aplică această delimitare unui spațiu geometric.

## 8.2 Introducerea unui spațiu: distanța liberă dintre noduri

Să vrem o diagramă în care două noduri au cel puțin 12 unități ale paginii între contururile lor. Pentru a verifica cerința, sistemul are nevoie de două informații diferite: distanța observată și limita impusă rezultatului dorit. Distanța poate fi 8 într-o diagramă reală, chiar dacă planul trebuie să producă cel puțin 12. Modelul observației trebuie să poată reprezenta această încălcare; altfel ar ascunde exact situația pe care vrem să o reparăm.

Spațiul `clearance` are o singură axă, cu valori nenegative, în unitatea paginii. Nu folosim aici pixelul ecranului: schimbarea măririi de afișare nu trebuie să schimbe distanța din document. „Cel puțin 12” este o limită inferioară asupra candidatului. Nu o declarăm ca regiune de forma centru–rază, deoarece o asemenea bilă cu rază finită nu reprezintă intervalul fără capăt superior `[12, infinit)`.

Următoarele declarații arată contractul propus pentru spațiu și două utilizări distincte ale valorii. Cheia nouă `normalisation` este explicată imediat după exemplu. Fragmentele presupun tipurile și celelalte sloturi ale observației și candidatului declarate în schema aplicației.

```sop
@sp.clearance w.legend.space name=clearance form=axes
@ax.clearance w.legend.axis of=clearance name=distance min=0 scale=ratio normalisation=10
@s.observed.value core.slot of=gapObservation key=value kind=number min=0
@s.candidate.gap core.slot of=layoutCandidate key=gap kind=number min=12
```

Primul fir introduce numele spațiului. Al doilea definește axa, limita zero și scara numerică folosită la comparație. Lipsa lui `max` înseamnă că acest exemplu nu fixează un plafon al distanței. Unitatea de măsură a axei este unitatea paginii, declarată prin mecanismul `w.legend.unit` din secțiunea 4.8.1; nici `normalisation=10`, nici numele `distance` nu definesc singure acea unitate.

Al treilea fir permite înregistrarea unei distanțe observate de 8. Al patrulea permite candidatului numai distanțe de cel puțin 12. Limita 12 din acest exemplu provine din cerere; într-o implementare generală, ea se atașează constrângerii acelei cereri sau copiei de validare, nu rescrie permanent schema tuturor diagramelor. Observația și candidatul nu sunt două adevăruri despre aceeași stare: primul descrie ce am citit, al doilea ce propunem să obținem.

### 8.2.1 Normalizarea unei axe fără plafon

Pe o axă cu limite finite distincte, secțiunea 4.4.1 folosește diferența împărțită la `max−min`. Aici nu există `max`, deci acea formulă nu poate fi aplicată. Propunerea este o lungime de normalizare pozitivă, declarată pe axă prin `normalisation`, în aceeași unitate cu valorile. Pentru valori `a` și `b`, diferența normalizată este `abs(a−b)/normalisation`. Dacă sunt declarate atât limite finite, cât și `normalisation`, scara explicită are prioritate; zero și valorile negative sunt refuzate la încărcarea schemei.

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
@f.gap core.function name=page.gap out.kind=number pure=true doc="distance between axis-aligned rectangles in page units"
@f.gap.a core.function.arg of=$f.gap name=a kind=json
@f.gap.b core.function.arg of=$f.gap name=b kind=json
@p.a node bounds=?a
@p.b node bounds=?b
@c.distinct core.check fn=neq args=$p.a args=$p.b
@c.gap core.calc fn=page.gap args=?a args=?b out=?gap
@t.gap gapObservation first=$p.a second=$p.b value=?gap
@r.gap core.rule when=$p.a when=$p.b if=$c.distinct with=$c.gap then=$t.gap
```

`f.gap` declară numele și puritatea funcției; următoarele două fire declară argumentele, în ordine. Autorul adaptorului geometric trebuie să furnizeze implementarea conformă. Cele două pattern-uri leagă dreptunghiurile unor noduri din aceeași versiune observată. `c.distinct` exclude compararea unui nod cu el însuși, iar `c.gap` pune rezultatul în `?gap`. Șablonul `t.gap` păstrează valoarea și nodurile măsurate. Pentru simplitate, regula produce ambele perechi ordonate; implementarea poate evita duplicarea numai păstrând simetria rezultatului. Sloturile `bounds`, `first` și `second` trebuie declarate în schema exemplului; fragmentul explică fluxul calculului, nu este un domeniu complet de încărcat singur.

Pentru dreptunghiurile A și B, calculăm `dx = max(0, A.left−B.right, B.left−A.right)` și analog `dy` pentru marginile verticale. Rezultatul este `sqrt(dx²+dy²)`. Dreptunghiurile care se ating sau se suprapun au distanța zero. Dacă lipsesc margini sau ele sunt inconsistente, măsurarea nu este disponibilă; nu se întoarce zero ca substitut pentru date lipsă.

De exemplu, A are intervalul orizontal [0,10], B are [18,28], iar proiecțiile verticale se suprapun: rezultă `dx=8`, `dy=0`, deci distanța 8. Dacă planul mută B la [24,34], valoarea devine 14. Funcția `layout` din secțiunea 6.8.1 poate propune această mutare, dar aceeași funcție de măsurare trebuie aplicată candidatului și apoi observației de după execuție. Valoarea promisă de plan nu înlocuiește măsurarea efectului.

Introducerea spațiului folosește astfel mecanisme generale pentru limite, calcule, potrivire și validare. Programul specific rămâne calculul geometric declarat și unealta care poate muta nodurile. Un sistem care are numai funcția de măsurare poate verifica diagrama, fără să pretindă că știe și să o repare.

## 8.3 Ce înseamnă interpretarea firelor

Textul trece prin etape distincte. Mai întâi este citit ca sintaxă: identificatori, tipuri, chei, atomi, texte și referințe. Apoi referințele și numele sunt rezolvate în modulele și instanțele potrivite. Schema verifică valorile și multiplicitatea lor. Legăturile conceptuale arată ce operații se aplică. Abia apoi regulile pot fi evaluate.

Un text între ghilimele rămâne text. `before="object exists"` nu este o condiție executabilă prin simplul fapt că este scris ca text. R35 propune condițiile structurate; acestea trebuie validate și legate de rolurile actului. Explicația în limbaj natural poate însoți condiția, dar nu îi ține locul.

Propunerea este o singură reprezentare semantică a firului, care păstrează identitatea, tipul, valorile tipizate, proveniența și locul din text. Componenta care desenează pe ecran (renderer) poate primi o proiecție, adică numai câmpurile de care are nevoie din acea reprezentare. Nu recitește textul SOP cu reguli proprii. Astfel, o referință și un text care seamănă cu o referință nu ajung confundate în două componente diferite.

## 8.4 Cum strângem firele relevante

„Toate firele unui concept” nu înseamnă toate firele care conțin același cuvânt. Pentru desenarea unei rațe avem nevoie de felul rață, strămoșii lui, realizările disponibile, proprietățile și regulile aplicabile. Pentru găsirea unei ședințe libere avem nevoie și de alte ședințe ale participanților, chiar dacă acestea nu conțin cuvintele cererii.

Un **catalog (catalog)** este aici o evidență a declarațiilor și a locului de unde pot fi încărcate. Programul îl construiește din firele validate. Nu ghicește legături din asemănarea numelor. O bază mare poate fi împărțită în **fragmente (shards)**: fișiere care se încarcă separat, dar aparțin aceleiași versiuni publicate.

| Legătura citită | Ce poate fi găsit prin ea |
|---|---|
| `extends` | Declarațiile tipului părinte și regulile aplicabile descendenților. |
| `is`, `means` | Conceptul realizat de tip sau de slot; sunt legături propuse, nu disponibile implicit astăzi. |
| `of`, `type` ale slotului | Tipul care deține slotul și tipul faptului la care valoarea lui poate trimite. |
| `space` | Definiția axelor și operațiile spațiului valorii. |
| `when`, `not`, `if`, `with` | Modelele, condițiile și calculele de care depinde o regulă. |
| `realises` și legătura uneltei | Actul promis de unealtă și parametrii necesari. |
| referință între fapte | Lucrul concret numit, inclusiv într-o altă instanță. |

Același text `of` pe alt tip de fir nu este automat aceeași legătură. Semnificația vine din schema tipului. Un **index invers (reverse index)** este tabelul care răspunde la întrebarea inversă: „ce reguli sau declarații folosesc acest tip?”. Dacă o regulă privește animale, indexul permite să o găsim și când verificăm o rață, după urmărirea părinților.

Căutarea pornește din operația cerută și urmează aceste dependențe. Memorează identitățile deja vizitate, ca un ciclu să nu provoace o buclă. Dacă descoperă o regulă care cere alte date, le solicită și continuă. La fiecare fapt inclus păstrează motivul includerii. O limită de timp oprește căutarea cu rezultat incomplet; nu transformă datele lipsă în inexistență.

În demo, calendarul este o instanță locală. Toate ședințele ei sunt în starea citită; nu presupunem un serviciu extern de rezervări. Autorul tiparului poate declara această închidere printr-un fir existent al limbajului:

```
@t.meeting core.type of=meeting extends=std.schema.thing is=thing complete=true
```

Este aceeași declarație completă din secțiunea 7.4, reprodusă pentru explicație; nu se adaugă o a doua declarație cu același identificator și alt conținut. Pentru un calendar încărcat numai parțial, schema acestui exemplu nu este aplicabilă ca atare. Activarea și interogarea instanței complete au loc numai după ce încărcarea integrală a faptelor a reușit.

Firul spune că tipul despre care vorbim este `meeting`, iar `complete=true` permite răspunsul „nu” când nu există o potrivire în acea instanță. Programul care încarcă instanța trebuie să asigure că toate faptele ei au fost citite înainte să folosească această proprietate. Declarația nu produce faptele lipsă. Ea nu spune nici că toate bazele de cunoaștere ale lumii au fost încărcate.

Separat, o regulă de cunoaștere poate sta într-un fragment încă neîncărcat. Contractul propus completează `std.schema.needs`, care declară ce date trebuie încărcate: catalogul urmărește și dependențele regulilor, iar încărcătorul raportează ce dependențe a satisfăcut. Fără regulile necesare nu afirmăm validitatea, chiar dacă lista locală a ședințelor este completă. Un fragment care nu se poate citi produce „verificare incompletă”, nu „nicio restricție”.

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

**Coordonatorul (coordinator)** este programul care execută etapele deja descrise în 6.2, nu un al doilea sistem care înțelege cererea. Etapa 1 citește starea; etapele 2–3 citesc și situează mesajul; etapa 4 rezolvă valorile; etapele 5–6 completează și aleg un plan; etapa 7 execută; etapa 8 răspunde. În etapele 5–6 poate cere încărcarea unor dependențe, deducții sau o căutare. `std.turn` este mecanismul existent pentru declararea etapelor; contractele descrise aici precizează ce trebuie să circule între ele.

Pentru fiecare candidat, coordonatorul face o copie de încercare a instanței, conform 3.9, aplică schimbările propuse și cere verificarea lumii asupra copiei. Este aceeași semantică de validare ca la o schimbare scrisă de mână. Copia include aceleași versiuni de schemă și cunoaștere. Un plan care rămâne nedeterminat nu ajunge la unelte. Abia un plan valid poate trece în etapa 7, după verificarea că starea originală nu s-a schimbat între timp.

O funcție geometrică sau numerică declarată poate rămâne o dependență de încredere: verificatorul îi controlează argumentele, tipul rezultatului și proprietățile verificabile, dar nu poate dovedi corectitudinea oricărui program arbitrar. Contractul numește funcția și versiunea ei; testele ei și limitele metodei sunt parte din justificare. Autorul domeniului trebuie să aleagă o implementare verificată pentru acel contract și să declare limitele ei; numirea funcției nu este o dovadă de corectitudine. O funcție lipsă nu se consideră adevărată implicit.

## 8.6 O ședință, urmărită cu numere

Fixăm pentru exemplu o zi și un fus orar deja rezolvate. Minutele se numără de la miezul nopții. Ana are o rezervare [600, 660), adică 10:00–11:00. Cererea este o ședință de 30 de minute, cu Ana, începând exact la 10:30. Interpretarea produce participantul identificat, începutul 630 și durata 30. Sfârșitul calculat este 660.

Pentru două intervale [a,b) și [c,d), suprapunerea este adevărată când a < d și c < b. Aici 630 < 660 și 600 < 660: există conflict. Acesta este un calcul explicit, nu o concluzie obținută din cuvântul „ședință”. Regula leagă întâi rezervările care împart un participant, apoi aplică testul intervalelor.

Coordonatorul poate căuta o alternativă. La 660, intervalul propus este [660,690). Condiția 660 < 660 este falsă, deci rezervarea cunoscută nu îl blochează. Dar acest calcul singur nu dovedește că Ana este liberă: trebuie consultate toate rezervările ei relevante până la 690. Dacă sursa este indisponibilă, rezultatul rămâne necunoscut.

Cererea inițială a spus o oră exactă. Alternativa 11:00 este prezentată omului, nu executată automat. După acceptare se verifică din nou versiunea rezervărilor. Dacă altă ședință a apărut între timp, planul se reevaluează.

Unealta primește identitatea Anei, începutul 660 și durata 30. După operație se citește starea: trebuie să existe ședința creată, cu aceste valori și fără schimbarea rezervării vechi. Dacă unealta nu confirmă rezultatul sau observația lipsește, sistemul nu spune „am programat”.

O diagramă poate folosi apoi aceleași identități de ședințe pentru a arăta numărul lor pe participant. Ea produce noduri grafice, nu copii ale persoanelor. Trebuie declarat dacă desenul este un instantaneu sau o vedere actualizată; această alegere schimbă dependențele și invalidarea rezultatului.

## 8.7 Ce trebuie verificat înainte de implementare

Acest capitol descrie mecanismele și limitele lor. Mai trebuie scrise schemele complete ale declarațiilor noi, reprezentarea structurală a condițiilor și protocolul verificabil de completitudine. Acestea sunt livrabile de proiectare, nu detalii pe care implementatorul le poate inventa separat în fiecare domeniu. Reviewerul trebuie să încerce să găsească o tranziție din exemplu care nu este justificată de date, o regulă sau un contract explicit.

# Anexe

# 9. API-ul bibliotecii: construirea, interogarea și modificarea unei lumi

Acest capitol leagă mecanismele cărții de apelurile care există în biblioteca `sopworld`, versiunea 0.167.0. Exemplele au fost rulate pe sursele acestei versiuni; rezultatele sunt redate explicit. Numele propuse în capitolele anterioare nu devin API-uri existente prin simpla lor apariție în carte. La sfârșit este delimitat contractul conversațional care mai trebuie construit.

Aici sunt explicate apelurile de bază pentru un traseu complet prin lume. [Referința API](../docs/api.md) inventariază și familiile specializate; acest capitol nu pretinde încă să înlocuiască explicațiile tuturor exporturilor ei. Codul se poate importa din pachet prin `import { World, readRequest, planRequest } from 'sopworld'`. Într-un checkout al depozitului, aceleași nume sunt exportate de `src/index.mjs`, iar în browser de fișierul construit `docs/sopworld.mjs`.

## 9.1 Instanța `World` și exemplul comun

`new World(options?)` construiește o lume goală. Schema și faptele se încarcă separat; constructorul nu deduce domeniul din numele unei variabile JavaScript. Opțiunile pot furniza biblioteca de module (`library`), funcții ale gazdei, un namespace și limite de calcul. `version` identifică o versiune de stare și este potrivit pentru invalidarea cache-urilor; `stamp` este intern și nu identifică unic stări din lumi diferite. Un fork pornește cu versiunea bazei, iar modificarea sa efectivă primește o versiune diferită.

Exemplele următoare construiesc fiecare o lume nouă cu funcția de mai jos. Nu depind de efectele exemplului anterior. Micul inventar are produse cu preț și linii care indică produsul și cantitatea. Regula calculează costul unei linii prin înmulțire. Aceasta folosește schema, potrivirea și deducția din capitolul 3, fără strat conversațional.

```js
const inventory = () => {
  const w = new World();
  w.load(`
    @s.name core.slot of=item key=name id=true
    @s.price core.slot of=item key=price kind=number min=0 required=true ask="What does it cost?"
    @s.item core.slot of=line key=item type=item required=true
    @s.qty core.slot of=line key=qty kind=integer min=1 default=1
    @p.item item price=?p
    @p.line line item=$p.item qty=?q
    @calc core.calc out=?cost fn=mul args=?q args=?p
    @result line core.on=$p.line cost=?cost
    @rule core.rule when=$p.line when=$p.item with=$calc then=$result
  `);
  return w;
};
```

În rezultate, `attrs` conține liste de tokenuri SOP: un preț poate apărea ca `["2"]`, deși slotul îl verifică numeric. Nu este un șir JavaScript convertit automat în număr. Exemplul afișează valorile cu `print(...values)`, definit ca `console.log(...values.map(v => JSON.stringify(v)))`; astfel se disting numerele, tokenurile și listele. Pentru un calcul al gazdei, conversia trebuie făcută conform tipului declarat, nu aplicată orbește oricărei valori.

## 9.2 `load` și `tell`: încărcarea și afirmarea faptelor

Ambele metode primesc text SOP sau o listă de fire deja parsate. `tell(input, options?)` afirmă fapte sau declarații, aplică regulile relevante și verifică schimbarea. Întoarce un rezultat cu `ok`, identificatorii adăugați, derivările, completările și încălcările. `ok: false` trebuie tratat ca refuz; faptul că apelul JavaScript s-a încheiat nu dovedește că afirmația a intrat în lume. Textul care nu poate fi parsat poate arunca o excepție.

`load(input)` folosește aceeași modificare, dar aruncă o eroare dacă lumea o refuză. Este util la pornire, când o schemă invalidă este o problemă de configurare ce nu trebuie trecută cu vederea. Rezultatul la succes este tot rezultatul schimbării, nu o lume nouă.

```js
const w = inventory();
const r = w.tell('@pen item name=pen price=2 @order line item=$pen qty=3');
print(r.ok, r.added, w.get('order').attrs.cost);
const bad = w.tell('@ink item name=ink price=-1');
print(bad.ok, w.has('ink'));
try { w.load('@ink item name=ink price=-1'); }
catch (e) { print(e.message.startsWith('sopworld: refused')); }
```

Rezultatul verificat:

```text
true ["pen","order"] ["6"]
false false
true
```

Prima afirmație introduce produsul și linia, iar regula produce costul 6. Prețul negativ nu este acceptat și firul `ink` nu rămâne în stare. Ultimul `true` arată că `load` a aruncat eroarea de refuz. Diferența dintre metode este cum semnalează refuzul, nu dacă schema trebuie respectată.

Opțiunile importante ale lui `tell` sunt `dry` pentru o probă fără păstrarea schimbării, `tier` pentru nivelul de proveniență, `ns` pentru namespace și `budget` pentru calcul. O probă reușită nu rezervă starea: înainte de execuția reală trebuie reverificată versiunea. La depășirea bugetului, schimbarea este refuzată; bugetul epuizat nu trebuie prezentat drept contradicție logică.

## 9.3 `fill` și `revise`: completare sau corectare explicită

`fill(id, key, value, options?)` furnizează o valoare unui slot. Pentru un slot cu o singură valoare deja afirmată, o valoare diferită produce conflict; metoda nu înseamnă „suprascrie orice”. `revise(id, key, value, options?)` exprimă tocmai corectarea explicită. Există și forma `revise(id, values, options?)` pentru un obiect de valori. Ambele întorc rezultatul schimbării și aplică validarea și deducția relevante.

```js
const w = inventory();
w.tell('@pen item name=pen');
print(w.fill('pen', 'price', 2).ok);
print(w.fill('pen', 'price', 3).violations[0].kind);
print(w.revise('pen', 'price', 3).ok, w.get('pen').attrs.price);
```

Rezultatul verificat:

```text
true
"conflict"
true ["3"]
```

Prețul lipsă poate fi completat cu 2. Încercarea de a-l completa încă o dată cu 3 nu retrage afirmația anterioară. Corectarea explicită reușește și prețul devine 3. Distincția este importantă pentru cererile omului: o nouă dovadă sau o corecție trebuie exprimată ca atare; nu trebuie ascunsă într-o completare. Sloturile fluente și presupunerile au reguli suplimentare de revizuire descrise în referința API.

## 9.4 `ask`: potrivirea unor modele de fire

`ask(patterns, options?)` primește modele SOP, nu o întrebare liberă în engleză. Întoarce câte un obiect de legături pentru fiecare potrivire. Identificatorul modelului se leagă la identificatorul firului găsit, iar variabilele se leagă la tokenurile din acesta. Modelele pot omite identificatorul dacă nu este necesar în rezultat.

```js
const w = inventory();
w.tell('@pen item name=pen price=2 @ink item name=ink price=3');
print(w.ask('@x item name=?name price=3'));
print(w.ask('@x item price=99'));
```

Rezultatul verificat:

```text
[{"x":"ink","name":"ink"}]
[]
```

`x` numește firul găsit, iar `name` valoarea slotului: coincidența lor în acest exemplu nu le face același rol. Lista goală pentru prețul 99 spune că nu s-a găsit o potrivire în domeniul citit. Nu dovedește că niciun obiect din afara acelei lumi nu poate avea acel preț. `ns` limitează namespace-ul, iar `at` permite citirea la un punct din istoric.

La depășirea bugetului, rezultatul are informație de buget și nu trebuie tratat ca enumerare completă. În particular, serializarea simplă a unui array poate ascunde proprietăți atașate lui: apelantul verifică și `rows.budget`. O interfață care prezintă doar lista, fără statutul calculului, poate transforma o căutare întreruptă într-un răspuns aparent definitiv.

## 9.5 `query`: o valoare împreună cu statutul și justificarea ei

`query(question, options?)` primește fie `{ about, seek }` pentru proprietatea unui fir cunoscut, fie o descriere `{ type, where, seek, mode }`; poate primi și un fir `core.question`. Spre deosebire de `ask`, organizează răspunsul ca valoare căutată cu statut, surse și nivel de proveniență. Modul implicit este `value`; modurile `list`, `count`, `exists`, `check` și `abduce` schimbă întrebarea adresată motorului.

```js
const w = inventory();
w.tell('@pen item name=pen price=2 @order line item=$pen qty=3');
const q = w.query({ about: 'order', seek: 'cost' }, { suppose: false });
print(q.status, q.value, q.via, q.tier);
print(w.query({ type: 'item', where: { name: 'ink' }, seek: 'price' }, { suppose: false }).status);
```

Rezultatul verificat:

```text
"supported" "6" ["rule"] "derived"
"missing"
```

Costul este susținut de regula `rule`, la nivelul `derived`. Tokenul `"6"` nu vine dintr-o presupunere a interfeței. Pentru produsul absent rezultatul este `missing`, nu prețul zero. Apelantul citește `status` înainte de `value` și păstrează câmpurile explicative ale statutului primit. Un rezultat ambiguu, condiționat sau necunoscut nu se transformă într-o valoare prin alegerea arbitrară a primului candidat.

Exemplul folosește `suppose: false` pentru a cere răspunsul fără presupuneri ipotetice. În mod obișnuit `suppose` este activ; acest comportament trebuie ales conștient atunci când răspunsul va fi prezentat ca fapt. `record: true` poate înregistra întrebarea și răspunsul ca fire. Aceste fire nu constituie singure întregul jurnal de execuție propus în secțiunea 6.11.

## 9.6 `open` și `next`: a observa lipsurile fără a le umple

`open(id?)` enumeră sloturile obligatorii care nu au valoare, în întreaga lume sau pe firul indicat. Fiecare rezultat identifică obiectul, tipul, cheia și întrebarea declarată. Un slot opțional cu valoare implicită nu este o lipsă obligatorie, deci poate lipsi din `open` și totuși să apară în propunerile lui `next`.

`next(options?)` întoarce `fills`, `questions` și `dead`: valori forțate sau implicite propuse, întrebări rămase și sloturi fără candidat posibil. Nu aplică propunerile. Cu `review: true` poate întoarce și presupunerile care merită revăzute.

```js
const w = inventory();
w.tell('@pen item name=pen @order line item=$pen');
print(w.open());
const n = w.next();
print(n.fills.map(f => [f.id, f.key, f.value, f.kind]));
print(n.questions.map(q => [q.attrs.about[0], q.attrs.seek[0]]));
print(w.get('order').attrs.qty ?? null);
```

Rezultatul verificat:

```text
[{"id":"pen","type":"item","key":"price","ask":"What does it cost?"}]
[["order","qty","1","default"]]
[["$pen","price"]]
null
```

Prețul produsului este obligatoriu și lipsește. Cantitatea liniei nu este obligatorie, dar schema îi oferă valoarea implicită 1. `next` propune acea cantitate și întrebarea despre preț. Ultimul `null` arată că propunerea nu a fost încă scrisă în stare. Interfața poate astfel afișa opțiunile fără să modifice lumea doar prin inspectare.

`canComplete(id?)` este o verificare ieftină că există candidați de încercat; un rezultat adevărat nu dovedește că aceștia trec toate constrângerile. `suggest(id, key, options?)` oferă candidați verificați pentru un slot, cu sursele lor. Aceste două apeluri sunt auxiliare selecției, nu aprobări automate de execuție.

## 9.7 `complete`: aplicarea completărilor și proveniența lor

`complete(options?)` aplică valorile forțate; cu `defaults: true` aplică și valorile implicite, iar cu `choose: true` poate alege o soluție pentru ce rămâne. Întoarce `filled`, `questions`, `dead` și `pending`, plus informația de buget dacă este cazul. Spre deosebire de `next`, modifică lumea. Nu trebuie confundat cu actul standard numit tot `complete`, care folosește mecanismul `std.fill` al stratului conversațional.

```js
const w = inventory();
w.tell('@pen item name=pen price=2 @order line item=$pen');
const result = w.complete({ defaults: true });
print(result.filled.map(f => [f.id, f.key, f.value]));
print(w.get('order').attrs.cost, w.tier('order', 'cost'));
```

Rezultatul verificat:

```text
[["order","qty","1"],["order","cost","2"]]
["2"] "default"
```

Cantitatea implicită 1 permite regulii să calculeze costul 2. Costul rezultat are aici nivelul `default`: depinde de cantitatea presupusă, chiar dacă înmulțirea este deterministă. Aceasta explică de ce „a fost calculat printr-o regulă” nu înseamnă întotdeauna „toate premisele lui au fost afirmate de om”. Aplicația păstrează proveniența până în răspuns și poate revizui completarea când apare o cerință explicită.

Completarea implementată folosește domeniile de valori, valorile implicite și constrângerile existente. Nu este încă implementarea întregii politici conceptuale propuse de carte, cu regiuni și descrieri generice. Exemplul demonstrează mecanismul existent pe o schemă concretă, nu închiderea lacunelor proiectului viitor.

## 9.8 `solveReport`, `solve` și `apply`: căutare separată de modificare

`solveReport(options?)` caută o atribuire comună pentru cheile deschise pe care motorul le poate reprezenta. Raportul are `status` (`sat`, `unsat` sau `unknown`), atribuirea când este disponibilă și informații despre motiv, solver și costul căutării. `sat` spune că s-a găsit o atribuire acceptată, `unsat` că problema reprezentată nu are soluție, iar `unknown` că nu există o concluzie. Domeniile și acoperirea problemei trebuie cunoscute înainte de a generaliza concluzia la lumea reală.

`solve(options?)` este forma simplificată: întoarce atribuirea, `null` pentru `unsat` și poate întoarce `[]` pentru `unknown`. Prin urmare, lista goală nu este o dovadă de succes. `satisfiable()` este fals numai pentru `unsat`; adevărat nu exclude `unknown`. Pentru decizii și explicații se folosește raportul explicit. Opțiunile solverului sunt `solver`, `budget` pentru solver și `limit` pentru bugetul apelului general; acestea nu trebuie confundate.

```js
const w = new World();
w.load(`
  @s core.slot of=seat key=who enum=ann enum=bob required=true
  @a seat who=?who
  @b seat who=?who
  @different core.check fn=neq args=$a args=$b
  @unique core.deny when=$a when=$b if=$different why="a person sits twice"
`);
w.tell('@s1 seat @s2 seat who=bob');
const report = w.solveReport();
print(report.status, report.assignment);
print(w.open().map(x => [x.id, x.key]));
if (report.status === 'sat') print(w.apply(report.assignment).ok);
print(w.get('s1').attrs.who);
```

Rezultatul verificat:

```text
"sat" [{"id":"s1","key":"who","value":"ann"}]
[["s1","who"]]
true
["ann"]
```

Regula de interdicție nu permite aceleiași persoane să ocupe două locuri. Bob este deja la `s2`, deci căutarea propune Ann pentru `s1`. După raport, `open` încă arată cheia lipsă: căutarea nu a aplicat-o. `apply(assignment, options?)` aplică atribuirea ca o schimbare verificată. Ramura `if` împiedică folosirea unui rezultat necunoscut drept soluție.

O soluție aparține stării pe care a fost calculată. Dacă acea stare se schimbă înainte de `apply`, atribuirea trebuie din nou validată; nu este o rezervare. Nici `apply`, nici `solveReport` nu înseamnă că o unealtă externă a mutat un obiect ori a creat o rezervare. Ele lucrează asupra lumii de fire.

## 9.9 `fork`: starea candidatului și starea de bază

`fork()` întoarce o lume independentă cu același conținut inițial. Implementarea partajează structurile nemodificate și copiază ce este schimbat, dar contractul observabil este izolarea modificărilor. Această operație permite verificarea unui plan fără să modifice baza.

```js
const w = inventory();
w.tell('@pen item name=pen price=2');
const candidate = w.fork();
candidate.revise('pen', 'price', 4);
print(w.get('pen').attrs.price, candidate.get('pen').attrs.price);
print(w.version === candidate.version);
```

Rezultatul verificat:

```text
["2"] ["4"]
false
```

Prețul bazei rămâne 2, în timp ce candidatul are 4. Versiunile diferă după schimbare. Fork-ul nu rezervă fișiere, unelte sau servicii externe. Dacă o funcție a gazdei produce efecte externe în timpul unei probe, izolarea firelor nu le anulează; tocmai de aceea calculele folosite în simulare trebuie să respecte contractul de puritate.

## 9.10 `undo` și `redo`: istoricul bibliotecii

`undo(n = 1, options?)` retrage ultimele afirmații din istoricul lumii și întoarce rezultatul, identificatorii afectați și încălcările. `redo(n = 1, options?)` reface afirmațiile retrase, dacă mai sunt disponibile și valide. Afirmațiile care ating numai tipuri tranzitorii sunt tratate separat, conform referinței API. O operație nouă obișnuită poate invalida posibilitatea de redo.

```js
const w = inventory();
w.tell('@pen item name=pen price=2');
w.tell('@ink item name=ink price=3');
const undone = w.undo();
print(undone.ok, undone.removed, w.has('ink'));
print(w.redo().ok, w.has('ink'));
```

Rezultatul verificat:

```text
true ["ink"] false
true true
```

A doua afirmație, despre `ink`, este retrasă și apoi refăcută. Această unitate de istoric este o afirmație a bibliotecii; o cerere a omului poate necesita mai multe afirmații și apeluri de unealtă. Anularea conversațională din secțiunea 6.9 trebuie să le grupeze, să compenseze efectele reale și să le observe din nou. Un apel la `world.undo()` nu garantează anularea unei acțiuni deja executate într-un editor sau calendar extern.

## 9.11 `register`: legătura dintre declarație și calculul gazdei

`register(kind, name, fn, options?)` înregistrează o funcție JavaScript și întoarce lumea. Pentru `kind='function'`, funcția primește `(args, world)`: primul argument este lista tokenurilor, nu câte un argument JavaScript pentru fiecare parametru SOP. Declarația `core.function` și argumentele ei spun motorului ce contract are funcția; înregistrarea furnizează implementarea. Sunt necesare ambele pentru un contract inspectabil.

```js
const w = new World();
w.register('function', 'half', ([x]) => Number(x) / 2);
w.load(`
  @fn core.function name=half out.kind=number pure=true
  @arg core.function.arg of=$fn name=x kind=number
  @p measure value=?v
  @c core.calc out=?h fn=half args=?v
  @t measure core.on=$p half=?h
  @r core.rule when=$p with=$c then=$t
`);
w.tell('@m measure value=8');
print(w.get('m').attrs.half, w.functions()[0].registered);
```

Rezultatul verificat:

```text
["4"] true
```

Regula calculează jumătatea valorii 8 și o pune pe același fir. `functions()` confirmă că funcția declarată este înregistrată. `Number(x)` este potrivit aici deoarece parametrul este numeric; pentru `json`, funcția trebuie să decodeze tokenul conform reprezentării, nu să presupună că primește direct un obiect JavaScript.

`pure=true` este o obligație a implementării gazdei, nu o verificare automată că JavaScript nu are efecte. O funcție folosită în deducție trebuie să tolereze toate intrările admise de contract, inclusiv combinații care vor fi ulterior eliminate de alte condiții. Înlocuirea unei funcții predefinite este refuzată fără opțiunea explicită `override`. Celelalte categorii înregistrabile (`action`, `producer`, `filter`, `context`, `lemma`) au semnături proprii; nu se apelează toate ca o funcție de calcul.

## 9.12 Citirea unei cereri există deja, dar contractul conceptual este propus

Biblioteca exportă deja `readRequest`, `requestWires`, `reviseRequest`, `planRequest` și `runPlan`. `readRequest(world, text, context?)` întoarce o cerere cu act, țintă, constrângeri, referințe și cuvinte necitite. Contextul furnizează lumea limbii, catalogul și starea relevantă; cititorul nu primește sensul tuturor cuvintelor prin simplul apel. `planRequest(live, request, options?)` folosește declarațiile de capabilități și sursele disponibile pentru a construi pași. Planificarea nu trebuie confundată cu executarea prin `runPlan`.

```js
const language = new World();
language.tell('@d ex.det text=a text=the');
const w = new World();
w.load(`
  @acts core.use world=std.acts
  @world std.schema.world name=toy
  @type core.type of=box extends=std.schema.thing closed=true
  @kind std.schema.kind of=box world=toy acts=make
`);
const request = readRequest(w, 'make a box blorp', { language, lang: 'ex' });
print(request.act, request.target, request.unread);
const plan = planRequest(w, request);
print(plan.ok, plan.steps, plan.unread);
```

Rezultatul verificat:

```text
"make" "box" ["blorp"]
false [] ["blorp"]
```

Micul exemplu declară un singur fel de obiect și vocabularul minim. Cititorul recunoaște actul și ținta, dar păstrează `blorp` ca necitit. Planificatorul refuză să execute doar partea înțeleasă: lista pașilor este goală. Acesta este un comportament existent și verificat, nu o promisiune a refactoringului.

Contractul actual al constrângerilor folosește chei din `REQUEST_KEYS` și forme proprii ale stratului conversațional. `requestWires` serializează forma actuală în fire `w.request`; nu produce implicit schema `std.request.*` propusă în secțiunea 6.3.2. Acea schemă cere descrieri și concepte rezolvate generic, identitatea stabilă a cerințelor și proveniența lor prin corecții. Adaptarea API-urilor existente la acest contract necesită o mapare explicită și verificarea fiecărui rezultat intermediar.

Pentru API-ul conversațional viitor trebuie fixate trei frontiere: citirea întoarce descrierea cererii și ce rămâne necunoscut; planificarea întoarce pașii, precondițiile și proprietățile neverificate; execuția întoarce efectele observate și dovezile. Numele și semnăturile finale nu sunt încă stabilite. Un capitol care le-ar prezenta ca implementate ar ascunde exact diferența dintre mecanismele disponibile și proiectul pe care vrem să îl construim.

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
| lumea legendelor (legend world) | Lumea care ține conceptele generale; propusă. Secțiunea 4.2. |
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
| întreg, plan | Un lucru făcut din părți; lista schimbărilor de făcut. Secțiunea 6.7. |
| deducție, completare cu cost minim, extinderea unei valori comune | Mecanismele de raționament. Secțiunea 6.8. |
| stare observată, stare primită pentru execuție | Ce există de fapt și ce propune aplicația. Secțiunea 6.9. |
| cadrul unui act | Forma generală a propoziției de răspuns pentru un act. Secțiunea 6.10. |
| proveniență (provenance) | De unde vine fiecare valoare. Secțiunea 6.10. |
| registrul cazurilor nerezolvate | Lista a ce nu se poate face încă, cu mecanismul general care lipsește. Secțiunea 6.10. |

## Anexa C. Ce este propus și ce trebuie schimbat

Această anexă adună într-un loc tot ce în document poartă semnul (propus), plus ce există astăzi și ar trebui să dispară. Este lista pe care se poate lua o hotărâre. Amănuntele pe fișiere sunt în `refactoring/sop-worlds-schimbari.md`.

**Lucruri noi, care nu există astăzi.**

| Ce | Unde este descris |
|---|---|
| lumea legendelor, cu lista conceptelor | Secțiunile 4.2 și 4.3. |
| tipurile `w.legend.space`, `w.legend.axis`, `w.legend.region`, `w.legend.degree`, `w.legend.act` | Secțiunea 4.8. |
| cheia `is` pe `core.type` | Secțiunile 3.1 și 4.7. |
| cheile `means`, `space`, `relation`, `role`, `part`, `unit` pe `core.slot`; refuzul unui slot fără `means` | Secțiunile 3.2 și 4.7. |
| felul de valoare `kind=point` | Secțiunea 3.2. |
| al treilea rezultat al verificării, „nedeterminată” | Secțiunea 3.9. |
| actele definite cu „înainte” și „după”; actele compuse deduse; verificarea de după execuție | Secțiunea 4.6. |
| clasa de comparație și factorii care se învață | Secțiunea 4.5. |
| cheile `realises` pe `std.tool.op`, `space` pe `std.tool.param`, `role` pe `std.schema.honours` | Secțiunea 6.1. |
| `resource=true` pe un tip și `counts=` pe un slot, pentru resurse | Secțiunea 7.4. |
| domeniul calendar | Secțiunea 7.4. |

**Lucruri care există astăzi și nu se mai folosesc în forma propusă.**

| Ce | Ce îi ia locul |
|---|---|
| `enum` pe sloturi, pentru cuvinte (336 de sloturi în 40 de lumi publicate) | Regiuni în spații conceptuale. `enum` rămâne numai pentru excepțiile declarate. |
| `ask` pe fiecare slot | Întrebarea generală a conceptului. |
| `default` pe sloturi | Valori obișnuite în cunoaștere, ca regiuni. |
| `accepts` și `scale` pe `std.tool.param` | `space`, cu partea din spațiu pe care o poate realiza unealta. |
| `effect` pe `std.tool.op` | `realises`, cu numele actului. |
| `on` cu chei fixe pe `std.schema.honours` | `role`, cu nume de concepte. |
| `std.schema.region` și `std.schema.relation` declarate de fiecare lume | Regiuni și relații declarate o dată. |
| cele unsprezece chei fixe ale cererii din programul bibliotecii | Cererea scrisă în concepte (secțiunea 6.3). |
| propozițiile de răspuns scrise pe situație (84 în engleză și 55 în română, în aplicație) | Un cadru de propoziție pentru fiecare act (secțiunea 6.10). |
| domeniile separate pentru grafice și pentru muzică | Graficele devin un fel de diagramă; muzica este scoasă deocamdată. |

**Nume de îndreptat.**

| Ce | De ce |
|---|---|
| `core.namespace` | Nu are legătură cu spațiile de nume ale faptelor (secțiunea 2.6); declară un prefix de chei. Un nume ca `core.keys.open` ar spune ce face. |
| *matrix*, în program și în documentația bibliotecii | Se trece treptat la „schema”. |
| identificatorul firelor `core.type` și `core.slot` | Este liber și nu poartă înțeles, ceea ce încurcă la citire. De hotărât: rămâne liber, cu convenția `t.<tip>` și `s.<tip>.<cheie>` verificată de un instrument, sau biblioteca îl verifică ea însăși. |

**Hotărâri care așteaptă.**

| Întrebarea | Variantele |
|---|---|
| amploarea refacerii | Decis: refacere completă, inclusiv motorul unde contractele o cer; implementarea începe după aprobarea proiectului. |
| harta | Decis: scoasă din demo. |
| avatarul | Fața este un lucru desenat cu părți; nu un domeniu separat. |
| numele tipurilor `w.legend.*` | Cele din secțiunea 4.8 sau altele. |
| unde stau factorii învățați ai cuvintelor de grad | În instanța de lume, sau într-o bază de cunoaștere a omului. |

## Anexa D. Hotărâri care încă nu s-au luat

Rândurile de mai jos sunt alegeri de politică. Prima coloană trimite la regula care ține locul hotărârii până atunci.

| Regula | Ce este de hotărât |
|---|---|
| R5 | Dacă lipsa de ordine a unei chei cu mai multe valori se declară cu `order=ignored` sau altfel. |
| R6 | Identitatea imutabilă separată de nume este decisă; referințele persistă perechea de identități, iar numele lizibile sunt aliasuri. Rămâne sintaxa serializării, conform 2.4.1 și 2.6. |
| R9 | Dacă „se știe că nu are” se scrie `none`, și pe ce sloturi este permis. |
| R31 | Mărimea pașilor: 1,25 pentru mărimi; 30 de minute pentru oră. |
| R34 | Dacă ce se învață poate trece vreodată în cunoașterea comună, și cine aprobă. |
| R48 | Recurența este inclusă; rămân de proiectat reprezentarea seriei, excepțiile și verificarea pe intervale finite. |
| R49 | Dacă normele sunt slabe în timpul lucrului sau unele sunt tari. |
| R59 | Dacă un grafic făcut din calendar rămâne o fotografie sau se ține la zi. |
| R64 | Ce se face cu o unealtă care nu poate desface: se execută și se spune, sau se cere acordul înainte. |
| R68 | Cum se verifică tonul unui text; până atunci răspunsul nu îl afirmă. |
