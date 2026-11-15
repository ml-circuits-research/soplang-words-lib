# Legarea declarativă a lumilor vii de cunoaștere și de unelte

*Versiunea 1, 15 noiembrie 2026. Sursă pentru documentația din sopworld și pentru skill-uri. Scrisă de revizor; ce e marcat **[există]** este în bibliotecă sau în aplicație azi, ce e marcat **[provizoriu]** există dar în locul greșit (cod în aplicație), ce e marcat **[propus]** nu există încă.*

---

## Cum se citește acest document

Documentul răspunde la o singură întrebare: **cum ajunge o propoziție a unui om să producă un efect real într-un domeniu al sistemului, fără ca cineva să fi scris cod pentru acea propoziție sau pentru acel domeniu?**

Răspunsul are trei părți, în această ordine:

1. **Limbajul** (Partea I): ce este un fir, ce este un tip, cum se pun scheme și constrângeri pe fire.
2. **Declarațiile** (Partea II): ce spune despre sine un domeniu de capabilități, ca să poată fi folosit de mecanismele generale.
3. **Mecanismele** (Părțile III–VI): cum se citește cererea, cum se leagă de declarații, când și cum se raționează, cum se execută și cum se răspunde.

Urmează rețeta pentru un domeniu nou (Partea VII), ce este interzis și cum se verifică (Partea VIII), starea de azi (Partea IX) și legăturile cu literatura (Partea X).

Regula care stă deasupra tuturor: **cod este doar acțiunea concretă a unei unelte. Tot restul — ce parametri există, cum se potrivesc, ce valoare se alege, ce constrângere se respectă, ce se răspunde — este cunoaștere scrisă ca fire și executată de mecanisme generale.**

---

# Partea I — Limbajul: fire, tipuri, scheme

## 1. Firul (wire)

Un **fir (wire)** este o singură declarație:

```
@id tip cheie=valoare cheie=valoare ...
```

- `@id` este **identificatorul (id)** firului. Alte fire îl pot numi cu `$id`; aceasta este o **referință (reference)**.
- `tip` este **tipul (type)** firului: al doilea cuvânt. Spune ce fel de declarație este.
- `cheie=valoare` este o pereche. Un fir are **chei (keys)**. O cheie poate apărea de mai multe ori (`acts=make acts=remove`): atunci are mai multe valori.

Exemplu:

```
@a1 k.animal name=fish lives=water legs=0
```

**Terminologie fixă.** Un fir are *chei*, nu sloturi și nu roluri. Cele trei cuvinte înseamnă lucruri diferite și nu se amestecă:

| Termen | Ce este | Unde trăiește |
|---|---|---|
| **cheie (key)** | numele unei valori dintr-un fir concret | în fir |
| **slot (slot)** | *declarația* unei chei pentru un tip: ce poate conține, dacă e obligatorie, ce valoare implicită are | în schemă, ca fir de tip `core.slot` |
| **rol (role)** | locul pe care îl ocupă o valoare într-un *act*: cine, ce, unde, cât | în semnătura unui act și într-un plan |

Deci: firul `@b1 box name=Ana on=$s1` are cheile `name` și `on`. Faptul că `box` are voie să aibă `name` și că `name` e obligatoriu este un slot. Iar când cineva spune „mută cutia pe raftul de sus”, „cutia” ocupă rolul *lucru* și „raftul de sus” rolul *loc* în actul *mută*. Legarea despre care vorbește acest document este în mare parte drumul **de la roluri la chei și la parametri de unelte**.

**De ce o singură formă.** Fapte, scheme, reguli, constrângeri, cuvinte, capabilități și legături de unelte se scriu toate ca fire. Consecința practică: orice mecanism care știe să citească fire poate citi orice declarație, inclusiv declarațiile despre alte declarații. Nu există un al doilea limbaj „de configurare”.

*Cu ce seamănă:* cadrele (frames) ale lui Minsky (1974) și structurile de trăsături (feature structures) din gramaticile de unificare; un fir fără variabile este un fapt Datalog cu argumente numite în loc de poziționale.

## 2. Fapt, model, șablon, variabilă

- Un **fapt (fact)** este un fir fără variabile: spune că ceva este așa.
- O **variabilă (variable)** este `?nume` în loc de valoare: o valoare de găsit prin potrivire.
- Un **model (pattern)** este un fir care descrie fire de găsit.
- Un **șablon (template)** este un fir care descrie un fir de făcut sau de completat.

O **regulă (rule)** spune: „dacă aceste modele se potrivesc, aceste șabloane sunt adevărate”. O **interdicție (deny)** spune: „aceste modele nu au voie să se potrivească”.

```
@r1 core.rule when=$p1 then=$t1
@p1 box on=?s
@t1 shelf.used id=?s
@d1 core.deny when=$p2 doc="o cutie nu stă pe ea însăși"
@p2 box id=?b on=?b
```

## 3. Lume și matrice (world, matrix)

O **lume (world)** este o mulțime de fapte ținută consistentă cu o **matrice (matrix)**. Matricea este totalitatea firelor care spun ce fapte pot exista și ce decurge din ele: sloturi, tipuri, reguli, interdicții.

Lumea verifică fiecare schimbare. O schimbare care încalcă matricea este refuzată, iar motivul refuzului este el însuși date (**încălcare, violation**), nu un mesaj de eroare scris de mână.

*Cu ce seamănă:* o bază de cunoștințe cu TBox și ABox din logicile descriptive, plus constrângeri de integritate ca în bazele de date, plus un sistem de menținere a adevărului (truth maintenance, Doyle 1979; de Kleer 1986), fiindcă lumea ține minte din ce a derivat fiecare valoare.

## 4. Tip și fel de lucru

Aici apare confuzia cea mai frecventă, deci precis:

- **Tip (type)** este al doilea cuvânt al oricărui fir. `k.animal`, `core.slot`, `box` sunt tipuri. Un tip poate extinde alt tip (`extends=`).
- **Fel de lucru (kind of thing)** este un tip care extinde `std.schema.thing`. Adică: un tip de fire ale căror instanțe sunt *lucruri din domeniu* pe care omul le poate face, schimba, muta, șterge.

Deci **da, un fel de lucru este un tip de fir** — dar nu orice tip de fir este un fel de lucru. `core.slot` este un tip, dar nimeni nu „desenează un slot”. `box` este și tip, și fel de lucru.

```
@t.box   core.type of=box   extends=std.schema.thing closed=true
@t.shelf core.type of=shelf extends=std.schema.thing closed=true
@t.crate core.type of=crate extends=box
```

`crate extends=box` este **moștenire (lineage)**: orice se spune despre `box` e valabil pentru `crate`. Moștenirea este prima și cea mai ieftină tehnică de generalizare (vezi §17).

Atenție la un al doilea sens, moștenit din bibliotecă: în `core.slot ... kind=integer`, **fel de literal (kind)** înseamnă ce fel de valoare ține slotul (`integer`, `number`, `boolean`, `string`, `atom`, `quantity.<nume>`, `time.<nume>`). În acest document scriu mereu „fel de lucru” sau „fel de literal”, niciodată doar „fel”.

