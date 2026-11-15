# SOP Worlds: curs de început

*Versiunea 2, 15 noiembrie 2026. Text de lucru în română, sursă pentru documentația și skill-urile din sopworld. Termenul englez este dat în paranteză la prima apariție.*

*Documentul descrie și lucruri care nu există încă. Lecția 20 spune exact ce există, ce este provizoriu și ce este doar propus. Până acolo, tot ce este propus poartă semnul **[propus]**.*

---

## Lecția 1. Ce problemă rezolvă tehnologia

Un om scrie o propoziție: „desenează o pădure mare, fără păsări”. Sistemul trebuie să facă ceva real: să pună copaci pe o pagină. Apoi omul scrie „mai puțini” și sistemul trebuie să înțeleagă că e vorba de copaci, să păstreze restul și să refacă desenul.

Felul obișnuit de a construi așa ceva este să scrii, pentru fiecare fel de propoziție, o bucată de program care o recunoaște și face ce trebuie. Merge pentru propozițiile la care s-a gândit programatorul. Pentru celelalte nu merge, iar fiecare propoziție nouă cere încă o bucată de program. După câteva sute de bucăți, nimeni nu mai știe ce face sistemul și de ce, iar o reparație strică altceva.

SOP Worlds pornește de la altă idee. Programul nu știe nimic despre propoziții anume și nimic despre păduri. El știe doar să lucreze cu **declarații**. Tot ce este specific — ce lucruri există, ce se poate face cu ele, ce este tipic, ce nu este voie — este scris ca declarații, într-un singur limbaj mic, numit SOP Lang. Câteva mecanisme generale citesc aceste declarații și fac restul: înțeleg cererea, aleg valorile care lipsesc, verifică regulile, cheamă unealta potrivită și spun ce au făcut.

Scopul are trei părți.

Prima: **refolosire**. Ce se scrie o dată despre culori, mărimi, animale sau despre cum arată o schemă logică se folosește în orice parte a sistemului, fără a fi copiat.

A doua: **extindere fără program nou**. O zonă nouă a sistemului (de exemplu un calendar) se adaugă scriind declarații și câteva unelte mici, nu scriind din nou înțelegerea limbii și luarea deciziilor.

A treia: **cinste**. Pentru că fiecare valoare vine dintr-o declarație, sistemul poate spune de unde a luat-o („am pus 7 noduri, cât e tipic”) și poate spune limpede ce nu a înțeles sau ce nu poate face, în loc să ghicească.

Restul cursului explică, pe rând: limbajul (lecțiile 2–6), felurile de lumi (lecția 7), ce declară o zonă a sistemului (lecțiile 8–10), drumul unei cereri (lecțiile 11–13), legarea (lecțiile 14–15), raționamentul (lecțiile 16–17), execuția și răspunsul (lecția 18), rețeta pentru o zonă nouă (lecția 19), starea de azi (lecția 20), regulile de revizie (lecția 21) și legăturile cu alte sisteme (lecția 22).

Pe tot parcursul folosim un exemplu foarte mic: **un raft cu cutii**. Omul poate pune cutii pe rafturi, le poate muta, colora și șterge.

---

## Lecția 2. Firul

Unitatea limbajului este **firul (wire)**. Un fir este o singură declarație, scrisă pe un rând:

```
@c1 box name=Ana colour=red on=$r1
```

Rândul se citește așa. `@c1` este **identificatorul (id)** firului, numele lui propriu. `box` este **tipul (type)** firului: spune ce fel de declarație este. Urmează perechi `cheie=valoare`. Fiecare pereche are o **cheie (key)**, aici `name`, `colour` și `on`, și o valoare.

Valoarea `$r1` este o **referință (reference)**: arată spre alt fir, cel cu identificatorul `r1`. Așa se leagă firele între ele.

O cheie poate apărea de mai multe ori în același fir. Atunci are mai multe valori:

```
@k2 std.schema.kind of=box acts=make acts=remove
```

Firul de sus spune că pe `box` se aplică două acte, `make` și `remove`.

Un fir care spune că ceva este așa, fără nimic de găsit, se numește **fapt (fact)**. Firul `@c1` de mai sus este un fapt: există o cutie numită Ana, roșie, pe raftul `r1`.

Atât este limbajul la bază. Tot ce urmează — scheme, reguli, cuvinte, capabilități — se scrie cu aceeași formă. Câștigul este că un mecanism care știe să citească fire poate citi orice declarație din sistem.

---

## Lecția 3. Lumea

O **lume (world)** este o mulțime de fire ținute împreună și verificate. Într-o lume intră două feluri de fire.

Primele sunt **faptele**: ce există acum. De exemplu, cele două cutii și raftul.

Celelalte sunt firele care spun **ce fapte au voie să existe și ce decurge din ele**. Pe acestea le numim **schema (schema)** lumii. Schema spune, de exemplu, că o cutie are un nume, că are o culoare, că stă pe un raft, și că pe un raft încap cel mult trei cutii.

Lumea verifică fiecare schimbare față de schemă. Dacă cineva încearcă să pună a patra cutie pe un raft de trei, lumea refuză. Refuzul nu este un mesaj de eroare scris de cineva; este el însuși o declarație, care spune ce regulă a fost încălcată și de către ce fir. Se numește **încălcare (violation)**. De aceea sistemul poate explica refuzul.

O lume mai are două însușiri folositoare. Ține minte istoricul, deci poate reveni la o stare anterioară (**undo**). Și se poate copia: o **copie (fork)** este o a doua lume care pornește identică, pe care se poate încerca ceva fără a atinge originalul.

> **Notă de terminologie.** În codul și documentația actuală a bibliotecii, ceea ce numim aici „schemă” se numește *matrix*. Cuvântul „schemă” este mai ușor de înțeles și îl folosim în tot cursul. Există o singură grijă: biblioteca folosește deja „schema lumii” (world schema) pentru o schemă publicată spre refolosire, cu nume propriu, de exemplu `w.seating`. Cele două sensuri se împacă bine: **schema** este partea de reguli a oricărei lumi; **schema lumii** este o schemă împachetată și publicată ca să fie încărcată în mai multe lumi. Dacă proprietarul aprobă schimbarea, cuvântul *matrix* se înlocuiește în bibliotecă.

---

## Lecția 4. Tipuri și feluri de lucruri

Fiecare fir are un tip. Tipurile se declară și ele prin fire:

```
@t.box   core.type of=box   extends=std.schema.thing
@t.shelf core.type of=shelf extends=std.schema.thing
@t.crate core.type of=crate extends=box
```

Cheia `extends` spune că un tip îl **extinde** pe altul. Tot ce se declară despre `box` este valabil și pentru `crate`. Aceasta se numește **moștenire (lineage)**.

Unele tipuri descriu lucruri pe care omul le poate face, muta sau șterge: cutii, rafturi, copaci, noduri, paragrafe. Pe acestea le numim **feluri de lucruri (kinds of things)**. Un fel de lucru este un tip care extinde `std.schema.thing`.

