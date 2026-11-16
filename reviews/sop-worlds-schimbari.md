# SOP Worlds: schimbările necesare

*Anexă la „SOP Worlds: teoria” (`sop-worlds-teorie.md`), 16 noiembrie 2026. Teoria descrie starea dorită. Acest document spune, pe fiecare zonă de cod și de date, ce există azi și ce trebuie schimbat ca să se ajungă acolo. Este scris ca să poată fi citit și revizuit de mână de proprietar, apoi dat la lucru sesiunilor.*

*Numerele vin din trei surse, numite la fiecare tabel: numărătoarea mea în depozite, inventarul făcut de sesiunea aplicației (jurnalul ei din 16 noiembrie, „Audit of every world for generality”) și jurnalele bibliotecii. Unde nu am verificat eu, scrie.*

---

## 1. Cum se citește

Fiecare secțiune are aceeași formă: **ce este azi**, **ce devine**, **ce se șterge**, **cum se verifică**. Schimbările sunt grupate pe cinci zone: lumea legendelor (nouă), biblioteca, bazele de cunoaștere, aplicația, documentația și skill-urile. La sfârșit sunt ordinea de lucru, punctele în care proprietarul aprobă și ce a rămas de hotărât.

Trei reguli sunt valabile peste tot.

| Regulă | Ce înseamnă în practică |
|---|---|
| de la general la particular | Întâi se scrie conceptul în lumea legendelor, apoi mecanismul care îl citește, apoi datele, apoi domeniile. Niciodată invers. |
| nimic nu rămâne ca rezervă | Când un mecanism nou îl înlocuiește pe unul vechi, cel vechi se șterge în aceeași livrare. Două mecanisme pentru același lucru sunt o greșeală. |
| niciun rând pe caz | O declarație despre un lucru particular este refuzată dacă un strămoș al lui o putea purta. O reparație trebuie să arate alte cazuri, din alte domenii, pe care le rezolvă. |

---

## 2. Zona nouă: lumea legendelor

**Ce este azi.** Nu există ca întreg. Există bucăți nelegate în depozitul de cunoaștere: `k.kinds` (arborele felurilor), `k.attributes` (însușiri și ce fel de valoare țin), `k.space`, `k.parts`, `k.values`, `k.units`, `k.actions`, `k.time`. Niciun slot din vreo lume nu trimite la ele ca la un concept.

**Ce devine.** Un tipar publicat, `w.legend`, în engleză, cu aceste părți.

| Parte | Conținut |
|---|---|
| conceptele | Lista din teorie, lecția 9: lucru, fel, parte și întreg, grup și ordine, nume; însușire, spațiu conceptual, cantitate, stare; relație, loc, timp, apartenență, asemănare, dependență; schimbare, act, rol, mod, cauză și scop; afirmație și felul ei, siguranță și sursă, negație și cuprindere, condiție și limită, întrebare și răspuns; cel care acționează, capabilitate, unealtă și resursă. |
| spațiile | Tipurile `w.legend.space`, `w.legend.axis`, `w.legend.region`: axe numerice cu unitate și margini; regiuni cu centru și întindere; cuprinderea unei regiuni în alta. Pentru conceptele fără axe: graful de părți, ordine și constrângeri. |
| cuvintele de grad | `w.legend.degree`: cuvânt, direcție, factor de pornire. Numai în engleză aici; celelalte limbi le leagă prin lumea limbii lor. |
| actele | `w.legend.act`: cele patru schimbări de bază și actele generale, fiecare cu roluri, ce trebuie să fie adevărat înainte și ce este adevărat după. |
| locul și timpul | Regiunile generale (sus, jos, stânga, dreapta, centru, margine, colț), relațiile (pe, în, lângă, deasupra, sub, între), direcțiile; momentul, intervalul, durata, ordinea. Fiecare cu definiția ei numerică. |
| întrebările și cadrele de răspuns | Pentru fiecare concept, întrebarea generală („Where?”, „How big?”, „Which one?”). Pentru fiecare act, un cadru de propoziție. |
| legătura | Două chei noi pe declarațiile oricărei lumi: pe `core.type`, ce concept este; pe `core.slot`, ce concept realizează, cu precizarea lui (spațiu, relație, rol). |

