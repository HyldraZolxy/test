import { INITIAL_ENERGY } from "../config";
import { calculateNotesFromMaxScore } from "../utils/format";
import type {
    BeatmapInfo,
    BSEvent,
    ConnectionState,
    EventName,
    GameInfo,
    ModInfo,
    Performance,
} from "./protocol";

/** Full game state derived from the HttpSiraStatus event stream. */
export interface GameState {
    connection: ConnectionState;
    inSong: boolean;
    game: GameInfo | null;
    beatmap: BeatmapInfo | null;
    performance: Performance | null;
    mod: ModInfo | null;
    /** Current energy, 0..1. */
    energy: number;
    lastEvent: EventName | null;
}

export const INITIAL_GAME_STATE: GameState = {
    connection: "disconnected",
    inSong: false,
    game: null,
    beatmap: null,
    performance: null,
    mod: null,
    energy: INITIAL_ENERGY,
    lastEvent: null,
};

/** Events that end the current song and bring the player back to the menu. */
const SONG_END_EVENTS: ReadonlySet<EventName> = new Set(["finished", "failed", "menu"]);

/** Events that can only happen while a song is playing. */
const IN_SONG_EVENTS: ReadonlySet<EventName> = new Set([
    "noteCut",
    "noteFullyCut",
    "noteMissed",
    "noteSpawned",
    "bombCut",
    "bombMissed",
    "obstacleEnter",
    "obstacleExit",
    "scoreChanged",
    "beatmapEvent",
    "energyChanged",
    "pause",
    "resume",
    "softFailed",
]);

/** Events that change what is on screen and should be rendered without batching. */
export function isLifecycleEvent(event: EventName): boolean {
    return event === "songStart" || SONG_END_EVENTS.has(event);
}

/**
 * Applies the connection state reported by the event source.
 * Leaving the "connected" state also leaves the song.
 */
export function reduceConnection(state: GameState, connection: ConnectionState): GameState {
    if (state.connection === connection) return state;
    return {
        ...state,
        connection,
        inSong: connection === "connected" ? state.inSong : false,
    };
}

/**
 * Pure reducer: folds one HttpSiraStatus event into the game state.
 * Returns the same reference when nothing changed.
 */
export function reduceEvent(state: GameState, data: BSEvent): GameState {
    const incoming = data.status ?? {};
    const isSongStart = data.event === "songStart";
    const isSongEnd = SONG_END_EVENTS.has(data.event);
    const isMenu = data.event === "menu";

    // 1. In-song flag: explicit lifecycle events first, then scene, then implicit gameplay events
    let inSong = state.inSong;
    if (isSongStart) inSong = true;
    else if (isSongEnd) inSong = false;
    else if (IN_SONG_EVENTS.has(data.event)) inSong = true;

    if (incoming.game?.scene === "Menu") inSong = false;
    else if (incoming.game?.scene === "Song") inSong = true;

    // 2. Game info, with the scene kept consistent with lifecycle events
    let game = state.game;
    if (incoming.game) game = { ...(state.game ?? {}), ...incoming.game } as GameInfo;
    if (isSongStart) {
        game = {
            pluginVersion: game?.pluginVersion ?? "",
            gameVersion: game?.gameVersion ?? "",
            mode: game?.mode ?? "Solo",
            scene: "Song",
        };
    } else if (isSongEnd && game) {
        game = { ...game, scene: "Menu" };
    }

    // 3. Modifiers (needed before beatmap to recover the note count)
    let mod = state.mod;
    if (incoming.mod !== undefined) mod = { ...(state.mod ?? {}), ...incoming.mod } as ModInfo;

    // 4. Beatmap
    let beatmap = state.beatmap;
    if (incoming.beatmap === null) {
        beatmap = null;
    } else if (incoming.beatmap !== undefined) {
        let notesCount = incoming.beatmap.notesCount || state.beatmap?.notesCount || 0;
        const maxScore = incoming.beatmap.maxScore || state.beatmap?.maxScore;
        if (!notesCount && maxScore) {
            notesCount = calculateNotesFromMaxScore(maxScore, mod?.multiplier ?? 1);
        }
        beatmap = { ...(state.beatmap ?? {}), ...incoming.beatmap, notesCount } as BeatmapInfo;
    }
    if (isMenu) beatmap = null;

    // 5. Performance
    let performance = state.performance;
    if (incoming.performance !== undefined) {
        performance = incoming.performance
            ? ({ ...(state.performance ?? {}), ...incoming.performance } as Performance)
            : null;
    }
    if (data.event === "softFailed" && performance && !performance.softFailed) {
        performance = { ...performance, softFailed: true };
    }
    if (isMenu) performance = null;

    // 6. Energy: explicit values first, then lifecycle overrides
    let energy = state.energy;
    const perfEnergy = incoming.performance?.energy;
    if (typeof perfEnergy === "number") energy = perfEnergy;
    else if (data.event === "energyChanged" && typeof incoming.energy === "number") energy = incoming.energy;
    if (isSongStart) energy = INITIAL_ENERGY;
    if (data.event === "failed") energy = 0;

    if (
        inSong === state.inSong &&
        game === state.game &&
        mod === state.mod &&
        beatmap === state.beatmap &&
        performance === state.performance &&
        energy === state.energy &&
        data.event === state.lastEvent
    ) {
        return state;
    }

    return {
        connection: state.connection,
        inSong,
        game,
        beatmap,
        performance,
        mod,
        energy,
        lastEvent: data.event,
    };
}
