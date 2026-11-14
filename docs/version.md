# sopworld 0.100.0

The single-file build in this folder.

| | |
| --- | --- |
| Version | 0.100.0 |
| Build | c67f323c1573 |
| Built | 2026-11-14 |
| `sopworld.mjs` (ES module) | 831.6 kB, 239.4 kB gzipped |
| `sopworld.js` (global `sopworld`, CommonJS) | 830.1 kB, 239.2 kB gzipped |
| Modules bundled | 49 |

"Build" is a fingerprint of the bundled sources: two files with the same build are the
same code. The loaded library says the same thing about itself:

```js
import { version, build } from './sopworld.mjs';
version   // '0.100.0'
build     // { version: '0.100.0', hash: 'c67f323c1573', date: '2026-11-14' }
```

In a page that loads `sopworld.js` it is `sopworld.version` and `sopworld.build`. The
first line of each file carries it too. What changed in this version: CHANGELOG.md in
the repository.