**Cum se verifică.** O pagină de proiect, `reviews/legend-world-design.md`, cu firele scrise și cu câte un exemplu lucrat de mână din fiecare dintre cele patru domenii: o rață pusă pe un lac în desen, un flux fără cercuri în diagrame, o scrisoare scurtă și formală în documente, o ședință lungă cu Ana în calendar. Proprietarul o aprobă înainte de orice program.

**Ce este de hotărât aici.** Numele exacte ale tipurilor și cheilor (`is=`, `means=`, `space=` sunt propunerea mea). Ce rămâne discret ca excepție motivată (persoana și timpul verbului, da sau nu, starea unei cereri).

---

## 3. Biblioteca (soplang-words-lib)

Biblioteca are trei straturi (teoria, lecția 5 și următoarele descriu ce fac). Mai jos, pe fiecare.

### 3.1 Motorul limbajului

Fișierele motorului (citirea firelor, tipuri, sloturi, reguli, verificare, anulare, copie, rezolvitor) nu au greșelile găsite în sesiuni. Primesc precizări, nu o rescriere.

| Schimbare | Detaliu |
|---|---|
| chei noi pe tip și pe slot | `core.type` primește cheia conceptului; `core.slot` primește conceptul realizat și precizarea lui. Verificarea refuză un slot fără concept (întâi ca avertisment, apoi ca eroare). |
| câte valori și în ce ordine | Slotul declară una, mulțime sau listă ordonată. Azi există `many=true` fără ordine declarată. |
| trei rezultate ale verificării | Validă, nevalidă, nedeterminată, cu condiția de completitudine scrisă. Azi rezultatul este „fără încălcări găsite”. |
| lipsă, necunoscut, negație | O valoare absentă este necunoscută; o afirmație negativă are o formă a ei; o regulă căreia îi lipsește o valoare face verificarea nedeterminată. |
| fapt și model | Un fir care există ca fapt nu poate fi numit de o regulă: eroare la încărcare. |
| retragerea firelor deduse | Numai când nu mai au niciun temei; de verificat că așa este azi și de scris cu trei teste. |
| valori de tip punct | Un slot poate ține un punct într-un spațiu (mai multe numere, câte unul pe axă), pe lângă număr, text și referință. |

### 3.2 Modulele generale

| Schimbare | Detaliu |
|---|---|
| capabilitățile peste roluri | `std.schema.honours` numește roluri și însușiri din lumea legendelor, nu cuvinte dintr-o listă proprie. |
| descrierea uneltelor | `std.tool.param` spune spațiul parametrului, ce puncte poate realiza unealta și toleranța. Dispar `accepts=small accepts=big` și orice listă de cuvinte. |
| efectul | `std.tool.op` spune ce act realizează; efectul este al actului, din lumea legendelor. Dispare `effect=makes` scris pe unealtă. |
| realizarea prin moștenire | Un fel fără realizare proprie o ia de la strămoșul cel mai apropiat. Dispare `std.schema.drawn` ca rând pe fel. |
| un modul nou pentru spații | Distanță, cel mai apropiat punct, apartenență la o regiune, pas pe o axă, „între”, cuprindere; apropierea pe un graf de părți. Un singur loc, folosit de toate celelalte. |
| clasa de comparație | Un mecanism care, pentru un cuvânt de grad și un lucru, dă numărul: din instanță, din ce a făcut omul, din ce este obișnuit pentru fel, din spațiul disponibil. |

### 3.3 Stratul conversației

Aici se reface. Fișierele și constantele sunt cele din depozit, numărate de mine.

