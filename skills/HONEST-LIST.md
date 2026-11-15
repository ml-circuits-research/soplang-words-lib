# The honest list

The list of cases looking for their generic solution. One row per turn the system does not handle yet,
with the generic piece it needs. It is the host's artifact (for example `honest-list.jsonl` next to its
phrase logs), versioned with the host, and it is the place work is chosen from.

## Format

JSON Lines, one object per row (`//` lines are comments). Code: `skills/lib/honest.mjs`
(`readHonest`, `writeHonest`, `checkHonest`, `rankNeeds`, `honestDelta`, `triage`, `acceptance`, `patchOnly`).

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | yes | stable id of the row |
| `turn` | yes | the user's text, as said (the source record; translated text when the host translates at its boundary) |
| `world` | yes | the open world or composite when it was said |
| `stage` | yes | `reading`, `planning`, `acting` or `replying` |
| `got` | no | what the system did (reply, plan, refusal) |
| `want` | no | what the user wanted, when known |
| `needs` | yes | `needs <generic piece>`: names a piece, never the turn (`checkHonest` refuses a "needs" that quotes three words of its turn) |
| `piece` | yes | `declaration`, `knowledge`, `language`, `composition`, `method`, `library`, `none` (a correct named refusal: not work) or `unknown` |
| `real` | no | `false` for a synthetic or generated turn; default real |
| `seen` | no | how many times real users said it (phrase logs); default 1 |
| `evidence` | no | the evidence that placed it (an unread word count, a notHonoured code, a command) |
| `since` | no | the date the row came |
| `patch_only` | no | `true` when the turn used to pass only by a patch (transition phase) |

```
{"id":"h12","turn":"add 9 fish in the pond","world":"garden","stage":"planning","needs":"needs nothing: a refusal with its reason","piece":"none","real":false}
{"id":"h13","turn":"…","world":"sketch","stage":"reading","needs":"needs the act word: a verb of k.actions or a word of the world's action in the language world","piece":"language","seen":4}
{"id":"h14","turn":"…","world":"notes","stage":"planning","needs":"needs a generic piece (unknown): a request about two worlds at once","piece":"unknown"}
```

## Rules

- A row is added when a real turn fails and no generic piece is built for it in the same change. Lost cases
  are added too (see the acceptance rule in [README.md](README.md#acceptance-two-phases)).
- A row leaves only when its piece has landed and the turn passes **by that piece** on the generic path; the
  worker log names the piece and the rows it removed (`honestDelta`).
- `needs` names the piece at the level it would be built: "needs a slot for place on the kinds made", not
  "needs 'in the pond' to work". Rows with the same `needs` are the same work.
- `piece: unknown` is honest, not a failure: such rows feed [propose-generic-method](propose-generic-method/SKILL.md).
- The list is never edited to look shorter: a row is not deleted because its case is inconvenient, and it is
  not reworded to merge with a piece that does not solve it.

## Choosing work

`rankNeeds(rows)` groups the rows by `needs` and ranks the groups:
1. by the **real turns** the piece would unlock (distinct turns, weighted by `seen`);
2. then by the number of **worlds** they come from (a piece needed in several worlds is more generic);
3. then by the synthetic turns.

Take the top group whose piece can be built. If its piece is `unknown`, the next work is to name it
(propose-generic-method). Rows of `piece: none` are correct refusals and are left out; if users keep
asking for what a world does not declare, the row becomes a `declaration` or `composition` piece by the
owner's decision, not by the worker's.
