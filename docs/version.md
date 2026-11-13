# sopworld 0.22.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.22.0 |
| Build | 4e1644c2b0f3 |
| Built | 2026-11-13 |
| `sopworld.mjs` (ES module) | 509.4 kB, 144.1 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 509.1 kB, 144.0 kB gzipped |
| Modules bundled | 23 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.22.0'
build     // { version: '0.22.0', hash: '4e1644c2b0f3', date: '2026-11-13' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