| Fișier sau constantă | Ce este azi și ce devine |
|---|---|
| `src/request.mjs` (1921 de linii) | Citirea cererii, planul, completarea. Se rescrie peste roluri și spații. |
| `REQUEST_KEYS` | Lista fixă de unsprezece chei (kind, count, size, extent, attribute, place, manner, layout, with, about, length). Dispare: cheile unei cerințe sunt conceptele lumii legendelor. |
| `VALUE_TYPES` | O tabelă scrisă în program care spune că o culoare se caută în două baze anume. Dispare: orice spațiu își are regiunile în cunoaștere. |
| treptele de mărime scrise în program | Lista tiny, small, default, big, huge. Dispare: cuvinte de grad cu factor, față de o clasă de comparație. |
| `REQUEST_SOURCES` | Ordinea surselor folosită și ca prioritate, și ca cost. Se desparte: sursă, caracter (cerință, preferință, presupunere), context, cost calculat. |
| `ASSUMED_MAX`, `ASSUMED_SAY` | Praguri despre câte presupuneri se spun. Devin date ale cadrelor de răspuns. |
| `src/revise.mjs` (522) | Reacțiile. Pasul devine un pas numeric pe o axă, același pentru orice însușire. Înlocuirea unei cerințe se face după identitatea ei. Fragmentele și corecțiile completează roluri. |
| `src/reason.mjs` (304), `REASONING` | Limitele (5 variante, adâncime 2, 3 exemple, 2 corecții) devin politici care se pot seta. Extinderea unei valori comune numără numai valori venite de la om și propune centrul lor. Costul folosește distanța în spații. |
| `KIND_FACTS`, `REASON_RULES` | Liste scrise în program cu tipurile de fapte și regulile de verificare. Devin declarații. |
| `src/plan.mjs` (451) | Planul devine o listă de schimbări de bază. Actele compuse decurg din condițiile actelor. Independența lucrurilor cerute împreună se verifică aici. |
| `src/tool.mjs` (705) | Legătura și execuția. Parametrii se umplu din roluri; efectul se verifică față de definiția actului; rezultatele execuției sunt cele cinci din teorie; starea observată se ține separat. |
| `WORLD_QUESTIONS`, `STATE_FEW` | Două feluri de întrebări despre lume, scrise ca listă, și un prag. Devin întrebările generale ale conceptelor. |
| `src/say.mjs` (165) | Răspunsul. Un cadru pe act, completat cu roluri; valorile se spun cu numele regiunii celei mai apropiate. Dispar rândurile pe situație. |
| `src/spell.mjs` (147) | Corectarea de cuvinte. Rămâne, cu regula structurală: nu se atinge un cuvânt pe care o sursă îl cunoaște. |
| indiciile lumii limbii (`w.lang.en`) | Câte un indiciu pentru fiecare comparativ și fiecare loc. Devin: cuvinte de grad, nume de regiuni, nume de relații, toate legate de concepte. |

**Ce se șterge din bibliotecă.** Toate rândurile de răspuns pe situație adăugate între versiunile 0.152 și 0.167; mecanismele separate pentru pasul de mărime, de lungime, de cantitate și de loc; listele de mai sus.

**Cum se verifică.** Testele motorului rămân și trebuie să treacă neschimbate. Pentru stratul nou: proprietăți pe roluri, pe exemple mici din cele patru domenii (desen, diagramă, document, calendar), nu pe lumi inventate; perechi minimale pentru citire; verificarea că un răspuns spune „am făcut” numai pentru o schimbare aflată în stare.

**Ce este de hotărât.** Varianta A (se reface stratul conversației, motorul rămâne cu precizările de la 3.1) sau varianta B (se reface tot). Recomandarea mea este A; motivele sunt în secțiunea 9.

---

## 4. Bazele de cunoaștere și tiparele publicate (sop-knowledge-worlds)

Numărătoarea mea, pe versiunea fixată de aplicație: **336 de sloturi cu liste închise de cuvinte, în 40 de lumi**. Cele mai multe: `w.lang.en` 95, `w.lang.ro` 41, `k.attributes` 16, `k.values` 11, `w.dialogue` 10, `k.genres` 9; `k.motion`, `k.layouts`, `k.faces`, `k.diagrams` câte 8.

### 4.1 Pe clase