Deci un fel de lucru *este* un tip de fir. Dar nu orice tip este un fel de lucru. `core.type` este un tip, însă nimeni nu „pune un core.type pe raft”. `box` este și tip, și fel de lucru.

| Termen | Explicație |
|---|---|
| tip (type) | Al doilea cuvânt al oricărui fir. Spune ce fel de declarație este firul. |
| fel de lucru (kind of thing) | Un tip care extinde `std.schema.thing`. Firele de acest tip sunt lucrurile din lume asupra cărora omul acționează. |
| moștenire (lineage) | Lanțul de tipuri extinse. Ce se spune despre un tip este valabil pentru toate tipurile care îl extind. |

---

## Lecția 5. Sloturi: schema unei chei

Un fir are chei. Dar ce chei are voie să aibă un fir de tip `box`? Ce valori pot avea? Care sunt obligatorii? Răspunsul îl dau firele de tip `core.slot`. Un **slot (slot)** este declarația unei chei pentru un tip.

```
@s1 core.slot of=box   key=name   kind=string
@s2 core.slot of=box   key=colour kind=atom
@s3 core.slot of=box   key=size   kind=atom enum=small enum=big default=small
@s4 core.slot of=box   key=on     type=shelf required=true ask="Pe ce raft?"
@s5 core.slot of=shelf key=slots  kind=integer min=1 max=6 default=3
```

Firul `@s3` se citește așa: tipul `box` are cheia `size`; valoarea este un cuvânt dintr-o listă închisă, `small` sau `big`; dacă nimeni nu spune mărimea, se ia `small`.

Firul `@s4` spune că cheia `on` ține un alt lucru, de tip `shelf`. Este obligatorie. Dacă lipsește, lumea știe ce întrebare să pună.

| Ce poate spune un slot | Explicație |
|---|---|
| ce fel de valoare ține | Cu `kind=`: număr întreg, număr, text, cuvânt, cantitate, moment de timp. |
| că ține un alt lucru | Cu `type=`: valoarea este un fir de acel tip. Așa apar legăturile între lucruri. |
| valorile permise | Cu `enum=` pentru o listă închisă, sau `min=`, `max=`, `step=` pentru un interval. |
| dacă este obligatorie | Cu `required=true`. O cheie obligatorie fără valoare se numește **cheie deschisă (open key)**. O cheie deschisă este o întrebare pe care lumea știe că o are. |
| valoarea implicită | Cu `default=`. Este luată ca presupunere, nu ca fapt spus de om. |
| întrebarea de pus | Cu `ask=`. |

Trei cuvinte se confundă ușor și trebuie ținute separat:

| Termen | Explicație |
|---|---|
| cheie (key) | Numele unei valori dintr-un fir concret. Firul `@c1 box name=Ana` are cheia `name`. |
| slot (slot) | Declarația unei chei pentru un tip, în schemă. Spune ce are voie să conțină cheia. |
| rol (role) | Locul pe care îl ocupă o valoare într-o acțiune cerută: ce lucru, unde, cât. Apare în cereri și planuri, nu în fire. Îl întâlnim în lecția 11. |

Răspunsul la întrebarea „cum se pune o schemă pe un tip de fir” este, așadar, simplu: schema unui tip este mulțimea firelor `core.slot` care numesc acel tip. Nu există un al doilea format.

---

## Lecția 6. Reguli și constrângeri

Sloturile spun ce poate conține un fir luat singur. Unele lucruri privesc mai multe fire deodată. Pentru ele există reguli și constrângeri, scrise tot ca fire.

Pentru a vorbi despre „orice cutie” avem nevoie de o **variabilă (variable)**. O variabilă se scrie `?nume` în locul unei valori și înseamnă „o valoare de găsit”. Un fir cu variabile se numește **model (pattern)**: descrie fire de căutat.

O **regulă (rule)** spune: dacă aceste modele se potrivesc, atunci și acest fir este adevărat. O **interdicție (deny)** spune: aceste modele nu au voie să se potrivească.

```
@d1 core.deny when=$p1 doc="o cutie mare nu stă pe raftul de sus"
@p1 box size=big on=?r
@p2 shelf id=?r level=top
```

O constrângere poate fi **tare (hard)** sau **slabă (soft)**. La una tare, schimbarea este refuzată. La una slabă, schimbarea este primită, dar lumea ține o **problemă (issue)** cât timp situația durează. Diferența va conta la raționament: constrângerile tari elimină variante, cele slabe le ordonează de la bună la mai puțin bună.

| Formă de constrângere | Explicație |
|---|---|
| limitele unui slot | `min`, `max`, `enum`. Privesc o singură valoare. |
| limită de număr | `std.schema.limit of=table max=50`: cel mult atâtea lucruri de un fel. |
| capacitate | `std.schema.capacity of=shelf key=slots holds=box via=on`: câte lucruri poate ține un alt lucru. |
| interdicție | `core.deny`: o combinație de fapte care nu are voie să existe. |
| verificare calculată | `core.check`: o funcție numită, pentru ce nu se poate spune prin modele, de exemplu „două intervale de timp nu se suprapun”. |

---

## Lecția 7. Trei feluri de lumi

Am spus că o lume este fapte plus schemă. În practică lumile sunt de trei feluri, după ce conțin.

| Fel de lume | Explicație |
|---|---|
| schema lumii (world schema) | Descrie un fel de lume, fără lucruri anume: felurile de lucruri, sloturile, constrângerile, cuvintele. Este refolosibilă. Exemplu: `w.seating` descrie ce este un plan de mese, oricare. |
| lume de cunoaștere (knowledge world) | Fapte despre lume în general, adevărate pentru toată lumea și fără legătură cu vreo sesiune. Exemple: `k.animals` (peștele trăiește în apă), `k.colours`, `k.expect` (ce este tipic), `w.lang.en` (cuvintele și regulile englezei). |
| lume vie (live world) | O lume care rulează acum, pentru un om: lucrurile pe care le-a făcut, valorile lor, istoricul. Exemplu: planul de mese pentru nunta de sâmbătă. |

Legătura dintre ele: o lume vie se obține încărcând una sau mai multe scheme de lumi, citind cunoașterea de care are nevoie, și adăugând ce face omul.

De ce trei feluri și nu unul: schema și cunoașterea se scriu o dată și se folosesc de mii de ori; lumea vie este scurtă și particulară. Dacă le amesteci, ajungi să copiezi cunoaștere în fiecare loc.

---

## Lecția 8. Domeniul de capabilități

Sistemul poate face lucruri reale în mai multe zone: desenează, face diagrame, scrie documente, așază invitați la mese, ține un calendar. Numim o astfel de zonă **domeniu de capabilități (capability domain)**.

Nu spunem „tab”. Un tab este doar un fel de a arăta un domeniu pe ecran. Același domeniu poate fi arătat altfel, citit cu voce sau folosit de alt program.

