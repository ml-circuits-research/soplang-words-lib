> **Notă, 16 noiembrie 2026.** Acest plan este mai vechi decât `refactoring/sop-worlds-schimbari.md`, care este planul de lucru valabil. Unde diferă (avatarul printre domenii, limba citită din fiecare mesaj, trimiterile la lecțiile vechiului curs), acest document nu mai este valabil. Vezi regula R75 din `books/sop-worlds-teorie.md`.

# Plan de generalizare: bibliotecă, date, domenii

*Propunere a revizorului, 16 noiembrie 2026, pentru aprobarea proprietarului. Nimic din fazele 1–4 nu pornește fără aprobare. Faza 0 este numai măsurare și poate porni imediat.*

## 1. Principiul

Toate scăpările găsite azi sunt aceeași greșeală: **o declarație a fost scrisă pe lucrul particular în loc să fie scrisă pe conceptul cel mai general care o face adevărată.** De aceea fiecare caz nou a cerut un rând nou, iar rândurile noi au fost, de fapt, petice.

Regula planului: **fiecare declarație stă pe cel mai general concept pentru care este adevărată și se moștenește în jos. O lume particulară declară numai ce are ea diferit.**

Urmarea practică: un caz nou nu mai are voie să ceară un rând nou despre acel caz. Ori este acoperit de ce există mai sus, ori lipsește o afirmație generală, care se adaugă sus și trebuie să rezolve și alte cazuri, din alte domenii.

## 2. Ce se păstrează și ce se reface

| Parte | Hotărâre propusă |
|---|---|
| nucleul limbajului (fire, tipuri, sloturi, reguli, lume, copie, anulare, rezolvitor) | Se păstrează. Nu aici sunt scăpările. |
| stratul de cerere, dialog, plan, răspuns din bibliotecă | Se reface peste stratul general de mai jos. Aici sunt cheile fixe, rândurile pe caz și mecanismele adăugate câte unul. |
| bazele de cunoaștere și tiparele publicate | Se revizuiesc toate: fiecare fapt urcat la conceptul cel mai general, fiecare slot legat de un rol general. |
| declarațiile domeniilor din aplicație | Se micșorează: rămân felurile proprii, uneltele, legăturile și excepțiile. |
| traducerea din română | Este o problemă separată și rămâne pe drumul ei (traducerea browserului, modelul, regulile, alegere după citire). Planul acesta nu o rezolvă. |

## 3. Stratul general: șapte piese, fiecare răspunde unei scăpări

Stratul general este un set mic de tipare publicate, în engleză, pe care le citesc toate mecanismele și toate domeniile.

| Piesă | Ce conține și ce scăpare închide |
|---|---|
| A. Roluri și relații | Lucrul asupra căruia se acționează; loc, cu relațiile pe, în, lângă, deasupra, sub, între; sursă și țintă a unei mutări; timp; cantitate; însușire; parte–întreg; posesor; mod; cauză; scop; subiect; instrument. Fiecare slot al fiecărui tipar declară ce rol realizează. Închide: „Which shelf?”, „pe lac”, „over water”. |
| B. Acte generale | Fiecare act definit o singură dată: ce roluri are, ce trebuie să fie adevărat înainte, ce este adevărat după. Actele compuse decurg din cele simple: „pune X pe Y” când X nu există este „fă X” și apoi „așază X pe Y”. Închide: „pune un copil pe leagăn”. |
| C. Însușiri cu ordine | Orice însușire sau cantitate care are o ordine (mărime, lungime, număr, înălțime, poziție pe o direcție) primește același mecanism de pas: mai mult, mai puțin, cel mai. Închide: „upper”, „mai sus”, „more”, „longer” adăugate separat. |
| D. Spațiu general | Regiuni (sus, jos, stânga, dreapta, centru, colț), direcții, relații între lucruri. Fiecare domeniu își leagă regiunile de acestea. Închide: „over water” devenit „the sea”, „down” care mută la stânga. |
| E. Feluri de lucruri, într-un singur arbore | O rață este o pasăre, un bunic este un om. Ce nu are o realizare proprie (un desen, o formă) o ia de la strămoșul cel mai apropiat și își păstrează felul spus de om. Părțile unui lucru vin din același arbore. Închide: rața devenită pasăre, „nu am desen pentru bunic”. |
| F. Feluri de întreguri | Scenă, diagramă, text, față, listă. Ce este obișnuit (câte părți, ce așezare) se scrie aici și se moștenește; un întreg particular declară doar excepția. Închide: scrisoarea cu cinci capitole, un rând de așteptare pentru fiecare lucru. |
| G. Fraze generale de răspuns | Pentru fiecare act, o singură propoziție-cadru, completată cu rolurile care s-au schimbat. Cuvintele rolurilor și ale relațiilor vin din lumea limbii. Închide: zecile de rânduri de răspuns pe situație, „to the down”, „Am presupus iaz pentru țintă”. |

