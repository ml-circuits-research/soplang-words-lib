# sopworld 0.134.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.134.0 |
| Build | 6914bc3de27b |
| Built | 2026-11-15 |
| `sopworld.mjs` (ES module) | 980.5 kB, 286.0 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 978.4 kB, 285.6 kB gzipped |
| Modules bundled | 63 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.134.0'
build     // { version: '0.134.0', hash: '6914bc3de27b', date: '2026-11-15' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
