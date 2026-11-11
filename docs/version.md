# sopworld 0.6.1

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.6.1 |
| Build | 2e386803daa3 |
| Built | 2026-11-11 |
| `sopworld.mjs` (ES module) | 281.9 kB, 80.6 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 281.7 kB, 80.5 kB gzipped |
| Modules bundled | 17 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.6.1'
build     // { version: '0.6.1', hash: '2e386803daa3', date: '2026-11-11' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
