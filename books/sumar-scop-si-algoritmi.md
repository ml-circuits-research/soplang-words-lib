# SOP Worlds pe scurt: scopul, algoritmii și pasul următor

*Sumar de lucru, 19 noiembrie 2026. Rezumă cartea [`sop-worlds-teorie.md`](sop-worlds-teorie.md), adică specificația (circa 4.000 de rânduri), ce algoritmi există azi în cod și ce trebuie făcut pentru nivelul următor. Termenii tehnici rămân în engleză acolo unde sunt nume din cod.*

---

## 1. Ce vrem să obținem

Vrem un asistent care rulează în browser, fără LLM. El înțelege cereri în limbaj natural pentru cinci editoare: **Drawing, Diagram (cu grafice), Documents, Calendar și Avatar**. Le execută corect, explică ce a făcut și poate anula.

Ideea centrală a proiectului:

> **Rețelele neuronale citesc, lumile SOP decid.** Un model mic (SOP-BERT) transformă textul în *fire* SOP Lang. Firele spun ce cere omul: acțiunea, ținta, proprietățile, relațiile, întrebarea. Mai departe, o **bibliotecă generică** folosește *lumile* SOP (schemă, cunoaștere, instanța curentă) ca să **compileze** aceste fire în apeluri concrete pe care uneltele le înțeleg direct: „mută `o2` la (270, 527)”.

Avem două obiective concrete:

1. **Date de antrenare sistematice.** Pentru fiecare funcție a fiecărui tab (orice operație, orice parametru, orice buton care trimite comenzi) generăm exemple de text verificate prin execuție reală. Pentru fiecare caz avem apoi 20–30 de formulări umane: echivalente, mai complexe sau mai simplificate. Variantele simplificate se bazează pe faptul că sistemul completează inteligent valorile lipsă din preferințele și constrângerile lumilor.
2. **Mai puțin JavaScript, mai multă cunoaștere.** Vrem să mutăm deciziile semantice (ce obiect, ce valoare implicită, ce operație) din codul aplicației în lumi SOP și în algoritmi generici din bibliotecă. Compilarea unei cereri trebuie să arate cât mai mult ca raționamentul unui sistem inteligent, nu ca un șir de `if`-uri pentru propoziții.

Criteriul de reușită: **un domeniu nou sau o regulă nouă se adaugă prin declarații, fără cod nou de interpretare în aplicație.**

---

## 2. Esența cărții în șase idei

**(1) Cererea nu este un apel.** O cerere poate lăsa nedeterminate ținta, valoarea sau metoda („pune o barcă pe lac”). Un apel executabil numește o operație declarată și are toate argumentele tipizate („`drawing.object.make kind=boat x=500 y=525`”). Între ele stă **compilarea**, care face partea grea: găsește obiectele, completează valorile, alege unealta și verifică constrângerile.

**(2) Patru feluri de lumi** (cap. 1.2, 5):
- **lumea-schemă** spune ce tipuri, chei și constrângeri există;
- **lumea de cunoaștere** conține fapte generale: o rață stă pe apă, o casă e mai mare decât un pește, „mic” înseamnă o regiune pe axa mărimii;
- **lumea-instanță** e starea curentă a unui editor: ce obiecte sunt pe pânză, care e în focus, istoria pentru Undo;
- **lumea de proiect** leagă instanțele de schemele, cunoașterea și uneltele pe care le folosesc.

**(3) Totul se scrie în SOP Lang** (cap. 2–3). Un fir are forma `@id tip cheie=valoare …`. Regulile (`core.rule`), interdicțiile (`core.deny`), calculele și declarațiile de unelte sunt și ele fire. Aplicația dă bibliotecii fire și primește fire înapoi. Nu există un API JavaScript paralel pentru semantică.

**(4) Legenda și spațiile conceptuale** (cap. 4). Conceptele generale (culoare, mărime, poziție, timp) sunt *spații* cu axe, metrici și regiuni. „Mic”, „în stânga sus” și „o ședință lungă” se interpretează ca regiuni într-un spațiu, raportate la o clasă de comparație. Astfel se evită tabelele de cuvinte scrise în cod.

**(5) Drumul unei cereri în opt etape** (cap. 6.2):

| # | Etapa | Ce face |
|---|---|---|
| 1 | Starea | citește faptele autoritare din instanță (cu versiune) |
| 2 | Citirea | transformă textul în graful cererii (SOP-BERT) |
| 3 | Contextul | stabilește dacă mesajul e cerere nouă, corecție („nu, celălalt”) sau răspuns |
| 4 | Cantitățile | interpretează „de două ori mai lat” sau „mare” și le aliniază la unități |
| 5 | Completarea | generează candidați pentru ce lipsește (poziție, mărime, culoare) |
| 6 | Elaborarea | rezolvă țintele, aplică valorile implicite, ordonează candidații, validează și produce circuitul de apeluri |
| 7 | Dispatch | execută apelurile și verifică efectul observat |
| 8 | Răspunsul | formulează răspunsul din efectele confirmate, nu din intenții |

