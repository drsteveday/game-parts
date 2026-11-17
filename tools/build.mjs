// Build: `npm run build` runs `tsc -p tsconfig.build.json` (every part to dist/<part>/ as
// plain JS + .d.ts), then this file:
// - adds `.js` to relative imports in dist, so the files also load in plain Node ESM
//   (parts keep extensionless imports in src, the same as inside a game);
// - copies each part's README, CREDITS and CSS beside its built files.
import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { partNames, root } from './parts.mjs';

const REL = /((?:from|import)\s*\(?\s*['"])(\.{1,2}\/[^'"]+?)(['"])/g;

function fixImports(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) fixImports(p);
    else if (e.name.endsWith('.js') || e.name.endsWith('.d.ts')) {
      const src = readFileSync(p, 'utf8');
      const out = src.replace(REL, (m, a, spec, b) => {
        if (/\.(js|json|css)$/.test(spec)) return m;
        const base = `${dir}/${spec}`;
        const ext = existsSync(`${base}.js`) || existsSync(`${base}.d.ts`) ? '.js' : '/index.js';
        return `${a}${spec}${ext}${b}`;
      });
      if (out !== src) writeFileSync(p, out);
    }
  }
}

fixImports(`${root}dist`);
for (const part of partNames()) {
  for (const f of readdirSync(`${root}src/${part}`)) {
    if (f.endsWith('.md') || f.endsWith('.css'))
      copyFileSync(`${root}src/${part}/${f}`, `${root}dist/${part}/${f}`);
  }
}
console.log(`Built ${partNames().join(', ')} into dist/`);
