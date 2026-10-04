/** Ranked data of one map difficulty on ScoreSaber. */
export interface ScoreSaberMapInfo {
    stars: number;
    /** PP at 95% accuracy with the standard curve (the API calls it "maxPP"). */
    maxPP: number;
    /**
     * Whether positive modifiers (FS, DA, GN) count on this leaderboard.
     * Only true on a couple of ranked maps; elsewhere they are ignored.
     */
    positiveModifiers: boolean;
}

/** Pass/acc/tech ratings of a BeatLeader difficulty. */
export interface BeatLeaderRatings {
    passRating: number;
    accRating: number;
    techRating: number;
}

/** BeatLeader modifier score values, keyed by lowercase modifier code (e.g. `na: -0.3`). */
export type BeatLeaderModifierValues = Partial<Record<string, number>>;

/** Ranked data of one map difficulty on BeatLeader. */
export interface BeatLeaderMapInfo extends BeatLeaderRatings {
    stars: number;
    modifierValues: BeatLeaderModifierValues;
    /** Dedicated ratings for speed modifiers; null when unknown (fallback sources). */
    speedRatings: Record<"fs" | "sf" | "ss", BeatLeaderRatings> | null;
}

/** Where the ranked data of a platform came from (most to least accurate). */
export type RankedDataSource = "api" | "index" | "dump" | "beatsaver" | "mock";

export interface RankedPlatformData<T> {
    info: T;
    source: RankedDataSource;
}

/** Ranked data of the map currently played. A null platform means "not ranked there". */
export interface MapRankedData {
    key: string;
    scoresaber: RankedPlatformData<ScoreSaberMapInfo> | null;
    beatleader: RankedPlatformData<BeatLeaderMapInfo> | null;
}

export interface LivePlatformPP {
    /** Star rating rounded to 1 decimal, for display. */
    stars: number;
    pp: number;
}

export interface LivePP {
    isRanked: boolean;
    isLoading: boolean;
    scoresaber: LivePlatformPP | null;
    beatleader: LivePlatformPP | null;
}
