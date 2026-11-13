# sopworld 0.33.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.33.0 |
| Build | 80918c63ca4d |
| Built | 2026-11-13 |
| `sopworld.mjs` (ES module) | 564.8 kB, 160.2 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 564.4 kB, 160.1 kB gzipped |
| Modules bundled | 27 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.33.0'
build     // { version: '0.33.0', hash: '80918c63ca4d', date: '2026-11-13' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
