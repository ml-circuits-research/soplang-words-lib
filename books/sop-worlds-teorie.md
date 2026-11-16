# SOP Worlds: teoria

*Versiunea 17, 16 noiembrie 2026. Text de lucru în română; termenul englez este dat în paranteză la prima apariție. Exemplele de fire sunt în engleză, fiindcă așa se scriu în sistem.*

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

Capitolul 8 fixează regulile exacte, numerotate, cu exemple cu numere și cu cazurile-limită. Cartea spune ce trebuie să facă tehnologia: unde cartea și programul de astăzi diferă, câștigă cartea, iar diferența este trecută în anexa C (regulile R73–R77 din secțiunea 8.20). Alegerile care încă nu s-au luat sunt în anexa D.

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

În calendar, același om are o colegă, Ana, care are deja o ședință de la zece la unsprezece. Omul scrie **„a meeting with Ana at ten thirty”**. De data aceasta se încalcă o regulă care nu poate fi ocolită: un om nu poate fi în două ședințe în același timp. Aplicația nu pune ședința și nici nu o mută pe tăcute. Răspunde: „Ana is busy from 10 to 11. The nearest free time is 11:00. Shall I put it there?”

---

# 2. Limbajul SOP Lang

Capitolul acesta descrie limbajul așa cum este astăzi. Limbajul are o singură construcție, firul, și patru semne.

## 2.1 Firul

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

## 2.2 Valorile

O valoare este de unul din patru feluri. Felul se recunoaște după primul caracter.

| Felul | Cum se scrie și ce este |
|---|---|
| atom | Orice șir de caractere fără spații care nu începe cu `$`, `?`, `@` sau `#`: `fish`, `1.6`, `120,540`, `10:30`, `5kg`. Numerele, cantitățile, orele și numele sunt toate atomi. Limbajul nu le deosebește între ele; ce înseamnă un atom hotărăște schema (secțiunea 3.2). |
| text (string) | Scris între ghilimele: `"Review"`. Poate conține spații. |
| referință (reference) | `$` urmat de identificatorul unui fir: `$pond1`. Înseamnă „firul cu acest identificator”. |
| variabilă (variable) | `?` urmat de un nume: `?n`. Înseamnă „orice valoare”. Este permisă numai în reguli și în întrebări, niciodată într-un fapt (secțiunea 3.4). |

## 2.3 Cele patru semne

| Semnul | Ce înseamnă și unde poate sta |
|---|---|
| `@` | Declară un fir. Stă numai la începutul unei declarații. |
| `$` | Trimite la un fir, prin identificatorul lui. Stă numai la începutul unei valori. |
| `?` | Este o variabilă. Stă numai la începutul unei valori, în reguli și în întrebări. |
| `#` | Începe un comentariu, care ține până la sfârșitul rândului. |

Mai există semnul `::`, care apare în interiorul unui identificator; este explicat în secțiunea 2.6.

## 2.4 Nume: identificatori, tipuri, chei și puncte

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

## 2.5 Două feluri de fire: fapte și schemă

Toate firele se scriu la fel, dar biblioteca le folosește în două feluri.

Un **fapt (fact)** este un fir care spune că ceva există și cum este: peștele `f1`, ședința de la zece. Faptele se schimbă mereu, pe măsură ce omul lucrează.

**Schema (schema)** este mulțimea firelor care spun ce fapte au voie să existe și ce decurge din ele. Schema se scrie o dată, de către cel care descrie domeniul, și se schimbă rar. În programul și documentația bibliotecii, schema se numește încă *matrix*; trecerea la numele „schema” se face treptat.

Biblioteca hotărăște în care din cele două categorii intră un fir după două reguli. Un fir este al schemei dacă tipul lui este unul dintre tipurile predefinite de schemă (cele din capitolul 3, de exemplu `core.type` sau `core.rule`). Un fir este al schemei și dacă o regulă din același text îl numește; un asemenea fir este un model (secțiunea 3.4). Orice alt fir este un fapt.

Faptele și firele schemei au identificatori separați: un fapt `p` și un fir de schemă `p` nu se ciocnesc.

## 2.6 Spațiile de nume

**Problema.** Aplicația ține mai multe lumi deodată: pagina de desen, diagrama, documentul, calendarul. Fiecare își numește lucrurile cum vrea, și este firesc ca în diagramă să existe un fir `n1` și în altă lume tot un `n1`. Atâta timp cât lumile stau despărțite, nu se întâmplă nimic. Dar unele cereri au nevoie de două lumi deodată, de exemplu „a bar chart of meetings per person”, care citește calendarul și scrie în diagramă. Atunci faptele celor două lumi ajung una lângă alta, iar două fire diferite cu același identificator ar fi luate drept unul singur.

**Soluția.** Fiecare lume primește un **spațiu de nume (namespace)**: un nume scurt care este pus automat în fața identificatorului fiecărui fapt al ei, despărțit prin `::`. Dacă lumea diagramei are spațiul de nume `diagram`, faptul scris `@n1 node ...` este ținut de bibliotecă drept `diagram::n1`.

**Cine îl stabilește.** Spațiul de nume **nu se declară printr-un fir**. Îl dă programul aplicației, în clipa în care creează lumea: îi spune bibliotecii „aceasta este o lume nouă, cu spațiul de nume `diagram`”. De atunci, fiecare fapt spus acelei lumi primește prefixul singur. Cine scrie fire pentru un domeniu nu scrie niciodată `diagram::`; scrie `@n1` și `$n1`, ca și cum ar fi singur. În aplicația noastră, fiecare instanță de lume este creată astfel, cu spațiul ei.

**Regulile.** Sunt patru, și toate servesc același scop: faptele a două lumi să nu fie amestecate din greșeală.

| Regula | Ce înseamnă |
|---|---|
| referința simplă rămâne în lume | `$n1`, scris în lumea diagramei, înseamnă `diagram::n1`. |
| trecerea în altă lume se scrie | Ca un fir să trimită la un fapt din altă lume, spațiul trebuie scris: `$calendar::m1`. `$::x` înseamnă faptul `x` care nu este în niciun spațiu de nume. |
| o regulă se potrivește într-un singur spațiu | O regulă nu leagă, prin valori egale, un fapt din diagramă cu unul din calendar. Două fapte se pot întâlni într-o regulă numai dacă unul trimite la celălalt printr-o referință scrisă. |
| schema nu este în niciun spațiu | Firele schemei sunt aceleași pentru toate lumile care le folosesc. Numai faptele au spațiu de nume. |

Un tip poate fi declarat `shared=true` (secțiunea 3.1); faptele lui aparțin atunci tuturor spațiilor de nume. Este folosit pentru lucruri care sunt aceleași peste tot, cum este omul care folosește aplicația.

**O capcană de nume.** Există și un tip predefinit numit `core.namespace`. Nu are legătură cu spațiile de nume de mai sus: declară un prefix de chei care sunt primite pe orice fir (secțiunea 3.8). Numele lui este înșelător; schimbarea lui este trecută în anexa C.

---

# 3. Schema unei lumi

Capitolul acesta descrie, tot așa cum sunt astăzi, tipurile predefinite ale limbajului: tipurile de fire cu care se scrie o schemă. Pentru fiecare se spune la ce folosește, se dă tabelul complet al cheilor și un exemplu. Ordinea este de la cele folosite cel mai des.

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

## 3.4 Modele și variabile

**Problema.** Sloturile spun ceva despre un singur fir. Multe lucruri pe care vrem să le declarăm privesc mai multe fire deodată: „un nod spre care nu vine nicio săgeată este un început”; „un om nu poate fi în două ședințe în același timp”. Pentru ele este nevoie de un fel de a vorbi despre **orice** fir de un anumit fel.

**Modelul.** Un **model (pattern)** este un fir care nu spune că ceva există, ci descrie firele care trebuie căutate. Se scrie ca orice fir. Este model numai fiindcă o regulă îl numește (secțiunea 2.5).

**Variabila.** Într-un model, în locul unei valori se poate scrie o **variabilă (variable)**: `?` urmat de un nume. Variabila se potrivește cu orice valoare și o ține minte sub numele ei.

```
@p.in link to=?n
```

Acest model descrie orice fir de tipul `link`. Pentru fiecare fir găsit, variabila `?n` ia valoarea cheii `to` a acelui fir.

Trei reguli despre variabile. O variabilă care apare de mai multe ori în aceeași regulă trebuie să aibă aceeași valoare peste tot; astfel se leagă două modele între ele. O variabilă este valabilă numai în regula în care apare; `?n` din altă regulă este altă variabilă. Un fapt nu poate conține variabile.

