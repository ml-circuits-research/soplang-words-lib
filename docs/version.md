# sopworld 0.149.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.149.0 |
| Build | 2deaa1c7fb23 |
| Built | 2026-11-15 |
| `sopworld.mjs` (ES module) | 1094.3 kB, 318.1 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1091.9 kB, 317.6 kB gzipped |
| Modules bundled | 66 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.149.0'
build     // { version: '0.149.0', hash: '2deaa1c7fb23', date: '2026-11-15' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