## 5. Slotul: schema unei chei

```
@s.box.name  core.slot of=box   key=name  kind=string  required=true ask="Cum se numește cutia?"
@s.box.on    core.slot of=box   key=on    type=shelf
@s.box.size  core.slot of=box   key=size  kind=atom enum=small enum=medium enum=big default=medium
@s.shelf.cap core.slot of=shelf key=slots kind=integer min=1 max=6 default=3
```

Un slot poate spune:

- **ce ține**: un fel de literal (`kind=`), un alt lucru (`type=shelf`, adică o legătură), o listă închisă (`enum=`), un interval (`min= max= step=`);
- **dacă e obligatoriu** (`required=true`). O cheie obligatorie fără valoare este o **cheie deschisă (open key)**. O cheie deschisă este o întrebare pe care lumea știe că o are;
- **valoarea implicită** (`default=`), luată ca **presupunere (assumption)**, nu ca fapt spus;
- **întrebarea** de pus omului când cheia e deschisă (`ask=`).

Acesta este răspunsul la „cum pui scheme pe tipurile de fire”: **schema unui tip este mulțimea firelor `core.slot` care îl numesc.** Nu există un format separat de schemă.

## 6. Constrângeri peste fire

Constrângerile se scriu tot ca fire. Sunt cinci forme, de la cea mai ieftină la cea mai scumpă:

| Formă | Exemplu | Ce verifică |
|---|---|---|
| limite de slot | `min=1 max=6`, `enum=` | o valoare, local |
| limită de număr `std.schema.limit` | `of=table max=50` | câte lucruri de un fel |
| capacitate `std.schema.capacity` | `of=shelf key=slots holds=box via=on` | câte lucruri ține un alt lucru |
| interdicție `core.deny` | „doi invitați certați nu stau la aceeași masă” | o combinație de fapte |
| verificare calculată `core.check` | „intervalele nu se suprapun” | o funcție numită, peste valori |

O constrângere poate fi **tare (hard)** — schimbarea e refuzată — sau **slabă (soft)** — schimbarea e primită și se ține o **problemă (issue)** ca fir `core.issue` cât timp durează. Diferența contează enorm pentru raționament: constrângerile tari taie candidați, cele slabe îi ordonează (§27).

*Cu ce seamănă:* problemele de satisfacere a constrângerilor (CSP; Mackworth 1977 pentru consistența pe arce) și varianta lor ponderată (weighted / soft CSP).

## 7. Cum devin firele „lucruri generale” pe care lucrează motoarele

Mecanismele generale nu citesc tipuri anume. Ele citesc o **vedere ca fapte (facts view)** a oricărei lumi **[există: `factsOf`]**. În această vedere, orice fir care nu e model sau fir de matrice devine:

- un **lucru (thing)** cu felurile lui (tipul lui, tipurile pe care le extinde);
- **atribute**: triplete `(lucru, atribut, valoare)`;
- **relații**: triplete `(lucru, relație, lucru)` — orice referință `$id` și orice slot `type=`.

Asta este „traducerea în ceva generic”: indiferent că lumea e un desen, un plan de mese sau un document, motoarele văd *lucruri, atribute, relații și feluri*. O regulă de raționament scrisă pe această vedere merge pe orice lume.

Al doilea pas de generalizare vine din cunoaștere **[există: `kindFactsOf`]**: ce spune un catalog despre un fel de lucru („peștele trăiește în apă”, „un nor stă pe cer”) devine fapte despre *orice lucru de acel fel* din orice lume vie.

---

# Partea II — Cele trei feluri de lumi și ce declară un domeniu

## 8. Cele trei feluri de lumi

| Fel | Ce conține | Exemplu |
|---|---|---|
| **schema lumii (world schema)** | ce este un fel de lume: felurile de lucruri, sloturile, actele, limitele, regulile, cuvintele. Fără lucruri anume. Refolosibilă. | `w.seating`: mese, locuri, invitați |
| **lume de cunoaștere (knowledge world)** | fapte despre lume în general, adevărate pentru toți, fără stare de sesiune | `k.animals`, `k.colours`, `k.expect`, `w.lang.en` |
| **lume vie (live world)** | o instanță care rulează: lucrurile făcute de om, valorile lor, focusul, istoricul, undo | planul de mese de sâmbătă |

Relația: **lume vie = scheme + cunoașterea pe care o citește + starea sesiunii.**

## 9. Domeniul de capabilități (capability domain)

Sistemul are mai multe zone în care poate face lucruri reale: desenează, face diagrame, scrie documente, așază invitați, ține un calendar, cântă note. Numesc o astfel de zonă **domeniu de capabilități (capability domain)**. Evit cuvântul „tab”: tabul este doar un mod de a *arăta* un domeniu pe ecran. Același domeniu poate fi arătat într-o fereastră, citit cu voce sau folosit de alt program.

Un domeniu de capabilități este alcătuit din:

1. **o lume vie** — starea lui, ca fire;
2. **unelte (tools)** — codul care produce efectul real (pune pixeli, mută un nod, inserează un paragraf);
3. **una sau mai multe vederi (views)** — cum este arătată starea.

## 10. Capabilitate, unealtă, legătură — trei lucruri diferite

Aceasta este distincția pe care o cere întreaga arhitectură.

- **Capabilitate (capability)**: o *promisiune declarată* a domeniului. Are forma: *act* + *pe ce fel de lucru* + *ce constrângeri onorează*. Exemplu: „pot **face** o **pădure** și țin cont de **număr**, **mărime**, **loc** și de **ce feluri nu vrei**”. Este cunoaștere, scrisă ca fir. Nu spune *cum*.
- **Unealtă (tool)**: o *operație de cod* cu parametri tipizați și un efect. Exemplu: `add(kind, n, size, colour, where)`. Nu știe nimic despre propoziții, cereri sau valori implicite.
- **Legătură (binding)**: firele care spun *ce unealtă realizează ce capabilitate și de unde vine fiecare argument*.

Relațiile dintre ele:

- o capabilitate fără legătură la o unealtă este o promisiune neonorată: mecanismul trebuie să spună „știu ce ceri, dar nu am cu ce”;
- o unealtă fără capabilitate este de neatins prin limbaj: există, dar nimeni nu o poate cere;
- o capabilitate poate fi realizată de **mai multe unelte în secvență** (un „iaz” = apă + pești + stuf), iar descompunerea vine din cunoaștere, nu din unealtă;
- aceeași unealtă poate realiza **mai multe capabilități** (`add` servește și „desenează trei pisici”, și fiecare parte a unei păduri).

De ce separate: capabilitatea e ce înțelege *omul* și ce verifică *planificatorul*; unealta e ce poate *codul*. Dacă le lipești, ajungi exact la ce am găsit în aplicație: o funcție JavaScript care citește cererea, alege valori și scrie propoziția de răspuns.

