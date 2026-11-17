# sopworld 0.202.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.202.0 |
| Build | de477e943b20 |
| Built | 2026-11-17 |
| `sopworld.mjs` (ES module) | 1513.6 kB, 427.3 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1510.3 kB, 426.6 kB gzipped |
| Modules bundled | 92 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.202.0'
build     // { version: '0.202.0', hash: 'de477e943b20', date: '2026-11-17' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
