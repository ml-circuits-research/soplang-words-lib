# SOP Worlds: schimbările necesare

*Anexă la „SOP Worlds: teoria” (`books/sop-worlds-teorie.md`), 16 noiembrie 2026. Teoria descrie starea dorită. Acest document spune, pe fiecare zonă de cod și de date, ce există azi și ce trebuie schimbat ca să se ajungă acolo. Este scris ca să poată fi citit și revizuit de mână de proprietar, apoi dat la lucru sesiunilor.*

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

Motorul limbajului intră în refacerea completă acolo unde contractele o cer. Inventarul de mai jos arată punctele cunoscute, fără să limiteze schimbările necesare.

| Schimbare | Detaliu |
|---|---|
| chei noi pe tip și pe slot | `core.type` primește cheia conceptului; `core.slot` primește conceptul realizat și precizarea lui. Verificarea refuză un slot fără concept (întâi ca avertisment, apoi ca eroare). |
| câte valori și în ce ordine | Slotul declară una, mulțime sau listă ordonată. Azi există `many=true` fără ordine declarată. |
| trei rezultate ale verificării | Validă, nevalidă, nedeterminată, cu condiția de completitudine scrisă. Azi rezultatul este „fără încălcări găsite”. |
| lipsă, necunoscut, negație | O valoare absentă este necunoscută; o afirmație negativă are o formă a ei; o regulă căreia îi lipsește o valoare face verificarea nedeterminată. |
| fapt și model | Un fir care există ca fapt nu poate fi numit de o regulă: eroare la încărcare. |
| retragerea firelor deduse | Numai când nu mai au niciun temei; de verificat că așa este azi și de scris cu trei teste. |
| valori de tip punct | Alegerea din carte §2.2.2: `kind=point`, acces prin axă (`at.x`), egalitate canonică și versiunea spațiului păstrată. Migrarea remapează ordinea axelor; nu reinterpretează datele vechi. JSON rămâne disponibil. |

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

**Amploare decisă.** Refacere completă, inclusiv motorul unde proiectul o cere. Conservarea unei implementări nu poate limita contractul conceptual; probele de comportament rămân necesare.

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
| harta | Se scoate din demo. |
| avatarul | Fața intră în desen ca lucru cu părți; nu este domeniu separat. |

### 5.4 Sarcini de actualizare, ca listă de lucru

| Sarcină | Unde |
|---|---|
| Scoaterea domeniului de grafice: filă, tipare, program, teste, rânduri din jurnalul de teste vechi. | aplicație |
| Graficele ca fel de diagramă: grafurile lor în cunoaștere (grafic cu bare, cu linie), slotul de cantitate al nodului, unealta care așază barele pe o axă. | cunoaștere, aplicație |
| Scoaterea domeniului de muzică: filă, tipare, program, teste. | aplicație |
| Calendarul: tiparul rescris, uneltele (adaugă, mută, schimbă, șterge), vederea stării, înfățișarea pe pagină. | cunoaștere, aplicație |
| Exemplele și testele bibliotecii mutate de pe lumile inventate pe exemple mici din cele patru domenii. | bibliotecă |
| Sesiunile de măsură: rândurile despre grafice, muzică și hartă se scot din numărătoare sau se marchează „domeniu eliminat”. | aplicație |
| Eliminarea hărții din demo și integrarea feței în desen, conform deciziei primite. | proprietar |

**Cum se verifică aplicația.** Cele trei sesiuni ale proprietarului, cu verificări care afirmă intenția. Punctul de pornire, din jurnalul aplicației: sesiunea din 16 noiembrie, 51 de replici, 11 corecte, 12 parțiale, 23 de refuzuri, 5 greșite; sesiunea în română din 15 noiembrie, 43 de replici, 8, 5, 26, 4; sesiunea în engleză, 16 replici, 7, 2, 5, 2. Greșitele trebuie să ajungă la zero; corectele trebuie să crească fără ca sesiunile să fie folosite la scrierea declarațiilor.

---

## 6. Documentația și skill-urile

