// Parts guard: every folder in src/ follows the part rules (README.md "Part rules").
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs helper without types
import { partNames, root } from './parts.mjs';

const pkg = JSON.parse(readFileSync(`${root}package.json`, 'utf8')) as {
  exports: Record<string, { types: string; import: string } | string>;
};
const parts = partNames() as string[];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) return sourceFiles(p);
    return e.name.endsWith('.ts') ? [p] : [];
  });
}

const IMPORT = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]/g;

describe('part rules', () => {
  it('has at least one part', () => {
    expect(parts.length).toBeGreaterThan(0);
  });

  for (const part of parts) {
    const dir = `${root}src/${part}`;

    it(`${part}: has index.ts, config.ts, README.md and a test`, () => {
      for (const f of ['index.ts', 'config.ts', 'README.md'])
        expect(existsSync(`${dir}/${f}`), `${part}/${f}`).toBe(true);
      expect(sourceFiles(dir).some((f) => f.endsWith('.test.ts'))).toBe(true);
    });

    it(`${part}: imports only from inside src/ and from three`, () => {
      for (const file of sourceFiles(dir)) {
        if (file.endsWith('.test.ts')) continue;
        const text = readFileSync(file, 'utf8');
        for (const m of text.matchAll(IMPORT)) {
          const spec = (m[1] ?? m[2])!;
          if (spec === 'three' || spec.startsWith('three/')) continue;
          expect(spec.startsWith('.'), `${relative(root, file)} imports "${spec}"`).toBe(true);
          const target = relative(`${root}src`, resolve(dirname(file), spec));
          expect(target.startsWith('..'), `${relative(root, file)} reaches outside src/`).toBe(
            false,
          );
          // Another part only through its index.ts.
          const [other, ...rest] = target.split(/[\\/]/);
          if (other !== part)
            expect(rest.length === 0 || rest.join('/') === 'index', `${relative(root, file)}`).toBe(
              true,
            );
        }
      }
    });

    it(`${part}: is exported from package.json with types`, () => {
      const e = pkg.exports[`./${part}`];
      expect(e, `exports["./${part}"]`).toEqual({
        types: `./dist/${part}/index.d.ts`,
        import: `./dist/${part}/index.js`,
      });
    });
  }

  it('exports no part that does not exist', () => {
    for (const key of Object.keys(pkg.exports)) {
      const e = pkg.exports[key];
      if (typeof e === 'string') continue;
      expect(parts).toContain(key.slice(2));
    }
  });
});