**(6) Un catalog fix de operații generale** (cap. 6.8.2). Metodele declarate se compun din operații cu contract clar:
- `match` și `traverse` caută în fapte și în grafuri;
- `space` măsoară în spațiile conceptuale;
- `derive` aplică reguli, iar `validate` verifică constrângeri;
- `fork` încearcă o variantă izolat;
- `enumerate`, `rank` și `search` generează și ordonează candidați;
- `plan` compune acte declarate;
- `call`, `observe`, `compare` și `record` execută, observă și jurnalizează;
- `realise` produce textul răspunsului.

Un nume nou nu aduce putere de calcul nouă: dacă nu poate fi exprimat cu aceste operații, trebuie extinsă explicit biblioteca.

Exemplul-cheie din carte: o casă roșie și un pește roșu, cu peștele în focus. „Make it blue” alege peștele, pentru că o preferință de focus îl pune primul. La „no, the other one”, un criteriu strict exclude peștele. Rămâne casa, care preia cerința „albastru”. Peștele revine la roșu, iar Undo restaurează exact starea anterioară. Nimic din acest raționament nu e scris pentru propoziția respectivă: e o *alegere sub criterii declarate* (`std.choice.request` și `std.decide.criterion`).

---

## 3. Algoritmii care există azi

### 3.1 În bibliotecă (sopworld 0.224, `src/`)

Punctul de intrare este **`World.compileRequest(sop)`** (`src/request-compiler.mjs`). Primește fire, le verifică (rădăcină unică, tipuri închise `std.request.*`, fără variabile libere, surse legate) și le trimite metodei potrivite:

| Metodă | Fișier | Ce face, pe scurt |
|---|---|---|
| **Rule circuit** | `rule-circuit.mjs` | Introduce cererea într-o copie izolată a lumii (`fork`), lasă regulile declarate să deducă apelurile și întoarce circuitul ordonat împreună cu dovezile. Este algoritmul de bază: *deducție pe fire*. |
| **Capability** | `capability-method.mjs` (587 rânduri) | Potrivește cererea cu operațiile declarate ale uneltelor (`std.capability.operation`, `.parameter`): tip de obiect, parametri obligatorii, enumerări, valori implicite condiționate de argumente. Este *unificare între graful cererii și interfețele uneltelor*. |
| **Choice** | `choice-method.mjs` + `rank.mjs` | Alege între candidați după criterii declarate (focus, ordine, cost), cu criterii stricte și preferințe, și păstrează motivul pentru care un candidat a pierdut. |
| **Placement** | `placement-method.mjs` + `objective.mjs` | Plasare dreptunghiulară mărginită: relații direcționale, ancore (apa lacului), evitarea suprapunerii, cu o funcție-obiectiv declarată de lume. |
| **Knowledge projection** | `knowledge-projection.mjs` | Citește din catalogul de cunoaștere exact rândurile cerute de un profil declarat (de exemplu `place=water` pentru barcă). |
| **Interpretation** | `interpretation-method.mjs` | Compilează mai multe interpretări ale aceleiași cereri pe aceeași stare și le compară. |
| **Tool input** | `tool-input-compiler.mjs` | Proiectează apelurile compilate în instrucțiunea exactă a fiecărei unelte, validată contra schemei ei de apel. |

În jurul lor există mecanisme vechi, mai generale ca idee, dar folosite puțin de aplicația actuală: cititorul pe gramatică, `readRequest` și `planRequest`, motorul de acte `std.acts`, planificatorul `plan.mjs` pe metode din `k.procedures`, compunerea de texte și diagrame. Biblioteca are 24.000 de rânduri foarte dense, cu 275 de funcții exportate. Aplicația folosește în jur de 20 dintre ele.

### 3.2 În aplicație (PSys2)

- **SOP-BERT** (cap. 10.5) are două modele DistilBERT. **Cutter-ul** taie mesajul în cereri (etichete B/I/O pe tokeni). **Key reader-ul** găsește pentru fiecare cerere span-urile fiecărei chei (tip, culoare, mărime, nume…) și le clasifică în bănci de valori declarate. Rezultatul este un graf de cerere cu dovezi de sursă (poziții exacte în text).
- **Politicile SOP ale aplicației** sunt în `worlds/app.project/*.sop`: admiterea cititorului, rutarea cererii, referințele, crearea, interogarea, istoria și valorile implicite de scenă. Ele decid deja multe lucruri declarativ.
- **Adaptoarele** (`src/dialog/project-*-action.mjs`) transformă citirea în cerere SOP și o trimit la compilator. Apoi `declared-execution.mjs` apelează unealta, iar `history-journal.mjs` jurnalizează pentru Undo.

