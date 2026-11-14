# sopworld 0.102.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.102.0 |
| Build | a139e59a4720 |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 843.8 kB, 243.4 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 842.2 kB, 243.1 kB gzipped |
| Modules bundled | 50 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.102.0'
build     // { version: '0.102.0', hash: 'a139e59a4720', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
