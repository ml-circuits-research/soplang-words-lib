# Compilatorul de cereri, pe înțelesul tuturor

*Sumar de lucru, 19 noiembrie 2026. Tema: cum ajunge un fir de intenție (`std.request`) să devină un fir de unealtă (apel executabil). Rezumă capitolele 1.3, 6.1–6.9 și 9 din [`sop-worlds-teorie.md`](sop-worlds-teorie.md) și le pune lângă ce există azi în cod. Fără cod nou, fără schimbări — doar explicație și propuneri.*

---

## 1. Ideea într-o propoziție

Omul spune **ce vrea** („pune o barcă pe lac”); unealta trebuie să primească **ce face exact** (`drawing.object.make kind=boat x=500 y=525`). Compilatorul este partea din mijloc care face partea grea: găsește lucrurile la care se referea omul, alege cine le poate executa, completează ce a fost omis și spune de ce.

**Firul de intenție** spune scopul cu concepte generale: acțiunea (`make`, `change`, `inspect`), ținte („o barcă”, „casă”, „ea”), constrângeri („pe lac”, „mic”, „roșu”). E o lume mică de fire: `std.request`, `std.request.target`, `std.request.constraint`. Nu e executabilă și nu trebuie să fie.

**Firul de unealtă** (apelul) spune o operație concretă cu toate argumentele tipizate: `add kind=boat x=500 y=525 size=1 colour="brown"`. Nimic deschis: nici „lac”, nici „mic”, nici „ea”. Cartea numește asta **granița executabilă**: circuitul e gata când fiecare alegere semantică e făcută.

Regula de aur a graniței (cap. 1.3): **unealta are voie să refuze un apel greșit, dar nu are voie să-l repare ghicind**. Ea nu ghicește obiectul, culoarea sau poziția. Repararea (completarea) se întâmplă *înainte* de graniță, în compilator. O unealtă care ghicește ascunde o decizie pe care nimeni n-o mai poate verifica.

---

## 2. Cum funcționează compilatorul, în opt pași

Cartea (cap. 6.2) descompune mesajul astfel; compilatorul propriu-zis e pașii 5–6:

| # | Pasul | Ce întreabă |
|---|---|---|
| 1 | Starea | Ce există acum, cu ce versiune? |
| 2 | Citirea | Ce text a scris omul? (SOP-BERT face fire de intenție din el) |
| 3 | Contextul | E cerere nouă, corecție („nu, celălalt”) sau răspuns? |
| 4 | Cantitățile | Ce înseamnă „de două ori mai lat” sau „mare”? |
| 5 | **Completarea** | Ce lipsește ca apelul să fie executabil? |
| 6 | **Elaborarea** | Cine execută, pe cine, cu ce valori? → circuitul de apeluri |
| 7 | Execuția | Trimite apelurile, verifică efectul real |
| 8 | Răspunsul | Spune ce s-a întâmplat, din efecte confirmate |

### Pasul 6 pe dinăuntru: potrivirea cerere–unealtă

Uneltele se declară înainte, ca date (cap. 6.1). Patru cuvinte:

- **capabilitatea** spune: „domeniul ăsta poate face `make` pe felul `drawn`, pe rolurile kind–count–place”;
- **operația** (`std.tool.op`) spune: „uneltea mea se numește `add` și face `makes`”;
- **parametrul** (`std.tool.param`) spune: „`add` cere `kind`, `x`, `y`, `size`, `colour`; `size` e număr între 0.3 și 3”;
- **bindingul** leagă actul de operație: „`make` pe `drawn` se face cu `add`”.

Potrivirea e un simplu **join** pe aceste contracte: actul cerut × felul țintei × rolurile cerute, contra declarațiilor. După join, parametrii obligatorii care nu au valoare devin **variabile de rezolvat**. Gata — compilarea devine o problemă de umplut goluri, nu de recunoscut propoziții.

### Umplerea golurilor (cap. 6.6)

Pentru fiecare variabilă, completarea colectează propuneri cu sursă și cost:

1. ce a spus omul explicit (cerință);
2. ce corectează el acum („nu, celălalt”);
3. preferințe învățate pe obiect/utilizator;
4. cunoașterea generală (barca stă pe apă; ședința obișnuită ține 30 de minute);
5. implicitul uneltei/scenei (loc liber pe pânză).

Fiecare valoare aleasă păstrează **sursa** (de unde a venit) și **tăria** (cerință, preferință sau presupunere). „Mic” nu e un număr hardcodat: e o **regiune prototip într-un spațiu de mărimi** (cap. 4), raportată la felul lucrului — casa „mică” nu e mică cât peștele „mic”.

### Alegerea (cap. 6.8)

