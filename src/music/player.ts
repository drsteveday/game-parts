import { DEFAULT_MUSIC_CONFIG, type MusicConfig, type MusicTrack } from './config';

/** Where the music goes when the game has a Web Audio graph (so its master volume and mute apply). */
export interface MusicOutput {
  ctx: AudioContext;
  node: AudioNode;
}

/**
 * Background music for menus and lobbies. Plays the ticked tracks in a shuffled
 * order, one file at a time, streamed by a single `<audio>` element (nothing is
 * downloaded until `start()` and a track actually plays; `preload="none"`).
 *
 * The player keeps its own volume and on/off switch in localStorage under
 * `<storagePrefix>.volume` / `<storagePrefix>.on`. Pass a Web Audio output with
 * `connect()` and the music runs through it (iPad Safari ignores `audio.volume`,
 * a gain node works everywhere); without one it uses the element's volume.
 *
 * Typical use:
 *   const music = new MusicPlayer({ baseUrl: '/music/', storagePrefix: 'game.music' });
 *   music.setPlaylist(['chopin-nocturne-op9-2', 'chill-wave']);
 *   music.start();   // lobby opened
 *   music.stop();    // round starting
 */
export class MusicPlayer {
  private readonly cfg: MusicConfig;
  private readonly byId: Map<string, MusicTrack>;
  private playlist: string[] = [];
  private order: string[] = [];
  private pos = 0;
  private audio: HTMLAudioElement | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private gain: GainNode | null = null;
  private out: MusicOutput | null = null;
  private wanted = false;
  private now: MusicTrack | null = null;
  private errors = 0;
  private fadeTimer: ReturnType<typeof setTimeout> | null = null;
  private waitingForGesture = false;
  private _volume: number;
  private _enabled: boolean;
  private readonly listeners = new Set<() => void>();
  private readonly onVisibility = () => this.visibility();
  private readonly onGesture = () => this.gesture();

  constructor(opts: Partial<MusicConfig> = {}) {
    this.cfg = { ...DEFAULT_MUSIC_CONFIG, ...opts };
    this.byId = new Map(this.cfg.tracks.map((t) => [t.id, t]));
    const v = Number(read(this.key('volume')));
    this._volume = read(this.key('volume')) !== null && v >= 0 && v <= 1 ? v : this.cfg.volume;
    this._enabled = read(this.key('on')) !== '0';
    if (typeof document !== 'undefined')
      document.addEventListener('visibilitychange', this.onVisibility);
  }

  /** The catalogue this player knows. */
  get tracks(): readonly MusicTrack[] {
    return this.cfg.tracks;
  }

  /** The track playing now (or fading out), if any. */
  get current(): MusicTrack | null {
    return this.now;
  }

  /** Whether the player wants music now (between `start()` and `stop()`). */
  get started(): boolean {
    return this.wanted;
  }

  /** Music volume 0..1 (saved). */
  get volume(): number {
    return this._volume;
  }

  set volume(v: number) {
    this._volume = Math.min(1, Math.max(0, v));
    write(this.key('volume'), String(this._volume));
    if (this.now) this.applyLevel(this._volume);
    this.emit();
  }

  /** The player's own music on/off (saved). Off stops the music; on resumes it if started. */
  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(on: boolean) {
    this._enabled = on;
    write(this.key('on'), on ? '1' : '0');
    if (!on) this.halt();
    else if (this.wanted && !this.now) this.playNext();
    this.emit();
  }

