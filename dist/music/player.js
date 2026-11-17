import { DEFAULT_MUSIC_CONFIG } from './config.js';
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
    cfg;
    byId;
    playlist = [];
    order = [];
    pos = 0;
    audio = null;
    source = null;
    gain = null;
    out = null;
    wanted = false;
    now = null;
    errors = 0;
    fadeTimer = null;
    waitingForGesture = false;
    _volume;
    _enabled;
    listeners = new Set();
    onVisibility = () => this.visibility();
    onGesture = () => this.gesture();
    constructor(opts = {}) {
        this.cfg = { ...DEFAULT_MUSIC_CONFIG, ...opts };
        this.byId = new Map(this.cfg.tracks.map((t) => [t.id, t]));
        const v = Number(read(this.key('volume')));
        this._volume = read(this.key('volume')) !== null && v >= 0 && v <= 1 ? v : this.cfg.volume;
        this._enabled = read(this.key('on')) !== '0';
        if (typeof document !== 'undefined')
            document.addEventListener('visibilitychange', this.onVisibility);
    }
    /** The catalogue this player knows. */
    get tracks() {
        return this.cfg.tracks;
    }
    /** The track playing now (or fading out), if any. */
    get current() {
        return this.now;
    }
    /** Whether the player wants music now (between `start()` and `stop()`). */
    get started() {
        return this.wanted;
    }
    /** Music volume 0..1 (saved). */
    get volume() {
        return this._volume;
    }
    set volume(v) {
        this._volume = Math.min(1, Math.max(0, v));
        write(this.key('volume'), String(this._volume));
        if (this.now)
            this.applyLevel(this._volume);
        this.emit();
    }
    /** The player's own music on/off (saved). Off stops the music; on resumes it if started. */
    get enabled() {
        return this._enabled;
    }
    set enabled(on) {
        this._enabled = on;
        write(this.key('on'), on ? '1' : '0');
        if (!on)
            this.halt();
        else if (this.wanted && !this.now)
            this.playNext();
        this.emit();
    }
    /** Called whenever the track, volume or on/off changes. Returns an unsubscribe. */
    onChange(fn) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }
    /** Route the music through a Web Audio node (call again with null to go back to the element's volume). */
    connect(out) {
        this.out = out;
        if (this.audio && out)
            this.attachGraph(this.audio);
    }
    /** The tracks to shuffle through (unknown ids are ignored). Takes effect from the next track. */
    setPlaylist(ids) {
        const next = ids.filter((id) => this.byId.has(id));
        if (next.join() === this.playlist.join())
            return;
        this.playlist = next;
        this.order = [];
        this.pos = 0;
        if (!next.length)
            this.halt();
        else if (this.wanted && this.now && !next.includes(this.now.id))
            this.playNext();
        else if (this.wanted && !this.now)
            this.playNext();
    }
    /** Start (or keep) playing. Waits for the first tap or key press if the browser blocks autoplay. */
    start() {
        this.wanted = true;
        if (!this.now)
            this.playNext();
    }
    /** Fade out and stop. The next `start()` begins a new track. */
    stop() {
        this.wanted = false;
        this.halt();
    }
    /** Skip to another track. */
    next() {
        if (this.wanted)
            this.playNext();
    }
    /** Play one track now, whatever is ticked (an admin preview). `stop()` ends it. */
    preview(id) {
        const t = this.byId.get(id);
        if (!t)
            return;
        this.wanted = true;
        this.play(t);
    }
    /** Stop and let go of the audio element and listeners. */
    dispose() {
        this.stop();
        if (typeof document !== 'undefined')
            document.removeEventListener('visibilitychange', this.onVisibility);
        this.unwaitGesture();
        this.listeners.clear();
    }
    key(name) {
        return `${this.cfg.storagePrefix}.${name}`;
    }
    emit() {
        for (const fn of this.listeners)
            fn();
    }
    /** The next track id in a shuffled order that doesn't repeat the one just played. */
    pick() {
        if (!this.playlist.length)
            return null;
        if (this.pos >= this.order.length) {
            const fresh = shuffle([...this.playlist]);
            const last = this.now?.id;
            if (fresh.length > 1 && fresh[0] === last)
                fresh.push(fresh.shift());
            this.order = fresh;
            this.pos = 0;
        }
        return this.byId.get(this.order[this.pos++]) ?? null;
    }
    playNext() {
        if (!this._enabled || !this.wanted)
            return;
        const t = this.pick();
        if (t)
            this.play(t);
    }
    play(t) {
        if (typeof Audio === 'undefined')
            return;
        this.clearTimers();
        const a = this.element();
        this.now = t;
        a.src = `${this.cfg.baseUrl}${t.id}.mp3`;
        this.applyLevel(0);
        this.tryPlay(a);
        this.emit();
    }
    tryPlay(a) {
        if (this.out?.ctx.state === 'suspended')
            void this.out.ctx.resume();
        a.play().then(() => {
            this.unwaitGesture();
            this.fadeTo(this._volume);
        }, (err) => {
            // Autoplay blocked until the player taps or presses a key; other errors fire 'error'.
            if (err?.name === 'NotAllowedError')
                this.waitGesture();
        });
    }
    element() {
        if (this.audio)
            return this.audio;
        const a = new Audio();
        a.preload = 'none';
        a.addEventListener('ended', () => {
            this.errors = 0;
            this.now = null;
            this.playNext();
        });
        a.addEventListener('error', () => {
            if (!this.now)
                return;
            this.now = null;
            // A missing or broken file: try another, but give up after one pass of the list.
            if (++this.errors < Math.max(1, this.playlist.length))
                this.playNext();
            else
                this.emit();
        });
        a.addEventListener('playing', () => (this.errors = 0));
        this.audio = a;
        if (this.out)
            this.attachGraph(a);
        return a;
    }
    attachGraph(a) {
        if (!this.out)
            return;
        try {
            if (!this.source || this.source.context !== this.out.ctx) {
                this.source = this.out.ctx.createMediaElementSource(a);
                this.gain = this.out.ctx.createGain();
                this.source.connect(this.gain);
            }
            this.gain.disconnect();
            this.gain.connect(this.out.node);
            a.volume = 1;
            this.applyLevel(this.now ? this._volume : 0);
        }
        catch {
            // Some browsers refuse; the element's own volume still works there.
            this.source = null;
            this.gain = null;
        }
    }
    applyLevel(v) {
        if (this.gain) {
            const g = this.gain.gain;
            g.cancelScheduledValues(this.gain.context.currentTime);
            g.value = v;
        }
        else if (this.audio)
            this.audio.volume = v;
    }
    /**
     * Ramp to `target` over the fade time, then call `done`. With Web Audio the
     * ramp runs on the audio thread, so a busy frame (building a match) can't
     * stretch it. Without it, fades are skipped (the volume just changes).
     */
    fadeTo(target, done) {
        this.clearTimers();
        const g = this.gain;
        if (!g) {
            if (this.audio)
                this.audio.volume = target;
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
    halt() {
        this.unwaitGesture();
        const a = this.audio;
        if (!a || !this.now) {
            this.now = null;
            return;
        }
        this.now = null;
        this.emit();
        this.fadeTo(0, () => {
            if (this.now)
                return; // something new started meanwhile
            a.pause();
            a.removeAttribute('src');
            a.load();
        });
    }
    clearTimers() {
        if (this.fadeTimer)
            clearTimeout(this.fadeTimer);
        this.fadeTimer = null;
    }
    visibility() {
        const a = this.audio;
        if (!a || !this.now)
            return;
        // No music in a background tab (saves battery); carry on when it comes back.
        if (document.hidden)
            a.pause();
        else
            this.tryPlay(a);
    }
    waitGesture() {
        if (this.waitingForGesture || typeof window === 'undefined')
            return;
        this.waitingForGesture = true;
        for (const ev of GESTURES)
            window.addEventListener(ev, this.onGesture, true);
    }
    unwaitGesture() {
        if (!this.waitingForGesture)
            return;
        this.waitingForGesture = false;
        for (const ev of GESTURES)
            window.removeEventListener(ev, this.onGesture, true);
    }
    gesture() {
        this.unwaitGesture();
        if (this.audio && this.now)
            this.tryPlay(this.audio);
    }
}
const GESTURES = ['pointerdown', 'touchend', 'click', 'keydown'];
function shuffle(xs) {
    for (let i = xs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [xs[i], xs[j]] = [xs[j], xs[i]];
    }
    return xs;
}
function read(key) {
    try {
        return localStorage.getItem(key);
    }
    catch {
        return null;
    }
}
function write(key, value) {
    try {
        localStorage.setItem(key, value);
    }
    catch {
        // Private mode etc.; the setting just isn't remembered.
    }
}