| Ce | Schimbare |
|---|---|
| teoria | `books/sop-worlds-teorie.md` este sursa. După aprobare se traduce în engleză și se împarte în paginile documentației bibliotecii. |
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
| 2 | Contractele de limbaj și de execuție sunt scrise și revizuite. Proprietarul aprobă proiectul înainte de implementare; amploarea refacerii complete este deja decisă. |
| 3 | Lumea legendelor publicată; cheile noi pe tip și pe slot în motor; modulul spațiilor și clasa de comparație. |
| 4 | Stratul conversației rescris peste concepte, pe exemplele bibliotecii. Mecanismele vechi se șterg în aceeași livrare. |
| 5 | În paralel cu 4: bazele de cunoaștere, în ordinea `k.kinds`, `k.colours`, `k.space` și `k.time`, `k.expect`, `k.parts` și grafurile, apoi restul. |
| 6 | Cele patru domenii ale aplicației rescrise; rândurile locale și tiparele vechi șterse; alegerea domeniului din capabilități. **Proprietarul rulează o sesiune.** |
| 7 | Graficele mutate în diagrame; domeniile de grafice și de muzică scoase. Calendarul, ca domeniu nou și ca probă. **Proprietarul rulează o sesiune.** |
| 8 | Documentația și skill-urile, în engleză, din teorie. |

Durata nu o pot promite. Estimarea mea, cu cele două sesiuni de lucru: pașii 1 și 2, una până la două zile; pașii 3–5, între trei și cinci zile; pașii 6 și 7, două până la trei zile.

---

## 9. Decizii de amploare și alegeri tehnice

| Hotărâre | Ce înseamnă fiecare variantă |
|---|---|
| amploarea refacerii | Decis: refacere completă, inclusiv motorul unde proiectul o cere. |
| numele firelor lumii legendelor | `w.legend.*` cu cheile `is=`, `means=`, `space=`, `relation=`, `role=` sunt propunerea mea; biblioteca poate propune altele în pagina de proiect. |
| excepțiile discrete | Care liste închise rămân (gramatica, da sau nu, starea unei cereri) și cu ce motiv. Se hotărăște pe pagina de proiect. |
| învățarea factorilor | Unde se ține ce învață sistemul despre „mare” pentru un om și un fel de lume: numai în instanță, sau și în cunoașterea felului de lume. Propun: întâi în instanță; trecerea în cunoaștere, mai târziu, cu o regulă scrisă. |
| harta | Se scoate din demo. |
| avatarul | Fața intră în desen ca lucru cu părți; nu este domeniu separat. |


## 10. Predarea redactării și poarta de proiectare (versiunea cărții 14)

La cererea proprietarului, sesiunea worker redactează cartea și aceste planuri; sesiunea de control le face review. Feedbackul este cerut prin `questions.md`, secțiunea Book. Implementarea refactoringului nu este încă autorizată.

Înainte de pasul 3 din secțiunea 8 se închid următoarele livrabile. Capitolul 8 al cărții este prima explicație a contractelor, nu o dovadă că sunt deja implementate.

| Livrabil | Referință și dovada cerută la review |
|---|---|
| Spații și operații | 6.8.2 și 8.2, B24: catalogul operațiilor generale, schema completă, unități, metrică și operație nesuportată. |
| Organizarea proiectului | 2.6 și R6: manifest, rădăcini de import, fișiere ale aceluiași modul, namespace-uri de instanțe și sublumi explicite. Probe de mutare fără schimbarea identității, copie independentă cu remapare și dependențe externe explicite, coliziuni de nume/case refuzate, referință activă lipsă, destinație unică la salvare și import ciclic; formatul manifestului trebuie definit înainte de implementare. |
| Reguli și interpretare | 2.2–2.5, 3.4–3.5 și 8.3, B25–B26: condiții și efecte structurate; traseu text–valori–referințe–regulă, cu erori localizate. |
| Acces la cunoaștere | 8.4, B27–B28: dependențe directe și inverse, ciclu, fragment de bază lipsă, completitudine și invalidare. |
| Motoare | 8.5, B29–B30: două motoare, rezultate distincte, verificare comună și buget epuizat. |
| Cerere și răspuns | 6.3, R71: cererea în concepte, cu identitatea fiecărei cerințe, și formele generale de răspuns. |
| Justificare persistentă | 6.11: schemă de jurnal interogabilă, intrări istorice versionate, legătura răspuns–cerere, întrebări ulterioare și anulare fără pierderea evidenței. Verificarea trebuie să distingă istoricul de faptele curente folosite la planificare. |
| Observarea uneltei | R70, 8.6: identități, versiune, conținut observat, efect necunoscut și eșec verificabil. |
| Refolosire | 8.6, B31–B33: identități păstrate între domenii, exemplu numeric complet, eșec și recuperare. |
| Migrarea stării | B22: format vechi și nou, păstrarea identității, incompatibilitate detectată și recuperare fără pierderea originalului. |
| Acceptarea aplicației | 7: cele trei sesiuni ale proprietarului, cu numitor fix și rezultate corect / parțial / refuz justificat / greșit. Ținta este zero greșite, fără a ascunde cazurile eliminate. Aceasta este poarta finală a implementării; la proiectare se aprobă verificările intenției, nu se pretinde că rezultatul viitor este deja măsurat. |