| Clasă | Exemple de azi și ce devine |
|---|---|
| cuvinte de grad ținute ca valori | Mărimea unui corp ceresc „small, medium, large, huge”; vârsta „baby, child, adult, old”; greutatea „light, medium, heavy”; tonul unei culori; întinderea unui desen. Devin numere pe o axă; cuvintele devin regiuni sau cuvinte de grad. |
| aceleași unsprezece culori scrise ca listă în cel puțin patru scheme | În `k.attributes` de două ori, în `k.values`, în `k.colours`. Baza de culori are deja o valoare pentru fiecare culoare. Devin un singur spațiu al culorilor, cu regiuni; nicăieri o listă. |
| forme și înfățișări ca etichete | Forma feței „round, oval, long, square, heart”; părul „curly, straight, wavy”; forma „flat, solid, line”. Devin trăsături pe axe. |
| poziții și direcții ca etichete | „left, centre, right”; „up, down”; axele de direcție. Devin regiuni și vectori în spațiul general al locului. |
| domeniile aplicației enumerate în cunoaștere | `k.expect` are o listă „diagram, drawing, document, chart, list, map, face, music”. Se șterge: cunoașterea nu știe ce domenii are o aplicație. |
| cheile cererii ca listă | `w.request` enumeră cele unsprezece chei. Devine: o cerință numește un concept. |
| categoriile mari de lucruri scrise ca listă | „animal, food, plant, person…” în `k.kinds` și în `k.attributes`. Devin noduri ale arborelui felurilor. |
| sisteme formale discrete | Persoana și timpul verbului, da sau nu; cele mai multe din `w.lang.*`. Rămân, ca excepții motivate una câte una. |

### 4.2 Pe baze

| Bază | Ce se schimbă |
|---|---|
| `k.kinds` | Devine singurul arbore al felurilor; `k.objects`, `k.animals`, `k.people`, `k.food` atârnă de el. Categoriile de sus nu mai sunt o listă. |
| `k.colours` | Fiecare culoare primește coordonate pe axele spațiului (din valoarea pe care o are deja); familiile devin regiuni care cuprind alte regiuni. |
| `k.attributes`, `k.values` | Fiecare însușire își declară spațiul; listele de valori dispar; ce rămâne sunt nume de regiuni. |
| `k.space`, `k.time` | Devin capitolele „loc” și „timp” ale lumii legendelor sau se leagă direct de ele; relațiile primesc definiții numerice. |
| `k.parts`, `k.layouts`, `k.genres`, `k.diagrams`, `k.scenes` | Devin grafurile de părți, ordine și constrângeri ale conceptelor fără axe. Ce este obișnuit se scrie pe felul cel mai general (orice text, orice scenă, orice diagramă) și se moștenește. |
| `k.expect` | Valorile obișnuite devin regiuni pe axe, puse pe feluri generale; rândurile pe un lucru anume rămân numai ca excepții. Treptele de mărime ca valori dispar; factorii rămân, ca factori ai cuvintelor de grad. |
| `k.actions` | Verbele devin nume ale actelor din lumea legendelor. |
| `k.faces`, `k.people`, `k.shapes` | Etichetele de formă, mărime, lungime, vârstă devin puncte și regiuni. |
| `w.request`, `w.dialogue` | Cererea și dialogul se rescriu peste concepte: roluri, identitatea cerinței, focus, întrebare deschisă. |
| `w.lang.en`, `w.lang.ro` | Indiciile pe comparativ și pe loc devin cuvinte de grad, nume de regiuni și de relații. Categoriile gramaticale rămân. Cadrele de răspuns pe act înlocuiesc rândurile pe situație; pentru română se scriu numai cadrele și formele cuvintelor. |
| toate bazele | Fiecare rând își declară felul (fapt de domeniu, normă, valoare obișnuită, euristică) și contextul. |

**De unde vin coordonatele.** Unde există o sursă cu licență potrivită (valorile de culoare există deja), se folosesc; altfel se scriu de mână, puține, cu verificare. Regula licențelor rămâne: fără surse cu restricții de folosire.

**Cum se verifică.** Numărul de sloturi cu liste închise scade de la 336 spre numărul excepțiilor motivate. Verificatorul depozitului refuză un slot fără concept și o listă de cuvinte fără motiv declarat.

---

## 5. Aplicația (PSys2)

Numerele din această secțiune sunt din inventarul sesiunii aplicației, din 16 noiembrie; nu le-am renumărat eu.

### 5.1 Domeniile declarate

