# New examples run against the book (v28): calendar, documents, requests across areas

*Reviewer, 2026-11-16. The owner never typed in the calendar, and only three times in documents. These are requests a person would naturally make there; I ran each in imagination against book v28 (6.3.2 request wires, 6.4.1 descriptions, 4.6.2 kind change, 6.7.1 re-completion, 6.11.1 journal, 6.6.1 local knowledge, 6.8.2 operation catalogue). They are test material, not text for the book. Verdicts: **yes** derives; **rule** needs a rule the book does not state; **no** a mechanism is missing.*

## 1. The examples

| Request | Verdict and reason |
|---|---|
| "move my 3pm to tomorrow, same time" | **yes**. Reference by a time filter (6.4.1); "same time" is a keep on the time-of-day part while the day changes. |
| "cancel all meetings with Tom next week except the review" | **yes**. A description with scope "all", a region of time, and a negative filter by name. |
| "am I free on Thursday afternoon?" | **yes**. A question about the state over a region; `complete=true` closes the scope. |
| "make the tone friendlier but keep it professional" | **yes**. A step on the warmth axis plus a keep on the formality region (6.7.1). |
| "translate the intro into French" | **yes**. No capability: refused with the reason. |
| "put the drawing in the letter, under the signature" | **yes**. A live embedding (2.6.1) placed by an order relation. |
| "schedule a meeting to discuss this document with Ana" | **yes**. The topic is a description that refers to a thing of another world. |
| "find a slot for a one-hour meeting with Ana and Tom this week" | **no**. The person expects candidate times, NOT a meeting created. Same for "can I move the review to Friday?", "what if I put it at 9?". The request has an act and no mood: nothing says "plan on a fork, report, do not execute". Gap W. |
| "shorten every meeting on Friday by 15 minutes" | **no**, twice. "By 15 minutes" is a change with an explicit amount; the book has steps from the axis only. And shortening an interval must keep one end fixed: the start, for a meeting. Nothing declares which point of an extended value stays fixed. Gap X. |
| "put a reminder 10 minutes before the review" | **rule**. A relation that carries a measure. Same in "2 cm left of the house", "two paragraphs after the introduction". Relations have a `test` (4.4.3) but no distance argument. Gap Y. |
| "push everything after lunch by an hour" | **rule**. "Lunch" may be a meeting called Lunch or the usual lunch region from knowledge: the candidates of a reference must include regions from knowledge, not only things in the state (6.4.1 lists things). Then X for "by an hour", then re-completion for the conflicts it creates. |
| "draw a diagram of my week" | **no**. Read the calendar, write the diagram (snapshot, decided). But how does a meeting become a node, and what are the links: order in time? shared people? The book has provenance for the result and no declaration of the MAPPING between kinds of two worlds. Same for "a bar chart of meetings per person". Gap Z. |
| "make the diagram's colours match the drawing" | **rule**. A quality of a whole taken from its parts (the drawing's palette), and a constraint "same as" whose value is a reference to another thing's value. `core.aggregate` exists; the request operators have no "same as". Gap AA. |
| "write a cover letter based on my CV", "summarise this document in three sentences" | **no**, and honestly so. The content comes from understanding another text, which is not the command reader of the book (E1). Either a declared capability through `call`, with its own contract and checks, or an honest refusal. The book should say which. Gap BB. |
| "every Monday at 9, stand-up with the team, except holidays" | **rule**. "The team" is a named group: a collection the user taught (6.6.1), referred to by name. "Holidays" is world knowledge (a question for knowledge, 6.11.1); if absent, say so and create without the exception, or ask. |

Count: 7 yes, 4 rule, 4 no.

## 2. The new gaps, and where they fall in the five mechanisms

| Gap | Proposal |
|---|---|
| W. The mood of a request | One field of the request (6.3.2): do, propose, check whether possible, ask. Propose and check run the same plan on a fork (`fork`, `validate`) and report candidates or the reason; they never reach `call`. "Find", "can I", "would it work if", "what if" are its words in English. It needs no new operation: it is where the pipeline stops. |
| X. Amount and anchor of a change | Under mechanism 2. A change may carry an explicit amount in the unit of the axis ("by 15 minutes") or as a factor ("twice", "20%"), instead of the declared step. And a space whose values are regions (intervals, boxes) declares, per kind, the anchor kept when the extent changes: the start of a meeting, the centre of a node, the top-left of a drawn thing, the beginning of a text. The user can override ("end it earlier", "grow it to the left"). |
| Y. A relation with a measure | Also mechanism 2. A relation may take a distance on its axis: `relation=before amount=10 unit=minute`. The `test` receives it; without it, the relation's default ("near" = a fraction of the page). |
| Z. A projection between two worlds | A declared mapping from a description in the source world to kinds and slots in the target world (meeting → node, start → position on the time axis, per-person count → bar height), written as rules over the composition context, with the snapshot provenance of 2.6.1 on every produced fact. "Draw a diagram of my week" and "a chart of meetings per person" are then two projections, chosen like any other alternative (6.7.1) or asked. No new mechanism: rules plus `collect`; but the book must say that this is how cross-world results are made. |
| AA. Qualities of a whole, and "same as" | A whole's quality computed from its parts (palette, total length, busiest day) is a derived fact (`core.aggregate`); a request operator `same` whose value is a reference to another thing's value, resolved at planning time (a snapshot, like Z). |
| BB. Content from another text | State the boundary: understanding the content of a document is a capability behind `call` (its contract says what statements it returns and how they are checked against the source), not the reader of commands. Without that capability the reply says so. |

## 3. What this adds to the picture

The reduction to five mechanisms holds: W is a field of the request, X and Y belong to the spaces, Z and AA are rules plus aggregation over a composition context, BB is a boundary. None needs a new operation in the catalogue of 6.8.2. What the calendar adds that drawing did not show: requests that must NOT execute (W), and changes that state their own amount and anchor (X).