*Cu ce seamănă:* în planificarea clasică (STRIPS, Fikes și Nilsson 1971; PDDL), capabilitatea este operatorul abstract cu precondiții și efecte, unealta este executorul. În apelarea de funcții de către modelele de limbaj și în MCP, unealta are o schemă de parametri — dar acolo *modelul* decide argumentele; aici le decide un mecanism care poate arăta de unde a luat fiecare valoare.

## 11. Ce declară un domeniu: lista completă

Un domeniu declară șase grupe de fire. Nimic altceva nu are voie să fie „știut” în cod.

**(a) Felurile de lucruri și sloturile lor [există]** — §4, §5.

**(b) Cuvintele [există]** — `core.word text=crate means=box`. Vocabularul domeniului stă lângă domeniu; limba (determinanți, prepoziții, numerale, indicii de negație) stă în lumea limbii.

**(c) Capabilitățile [există]**

```
@k.box   std.schema.kind    of=box   world=shelfworld acts=make acts=place acts=change acts=remove
@h.make  std.schema.honours world=shelfworld act=make  on=kind on=count on=size on=place on=attribute of=box
@h.place std.schema.honours world=shelfworld act=place on=place of=box
```

`std.schema.kind` spune ce acte se aplică unui fel de lucru. `std.schema.honours` spune ce **chei de constrângere** onorează un act pentru lucrurile numite. Cheile de constrângere sunt cele din `w.request` (§14): `kind`, `count`, `size`, `extent`, `attribute`, `place`, `manner`, `layout`, `with`, `about`, `length`.

**(d) Uneltele: semnătură, precondiții, efecte [propus; azi doar `std.schema.effect of= act= action=` și, în aplicație, `psys2.op`]**

```
@op.add   std.tool.op    world=shelfworld name=add effect=makes
@pa.kind  std.tool.param op=add name=kind  type=box        required=true
@pa.n     std.tool.param op=add name=n     kind=integer min=1 max=20 default=1
@pa.size  std.tool.param op=add name=size  accepts=small accepts=medium accepts=big
@pa.on    std.tool.param op=add name=on    type=shelf
@pre.add  std.tool.needs op=add exists=shelf
```

**(e) Legătura [propus]**

```
@b.make std.tool.bind world=shelfworld act=make of=box op=add
@a1 std.tool.arg bind=$b.make param=kind from=step.kind
@a2 std.tool.arg bind=$b.make param=n    from=step.count
@a3 std.tool.arg bind=$b.make param=size from=request.size
@a4 std.tool.arg bind=$b.make param=on   from=request.place
```

**(f) Așteptări proprii, opțional [există: `k.expect.*`]** — doar unde domeniul diferă de cunoașterea generală (§20).

Și, în afara firelor, două bucăți de cod:

- **uneltele** propriu-zise;
- **vederea stării (state view)**: o funcție care dă starea reală a uneltei ca fire (ce lucruri sunt, cu ce id, ce atribute, unde).

---

# Partea III — Traseul unei cereri

## 12. Privire de ansamblu: șapte pași

| Pas | Întrebarea | Intră | Iese | Mecanism |
|---|---|---|---|---|
| 1. **Vedere** | Ce este acum în domeniu? | starea uneltei | fapte | vederea stării + `factsOf` |
| 2. **Înțelegere** | Ce a spus omul? | text | cerere (`w.request`) | `readRequest` |
| 3. **Situare** | E cerere nouă sau reacție? La ce se referă? | cerere + dialog | cerere revizuită | `reviseRequest`, referințe |
| 4. **Decizie** | Ce anume se face, cu ce valori? | cerere + capabilități + cunoaștere + fapte | plan | `planRequest` |
| 5. **Acțiune** | Fă-o. | plan + legături | efect + stare nouă | `runPlan` + unelte |
| 6. **Spunere** | Ce s-a făcut, ce s-a presupus, ce nu s-a putut? | plan + diferență de stare | răspuns | `sayRequest` |
| 7. **Păstrare** | Ce ține minte dialogul? | tot | pas de istoric | `w.dialogue`, cronologie |

Limba apare doar la pașii 2 și 6. Între ei, totul este fire fără cuvinte. De aceea româna poate rămâne un strat de traducere și de aceea un domeniu nou nu cere o gramatică nouă.

*Cu ce seamănă:* arhitectura „stare de informație” a dialogului (information state update, Larsson și Traum 2000); ciclul clasic percepe–decide–acționează; conducta de generare de limbaj a lui Reiter și Dale (2000) pentru pasul 6.

## 13. Pasul 1 — vederea

Înainte de orice citire, starea reală a uneltei devine fapte. Motivele:

- referințele („cutia roșie”, „pe ele”, „a doua”) se rezolvă pe fapte, nu pe text;
- constrângerile se verifică pe fapte;
- **diferența dintre vederea de dinainte și cea de după** este singura sursă cinstită pentru „ce s-a făcut”.

Regulă: vederea nu interpretează. Dă id-uri, feluri, atribute, relații. Nimic despre cerere.

*Cu ce seamănă:* problema vederilor actualizabile din baze de date și lentilele bidirecționale (Foster și colab. 2007): starea uneltei și faptele sunt două fețe ale aceluiași lucru, ținute în acord.

## 14. Pasul 2 — înțelegerea: cererea ca lume

O propoziție nu se potrivește cu un tipar de propoziție. Se citește într-o **cerere (request)**, care este ea însăși fire, de tip `w.request`:

- **actul (act)**: ce se vrea făcut — `make`, `change`, `place`, `remove`, `arrange`, `undo`…;
- **ținta (target)**: pe ce — un fel de lucru sau un întreg;
- **constrângerile (constraints)**: fiecare cu `on` (cheia), `want` (`yes` / `no` / `not_all`), valoare, eventual număr, limite, unitate, și **cuvintele exacte** din care a fost citită;
- **reacțiile (reactions)**: „prea multe”, „mai mic”, „frumos”;
- **necititul (unread)**: cuvintele pe care nimic nu le-a luat.

Exemplu: „fă o pădure mare, fără păsări” devine: act `make`, țintă `forest`, constrângeri `size=big (yes)`, `kind=bird (no)`, nimic necitit.

De unde vin cuvintele — toate date:

- **indicii (cues)** din lumea limbii: „fără”, „cel mult”, „în colț”, „prea multe”;
- **felurile de lucruri** și **cuvintele** domeniului;
- **valorile** din sloturi (`enum=`) și din cataloage (culori);
- **verbele** din `k.actions`.

Două reguli de cinste:

1. **Ce nu e citit se spune.** O cerere cu cuvinte necitite în locuri care contează nu se execută pe ghicite.
2. **Corectarea de cuvinte** (`repairWords`) nu atinge un cuvânt corect: candidații vin din faptele lumilor vii, din dialog, apoi din dicționar, și se repară doar la un singur cel mai bun candidat.