**Trei chei speciale** pot fi puse pe un model sau pe un fir de construit. Nu fac parte din firul descris; schimbă felul în care este folosit.

| Cheia | Ce face |
|---|---|
| `core.absent` | Pe un model. Valoarea este numele unei chei: modelul se potrivește numai cu fire care nu au nicio valoare la acea cheie. |
| `core.select` | Pe un model. `latest` sau `first`: dintre firele care se potrivesc, numai ultimul sau primul. |
| `core.on` | Pe un fir de construit. Valoarea este un model al aceleiași reguli: în loc să se facă un fir nou, cheile se adaugă pe firul găsit de acel model. |

## 3.5 `core.rule`: ce decurge din ce există

**La ce folosește.** O **regulă (rule)** spune: de câte ori aceste modele se potrivesc, există și acest fir. Firul adăugat astfel se numește **dedus (derived)**. Biblioteca ține minte din ce a fost dedus fiecare fir și îl retrage singură când temeiul dispare. Astfel, ce decurge din starea lumii este mereu la zi, fără program care să îl întrețină.

**Exemplu.** În diagramă, un nod spre care nu vine nicio săgeată este un nod de început.

```
@p.node  node
@p.in    link to=$p.node
@t.start node core.on=$p.node start=true
@r.start core.rule when=$p.node not=$p.in then=$t.start
```

Primul fir este un model: orice nod. Al doilea este un model: o săgeată a cărei cheie `to` trimite la nodul găsit de primul model. Al treilea este firul de construit: pe nodul găsit se adaugă `start=true`. Al patrulea este regula: când există un nod (`when`) și nu există nicio săgeată spre el (`not`), atunci există ce descrie al treilea fir (`then`). Când omul trage o săgeată spre acel nod, `start=true` dispare singur.

| Cheia | Ce spune |
|---|---|
| `when` | Un model care trebuie să se potrivească. Cel puțin unul; repetată, trebuie să se potrivească toate. |
| `not` | Un model care nu trebuie să aibă nicio potrivire. |
| `with` | Un calcul de făcut (un fir `core.calc`, secțiunea 3.7). |
| `if` | O condiție care trebuie să fie adevărată (un fir `core.check`, secțiunea 3.7). |
| `then` | Firul de construit. Cel puțin unul. |
| `lazy` | `true`: firul este dedus numai când cineva întreabă de el. |

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

Apropierea dintre două asemenea concepte se calculează tot: câte părți și legături au în comun grafurile lor. Calculul are sens numai între două concepte cunoscute; ce se face cu un fel necunoscut sau fără graf propriu este în secțiunea 8.6.

**Excepții.** Câteva lucruri rămân liste închise, fiindcă țin de un sistem formal care are într-adevăr numai câteva valori: adevărat sau fals; persoana unui verb. Pentru acestea cheia `enum` rămâne potrivită. Fiecare excepție se declară cu motivul ei.

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

**Învățarea.** Fiecare cuvânt de grad are un factor de pornire: „big” înseamnă de aproximativ 1,6 ori față de clasa de comparație. Dacă omul scrie „bigger” imediat după ce a primit ceva „big”, factorul a fost prea mic, iar el este mărit, pentru acel fel de lume. Se învață deci numere, nu cuvinte.

**Comparativele** („bigger”, „shorter”, „later”) nu au nevoie de clasă de comparație: se compară cu valoarea pe care lucrul o are acum. Sunt un pas pe axă.

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

**Care domeniu răspunde.** Capabilitățile spun care domenii pot îndeplini o cerere. „Schedule a meeting with Ana”, spus în timp ce omul se uită la desen, ajunge la calendar, fiindcă numai calendarul promite că poate face ședințe. Zona deschisă pe ecran nu hotărăște deci cine poate. Când pot mai multe domenii („a red circle” poate fi făcut și de desen, și de diagramă), se alege în ordinea din secțiunea 8.14: domeniul numit în mesaj, apoi cel al lucrului despre care se vorbește, apoi cel la care omul se uită; dacă tot rămân mai multe, aplicația întreabă.

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

**Cerințele.** Fiecare lucru pe care omul îl vrea este o **cerință (constraint)** a cererii. Ca să poată fi urmărită până la capăt și pomenită în răspuns, o cerință ține minte mai mult decât valoarea ei. Ține minte despre ce concept este (mărime, loc, culoare); dacă omul o vrea sau nu o vrea („no circles”); despre care lucru din cerere este vorba; dacă privește fiecare lucru în parte sau pe toate la un loc; dacă este o cerință sau doar o preferință („if possible”); și cuvintele din care a fost citită. Toate acestea împreună sunt **identitatea** cerinței. Datorită ei, când omul scrie mai târziu „red, actually”, aplicația știe ce cerință anume se schimbă.

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

**Ce se face când ceva nu a fost înțeles.** Dacă rămân cuvinte necitite într-un loc care contează, cererea nu se execută; aplicația spune ce nu a înțeles, cu cuvintele omului. A executa jumătate de propoziție și a tăcea despre rest este mai rău decât a refuza. Un cuvânt scris greșit este corectat numai dacă nu este cunoscut de nicio sursă și există un singur candidat limpede; altfel „villa” ar deveni „via”. Limba mesajului este cea pe care omul a ales-o în aplicație.

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

## 6.9 Execuția

Planul este o listă de schimbări. Fiecare este dusă la unealta ei prin legătura declarată (secțiunea 6.1), iar unealta primește numere și referințe.

Greutatea este că lumea reală nu ascultă întotdeauna. Unealta poate eșua, sau omul poate schimba ceva cu mâna între timp. De aceea se țin două stări, cu rosturi diferite. **Starea observată** este ce se citește din unelte; ea poate fi și nevalidă, de exemplu când omul a tras cu mâna o ședință peste alta a aceluiași om. **Starea primită pentru execuție** este ce propune aplicația; ea trebuie să treacă verificarea. Regula dintre ele: unealta are întotdeauna dreptate despre ce există; instanța de lume este oglinda ei, nu invers.

După fiecare pas, starea este citită din nou și comparată cu condiția „după” a actului (secțiunea 4.6). Rezultatul unei execuții este unul din cinci: executat; executat în parte; desfăcut, adică s-a dat înapoi tot; efect necunoscut; desfacere eșuată. Ultimele două sunt rare, dar trebuie să aibă nume, fiindcă în ele aplicația nu are voie să spună nici „am făcut”, nici „nu am făcut”.

Pentru om, o cerere executată este un singur pas care se poate anula, oricâte unelte au pornit pentru ea. O reacție („bigger”) înlocuiește pasul pe care îl corectează, nu adaugă altul. O întrebare pusă de aplicație nu este un pas.

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

---


## 6.11 Cum explică sistemul un răspuns

Regula este simplă: explicația se construiește din evidența păstrată în timpul lucrului. Nu se inventează după răspuns o poveste plauzibilă. Când omul întreabă „why?”, sistemul arată legătura dintre cererea lui, regulile aplicate și rezultatul observat.

O **urmă de justificare (justification trace)** este înregistrarea acestei legături. Fiecare pas numește intrările, operația, rezultatul și pasul care l-a cerut. O intrare este fie un fragment al cererii, fie un fapt identificat din starea citită, fie o declarație dintr-o versiune fixată a cunoașterii. O concluzie derivată trimite la regula și intrările ei. O observație a uneltei poartă identitatea operației și versiunea stării observate.

Autorul tiparului declară regulile; motorul înregistrează potrivirile și calculele; unealta raportează efectele observate. Componenta de răspuns selectează din această urmă pașii necesari explicației și le exprimă sensul în cuvinte. Ea nu este autorizată să adauge o cauză pentru care nu există un pas înregistrat.

| Răspuns | Ce trebuie să explice „de ce?” |
|---|---|
| executat | Cerința, operația confirmată, diferența relevantă și verificarea condiției finale. |
| refuzat | Constrângerea încălcată, faptele care o declanșează și calculul; la date lipsă spune ce nu a putut verifica. |
| întrebare | Ambiguitatea sau valoarea lipsă, candidații cunoscuți și de ce alegerea nu este justificată. |
| presupunere | Valoarea omisă de om, sursa valorii completate și motivul pentru care acea sursă se aplică. |
| adaptare | Valoarea cerută, valoarea realizată, distanța, toleranța și regula care permite abaterea. |

