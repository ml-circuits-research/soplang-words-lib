# Raport de noapte, 20 noiembrie 2026

Separ ce a rulat efectiv (comis, testat, văzut în browser) de ce este doar pregătit. Toate commiturile sunt publicate.

## 1. Taburile ca interpretoare SOP (scopul 2)

| Tab | Stare | Dovezi |
|---|---|---|
| Avatar | pe arie SOP (de ieri) | browser |
| Calendar | pe arie SOP (de ieri), formular verificat | browser, „Saved · verified” |
| **Desen** | **pe arie SOP**: instanță `w.drawing`, regulile de acțiune generează apeluri `std.acts`, desenul e proiecția cu `k.objects` | `9381a3d4`, poarta verde; browser: „draw a red house / lake / boat / fish / cloud / sun” |
| **Diagramă** | **pe arie SOP**: instanță `w.diagram`; toate cele 28 de operații fie rulează, fie sunt refuzate explicit; layout pe niveluri și muchii ortogonale derivate în reguli SOP | `de0645ea`; testele ariei 7/7, testele migrate 95/95 |
| Documente | încă JavaScript | — |

- Codul JS vechi al Desenului și al Diagramei nu mai e folosit de taburi. Fișierele sunt încă pe disc, pentru că le importă câteva scripturi vechi; ștergerea lor e un pas separat.
- Un singur strat de plasare: regulile ariei hotărăsc. Politica veche de sloturi a aplicației a fost scoasă pentru Desen.

## 2. Plasarea inteligentă în Desen (cerința ta)

- **Mărimi din cunoaștere:** clasele de mărime din `k.scenes`. O casă iese mai mare decât o pisică.
- **Regiuni din cunoaștere:**
  - **Lacul și râul:** obiectele pe care `k.layouts` le pune în apă (barca, rața, peștele) ajung în apa lacului de pe pagină. Dacă pagina nu are apă, ajung jos pe pagină.
  - **Cerul și solul:** soarele, luna și norii merg pe cer; casele și copacii pe sol.
- **Fără suprapuneri:** obiectele noi nu se suprapun decât cu o conținere declarată (barca în lac, pasărea în coroana copacului). Când solul e plin, obiectele mai îndepărtate ies mai mici și mai sus.
- **Harness de review** (`scripts/review-drawing-placement.mjs`): de la 354 de verificări picate la **0, în toate cele 5 scene**. Capturile PNG sunt în `psys2/.cache/drawing-placement-review/`.
- **Relațiile** stânga, dreapta, deasupra, dedesubt, lângă, în și pe trec prin `std.placement`, cu aliniere declarată în SOP: un copac pus la stânga casei stă pe aceeași linie de sol.

## 3. Compilatorul cu Z3 (propunerea ta)

- **Librăria 0.226–0.230:**
  - `std.problem` este pasul de căutare, cu doi furnizori, unul intern și Z3. Fiecare soluție e verificată la citire înapoi.
  - Cererile cu mai multe relații devin o singură problemă.
  - Predicate noi: aliniere, „pe”, regiuni ale ancorei și micșorare ca să încapă.
  - Gradele de mărime („big”, „small”) folosesc factori din `k.expect.scale`.
- **Z3 în browser** (0.228.0), încărcat la prima problemă care are nevoie de el, din GitHub Pages-ul librăriei, cu fișiere versionate care rămân în cache.
  - **Fără izolare, Z3 nu rezolvă,** pentru că îi lipsesc firele de execuție. Atunci răspunde căutarea internă, iar rezultatul arată `provider=internal`.
  - **Cu izolare,** activată de service worker-ul demo-ului, Z3 se încarcă în 160–210 ms din cache. O rezolvare durează 7–50 ms.
- **Ce încă nu e verificat:** nicio tură reală de chat n-a folosit încă Z3, pentru că cititorul actual pierde relațiile (vezi secțiunea 6).

## 4. Datele de antrenare (scopul 1)

- **`psys2/official-dataset/`** este un singur folder auditabil, cu:
  - `train`, `dev` și `test`;
  - `README` cu câmpurile explicate;
  - `MANIFEST.json`, cu fiecare sursă: rânduri intrate, păstrate și eliminate, cu motive;
  - `STATS`, `VALIDATION`, `audit-sample.md` (100 de rânduri de citit de om) și `build.py`.
- **Sursele incluse:**
  - datasetul tău, revalidat și corectat. Etichetele de părți de avatar care nu există au fost înlocuite cu cuvinte omenești, iar traducerea cuvânt → slot e făcută de cunoaștere;
  - variantele din sesiunea paralelă;
  - `ui-natural`, `ui-human`, `ui-relations` (relații, lărgite și echilibrate);
  - **`ui-coverage-v2`** (vezi mai jos).
- **`ui-coverage-v2`:** inventarul e luat din interfețele care rulează acum: 112 operații, 280 de parametri și 26 de controale UI, grupate în **241 de cazuri.**
  - **Fiecare caz are acum cel puțin 20 de parafraze.** Înainte, 77 de cazuri aveau sub 20, iar 51 nu aveau niciuna.
  - **3.180 de rânduri:** 1.188 echivalente, 836 complexe, 1.156 simplificate. La cele simplificate, valorile omise devin cerințe de completare din preferințele și constrângerile lumilor, nu etichete inventate.
- **Corecturi de etichetare:**
  - descrierile definite („the house”) nu mai sunt etichetate ca nume;
  - comparativele sunt etichetate ca pași (`delta`);
  - rânduri care învață independența față de mesajul anterior.

