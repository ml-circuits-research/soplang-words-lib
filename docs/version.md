# sopworld 0.167.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.167.0 |
| Build | 84aa31ca6770 |
| Built | 2026-11-16 |
| `sopworld.mjs` (ES module) | 1329.1 kB, 383.7 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1326.2 kB, 383.1 kB gzipped |
| Modules bundled | 70 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.167.0'
build     // { version: '0.167.0', hash: '84aa31ca6770', date: '2026-11-16' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