| Parte a unui domeniu | Explicație |
|---|---|
| lumea vie | Starea domeniului, ca fire: ce lucruri există acum și ce valori au. |
| uneltele (tools) | Bucăți mici de program care produc efectul real: pun o formă pe pagină, mută un nod, inserează un paragraf. Sunt singurul program specific domeniului. |
| vederea stării (state view) | O funcție care citește starea reală a uneltelor și o dă ca fire, pentru ca lumea vie să reflecte ce este cu adevărat acolo. |
| afișarea (view) | Cum vede omul domeniul: o pagină, o listă, o hartă. Nu ne ocupă în acest curs. |

Raftul nostru este un domeniu de capabilități. Lumea lui vie conține rafturile și cutiile. Uneltele lui sunt patru: adaugă o cutie, mută o cutie, schimbă o însușire, șterge o cutie.

---

## Lecția 9. Capabilitate, unealtă, legătură

Aceste trei cuvinte sunt miezul cursului. Se confundă ușor, iar confuzia lor este exact greșeala pe care tehnologia vrea să o evite.

O **capabilitate (capability)** este o promisiune declarată a domeniului. Spune trei lucruri: ce act, pe ce fel de lucru, și de ce cerințe ține cont. De exemplu: „pot **face** **cutii** și țin cont de **număr**, **mărime**, **culoare** și **loc**”. Capabilitatea este o declarație. Nu spune cum se face.

O **unealtă (tool)** este o operație de program cu parametri, care produce un efect. De exemplu `add(kind, n, size, colour, on)`. Unealta nu știe nimic despre propoziții, despre ce a cerut omul sau despre ce este tipic. Primește valori și le execută.

O **legătură (binding)** este declarația care spune ce unealtă realizează ce capabilitate și de unde vine fiecare valoare a parametrilor ei.

| Situație | Explicație |
|---|---|
| capabilitate fără unealtă | O promisiune care nu poate fi ținută. Sistemul trebuie să spună: „înțeleg ce ceri, dar nu am cu ce să o fac”. |
| unealtă fără capabilitate | O operație care există în program, dar pe care nimeni nu o poate cere prin limbaj. |
| o capabilitate, mai multe unelte | „Fă un iaz” se realizează prin mai mulți pași: apă, pești, stuf. Împărțirea în pași vine din cunoaștere, nu din unealtă. |
| o unealtă, mai multe capabilități | Aceeași `add` servește și „pune trei cutii”, și fiecare parte dintr-un întreg mai mare. |

De ce sunt ținute separat. Capabilitatea este ceea ce înțelege omul și ceea ce verifică mecanismul de decizie. Unealta este ceea ce poate face programul. Dacă le lipești într-o singură funcție, acea funcție ajunge să citească cererea, să aleagă valori și să scrie răspunsul — adică devine din nou o bucată de program pe caz, iar toată generalitatea se pierde.

---

## Lecția 10. Ce declară un domeniu

Un domeniu declară șase grupe de fire. Le arătăm pe toate pentru raft.

**Grupa 1: felurile de lucruri și sloturile lor.** Le-am văzut în lecțiile 4 și 5.

**Grupa 2: cuvintele domeniului.**

```
@wd1 core.word text=crate text=carton means=box
```

Firul spune că „crate” și „carton” înseamnă `box`. Aici stau doar cuvintele specifice domeniului. Cuvintele generale ale limbii („fără”, „trei”, „mai mic”) stau în lumea limbii și se folosesc în toate domeniile.

**Grupa 3: capabilitățile.**

```
@k1 std.schema.kind    of=box world=shelfworld acts=make acts=place acts=change acts=remove
@h1 std.schema.honours world=shelfworld act=make   on=kind on=count on=size on=attribute on=place of=box
@h2 std.schema.honours world=shelfworld act=place  on=place of=box
@h3 std.schema.honours world=shelfworld act=change on=attribute on=size of=box
```

Firul `@k1` spune ce acte se aplică unei cutii. Firul `@h1` spune de ce cerințe ține cont actul `make` pentru cutii: de felul lucrului, de număr, de mărime, de însușiri (cum e culoarea) și de loc. Verbul englez *honours* înseamnă „onorează”, adică „ține cont de”.

**Grupa 4: semnătura uneltelor [propus].**

```
@op1 std.tool.op    world=shelfworld name=add effect=makes
@pa1 std.tool.param op=add name=kind   type=box required=true
@pa2 std.tool.param op=add name=n      kind=integer min=1 max=20 default=1
@pa3 std.tool.param op=add name=size   accepts=small accepts=big
@pa4 std.tool.param op=add name=colour kind=atom
@pa5 std.tool.param op=add name=on     type=shelf
@pr1 std.tool.needs op=add exists=shelf
```

Aceste fire descriu unealta `add` din afară: ce parametri are, ce valori primește fiecare, ce trebuie să existe înainte (`needs`: măcar un raft) și ce efect are (`makes`: apare un lucru nou).

**Grupa 5: legătura [propus].**

```
@b1 std.tool.bind world=shelfworld act=make of=box op=add
@a1 std.tool.arg  bind=$b1 param=kind   from=step.kind
@a2 std.tool.arg  bind=$b1 param=n      from=step.count
@a3 std.tool.arg  bind=$b1 param=size   from=request.size
@a4 std.tool.arg  bind=$b1 param=colour from=request.attribute.colour
@a5 std.tool.arg  bind=$b1 param=on     from=request.place
```

Firul `@b1` spune: actul `make` pe `box` se realizează cu unealta `add`. Firele `@a1`–`@a5` spun, pentru fiecare parametru, de unde se ia valoarea.

**Grupa 6: așteptări proprii, dacă e cazul.** Ce este tipic se ia de obicei din cunoașterea generală. Un domeniu adaugă așteptări proprii doar unde diferă. Le explicăm în lecția 15.

În afara firelor, domeniul are două bucăți de program: uneltele și vederea stării. Atât.

---

## Lecția 11. Cererea

Când omul scrie o propoziție, primul lucru pe care îl face sistemul este să o transforme într-o **cerere (request)**. Cererea este ea însăși o mică lume de fire, de tip `w.request`. Odată ce propoziția a devenit cerere, nimic din ce urmează nu mai lucrează cu cuvinte.

Să luăm „pune trei cutii roșii, fără cutii mari”.

| Parte a cererii | Explicație |
|---|---|
| actul (act) | Ce se vrea făcut. Aici `make`. Vine din verb. |
| ținta (target) | Pe ce fel de lucru. Aici `box`. |
| cerințele (constraints) | Fiecare cerință are o cheie, un sens (vreau, nu vreau, nu toate) și o valoare. Aici: `count` = 3; `attribute colour` = red; `size` = big, cu sensul „nu vreau”. Fiecare cerință ține minte și cuvintele exacte din care a fost citită. |
| reacțiile (reactions) | Cuvinte care judecă rezultatul dinainte: „prea multe”, „mai mic”, „frumos”. Aici nu sunt. |
| necititul (unread) | Cuvintele pe care nimic nu le-a înțeles. Aici nu sunt. |

