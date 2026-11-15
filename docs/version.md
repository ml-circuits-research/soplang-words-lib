# sopworld 0.151.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.151.0 |
| Build | 29bf05310cc5 |
| Built | 2026-11-15 |
| `sopworld.mjs` (ES module) | 1140.4 kB, 331.7 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1137.9 kB, 331.2 kB gzipped |
| Modules bundled | 68 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.151.0'
build     // { version: '0.151.0', hash: '29bf05310cc5', date: '2026-11-15' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
