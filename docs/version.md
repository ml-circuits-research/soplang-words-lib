# sopworld 0.90.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.90.0 |
| Build | e3dabf08a71f |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 802.0 kB, 230.6 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 800.8 kB, 230.4 kB gzipped |
| Modules bundled | 46 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.90.0'
build     // { version: '0.90.0', hash: 'e3dabf08a71f', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