Urmărim exemplul calendarului. Pentru claritate, numerele sunt minute față de începutul zilei fixate în exemplu, o reprezentare de calcul, nu formatul de stocare al momentelor absolute. Ana este ocupată între 600 și 660. Noua cerere are începutul 630 și durata 30. Înregistrarea calculului este următoarea; notația tabelului arată câmpurile urmei, nu introduce tipuri SOP noi.

| Pas | Evidență înregistrată |
|---|---|
| intrare | Cererea spune 10:30 și 30 minute; participantul se rezolvă la identitatea Anei. |
| fapt | Rezervarea existentă, la versiunea citită, are același participant și intervalul [600,660). |
| calcul | Sfârșitul cerut este 630 + 30 = 660. |
| regulă | Două intervale ale aceluiași participant nu se suprapun; 630 < 660 și 600 < 660 sunt ambele adevărate. |
| rezultat | Cererea exactă este refuzată; nu a fost executată nicio operație. |

Explicația pentru om este: „Ana already has a meeting from 10:00 to 11:00. Your 30-minute meeting at 10:30 overlaps it, so I did not schedule it.” Fiecare afirmație corespunde unui pas. Dacă numele Ana are doi candidați, explicația este în schimb „Two people named Ana match your request; I need to know which one.” Nu se calculează disponibilitatea unei persoane alese arbitrar.

În desen, pentru „I moved the duck onto the lake”, explicația arată identitatea raței, relația cerută, operația și observația care dovedește că relația se ține după mutare. Dacă s-a folosit imaginea unei păsări, se adaugă lanțul rață–pasăre și realizarea disponibilă: aceasta explică imaginea, fără să schimbe felul lucrului.

În diagramă, pentru o distanță minimă de 12 unități ale paginii, explicația poate spune „The nodes were 8 units apart; the layout moved them to 14, satisfying the minimum of 12.” Urma trebuie să conțină măsurările și limita. Nu poate afirma „best layout” fără o dovadă de optimizare.

În document, dacă lungimea a fost completată dintr-o valoare obișnuită, explicația numește genul și sursa acelei valori: „You did not specify a length; I used the declared usual length for this kind of letter.” Dacă sursa lipsește, propoziția nu este permisă. Pentru ton, lipsa unei verificări nu poate fi ascunsă prin „I made it formal”: se explică doar transformarea efectuată și faptul că rezultatul nu a fost verificat pentru ton.

Pentru toate domeniile, explicația scurtă poate fi desfășurată în pașii ei, cu identitățile și versiunile reale. Numele de reguli dintr-un exemplu al cărții nu sunt dovezi dintr-o execuție. Dacă urma s-a pierdut, răspunsul corect este că justificarea nu mai este disponibilă, nu o reconstrucție prezentată ca certitudine.

# 7. Cele patru domenii

Capitolul acesta arată cum arată fiecare domeniu când tot ce s-a explicat este pus la lucru. Fiecare secțiune are aceeași formă: declarația întreagă a domeniului, citită pe scurt; ce rămâne program; și un tabel cu propoziții ale omului, fiecare cu ce se întâmplă și cu secțiunea din care decurge.

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

# 8. Reguli precise și cazuri-limită

Capitolele 2–7 explică ideile. Capitolul acesta le fixează: pentru fiecare temă spune regula exactă, dă un exemplu cu numere, un contraexemplu și ce se întâmplă când regula nu poate fi îndeplinită. Fiecare regulă are un număr (R1, R2 și așa mai departe), ca planul de refactorizare să poată trimite la ea. Unde o regulă este o alegere de politică pe care trebuie să o confirme proprietarul, este scris **(de confirmat)**; alegerile nehotărâte sunt adunate în anexa D.

## 8.1 Puncte și chei cu mai multe valori

**R1. Un punct este o singură valoare.** Se scrie ca un atom făcut din numere despărțite prin virgulă, fără spații: `at=120,540`. Slotul lui spune `kind=point` și numește spațiul: `space=page`.

**R2. Axele se recunosc după ordine.** Numerele unui punct sunt în ordinea în care sunt declarate axele spațiului. Pentru aceasta fiecare fir `w.legend.axis` poartă cheia `order` (1, 2, 3). Pentru spațiul paginii, axa 1 este orizontala și axa 2 verticala; `120,540` înseamnă orizontală 120, verticală 540.

**R3. Două puncte sunt egale** când au același număr de numere și numerele sunt egale ca numere, axă cu axă. `120,540` și `120.0,540` sunt același punct. `540,120` este alt punct.

**R4. Un punct incomplet sau prea lung este refuzat.** Într-un fapt, `at=120` sau `at=120,540,3` pentru spațiul paginii este o încălcare de felul `domain`. O cerere poate vorbi despre o singură axă („move it up”), dar aceea este o cerință a cererii asupra unei axe, nu un punct pe un fapt (secțiunea 6.3).

**R5. O cheie cu mai multe valori este o listă ordonată.** Aceasta este regula limbajului de astăzi: valorile sunt ținute în ordinea în care au fost scrise. Când ordinea nu are înțeles (participanții unei ședințe), slotul o spune cu `order=ignored` **(propus)**; atunci două fapte cu aceleași valori în altă ordine sunt egale, iar o valoare scrisă de două ori este ținută o dată.

Astăzi biblioteca nu are `kind=point`; un punct se ține ca două numere sub o cheie cu `many=true` sau ca valoare `json`. Trecerea la R1 este o schimbare de făcut.

## 8.2 Identitatea și viața unui fir

**R6. Identitatea unui fapt este perechea formată din numele lumii lui și identificatorul lui.** Numele lumii este spațiul de nume din secțiunea 2.6. **(Propus)** Numele se ia din firul `std.schema.world name=...` al tiparului, completat cu un număr când există mai multe instanțe ale aceluiași tipar; astfel nu mai depinde de felul în care programul creează lumea.

**R7. La ce trimite o referință.** Într-un fapt, `$x` trimite întotdeauna la un fapt, din aceeași lume. Într-o regulă, `$x` trimite întotdeauna la un model sau la un fir de construit al aceleiași reguli. Cele două nu se pot confunda, deși un fapt și un fir de schemă pot avea același identificator, fiindcă locul în care este scrisă referința hotărăște unde este căutată.

**R8. O referință trebuie să se rezolve până la sfârșitul schimbării în care apare.** Altfel schimbarea este refuzată (`dangling-ref`). Singura excepție este un slot cu `by=` (secțiunea 3.2): valoarea rămâne în așteptare până când este spus firul numit, iar lumea o ține într-o listă de legături neînchise.

| Întâmplarea | Ce se întâmplă cu identitatea și cu referințele |
|---|---|
| ștergerea unui lucru | Relațiile care au nevoie de el dispar odată cu el: săgețile unui nod șters. Un lucru care doar trimite la el (o ședință la sala ei) blochează ștergerea, cu motivul spus. |
| copierea | Copia are identificator nou. Păstrează felul și însușirile. Nu păstrează referințele la alte lucruri, în afară de cele ale căror sloturi spun `copy=keep`. |
| importul unei scheme | Identificatorii firelor de schemă primesc numele modulului în față. Faptele nu sunt atinse. |
| schimbarea numelui | Identificatorul nu se schimbă niciodată. Numele văzut de om este o cheie (`label`, `title`), deci schimbarea lui nu atinge nicio referință. |
| salvarea și reîncărcarea | Identificatorii se păstrează întocmai. |

## 8.3 Necunoscut, fals și complet

**R9. O cheie a unui fapt este în una din trei stări.** Are o valoare. Nu are valoare, și atunci valoarea este necunoscută. Sau se știe că nu are: aceasta se scrie cu valoarea `none` **(propus)**, permisă numai dacă slotul spune `none=allowed`. O ședință ținută la distanță are `room=none`; o ședință fără cheia `room` are o sală pe care nu o știm încă.

**R10. Cum se potrivește un model.** Un model care cere `room=?r` se potrivește numai cu fapte a căror cheie `room` are o valoare. Nu se potrivește nici cu „necunoscut”, nici cu `none`. `core.absent=room` se potrivește cu amândouă.

**R11. `not=` vorbește despre ce ține lumea acum.** O regulă cu `not=$p` se aplică atunci când niciun fapt de acum nu se potrivește cu `p`. Nu afirmă că așa ceva nu există în realitate. De aceea un fir dedus printr-un `not=` este retras de îndată ce apare faptul care lipsea.