Aici apare cuvântul **rol**. În cererea de mai sus, „cutii” ocupă rolul de lucru făcut, „trei” rolul de număr. Rolurile sunt locurile dintr-o acțiune. Legarea, despre care vorbim în lecțiile 14 și 15, duce valorile din roluri în cheile lumii vii și în parametrii uneltelor.

Cerințele au un set mic de chei, aceleași în toate domeniile: felul lucrului (`kind`), numărul (`count`), mărimea (`size`), întinderea (`extent`), o însușire (`attribute`), locul (`place`), maniera (`manner`), așezarea (`layout`), „cu ce” (`with`), „despre ce” (`about`), lungimea (`length`). Acestea sunt aceleași chei pe care le numesc capabilitățile după `on=`. Așa se întâlnesc ce cere omul și ce promite domeniul.

De unde știe sistemul cuvintele: din lumea limbii (cuvinte ca „fără”, „cel mult”, numerale), din cuvintele domeniului (lecția 10), din valorile sloturilor (`small`, `big`) și din cunoaștere (numele culorilor). Toate sunt declarații.

Două reguli țin de cinste. Dacă rămân cuvinte necitite într-un loc care contează, cererea nu se execută pe ghicite. Și dacă un cuvânt pare greșit scris, este corectat numai când există un singur candidat clar; un cuvânt corect nu se schimbă niciodată.

---

## Lecția 12. Cerere nouă sau reacție

Al doilea mesaj al omului poate fi o cerere nouă („pune și un raft”) sau o reacție la ce tocmai s-a făcut („mai puține”). Sistemul trebuie să decidă care, și o face tot din declarații.

Un mesaj care are un act și un lucru nou este o cerere nouă. Altfel este o reacție, iar ce face reacția este scris ca fapte în lumea dialogului:

```
@v1 w.dialogue.revision reaction=reduce does=step on=count direction=down
```

Firul spune: reacția „reduce” (citită din „mai puține”, „prea multe”) face un pas în jos pe număr.

| Ce poate face o reacție | Explicație |
|---|---|
| un pas (step) | Urcă sau coboară o treaptă pe o scară: mai multe, mai puține, mai mare, mai mic. |
| întoarce (flip) | Ce era făcut devine nedorit: „nu cercuri”. |
| adaugă (add) | Cerința spusă acum o înlocuiește pe cea veche cu aceeași cheie. |
| păstrează (keep) | Aceeași cerere, altă variantă: „altfel”. |
| anulează (undo) | Se revine la cererea dinainte. |
| nimic (none) | O laudă sau o mulțumire. Nu se schimbă nimic și nu se reface nimic. |

Regula cea mai importantă a acestui pas: **o reacție schimbă numai ce numește.** „Mai puțini copaci” schimbă numărul copacilor. Mărimea, locul și restul rămân exact cum erau.

Tot aici se rezolvă referințele la lucruri existente: „ea”, „ele”, „cutia roșie”, „a doua”. Se caută în starea lumii vii lucrul care se potrivește. Dacă se potrivesc mai multe, sistemul pune o singură întrebare. Dacă nu se potrivește niciunul, spune asta.

---

## Lecția 13. Drumul complet al unui mesaj

Acum putem pune pașii la un loc. Fiecare mesaj trece prin aceiași șapte pași, în orice domeniu.

| Pas | Explicație |
|---|---|
| 1. Vedere | Starea reală a domeniului este citită ca fire. De aici înainte sistemul știe ce există. |
| 2. Înțelegere | Propoziția devine cerere (lecția 11). |
| 3. Situare | Se decide dacă e cerere nouă sau reacție și la ce lucruri se referă (lecția 12). |
| 4. Decizie | Din cerere, capabilități și cunoaștere se face un **plan (plan)**: o listă de pași, fiecare cu toate valorile alese (lecțiile 14–17). |
| 5. Acțiune | Fiecare pas al planului cheamă o unealtă, prin legătura ei (lecția 18). |
| 6. Spunere | Se compune răspunsul: ce s-a făcut, ce s-a presupus, ce nu s-a putut (lecția 18). |
| 7. Păstrare | Dialogul ține minte cererea și rezultatul, pentru mesajul următor și pentru undo. |

Limba apare numai la pașii 2 și 6. Între ei totul este fire. De aceea sistemul poate lucra în română printr-un strat de traducere, fără a învăța fiecare domeniu din nou în fiecare limbă.

---

## Lecția 14. Legarea, partea întâi: cazurile directe

**Legarea** înseamnă a duce fiecare valoare din cerere la locul ei: într-o cheie a lumii vii și într-un parametru al unei unelte. Există mai multe tehnici. Se încearcă în ordine, de la cea mai simplă. Fiecare are un semn clar că nu ajunge, și atunci se trece la următoarea.

### Tehnica 1. Potrivire directă

Cerința `size=big` are aceeași cheie ca slotul `size` al cutiei și ca parametrul `size` al uneltei `add`, iar `big` este printre valorile primite. Valoarea trece direct. Nu este nevoie de nicio gândire.

Semnul că nu ajunge: valoarea spusă nu este printre cele primite, sau slotul lipsește.

### Tehnica 2. Moștenire

Ce s-a declarat pentru un fel de lucru este valabil pentru felurile care îl extind.

| Domeniu | Exemplu |
|---|---|
| raft | Capabilitatea „mută o cutie” este valabilă și pentru `crate`, fiindcă `crate` extinde `box`. |
| desen | „Fără pești” îl exclude și pe `goldfish`, fiindcă `goldfish` extinde `fish`. |
| plan de mese | „Mută un invitat” este valabil și pentru un copil, fiindcă `child` extinde `guest`. |

Semnul că nu ajunge: felul spus nu este nici declarat, nici urmaș al unuia declarat.

### Tehnica 3. Înlocuire declarată

Uneori omul cere un fel de lucru pe care unealta nu îl are, dar are unul apropiat. Domeniul poate declara înlocuirea:

```
@as1 std.schema.drawn world=drawing kind=reed as=flower
```

Firul spune: în desen, stuful se desenează ca floare.

| Domeniu | Exemplu |
|---|---|
| desen | Stuful este desenat ca floare. |
| diagramă | Ovalul este desenat ca elipsă. |
| muzică | Un instrument care lipsește este cântat cu cel mai apropiat din aceeași familie. |

Regula de cinste: înlocuirea este trecută între presupunerile planului, deci omul află că a primit altceva decât a cerut.

### Tehnica 4. Traducerea unei valori pe o scară

Omul spune „minuscul”. Unealta primește doar `small` și `big`. Cunoașterea are o scară a mărimilor:

```
@sc1 k.expect.scale step=tiny    order=1
@sc2 k.expect.scale step=small   order=2
@sc3 k.expect.scale step=default order=3
@sc4 k.expect.scale step=big     order=4
@sc5 k.expect.scale step=huge    order=5
```

Mecanismul general ia valoarea spusă, se uită la valorile pe care le primește parametrul și o alege pe cea mai apropiată pe scară: `small`. Nu există niciun tabel de sinonime în program.

Aceeași tehnică servește orice fel de valoare pentru care cunoașterea are o ordine sau o măsură de apropiere.

