# sopworld 0.250.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.250.0 |
| Build | 7e56457132c6 |
| Built | 2026-11-21 |
| `sopworld.mjs` (ES module) | 1839.2 kB, 515.8 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1835.5 kB, 515.0 kB gzipped |
| Modules bundled | 117 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.250.0'
build     // { version: '0.250.0', hash: '7e56457132c6', date: '2026-11-21' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
