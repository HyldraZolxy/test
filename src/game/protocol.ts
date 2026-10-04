/**
 * Wire types of the HttpSiraStatus WebSocket protocol.
 *
 * @see https://github.com/denpadokei/HttpSiraStatus/blob/master/protocol.md
 * @see https://github.com/denpadokei/HttpSiraStatus/blob/master/HttpSiraStatus/Models/GamePlayDataManager.cs
 */

export type ConnectionState = "connecting" | "connected" | "disconnected";
export type Scene = "Menu" | "Song" | "Spectator";
export type Difficulty = "Easy" | "Normal" | "Hard" | "Expert" | "ExpertPlus";
export type Rank = "SSS" | "SS" | "S" | "A" | "B" | "C" | "D" | "E";
export type SongSpeed = "Normal" | "Slower" | "Faster" | "SuperFast";

export type EventName =
    | "hello"
    | "songStart"
    | "finished"
    | "failed"
    | "softFailed"
    | "menu"
    | "pause"
    | "resume"
    | "noteCut"
    | "noteFullyCut"
    | "noteMissed"
    | "noteSpawned"
    | "bombCut"
    | "bombMissed"
    | "obstacleEnter"
    | "obstacleExit"
    | "scoreChanged"
    | "beatmapEvent"
    | "energyChanged";

export interface GameInfo {
    pluginVersion: string;
    gameVersion: string;
    scene: Scene;
    mode: null | "Solo" | "Party" | "Multiplayer";
}

/** Color as sent by the game: either 0..1 floats or 0..255 integers. */
export type RGB = [number, number, number];

export interface BeatmapColors {
    saberA?: RGB;
    saberB?: RGB;
    environment0?: RGB;
    environment1?: RGB;
    obstacle?: RGB;
}

export interface BeatmapInfo {
    songName: string;
    songSubName: string;
    songAuthorName: string;
    levelAuthorName: string;
    /** Base64-encoded cover image, or null. */
    songCover: string | null;
    /** Level hash; null for OST and WIP songs. */
    songHash: string | null;
    songBPM: number;
    /** Epoch (ms) at which the song started. */
    start: number | null;
    /** Epoch (ms) at which the song was paused, or null while playing. */
    paused: number | null;
    /** Song length in milliseconds. */
    length: number;
    difficulty: string;
    difficultyEnum: Difficulty;
    characteristic: string;
    notesCount: number;
    /** Max reachable score, already multiplied by the active modifiers. */
    maxScore: number;
    maxRank: Rank;
    color?: BeatmapColors | null;
}

export interface Performance {
    /** Score after combo multiplier, before modifiers. */
    rawScore: number;
    /** Score after modifiers. */
    score: number;
    /** Max score reachable so far, after modifiers. */
    currentMaxScore: number;
    rank: Rank;
    /**
     * Accuracy (0..1) computed by the game. Score and max share the modifier multiplier,
     * so this value is modifier-neutral.
     */
    relativeScore: number;
    passedNotes: number;
    hitNotes: number;
    missedNotes: number;
    combo: number;
    maxCombo: number;
    multiplier: number;
    multiplierProgress: number;
    batteryEnergy: number | null;
    /** Current song time in seconds. */
    currentSongTime: number;
    /** True once energy hit 0 with No Fail enabled. */
    softFailed: boolean;
    /** Energy (0..1); only present on some events. */
    energy?: number;
}

export interface ModInfo {
    /** Total score multiplier of the active modifiers (recomputed after a soft fail). */
    multiplier: number;
    obstacles: false | string;
    instaFail: boolean;
    noFail: boolean;
    batteryEnergy: boolean;
    batteryLives: number | null;
    disappearingArrows: boolean;
    noBombs: boolean;
    songSpeed: SongSpeed;
    songSpeedMultiplier: number;
    noArrows: boolean;
    ghostNotes: boolean;
    failOnSaberClash: boolean;
    strictAngles: boolean;
    fastNotes: boolean;
    smallNotes: boolean;
    proMode: boolean;
    zenMode: boolean;
}

export interface Status {
    game: GameInfo;
    beatmap: BeatmapInfo | null;
    performance: Performance | null;
    mod: ModInfo;
}

/** A message received on the HttpSiraStatus WebSocket. */
export interface BSEvent {
    event: EventName;
    /** Epoch (ms) at which the event was emitted. */
    time: number;
    status: Partial<Status> & { energy?: number };
}