**R12. Întrebarea „există?” are trei răspunsuri.** Da, dacă un fapt se potrivește. Nu, dacă niciunul nu se potrivește și tipul este declarat `complete`. Nu se știe, în rest.

**R13. Ce interdicții privesc o schimbare.** Toate interdicțiile ale căror modele se pot potrivi cu cel puțin un fir atins de schimbare (adăugat, modificat sau șters). Fiindcă modelele unei interdicții se leagă între ele prin variabile, aici intră și firele neatinse: la mutarea unei ședințe sunt verificate toate ședințele care au aceeași sală sau un participant comun.

**R14. Când este o interdicție nedeterminată.** Când un fir atins se potrivește cu un model al ei la toate cheile pe care le are, dar îi lipsește o cheie pe care modelul sau o condiție a interdicției o citește.

| Starea ședinței noi | Rezultatul verificării suprapunerii |
|---|---|
| are început și durată; nu se suprapune | Validă. |
| are început și durată; se suprapune cu alta a Anei | Nevalidă, cu încălcarea care numește cele două ședințe. |
| are început, dar durata este necunoscută | Nedeterminată. Nu se execută; se cere durata. |
| are `room=none` | Interdicția despre săli nu o privește. Cea despre oameni rămâne. |
| primește două ore de început diferite | Refuzată ca `conflict`, înainte de orice interdicție. |

## 8.4 Ce conține lumea legendelor și cum pornește

**R15. Tipurile de fire ale lumii legendelor** sunt cele din secțiunea 4.8, la care se adaugă patru, pentru ca toate conceptele din secțiunea 4.3 să aibă unde fi declarate.

| Tipul | Ce declară și cu ce chei |
|---|---|
| `w.legend.concept` | Un concept general. Chei: `name`; `group` (grupa din care face parte); `specialises` (conceptul mai general, dacă are unul); `question` (întrebarea generală: „Where?”). |
| `w.legend.role` | Un rol. Chei: `name`; `of` (actul sau relația în care apare). |
| `w.legend.relation` | O relație generală. Chei: `name` (`in`, `on`, `next_to`); `space` (în ce spațiu se măsoară); `inverse`; `test` (funcția care spune, din pozițiile a două lucruri, dacă relația ține). |
| `w.legend.unit` | O unitate de măsură. Chei: `name`; `of` (axa); `factor` (câte unități de bază face). |

Felurile de afirmații, cuprinderea și negația sunt fire `w.legend.concept`. O resursă nu are tip propriu: un tip de lucruri se declară resursă cu `resource=true` pe firul lui `core.type`.

**R16. Pornirea, fără cerc.** Sunt patru straturi, fiecare scris numai cu ce este sub el. Tipurile `core.` sunt fixe, fac parte din limbaj și nu sunt descrise de nimic. Lumea legendelor este scrisă cu `core.type` și `core.slot`; sloturile tipurilor `w.legend.` sunt singurele scutite de cheia `means`. Tiparele și bazele de cunoaștere folosesc lumea legendelor. Instanțele folosesc tiparele.

**R17. Suprapunerile aparente sunt specializări.** Durata este timp (`means=time part=duration`); fiindcă timpul are o axă, pe ea funcționează și „longer”, ca pentru orice însușire. Participantul este un rol (`role=participant`); că ședința „este a” participanților se deduce, nu se declară a doua oară. Locul unei secțiuni în text este un loc, în spațiul `order`. Regula generală: un slot are un singur `means`; ce mai decurge vine din faptul că acel concept are un spațiu.

## 8.5 Distanța și regiunile

**R18. Fiecare axă este adusă la aceeași scară.** O valoare este împărțită la întinderea axei (`max` minus `min`), deci diferența dintre două valori pe o axă este un număr între 0 și 1. O axă poate avea o pondere, `weight`, implicit 1.

**R19. Pe o axă circulară** (`kind=angle`, cu perioada 360), diferența este drumul cel mai scurt pe cerc, împărțit la jumătate de perioadă. Între nuanțele 350 și 0 diferența este 10/180, adică 0,056.

**R20. Distanța dintre două puncte** este rădăcina pătrată a sumei pătratelor diferențelor pe axe, fiecare înmulțită cu ponderea axei.

**R21. O regiune poate lăsa axe nespuse.** „Dark” spune numai `centre.lightness=0.25`; orice nuanță și orice saturație sunt primite. Distanța până la o asemenea regiune se calculează numai pe axele spuse.

**R22. Un punct este în regiune** când distanța lui până la centru este cel mult `spread`. Marginea face parte din regiune. Exemplu: nuanța 350, saturația 0,9, luminozitatea 0,5 față de „red” (centrul 0; 0,9; 0,5; `spread` 0,12): distanța este 0,056, deci punctul este roșu.

**R23. Regiunile se pot suprapune.** Un punct poate fi și „red”, și „orange”. La căutare („the red fish”) contează apartenența. La numire, în răspuns, se folosește regiunea cu centrul cel mai apropiat. O regiune din mai multe bucăți se scrie ca mai multe fire cu același nume.

**R24. Includerea unei regiuni în alta se calculează.** Centrul dinăuntru nu este o dovadă suficientă. Pe o axă, intervalul [4, 8] are centrul 6 în [0, 7], dar punctul 8 este în afară. Pentru două bile în aceeași metrică, o condiție suficientă este `distanța dintre centre + raza interioară ≤ raza exterioară`. Pentru intervale se compară ambele capete. Pentru forme generale, verificatorul trebuie să poată demonstra includerea prin operațiile declarate ale spațiului. Dacă nu poate, rezultatul este nedeterminat; relația nu se folosește ca adevăr demonstrat. Eșantionarea câtorva puncte poate găsi un contraexemplu, dar nu dovedește includerea. La aplicarea testului trebuie comparate aceleași axe, în aceeași metrică. O axă omisă din regiunea interioară rămâne liberă în limitele spațiului: dacă regiunea exterioară o restrânge, includerea nu rezultă din testul centrelor și razelor. De exemplu, „dark” lasă nuanța liberă și nu este inclus în „blue”, chiar dacă alegem pentru ilustrare un centru albastru.

Relația de includere este un rezultat calculat, nu o afirmație primită fără dovadă. Poate servi la explicarea relației dintre două regiuni; găsirea unui pește albastru folosește direct apartenența punctului său la regiunea albastră. Cheia `inside` se retrage din propunerea de declarație: o relație derivată poate fi memorată împreună cu dovada și versiunile regiunilor, apoi invalidată când acestea se schimbă.

**R25. Egalitatea de distanță.** Când două valori posibile sunt la fel de aproape de cea cerută, se face una din două, după caracterul valorii (secțiunea 6.6). Dacă valoarea este o cerință a omului, aplicația le oferă pe amândouă și întreabă: la zece și jumătate cerut, cu zece și unsprezece libere, „10:00 or 11:00?”. Dacă este o presupunere a aplicației, se ia cea mai mică pe prima axă și se spune.

## 8.6 Grafurile de părți și felurile necunoscute

**R26. Ce este graful unui concept.** O mulțime de părți, fiecare cu felul ei, cu un număr minim și maxim de apariții (minimul 1 înseamnă obligatorie), și o mulțime de legături între părți, fiecare cu o etichetă: `before` (ordine), `in` (cuprindere), `to` (săgeată).

**R27. Apropierea a două grafuri** este partea comună împărțită la tot: se numără părțile și legăturile care apar în amândouă și se împart la cele care apar în cel puțin unul. O parte obligatorie contează dublu. Rezultatul este între 0 și 1. Calculul are sens numai între două grafuri cunoscute; se folosește la întrebări ca „cu ce gen seamănă acest document?”.

**R28. Un fel necunoscut nu este înlocuit.** Textul mai vechi al secțiunii 4.4 spunea că un „memo” fără graf este făcut ca o scrisoare scurtă, fiindcă este cel mai apropiat. Aceasta era greșit: față de ceva necunoscut nu se poate calcula nicio apropiere. Regula corectă are trei cazuri.

| Ce se știe despre felul cerut | Ce face aplicația |
|---|---|
| nu este în arborele felurilor | Nu a înțeles cuvântul. Spune: „I do not know what a memo is.” Nu face nimic. |
| este în arbore, dar nu are graf propriu | Folosește graful celui mai apropiat strămoș care are unul (un memo este un text) și spune o dată ce a folosit. Lucrul rămâne de felul cerut. |
| are graf propriu | Îl folosește. |

Dacă doi strămoși la aceeași depărtare au grafuri diferite, aplicația întreabă.

