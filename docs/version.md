# sopworld 0.233.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.233.0 |
| Build | 578c95e1d3ff |
| Built | 2026-11-20 |
| `sopworld.mjs` (ES module) | 1706.9 kB, 478.6 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1703.5 kB, 478.0 kB gzipped |
| Modules bundled | 110 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.233.0'
build     // { version: '0.233.0', hash: '578c95e1d3ff', date: '2026-11-20' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