Autorul redactează fiecare contract, reviewerul îl verifică prin contraexemple. Proprietarul aprobă proiectul înainte de implementare. Deciziile tehnice mici se închid între autor și reviewer conform protocolului din worker-tasks; nu cer o aprobare separată a proprietarului.

Ordinea este contract semantic, reprezentare, exemple manuale și review, apoi implementare după aprobare. Scăderea numărului de constante sau de rânduri nu înlocuiește aceste probe.


## 11. Deciziile de control integrate în versiunea 16

Blocul de control 00:15 fixează refacerea completă, calendarul cu recurență, eliminarea hărții din demo și fața ca parte a desenului. Secțiunile istorice care descriu codul existent sunt inventare, nu limite pentru proiect.

Cerința nouă de acceptare este R80 și secțiunea 6.11: fiecare răspuns poate fi explicat printr-o urmă care numește datele, declarațiile, calculele și observațiile reale. Implementarea trebuie să păstreze urma de la interpretare până la execuție și răspuns. Reviewerul verifică dacă explicația citează concepte și reguli generale sau ascunde un caz particular. Explicația completează testele intenției; nu le înlocuiește.

Pentru recurență se proiectează seria, identitatea aparițiilor, excepțiile, fusul orar, editarea unei apariții versus a seriei și verificarea conflictelor pe un interval explicit. Pentru uneltele demo, anularea verificabilă este parte obligatorie a contractului.


## 12. Contractul de redactare, acceptare și migrare

Materialul de mai jos a fost mutat din fostul §8.20 al cărții: descrie procesul proiectului și criteriile de acceptare, nu semantica limbajului. Identificatorii R73–R81 se păstrează aici pentru compatibilitatea trimiterilor. Cerința tehnică a justificării răspunsurilor rămâne explicată în carte, §§6.11 și 6.10.1.

**R73. Cartea spune ce trebuie să facă tehnologia.** Unde cartea și programul de astăzi spun lucruri diferite, câștigă cartea, iar diferența se trece în registrul book-migration-register.md. Capitolele 2 și 3 descriu ce există și ce rămâne valabil; unde propunerea schimbă ceva din ele, schimbarea este marcată pe loc.

**R74. Patru feluri de enunțuri.** O regulă numerotată din acest capitol este o cerință. Un exemplu ilustrează și nu adaugă cerințe. O regulă marcată (de confirmat) este o alegere de politică, valabilă până când proprietarul spune altfel. Un rând din registrul book-migration-register.md este o hotărâre care încă nu s-a luat.

**R75. Care plan este valabil.** Planul de lucru este `refactoring/sop-worlds-schimbari.md`. `refactoring/plan-generalizare.md` este mai vechi; unde cele două diferă (avatarul printre domenii, limba citită din fiecare mesaj, trimiterile la lecții), nu mai este valabil. După ce proprietarul corectează planul de lucru, fiecare sarcină din el va numi regulile de aici pe care le îndeplinește.

**R76. Trei stări diferite, care nu se amestecă.** Claritatea: cartea se poate citi și înțelege; o judecă proprietarul și sesiunea bibliotecii. Aprobarea: proprietarul este de acord cu ce spune. Conformitatea: programul face ce spune cartea; o arată testele. Un test care trece astăzi nu dovedește că o regulă a cărții este cea dorită.

**R77. Cartea este gata** când fiecare termen este definit înainte de a fi folosit, fără cerc; fiecare regulă are un exemplu și un contraexemplu; fiecare exemplu își spune dependențele; fiecare alegere nehotărâtă este în registrul book-migration-register.md; și fiecare sarcină din plan numește o regulă aprobată.

