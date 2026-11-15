# sopworld 0.135.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.135.0 |
| Build | 4a2662721ddc |
| Built | 2026-11-15 |
| `sopworld.mjs` (ES module) | 990.9 kB, 288.9 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 988.8 kB, 288.5 kB gzipped |
| Modules bundled | 64 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.135.0'
build     // { version: '0.135.0', hash: '4a2662721ddc', date: '2026-11-15' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
