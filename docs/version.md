# sopworld 0.65.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.65.0 |
| Build | e6a9bf96ca14 |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 700.8 kB, 200.3 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 699.9 kB, 200.1 kB gzipped |
| Modules bundled | 37 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.65.0'
build     // { version: '0.65.0', hash: 'e6a9bf96ca14', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
