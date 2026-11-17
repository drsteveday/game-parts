import { type MusicConfig, type MusicTrack } from './config.js';
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
export declare class MusicPlayer {
    private readonly cfg;
    private readonly byId;
    private playlist;
    private order;
    private pos;
    private audio;
    private source;
    private gain;
    private out;
    private wanted;
    private now;
    private errors;
    private fadeTimer;
    private waitingForGesture;
    private _volume;
    private _enabled;
    private readonly listeners;
    private readonly onVisibility;
    private readonly onGesture;
    constructor(opts?: Partial<MusicConfig>);
    /** The catalogue this player knows. */
    get tracks(): readonly MusicTrack[];
    /** The track playing now (or fading out), if any. */
    get current(): MusicTrack | null;
    /** Whether the player wants music now (between `start()` and `stop()`). */
    get started(): boolean;
    /** Music volume 0..1 (saved). */
    get volume(): number;
    set volume(v: number);
    /** The player's own music on/off (saved). Off stops the music; on resumes it if started. */
    get enabled(): boolean;
    set enabled(on: boolean);
    /** Called whenever the track, volume or on/off changes. Returns an unsubscribe. */
    onChange(fn: () => void): () => void;
    /** Route the music through a Web Audio node (call again with null to go back to the element's volume). */
    connect(out: MusicOutput | null): void;
    /** The tracks to shuffle through (unknown ids are ignored). Takes effect from the next track. */
    setPlaylist(ids: readonly string[]): void;
    /** Start (or keep) playing. Waits for the first tap or key press if the browser blocks autoplay. */
    start(): void;
    /** Fade out and stop. The next `start()` begins a new track. */
    stop(): void;
    /** Skip to another track. */
    next(): void;
    /** Play one track now, whatever is ticked (an admin preview). `stop()` ends it. */
    preview(id: string): void;
    /** Stop and let go of the audio element and listeners. */
    dispose(): void;
    private key;
    private emit;
    /** The next track id in a shuffled order that doesn't repeat the one just played. */
    private pick;
    private playNext;
    private play;
    private tryPlay;
    private element;
    private attachGraph;
    private applyLevel;
    /**
     * Ramp to `target` over the fade time, then call `done`. With Web Audio the
     * ramp runs on the audio thread, so a busy frame (building a match) can't
     * stretch it. Without it, fades are skipped (the volume just changes).
     */
    private fadeTo;
    /** Fade out, then pause and drop the file so nothing keeps downloading. */
    private halt;
    private clearTimers;
    private visibility;
    private waitGesture;
    private unwaitGesture;
    private gesture;
}
