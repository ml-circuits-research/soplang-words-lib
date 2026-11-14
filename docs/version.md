# sopworld 0.52.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.52.0 |
| Build | c1f4d8ca7c1f |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 614.5 kB, 174.2 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 613.9 kB, 174.1 kB gzipped |
| Modules bundled | 30 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.52.0'
build     // { version: '0.52.0', hash: 'c1f4d8ca7c1f', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