## 8.7 Cuvintele de grad, pasul și învățarea

**R29. Valoarea de referință a unei clase de comparație** este mediana valorilor lucrurilor din clasă. Cu un singur lucru, este valoarea lui. Fără niciun lucru, se trece la sursa următoare din secțiunea 4.5.

**R30. Două feluri de axe.** O axă cu zero firesc (mărimea, lungimea, durata, numărul) se declară `scale=ratio`; pe ea cuvântul de grad înmulțește: referința ori factorul. O axă fără zero firesc (poziția, ora) se declară `scale=interval`; pe ea nu se înmulțește, iar cuvinte ca „late” sau „high” sunt regiuni ale axei, nu cuvinte de grad.

**R31. Pasul unui comparativ** este declarat pe axă, cu `step`. Pe o axă `ratio` este un factor (propus 1,25); pe o axă `interval` este o mărime în unitățile axei (propus: 30 de minute pentru oră, o zecime din pagină pentru poziție). „Much bigger” face doi pași.

**R32. Marginile.** Rezultatul este adus între marginile pe care le poate realiza unealta. Dacă prin aceasta nu se schimbă nimic, nu se execută nimic, iar răspunsul este „It is already as big as it can be.”

**R33. Învățarea.** „Bigger” este întotdeauna o cerere nouă: lucrul crește cu un pas. Este în plus un semn că factorul a fost prea mic numai dacă urmează imediat după o valoare pe care aplicația a calculat-o dintr-un cuvânt de grad. Atunci factorul se mută la jumătatea drumului dintre cel vechi și cel acceptat de om.

Exemplu complet. Peștii din iaz au mărimile 0,8 și 1,2; mediana este 1,0. „A big fish”: 1,0 × 1,6 = 1,6. Omul scrie „bigger”: 1,6 × 1,25 = 2,0. Factorul lui „big”, pentru desene, devine (1,6 + 2,0) / 2 = 1,8. Următorul „big fish”, cu aceeași mediană, are mărimea 1,8.

**R34. Unde stă ce s-a învățat.** Factorul învățat este un fapt, cu proveniența lui (din ce mesaj), ținut pentru omul care folosește aplicația și pentru felul de lume (desen, calendar). Anularea pasului care l-a produs îl anulează și pe el. Nu trece niciodată singur în cunoașterea comună **(de confirmat)**.

## 8.8 Actele, în formă structurată

**R35. Condițiile unui act nu sunt texte.** Secțiunea 4.8 le-a scris ca texte pentru a fi ușor de citit. Forma exactă folosește patru feluri de condiții, câte una pentru fiecare schimbare de bază.

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

**R36. Ce nu este numit nu se schimbă.** După un act, singurele diferențe permise în stare sunt cele din condiția „după” și cele care decurg din ea prin reguli. Orice altă diferență este spusă în răspuns ca schimbare neașteptată.

**R37. Când are voie aplicația să facă un lucru care lipsește.** Numai când omul l-a numit nehotărât. „Put **a** child on the swing”: nu există copil, se face unul. „Put **the** child on the swing” sau „put Tom on the swing”: omul vorbește despre un lucru anume; dacă nu există, aplicația spune „There is no child in the picture.” și nu face nimic.

**R38. Actele derivate.** „Copy” este „a face” un lucru cu felul și însușirile celui copiat; identitatea este nouă, iar referințele urmează R8. „Swap” este de două ori „a așeza”, cu țintele luate din starea dinainte: fiecare lucru primește locul pe care îl avea celălalt. „Replace A with B” este „a face” B la locul lui A, mutarea pe B a relațiilor lui A și „a șterge” A.

**R39. Descompunerea se oprește.** Singura condiție „înainte” care poate cere un alt act este `exists`, iar actul care o îndeplinește, „a face”, nu are nicio condiție „înainte”. Lanțul are deci cel mult doi pași pentru fiecare rol. Dacă un domeniu adaugă acte cu alte condiții, planificarea refuză un plan în care aceeași pereche de act și lucruri apare a doua oară.

## 8.9 Feluri, tipuri și înlocuitori

Trei lucruri au fost numite „moștenire” și trebuie ținute deosebite.

| Ce | Unde stă și ce transmite |
|---|---|
| moștenirea tipurilor | În schemă (`core.type extends=`). Transmite chei, reguli și interdicții. |
| moștenirea felurilor | În cunoaștere (arborele felurilor: o rață este o pasăre). Transmite ce se știe: părți, valori obișnuite, cuvinte. |
| înlocuitorul | În domeniu. Este o realizare împrumutată: imaginea păsării pentru o rață. Nu schimbă felul lucrului. |

**R40. Un fel are un singur părinte.** Alte împărțiri ale lucrurilor nu sunt feluri. „Lucrurile roșii” sunt o regiune a unui spațiu. „Nodurile de început” sunt un rol dedus de o regulă. „Lucrurile care plutesc” sunt o afirmație de cunoaștere despre mai multe feluri.

**R41. Ce este declarat mai aproape câștigă.** O valoare obișnuită sau o normă spusă despre un fel o înlocuiește pe cea spusă despre un strămoș. Fiindcă există un singur părinte, nu pot veni două valori de la aceeași depărtare.

**R42. O restrângere este corectă** dacă tot ce permite ea era permis și înainte: o regiune aflată în regiunea părintelui, margini între marginile părintelui. Se verifică la încărcare. O constrângere tare nu poate fi slăbită nici de un descendent, nici de om. Una slabă poate fi depășită de o cerință a omului.

**R43. Un rând particular este legitim** când spune ceva diferit de ce ar da strămoșul. „Peștele stă în apă” este legitim, fiindcă animalele stau de obicei pe pământ. Verificarea refuză numai rândurile care repetă ce spune un strămoș sau care sunt scrise pentru mai multe feluri surori cu aceeași valoare, semn că locul lor era pe părinte.

## 8.10 Repere pentru loc și pentru timp

**R44. Fiecare spațiu de loc își declară reperul:** originea, sensul axelor și unitatea. Pagina are originea în colțul din stânga sus, axa orizontală spre dreapta, axa verticală în jos, iar unitatea este unitatea paginii. „Above” înseamnă deci un număr mai mic pe axa verticală. Poziția unui lucru este întotdeauna în reperul paginii, chiar dacă lucrul este „în” altul.

**R45. Relațiile de loc sunt definite prin numere,** în funcția `test` a fiecărei relații (R15). „Near”: distanța dintre marginile celor două lucruri este mai mică decât o fracțiune din diagonala paginii (propus 0,15). „Above”: mai sus pe axa verticală și suprapus pe cea orizontală.

**R46. Timpul din calendar.** O ședință ține un moment absolut de început și o durată. Calendarul își declară fusul orar; orele spuse de om sunt înțelese în acel fus. Un interval își cuprinde începutul și nu își cuprinde sfârșitul: o ședință care se termină la 11:00 și una care începe la 11:00 nu se suprapun, deci sala este liberă.

**R47. Schimbarea orei.** Dacă ora cerută nu există în ziua aceea, aplicația refuză și spune de ce. Dacă există de două ori, întreabă care dintre ele.

**R48. Repetarea ședințelor intră în proiect.** O serie păstrează regula de repetare, fusul orar și excepțiile; fiecare apariție are identitate stabilă. Modificarea uneia trebuie deosebită de modificarea întregii serii. Verificarea conflictelor privește aparițiile din intervalul verificat, nu o expansiune infinită. O serie fără sfârșit nu poate fi declarată liberă pentru tot viitorul după verificarea unui număr finit de apariții. Forma firelor, intervalul verificat și politica de extindere sunt contracte de proiectare încă de scris; recurența nu este exclusă din implementarea țintă.

## 8.11 Fapt, normă, obișnuit; tare și slab

**R49. Cunoașterea spune felul afirmației; tiparul de lume îi dă tăria.** O bază de cunoaștere nu declară nimic tare sau slab. Tiparul de lume care folosește afirmația o face.

| Felul afirmației | Tăria, dacă tiparul nu spune altfel |
|---|---|
| fapt de domeniu („peștele stă în apă”) | Slabă. |
| normă („o scrisoare are semnătură”; „un flux are un singur început”) | Slabă în timpul lucrului. La o verificare cerută anume („check the letter”), fiecare normă neîndeplinită este raportată. |
| valoare obișnuită, euristică | Nu este o constrângere. Servește numai la completare și la alegere. |