### 3.3 Ce funcționează și ce nu

Verificat în browser:
- creare numărată („three circles and two squares”) cu Undo;
- „draw a man”;
- întrebări de număr și de existență înainte și după ștergeri;
- recolorare cu corecția „no, the other one”;
- barca plasată pe lac, chiar după ce lacul a fost mutat.

Încă deschis:
- cutter-ul vede „draw a circle and a square” ca o singură cerere, iar key reader-ul are o singură țintă per cerere;
- uneori substantivul se pierde într-o întrebare de existență;
- plasarea relativă funcționează doar pentru un obiect față de o singură ancoră;
- nu există cereri înlănțuite între editoare (calendar → grafic → document);
- nu se învață preferințe;
- modelul livrat e marcat `trained-unverified`: nu a fost calibrat după noua politică de admitere.

### 3.4 Unde e încă semantică în JavaScript (exemple reale)

- **Alegerea cuvântului corectat este în aplicație.** `project-query-action.mjs:104` are o limită fixă de cost de editare (2). Din cauza ei, la „man” candidatul semantic *person* e eliminat înainte de alegere și rămân *moon* și *sun*. La „cap”, alegerea între *cat* și *car* depinde de ordinea de enumerare.
- **Tabele de cuvinte și de scenă** în `worlds/art.draw/engine.mjs`: `KIND_WORDS`, `WHO_PRESET`, un regex pentru apă/mare/ocean, rețete de scenă aleatoare. Și în `scene.mjs`: `KIND_ORDER`.
- **Starea Drawing, Diagram și Documents e încă ținută în JavaScript**; Avatar și Calendar au trecut pe SOP.
- **Volum**:
  - `src/dialog` are 16.000 de rânduri;
  - fișierele `.mjs` din `worlds/` au 30.000 de rânduri;
  - restul sistemului vechi, încă livrat: `src/formalizer` (5.700 de rânduri), `src/translate` (8.500 de rânduri), plus modelele dispecer și normalizator.

---

## 4. Algoritmii generici care cred că ne lipsesc

Comparația cu un LLM e instructivă. Un LLM face *implicit* ce trebuie să facem noi *explicit*: știe că barca stă pe apă, înțelege „it”, descompune „fă un grafic cu ședințele pe zile și pune-l în raport”. Fiecare dintre aceste abilități corespunde unui mecanism general pe care îl putem declara.

**A. Ancorarea lexicală ca abducție ponderată (*weighted abduction*).** Un cuvânt („man”, „cap”, „houses”) primește candidați din mai multe surse: identitate exactă, lemă sau plural, relație semantică din cunoaștere (*man* este un fel de *person*), corectură ortografică. Fiecare sursă are un cost declarat într-o politică SOP. Biblioteca păstrează **toate** ipotezele plauzibile, le ordonează și **păstrează egalitățile** în loc să le rezolve după ordinea de enumerare. Se alege cea mai bună *în contextul instanței* (există un obiect de acel fel? unealta îl poate face?). Un singur mecanism înlocuiește logica duplicată din adaptoarele de creare și de interogare.

**B. Compilarea ca satisfacere de constrângeri pe un graf tipizat.** Graful cererii (act, ținte, constrângeri) se unifică cu declarațiile operațiilor. Parametrii obligatorii lipsă devin *variabile*. Domeniile lor vin din schemă, iar valorile candidate vin din cunoaștere și din instanță. Soluția se caută cu `enumerate`, `validate` și `rank` pe o copie izolată. Capability, placement și choice sunt deja bucăți din acest algoritm; lipsește bucla comună care le pune împreună pentru orice parametru, nu doar pentru poziție.

**C. Completarea pe niveluri de autoritate.** Cerință explicită > corecție recentă > preferință învățată (pe utilizator și instanță) > valoare implicită din cunoaștere (barca pe apă, soarele sus) > valoare implicită a uneltei. Pentru cuvintele de grad („mic”, „în stânga sus”, „lung”) se folosesc **regiuni prototip în spații conceptuale**, raportate la clasa de comparație („o casă mică” nu are aceeași mărime ca „un munte mic”). Așa se pot antrena exemplele *simplificate*: textul spune mai puțin, iar lumea completează previzibil.

**D. Referința ca alegere sub criterii, extinsă la mulțimi.** Avem deja alegerea între candidați pentru „it” și „the other one”. Extensia: cuantificatori („toate casele roșii”), ordinale („a doua”), relaționale („cel de lângă lac”), cu populație completă sau incompletă declarată explicit.

