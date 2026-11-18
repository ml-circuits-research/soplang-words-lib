# sopworld 0.212.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.212.0 |
| Build | c54948eab8e0 |
| Built | 2026-11-18 |
| `sopworld.mjs` (ES module) | 1606.8 kB, 451.1 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 1603.5 kB, 450.4 kB gzipped |
| Modules bundled | 103 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.212.0'
build     // { version: '0.212.0', hash: 'c54948eab8e0', date: '2026-11-18' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
