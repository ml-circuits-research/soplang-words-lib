# sopworld 0.43.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.43.0 |
| Build | c735b69c76aa |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 584.6 kB, 165.2 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 584.1 kB, 165.1 kB gzipped |
| Modules bundled | 27 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.43.0'
build     // { version: '0.43.0', hash: 'c735b69c76aa', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
