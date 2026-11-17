// Size check: reports each part's built size (all .js in dist/<part>/, raw and gzipped)
// against sizes.json, and fails if a part grew by more than 10% (gzipped) unless the
// "## Unreleased" section of CHANGELOG.md has a line naming the part and the word "size",
// e.g. "- music: size grows 15% for the new crossfade (one-off)."
// `npm run size -- --update` writes the current sizes to sizes.json (done for each release).
// Run `npm run build` first.
import { appendFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { partNames, root } from './parts.mjs';

const LIMIT = 1.1;
const baseFile = `${root}sizes.json`;
const base = existsSync(baseFile) ? JSON.parse(readFileSync(baseFile, 'utf8')) : {};

function measure(dir) {
  let raw = 0;
  let gzip = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) {
      const s = measure(p);
      raw += s.raw;
      gzip += s.gzip;
    } else if (e.name.endsWith('.js')) {
      const buf = readFileSync(p);
      raw += buf.length;
      gzip += gzipSync(buf, { level: 9 }).length;
    }
  }
  return { raw, gzip };
}

function unreleasedNotes() {
  const f = `${root}CHANGELOG.md`;
  if (!existsSync(f)) return '';
  const text = readFileSync(f, 'utf8');
  const m = text.match(/^## Unreleased\s*$([\s\S]*?)(?=^## |(?![\s\S]))/m);
  return m ? m[1] : '';
}

if (!existsSync(`${root}dist`)) {
  console.error('No dist/ folder: run `npm run build` first.');
  process.exit(1);
}

const notes = unreleasedNotes()
  .split('\n')
  .map((l) => l.toLowerCase());
const now = {};
const rows = ['| Part | Size | Gzipped | Before (gzipped) | Change |', '|---|---|---|---|---|'];
const failures = [];
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

for (const part of partNames()) {
  if (!existsSync(`${root}dist/${part}`)) {
    failures.push(`${part}: not built`);
    continue;
  }
  const s = measure(`${root}dist/${part}`);
  now[part] = s;
  const before = base[part]?.gzip;
  let change = 'new';
  if (before) {
    const ratio = s.gzip / before;
    change = `${ratio >= 1 ? '+' : ''}${((ratio - 1) * 100).toFixed(1)}%`;
    const noted = notes.some((l) => l.includes(part) && l.includes('size'));
    if (ratio > LIMIT && !noted)
      failures.push(
        `${part} grew ${change} (limit 10%). Make it smaller, or add a line under "## Unreleased" in CHANGELOG.md naming "${part}" and the word "size" with the reason.`,
      );
    else if (ratio > LIMIT) change += ' (noted in CHANGELOG)';
  }
  rows.push(
    `| ${part} | ${kb(s.raw)} | ${kb(s.gzip)} | ${before ? kb(before) : '-'} | ${change} |`,
  );
}

const table = rows.join('\n');
console.log(table);
if (process.env.GITHUB_STEP_SUMMARY)
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Part sizes\n\n${table}\n`);

if (process.argv.includes('--update')) {
  writeFileSync(baseFile, `${JSON.stringify(now, null, 2)}\n`);
  console.log('sizes.json updated.');
} else if (failures.length) {
  for (const f of failures) console.error(`Size check failed: ${f}`);
  process.exit(1);
}
