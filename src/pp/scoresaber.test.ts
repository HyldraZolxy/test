import { describe, expect, it } from "vitest";
import type { ModifierCode } from "./modifiers";
import { calculateScoreSaberPP, scoreSaberMaxPP, scoreSaberModifierMultiplier } from "./scoresaber";
import type { ScoreSaberMapInfo } from "./types";

/** JKuch & Adam Tell - Data Loss (Normal), ranked: 4.33★, maxPP 182.35, positive modifiers disabled. */
const DATA_LOSS: ScoreSaberMapInfo = { stars: 4.33, maxPP: 182.35, positiveModifiers: false };
const DATA_LOSS_MAX_SCORE = 355235;

const mods = (...codes: ModifierCode[]) => new Set(codes);

describe("calculateScoreSaberPP", () => {
    // Real scores from https://scoresaber.com/api/leaderboard/by-id/633188/scores
    it.each([
        { name: "unmodded", baseScore: 353353, modifiers: mods(), pp: 571.615 },
        { name: "SF ignored (positive modifiers disabled)", baseScore: 308613, modifiers: mods("SF"), pp: 140.927 },
        { name: "PM worth 0", baseScore: 352563, modifiers: mods("PM"), pp: 489.111 },
        { name: "NF after a soft fail halves the accuracy", baseScore: 219815, modifiers: mods("NF"), pp: 17.1353 },
    ])("matches ScoreSaber for a real score: $name", ({ baseScore, modifiers, pp }) => {
        const acc = baseScore / DATA_LOSS_MAX_SCORE;
        expect(calculateScoreSaberPP(DATA_LOSS, acc, modifiers)).toBeCloseTo(pp, 1);
    });

    it("gives 295.87pp at 98.10% on Data Loss (the reported bug case, was 265pp with stale stars)", () => {
        expect(calculateScoreSaberPP(DATA_LOSS, 0.98103, mods())).toBeCloseTo(295.87, 1);
    });

    it("ignores positive modifiers unless the leaderboard enables them", () => {
        const plain = calculateScoreSaberPP(DATA_LOSS, 0.95, mods());
        expect(calculateScoreSaberPP(DATA_LOSS, 0.95, mods("FS", "GN", "DA"))).toBe(plain);
    });

    it("uses the positive-modifier curve when positive modifiers count", () => {
        const map = { ...DATA_LOSS, positiveModifiers: true };
        // 0.95 × 1.08 = 1.026 → between [1.1, 1.18] and [1.0, 1.12]
        expect(calculateScoreSaberPP(map, 0.95, mods("FS"))).toBeCloseTo(1.1356 * map.maxPP, 0);
    });

    it("returns 0 without accuracy", () => {
        expect(calculateScoreSaberPP(DATA_LOSS, 0, mods())).toBe(0);
    });
});

describe("scoreSaberModifierMultiplier", () => {
    it("always applies negative modifiers", () => {
        expect(scoreSaberModifierMultiplier(mods("NO"), false)).toBeCloseTo(0.95);
        expect(scoreSaberModifierMultiplier(mods("NA", "NB"), false)).toBeCloseTo(0.6);
    });

    it("applies positive modifiers only when enabled", () => {
        expect(scoreSaberModifierMultiplier(mods("FS", "DA"), false)).toBe(1);
        expect(scoreSaberModifierMultiplier(mods("FS", "DA"), true)).toBeCloseTo(1.1);
    });
});

describe("scoreSaberMaxPP", () => {
    it("matches the API maxPP", () => {
        expect(scoreSaberMaxPP(4.33)).toBe(182.35);
        expect(scoreSaberMaxPP(3.66)).toBe(154.14);
    });
});