**R50. Tari sunt numai două feluri de reguli:** cele fără de care starea nu poate fi reprezentată (o săgeată fără capete) și cele pe care tiparul le declară anume ca tari (un om în două ședințe deodată).

**Îndreptare.** Un pește pe cer este o problemă slabă, nu o stare nevalidă; secțiunea 6.9 dădea greșit acest exemplu. Exemplul corect de stare observată nevalidă este o ședință trasă cu mâna peste alta a aceluiași om.

## 8.12 Citirea unei propoziții cu mai multe înțelesuri

**R51. Citirea dă una sau mai multe cereri candidate.** Fiecare ține cerințele ei, cuvintele rămase necitite și legarea fiecărui cuvânt de un lucru.

**R52. Alegerea între candidate** se face în această ordine. Cad cele care trimit la lucruri ce nu există în stare. Cad cele pe care niciun domeniu nu le poate îndeplini. Dintre cele rămase câștigă cea preferată de o regulă declarată a limbii. Dacă rămân două care ar schimba lumea diferit, nu se execută nimic și aplicația întreabă.

Exemplu: „make the red and blue nodes bigger”. Prima citire: nodurile roșii și nodurile albastre. A doua: nodurile care sunt și roșii, și albastre. Dacă niciun nod nu este în amândouă regiunile, a doua citire nu găsește nimic și cade. Contraexemplu: „add red and blue nodes”. Prima citire: câte un nod din fiecare culoare. A doua: noduri în două culori. Unealta diagramei nu poate face un nod în două culori, deci a doua cade.

**R53. Cuvintele necitite.** Un cuvânt cu conținut (substantiv, adjectiv, verb, număr) rămas necitit oprește execuția. Un cuvânt de legătură necitit nu o oprește.

**R54. Viața unei întrebări deschise.** Întrebarea rămâne deschisă până când omul îi răspunde, până când aplicația pune alta sau până când se execută o cerere nouă. Un mesaj care se potrivește ca răspuns (are felul de valoare așteptat) este luat ca răspuns. Unul care nu se potrivește este o cerere nouă și închide întrebarea.

## 8.13 Când este permisă apropierea

**R55. Ce se poate apropia depinde de cât de exact a vorbit omul.**

| Cum a fost spusă valoarea | Ce are voie aplicația |
|---|---|
| exact: un număr, o oră, un nume („at ten thirty”, „Ana”) | Nimic altceva fără acordul omului. Dacă nu se poate întocmai, explică și propune. |
| vag: o regiune sau un cuvânt de grad („in the afternoon”, „big”) | Orice punct din regiune, respectiv din jurul valorii calculate, în toleranță. |
| ca pas: un comparativ („later”, „bigger”) | Mărimea pasului o alege aplicația, deci o poate potrivi la ce este liber sau posibil. |
| nespusă: o presupunere | Orice valoare permisă. Se spune dacă contează. |

**R56. Toleranța** este o distanță, în unitățile din secțiunea 8.5. Fiecare spațiu declară una implicită; un parametru al unei unelte poate declara alta. Toleranța zero înseamnă numai întocmai. Omul o poate schimba pe loc: „exactly” o face zero; „about” o dublează.

Exemple de margine, în spațiul formelor, cu toleranța 0,15. „Oval”, când unealta are elipsă: distanța 0,05; se face elipsa. „Triangle”, când cea mai apropiată formă a uneltei este rombul: distanța 0,4; nu se face romb, ci se spune că triunghiul nu este posibil și ce forme sunt.

## 8.14 Care domeniu răspunde și cererile peste două lumi

**R57. Capabilitățile aleg cine poate; nu ajung ca să aleagă cine răspunde.** Dintre domeniile care pot îndeplini cererea, se alege în această ordine: cel numit în mesaj („in the diagram”); cel al lucrului la care trimite mesajul sau al focusului; cel la care omul se uită acum. Dacă tot rămân mai multe, aplicația întreabă. Secțiunea 6.1 a fost îndreptată în acest sens: zona deschisă pe ecran nu hotărăște cine poate, dar desparte egalitățile. „A red circle” poate fi făcut și de desen, și de diagramă, deci merge la cel la care se uită omul.

**R58. O cerere peste două lumi citește dintr-una și scrie în cealaltă.** „A bar chart of meetings per person” citește calendarul și scrie în diagramă. Citirea se face o singură dată, la alcătuirea planului. Graficul ține minte de unde vine: sursa și momentul citirii.

**R59. Graficul nu se schimbă singur** când se schimbă calendarul **(de confirmat)**. Dacă o ședință este ștearsă, graficul rămâne cum era, iar la întrebare spune când a fost făcut. „Update the chart” îl reface.

## 8.15 Independență, execuție și eșec

**R60. Două părți ale unui plan sunt independente** dacă nu citesc și nu scriu aceleași fire, dacă nicio interdicție nu se poate potrivi cu fire din amândouă și dacă nu ocupă aceeași resursă. Dacă una dintre aceste condiții nu poate fi dovedită, părțile sunt socotite dependente: se execută amândouă sau niciuna.

**R61. Starea este citită din nou chiar înainte de execuție.** Dacă firele pe care planul le citește s-au schimbat de când a fost făcut, planul este refăcut o dată. Dacă s-au schimbat din nou, cererea este oprită și omului i se spune de ce.

**R62. La eșecul unui pas,** pașii executați ai aceleiași părți sunt desfăcuți în ordine inversă, fiecare prin actul lui invers. O operație nu este încercată a doua oară decât dacă unealta o declară fără urmări la repetare.

**R63. Dacă desfacerea eșuează,** starea este citită din nou și spusă omului așa cum este: ce a rămas făcut și ce nu. Aplicația nu pretinde nici că a făcut, nici că nu a făcut.

**R64. Uneltele celor patru domenii trebuie să permită anularea.** Contractul fiecărei operații include informația necesară refacerii stării dinainte și verificarea rezultatului anulării. Un eșec al anulării se raportează conform R63. O unealtă viitoare fără anulare are nevoie de o politică explicită; nu moștenește automat permisiunea de a executa.

## 8.16 Corectări și anulare

**R65. O reacție înlocuiește un pas numai în două condiții:** pasul este ultimul din istorie și lucrurile lui nu au fost schimbate de altcineva între timp. Altfel reacția este un pas nou.

| Ce se întâmplă, în ordine | Pașii din istorie |
|---|---|
| „draw a fish” | Pasul 1: un pește, mărimea 1,0. |
| „bigger” | Pasul 1 este înlocuit: un pește, mărimea 1,25. |
| omul trage peștele cu mâna | Pasul 2: mutarea, luată din starea observată. |
| „bigger” | Pasul 3: mărimea 1,56. Nu înlocuiește nimic, fiindcă ultimul pas nu este al aplicației. |

Anularea, de trei ori la rând, duce mărimea la 1,25, apoi peștele la locul dinainte, apoi șterge peștele. Ce s-a învățat într-un pas (R34) dispare odată cu el.

**R66. O schimbare făcută în alt domeniu** este un pas al acelui domeniu. Anularea desface ultimul pas, oricare ar fi domeniul lui, și spune ce a desfăcut.

## 8.17 Ce hotărăște planul și ce caută funcția unui domeniu

**R67. Planul alege între lucruri cu înțeles diferit; funcția caută înăuntrul alegerii.** Planul hotărăște că peștii stau în iaz, nu pe cer. Funcția desenului găsește în iaz trei poziții libere.

| Funcția | Ce primește, ce dă și cum este verificată |
|---|---|
| `free_spot` (desen) | Primește regiunea sau relația aleasă de plan, mărimea lucrului și lucrurile de acolo. Dă un punct, sau eșecul „nu este loc”. Planul verifică punctul cu `test`-ul relației (R45). |
| `layout` (diagrame) | Primește nodurile și săgețile. Dă câte un punct pentru fiecare nod. Verificare: niciun nod peste altul. |
| `compose` (documente) | Primește partea de scris, lista afirmațiilor pe care cunoașterea le are despre subiect, lungimea cerută și punctul de ton. Dă textul și lista afirmațiilor folosite. |

**R68. `compose` nu inventează.** Are voie să folosească numai afirmațiile primite și formule legate de partea scrisă (salutul, încheierea). Lungimea se verifică prin numărare. Afirmațiile folosite se verifică față de lista dată. Dacă lista este goală, se scriu numai formulele, iar răspunsul spune că despre subiect nu se știe nimic. **Tonul nu poate fi verificat automat în prima versiune;** răspunsul nu afirmă că tonul cerut a fost atins (anexa D).

