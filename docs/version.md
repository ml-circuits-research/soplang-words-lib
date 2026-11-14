# sopworld 0.106.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.106.0 |
| Build | befdc5102556 |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 861.9 kB, 248.5 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 860.2 kB, 248.1 kB gzipped |
| Modules bundled | 51 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.106.0'
build     // { version: '0.106.0', hash: 'befdc5102556', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