**R78. Ce teste rămân și ce teste se schimbă.** Testele bibliotecii care verifică regulile din capitolele 2 și 3 rămân neschimbate. Cele atinse de propuneri (punctul ca valoare, al treilea rezultat al verificării, `means` obligatoriu, `none`) se schimbă cu bună știință și sunt enumerate în plan înainte de a fi atinse.

**R79. Numărătoarea nu își schimbă numitorul.** Mesajele din sesiunile omului care țin de domeniile scoase (grafice ca domeniu, muzică) rămân în numărătoare, într-o coloană separată, pentru ca procentele să nu crească prin scoaterea de cazuri.

**R80. Dovada cerută este explicația textuală verificabilă.** Pentru fiecare răspuns se poate urmări ce a spus omul, ce declarații generale și fapte au fost folosite, ce calcule au rezultat și ce s-a observat. Secțiunea 6.11 fixează contractul. Nu există un al cincilea domeniu de probă. O explicație nu demonstrează singură generalitatea: ea face vizibile dependențele pentru ca reviewerul să poată detecta o regulă scrisă pentru un caz particular. Testele intenției și contraexemplele verifică în continuare comportamentul.

**R81. Trecerea.** Drumul vechi de citire rămâne în aplicație până când drumul nou are, pe aceleași sesiuni, cel puțin tot atâtea mesaje corecte și niciunul greșit. Fiecare depozit își fixează versiunile celorlalte două; versiunile se mută numai împreună, cu testele celor trei trecute.


## 13. Indexul regulilor tehnice

Identificatorii sunt păstrați în carte ca etichete discrete după explicație. Acest index servește urmăririi implementării; nu înlocuiește textul sau exemplele.

| Regulă | Locul explicației în carte |
|---|---|
| R1 — Valoarea punctului | §2.2.1 |
| R2 — Ordinea axelor | §2.2.1 |
| R3 — Egalitatea punctelor | §2.2.1 |
| R4 — Dimensiunea punctului | §2.2.1 |
| R5 — Ordinea valorilor unui slot | §2.2.1 |
| R6 — Identitatea persistentă | §2.4.1 |
| R7 — Rezolvarea referințelor | §2.4.1 |
| R8 — Integritatea legăturilor | §2.4.1 |
| R9 — Stările unei valori | §3.9.1 |
| R10 — Potrivirea în prezența lipsei | §3.9.1 |
| R11 — Negația asupra stării curente | §3.9.1 |
| R12 — Răspunsul existențial | §3.9.1 |
| R13 — Domeniul verificării | §3.9.1 |
| R14 — Validarea nedeterminată | §3.9.1 |
| R15 — Tipurile metamodelului | §4.8.1 |
| R16 — Ordinea straturilor | §4.8.1 |
| R17 — Specializarea conceptelor | §4.8.1 |
| R18 — Normalizarea axelor | §4.4.1 |
| R19 — Distanța circulară | §4.4.1 |
| R20 — Metrica spațiului | §4.4.1 |
| R21 — Axele libere ale regiunii | §4.4.1 |
| R22 — Apartenența la regiune | §4.4.1 |
| R23 — Suprapunerea și numirea | §4.4.1 |
| R24 — Includerea regiunilor | §4.4.1 |
| R25 — Egalitatea distanțelor | §4.4.1 |
| R26 — Structura grafului | §4.4.2 |
| R27 — Comparația structurală | §4.4.2 |
| R28 — Conceptul fără descriere | §4.4.2 |
| R29 — Referința comparației | §4.5.1 |
| R30 — Scări de raport și de interval | §4.5.1 |
| R31 — Pasul comparativ | §4.5.1 |
| R32 — Limitele realizării | §4.5.1 |
| R33 — Adaptarea factorului | §4.5.1 |
| R34 — Persistența preferinței | §4.5.1 |
| R35 — Condițiile actului | §4.6.1 |
| R36 — Limitele efectului | §4.6.1 |
| R37 — Crearea referentului lipsă | §4.6.1 |
| R38 — Compunerea actelor | §4.6.1 |
| R39 — Terminarea descompunerii | §4.6.1 |
| R40 — Părintele semantic | §5.2.1 |
| R41 — Precedența specializării | §5.2.1 |
| R42 — Restrângerea validă | §5.2.1 |
| R43 — Informația specifică | §5.2.1 |
| R44 — Reperul spațial | §4.4.3 |
| R45 — Testarea relațiilor | §4.4.3 |
| R46 — Momente și intervale | §4.4.3 |
| R47 — Ore locale ambigue | §4.4.3 |
| R48 — Serii recurente | §4.4.3 |
| R49 — Rolul afirmației | §3.6.1 |
| R50 — Interdicțiile tari | §3.6.1 |
| R51 — Interpretările candidate | §6.3.1 |
| R52 — Filtrarea interpretărilor | §6.3.1 |
| R53 — Conținutul neinterpretat | §6.3.1 |
| R54 — Contextul clarificării | §6.3.1 |
| R55 — Permisiunea aproximării | §6.5.1 |
| R56 — Toleranța numerică | §6.5.1 |
| R57 — Alegerea domeniului | §6.1.1 |
| R58 — Citirea între lumi | §6.1.1 |
| R59 — Actualizarea rezultatului | §6.1.1 |
| R60 — Independența operațiilor | §6.9.1 |
| R61 — Revalidarea planului | §6.9.1 |
| R62 — Recuperarea pașilor | §6.9.1 |
| R63 — Eșecul recuperării | §6.9.1 |
| R64 — Contractul anulării | §6.9.1 |
| R65 — Gruparea corectărilor | §6.9.2 |
| R66 — Ordinea între domenii | §6.9.2 |
| R67 — Limita funcției specializate | §6.8.1 |
| R68 — Verificarea compunerii | §6.8.1 |
| R69 — Condiția deja îndeplinită | §6.10.1 |
| R70 — Efectul confirmat | §6.10.1 |
| R71 — Clasele de răspuns | §6.10.1 |
| R72 — Dependențele exemplului | §7.4.1 |