## 5. Funcționarea demo-ului

- **Ancorarea în chat:** „draw a lake”, „draw a fish” și „draw a cloud” picau în chat.
  - **Cauza:** ancorarea trimitea toți cei 2.737 de candidați într-o singură cerere și depășea bugetul librăriei.
  - **Reparația:** loturi, cu același clasament final. O citire inutilizabilă e recitită singură, fără mesajul anterior, iar răspunsul spune asta.
- **Viteza:** turele au scăzut de la 2–5,5 s la 0,8–1,5 s.
  - **Cauza principală:** sampler-ul de sugestii din fundal bloca worker-ul.
  - **Alte costuri eliminate:** copiatul bindings-urilor la fiecare tură, verificarea tokenizer-ului, reconstrucția constructorilor, rulări de model repetate.
- **Comparativele:** „make the house bigger” mărește de la 100 la 140, cu factori din scala din catalog. Verificat cu citiri construite manual; depinde de noul cititor.

## 6. SOP-BERT

### Setul oficial (`psys2/official-dataset/`)

- **Dimensiuni:** train 41.870, dev 5.128, test 4.880 de mesaje, grupate în 23.299 de familii de parafraze. Nicio familie nu apare în două split-uri.
- **Pe taburi:** desen 23.053, diagramă 12.153, document 9.235, calendar 4.580, avatar 2.857.

**Ce a găsit revalidarea în datasetul tău (main-synthetic):**
- toate problemele semnalate de audit s-au confirmat;
- în plus: 21.426 de chei în afara inventarului cititorului, 1.863 de valori-placeholder, 293 de numere care contrazic textul („x=260” pentru „400, 30”) și 173 de id-uri de slot scrise în text („hair_back”);
- **au rămas 4.928 din 26.670 de rânduri,** convertite după reguli, nu preluate ca atare.

**Reguli aplicate uniform tuturor surselor:**
- descrierile definite („the house”) devin descrieri de tip, nu nume;
- ancora relației apare ca fragment separat;
- comparativele devin pași (`delta`), iar gradele de sine stătătoare („big”, „small”) devin `degree`;
- o singură etichetă pentru fiecare intenție;
- 4.362 de rânduri cu un mesaj anterior fără legătură, cu etichetele neschimbate, ca cititorul să nu mai copieze din tura precedentă.

### Rezultatul antrenării (v6, DistilBERT, GB10, 4 epoci, aproximativ 1,7 ore)

| Pe testul oficial (5.250 de fragmente) | v6 | modelul din demo |
|---|---|---|
| Intenția exactă, cu tăieturile corecte | **61,8%** | 18,4% |
| Intenția exactă, cu spargerea automată a fiecărui model | **55,4%** | 11,2% |
| Sensul complet al cititorului | **41,5%** | 10,3% |
| Fraza spartă corect în cereri | **99,3%** | 62,0% |

- **Pe taburi** (intenția exactă): desen 71%, diagramă 68%, avatar 53%, document 47%, calendar 22%.
- **Pe validare:** F1 0,958 pentru fragmentele recunoscute.
- **Comparația nu e complet echitabilă:** modelul din demo a fost antrenat cu altă convenție de etichete.

### În aplicație

- **Probe:** cu v6 trec 6 din 22 pe ruta reală a aplicației, la fel ca modelul vechi. Însă v6 reușește „make the house blue” (cu și fără mesaj anterior), unde modelul vechi pică.
- **Citite corect, blocate în runtime:**
  - **Relațiile:** bindings-urile nu au încă proprietățile pentru relație și ancoră.
  - **„move the meeting to 3pm”:** `meeting.time` nu e legat.
  - **„make the box wider”:** `drawn.width` nu e legat.
  - **Comparativele:** runtime-ul lipește o valoare pe condiția de pas.

  Toate sunt goluri de runtime, nu de cititor.
- **Succesul fals al modelului vechi:** modelul vechi „reușea” frazele cu „la stânga” doar pentru că arunca relația.
- **Încă greșite la cititor:** „add a house next to the lake and left of the tree” pierde relațiile; „make her hair shorter” nu primește o etichetă utilizabilă.
- **Activarea:** decizia mea a fost să activăm v6. Un agent leagă acum proprietățile lipsă, aliniază bindings-urile la catalogul nou (`w.drawing`, `w.diagram`), repară comparativele și activează modelul. Starea ei e în secțiunea 8.

## 7. Ce nu e gata

- **Documente:** încă JavaScript. Un agent îl mută acum pe arie SOP; catalogul `w.document` e deja extins (`a04fb0d8`).
- **Relațiile din chat:** depind de noul cititor. Cu modelul actual se pierd.
- **„make the house blue”:** cu modelul actual, „the house” e citit ca nume.
- **Afișarea temporară a ID-urilor:** nu expiră încă (singurul test marcat `todo`).
- **Gradul absolut pe un obiect existent:** „make the house big” se aplică încă la mărimea curentă. Reparația ține de librărie.
- **Bundle-ul offline:** nu conține toate desenele (de exemplu rața). Online merge.
- **Safari:** nu are COEP `credentialless`, deci rămâne pe căutarea internă.

## 8. În lucru când a fost scris raportul

- **Activarea cititorului v6** plus legarea proprietăților lipsă (relații, ancoră, oră, lățime, comparative, alinierea bindings-urilor la catalogul nou).
- **Tabul Documente** pe arie SOP.

Fiecare intră în PSys2 doar după poarta completă.
