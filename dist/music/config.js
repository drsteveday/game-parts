/**
 * Music part: the track catalogue and defaults. Pure data, no imports.
 *
 * Every track is a real recording with a licence that allows use in a game.
 * Kevin MacLeod tracks are CC BY 4.0 (credit required, shortened for the lobby);
 * the Musopen Chopin recordings are public domain (CC0). Full list with sources:
 * CREDITS.md next to this file.
 */
/** Music styles, in the order a picker should list them. */
export const MUSIC_STYLES = [
    { id: 'piano', label: 'Peaceful classical piano' },
    { id: 'chill', label: 'Chill' },
    { id: 'adventure', label: 'Adventure' },
    { id: 'prog', label: 'Progressive rock' },
    { id: 'hardrock', label: 'Hard rock' },
    { id: 'house', label: 'Electronic house' },
    { id: 'disco', label: 'Disco' },
    { id: 'funk', label: 'Funk' },
    { id: 'country', label: 'Country' },
];
const KEVIN = (title) => `"${title}" by Kevin MacLeod (incompetech.com), CC BY 4.0 (creativecommons.org/licenses/by/4.0), shortened`;
/** Every track the part ships with (files in the game's public `music/` folder). */
export const MUSIC_TRACKS = [
    // Peaceful classical piano
    {
        id: 'chopin-nocturne-op9-2',
        title: 'Nocturne in E-flat, Op. 9 No. 2',
        by: 'Chopin, played by Frank Lévy',
        style: 'piano',
        credit: 'Chopin, Nocturne in E-flat, Op. 9 No. 2, played by Frank Lévy (Musopen, The Complete Works of Frédéric Chopin), public domain (CC0), shortened',
    },
    {
        id: 'chopin-nocturne-op27-2',
        title: 'Nocturne in D-flat, Op. 27 No. 2',
        by: 'Chopin, played by Frank Lévy',
        style: 'piano',
        credit: 'Chopin, Nocturne in D-flat, Op. 27 No. 2, played by Frank Lévy (Musopen, The Complete Works of Frédéric Chopin), public domain (CC0), shortened',
    },
    {
        id: 'chopin-berceuse',
        title: 'Berceuse, Op. 57',
        by: 'Chopin, played by Olga Gurevich',
        style: 'piano',
        credit: 'Chopin, Berceuse, Op. 57, played by Olga Gurevich (Musopen, The Complete Works of Frédéric Chopin), public domain (CC0), shortened',
    },
    {
        id: 'chopin-raindrop',
        title: '"Raindrop" Prelude, Op. 28 No. 15',
        by: 'Chopin, played by Jeannette Fang',
        style: 'piano',
        credit: 'Chopin, Raindrop Prelude, Op. 28 No. 15, played by Jeannette Fang (Musopen, The Complete Works of Frédéric Chopin), public domain (CC0), shortened',
    },
    {
        id: 'satie-gymnopedie-1',
        title: 'Gymnopédie No. 1',
        by: 'Satie, recorded by Kevin MacLeod',
        style: 'piano',
        credit: KEVIN('Gymnopedie No. 1'),
    },
    {
        id: 'bach-prelude-c',
        title: 'Prelude in C (BWV 846)',
        by: 'Bach, recorded by Kevin MacLeod',
        style: 'piano',
        credit: KEVIN('Prelude in C (BWV 846)'),
    },
    // Chill
    {
        id: 'study-and-relax',
        title: 'Study and Relax',
        by: 'Kevin MacLeod',
        style: 'chill',
        credit: KEVIN('Study And Relax'),
    },
    {
        id: 'chill-wave',
        title: 'Chill Wave',
        by: 'Kevin MacLeod',
        style: 'chill',
        credit: KEVIN('Chill Wave'),
    },
    {
        id: 'fireflies-and-stardust',
        title: 'Fireflies and Stardust',
        by: 'Kevin MacLeod',
        style: 'chill',
        credit: KEVIN('Fireflies and Stardust'),
    },
    // Adventure
    {
        id: 'call-to-adventure',
        title: 'Call to Adventure',
        by: 'Kevin MacLeod',
        style: 'adventure',
        credit: KEVIN('Call to Adventure'),
    },
    {
        id: 'adventures-in-adventureland',
        title: 'Adventures in Adventureland',
        by: 'Kevin MacLeod',
        style: 'adventure',
        credit: KEVIN('Adventures in Adventureland'),
    },
    // Progressive rock
    {
        id: 'slow-burn',
        title: 'Slow Burn',
        by: 'Kevin MacLeod',
        style: 'prog',
        credit: KEVIN('Slow Burn'),
    },
    { id: 'twisted', title: 'Twisted', by: 'Kevin MacLeod', style: 'prog', credit: KEVIN('Twisted') },
    {
        id: 'i-feel-you',
        title: 'I Feel You',
        by: 'Kevin MacLeod',
        style: 'prog',
        credit: KEVIN('I Feel You'),
    },
    // Hard rock
    {
        id: 'big-rock',
        title: 'Big Rock',
        by: 'Kevin MacLeod',
        style: 'hardrock',
        credit: KEVIN('Big Rock'),
    },
    {
        id: 'cool-rock',
        title: 'Cool Rock',
        by: 'Kevin MacLeod',
        style: 'hardrock',
        credit: KEVIN('Cool Rock'),
    },
    {
        id: 'hotrock',
        title: 'Hotrock',
        by: 'Kevin MacLeod',
        style: 'hardrock',
        credit: KEVIN('Hotrock'),
    },
    // Electronic house
    {
        id: 'brain-dance',
        title: 'Brain Dance',
        by: 'Kevin MacLeod',
        style: 'house',
        credit: KEVIN('Brain Dance'),
    },
    {
        id: 'realizer',
        title: 'Realizer',
        by: 'Kevin MacLeod',
        style: 'house',
        credit: KEVIN('Realizer'),
    },
    {
        id: 'getting-it-done',
        title: 'Getting it Done',
        by: 'Kevin MacLeod',
        style: 'house',
        credit: KEVIN('Getting it Done'),
    },
    // Disco
    {
        id: 'disco-con-tutti',
        title: 'Disco con Tutti',
        by: 'Kevin MacLeod',
        style: 'disco',
        credit: KEVIN('Disco con Tutti'),
    },
    {
        id: 'aurea-carmina',
        title: 'Aurea Carmina',
        by: 'Kevin MacLeod',
        style: 'disco',
        credit: KEVIN('Aurea Carmina'),
    },
    {
        id: 'stringed-disco',
        title: 'Stringed Disco',
        by: 'Kevin MacLeod',
        style: 'disco',
        credit: KEVIN('Stringed Disco'),
    },
    // Funk
    {
        id: 'funky-chunk',
        title: 'Funky Chunk',
        by: 'Kevin MacLeod',
        style: 'funk',
        credit: KEVIN('Funky Chunk'),
    },
    {
        id: 'funkorama',
        title: 'Funkorama',
        by: 'Kevin MacLeod',
        style: 'funk',
        credit: KEVIN('Funkorama'),
    },
    {
        id: 'style-funk',
        title: 'Style Funk',
        by: 'Kevin MacLeod',
        style: 'funk',
        credit: KEVIN('Style Funk'),
    },
    // Country
    {
        id: 'bama-country',
        title: 'Bama Country',
        by: 'Kevin MacLeod',
        style: 'country',
        credit: KEVIN('Bama Country'),
    },
    {
        id: 'hillbilly-swing',
        title: 'Hillbilly Swing',
        by: 'Kevin MacLeod',
        style: 'country',
        credit: KEVIN('Hillbilly Swing'),
    },
    {
        id: 'guts-and-bourbon',
        title: 'Guts and Bourbon',
        by: 'Kevin MacLeod',
        style: 'country',
        credit: KEVIN('Guts and Bourbon'),
    },
];
/** Tracks ticked when nobody has picked any: the peaceful piano set. */
export const DEFAULT_TRACK_IDS = MUSIC_TRACKS.filter((t) => t.style === 'piano').map((t) => t.id);
export const DEFAULT_MUSIC_CONFIG = {
    tracks: MUSIC_TRACKS,
    baseUrl: '/music/',
    storagePrefix: 'music',
    volume: 0.5,
    fade: 1.2,
};
