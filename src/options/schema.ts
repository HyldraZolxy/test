import { DEFAULT_UI_SCALE } from "../config";

/** Which leaderboard(s) the live PP display shows. */
export type PPProvider = "beatleader" | "scoresaber" | "both";

export const PP_PROVIDERS: readonly PPProvider[] = ["both", "beatleader", "scoresaber"];

/**
 * User-configurable overlay options, persisted locally and shared between OBS sources.
 * To add an option: add it here, to {@link DEFAULT_OPTIONS}, and to `settings/settingsSchema.ts`.
 */
export interface OverlayOptions {
    showSongCard: boolean;
    showSongProgress: boolean;
    showScore: boolean;
    showRank: boolean;
    showPP: boolean;
    ppProvider: PPProvider;
    showCombo: boolean;
    showMultiplier: boolean;
    showEnergy: boolean;
    showConnectionBadge: boolean;
    showStandby: boolean;
    useCustomSaberColors: boolean;
    uiScale: number;
}

/** Keys of the on/off options (rendered as toggles in the settings panel). */
export type BooleanOptionKey = {
    [K in keyof OverlayOptions]: OverlayOptions[K] extends boolean ? K : never;
}[keyof OverlayOptions];

export const DEFAULT_OPTIONS: Readonly<OverlayOptions> = {
    showSongCard: true,
    showSongProgress: true,
    showScore: true,
    showRank: true,
    showPP: true,
    ppProvider: "both",
    showCombo: true,
    showMultiplier: true,
    showEnergy: true,
    showConnectionBadge: true,
    showStandby: true,
    useCustomSaberColors: true,
    uiScale: DEFAULT_UI_SCALE,
};

const MIN_UI_SCALE = 0.5;
const MAX_UI_SCALE = 3;

/**
 * Builds valid options from untrusted input (imported file, storage, other windows):
 * unknown keys are dropped and invalid values fall back to their defaults.
 */
export function sanitizeOptions(input: unknown): OverlayOptions {
    const result: OverlayOptions = { ...DEFAULT_OPTIONS };
    if (!input || typeof input !== "object") return result;
    const raw = input as Record<string, unknown>;

    for (const key of Object.keys(DEFAULT_OPTIONS) as (keyof OverlayOptions)[]) {
        const value = raw[key];
        if (typeof DEFAULT_OPTIONS[key] === "boolean" && typeof value === "boolean") {
            (result as unknown as Record<string, unknown>)[key] = value;
        }
    }
    if (PP_PROVIDERS.includes(raw.ppProvider as PPProvider)) {
        result.ppProvider = raw.ppProvider as PPProvider;
    }
    if (typeof raw.uiScale === "number" && raw.uiScale >= MIN_UI_SCALE && raw.uiScale <= MAX_UI_SCALE) {
        result.uiScale = raw.uiScale;
    }
    return result;
}
