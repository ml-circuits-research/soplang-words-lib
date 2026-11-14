# sopworld 0.104.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.104.0 |
| Build | 4cae410c7f15 |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 857.4 kB, 247.4 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 855.7 kB, 247.1 kB gzipped |
| Modules bundled | 51 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.104.0'
build     // { version: '0.104.0', hash: '4cae410c7f15', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
