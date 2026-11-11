# sopworld 0.8.1

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.8.1 |
| Build | 828e5e8afb31 |
| Built | 2026-11-11 |
| `sopworld.mjs` (ES module) | 370.3 kB, 105.2 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 370.1 kB, 105.2 kB gzipped |
| Modules bundled | 19 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.8.1'
build     // { version: '0.8.1', hash: '828e5e8afb31', date: '2026-11-11' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