La acestea se adaugă o regulă de aplicație, nu de bibliotecă: **domeniul care răspunde este cel care poate îndeplini cererea**, ales din capabilități, nu cel deschis pe ecran.

## 3a. O singură lume a legendelor (propunerea proprietarului)

Cele șapte piese nu trebuie să fie șapte tipare separate. Proprietarul a propus forma potrivită: **o singură lume de tip tipar, „lumea legendelor”, care definește conceptele abstracte, iar orice tip de fir și orice slot din orice altă lume se leagă de un concept din ea.**

| Întrebare | Răspuns |
|---|---|
| Avem așa ceva? | Nu ca un întreg. Avem bucăți nelegate: `k.kinds` (arborele felurilor), `k.attributes` (însușiri, cu ce fel de valoare țin), `k.space`, `k.parts`, `k.values`, `k.units`, `k.actions`. În aplicație fiecare domeniu are un fișier de legendă, dar el descrie numai domeniul acela și nu trimite la nimic general. |
| Ce lipsește | Conceptul de rol și de relație; legătura obligatorie de la fiecare slot la un concept; un singur loc din care citesc toate mecanismele. |
| Ce conține lumea legendelor | Fel de lucru; însușire, cu spațiul ei de valori și, dacă are, ordinea; relație, cu cele două capete; rol; act, cu ce cere și ce produce; întreg și parte; cantitate și unitate; loc și regiune; timp; eveniment. Piesele A–G din secțiunea 3 sunt capitolele ei. |
| Cum se leagă celelalte lumi | Fiecare `core.type` spune ce concept este; fiecare `core.slot` spune ce concept realizează. Un slot fără concept este refuzat la verificare. |
| Cât de mare | Hotărârea proprietarului: pornește de la început cu toate conceptele generale, de la general spre particular, ca să nu le mai învățăm pe parcurs. Sunt puține fiindcă sunt foarte abstracte: lista este în cursul SOP Worlds, lecția 28 (șase grupe). Dacă lista crește mult, înseamnă că am coborât prea jos. |
| Cu ce seamănă | Ontologiile de nivel înalt (DOLCE, SUMO, BFO), schema.org, rolurile tematice. Deosebirea: aici mecanismele chiar o citesc la fiecare cerere. |

## 4. Fazele

| Fază | Ce se face și ce iese |
|---|---|
| 0. Măsurare (azi) | Verificările pe cele trei sesiuni ale proprietarului sunt rescrise să afirme intenția; numărul rezultat este punctul de pornire. Se face un inventar: câte declarații particulare există în fiecare clasă (rânduri de răspuns, rânduri „desenat ca”, așteptări pe lucru, tabele de regiuni, texte de întrebare, efecte pe unealtă, indicii pe comparativ). Aceste numere trebuie să scadă. |
| 1. Proiectul stratului general | O pagină pentru fiecare dintre piesele A–G: lista conceptelor, forma firelor, cum declară o lume o excepție. Scrise de bibliotecă, citite de revizor, aprobate de proprietar înainte de orice program. Se verifică pe hârtie pe trei domenii diferite: desen, documente, calendar. |
| 2. Biblioteca | Stratul de cerere, plan și răspuns citește numai stratul general: roluri în loc de chei fixe; rezolvare prin moștenire pentru capabilități, realizări, așteptări și cuvinte; un singur mecanism de pas; răspunsul generat din act, roluri și diferența de stare; fragmentele completează roluri deschise. Mecanismele vechi pe caz se șterg, nu rămân ca rezervă. |
| 3. Datele | În paralel cu faza 2. Fiecare bază de cunoaștere și fiecare tipar publicat este revizuit: sloturile primesc roluri; faptele urcă la conceptul cel mai general; se declară felul cunoașterii (fapt, normă, valoare obișnuită, euristică); dublurile dispar. |
| 4. Domeniile | Desen, diagrame, documente, avatar se rescriu peste stratul nou. Rândurile locale adăugate în ultimele zile se șterg. Se măsoară cât a rămas în fiecare domeniu. |
| 5. Proba | Un domeniu nou, calendarul, făcut numai din stratul general, felurile lui și uneltele lui. Întrebările, fragmentele, comparativele și răspunsurile trebuie să meargă fără niciun rând nou din clasele inventariate. |