| Ce se numără | Desen, diagrame, documente, avatar |
|---|---|
| rânduri „X desenat ca Y” | 7, 1, 0, 4. Dispar: realizarea vine prin moștenire. |
| așteptări scrise pe un întreg, o parte sau o valoare anume | Desen 8, 13 și 3; diagrame 3, 3 și 4; documente 4, 5 și 3; avatar 0, 1 și 0. Urcă pe felurile generale, în cunoaștere. |
| feluri declarate unul câte unul | 25, 11, 5, 1. Rămân numai întregurile proprii domeniului; restul vin din arborele felurilor. |
| valori în liste, în sloturi | 24, 30, 0, 0. Dispar: puncte în spații. |
| valori în liste, în parametrii uneltelor | 24, 36, 0, 10. Dispar: puncte pe care unealta le poate realiza, cu toleranță. |
| tabele de regiuni, direcții și relații | 23, 10, 0, 5, plus poziții scrise în programul de desen (orizontul, culoarea solului, locul soarelui). Dispar: spațiul general al locului; domeniul își leagă numai regiunile proprii. |

### 5.2 Punctul de intrare al mesajelor și restul aplicației

| Ce este azi | Ce devine |
|---|---|
| Rânduri locale de răspuns și de indicii ținute în aplicație: 84 în engleză (64 de răspuns), 55 în română (45 de răspuns). | Se șterg. Răspunsul vine din cadrele actelor; româna are numai cadrele și formele cuvintelor. |
| Opt piese provizorii marcate în punctul de intrare. | Se șterg odată cu stratul nou al bibliotecii. |
| Domeniul care răspunde este cel deschis. | Se alege din capabilități; cartonașele și butoanele paginii sunt cereri ca oricare alta. |
| Pe un domeniu declarat, cititoarele vechi încă rulează după o citire nereușită, iar rezultatul lor este anulat. | Nu mai rulează deloc. |
| Tiparele vechi ale desenului, diagramelor și documentelor răspund încă atunci când este deschis alt domeniu (hartă, grafice, muzică). | Se șterg. |
| Tipare de propoziții care execută: desen 133, diagrame 49, documente 304, avatar 72, grafice 481, hartă 582, muzică 477. | Dispar pe măsură ce fiecare domeniu trece pe declarații; graficele, harta și muzica sunt încă în întregime pe drumul vechi. |
| Verificarea „am făcut” numără și contoarele de pași ca schimbare. | Numără numai conținutul stării. |
| Traducerea din română: reguli proprii (un fișier de 1791 de linii și un vocabular de 1329), cu un consum care a blocat o propoziție cu enumerare. | Rămâne o problemă separată. Hotărârea proprietarului: limba este cea aleasă în selector; se folosesc traducerea browserului când există, apoi modelul de pe dispozitiv, apoi regulile; se alege varianta pe care citirea o înțelege cel mai bine. Răspunsurile în română nu citează fragmente în engleză. |

### 5.3 Ce domenii rămân

Hotărârea proprietarului (16 noiembrie): aplicația are patru domenii — **desen, diagrame, documente, calendar** — și toată documentația dă exemple numai din ele.

| Domeniu | Ce se face |
|---|---|
| desen | Rămâne; se rescrie peste lumea legendelor (teoria, lecția 29). |
| diagrame | Rămâne; se rescrie (lecția 30). **Graficele intră aici**, ca fel de diagramă: nodurile sunt bare sau puncte, iar o cantitate a fiecăruia este pusă pe o axă a paginii. |
| documente | Rămâne; se rescrie (lecția 31). |
| calendar | Domeniu nou (lecția 32). Există un tipar publicat `w.calendar`; se rescrie peste concepte și primește unelte și o înfățișare pe pagină. Se face după ce lumea legendelor și stratul nou există. Este și proba: nu are voie să aducă niciun rând de răspuns, nicio întrebare, niciun indiciu, nicio listă de valori. |
| grafice (domeniu separat) | **Se elimină.** Cele 481 de tipare de propoziții și programul lui ies din aplicație; ce merită păstrat (desenarea barelor și a liniilor) devine unealtă a diagramelor. |
| muzică | **Se elimină deocamdată.** Cele 477 de tipare și programul lui ies din aplicație; tiparul din cunoaștere rămâne publicat, nefolosit. |
| hartă | Nehotărât. Este în întregime pe drumul vechi (582 de tipare). De hotărât: se elimină deocamdată, ca muzica, sau trece pe declarații după calendar. |
| avatar | Nehotărât ca loc în listă. Este deja pe declarații; proprietarul a cerut să meargă pe același drum ca restul. De hotărât dacă rămâne ca al cincilea domeniu sau ca parte a desenului (o față este un lucru desenat, cu părți). |

