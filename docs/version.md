# sopworld 0.81.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.81.0 |
| Build | 669ed8a23e1b |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 781.2 kB, 224.6 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 780.0 kB, 224.3 kB gzipped |
| Modules bundled | 46 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.81.0'
build     // { version: '0.81.0', hash: '669ed8a23e1b', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