## 14. Verificarea pe mesajele proprietarului

Reviewerul deține replay-urile: [sesiunea din 16 noiembrie](../reviews/replay-owner-2026-11-16.md) și [sesiunile anterioare](../reviews/replay-owner-2026-11-14-15.md). Acestea sunt audituri pe hârtie, nu rezultate ale implementării. Autorul dezvoltă mecanismele generale lipsă în capitolele relevante, fără să introducă mesajele de test în carte. Ordinea de lucru este cererea ca fire (carte §6.3.2), catalogul închis al operațiilor generale, apoi domeniul desen declarat complet. Lacunele A–V rămân deschise până la verificarea textului revizuit; orice temă nouă trebuie justificată de replay.

Contractul propus din carte §6.8.2 delimitează operațiile generale de funcțiile gazdei. Implementarea viitoare trebuie să verifice fiecare contract (intrări, rezultat, eșec, buget și efecte); simpla existență a unui apel cu nume asemănător nu demonstrează conformitatea. F6 este trimis la review; domeniul desen declarat complet rămâne următorul livrabil.

Direcția transmisă la afad461 adaugă un capitol API: fiecare apel existent se verifică în `docs/api.md` și în surse, apoi se explică prin scop, argumente, rezultat și exemplu cu rezultat verificat; API-ul conversațional propus trebuie marcat separat. Nucleul lucrează în engleză, iar traducerea rămâne în aplicație. Reducerea lacunelor la mecanisme comune se verifică împotriva replay-urilor, păstrând separat autorizarea, constrângerile tari, efectele și dovezile; nu este încă o concluzie de conformitate.

Pentru reducerea mecanismelor, cartea propune rezolvarea filtrată (§6.4.1), schimbarea felului cu identitate păstrată (§4.6.2), recompletarea (§6.7.1), accesul la jurnal (§6.11.1) și cunoașterea locală (§6.6.1). Nu se declară acoperire completă: regiunile ca întindere și straturile, schema completă a descrierii, realizarea desenului și capitolul API rămân livrabile distincte. Review-ul trebuie să verifice în special diferența dintre selecție și autorizarea unui efect.

Capitolul 9 explică acum API-urile nucleului prin exemple executate și delimitează conversația existentă de contractul conceptual propus. Familiile specializate din referința API rămân de dezvoltat pedagogic; lista apelurilor din catalogul conceptual (§6.8.2) nu se confundă cu metodele JavaScript.

Review-ul 26fa72c identifică patru livrabile esențiale încă deschise: cititorul englez și construcțiile lui (E1), pachetul minim de cunoaștere și proveniența lui (E2), stabilirea și verificarea parametrilor numerici (E3), compunerea răspunsului din dovezi (E4). Capitolul API arată mecanisme disponibile, nu rezolvarea acestor lipsuri.