### 5.4 Sarcini de actualizare, ca listă de lucru

| Sarcină | Unde |
|---|---|
| Scoaterea domeniului de grafice: filă, tipare, program, teste, rânduri din jurnalul de teste vechi. | aplicație |
| Graficele ca fel de diagramă: grafurile lor în cunoaștere (grafic cu bare, cu linie), slotul de cantitate al nodului, unealta care așază barele pe o axă. | cunoaștere, aplicație |
| Scoaterea domeniului de muzică: filă, tipare, program, teste. | aplicație |
| Calendarul: tiparul rescris, uneltele (adaugă, mută, schimbă, șterge), vederea stării, înfățișarea pe pagină. | cunoaștere, aplicație |
| Exemplele și testele bibliotecii mutate de pe lumile inventate pe exemple mici din cele patru domenii. | bibliotecă |
| Sesiunile de măsură: rândurile despre grafice, muzică și hartă se scot din numărătoare sau se marchează „domeniu eliminat”. | aplicație |
| Hotărârea despre hartă și avatar, apoi sarcinile care decurg. | proprietar |

**Cum se verifică aplicația.** Cele trei sesiuni ale proprietarului, cu verificări care afirmă intenția. Punctul de pornire, din jurnalul aplicației: sesiunea din 16 noiembrie, 51 de replici, 11 corecte, 12 parțiale, 23 de refuzuri, 5 greșite; sesiunea în română din 15 noiembrie, 43 de replici, 8, 5, 26, 4; sesiunea în engleză, 16 replici, 7, 2, 5, 2. Greșitele trebuie să ajungă la zero; corectele trebuie să crească fără ca sesiunile să fie folosite la scrierea declarațiilor.

---

## 6. Documentația și skill-urile

| Ce | Schimbare |
|---|---|
| teoria | `reviews/sop-worlds-teorie.md` este sursa. După aprobare se traduce în engleză și se împarte în paginile documentației bibliotecii. |
| paginile bibliotecii | `glossary`, `kinds-of-worlds`, `language`, `reference`, `api`, `capabilities`, `host-contract`, `patterns`, `literature` se rescriu cu numele noi (tipar de lume, bază de cunoaștere, instanță de lume; schemă în loc de *matrix*) și cu lumea legendelor. O pagină nouă, `semantics`, închide hotărârile de limbaj de la 3.1. |
| exemplele din pagini | Fiecare exemplu rulează ca test. Exemplele sunt numai din cele patru domenii; lumile inventate de până acum (raftul, colierul) ies din documentație. |
| skill-urile | `author-live-world` devine „cum declari un domeniu”: sloturi legate de concepte, unelte, nimic altceva. `audit-knowledge` verifică nivelul de generalitate și listele de cuvinte. `propose-generic-method`, `consolidate`, `improve-world-from-failures`, `expand-and-test-case`, `learn-language-rules`, `learn-world-from-examples` se rescriu pe regula „de la general la particular”. Lista cazurilor nerezolvate se numește „register of unsupported cases”. |
| verificatorul automat al skill-urilor | Semnalează: un slot fără concept; o listă de cuvinte într-un slot sau într-un parametru; o declarație pe un fel particular când un strămoș o putea purta; un rând de răspuns pe situație; o constantă de program care ține cunoaștere. |
| documentele aplicației | Regulile ei de lucru și specificația punctului de intrare se aliniază la teorie; termenul „ușă” rămâne numai în cod. |

---

## 7. Teste și măsuri