| Fel de valoare | Exemplu |
|---|---|
| mărime | „Minuscul” devine `small`, pe scara mărimilor. |
| culoare | „Turcoaz”, la o unealtă cu opt culori, devine cea mai apropiată dintre ele. |
| loc | „Sus în dreapta”, la o unealtă cu regiuni numite, devine regiunea care corespunde. |
| timp | „După-amiază”, într-un calendar cu ore, devine intervalul 12–18. |

Semnul că nu ajunge: cunoașterea nu are nicio ordine pentru acel fel de valoare. Atunci cerința este trecută la „nu am putut ține cont de”, cu motivul.

### Tehnica 5. Îmbinare cu altă lume

Un slot poate spune că valoarea lui este un lucru dintr-o altă lume, găsit după o cheie:

```
@s9 core.slot of=guest key=person type=w.person by=name
```

Firul spune: invitatul este o persoană din lumea persoanelor, găsită după nume. Se numește **îmbinare (join)**. Prin ea, lumea vie folosește cunoașterea din altă lume fără să o copieze.

| Domeniu | Exemplu |
|---|---|
| plan de mese | Invitatul este o persoană din `w.person`; de acolo se știu preferințele ei. |
| calendar | Locul unui eveniment este un oraș din `k.places`; de acolo se știe fusul orar. |
| desen | Un lucru desenat este de un fel din `k.animals`; de acolo se știe că peștele stă în apă. |

Îmbinarea este strictă: un nume care nu există în lumea numită este o încălcare.

### Tehnica 6. Referință la ce există

Când cererea vorbește despre un lucru care există deja („mută cutia roșie”), valoarea rolului este identificatorul acelui lucru, găsit în starea lumii vii.

| Fel de referință | Exemplu |
|---|---|
| după nume | „cutia Ana” |
| după fel și însușire | „cutia roșie” |
| după ordine | „a doua” |
| după pronume | „ea”, „ele”: lucrurile din ultimul rezultat |
| după relație | „cea de lângă casă” |

---

## Lecția 15. Legarea, partea a doua: când lipsește ceva

Omul nu spune aproape niciodată tot. „Fă o diagramă” nu spune câte noduri, ce forme, cum așezate. Tehnicile următoare completează ce lipsește.

### Tehnica 7. Umplerea golurilor din surse ordonate

Fiecare gol se umple din prima sursă care are o valoare. Ordinea surselor este fixă și este aceeași în toate domeniile.

| Sursa, în ordine | Explicație |
|---|---|
| 1. spus (said) | Ce a spus omul în acest mesaj. |
| 2. dialog (dialogue) | Ce a spus mai devreme despre același lucru. |
| 3. indus (induced) | Ce se vede în lumea vie: dacă toate cutiile sunt roșii, și cea nouă va fi roșie. |
| 4. lume (world) | Valoarea implicită a slotului (`default=`). |
| 5. așteptare (expect) | Ce este tipic, din cunoaștere. |
| 6. eșantionat (sampled) | O alegere variată, între limitele permise. |

Locul în această listă este și **costul** presupunerii: o valoare luată de mai jos este o presupunere mai slabă. Costul va conta în lecția 17.

Ce este tipic se scrie ca fapte de **așteptare (expectation)**:

```
@e1 k.expect.make thing=flowchart unit=node min=5 max=9 typical=7 kinds_min=2 kinds_max=3 layout=flow
@e2 k.expect.part of=forest part=tree min=5 max=7 typical=6 needed=yes
```

Primul fir spune: o schemă logică are de obicei 5–9 noduri, tipic 7, cu 2–3 forme diferite, așezate în flux. Al doilea: o pădure are 5–7 copaci, și copacii sunt obligatorii.

Unele valori implicite depind de altele. Acestea se scriu ca așteptări cu o condiție **[propus]**:

```
@e3 k.expect.value on=place  value=corner when.size=small
@e4 k.expect.value on=layout value=row    when.count.max=6
@e5 k.expect.value on=layout value=grid   when.count.min=7
```

Se citesc: un lucru mic se pune într-un colț; până la șase lucruri se așază pe un rând; de la șapte în sus, pe o grilă.

O regulă apără de răspunsuri absurde: **o valoare implicită umple numai ce omul a lăsat gol. Nu înlocuiește niciodată ce a spus.** Dacă omul cere o diagramă despre „cum se coace pâinea” și cunoașterea nu are pașii, răspunsul corect este „nu știu pașii; pot face cinci pași goi sau mi-i spui tu”. Nu este o diagramă despre altceva.

### Tehnica 8. Întregul din părți

Omul cere adesea un **întreg (whole)**: o pădure, o schemă logică, un raport. Unealta știe să facă doar părți: un copac, un nod, o secțiune. Faptele de așteptare spun din ce părți este făcut un întreg, iar planul primește câte un pas pentru fiecare parte.

| Domeniu | Exemplu |
|---|---|
| desen | O pădure: 5–7 copaci, eventual păsări și flori. |
| diagramă | O schemă logică: 5–9 noduri legate în flux. |
| document | Un raport: titlu, introducere, trei secțiuni, concluzie. |
| plan de mese | „O masă de opt”: o masă și opt locuri. |

Cerințele cererii se împart între părți după felul lor. Un număr aparține felului pe care îl numără: în „doi câini și un copac”, doi este al câinilor. O excludere se aplică tuturor părților. O mărime se aplică întregului.

### Tehnica 9. Operatori de structură [propus]

Unele decizii nu țin de niciun domeniu, ci de forma generală „un întreg cu părți și legături între ele”. Trebuie să fie mecanisme ale bibliotecii, aceleași pentru o diagramă, un document cu capitole sau o listă cu subpuncte.

| Operator | Explicație |
|---|---|
| taie la n | Reduce întregul la n părți păstrându-i structura: rădăcina și nivelurile de sus ale unui arbore, primele capitole ale unui text. |
| completează la n | Adaugă părți până la numărul cerut. |
| nu toate la fel | Asigură cel puțin două feluri între părți. |
| mai multe feluri deodată | „Un cer și un soare”: fiecare fel cu numărul lui. |
| leagă tot | „Unește-le pe toate”: fiecare parte nelegată primește o legătură. |

### Tehnica 10. Inducție din ce există

Dacă toate lucrurile de același fel din lumea vie au o valoare comună, un lucru nou o primește și el. Dacă omul a corectat de două ori în același sens, a treia oară corecția se aplică de la început.

| Domeniu | Exemplu |
|---|---|
| diagramă | Toate nodurile sunt albastre, deci nodul nou este albastru. |
| plan de mese | Toate mesele sunt rotunde, deci masa nouă este rotundă. |
| document | Toate titlurile sunt scurte, deci titlul nou este scurt. |

De aceea „indus” stă înaintea valorii implicite și a așteptării în lista surselor: ce a făcut omul aici contează mai mult decât ce este tipic în general.

### Tehnica 11. De la pas de plan la apelul uneltei [propus]

