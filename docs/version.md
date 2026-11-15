# sopworld 0.128.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.128.0 |
| Build | da2de7741508 |
| Built | 2026-11-15 |
| `sopworld.mjs` (ES module) | 942.0 kB, 274.4 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 940.0 kB, 274.0 kB gzipped |
| Modules bundled | 62 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.128.0'
build     // { version: '0.128.0', hash: 'da2de7741508', date: '2026-11-15' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
