# sopworld 0.249.1

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.249.1 |
| Build | 6c6183e4ec46 |
| Built | 2026-11-21 |
| `sopworld.mjs` (ES module) | 1833.5 kB, 514.0 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1829.8 kB, 513.2 kB gzipped |
| Modules bundled | 116 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.249.1'
build     // { version: '0.249.1', hash: '6c6183e4ec46', date: '2026-11-21' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