Planul este gata: are pași, fiecare cu act, fel de lucru și valori. Ultima legare duce fiecare pas la o unealtă. Firele de legătură din lecția 10 spun de unde vine fiecare parametru.

| Sursa unui parametru | Explicație |
|---|---|
| `step.` | Din pasul de plan: felul părții, numărul ei. |
| `request.` | Din cerința cererii cu acea cheie, după traducerea pe valorile primite (tehnica 4). |
| `state.` | Din starea lumii vii: identificatorul unui lucru existent (tehnica 6). |
| `result.` | Identificatorul unui lucru făcut de un pas anterior al aceluiași plan. |

Unealta nu vede cererea. Primește doar valori gata alese.

---

## Lecția 16. Când este nevoie de raționament

Cele mai multe cereri se leagă direct și se execută. Raționamentul costă timp, deci pornește doar când apare un **semnal**. Un semnal este o stare a datelor, pe care oricine o poate verifica. Nu este o bănuială a programatorului.

Pe scurt: este nevoie de raționament când legarea directă lasă **un gol, un conflict sau o alegere**.

| Semnal | Ce se face |
|---|---|
| un rol obligatoriu este gol | Se umple din surse (tehnica 7). Dacă nicio sursă nu are valoare, se pune o singură întrebare. |
| valoarea spusă nu este primită | Se traduce pe scară (tehnica 4) sau se înlocuiește declarat (tehnica 3). |
| cerința nu este între cele promise de act | Refuz cinstit: „aici nu pot ține cont de asta”. |
| o constrângere tare ar fi încălcată | Varianta se respinge și se încearcă alta (lecția 17). |
| o constrângere slabă ar fi încălcată | Varianta primește un cost; se alege cea mai ieftină (lecția 17). |
| sunt posibile mai multe planuri | Se propun câteva, se încearcă pe o copie, se alege (lecția 17). |
| o referință se potrivește cu mai multe lucruri | Se ia lucrul în atenție; dacă nu este unul, o întrebare. |
| excluderile nu mai lasă nimic | Cea mai veche excludere cedează, și se spune. |
| după execuție nu s-a schimbat nimic | Răspunsul spune că nu s-a schimbat nimic și de ce. |
| au rămas cuvinte necitite care contează | Nu se execută. Se spune ce parte s-a înțeles și ce parte nu. |

---

## Lecția 17. Cele trei feluri de raționament și căutarea

Toate lucrează pe aceeași bază: **vederea ca fapte (facts view)** a lumii vii. În această vedere, orice lume, indiferent de domeniu, arată la fel: **lucruri**, fiecare cu **felurile** lui; **însușiri**, adică triplete (lucru, însușire, valoare); și **relații**, adică triplete (lucru, relație, alt lucru). La acestea se adaugă ce spune cunoașterea despre fiecare fel („peștele trăiește în apă”).

Aceasta este traducerea în ceva general despre care vorbeam: regulile de raționament sunt scrise o singură dată, pe lucruri, însușiri și relații, și merg pe un desen, pe un plan de mese sau pe un calendar.

### Deducția: ce decurge și ce se încalcă

**Deducția (deduction)** pornește de la faptele lumii vii și de la cunoaștere și află ce decurge din ele și ce reguli sunt încălcate. Este mărginită la doi pași: ce spune cunoașterea despre felul lucrului, apoi despre felul din care acesta se trage.

| Domeniu | Exemplu |
|---|---|
| raft | Raftul are 3 locuri; a patra cutie încalcă o constrângere tare. |
| desen | Peștele trăiește în apă; un pește pus pe cer încalcă o constrângere slabă. |
| plan de mese | Doi invitați certați la aceeași masă încalcă o interdicție. |
| calendar | Două evenimente ale aceleiași persoane care se suprapun. |

### Căutarea: propune, încearcă, respinge, alege

Când există o alegere, sistemul face un ciclu scurt. Propune câteva variante, cel mult cinci. Pe fiecare o încearcă pe o copie a lumii vii, deci nimic real nu se atinge. Pe copie rulează deducția. Variantele care încalcă o constrângere tare sunt respinse. Cele rămase sunt ordonate după cost. Prima este aleasă. Dacă nu rămâne niciuna, sistemul spune ce constrângere a blocat.

Pentru probleme mari — așezarea a patruzeci de invitați la cinci mese — aceleași declarații de constrângeri sunt date unui **rezolvitor (solver)**, care caută mai eficient. Declarațiile nu se schimbă; se schimbă doar strategia de căutare.

Fiecare căutare are un **buget (budget)** de pași. Când bugetul se termină, sistemul spune că s-a oprit. Nu inventează un rezultat.

### Abducția: cea mai ieftină completare

**Abducția (abduction)** răspunde la întrebarea: dintre felurile în care pot completa ce lipsește, care cere cele mai puține și mai slabe presupuneri? Costul unei variante este suma costurilor presupunerilor ei (locul sursei, din lecția 15) și a constrângerilor slabe pe care le încalcă.

| Domeniu | Exemplu |
|---|---|
| desen | „Pune un pește”, într-un desen cu un iaz și un cer. Varianta „în iaz” nu încalcă nimic. Varianta „pe cer” încalcă o constrângere slabă. Se alege iazul, deși omul nu a spus unde. |
| raft | „Pune o cutie”, fără raft numit. Se alege primul raft care mai are loc. |
| calendar | „Mută ședința mai târziu”. Se alege cel mai apropiat interval liber care nu încalcă nimic. |

### Inducția: regula din exemple

**Inducția (induction)** caută ce au în comun lucrurile existente și propune aceeași valoare pentru un lucru nou. Am întâlnit-o ca tehnica 10. Este mărginită intenționat: are nevoie de cel puțin trei lucruri sau de două corecții. Sub aceste praguri nu trage nicio concluzie.

### Cum lucrează împreună

Inducția propune valori. Abducția alege varianta cea mai ieftină. Deducția o verifică și o respinge dacă încalcă o regulă tare. Niciuna dintre ele nu știe în ce domeniu se află.

---

## Lecția 18. Execuția și răspunsul

### Execuția

Un mecanism general, **executorul**, ia planul pas cu pas **[propus în această formă]**. Pentru fiecare pas găsește legătura potrivită după act și fel de lucru. Umple parametrii din sursele lor. Verifică în starea lumii vii ce trebuie să existe înainte. Cheamă unealta. Apoi citește din nou starea și verifică dacă efectul declarat s-a produs.

### Istoricul

Câteva reguli sunt aceleași în orice domeniu. O cerere executată este un singur pas de undo, oricâte unelte a chemat. O reacție înlocuiește pasul pe care îl corectează. O întrebare nu este un pas. Un mesaj înțeles doar pe jumătate nu execută nimic.

### Răspunsul

Răspunsul nu este scris de mână în domeniu. Se compune din date, în patru părți.

| Parte a răspunsului | De unde vine |
|---|---|
| ce s-a făcut | Din diferența dintre starea de dinainte și cea de după. Dacă diferența este goală, răspunsul spune că nu s-a schimbat nimic. |
| ce s-a presupus | Din sursa fiecărei valori. Se spun doar presupunerile care contează. |
| ce nu s-a putut | Fiecare cerință neonorată, cu cuvintele omului și cu motivul. |
| ce nu s-a înțeles | Cuvintele necitite. |