*Cu ce seamănă:* semantica de cadre (Fillmore; FrameNet) și sistemele de dialog conduse de cadre (GUS, Bobrow și colab. 1977); SHRDLU (Winograd 1972) pentru ideea că înțelegerea se sprijină pe starea unei lumi mici.

## 15. Pasul 3 — situarea

Trei întrebări, fiecare cu mecanismul ei:

- **Cerere nouă sau reacție?** Un mesaj cu act și lucru nou e cerere nouă. Altfel e reacție la ultimul rezultat, iar faptele `w.dialogue.revision` spun ce face reacția: `step` (un pas pe scară: „mai puține” înjumătățește numărul), `flip` (ce era devine nedorit), `add` (constrângerea spusă o înlocuiește pe cea cu aceeași cheie), `keep` (la fel, altă variantă), `undo`, `none`.
- **La ce se referă?** „el”, „ele”, „cutia roșie”, „a doua” se rezolvă pe faptele din vedere și pe ultimul rezultat ținut de dialog.
- **Ce rămâne neatins?** O revizuire schimbă *doar* cheile pe care le numește. Restul cererii anterioare rămâne exact. Aceasta este schimbarea minimă.

*Cu ce seamănă:* revizuirea de convingeri cu schimbare minimă (AGM: Alchourrón, Gärdenfors, Makinson 1985); rezolvarea anaforei pe o stare de discurs.

---

# Partea IV — Tehnicile de legare, una câte una

Legarea este drumul de la **rolurile cererii** la **cheile lumii vii** și la **parametrii uneltelor**. Sunt unsprezece tehnici. Le dau în ordinea costului: se încearcă întâi cea mai ieftină, iar fiecare are un semnal clar de „nu ajunge, treci la următoarea”.

## 16. Legarea directă prin nume și tip

**Ce face.** Cheia de constrângere `size` a cererii se leagă de slotul `size` al felului de lucru și de parametrul `size` al uneltei, pentru că poartă același nume și valoarea spusă e printre cele acceptate.

**Exemplu (raft).** „o cutie mare” → `size=big`; slotul `box.size` are `enum=big`; parametrul `add.size` are `accepts=big`. Se leagă fără niciun pas de gândire.

**Când nu ajunge.** Valoarea spusă nu e acceptată, sau numele diferă, sau slotul lipsește.

*Cu ce seamănă:* unificarea de structuri de trăsături; potrivirea de schemă prin nume.

## 17. Legarea prin moștenire (lineage)

**Ce face.** Ce e declarat pentru un fel de lucru e valabil pentru cele care îl extind; ce e nedorit pentru un fel e nedorit pentru subfelurile lui.

**Exemple.**
- *Desen:* „fără pești” exclude și `goldfish`, fiindcă `goldfish extends=fish`.
- *Raft:* capabilitatea „mută o cutie” e valabilă pentru `crate`.
- *Plan de mese:* „mută un invitat” e valabil pentru `child`, care extinde `guest`.

**Când nu ajunge.** Felul spus nu e nici declarat, nici descendent al unuia declarat.

*Cu ce seamănă:* subsumarea din logicile descriptive; moștenirea în rețele semantice.

## 18. Substituția prin cunoaștere („realizat ca”)

**Ce face.** Un fel de lucru pe care unealta nu îl are se realizează prin cel mai apropiat pe care îl are, iar asta **se spune**.

```
@as.reed std.schema.drawn world=drawing kind=reed as=flower
@as.oval std.schema.drawn world=diagram kind=oval as=ellipse
```

**Exemple.** *Desen:* stuful e desenat ca floare. *Diagramă:* ovalul e elipsă. *Muzică:* un instrument lipsă e cântat cu cel mai apropiat din aceeași familie.

**Regula de cinste.** Substituția intră în lista de presupuneri a planului. Omul află că a primit altceva.

**Starea.** **[există în aplicație ca `std.schema.drawn`]**; trebuie mutat în bibliotecă și generalizat la orice parametru, nu doar la feluri (§19).

## 19. Traducerea valorilor pe o scară sau într-un spațiu

**Ce face.** O valoare spusă care nu e printre cele acceptate de parametru se duce la **cea mai apropiată acceptată**, după o ordine sau o distanță pe care o dă cunoașterea.

**Exemple.**
- *Mărime:* scara `tiny < small < default < big < huge` este în `k.expect.scale`. Unealta acceptă doar `small` și `big`. „minuscul” → `small`. Fără niciun tabel de sinonime în cod.
- *Culoare:* „turcoaz” la o unealtă cu opt culori → cea mai apropiată din `k.colours`, spusă ca presupunere.
- *Loc:* „sus în dreapta” la o unealtă cu regiuni numite → regiunea a cărei descriere din `k.space` se potrivește.
- *Timp:* „după-amiază” într-un calendar cu ore → intervalul din `k.time`.

**De ce e un singur mecanism.** Toate patru sunt același lucru: *valoare spusă + mulțimea valorilor acceptate + o ordine sau o distanță din cunoaștere → valoarea cea mai apropiată, cu proveniență*. Astăzi fiecare e scrisă separat în JavaScript; asta e peticul care trebuie să dispară.

**Când nu ajunge.** Nu există ordine sau distanță pentru acel fel de valoare. Atunci constrângerea merge la „nu am putut onora”, cu motivul.

*Cu ce seamănă:* ierarhiile de concepte și măsurile de similaritate semantică; „relaxarea interogării” din baze de date cooperative.

## 20. Umplerea golurilor: valori implicite ca așteptări

**Ce face.** Ce omul nu a spus se completează din surse, **într-o ordine fixă care este și costul presupunerii** **[există: `REQUEST_SOURCES`]**:

1. **spus (said)** — în mesaj;
2. **dialog (dialogue)** — din cererea anterioară, dacă e același lucru;
3. **indus (induced)** — din ce e deja în lumea vie (§26);
4. **lume (world)** — implicitul slotului;
5. **așteptare (expect)** — ce e tipic, din cunoaștere;
6. **eșantionat (sampled)** — o alegere variată, între limite.

Așteptările sunt fapte:

```
@e1 k.expect.make thing=flowchart unit=node min=5 max=9 typical=7 kinds_min=2 kinds_max=3 layout=flow
@e2 k.expect.part of=forest part=tree min=5 max=7 typical=6 needed=yes
@e3 k.expect.scale step=small order=2 count_factor=0.5 size_factor=0.7
```

**Regula care apără de prostii.** *O valoare implicită umple doar ce omul a lăsat gol. Nu înlocuiește niciodată ce a spus.* Dacă omul cere „cum se coace pâinea” și cunoașterea nu are pașii, răspunsul corect e „nu știu pașii; pot face cinci pași goi sau mi-i spui tu” — nu o diagramă despre altceva.

**Așteptări cu condiție [propus].** Multe valori implicite depind de altele: „un lucru mic stă în colț”, „până la șase lucruri se așază pe un rând, peste șase pe grilă”, „nodul de început e elipsă, ramificarea e romb”. Acestea se scriu ca așteptări cu `when=`:

