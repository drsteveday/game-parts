// The list of parts: every folder in src/ is one part, with index.ts as its only entry.
import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('..', import.meta.url));

export function partNames() {
  return readdirSync(`${root}src`)
    .filter((n) => statSync(`${root}src/${n}`).isDirectory())
    .sort();
}