Cuvintele răspunsului vin din lumea limbii, ca **fapte de răspuns (reply facts)**: propoziții cu locuri goale, de umplut. De aceea același răspuns iese și în română.

Două întrebări ale omului se rezolvă prin același mecanism. „Ce este pe raft?” se răspunde din starea lumii vii. „Ce poți face aici?” se răspunde din capabilitățile declarate.

### Proveniența

Fiecare valoare din plan ține minte de unde vine. Aceasta se numește **proveniență (provenance)**. Servește la trei lucruri: răspunsul poate spune ce a presupus; la o reacție se știe ce este voie să se schimbe (presupunerile) și ce nu (ce a spus omul); la revizia programului se vede dacă o valoare a venit din cunoaștere sau dintr-o constantă ascunsă.

### Lista cinstită

Când o cerere nu poate fi rezolvată cu piesele generale existente, nu se scrie o regulă pentru acel caz. Cazul se trece pe **lista cinstită (honest list)**, cu piesa generală care lipsește: o declarație, o bucată de cunoaștere, un cuvânt, o compunere de lumi, o metodă de raționament sau un mecanism de bibliotecă. Lucrul următor se alege după câte cereri reale deblochează o piesă.

---

## Lecția 19. Cum se face un domeniu nou

Pașii, în ordine. Întâi se scriu felurile de lucruri și sloturile lor. Apoi cuvintele domeniului. Apoi capabilitățile, cu grijă să fie promise doar cerințele de care domeniul chiar ține cont. Apoi uneltele: puține, mici, fără text și fără valori implicite ascunse. Apoi vederea stării. Apoi semnătura uneltelor și legăturile. Apoi se caută în cunoaștere ce există deja și se adaugă așteptări proprii doar unde domeniul diferă. La sfârșit se rulează testele și se încearcă fraze noi.

Raftul, complet:

```
@w    std.schema.world name=shelfworld
@t1   core.type of=shelf extends=std.schema.thing
@t2   core.type of=box   extends=std.schema.thing
@s1   core.slot of=shelf key=slots  kind=integer min=1 max=6 default=3
@s2   core.slot of=box   key=name   kind=string
@s3   core.slot of=box   key=colour kind=atom
@s4   core.slot of=box   key=size   kind=atom enum=small enum=big default=small
@s5   core.slot of=box   key=on     type=shelf
@cap  std.schema.capacity of=shelf key=slots holds=box via=on
@wd1  core.word text=crate text=carton means=box
@k1   std.schema.kind of=shelf world=shelfworld acts=make
@k2   std.schema.kind of=box   world=shelfworld acts=make acts=place acts=change acts=remove
@h1   std.schema.honours world=shelfworld act=make   on=kind on=count on=size on=attribute on=place of=box
@h2   std.schema.honours world=shelfworld act=place  on=place of=box
@h3   std.schema.honours world=shelfworld act=change on=attribute on=size of=box
@h4   std.schema.honours world=shelfworld act=remove of=box
@b1   std.tool.bind act=make   of=box op=add
@b2   std.tool.bind act=place  of=box op=move
@b3   std.tool.bind act=change of=box op=set
@b4   std.tool.bind act=remove of=box op=delete
```

Programul domeniului: patru unelte (`add`, `move`, `set`, `delete`) și vederea stării.

Ce trebuie să meargă fără nimic în plus:

| Omul spune | Ce se întâmplă și de ce |
|---|---|
| „pune trei cutii roșii” | Trei cutii roșii, mici, pe primul raft cu loc. Potrivire directă pentru număr și culoare; valoare implicită pentru mărime; abducție pentru raft. |
| „mai puține” | Mai puține cutii; culoarea și raftul rămân. Reacție cu un pas pe număr. |
| „mută cartonul roșu sus” | Dacă sunt trei cutii roșii, o întrebare: „care?”. Cuvânt al domeniului; referință cu mai multe potriviri. |
| „zece cutii” | Refuz, cu motivul: raftul are trei locuri. Deducție, constrângere tare. |
| „o cutie uriașă” | O cutie mare, și se spune că „uriaș” a fost luat ca „mare”. Traducere pe scară. |
| „ce poți face aici?” | Lista actelor și a cerințelor de care se ține cont. Din capabilități. |
| „undo” | Ultimul pas întreg înapoi. |

---

## Lecția 20. Ce există azi și ce nu

| Piesă | Stare |
|---|---|
| fire, tipuri, sloturi, reguli, interdicții | Există în bibliotecă. |
| lume, copie, undo, încălcări ca date | Există în bibliotecă. |
| declararea capabilităților (`std.schema.kind`, `std.schema.honours`) | Există în bibliotecă. |
| limite, capacități, îmbinări | Există în bibliotecă. |
| citirea propoziției într-o cerere | Există în bibliotecă. |
| cerere nouă sau reacție | Există în bibliotecă. |
| planul cu surse ordonate | Există în bibliotecă. |
| vederea ca fapte; deducție, abducție, inducție mărginite | Există în bibliotecă. |
| rezolvitoare pentru probleme mari | Există în bibliotecă. |
| înlocuirea declarată | Provizoriu: există doar în aplicație și doar pentru feluri de lucruri. |
| legătura de la act la unealtă | Provizoriu: în aplicație există o formă simplă (`psys2.op`), care leagă actul de o funcție mare, nu de o unealtă mică. |
| referințe la lucruri existente | Provizoriu: în aplicație. |
| istoricul (un pas pe cerere) | Provizoriu: în aplicație; locul lui este în bibliotecă. |
| semnătura uneltelor (`std.tool.*`) | Propus. Nu există. |
| traducerea oricărei valori pe o scară | Propus. Azi sunt tabele în program. |
| așteptări cu condiție | Propus. Azi sunt ramuri `if` în program. |
| operatori de structură | Propus. Azi sunt în programul diagramelor și al documentelor. |
| executorul cu unelte și diferență de stare | Propus. |
| răspuns compus numai din date | Parțial. Mecanismul există, dar domeniile își scriu încă propriile propoziții. |
| lista cinstită ca fire | Propus. |

Problema principală de azi, spusă direct: în cele trei domenii care folosesc drumul nou (desen, diagrame, documente), între plan și unealtă stă câte o funcție JavaScript mare. Ea alege din nou valori, ține tabele de cuvinte și scrie propoziția de răspuns. Tot ce este marcat „propus” în tabel există deja acolo, dar ca program pe domeniu, nu ca declarații. Lucrul următor este mutarea lor.

O a doua observație: lista cheilor de cerință (`kind`, `count`, `size` și celelalte) este scrisă fix în programul bibliotecii. Ar trebui să fie tot declarații, ca un domeniu să poată aduce o cheie nouă, de exemplu `tempo` pentru muzică.

---

## Lecția 21. Ce este voie să fie program și cum se verifică