```
@e4 k.expect.value on=place  value=corner when.size=small
@e5 k.expect.value on=layout value=row    when.count.max=6
@e6 k.expect.value on=layout value=grid   when.count.min=7
@e7 k.diagram.role role=start  shape=ellipse
@e8 k.diagram.role role=branch shape=diamond
```

*Cu ce seamănă:* logica implicitelor (default logic, Reiter 1980); completarea cadrelor cu valori tipice la Minsky; prototipurile din psihologia categoriilor (Rosch).

## 21. Îmbinarea între lumi (join)

**Ce face.** Un slot al unei lumi numește un lucru dintr-o altă lume, prin tip și cheie: `type=T by=name`. Astfel o lume vie folosește cunoaștere fără s-o copieze.

**Exemple.**
- *Plan de mese:* `guest.person type=w.person by=name` — invitatul este o persoană din lumea persoanelor, cu preferințele ei.
- *Calendar:* `event.place type=k.places.city by=name` — de aici vine fusul orar.
- *Desen:* un lucru desenat este de un fel din catalog, deci „trăiește în apă” se aplică.

**Ce apără.** Îmbinarea este strictă: un nume care nu există în lumea numită este o încălcare, nu un text liber.

*Cu ce seamănă:* cheile străine; alinierea de ontologii.

## 22. Compunerea întregului din părți

**Ce face.** O cerere pentru un **întreg (whole)** — „o pădure”, „o schemă logică”, „un raport” — se descompune în părți după faptele de așteptare, iar fiecare parte devine un pas de plan legat de o unealtă.

**Exemple.**
- *Desen:* pădure → 5–7 copaci (obligatoriu), eventual păsări, flori.
- *Diagramă:* schemă logică → 5–9 noduri, 2–3 forme, legate în flux.
- *Document:* raport → titlu, introducere, 3 secțiuni, concluzie (din `k.layouts`).
- *Plan de mese:* „o masă de opt” → o masă + opt locuri.

Constrângerile cererii se împart între părți după cheia lor: un număr stă lângă felul pe care îl numără („doi câini și un copac”: doi e al câinilor), o excludere se aplică tuturor părților, o mărime se aplică întregului.

*Cu ce seamănă:* planificarea ierarhică pe rețele de sarcini (HTN; Erol, Hendler, Nau 1994; SHOP2): un întreg este o sarcină compusă, metodele ei sunt fapte de cunoaștere.

## 23. Operatori de structură peste orice întreg [propus]

Unele decizii nu țin de niciun domeniu, ci de forma „întreg cu părți și legături”:

- **taie la n** păstrând structura (rădăcina și nivelurile de sus ale unui arbore, primele capitole ale unui text);
- **completează până la n**;
- **„nu toate la fel”**: cel puțin două feluri între părți;
- **mai multe feluri spuse împreună** („un cer și un soare”): fiecare cu numărul lui;
- **unește tot ce e liber** („leagă-le pe toate”).

Aceștia trebuie să fie operatori ai bibliotecii, valabili pe o diagramă, pe un document cu capitole, pe o listă cu subpuncte. Astăzi sunt scriși în codul diagramelor și al documentelor, separat.

## 24. Referința la ce există

**Ce face.** Un rol ocupat de o expresie despre ceva existent se leagă de id-ul unui lucru din vedere:

- **prin nume sau etichetă**: „nodul Start”;
- **prin fel și atribut**: „cutia roșie”;
- **prin ordinal**: „a doua”;
- **prin pronume**: „el”, „ele” = lucrurile ultimului rezultat;
- **prin relație**: „cea de lângă casă”.

Dacă se potrivesc mai multe și niciuna nu e în focus, mecanismul **întreabă o singură dată** („care cerc?”). Dacă nu se potrivește niciuna, spune asta.

## 25. Legarea de unealtă: de la pas de plan la apel [propus]

Un pas de plan are: act, fel de lucru, roluri umplute. Legătura (§11 e) spune pentru fiecare parametru al uneltei de unde vine argumentul:

| Sursă `from=` | Înseamnă |
|---|---|
| `step.<rol>` | din pasul de plan (felul, numărul părții) |
| `request.<cheie>` | din constrângerea cererii, tradusă pe valorile acceptate (§19) |
| `state.<relație>` | din vedere: id-ul unui lucru existent (§24) |
| `result.<pas>` | id-ul făcut de un pas anterior al aceluiași plan |

Executorul general face, pentru fiecare pas:

1. găsește legătura după (act, fel de lucru), urcând pe moștenire;
2. umple fiecare parametru din sursa lui; unde lipsește, ia implicitul parametrului;
3. verifică **precondițiile** pe vedere („există un raft”);
4. apelează unealta;
5. citește vederea din nou și verifică **efectul** declarat („a apărut un `box`”).

Unealta nu vede cererea. Primește doar argumente tipizate.

## 26. Legarea prin inducție din ce e deja acolo

**Ce face.** Dacă lucrurile de același fel din lumea vie au toate o valoare comună, un lucru nou o ia și el **[există: `induceStyle`]**. Dacă omul a corectat de două ori în același sens, a treia oară corecția se aplică de la început **[există: `induceCorrections`]**.

**Exemple.** *Diagramă:* toate nodurile sunt albastre → nodul nou e albastru. *Plan de mese:* toate mesele sunt rotunde → masa nouă e rotundă. *Document:* toate titlurile sunt scurte → titlul nou e scurt.

De aceea „indus” stă înaintea implicitului din lume și a așteptării în ordinea surselor: ce a făcut omul aici contează mai mult decât ce e tipic în general.

*Cu ce seamănă:* anti-unificarea (cea mai puțin generală generalizare, Plotkin 1970); învățarea din exemple în programarea logică inductivă.

---

# Partea V — Când e nevoie de raționament și de căutare

## 27. Principiul: drumul direct, până apare un semnal

Majoritatea cererilor se leagă direct (§16–§18) și se execută. Raționamentul și căutarea costă, deci pornesc **numai la un semnal**. Fiecare semnal este o stare a datelor, vizibilă și verificabilă — nu o bănuială a programatorului.

| Semnalul | Ce înseamnă | Ce procedură pornește |
|---|---|---|
| **rol sau parametru obligatoriu gol** | omul nu a spus ceva necesar | umplere din surse (§20); dacă nicio sursă nu are, **o întrebare** |
| **valoare neacceptată** | spus, dar unealta nu o are | traducere pe scară (§19) sau substituție (§18) |
| **constrângere spusă, nedeclarată de act** | capabilitatea nu există | refuz cinstit: „nu țin cont de X aici” |
| **constrângere tare încălcată la simulare** | planul ar strica ceva | respinge candidatul, încearcă altul (§29) |
| **constrângere slabă încălcată** | planul e posibil dar nefiresc | cost; alege candidatul cel mai ieftin (§30) |
| **mai multe planuri posibile** | cererea lasă libertate | propune câteva, simulează, alege (§29) |
| **referință ambiguă** | mai multe lucruri se potrivesc | focus; altfel o întrebare |
| **excluderi care nu lasă nimic** | „fără A, fără B” și doar A, B există | cea mai veche cedează, și se spune |
| **diferență de stare goală** | s-a executat și nu s-a schimbat nimic | răspuns „nu am schimbat nimic, pentru că…” |
| **cuvinte necitite într-un loc care contează** | n-am înțeles o parte | nu se execută; se numesc părțile înțelese și neînțelese |

