# sopworld 0.54.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.54.0 |
| Build | b0e6cba3be8b |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 622.6 kB, 176.9 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 621.9 kB, 176.7 kB gzipped |
| Modules bundled | 31 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.54.0'
build     // { version: '0.54.0', hash: 'b0e6cba3be8b', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
