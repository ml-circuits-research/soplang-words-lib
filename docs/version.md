# sopworld 0.195.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.195.0 |
| Build | 57c746d7b2bb |
| Built | 2026-11-16 |
| `sopworld.mjs` (ES module) | 1473.6 kB, 417.3 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1470.6 kB, 416.7 kB gzipped |
| Modules bundled | 87 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.195.0'
build     // { version: '0.195.0', hash: '57c746d7b2bb', date: '2026-11-16' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