Aceasta este și definiția practică a „când e nevoie de reasoning”: **când legarea directă lasă un gol, un conflict sau o alegere.**

## 28. Deducția: ce decurge și ce se încalcă

**Ce face.** Pornind de la faptele lumii vii și de la ce spune cunoașterea despre felurile lor, derivă consecințe și găsește încălcări **[există: `deduceState`]**. Mărginită: adâncime 2 (ce spune catalogul despre felul lucrului, apoi despre părinții felului).

**Exemple.**
- *Desen:* „peștele trăiește în apă” + un pește pus pe cer → încălcare slabă („peștele nu e în apă”).
- *Plan de mese:* capacitate 8 + al nouălea invitat → încălcare tare.
- *Calendar:* două evenimente ale aceleiași persoane care se suprapun → încălcare tare sau slabă, după cum e declarat.
- *Document:* o secțiune fără titlu → cheie deschisă.

*Cu ce seamănă:* înlănțuirea înainte din Datalog; verificarea constrângerilor de integritate.

## 29. Căutarea: propune, simulează, respinge, alege

Când există o alegere, ciclul este **[există în `planRequest`]**:

1. **propune** cel mult 5 candidați (valori diferite pentru golurile libere);
2. **simulează** fiecare pe o **copie (fork)** a lumii vii — nimic real nu se atinge;
3. **deduce** consecințele pe copie;
4. **respinge** candidații cu încălcări tari;
5. **ordonează** restul după cost (§30);
6. **alege** primul; dacă nu rămâne niciunul, spune ce constrângere a blocat.

Pentru probleme cu multe chei deschise și domenii enumerabile (așezarea a 40 de invitați la 5 mese), același cadru folosește un **rezolvitor (solver)** **[există: `world.solve`]**: aceeași declarație de constrângeri, altă strategie de căutare.

**Mărginire.** Fiecare apel are un **buget (budget)** de pași. La epuizare, răspunsul spune că s-a oprit, nu inventează.

*Cu ce seamănă:* generează-și-testează; căutarea cu revenire și propagarea de constrângeri din CSP; planificarea prin simulare înainte.

## 30. Abducția: cea mai bună explicație pentru ce lipsește

**Ce face.** Dintre mai multe moduri de a umple golurile, îl alege pe cel care cere **cele mai ieftine presupuneri**. Costul unei presupuneri este locul sursei ei în ordinea din §20 (spus = 0, dialog, indus, lume, așteptare, eșantionat) plus costul încălcărilor slabe și al pașilor de inferență.

**Exemple.**
- „pune un pește” într-un desen cu un iaz și un cer: candidatul „în iaz” nu încalcă nimic; „pe cer” încalcă o constrângere slabă. Se alege iazul. Omul nu a spus unde; sistemul a *abdus* locul.
- „pictează un lac fără păsări”: verbul „pictează” nu e act declarat; cea mai ieftină explicație, dat fiind că urmează un întreg care se poate face, este `make`.
- *Calendar:* „mută ședința mai târziu” → cel mai apropiat interval liber care nu încalcă nimic.

*Cu ce seamănă:* abducția la Peirce; „interpretarea ca abducție” (Hobbs și colab. 1993), unde înțelegerea unui text este cea mai ieftină demonstrație; abducția ponderată.

## 31. Inducția: regula din exemple

Vezi §26. Este mărginită intenționat: cel puțin 3 lucruri din care să generalizeze, cel puțin 2 corecții. Sub aceste praguri nu induce nimic.

## 32. Cum se leagă cele trei între ele

- **Inducția** produce valori candidate („aici totul e albastru”).
- **Abducția** alege între candidați pe cel mai ieftin.
- **Deducția** verifică alegerea și o respinge dacă încalcă ceva tare.

Toate trei lucrează pe aceeași vedere ca fapte și pe aceleași constrângere declarate. Niciuna nu știe în ce domeniu se află.

---

# Partea VI — Constrângeri, proveniență, răspuns

## 33. Un singur vocabular de constrângeri [propus ca unificare]

Azi există constrângeri în patru locuri cu patru forme: în cerere (`on=`, `want=`), în schemă (limite, capacități, interdicții), în cunoaștere („trăiește în apă”) și în așteptări (min, max, tipic). Propunerea este o singură formă, cu trei atribute:

- **tărie (strength)**: tare sau slabă, cu cost;
- **origine (origin)**: spus, revizuit, dialog, indus, lume, așteptare, cunoaștere;
- **cuvinte (words)**: textul exact al omului, dacă a fost spusă.

Câștigul: același verificator, aceeași formă de „nu am putut onora”, aceeași ordine de cedare (la conflict cedează întâi presupunerea cea mai slabă, niciodată ce a spus omul).

## 34. Proveniența (provenance)

Fiecare valoare din plan poartă de unde vine: care sursă, care fapt, care regulă. De aici vin trei lucruri:

- răspunsul poate spune „am presupus 7 noduri, cât e tipic”;
- la revizuire se știe ce e voie să se schimbe (presupunerile) și ce nu (ce a spus omul);
- la revizie de cod se vede dacă o valoare a venit din cunoaștere sau dintr-o constantă ascunsă.

Lumea ține deja **treapta (tier)** fiecărei valori: `told`, `derived`, `forced`, `default`, `guessed`.

*Cu ce seamănă:* proveniența datelor (semi-inele de proveniență, Green și colab. 2007); justificările din sistemele de menținere a adevărului.

## 35. Execuția și cronologia (timeline)

Reguli, valabile în orice domeniu:

- **o cerere executată = un pas de undo**, oricâte unelte a apelat;
- **o revizuire înlocuiește pasul** rezultatului pe care îl revizuiește;
- **o întrebare nu e pas**;
- **undo și redo sunt acte ale cronologiei**, nu ale domeniului; domeniul declară doar unealta lui de anulare;
- **un mesaj citit doar parțial nu execută nimic**.

Astăzi aplicația face asta în ușa ei **[provizoriu]**; locul este în `runPlan` **[propus]**.

## 36. Răspunsul: din diferența de stare, nu din propoziții scrise de mână

Răspunsul are patru părți, toate din date:

1. **ce s-a făcut** — din diferența dintre vederea de dinainte și cea de după;
2. **ce s-a presupus** — din proveniență, doar presupunerile care contează;
3. **ce nu s-a putut onora** — cu cuvintele omului și cu motivul (`not_declared`, `no_slot`, `value`, `no_kind`, `nothing_left`);
4. **ce nu s-a înțeles** — cuvintele necitite.