| Măsură | De unde pornește și unde trebuie să ajungă |
|---|---|
| sesiunile proprietarului | Pornire: 11 din 51, 8 din 43, 7 din 16 corecte; 5, 4 și 2 greșite. Țintă: zero greșite, corecte în creștere. |
| sloturi cu liste închise în cunoaștere | 336, spre numărul excepțiilor motivate. |
| liste de valori în domeniile aplicației | Sloturi 54, parametri 70, spre zero. |
| rânduri locale de răspuns | 139 (84 și 55), spre zero. |
| rânduri „desenat ca” | 12, spre zero. |
| tipare de propoziții care execută | Peste două mii în șapte domenii, spre zero. |
| constante de program care țin cunoaștere, în bibliotecă | Cele din tabelul de la 3.3, spre zero. |
| costul unui domeniu nou, cu motorul înghețat | Calendarul: rânduri de declarații, linii de unelte, ore; niciun mecanism schimbat și niciun rând din clasele de mai sus. |
| domenii | De la șapte (desen, diagrame, documente, avatar, grafice, hartă, muzică) la patru, plus hotărârile despre hartă și avatar. |
| fidelitatea citirii | Un set de perechi minimale și de propoziții ținute deoparte, scris de mână, care nu se folosește la scrierea declarațiilor. |

---

## 8. Ordinea de lucru și punctele de aprobare

| Pas | Ce se face și cine aprobă |
|---|---|
| 0 | Măsurarea. Făcută: verificările strânse și inventarul. |
| 1 | Pagina de proiect a lumii legendelor, cu firele și cele patru exemple lucrate de mână. **Aprobă proprietarul.** |
| 2 | Hotărârile de limbaj de la 3.1, scrise într-o pagină. **Aprobă proprietarul**, odată cu alegerea între varianta A și B. |
| 3 | Lumea legendelor publicată; cheile noi pe tip și pe slot în motor; modulul spațiilor și clasa de comparație. |
| 4 | Stratul conversației rescris peste concepte, pe exemplele bibliotecii. Mecanismele vechi se șterg în aceeași livrare. |
| 5 | În paralel cu 4: bazele de cunoaștere, în ordinea `k.kinds`, `k.colours`, `k.space` și `k.time`, `k.expect`, `k.parts` și grafurile, apoi restul. |
| 6 | Cele patru domenii ale aplicației rescrise; rândurile locale și tiparele vechi șterse; alegerea domeniului din capabilități. **Proprietarul rulează o sesiune.** |
| 7 | Graficele mutate în diagrame; domeniile de grafice și de muzică scoase. Calendarul, ca domeniu nou și ca probă. **Proprietarul rulează o sesiune.** |
| 8 | Documentația și skill-urile, în engleză, din teorie. |

Durata nu o pot promite. Estimarea mea, cu cele două sesiuni de lucru: pașii 1 și 2, una până la două zile; pașii 3–5, între trei și cinci zile; pașii 6 și 7, două până la trei zile.

---

## 9. Ce a rămas de hotărât de către proprietar

| Hotărâre | Ce înseamnă fiecare variantă |
|---|---|
| cât se reface din bibliotecă | **Varianta A:** se reface stratul conversației și datele; motorul primește precizările de la 3.1. Testele motorului rămân valabile; se pierde numai ce era greșit ca abordare. **Varianta B:** se reface tot, inclusiv motorul. Se pierde un motor verificat fără un câștig pe care să-l pot arăta, fiindcă greșelile găsite nu sunt acolo; durează de câteva ori mai mult. Recomand A. |
| numele firelor lumii legendelor | `w.legend.*` cu cheile `is=`, `means=`, `space=`, `relation=`, `role=` sunt propunerea mea; biblioteca poate propune altele în pagina de proiect. |
| excepțiile discrete | Care liste închise rămân (gramatica, da sau nu, starea unei cereri) și cu ce motiv. Se hotărăște pe pagina de proiect. |
| învățarea factorilor | Unde se ține ce învață sistemul despre „mare” pentru un om și un fel de lume: numai în instanță, sau și în cunoașterea felului de lume. Propun: întâi în instanță; trecerea în cunoaștere, mai târziu, cu o regulă scrisă. |
| harta | Se elimină deocamdată, ca muzica, sau trece pe declarații după calendar. |
| avatarul | Rămâne al cincilea domeniu, sau devine parte a desenului. |
