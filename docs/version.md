# sopworld 0.131.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.131.0 |
| Build | fc72ed4c56a8 |
| Built | 2026-11-15 |
| `sopworld.mjs` (ES module) | 962.6 kB, 280.7 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 960.5 kB, 280.3 kB gzipped |
| Modules bundled | 63 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.131.0'
build     // { version: '0.131.0', hash: 'fc72ed4c56a8', date: '2026-11-15' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
