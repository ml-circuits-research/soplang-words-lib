# sopworld 0.156.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.156.0 |
| Build | 271cb690cbfb |
| Built | 2026-11-15 |
| `sopworld.mjs` (ES module) | 1263.4 kB, 365.6 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1260.6 kB, 365.0 kB gzipped |
| Modules bundled | 70 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.156.0'
build     // { version: '0.156.0', hash: '271cb690cbfb', date: '2026-11-15' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
