# sopworld 0.63.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.63.0 |
| Build | 1d09dbca9e71 |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 686.4 kB, 195.8 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 685.5 kB, 195.7 kB gzipped |
| Modules bundled | 36 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.63.0'
build     // { version: '0.63.0', hash: '1d09dbca9e71', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
