# Registrul schimbărilor și deciziilor de migrare

Mutat din anexele C/D ale cărții pentru a separa specificația cititorului de urmărirea implementării. Registrul este o listă de migrare, nu dovada că modulele sunt livrate. Referințele numerotate trimit la carte; contractele fazei 0 sunt urmărite separat în [phase-zero-contracts.md](phase-zero-contracts.md).

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
| `enum` pe sloturi, pentru cuvinte (inventarul istoric al sloturilor de migrat; pentru perimetrul publicat actual vezi knowledge-inventory.md) | Regiuni în spații conceptuale. `enum` rămâne numai pentru excepțiile declarate. |
| `ask` pe fiecare slot | Întrebarea generală a conceptului. |
| `default` pe sloturi | Valori obișnuite în cunoaștere, ca regiuni. |
| `accepts` și `scale` pe `std.tool.param` | `space`, cu partea din spațiu pe care o poate realiza unealta. |
| `effect` pe `std.tool.op` | `realises`, cu numele actului. |
| `on` cu chei fixe pe `std.schema.honours` | `role`, cu nume de concepte. |
| `std.schema.region` și `std.schema.relation` declarate de fiecare lume | Regiuni și relații declarate o dată. |
| cele unsprezece chei fixe ale cererii din programul bibliotecii | Cererea scrisă în concepte (secțiunea 6.3). |
| propozițiile de răspuns scrise pe situație (inventarul aplicației se reverifică la migrare) | Familii de cadre semantice pe act și statut, cu gruparea efectelor și verificarea acoperirii (capitolul 13). |
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
| amploarea refacerii | Decis: refacere completă, inclusiv motorul unde contractele o cer; controlul a publicat pornirea implementării; instrucțiunea programată și workspace-ul mențin încă această sesiune la documentație, conform întrebării de reconciliere. |
| harta | Decis: scoasă din demo. |
| avatarul | Fața este un lucru desenat cu părți; nu un domeniu separat. |
| numele tipurilor `w.legend.*` | Numele din carte și registrul fazei 0 sunt baza; se fixează împreună cu sloturile și probele de respingere. |
| unde stau factorii învățați ai cuvintelor de grad | Domeniu local explicit: instanță sau profil declarat, cu episod și proveniență; fără promovare automată în cunoașterea comună (R34, capitolul 12). |

## Politici și reprezentări de verificat

Rândurile disting decizia semantică deja luată de reprezentarea sau calibrarea încă deschisă. Prima coloană păstrează identificatorul stabil al contractului din carte.

| Regula | Ce este de hotărât |
|---|---|
| R5 | Dacă lipsa de ordine a unei chei cu mai multe valori se declară cu `order=ignored` sau altfel. |
| R6 | Identitatea imutabilă separată de nume este decisă; referințele persistă perechea de identități, iar numele lizibile sunt aliasuri. Rămâne sintaxa serializării, conform 2.4.1 și 2.6. |
| R9 | Dacă „se știe că nu are” se scrie `none`, și pe ce sloturi este permis. |
| R31 | Mărimea pașilor: 1,25 pentru mărimi; 30 de minute pentru oră. |
| R34 | Dacă ce se învață poate trece vreodată în cunoașterea comună, și cine aprobă. |
| R48 | Recurența este inclusă; rămân de proiectat reprezentarea seriei, excepțiile și verificarea pe intervale finite. |
| R49 | Dacă normele sunt slabe în timpul lucrului sau unele sunt tari. |
| R59 | Decis: instantaneu, actualizat numai la cerere; implementarea trebuie să păstreze valorile consumate, proveniența și versiunea (2.6, 8.6). |
| R64 | Decis: uneltele celor patru domenii oferă anulare. O unealtă viitoare fără anulare necesită o politică explicită înainte de activare. |
| R68 | Calibrarea măsurării în spațiul de ton, toleranțele și tratarea incertitudinii, prin mecanismul din 6.8.1. |

## Verificarea contractelor înaintea livrării

Schemele complete, condițiile structurate și protocolul de completitudine se verifică prin exemple și contraexemple în registrul fazei 0. Reviewerul urmărește tranzițiile dintre date, reguli și efecte; o etapă fără justificare nu este lăsată la interpretarea particulară a fiecărui domeniu. Această cerință de livrare a fost mutată din fosta secțiune 8.7 a cărții.
