# sopworld 0.145.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.145.0 |
| Build | 4255f7888182 |
| Built | 2026-11-15 |
| `sopworld.mjs` (ES module) | 1018.8 kB, 296.6 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1016.6 kB, 296.1 kB gzipped |
| Modules bundled | 64 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.145.0'
build     // { version: '0.145.0', hash: '4255f7888182', date: '2026-11-15' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
