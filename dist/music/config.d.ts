/**
 * Music part: the track catalogue and defaults. Pure data, no imports.
 *
 * Every track is a real recording with a licence that allows use in a game.
 * Kevin MacLeod tracks are CC BY 4.0 (credit required, shortened for the lobby);
 * the Musopen Chopin recordings are public domain (CC0). Full list with sources:
 * CREDITS.md next to this file.
 */
/** Music styles, in the order a picker should list them. */
export declare const MUSIC_STYLES: readonly [{
    readonly id: 'piano';
    readonly label: 'Peaceful classical piano';
}, {
    readonly id: 'chill';
    readonly label: 'Chill';
}, {
    readonly id: 'adventure';
    readonly label: 'Adventure';
}, {
    readonly id: 'prog';
    readonly label: 'Progressive rock';
}, {
    readonly id: 'hardrock';
    readonly label: 'Hard rock';
}, {
    readonly id: 'house';
    readonly label: 'Electronic house';
}, {
    readonly id: 'disco';
    readonly label: 'Disco';
}, {
    readonly id: 'funk';
    readonly label: 'Funk';
}, {
    readonly id: 'country';
    readonly label: 'Country';
}];
export type MusicStyle = (typeof MUSIC_STYLES)[number]['id'];
export interface MusicTrack {
    /** Stable id; the file is `<baseUrl><id>.mp3`. Never reuse an id for a different recording. */
    readonly id: string;
    readonly title: string;
    /** Composer and/or performer, as credited. */
    readonly by: string;
    readonly style: MusicStyle;
    /** One-line credit, shown in the game's credits (required for CC BY tracks). */
    readonly credit: string;
}
/** Every track the part ships with (files in the game's public `music/` folder). */
export declare const MUSIC_TRACKS: readonly MusicTrack[];
/** Options for `new MusicPlayer(...)`; anything left out takes these defaults. */
export interface MusicConfig {
    /** The catalogue to play from. */
    tracks: readonly MusicTrack[];
    /** Where the files are served, ending in `/` (file = `<baseUrl><id>.mp3`). */
    baseUrl: string;
    /** localStorage key prefix for the player's own volume and on/off (e.g. `sky.music`). */
    storagePrefix: string;
    /** Music volume 0..1 before the player changes it. */
    volume: number;
    /** Seconds to fade in and out. */
    fade: number;
}
/** Tracks ticked when nobody has picked any: the peaceful piano set. */
export declare const DEFAULT_TRACK_IDS: readonly string[];
export declare const DEFAULT_MUSIC_CONFIG: MusicConfig;
