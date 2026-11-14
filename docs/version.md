# sopworld 0.103.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.103.0 |
| Build | a1fdacb1f255 |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 853.2 kB, 246.2 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 851.5 kB, 245.9 kB gzipped |
| Modules bundled | 51 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.103.0'
build     // { version: '0.103.0', hash: 'a1fdacb1f255', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
