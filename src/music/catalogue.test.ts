import { existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DEFAULT_MUSIC_CONFIG, DEFAULT_TRACK_IDS, MUSIC_STYLES, MUSIC_TRACKS } from './index';

const dir = fileURLToPath(new URL('../../assets/music/', import.meta.url));

describe('music catalogue', () => {
  it('has a small file in assets/music for every track, and no stray files', () => {
    for (const t of MUSIC_TRACKS) {
      const f = `${dir}${t.id}.mp3`;
      expect(existsSync(f), t.id).toBe(true);
      expect(statSync(f).size, t.id).toBeLessThan(2.5 * 1024 * 1024);
    }
    const files = readdirSync(dir).filter((f) => f.endsWith('.mp3'));
    expect(files.sort()).toEqual(MUSIC_TRACKS.map((t) => `${t.id}.mp3`).sort());
  });

  it('has unique ids, a credit line and a known style for each track', () => {
    expect(new Set(MUSIC_TRACKS.map((t) => t.id)).size).toBe(MUSIC_TRACKS.length);
    const styles = MUSIC_STYLES.map((s) => s.id) as string[];
    for (const t of MUSIC_TRACKS) {
      expect(t.credit.length, t.id).toBeGreaterThan(10);
      expect(styles).toContain(t.style);
    }
  });

  it('lists every track in CREDITS.md', async () => {
    const { readFileSync } = await import('node:fs');
    const credits = readFileSync(new URL('./CREDITS.md', import.meta.url), 'utf8');
    for (const t of MUSIC_TRACKS) expect(credits, t.id).toContain(t.id);
  });

  it('ticks the peaceful piano set by default', () => {
    expect(DEFAULT_TRACK_IDS.length).toBeGreaterThan(0);
    for (const id of DEFAULT_TRACK_IDS)
      expect(MUSIC_TRACKS.find((t) => t.id === id)?.style).toBe('piano');
    expect(DEFAULT_MUSIC_CONFIG.baseUrl.endsWith('/')).toBe(true);
  });
});