În programul unui domeniu au voie trei lucruri: uneltele, vederea stării și, rar, o constrângere sau o căutare specială care nu se poate spune prin fire (geometrie, așezare automată). Aceasta din urmă trebuie declarată în firele domeniului, cu nume.

La revizie se resping următoarele, oriunde ar apărea în programul unui domeniu.

| Ce se respinge | De ce |
|---|---|
| citirea cererii | Unealta trebuie să primească valori gata alese. |
| tabele de cuvinte sau de sinonime | Cuvintele sunt declarații în lumea limbii sau a domeniului. |
| valori implicite în program | Sunt sloturi sau așteptări. |
| alegerea numărului, a felului, a formei, a locului | Este treaba planului. |
| numele unui fel de lucru scris în program | Programul nu are voie să știe ce feluri există. |
| propoziții de răspuns | Răspunsul se compune din date. |
| expresii regulate pe textul omului | Citirea este treaba mecanismului de înțelegere. |
| un prag potrivit pe un singur caz | Este o regulă pe caz, ascunsă într-un număr. |
| o verificare slăbită ca să treacă un test | Ascunde o greșeală. |

Măsurarea se face în patru feluri. Un numărător arată câte astfel de încălcări sunt în programul fiecărui domeniu; numărul are voie doar să scadă. Orice rezultat se raportează pe două coloane, „numai prin declarații” și „prin program scris de mână”, și contează prima. Din fiecare capabilitate declarată se generează teste automat: dacă actul promite că ține cont de număr, atunci numărul spus trebuie să apară în rezultat sau în „nu am putut”. Iar dovada finală este un domeniu de jucărie, cum e raftul, care merge doar cu fire și câteva unelte.

---

## Lecția 22. Cu ce seamănă

Ideile nu sunt noi luate una câte una. Nou este că sunt puse într-un singur limbaj și folosite împreună. Tabelul arată înrudirile, pentru cine vrea să citească mai departe. Referințele sunt date din memorie și trebuie verificate înainte de publicare.

| Ideea din curs | Înrudirea |
|---|---|
| fir cu chei și sloturi cu valori implicite | Cadrele lui Minsky (1974) și structurile de trăsături din gramaticile de unificare. |
| lume = fapte + schemă | Bazele de cunoștințe din logicile descriptive și constrângerile de integritate din bazele de date. |
| lumea ține minte din ce a dedus fiecare valoare | Sistemele de menținere a adevărului (Doyle 1979; de Kleer 1986). |
| capabilitate, unealtă, condiții și efecte | Planificarea clasică: STRIPS (Fikes și Nilsson 1971) și limbajul PDDL. |
| întregul din părți | Planificarea ierarhică pe rețele de sarcini (Erol, Hendler și Nau 1994). |
| constrângeri tari și slabe, căutare | Problemele de satisfacere a constrângerilor (Mackworth 1977) și varianta lor ponderată. |
| valori implicite ca așteptări | Logica implicitelor (Reiter 1980). |
| abducția cu costuri | Peirce; „interpretarea ca abducție” (Hobbs și colaboratorii 1993). |
| inducția din exemple | Anti-unificarea (Plotkin 1970). |
| deducția mărginită | Datalog și înlănțuirea înainte. |
| cererea ca stare a dialogului | Abordarea „stării de informație” (Larsson și Traum 2000); sistemul GUS (Bobrow și colaboratorii 1977). |
| înțelegerea sprijinită pe o lume mică | SHRDLU (Winograd 1972). Diferența: aici lumea este declarată, nu programată, și sunt mai multe domenii. |
| reacția schimbă numai ce numește | Revizuirea convingerilor cu schimbare minimă (Alchourrón, Gärdenfors și Makinson 1985). |
| proveniența valorilor | Proveniența datelor (Green și colaboratorii 2007). |
| răspunsul compus din date | Generarea de limbaj natural (Reiter și Dale 2000). |
| teste generate din declarații | Testarea bazată pe proprietăți (Claessen și Hughes 2000). |
| semnătura uneltelor | Schemele de funcții folosite de modelele de limbaj. Diferența: aici valorile sunt alese de un mecanism care poate arăta de unde a luat fiecare. |

---

## Vocabular

| Termen | Explicație |
|---|---|
| fir (wire) | O declarație: identificator, tip, perechi cheie=valoare. |
| cheie (key) | Numele unei valori dintr-un fir. |
| referință (reference) | O valoare `$id` care arată spre alt fir. |
| fapt (fact) | Un fir fără variabile, care spune că ceva este așa. |
| tip (type) | Al doilea cuvânt al unui fir. |
| fel de lucru (kind of thing) | Un tip ale cărui fire sunt lucruri asupra cărora omul acționează. |
| slot (slot) | Declarația unei chei pentru un tip. |
| schemă (schema) | Firele unei lumi care spun ce fapte pot exista și ce decurge din ele. În bibliotecă se numește azi *matrix*. |
| lume (world) | Fapte ținute în acord cu o schemă. |
| schema lumii (world schema) | O schemă publicată pentru refolosire. |
| lume de cunoaștere (knowledge world) | Fapte generale, fără stare de sesiune. |
| lume vie (live world) | O lume care rulează pentru un om. |
| domeniu de capabilități (capability domain) | O zonă a sistemului: o lume vie, uneltele ei și vederea stării. |
| capabilitate (capability) | Promisiune declarată: act, fel de lucru, cerințe de care se ține cont. |
| unealtă (tool) | Operație de program cu parametri și efect. |
| legătură (binding) | Declarația care leagă o capabilitate de o unealtă. |
| cerere (request) | Propoziția omului, ca fire. |
| cerință (constraint) | O parte a cererii: cheie, sens, valoare. |
| rol (role) | Locul unei valori într-o acțiune. |
| reacție (reaction) | Un mesaj care judecă rezultatul dinainte. |
| plan (plan) | Lista de pași, cu toate valorile alese. |
| așteptare (expectation) | Un fapt despre ce este tipic. |
| presupunere (assumption) | O valoare luată, nu spusă. |
| proveniență (provenance) | De unde vine o valoare. |
| constrângere tare, slabă (hard, soft) | Una refuză schimbarea; cealaltă o primește și ține o problemă. |
| deducție, abducție, inducție | Ce decurge; cea mai ieftină completare; regula din exemple. |
| listă cinstită (honest list) | Cazurile nerezolvate, fiecare cu piesa generală care îi lipsește. |

---

## De hotărât de către proprietar

| Întrebare | Explicație |
|---|---|
| „schemă” în loc de „matrix” | Nu văd o problemă, cu precizarea din lecția 3 despre cele două sensuri. Cere o redenumire în bibliotecă și în documentația ei. |
| numele firelor de unealtă | `std.tool.op`, `param`, `bind`, `arg`, sau în familia `std.schema.*`, lângă `honours`. |
| cheile de cerință ca declarații | Dacă lista fixă din bibliotecă devine declarabilă de către domenii. |
| cât program special este permis | Propun: doar funcții fără acces la cerere, declarate cu nume în firele domeniului. |
