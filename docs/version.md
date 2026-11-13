# sopworld 0.32.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.32.0 |
| Build | 026c6ae27697 |
| Built | 2026-11-13 |
| `sopworld.mjs` (ES module) | 564.3 kB, 160.1 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 563.8 kB, 160.0 kB gzipped |
| Modules bundled | 27 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.32.0'
build     // { version: '0.32.0', hash: '026c6ae27697', date: '2026-11-13' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