## 8.18 Răspunsuri care spun adevărul

**R69. Înaintea fiecărui pas se verifică dacă condiția „după” ține deja.** Dacă da, unealta nu este pornită, iar răspunsul este „The duck is already on the lake.”

**R70. „Am făcut” se spune când sunt îndeplinite două lucruri:** unealta a confirmat operația și diferența dintre starea citită chiar înainte și cea citită chiar după conține schimbarea cerută.

**R71. Formele de răspuns** sunt cadrele celor patru acte și șapte forme generale.

| Forma | Când se folosește |
|---|---|
| deja așa | Condiția „după” ținea dinainte. |
| făcut în parte | Unele părți independente s-au făcut, altele nu; fiecare este numită. |
| refuz cu motiv | O interdicție tare, sau o cerință care nu se poate îndeplini. |
| întrebare | Lipsește o valoare, sau sunt mai mulți candidați. |
| efect necunoscut | Vezi R63. |
| răspuns despre stare | „What is on Friday?” |
| explicație | „Why is the fish there?”, din proveniența valorilor. |

## 8.19 Exemplele pe domenii sunt extrase

**R72.** Blocurile de fire din capitolul 7 sunt extrase schematice, nu declarații complete. Un domeniu complet are în plus: importul lumii legendelor și al bazelor de cunoaștere folosite; parametrii și legăturile fiecărei unelte; citirea stării; funcțiile proprii, cu argumentele lor.

| Domeniul | De ce depinde |
|---|---|
| desen | Lumea legendelor; arborele felurilor; regiunile de culoare și de mărime; părțile scenelor; cuvintele engleze. |
| diagrame | Lumea legendelor; regiunile de formă și de culoare; grafurile felurilor de diagrame. |
| documente | Lumea legendelor; grafurile genurilor; regiunile de ton; afirmațiile despre subiecte. |
| calendar | Lumea legendelor; tiparul persoanelor; regiunile zilei; unitățile de timp. |

Mai jos sunt cinci urmăriri pentru calendar, cu date. Pentru celelalte trei domenii urmăririle vin în runda următoare a cărții.

Starea de pornire, aceeași pentru toate: Ana are ședința `m1`, „Review”, luni, de la 10:00 la 11:00, în sala `r1`. Sălile `r1` și `r2` sunt altfel libere.

| Cazul | Ce se întâmplă, pas cu pas |
|---|---|
| reușită | „a meeting with Ana on Monday at 14:00 for an hour”. Cererea: a face; ședință; participant Ana; început luni 14:00, exact; durată 1 oră. Sala nu este spusă: este o cheie deschisă; candidate sunt `r1` și `r2`, amândouă libere; se ia prima și se notează ca presupunere. Verificare: validă. Execuție: apare `m2`. Răspuns: „I put a 1-hour meeting with Ana on Monday at 14:00, in room 1.” |
| două înțelesuri | „move Ana's meeting to Tuesday”, când Ana are două ședințe luni. Trimiterea „Ana's meeting” găsește două. Nu se execută nimic. „Which one? 1. Review, 10:00, 2. the meeting at 14:00.” |
| valoare lipsă | „a meeting with Ana on Monday”. Începutul lipsește. Valoarea obișnuită pentru durată este o oră. Pentru început nu există o presupunere rezonabilă, fiindcă ziua are multe ore libere. Întrebarea conceptului de timp: „When on Monday?” |
| refuz | „a meeting with Ana on Monday at 10:30”. Ora este exactă. Interdicția despre oameni se potrivește cu `m1`. Nu se execută. Cele mai apropiate ore libere sunt 9:30 și 11:00; 11:00 nu taie nimic din durata cerută. „Ana is busy from 10 to 11. The nearest free time is 11:00. Shall I put it there?” |
| anulare | După cazul de reușită, „undo”. Pasul șters este facerea lui `m2`. Starea citită din nou are numai `m1`. „I removed the meeting on Monday at 14:00.” |

## 8.20 Ce este cartea, ce este planul și când este gata cartea

**R73. Cartea spune ce trebuie să facă tehnologia.** Unde cartea și programul de astăzi spun lucruri diferite, câștigă cartea, iar diferența se trece în anexa C. Capitolele 2 și 3 descriu ce există și ce rămâne valabil; unde propunerea schimbă ceva din ele, schimbarea este marcată pe loc.

**R74. Patru feluri de enunțuri.** O regulă numerotată din acest capitol este o cerință. Un exemplu ilustrează și nu adaugă cerințe. O regulă marcată (de confirmat) este o alegere de politică, valabilă până când proprietarul spune altfel. Un rând din anexa D este o hotărâre care încă nu s-a luat.

**R75. Care plan este valabil.** Planul de lucru este `refactoring/sop-worlds-schimbari.md`. `refactoring/plan-generalizare.md` este mai vechi; unde cele două diferă (avatarul printre domenii, limba citită din fiecare mesaj, trimiterile la lecții), nu mai este valabil. După ce proprietarul corectează planul de lucru, fiecare sarcină din el va numi regulile de aici pe care le îndeplinește.

**R76. Trei stări diferite, care nu se amestecă.** Claritatea: cartea se poate citi și înțelege; o judecă proprietarul și sesiunea bibliotecii. Aprobarea: proprietarul este de acord cu ce spune. Conformitatea: programul face ce spune cartea; o arată testele. Un test care trece astăzi nu dovedește că o regulă a cărții este cea dorită.

**R77. Cartea este gata** când fiecare termen este definit înainte de a fi folosit, fără cerc; fiecare regulă are un exemplu și un contraexemplu; fiecare exemplu își spune dependențele; fiecare alegere nehotărâtă este în anexa D; și fiecare sarcină din plan numește o regulă aprobată.

**R78. Ce teste rămân și ce teste se schimbă.** Testele bibliotecii care verifică regulile din capitolele 2 și 3 rămân neschimbate. Cele atinse de propuneri (punctul ca valoare, al treilea rezultat al verificării, `means` obligatoriu, `none`) se schimbă cu bună știință și sunt enumerate în plan înainte de a fi atinse.

**R79. Numărătoarea nu își schimbă numitorul.** Mesajele din sesiunile omului care țin de domeniile scoase (grafice ca domeniu, muzică) rămân în numărătoare, într-o coloană separată, pentru ca procentele să nu crească prin scoaterea de cazuri.

**R80. Dovada cerută este explicația textuală verificabilă.** Pentru fiecare răspuns se poate urmări ce a spus omul, ce declarații generale și fapte au fost folosite, ce calcule au rezultat și ce s-a observat. Secțiunea 6.11 fixează contractul. Nu există un al cincilea domeniu de probă. O explicație nu demonstrează singură generalitatea: ea face vizibile dependențele pentru ca reviewerul să poată detecta o regulă scrisă pentru un caz particular. Testele intenției și contraexemplele verifică în continuare comportamentul.

**R81. Trecerea.** Drumul vechi de citire rămâne în aplicație până când drumul nou are, pe aceleași sesiuni, cel puțin tot atâtea mesaje corecte și niciunul greșit. Fiecare depozit își fixează versiunile celorlalte două; versiunile se mută numai împreună, cu testele celor trei trecute.

---

# 9. De la declarații la un rezultat: piesele care trebuie construite

*Capitol nou, versiunea 14. Propunere de arhitectură pentru review. Explică un contract de construit; nu pretinde că implementarea curentă îl îndeplinește. Numele concrete ale noilor tipuri de fire rămân de stabilit prin schema completă.*

## 9.1 Ce trebuie să știe programul general

A declara un concept nu înseamnă că programul îi înțelege automat numele. Numele „timp” nu execută un calcul. Programul poate lucra numai dacă declarația îl leagă de operații a căror semnificație este definită: comparație numerică, verificarea apartenenței, potrivirea unui model, aplicarea unei reguli sau căutarea unor valori.

Sunt trei feluri de extensie. Un autor poate adăuga un fapt într-un spațiu existent, poate construi un spațiu sau o regulă din operațiile existente, sau poate avea nevoie de o operație nouă. Primele două sunt date. A treia cere un contract nou și o implementare verificată. Sistemul trebuie să spună „operație nesuportată” dacă aceasta lipsește. Nu o înlocuiește cu o presupunere despre numele conceptului.

## 9.2 Cum se introduce un spațiu nou