Cuvintele vin din **fapte de răspuns (reply facts)** ale lumii limbii, cu roluri de umplut. Un domeniu nu conține nicio propoziție. De aceea același răspuns iese în română prin lumea `w.lang.ro`.

Două întrebări se răspund prin același mecanism, „spune fapte ale lumii vii”:

- „ce e în desen?” → interogare pe vedere;
- „ce poți face aici?” → interogare pe capabilități și legături.

*Cu ce seamănă:* maximele lui Grice (cantitate, calitate) ca regulă de proiectare; generarea de limbaj din date (Reiter și Dale 2000).

## 37. Lista cinstită (honest list)

Ce nu are încă piesă generală nu se rezolvă cu o regulă pe caz. Se trece pe o listă, cu forma „are nevoie de <piesă>”, unde piesa e una dintre: declarație, cunoaștere, limbă, compunere de lumi, metodă de raționament, mecanism de bibliotecă. Lista este ea însăși fire (`w.honest`, **[propus]**), ca nevoile să se poată număra pe piese. Următoarea lucrare se alege după câte cereri reale deblochează o piesă.

---

# Partea VII — Rețeta pentru un domeniu nou

## 38. Pașii

1. **Scrie felurile de lucruri și sloturile.** Întreabă: ce face omul aici, ce are fiecare lucru?
2. **Scrie cuvintele** domeniului. Nu cuvinte de limbă generală.
3. **Declară capabilitățile**: pentru fiecare act, ce constrângeri onorează *cu adevărat*.
4. **Scrie uneltele**: puține, mici, cu parametri tipizați. Fără text, fără valori implicite ascunse.
5. **Scrie vederea stării.**
6. **Declară semnăturile uneltelor și legăturile.**
7. **Caută în cunoaștere** ce există deja (așteptări, scări, locuri). Adaugă așteptări proprii doar unde domeniul diferă.
8. **Rulează testele generate din declarații** (§41).
9. **Probează cu fraze noi.** Ce nu merge: întâi întreabă ce piesă generală lipsește; dacă nu există, pe lista cinstită.

## 39. Exemplu complet: un raft cu cutii

```
# feluri de lucruri și sloturi
@w        std.schema.world name=shelfworld
@t.shelf  core.type of=shelf extends=std.schema.thing closed=true
@t.box    core.type of=box   extends=std.schema.thing closed=true
@s1 core.slot of=shelf key=slots  kind=integer min=1 max=6 default=3
@s2 core.slot of=box   key=name   kind=string
@s3 core.slot of=box   key=colour kind=atom
@s4 core.slot of=box   key=size   kind=atom enum=small enum=big default=small
@s5 core.slot of=box   key=on     type=shelf
@cap std.schema.capacity of=shelf key=slots holds=box via=on

# cuvinte
@wd1 core.word text=crate text=carton means=box

# capabilități
@k1 std.schema.kind of=shelf world=shelfworld acts=make
@k2 std.schema.kind of=box   world=shelfworld acts=make acts=place acts=change acts=remove
@h1 std.schema.honours world=shelfworld act=make   on=kind on=count on=size on=attribute on=place of=box
@h2 std.schema.honours world=shelfworld act=place  on=place of=box
@h3 std.schema.honours world=shelfworld act=change on=attribute on=size of=box
@h4 std.schema.honours world=shelfworld act=remove of=box

# unelte și legături (forma propusă)
@op1 std.tool.op world=shelfworld name=add    effect=makes
@op2 std.tool.op world=shelfworld name=move   effect=changes
@op3 std.tool.op world=shelfworld name=set    effect=changes
@op4 std.tool.op world=shelfworld name=delete effect=removes
@b1 std.tool.bind act=make   of=box op=add
@b2 std.tool.bind act=place  of=box op=move
@b3 std.tool.bind act=change of=box op=set
@b4 std.tool.bind act=remove of=box op=delete
```

Cod: patru funcții (`add`, `move`, `set`, `delete`) și vederea. Atât.

Ce trebuie să meargă fără nimic în plus:

| Omul spune | Ce se întâmplă | Tehnica |
|---|---|---|
| „pune trei cutii roșii” | 3 cutii, roșii, mici, pe primul raft cu loc | direct; implicit de slot; abducția locului |
| „fără cutii mari” apoi „încă două” | 2 mici | dialog; constrângerea rămâne |
| „mai puține” | se revine la mai puține, restul neschimbat | revizuire `step` |
| „mută cartonul roșu pe raftul de sus” | o întrebare dacă sunt trei roșii | cuvânt; referință ambiguă |
| „zece cutii” pe un raft de 3 | refuz cu motivul capacității | deducție, constrângere tare |
| „ce poți face aici?” | lista din capabilități | spune fapte |
| „undo” | pasul întreg înapoi | cronologie |

## 40. Aceleași tehnici pe domenii diferite

| Tehnică | Desen (spațiu) | Diagramă (graf) | Document (text) | Plan de mese (alocare) | Calendar (timp) |
|---|---|---|---|---|---|
| moștenire | goldfish → fish | romb → formă | subsecțiune → secțiune | copil → invitat | ședință → eveniment |
| traducere pe scară | minuscul → mic | „multe” → 9 | „scurt” → 0,4× | „mare” → masă de 10 | „dimineață” → 9–12 |
| așteptare | pădure: 5–7 copaci | flux: 5–9 noduri | raport: 3 secțiuni | masă: 8 locuri | ședință: 1 oră |
| îmbinare | lucru ↔ `k.animals` | nod ↔ pas din `k.process` | secțiune ↔ `k.layouts` | invitat ↔ `w.person` | loc ↔ `k.places` |
| deducție | pește în apă | fără săgeată spre sine | fără titlu gol | capacitate, certați | fără suprapuneri |
| abducție | unde pun peștele | de ce nod leg nodul nou | unde inserez paragraful | la ce masă pun invitatul | când mut ședința |
| inducție | toate florile roșii | toate nodurile albastre | toate titlurile scurte | toate mesele rotunde | toate ședințele dimineața |
| operator de structură | — | taie la n noduri | taie la n capitole | — | — |

Faptul că tabelul se poate umple pe fiecare coloană cu aceleași rânduri este argumentul că mecanismele sunt generale.

---

# Partea VIII — Ce este interzis și cum se verifică

## 41. Ce are voie să fie cod

În codul unui domeniu au voie doar:

1. **uneltele** — operații mici, cu parametri tipizați, care nu citesc cererea;
2. **vederea stării**;
3. **constrângeri și căutări speciale**, fiecare declarată în firele domeniului cu nume și semnătură, și numai unde un fir nu o poate spune (geometrie, așezare automată, un algoritm de stivuire).

## 42. Mirosurile de petic (patch smells)

