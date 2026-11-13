# sopworld 0.14.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.14.0 |
| Build | a01b7bb01ad3 |
| Built | 2026-11-13 |
| `sopworld.mjs` (ES module) | 418.8 kB, 118.9 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 418.6 kB, 118.9 kB gzipped |
| Modules bundled | 19 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.14.0'
build     // { version: '0.14.0', hash: 'a01b7bb01ad3', date: '2026-11-13' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