Să vrem distanța liberă dintre nodurile unei diagrame. Alegem o axă numită `clearance`, în pixeli ai paginii, cu valori nenegative. Declarăm separat unitatea, valorile permise și măsura distanței. Pentru două valori a și b, distanța este valoarea absolută a diferenței. „Cel puțin 12 pixeli” este regiunea [12, infinit), nu un cuvânt pe care o unealtă îl interpretează singură.

Autorul declară apoi ce însușire folosește spațiul, cum se măsoară acea însușire din vederea diagramei și ce operație poate schimba pozițiile nodurilor. Măsurarea și schimbarea sunt responsabilități diferite: un sistem poate verifica o diagramă chiar dacă nu are unealta care o repară.

| Declarație necesară | Ce permite programului |
|---|---|
| axă și unitate | Să refuze compararea pixelilor cu minute fără o transformare declarată. |
| domeniu numeric | Să refuze o distanță negativă. |
| metrică | Să compare două distanțe; normalizarea cere o scară explicită dacă axa nu are margine finită. |
| regiune | Să verifice cerința „cel puțin 12”. |
| măsurare din stare | Să obțină valoarea reală după executare. |
| capabilitate de modificare | Să caute o așezare, dacă aceasta este cerută și disponibilă. |

Dacă distanța observată este 8, cerința este încălcată cu 4 pixeli. Dacă o așezare nouă dă 14, cerința este satisfăcută. Nu rezultă că acea așezare este cea mai frumoasă sau optimă: asemenea afirmații cer obiective și dovezi separate.

Pentru spațiul nou nu trebuie o ramură de program „dacă numele este clearance”. Operațiile numerice sunt aceleași ca pentru durata unei ședințe. În schimb, calculul geometric al distanței dintre contururile nodurilor este o funcție declarată, cu intrări și rezultat verificabile. Refolosirea privește contractul operațiilor, nu presupunerea că toate domeniile au aceeași geometrie.

## 9.3 Ce înseamnă interpretarea firelor

Textul trece prin etape distincte. Mai întâi este citit ca sintaxă: identificatori, tipuri, chei, atomi, texte și referințe. Apoi referințele și numele sunt rezolvate în modulele și instanțele potrivite. Schema verifică valorile și multiplicitatea lor. Legăturile conceptuale arată ce operații se aplică. Abia apoi regulile pot fi evaluate.

Un text între ghilimele rămâne text. `before="object exists"` nu este o condiție executabilă prin simplul fapt că este scris ca text. R35 propune condițiile structurate; acestea trebuie validate și legate de rolurile actului. Explicația în limbaj natural poate însoți condiția, dar nu îi ține locul.

Propunerea este o singură reprezentare semantică a firului, care păstrează identitatea, tipul, valorile tipizate, proveniența și locul din text. Componenta care desenează pe ecran (renderer) poate primi o proiecție, adică numai câmpurile de care are nevoie din acea reprezentare. Nu recitește textul SOP cu reguli proprii. Astfel, o referință și un text care seamănă cu o referință nu ajung confundate în două componente diferite.

## 9.4 Cum strângem firele relevante

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
@t.meeting core.type of=meeting complete=true
```

Firul spune că tipul despre care vorbim este `meeting`, iar `complete=true` permite răspunsul „nu” când nu există o potrivire în acea instanță. Programul care încarcă instanța trebuie să asigure că toate faptele ei au fost citite înainte să folosească această proprietate. Declarația nu produce faptele lipsă. Ea nu spune nici că toate bazele de cunoaștere ale lumii au fost încărcate.

Separat, o regulă de cunoaștere poate sta într-un fragment încă neîncărcat. Contractul propus completează `std.schema.needs`, care declară ce date trebuie încărcate: catalogul urmărește și dependențele regulilor, iar încărcătorul raportează ce dependențe a satisfăcut. Fără regulile necesare nu afirmăm validitatea, chiar dacă lista locală a ședințelor este completă. Un fragment care nu se poate citi produce „verificare incompletă”, nu „nicio restricție”.

Sunt două versiuni diferite. **Versiunea stării (state version)** este un identificator care se schimbă la fiecare modificare semantică a instanței și permite detectarea unui plan învechit. **Versiunea publicată (published version)** identifică exact un pachet de scheme și cunoaștere, de exemplu prin amprenta conținutului. Rezultatul unei verificări reține amândouă. „Verificat la V” fără să spună care dintre ele este insuficient.

Prin **sfera de completitudine (coverage scope)** înțelegem faptele și intervalul pentru care sursa garantează că nimic relevant nu lipsește. Nu o numim „domeniu”, fiindcă domeniul este zona de lucru a aplicației. Pentru calendarul local, sfera poate fi toate faptele `meeting` din instanța citită; pentru o serie recurentă este necesară și verificarea aparițiilor în intervalul cerut, conform R48.

## 9.5 Cum se schimbă motorul de raționament

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

O funcție geometrică sau numerică declarată poate rămâne o dependență de încredere: verificatorul îi controlează argumentele, tipul rezultatului și proprietățile verificabile, dar nu poate dovedi corectitudinea oricărui program arbitrar. Contractul numește funcția și versiunea ei; testele ei și limitele metodei sunt parte din justificare. O funcție lipsă nu se consideră adevărată implicit.

## 9.6 O ședință, urmărită cu numere

Fixăm pentru exemplu o zi și un fus orar deja rezolvate. Minutele se numără de la miezul nopții. Ana are o rezervare [600, 660), adică 10:00–11:00. Cererea este o ședință de 30 de minute, cu Ana, începând exact la 10:30. Interpretarea produce participantul identificat, începutul 630 și durata 30. Sfârșitul calculat este 660.

Pentru două intervale [a,b) și [c,d), suprapunerea este adevărată când a < d și c < b. Aici 630 < 660 și 600 < 660: există conflict. Acesta este un calcul explicit, nu o concluzie obținută din cuvântul „ședință”. Regula leagă întâi rezervările care împart un participant, apoi aplică testul intervalelor.

Coordonatorul poate căuta o alternativă. La 660, intervalul propus este [660,690). Condiția 660 < 660 este falsă, deci rezervarea cunoscută nu îl blochează. Dar acest calcul singur nu dovedește că Ana este liberă: trebuie consultate toate rezervările ei relevante până la 690. Dacă sursa este indisponibilă, rezultatul rămâne necunoscut.

Cererea inițială a spus o oră exactă. Alternativa 11:00 este prezentată omului, nu executată automat. După acceptare se verifică din nou versiunea rezervărilor. Dacă altă ședință a apărut între timp, planul se reevaluează.

Unealta primește identitatea Anei, începutul 660 și durata 30. După operație se citește starea: trebuie să existe ședința creată, cu aceste valori și fără schimbarea rezervării vechi. Dacă unealta nu confirmă rezultatul sau observația lipsește, sistemul nu spune „am programat”.

O diagramă poate folosi apoi aceleași identități de ședințe pentru a arăta numărul lor pe participant. Ea produce noduri grafice, nu copii ale persoanelor. Trebuie declarat dacă desenul este un instantaneu sau o vedere actualizată; această alegere schimbă dependențele și invalidarea rezultatului.

## 9.7 Ce trebuie verificat înainte de implementare

Acest capitol descrie mecanismele și limitele lor. Mai trebuie scrise schemele complete ale declarațiilor noi, reprezentarea structurală a condițiilor și protocolul verificabil de completitudine. Acestea sunt livrabile de proiectare, nu detalii pe care implementatorul le poate inventa separat în fiecare domeniu. Reviewerul trebuie să încerce să găsească o tranziție din exemplu care nu este justificată de date, o regulă sau un contract explicit.


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
| R6 | Dacă numele lumii vine din firul `std.schema.world` sau rămâne dat de program. |
| R9 | Dacă „se știe că nu are” se scrie `none`, și pe ce sloturi este permis. |
| R31 | Mărimea pașilor: 1,25 pentru mărimi; 30 de minute pentru oră. |
| R34 | Dacă ce se învață poate trece vreodată în cunoașterea comună, și cine aprobă. |
| R48 | Recurența este inclusă; rămân de proiectat reprezentarea seriei, excepțiile și verificarea pe intervale finite. |
| R49 | Dacă normele sunt slabe în timpul lucrului sau unele sunt tari. |
| R59 | Dacă un grafic făcut din calendar rămâne o fotografie sau se ține la zi. |
| R64 | Ce se face cu o unealtă care nu poate desface: se execută și se spune, sau se cere acordul înainte. |
| R68 | Cum se verifică tonul unui text; până atunci răspunsul nu îl afirmă. |
| R80 | Decis: explicații textuale verificabile, fără al cincilea domeniu. |
