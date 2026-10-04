import type { Difficulty } from "../game/protocol";

/** Difficulty names used by BeatLeader, BeatSaver and the ranked index. */
export const DIFFICULTIES: readonly Difficulty[] = ["Easy", "Normal", "Hard", "Expert", "ExpertPlus"];

/** Characteristic names used by BeatLeader and the ranked index. */
export const CHARACTERISTICS = [
    "Standard",
    "OneSaber",
    "NoArrows",
    "90Degree",
    "360Degree",
    "Lightshow",
    "Lawless",
] as const;
export type Characteristic = (typeof CHARACTERISTICS)[number];

/** ScoreSaber encodes difficulties as odd integers. */
export const SCORESABER_DIFFICULTY_IDS: Record<Difficulty, number> = {
    Easy: 1,
    Normal: 3,
    Hard: 5,
    Expert: 7,
    ExpertPlus: 9,
};

/** Normalizes any difficulty spelling ("Expert+", "expertplus", "9"…) to a {@link Difficulty}. */
export function normalizeDifficulty(value: string | null | undefined): Difficulty {
    const clean = (value ?? "").toLowerCase().replace(/[^a-z0-9+]/g, "");
    if (!clean || clean.includes("+") || clean.includes("plus") || clean === "9") return "ExpertPlus";
    if (clean.includes("expert") || clean === "7") return "Expert";
    if (clean.includes("hard") || clean === "5") return "Hard";
    if (clean.includes("normal") || clean === "3") return "Normal";
    if (clean.includes("easy") || clean === "1") return "Easy";
    return "ExpertPlus";
}

/** Normalizes a characteristic name ("ThreeSixtyDegree", "360Degree"…) to a {@link Characteristic}. */
export function normalizeCharacteristic(value: string | null | undefined): Characteristic {
    const clean = (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (clean.includes("onesaber")) return "OneSaber";
    if (clean.includes("noarrows")) return "NoArrows";
    if (clean.includes("360") || clean.includes("threesixty")) return "360Degree";
    if (clean.includes("90") || clean.includes("ninety")) return "90Degree";
    if (clean.includes("lightshow")) return "Lightshow";
    if (clean.includes("lawless")) return "Lawless";
    return "Standard";
}

/** Identifies a map difficulty: `"<HASH>_<Difficulty>_<Characteristic>"`. */
export interface MapRef {
    hash: string;
    difficulty: Difficulty;
    characteristic: Characteristic;
}

export function makeMapRef(hash: string, difficulty: string, characteristic: string): MapRef {
    return {
        hash: hash.trim().toUpperCase(),
        difficulty: normalizeDifficulty(difficulty),
        characteristic: normalizeCharacteristic(characteristic),
    };
}

export function mapKey({ hash, difficulty, characteristic }: MapRef): string {
    return `${hash}_${difficulty}_${characteristic}`;
}
