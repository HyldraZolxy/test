import type { Difficulty, Rank } from "../game/protocol";

/** `1234567` → `"1,234,567"`. */
export function formatScore(score: number): string {
    return Math.max(0, Math.round(score)).toLocaleString("en-US");
}

/** Accuracy ratio (0..1) → percentage with 2 decimals, e.g. `0.98104` → `"98.10"`. */
export function formatAcc(ratio: number): string {
    return Math.max(0, Math.min(100, (ratio || 0) * 100)).toFixed(2);
}

/** Milliseconds → `m:ss`. */
export function formatTime(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export interface DifficultyStyle {
    label: string;
    /** Tailwind text color class. */
    color: string;
    /** Tailwind border color class. */
    ring: string;
    /** Tailwind background class. */
    bg: string;
}

const DIFFICULTY_STYLES: Record<Difficulty, DifficultyStyle> = {
    Easy: { label: "EASY", color: "text-emerald-300", ring: "border-emerald-400/60", bg: "bg-emerald-500/10" },
    Normal: { label: "NORMAL", color: "text-cyan-300", ring: "border-cyan-400/60", bg: "bg-cyan-500/10" },
    Hard: { label: "HARD", color: "text-amber-300", ring: "border-amber-400/60", bg: "bg-amber-500/10" },
    Expert: { label: "EXPERT", color: "text-rose-300", ring: "border-rose-400/60", bg: "bg-rose-500/10" },
    ExpertPlus: { label: "EXPERT+", color: "text-fuchsia-300", ring: "border-fuchsia-400/70", bg: "bg-fuchsia-500/10" },
};

/** Tailwind classes for each rank letter (color + glow). */
export const RANK_COLORS: Record<Rank, string> = {
    SSS: "text-fuchsia-300 drop-shadow-[0_0_12px_rgba(232,121,249,0.7)]",
    SS: "text-fuchsia-300 drop-shadow-[0_0_10px_rgba(232,121,249,0.6)]",
    S: "text-cyan-300 drop-shadow-[0_0_10px_rgba(103,232,249,0.6)]",
    A: "text-emerald-300 drop-shadow-[0_0_8px_rgba(110,231,183,0.5)]",
    B: "text-emerald-300",
    C: "text-amber-300",
    D: "text-amber-400",
    E: "text-rose-400",
};

/** Style of a difficulty badge; unknown difficulties use their custom name in neutral colors. */
export function getDifficultyStyle(difficulty: Difficulty | undefined, fallbackName?: string): DifficultyStyle {
    if (difficulty && difficulty in DIFFICULTY_STYLES) return DIFFICULTY_STYLES[difficulty];
    return {
        label: (fallbackName || "CUSTOM").toUpperCase(),
        color: "text-white",
        ring: "border-white/40",
        bg: "bg-white/5",
    };
}

const MAX_CUT_SCORE = 115;

/**
 * Max base score of the first `notes` notes. The combo multiplier ramps up:
 * ×1 for note 1, ×2 for notes 2-5, ×4 for notes 6-13, ×8 afterwards.
 */
export function maxScoreForNotes(notes: number): number {
    if (notes <= 0) return 0;
    if (notes === 1) return MAX_CUT_SCORE;
    if (notes <= 5) return MAX_CUT_SCORE * (1 + (notes - 1) * 2);
    if (notes <= 13) return MAX_CUT_SCORE * (9 + (notes - 5) * 4);
    return MAX_CUT_SCORE * (41 + (notes - 13) * 8);
}

/**
 * Inverse of {@link maxScoreForNotes}: recovers the note count from a map's max score.
 * `modifierMultiplier` removes the modifier factor HttpSiraStatus applies to `maxScore`.
 */
export function calculateNotesFromMaxScore(maxScore: number | null | undefined, modifierMultiplier = 1): number {
    if (!maxScore || maxScore <= 0) return 0;
    const base = modifierMultiplier > 0 ? maxScore / modifierMultiplier : maxScore;
    if (base < MAX_CUT_SCORE) return 0;
    if (base <= maxScoreForNotes(13)) {
        for (let notes = 1; notes <= 13; notes++) {
            if (maxScoreForNotes(notes) >= base) return notes;
        }
    }
    return 13 + Math.round((base - maxScoreForNotes(13)) / (MAX_CUT_SCORE * 8));
}

/** Data URL of a base64 cover sent by the game, or null. */
export function coverDataUrl(base64: string | null | undefined): string | null {
    return base64 ? `data:image/png;base64,${base64}` : null;
}