Durata nu o pot promite. Estimarea mea, cu cele două sesiuni de lucru: faza 1 una până la două zile; fazele 2 și 3 între trei și cinci zile; faza 4 două până la trei zile. În acest timp aplicația nu va arăta mai bine în fiecare zi; va arăta mai bine la sfârșitul fazei 4.

## 5. Cum știm că nu ne păcălim din nou

| Regulă sau măsură | Ce împiedică |
|---|---|
| Un rând al cărui subiect este un lucru sau o propoziție particulară este refuzat automat, dacă un strămoș îl putea purta. | Peticul scris ca declarație. |
| Orice reparație numește afirmația generală pe care o adaugă și arată trei alte cazuri, din domenii diferite, pe care le rezolvă. | Reparația pe un singur caz. |
| Sesiunile proprietarului nu sunt folosite la scrierea rândurilor; sunt numai măsură. Verificările lor afirmă intenția și ce nu are voie să se schimbe. | Potrivirea pe test. |
| Numerele inventarului din faza 0 trebuie să scadă: rândurile de răspuns spre numărul de acte, rândurile „desenat ca” spre zero. | Creșterea ascunsă a cazurilor. |
| Trei numere pe sesiunile proprietarului: corecte, refuzuri cu motiv, greșite. Greșitele rămân la zero. | „Am făcut” fals. |
| Proba cu domeniul nou și cu propoziții ținute deoparte. | Generalitate numai pe ce am văzut deja. |
| Revizorul citește, la fiecare livrare, nivelul la care este scrisă fiecare declarație. | Scăparea de azi. |

## 6. Riscuri, spuse direct

| Risc | Ce facem |
|---|---|
| O regulă generală este greșită pentru un caz particular. | Excepția se declară jos, cu motiv, și se numără. Multe excepții la aceeași regulă arată că regula este pusă prea sus. |
| Câteva zile fără îmbunătățiri vizibile. | Trei reparații generale rămân în lucru și în acest timp: „am făcut” fals (făcut), avatarul și cererile între domenii, detectarea limbii pe mesaj. |
| Lista de concepte coboară în detalii. | Conceptele rămân foarte abstracte; un concept nou trebuie să fie adevărat pentru orice domeniu, nu pentru unul. |
| Traducerea rămâne slabă și ascunde câștigul. | Se măsoară separat sesiunea în engleză și cea în română. |

## 7. Ce are de hotărât proprietarul

| Hotărâre | Propunerea mea |
|---|---|
| Oprim lucrul pe cazuri până la sfârșitul fazei 1? | Da, în afara celor trei reparații generale din tabelul de riscuri. |
| Cât refacem din bibliotecă? | Stratul de cerere, dialog, plan și răspuns. Nucleul rămâne. |
| Cine aprobă lista de roluri, acte și feluri de întreguri? | Proprietarul, pe câte o pagină pentru fiecare piesă, înainte de program. |
| Domeniul de probă | Calendarul: are timp, resurse și conflicte, deci folosește alte roluri decât desenul. |

## 8. Hotărâri primite (16 noiembrie, 10:16)

| Subiect | Hotărâre |
|---|---|
| lucrul pe cazuri | Se oprește. Întâi se curăță și se generalizează abordarea. |
| cât se reface din bibliotecă | Nehotărât. Explicația straturilor și a celor două variante este în curs, lecția 30. |
| lista de concepte | Toate conceptele generale de la început, foarte abstracte; de la general spre particular întotdeauna. |
| domeniul de probă | Calendarul, ca domeniu nou al aplicației. |
