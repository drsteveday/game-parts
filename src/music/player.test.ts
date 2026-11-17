// MusicPlayer without a browser: a fake <audio> element and localStorage.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MusicPlayer, MUSIC_TRACKS } from './index';

class FakeAudio {
  static made: FakeAudio[] = [];
  preload = '';
  volume = 1;
  src = '';
  paused = true;
  playResult: () => Promise<void> = () => Promise.resolve();
  private handlers = new Map<string, (() => void)[]>();
  constructor() {
    FakeAudio.made.push(this);
  }
  addEventListener(ev: string, fn: () => void) {
    this.handlers.set(ev, [...(this.handlers.get(ev) ?? []), fn]);
  }
  fire(ev: string) {
    for (const fn of this.handlers.get(ev) ?? []) fn();
  }
  play() {
    this.paused = false;
    return this.playResult();
  }
  pause() {
    this.paused = true;
  }
  removeAttribute(name: string) {
    if (name === 'src') this.src = '';
  }
  load() {}
}

const store = new Map<string, string>();
const ids = MUSIC_TRACKS.slice(0, 3).map((t) => t.id);

beforeEach(() => {
  FakeAudio.made = [];
  store.clear();
  vi.useFakeTimers();
  vi.stubGlobal('Audio', FakeAudio);
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('MusicPlayer', () => {
  it('downloads nothing until start(), then plays one ticked track from baseUrl', () => {
    const m = new MusicPlayer({ baseUrl: '/tunes/', storagePrefix: 't' });
    m.setPlaylist(ids);
    expect(FakeAudio.made.length).toBe(0);
    m.start();
    const a = FakeAudio.made[0]!;
    expect(a.preload).toBe('none');
    expect(ids.map((id) => `/tunes/${id}.mp3`)).toContain(a.src);
    expect(m.current && ids.includes(m.current.id)).toBe(true);
  });

  it('ignores unknown ids and stays quiet with an empty playlist', () => {
    const m = new MusicPlayer({ storagePrefix: 't' });
    m.setPlaylist(['no-such-track']);
    m.start();
    expect(m.current).toBeNull();
  });

  it('stop() fades out, then drops the file so nothing keeps streaming', () => {
    const m = new MusicPlayer({ storagePrefix: 't', fade: 1 });
    m.setPlaylist(ids);
    m.start();
    const a = FakeAudio.made[0]!;
    m.stop();
    expect(m.current).toBeNull();
    vi.runAllTimers();
    expect(a.paused).toBe(true);
    expect(a.src).toBe('');
  });

  it('moves to another track when one ends, without repeating it straight away', () => {
    const m = new MusicPlayer({ storagePrefix: 't' });
    m.setPlaylist(ids);
    m.start();
    const first = m.current!.id;
    FakeAudio.made[0]!.fire('ended');
    expect(m.current!.id).not.toBe(first);
  });

  it('gives up after one pass when every file fails', () => {
    const m = new MusicPlayer({ storagePrefix: 't' });
    m.setPlaylist(ids);
    m.start();
    for (let i = 0; i < 5; i++) FakeAudio.made[0]!.fire('error');
    expect(m.current).toBeNull();
  });

  it('saves volume and on/off under the storage prefix and reads them back', () => {
    const m = new MusicPlayer({ storagePrefix: 'game.music' });
    m.volume = 0.25;
    m.enabled = false;
    expect(store.get('game.music.volume')).toBe('0.25');
    expect(store.get('game.music.on')).toBe('0');
    const again = new MusicPlayer({ storagePrefix: 'game.music' });
    expect(again.volume).toBe(0.25);
    expect(again.enabled).toBe(false);
    again.setPlaylist(ids);
    again.start();
    expect(again.current).toBeNull();
  });

  it('clamps volume and tells listeners about changes', () => {
    const m = new MusicPlayer({ storagePrefix: 't' });
    const fn = vi.fn();
    const off = m.onChange(fn);
    m.volume = 7;
    expect(m.volume).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
    off();
    m.volume = 0.5;
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