O revizie respinge, în codul unui domeniu sau al ușii:

- citirea cererii sau a faptelor ei;
- tabele de cuvinte sau de sinonime;
- valori implicite (numere, forme, locuri);
- alegerea numărului, a felului, a formei, a locului;
- numele unui fel de lucru sau al unei lumi ca text în cod;
- propoziții de răspuns;
- expresii regulate pe textul omului sau pe răspuns;
- un prag reglat pe un singur caz;
- o constantă copiată din test în cod;
- o verificare slăbită ca să treacă un caz;
- două mecanisme pentru același lucru după o schimbare.

## 43. Cum se măsoară

- **Numărătorul de cod de legătură**: câte astfel de încălcări sunt în fișierele la care ajung operațiile unui domeniu. Are voie doar să scadă.
- **Două coloane la orice rezultat**: „doar prin legătură declarată” și „prin cod scris de mână”. Contează prima.
- **Teste generate din declarații**: din fiecare `honours` se generează proprietăți („dacă actul onorează numărul, numărul spus apare în rezultat sau în «nu am putut»”). Un domeniu nou primește testele fără să le scrie cineva.
- **Probe cu fraze noi** la fiecare livrare, nu fraze fixe.
- **Dovada de generalitate**: un domeniu de jucărie făcut doar din fire și câteva unelte merge cu zero linii de legătură.

*Cu ce seamănă:* testarea bazată pe proprietăți (QuickCheck, Claessen și Hughes 2000) și testarea metamorfică.

---

# Partea IX — Starea de azi

| Piesă | Stare |
|---|---|
| fire, tipuri, sloturi, reguli, interdicții, lume, copie, undo | **există** (bibliotecă) |
| `std.schema.kind`, `honours`, `limit`, `capacity`, `needs`, `view` | **există** |
| vederea ca fapte (`factsOf`), fapte despre feluri (`kindFactsOf`) | **există** |
| citirea cererii, corectarea de cuvinte, revizuirea | **există** |
| planul cu surse ordonate, ciclul propune–simulează–respinge–alege | **există** |
| deducție mărginită, abducție ponderată, inducție locală | **există** |
| rezolvitoare pentru multe chei deschise | **există** |
| `sayRequest` | **există**, dar domeniile își scriu încă propriile propoziții |
| substituția „realizat ca” (`std.schema.drawn`) | **provizoriu** (în aplicație; doar pentru feluri) |
| legătura act → operație (`psys2.op`) | **provizoriu** (leagă la o funcție de legătură, nu la o unealtă) |
| cronologia (un pas pe cerere) | **provizoriu** (în ușa aplicației) |
| referințe la lucruri existente, starea ca fapte ale cererii | **provizoriu** |
| semnătura uneltei, parametri, precondiții, efecte (`std.tool.*`) | **propus** |
| traducerea oricărei valori pe scară | **propus** (azi: tabele în cod) |
| așteptări cu condiție | **propus** (azi: `if` în cod) |
| operatori de structură | **propus** (azi: în codul diagramelor și documentelor) |
| execuția cu unelte + diferență de stare | **propus** |
| un singur vocabular de constrângeri | **propus** |
| lista cinstită ca fire (`w.honest`) | **propus** |

**Problema principală azi:** în cele trei domenii declarate (desen, diagrame, documente), între planul general și unealtă stă câte o funcție JavaScript care decide din nou valori și scrie răspunsul. Tot ce e marcat „propus” mai sus există deja acolo, dar ca cod pe domeniu. Lucrarea următoare este mutarea lor în fire și în mecanisme.

Încă o observație cinstită despre bibliotecă: lista cheilor de constrângere (`kind`, `count`, `size`…) este fixă în codul ei. Ar trebui să fie tot fire, ca un domeniu să poată aduce o cheie nouă (de exemplu `tempo` pentru muzică) fără schimbare de bibliotecă.

---

# Partea X — Legături cu alte sisteme și cu literatura

| Idee de aici | Înrudită cu | Diferența |
|---|---|---|
| fir cu chei, sloturi cu implicite | cadre (Minsky 1974); structuri de trăsături | o singură sintaxă și pentru reguli, și pentru capabilități |
| lume = fapte + matrice | baze de cunoștințe DL (TBox/ABox); constrângeri de integritate | verificare la fiecare schimbare, cu undo |
| derivări ținute minte | menținerea adevărului (Doyle 1979; de Kleer 1986) | parte din lume, nu sistem separat |
| capabilitate + unealtă + precondiții + efecte | STRIPS (Fikes, Nilsson 1971); PDDL | capabilitatea poartă și ce constrângeri de limbaj onorează |
| întreg din părți | HTN (Erol, Hendler, Nau 1994); SHOP2 | metodele sunt fapte de așteptare cu intervale |
| constrângeri tari și slabe | CSP (Mackworth 1977); CSP ponderat | aceleași constrângeri folosite la citire, plan și răspuns |
| implicite ca așteptări | logica implicitelor (Reiter 1980) | cu cost și cu proveniență spusă omului |
| abducție cu costuri | Peirce; Hobbs și colab. 1993 | costul = locul sursei în ordinea surselor |
| inducție locală | anti-unificare (Plotkin 1970); ILP | mărginită la câteva exemple din sesiune |
| deducție mărginită | Datalog, înlănțuire înainte | adâncime 2, cu buget |
| cererea ca stare | information state update (Larsson, Traum 2000); GUS (Bobrow 1977) | cererea este o lume cu aceleași mecanisme ca oricare |
| înțelegere sprijinită pe o lume mică | SHRDLU (Winograd 1972) | lumea e declarată, nu programată; mai multe domenii |
| revizuire cu schimbare minimă | AGM (1985) | pe cheile de constrângere ale cererii |
| vederea stării | vederi actualizabile; lentile (Foster și colab. 2007) | într-un sens: unealta scrie, vederea citește |
| proveniență | semi-inele de proveniență (Green și colab. 2007) | folosită direct în răspuns |
| răspuns din date | Reiter și Dale 2000; Grice 1975 | din diferența de stare |
| teste din declarații | QuickCheck (Claessen, Hughes 2000) | generate din capabilități |
| scheme de unelte | apelare de funcții, MCP | argumentele le alege un mecanism explicabil, nu un model |

Referințele sunt date din memorie, cu autor și an; înainte de publicare în documentația bibliotecii trebuie verificate una câte una față de `docs/literature.md`.

---

## Întrebări deschise pentru proprietar

1. **Numele firelor de unealtă**: `std.tool.op / param / bind / arg` — sau le vrei în familia `std.schema.*`, lângă `honours`?
2. **Cheile de constrângere ca fire**: ești de acord ca lista fixă din bibliotecă să devină declarabilă?
3. **Cât de mult are voie o „constrângere specială” în cod** (§41 punctul 3)? Propun: doar funcții pure, fără acces la cerere, declarate cu nume.
4. **Exemplul purtat în documentația finală**: raftul, sau unul dintre domeniile reale?