E1 are acum contractul cititorului în §§10.1–10.4. Înainte de implementare trebuie închise gramatica livrată și compunerea semantică, exhaustivitatea analizelor candidate și schema nodurilor logice pentru întinderea cuantificatorilor. Un model poate propune doar candidate; validitatea în lume nu este dovadă a intenției. Experimentul anterior Q50 nu autorizează activarea lui și nu se reia în această etapă.

Review 10 acceptă F51, F6 și limitele generalizării. Replay-ul nou `reviews/replay-new-examples-calendar-documents.md` adaugă W–BB: mod de cerere fără execuție, modificări relative explicite și ancore, relații cu măsură, proiecții între lumi, însușiri agregate și „same as”, respectiv compunere bazată pe texte sursă. Acestea rămân deschise, fără operații noi presupuse în catalog.

E2 este propus în capitolul 11: pachetul minim închis pe dependențe, surse, responsabilități și un buget ilustrativ de redactare. Inventarul efectiv trebuie măsurat înainte de migrare; nu se echivalează numărul firelor grafice cu acoperirea relațiilor semantice. Repo-ul de cunoaștere rămâne nemodificat în această etapă.

E3 este propus în capitolul 12: proveniența parametrilor, normalizare, toleranțe, costuri și verificarea stabilității. F52 și F54 au fost acceptate în review 12 prin exemplul corectat din 8.2; calibrarea empirică și legarea completă a țintelor rămân verificări ale implementării viitoare.

E4 este propus în capitolul 13: afirmații cu dovezi, plan de răspuns, grupare, selecție și realizare în engleză. Verificările de sens și acoperire preced evaluarea stilului; implementarea trebuie să păstreze maparea text–afirmație–dovadă. Nodurile logice ale cererii, cititorul învățat cu prag de acceptare și declarația completă a desenului rămân în lista deschisă.

F57 are o propunere în §10.3.1: graf logic al cererii, rădăcină, legare locală, predicate despre efecte și evaluare cu informație incompletă. Implementarea trebuie să probeze separat schema grafului, semantica cuantificatorilor și autorizarea efectului; adevărul unei interdicții nu introduce singur un plan pozitiv.

F59–F61 sunt dezvoltate în capitolul 10: potrivire lexicală cu proveniență, intrare Message pentru fragmente/cadre și propunător învățat planificat cu poartă de acceptare. Evaluarea separă domeniile și familiile de formulări și verifică regresiile, nu doar câștigul agregat. Modul propus do/propose/check/ask separă conținutul de autorizarea efectului (W); implementarea trebuie să verifice că planificarea exploratorie nu execută unelte. Antrenarea și activarea nu sunt autorizate prin această descriere.

F64–F66 au propuneri concrete în §§11.3.2, 12.2.1–12.4.1 și 13.1.1: lanț de proveniență, parametri versionați, episod local și obiectiv pe priorități, respectiv răspunsuri fără execuție și fără negarea unui fapt necunoscut. Verificările viitoare trebuie să respingă neconcordanța dintre calibrare și axă, episoadele fără dovezi și afirmațiile de creare provenite doar din planuri. Inventarul F62 și auditul surselor F63 rămân deschise.

Review 13 acceptă F57, F59–F61, F64–F66 și W. Precizările sunt integrate în capitolul 10: comparație mesaj cu mesaj înaintea activării modelului, reparații cu schimbare de negație/cantitate cerând clarificare și cadre indirecte normale cu mod do. Contra-propunerea despre calendar separă modul de drepturile asupra resursei; existența altor participanți nu transformă singură o solicitare în check. Această distincție rămâne trimisă la review.

F62: §11.5 înlocuiește bugetul ipotetic cu inventarul măsurat la 2c94c3d8acb4. Raportul `knowledge-inventory.md` și scriptul `audit-knowledge-inventory.py` păstrează perimetrul publicat și candidații nominali. Migrarea trebuie să transforme fiecare candidat într-o legare de sens verificată și să completeze registrul de dependențe: cardinalități, sprijin, întinderi/straturi, diferențe vizibile și editabilitate. Numerele declarațiilor nu reprezintă acoperire funcțională; nu se pornește migrarea din acest audit.

