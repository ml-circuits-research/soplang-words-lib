# sopworld 0.120.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.120.0 |
| Build | 67dbc8258f19 |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 934.1 kB, 271.4 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 932.1 kB, 271.1 kB gzipped |
| Modules bundled | 59 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.120.0'
build     // { version: '0.120.0', hash: '67dbc8258f19', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
