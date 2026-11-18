# sopworld 0.213.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.213.0 |
| Build | bbc3f7b80563 |
| Built | 2026-11-18 |
| `sopworld.mjs` (ES module) | 1612.7 kB, 452.9 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1609.3 kB, 452.3 kB gzipped |
| Modules bundled | 104 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.213.0'
build     // { version: '0.213.0', hash: 'bbc3f7b80563', date: '2026-11-18' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