Când sunt mai multe variante (două lacuri, două citiri ale lui „man”), compilatorul nu alege la întâmplare: generează candidați pe o **copie izolată a lumii** (`fork`), îi verifică contra constrângerilor dure (`core.deny`, de ex. „fără suprapunere”), apoi îi ordonează după **criterii declarate** (`std.decide`) — focusul întrece recența, costul ortografic 0.5 întrece 1.5. Alege pe cea mai bună, dar **păstrează alternativele**: pentru „no, the other one” ai nevoie de ele la turul următor. Un buget epuizat nu e același lucru cu „e imposibil”.

Toată puterea de calcul vine dintr-un **catalog fix de operații** (cap. 6.8.2): `match` (caută fire care se potrivesc unui tipar), `space` (măsoară în spațiile conceptuale), `derive` (aplică regulile), `validate`, `fork` (încearcă izolat), `enumerate`/`rank`/`search` (candidați și ordonare), `plan` (compune pași), `call`/`observe`/`compare`/`record` (execută, observă, compară, jurnalizează), `realise` (formulează textul răspunsului). Un nume nou de concept nu aduce putere de calcul nouă. Asta e și o veste bună: dacă mecanismul se poate spune cu aceste operații, e de ajuns să-l declari; dacă nu, trebuie extinsă explicit biblioteca.

### Execuția (cap. 6.9)

Circuitul final e o listă de apeluri cu dependențe: ieșirea unui apel (identitatea noii case) intră mecanic în apelul următor (desenează pomul lângă ea). Înainte de fiecare apel se **recitește starea** (dacă omul nu a mutat ceva între timp?); dacă s-a schimbat, programul recompilează o dată, cu limită declarată; dacă un apel pică, cele deja făcute se **compensează în ordine inversă**, cu verificare; dacă compensarea nu reușește, se raportează ce a rămas efectiv schimbat — niciodată „gata” fără dovadă. Toate apelurile unui singur „te rog” formează **un singur pas de Undo**.

Exemplul din carte (cap. 6.6.2): „pune Review preparation luni”. Omul a dat titlul și ziua; cunoașterea dă 30 de minute și programul 9–17; instanța are o rezervare 10–11. Compilatorul scade ocupatul din permis, păstrează intervalele ≥30 min, alege startul liber cel mai devreme: 09:00. Apelul final e „calendar.event.make title=… start=09:00 duration=30” — fără „luni” și fără „devreme” în el.

---

## 3. Cum e făcut azi în cod

Drumul real, de la `World.compileRequest(sop)`:

```
text ──SOP-BERT──▶ fire std.request ──▶ compilePacket: ALEGE RAMURA
     ├─ std.knowledge.request  → projection (citește din catalog după profil)
     ├─ std.ground.request     → grounding (leagă cuvintele de concepte, cu cost)
     ├─ std.choice.request     → choice (alege între candidați declarați)
     ├─ std.interpret.input   → interpretations (mai multe citiri, comparate)
     └─ un singur std.request  → compileSingle:
            ├─ + capability context → capability-method (unifică cu std.capability.*)
            ├─ + placement context → placement-method (2 ținte, 1 relație)
            └─ altfel             → rule-circuit (regulile lumii deduc apelurile)
     ──▶ text SOP de apeluri ──▶ tool-input-compiler ──▶ unealta
```

Ce e bine și rămâne: **rule-circuit** (deducție pur: cererea intră într-un `fork`, regulile lumii deduc apelurile și dovezile — modelul cel mai general, descris în tot cap. 9), **capability-method** (unificarea cerere⇄interfețe), **std.choice** cu criterii și alternative păstrate (exemplul-cheie „make it blue” / „no, the other one” merge prin el), **std.ground** (mică abducție ponderată: „man”→person 0.5 întrece moon 1.5, indiferent de ordine).

Ce e frânt față de modelul din carte:

- **Fiecare ramură are contractul ei**, nu e o singură buclă „join → variabile → completare → validare → ordonare”. De aceea o cerere în care se combină două lucruri nu poate intra: routerul alege o ramură, cealaltă se pierde.
- **O singură rădăcină pe cerere**: „desenează o casă, apoi scrie un raport” trebuie tăiată în afara compilatorului.
- **Rezultatele sunt text**: `status=unavailable reason=...` sau, uneori, string gol. Apelantul re-parsează să afle ce s-a întâmplat; se pierd etapa, candidatul, span-ul din care a venit.
- **Fluxul de date lipsește**: `prepareRequestBatch` știe doar ordinea (`after`), nu „rezultatul pasului 1 devine argumentul pasului 2”. „Calendar → grafic → document” nu poate fi exprimat în IR (cap. 9.5 îl cere).
- **Plasarea e un caz special**: exact două ținte, exact o relație, fără cantități („la 40 px de casă” nu intră).
- **Selectorii sunt declarați dar nu executați uniform**: „toate casele, în afară de cea roșie” trece validarea și apoi primește `unsupported-selector`.
- **Doar o parte din decizii sunt în lumi**: ce rămâne în JS e listat în [`sumar-scop-si-algoritmi.md`](sumar-scop-si-algoritmi.md) §3.4 (tabele de cuvinte, stare în JS, limite fixe de cost).