**E. Planificare ierarhică și flux de date între unelte (HTN, *hierarchical task network*).** Metodele din `k.procedures` (scop → pași, precondiții, efecte) descompun cererile compuse. Ieșirea tipizată a unui apel (lista de ședințe) se leagă la parametrul compatibil al apelului următor (seriile graficului), după tip, nu după nume. Undo cuprinde tot grupul. Acesta e mecanismul pentru „calendar → grafic → document”.

**F. Ipoteze ordonate în locul refuzului.** Conform deciziei tale din Review 29, sistemul acționează pe cea mai bună ipoteză și spune într-un rând ce a presupus („I took *it* as the red house”). Alternativele rămân în jurnal, astfel încât „no, the other one” să le poată folosi. Admiterea folosește încrederea reală a modelului, cu prag de eroare 5% (1% pentru acțiunile distructive).

**G. Datele de antrenare generate din aceleași declarații.** Aceleași declarații de unelte care conduc compilatorul generează sistematic și datele, în patru pași:
1. **Enumerarea combinațiilor.** Pentru fiecare operație × submulțime de parametri × valori (combinare pe perechi, *pairwise*), plus fiecare buton sau gest din UI, se construiește un caz.
2. **Verificarea prin execuție.** Cazul se execută pe unealta reală, cu un fixture.
3. **Formularea canonică.** Se produce textul canonic cu șabloanele din `w.lang.en`.
4. **Formulările umane.** Agenți de autorat produc 20–30 de formulări umane. Validarea e mecanică: fiecare valoare citită trebuie să apară exact în text, iar valorile omise devin *cerințe de completare* (ce ar trebui să pună lumea), nu etichete inventate.

Astfel, când o unealtă câștigă o capabilitate nouă, datele o urmează automat.

---

## 5. Ce trebuie făcut pentru nivelul următor

Lista e în ordinea în care aș lucra. Fiecare pas se încheie cu o rulare reală (antrenare, browser, măsurare), nu doar cu cod.

1. **Generatorul sistematic de date (obiectivul 1).** Pornim de la `training/sop-bert/data/ui-natural-v1`, care are deja 124 de declarații și 1.175 de rețete executate, dar doar 2–3 formulări per operație, rigide. Adăugăm:
   - enumerarea pe perechi a parametrilor și a butoanelor neacoperite (25 de operații lipsesc);
   - 20–30 de parafraze umane per caz, în trei niveluri: echivalente, complexe, simplificate;
   - validarea span-urilor și eliminarea duplicatelor și a etichetelor contradictorii din haiku-v1/v2;
   - un **set de evaluare independent**, scris și verificat de om, de circa 300 de replici pe cele cinci taburi.
2. **Reantrenare și calibrare o singură dată**, pe datele curate. Admiterea se calibrează pe rândurile CAL. Raportăm acoperirea și eroarea pe clasă × zonă. Modelul real intră în gate, cu un set mic de cazuri cunoscute ca problematice.
3. **Graful citirii suportă mai multe ținte.** Key reader-ul trebuie să poată produce mai multe ținte sub același act („a tree and a house”) și o ancoră relațională separată („near the house”). Fără asta, niciun volum de date nu repară coordonarea.
4. **Ancorarea lexicală trece în bibliotecă** (algoritmul A), ca politică SOP. Se elimină limita fixă de cost și enumerarea din adaptoare. Contraexemplele „man”, „cap” și „houses” devin teste în ambele ordini.
5. **Tabelele de cuvinte și de scenă trec în cunoaștere.** `KIND_WORDS`, `WHO_PRESET`, regexul pentru apă și `KIND_ORDER` se mută în `k.objects`, `k.scenes`, `k.people`. Starea Drawing, Diagram și Documents trece pe instanțe SOP, cum s-a făcut la Calendar și Avatar.
6. **Bucla generală de completare** (algoritmii B și C) pentru orice parametru obligatoriu, cu nivelurile de autoritate și regiunile prototip. Prima verificare: exemplele simplificate din pasul 1 trebuie să producă valorile așteptate.
7. **Fluxul de date între unelte** (algoritmul E): primul caz complet este calendar → grupare pe zile → grafic → document, cu un singur Undo.
8. **Curățenie și documentație.** Scoatem sistemul vechi: modelele dispecer și normalizator, `src/formalizer`, `src/translate`, testele nerulate, cititorul pe gramatică din bibliotecă. Rescriem README-urile după starea reală, cu un singur document „drumul unei cereri”. Validăm catalogul cu aceeași versiune de bibliotecă pe care o folosește aplicația.

**Cum măsurăm progresul:** câte rânduri de JavaScript cu decizii semantice dispar; câte cazuri din setul independent trec cap-coadă în browser (efect corect pe pânză, nu doar citire corectă); câte comportamente se schimbă modificând doar o declarație SOP.
