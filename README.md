# sopworld

Self-consistent micro-worlds for SOP Lang circuits. A world holds fact wires and a
*consistency matrix* (slots, rules and deny constraints, also written as wires) and
keeps the two in agreement: it derives what follows, completes what is missing, asks for
what it cannot decide, and refuses what is not allowed.

- One file, no dependencies, the same in Node 18+ and in browsers.
- Deduction, abduction, induction, logical completion, search with pluggable solvers,
  revisable defaults, incremental retraction, composition of matrices, persistence, events.
- Documentation, playground and browser self-test: [docs/index.html](./docs/index.html).
  Specification: [SPEC.md](./SPEC.md).
- Type hierarchy, kinds, state over time, aggregates, questions with a status, actions,
  step budgets and copy-on-write forks: [docs/matrix.html](./docs/matrix.html).
- What changed since 0.4: [CHANGELOG.md](./CHANGELOG.md).
- Putting an existing system on the library: [docs/integration.md](./docs/integration.md).

## Use

```html
<script type="module">
  import { World } from './sopworld.mjs';          // docs/sopworld.mjs
</script>
<script src="sopworld.js"></script>                <!-- or: the global `sopworld` -->
```

```js
import { World } from './docs/sopworld.mjs';        // Node, ES module
const { World } = require('./docs/sopworld.js');     // Node, CommonJS

const w = new World();
w.load(`
  @k core.slot of=acceleration key=of id=true
  ?b body mass=?m
  ?f force on=$b magnitude=?F
  @a acceleration of=$b magnitude=?A
  @c core.calc out=?A fn=div args=?F args=?m
  @newton2 core.rule when=$b when=$f with=$c then=$a
`);
w.tell('@b1 body mass=2kg  @f1 force on=$b1 magnitude=10N  @a1 acceleration of=$b1');
w.get('a1').attrs.magnitude;   // ['5N/kg'], filled by newton2
w.explain('a1');               // ... from b1 and f1
```

## Develop

```
npm run build          # src/*.mjs -> docs/sopworld.mjs, docs/sopworld.js, docs/sopworld.d.ts
npm test               # build, then the suite on the sources and again on the built file
npm run test:browser   # self-test and playground in headless Chrome (needs Playwright)
npm run examples       # ten runnable demonstrations
npm run bench          # micro-benchmarks
```

Outside solvers are optional. `node/solvers.mjs` starts `clingo` or any DIMACS SAT solver
as a process; the tests that use them are skipped when they are not installed.

## Layout

```
src/            the library as small ES modules (index.mjs is the entry)
docs/           the built single file, its type declarations, the documentation,
                the playground and the self-test; self-contained, ready for GitHub Pages
node/           Node-only wiring for outside solvers
bin/            command line: sopworld check|run|ask
tools/          build.mjs, browser-check.mjs, bench.mjs, satsolve.py (test helper)
examples/       runnable demonstrations and the shared demo worlds
test/           node:test suites
```
