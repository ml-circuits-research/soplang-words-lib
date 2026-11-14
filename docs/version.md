# sopworld 0.62.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.62.0 |
| Build | 673c2175e802 |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 685.1 kB, 195.4 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 684.2 kB, 195.2 kB gzipped |
| Modules bundled | 36 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.62.0'
build     // { version: '0.62.0', hash: '673c2175e802', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