Cauza comună a tuturor: compilatorul de acum **alege ramura după tipul firului**, pe când cartea cere să **elaboreze graful cererii** — aceleași faze (potrivire, completare, validare, ordonare, emitere) pentru orice cerere, cu aceleași tipuri de rezultat.

---

## 4. Ce propun: o singură buclă, nu șapte ramuri

Schimbarea de formă care le leagă pe toate. Pașii (în ordinea pe care aș construi-o):

1. **Un singur pipeline**: `parse → validează contractul → admite → plan → verifică → emite`. Fiecare pas întoarce `{ ok, valoare?, probleme[] }`, iar o „problemă” are `code`, `stage`, `span`, candidații respinși și motivul. Ramurile de azi devin **providere de faze**, înregistrați într-un registry; ordinea lor se declară, nu se moștenește din ordinea `if`-urilor.
2. **Join cu capabilitățile la intrare** (cum cere cap. 6.1): act × fel × roluri, contra declarațiilor. Parametrii obligatorii rămași deschiși devin variabilele buclei.
3. **Completarea generică pe niveluri de autoritate** pentru orice parametru, nu doar poziția: explicit > corecție > preferință învățată > cunoaștere > implicit de unealtă (cap. 6.6). Valorile de grad trec prin regiuni prototip în spațiile conceptuale.
4. **O singură căutare**: `enumerate` oferta de candidați, `validate` pe `fork`, `rank` pe criterii declarate. `placement`, `choice` și `grounding` devin furnizori de domenii și costuri pentru **aceeași** buclă; solver-ul `Problem` din `solve.mjs` (deja cu verificare prin oracle) e motorul de căutare, folosit de toți.
5. **Rezultat tipizat, nu string**: `Plan` (graful de apeluri cu dependențe tipizate `ieșire→intrare`) + `Issue[]` (refuzul cu etapă și dovadă, ca în cap. 6.8). Serializarea SOP rămâne la margine, pentru jurnal și inspectare.
6. **Ipoteze în loc de refuz** (Review 29): dacă două citiri sunt plauzibile, se execută cea mai bună, se spune într-un rând ce s-a presupus, alternativele rămân în jurnal pentru „no, the other one”. Dovada lipsă nu devine niciodată fapt.
7. **Fluxul de date între unelte** ca parte a tipului: `std.capability.operation` declară ce întoarce fiecare apel; pașii următori leagă după **tip**, nu după nume. Primul caz complet: calendar → grupare pe zile → grafic → document, cu un singur Undo (cap. 9.5 și 6.1.2 îl descriu amândoi).
8. **Execuția cu dovadă**: recitirea stării înainte de trimitere, compensarea în ordine inversă cu verificare, efecte reziduale raportate — exact capitolul 6.9. Un test de browser pentru „pasul 2 a picat după ce pasul 1 a reușit” e criteriul de acceptare.

**Discipline mici, efect mare** (nu cer cod nou, cer doar consecvență):

- **Selectorul ≠ cerința** (cap. 9.2): „câte obiecte roșii?” e filtru; „fă obiectele roșii” e cerință asupra rezultatului. Inversarea lor e cea mai comună eroare semantică; un test pe fiecare metodă nouă o prinde.
- **Fiecare valoare completată își poartă sursa** în circuit: „de ce 09:00?” trebuie să răspundă „cea mai devreme oră liberă, program 9–17, rezervarea 10–11”, nu „așa a vrut codul”.
- **Un refuz tipizat e o funcție**: `request.root.multiple` cu ambele rădăcini numite, sau `unresolved-selector` cu motivele fiecărui candidat. Testele verifică codul, nu mesajul.

**Testul final de generalitate** (din cap. 1.3 și 7.5): o lume nouă (`w.inventory`, un registru de inventar) intră pe catalog, își declară capabilitățile și uneltele, aplicația o încarcă — și **niciun fișier din `src/` nu se schimbă**. Dacă adăugarea ei cere cod nou în `src/`, generalizarea e doar declarată, nu reală.

Azi compilatorul face bine pasul cel mai greu al unui singur caz (alegerea sub criterii, cu dovezile la vedere). Ce îi lipsește pentru pasul următor e **forma**: un pipeline cu tipuri, în care fiecare cerere trece prin aceleași faze. Kernelul (`fork`, reguli, `solve.mjs`, `std.choice`) are deja toate piesele.
