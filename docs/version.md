# sopworld 0.23.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.23.0 |
| Build | a3b0feef5d47 |
| Built | 2026-11-13 |
| `sopworld.mjs` (ES module) | 509.3 kB, 144.1 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 509.1 kB, 144.0 kB gzipped |
| Modules bundled | 23 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.23.0'
build     // { version: '0.23.0', hash: 'a3b0feef5d47', date: '2026-11-13' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