F63: §11.3.1 identifică sursele concrete și maparea lor la familiile de cunoaștere. Înainte de import, se compară versiunea/artefactul, fișa sursei, transformarea și fragmentele efectiv publicate; notele istorice nu stabilesc singure starea curentă. Subseturile existente nu se echivalează cu seturile originale complete. Exemplul de proveniență este acum §11.3.2.

Review 14 acceptă inventarul F62 și separarea modului de permisiunile resursei. Pentru mod nerezolvat, §10.2 permite verificare fără efecte plus ofertă în același răspuns, numai cu acces de citire autorizat; mutarea nu este executată înaintea confirmării. Migrarea se concentrează pe sensuri, valori și roluri lipsă, nu pe volumul punctelor geometrice.

F53: convenția pentru nume SOP noi este precizată în §2.4 și aplicată exemplelor: point.value, embedded.drawing, source.snapshot, gap.observation și layout.candidate. Numele importate/persistente necesită mapare explicită dacă se schimbă; API-urile existente își păstrează ortografia reală. Aceasta este uniformizare editorială, nu autorizarea unei redenumiri în runtime.

F2/F10 în §8.3: exemplul executat fixează reprezentarea canonică existentă; metadatele semantice propuse adaugă identitate de instanță, legare la schema versionată, valori interpretate, referințe rezolvate și origine textuală. Implementarea viitoare trebuie să invalideze metadatele dependente de versiune și să păstreze distincția text/referință fără parsere concurente în consumatori.

X/Y: §4.4.4 propune cantități relative explicite, observație de referință versionată, ancoră și relații măsurate cu capete/unități. Validarea trebuie să distingă delta de factor, să refuze durate invalide și să păstreze cuantificarea întregului grup. Momentul unui reminder calculat nu devine automat dependență persistentă față de întâlnire. Contractul este trimis la review, fără implementare.

Review 15 acceptă F2/F10, F53, F63 și X/Y. F27 este completat în §8.6 prin ramuri de identitate ambiguă, creare, efect necunoscut și compensare, cu dovezile și răspunsurile aferente. F4 primește instrucțiunea concretă pentru integrator în §8.5. F19/F26/F28 și consolidarea textului rămân deschise; propunerea reviewerului de validare prin implementare așteaptă decizia proprietarului.

Controlul a publicat la fa29e00 cererea de implementare de sus în jos, cu faza 0 înaintea mecanismelor. Registrul [phase-zero-contracts.md](phase-zero-contracts.md) identifică familiile, probele și diferențele încă de reconciliat. Instrucțiunea programată curentă și AGENTS.md din workspace păstrează însă domeniul de lucru la carte; neconcordanța este consemnată în questions.md. Registrul este pregătire de contract, nu versiune publicată a bibliotecii. Anunțul implementării, când este permisă, se scrie în jurnal și plan; worker-tasks.md rămâne al reviewerului.

F28: §8.6 fixează proiecția exemplului ca instantaneu R58–R59, cu intrare temporară std.projection.input și proveniență locală source.snapshot. Nodul salvat nu păstrează o referință activă către calendar; agregarea pe participanți cere colecția completă și acoperirea ei. Tipul de intrare este propus, iar contractul general al proiecțiilor Z rămâne de închis.

F19/F26: §8.6 include acum sala rezolvată, calcule core.calc pentru capetele intervalelor și interdicții separate pentru persoană/sală, executate pe biblioteca actuală. complete=true se aplică instantaneului local complet citit, nu sursei externe permanent. Exemplul testează conflictele candidatului; schema integrală și operația gazdei rămân livrabile distincte.

Deciziile 1aeeaff sunt integrate în registrul fazei 0: patru schimbări de bază; înregistrări de jurnal distincte; proveniența importurilor inclusă; reviewerul retransmite versiunea publicată din jurnal/plan. Limita curentă la documentație rămâne până la actualizarea instrucțiunii directe sau a contextului programat, conform răspunsului reviewerului.

Consolidare editorială: fostele anexe C/D și secțiunea 8.7 sunt în [book-migration-register.md](book-migration-register.md). Cartea păstrează contractele lângă concepte, distincțiile existent/propus și exemplele; registrul păstrează migrarea, deciziile și verificările de livrare. R59/R64 sunt consemnate ca decizii, nu redeschise. Aceasta este o primă reducere pentru F20/F43, nu închiderea întregii revizii de repetiții.

