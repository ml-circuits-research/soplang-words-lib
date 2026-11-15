# sopworld 0.154.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.154.0 |
| Build | 90ce9a799330 |
| Built | 2026-11-15 |
| `sopworld.mjs` (ES module) | 1246.2 kB, 360.8 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1243.4 kB, 360.3 kB gzipped |
| Modules bundled | 70 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.154.0'
build     // { version: '0.154.0', hash: '90ce9a799330', date: '2026-11-15' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