  /** Called whenever the track, volume or on/off changes. Returns an unsubscribe. */
  onChange(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Route the music through a Web Audio node (call again with null to go back to the element's volume). */
  connect(out: MusicOutput | null): void {
    this.out = out;
    if (this.audio && out) this.attachGraph(this.audio);
  }

  /** The tracks to shuffle through (unknown ids are ignored). Takes effect from the next track. */
  setPlaylist(ids: readonly string[]): void {
    const next = ids.filter((id) => this.byId.has(id));
    if (next.join() === this.playlist.join()) return;
    this.playlist = next;
    this.order = [];
    this.pos = 0;
    if (!next.length) this.halt();
    else if (this.wanted && this.now && !next.includes(this.now.id)) this.playNext();
    else if (this.wanted && !this.now) this.playNext();
  }

  /** Start (or keep) playing. Waits for the first tap or key press if the browser blocks autoplay. */
  start(): void {
    this.wanted = true;
    if (!this.now) this.playNext();
  }

  /** Fade out and stop. The next `start()` begins a new track. */
  stop(): void {
    this.wanted = false;
    this.halt();
  }

  /** Skip to another track. */
  next(): void {
    if (this.wanted) this.playNext();
  }

  /** Play one track now, whatever is ticked (an admin preview). `stop()` ends it. */
  preview(id: string): void {
    const t = this.byId.get(id);
    if (!t) return;
    this.wanted = true;
    this.play(t);
  }

  /** Stop and let go of the audio element and listeners. */
  dispose(): void {
    this.stop();
    if (typeof document !== 'undefined')
      document.removeEventListener('visibilitychange', this.onVisibility);
    this.unwaitGesture();
    this.listeners.clear();
  }

  private key(name: string): string {
    return `${this.cfg.storagePrefix}.${name}`;
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  /** The next track id in a shuffled order that doesn't repeat the one just played. */
  private pick(): MusicTrack | null {
    if (!this.playlist.length) return null;
    if (this.pos >= this.order.length) {
      const fresh = shuffle([...this.playlist]);
      const last = this.now?.id;
      if (fresh.length > 1 && fresh[0] === last) fresh.push(fresh.shift()!);
      this.order = fresh;
      this.pos = 0;
    }
    return this.byId.get(this.order[this.pos++]!) ?? null;
  }

  private playNext(): void {
    if (!this._enabled || !this.wanted) return;
    const t = this.pick();
    if (t) this.play(t);
  }

  private play(t: MusicTrack): void {
    if (typeof Audio === 'undefined') return;
    this.clearTimers();
    const a = this.element();
    this.now = t;
    a.src = `${this.cfg.baseUrl}${t.id}.mp3`;
    this.applyLevel(0);
    this.tryPlay(a);
    this.emit();
  }

  private tryPlay(a: HTMLAudioElement): void {
    if (this.out?.ctx.state === 'suspended') void this.out.ctx.resume();
    a.play().then(
      () => {
        this.unwaitGesture();
        this.fadeTo(this._volume);
      },
      (err: unknown) => {
        // Autoplay blocked until the player taps or presses a key; other errors fire 'error'.
        if ((err as { name?: string } | null)?.name === 'NotAllowedError') this.waitGesture();
      },
    );
  }

  private element(): HTMLAudioElement {
    if (this.audio) return this.audio;
    const a = new Audio();
    a.preload = 'none';
    a.addEventListener('ended', () => {
      this.errors = 0;
      this.now = null;
      this.playNext();
    });
    a.addEventListener('error', () => {
      if (!this.now) return;
      this.now = null;
      // A missing or broken file: try another, but give up after one pass of the list.
      if (++this.errors < Math.max(1, this.playlist.length)) this.playNext();
      else this.emit();
    });
    a.addEventListener('playing', () => (this.errors = 0));
    this.audio = a;
    if (this.out) this.attachGraph(a);
    return a;
  }

  private attachGraph(a: HTMLAudioElement): void {
    if (!this.out) return;
    try {
      if (!this.source || this.source.context !== this.out.ctx) {
        this.source = this.out.ctx.createMediaElementSource(a);
        this.gain = this.out.ctx.createGain();
        this.source.connect(this.gain);
      }
      this.gain!.disconnect();
      this.gain!.connect(this.out.node);
      a.volume = 1;
      this.applyLevel(this.now ? this._volume : 0);
    } catch {
      // Some browsers refuse; the element's own volume still works there.
      this.source = null;
      this.gain = null;
    }
  }

  private applyLevel(v: number): void {
    if (this.gain) {
      const g = this.gain.gain;
      g.cancelScheduledValues(this.gain.context.currentTime);
      g.value = v;
    } else if (this.audio) this.audio.volume = v;
  }

  /**
   * Ramp to `target` over the fade time, then call `done`. With Web Audio the
   * ramp runs on the audio thread, so a busy frame (building a match) can't
   * stretch it. Without it, fades are skipped (the volume just changes).
   */
  private fadeTo(target: number, done?: () => void): void {
    this.clearTimers();
    const g = this.gain;
    if (!g) {
      if (this.audio) this.audio.volume = target;
      done?.();
      return;
    }
    const t = g.context.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.linearRampToValueAtTime(target, t + this.cfg.fade);
    if (done)
      this.fadeTimer = setTimeout(() => {
        this.fadeTimer = null;
        done();
      }, this.cfg.fade * 1000);
  }

  /** Fade out, then pause and drop the file so nothing keeps downloading. */
  private halt(): void {
    this.unwaitGesture();
    const a = this.audio;
    if (!a || !this.now) {
      this.now = null;
      return;
    }
    this.now = null;
    this.emit();
    this.fadeTo(0, () => {
      if (this.now) return; // something new started meanwhile
      a.pause();
      a.removeAttribute('src');
      a.load();
    });
  }

  private clearTimers(): void {
    if (this.fadeTimer) clearTimeout(this.fadeTimer);
    this.fadeTimer = null;
  }

  private visibility(): void {
    const a = this.audio;
    if (!a || !this.now) return;
    // No music in a background tab (saves battery); carry on when it comes back.
    if (document.hidden) a.pause();
    else this.tryPlay(a);
  }

  private waitGesture(): void {
    if (this.waitingForGesture || typeof window === 'undefined') return;
    this.waitingForGesture = true;
    for (const ev of GESTURES) window.addEventListener(ev, this.onGesture, true);
  }

  private unwaitGesture(): void {
    if (!this.waitingForGesture) return;
    this.waitingForGesture = false;
    for (const ev of GESTURES) window.removeEventListener(ev, this.onGesture, true);
  }

  private gesture(): void {
    this.unwaitGesture();
    if (this.audio && this.now) this.tryPlay(this.audio);
  }
}

const GESTURES = ['pointerdown', 'touchend', 'click', 'keydown'] as const;

function shuffle<T>(xs: T[]): T[] {
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [xs[i], xs[j]] = [xs[j]!, xs[i]!];
  }
  return xs;
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode etc.; the setting just isn't remembered.
  }
}