Z: §6.1.2 definește selecția versionată, corespondențele de obiecte/valori/relații, agregarea pe identități distincte și proveniența fiecărui rezultat. Probe viitoare: etichete identice fără contopire, apariții recurente distincte, participanți comuni, selecție incompletă, grup zero cu univers explicit, coordonate cu cadru/scară și actualizare fără suprascriere tacită a editărilor manuale. Contractul este propus; formatul complet al modulului de proiecție și integrarea runtime nu sunt implementate.

AA: §4.4.5 definește însușiri agregate și operatorul propus same, cu std.request.value ca descriere a referinței, observație versionată separată și egalitate în spațiul conceptual. Probe necesare: dubluri, colecție vidă versus incompletă, egalități la maxim, conversie de unități, egalitatea paletelor versus incluziune, destinație incapabilă și dependență circulară. Integrarea evaluatorului și schema completă rămân propuse, fără schimbări runtime.

Review 16 (063ba6f) acceptă F19/F20/F26/F27/F28 și Z. §6.1.2 integrează identitatea apariției împreună cu seria, domeniul închis al agregării și confirmarea înaintea suprascrierii editărilor manuale, inclusiv ștergerea unui nod editat. Probe de implementare: grupare pe apariție versus serie; propunere explicit parțială fără pretenția de total; actualizare oprită înaintea unei suprascrieri neconfirmate. Întrebările acceptate sunt eliminate; F4, F43 și AA rămân deschise. Intrările anterioare descriu starea istorică, nu redeschid punctele acceptate.

Implementarea este autorizată direct de proprietar în toate depozitele, cu agenți paraleli și contracte comune coordonate de workerul principal. Prima bază publicată, 0.168.0, adaugă core.slot present=true pentru câmpuri structural obligatorii, cu respingere tranzacțională după deducție. required=true păstrează completarea deschisă. Aceasta nu este publicarea integrală a fazei 0; celelalte familii rămân urmărite în registru.

Incrementul 0.169.0 publică modulele structurale std.source, std.import, std.provenance și std.knowledge, încărcate prin core.use. Exemplul din §11.3.2 este verificat direct din carte; dependențele lipsă și ștergerea dovezilor referite sunt respinse. Rezolvarea conceptelor, verificarea adevărului și politica de licențe nu sunt deduse din simpla validare structurală. Restul fazei 0 rămâne deschis în registru; consumatorii nu trebuie să presupună existența tuturor familiilor.

Primele rezultate coordonate: biblioteca 0.168.0/0.169.0 este acceptată prin review 974160e; baza de cunoaștere publică inventarul de migrare și corecția canonică de vocabular în 47a77477; PSys2 publică adaptorul local de calendar în a0987918, cu observație, verificări de integritate și undo, fără legare conversațională. §7.4 consemnează capacitatea efectivă. Restul contractelor fazei 0 rămâne prioritar; nu se pretinde că toate familiile sau demo-ul sunt terminate.

Incrementul 0.170.0 publică std.objective și std.objective.term prin core.use world=std.objective, cu exemplul exact din §12.4.1 verificat și respingeri pentru câmpuri lipsă, ponderi/priorități invalide și referințe greșite. Termenii cu aceeași prioritate, contribuțiile explicit nule și identitatea membrilor sunt precizate. Aceasta validează structura; rezolvarea evaluatorilor și optimizarea nu sunt livrate de acest increment. Restul fazei 0 rămâne prioritar.

Incrementul 0.171.0 publică std.reference.set și std.reference.sample: observațiile egale cu identități distincte rămân distincte, referințele sunt tipizate, iar unitățile membrilor sunt verificate tranzacțional. Exemplul din §12.2.1 este testat direct. Versiunea este metadată, nu garanție de instantaneu imuabil; calibrarea rămâne de implementat. Review de76af8 acceptă propunerile pentru legendă și cere prioritate pentru legendă, legături semantice și graful cererii.

Incrementul 0.172.0 implementează actele și condițiile legendei, cu verificarea argumentelor și rolurilor fiecărui act care referă condiția. Exemplul din §4.6.1 este testat direct. Aceasta aplică prima decizie din review de76af8; spațiile, legăturile semantice și graful cererii rămân prioritare, fără a declara faza 0 completă.
