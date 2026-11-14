# sopworld 0.59.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.59.0 |
| Build | baf0100991f6 |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 672.2 kB, 191.3 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 671.5 kB, 191.1 kB gzipped |
| Modules bundled | 34 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.59.0'
build     // { version: '0.59.0', hash: 'baf0100991f6', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
