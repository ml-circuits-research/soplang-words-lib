# sopworld 0.69.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.69.0 |
| Build | ab9a1a73e627 |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 731.8 kB, 209.4 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 730.8 kB, 209.2 kB gzipped |
| Modules bundled | 39 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.69.0'
build     // { version: '0.69.0', hash: 'ab9a1a73e627', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
