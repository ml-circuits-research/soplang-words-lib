# sopworld 0.71.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.71.0 |
| Build | 8cdaddc2b16b |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 741.3 kB, 212.1 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 740.2 kB, 211.9 kB gzipped |
| Modules bundled | 40 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.71.0'
build     // { version: '0.71.0', hash: '8cdaddc2b16b', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
