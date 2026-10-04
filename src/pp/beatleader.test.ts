import { describe, expect, it } from "vitest";
import { BEATLEADER_SCORES } from "./__fixtures__/beatleaderScores";
import { calculateBeatLeaderPP, estimateBeatLeaderMapInfo } from "./beatleader";
import type { ModifierCode } from "./modifiers";

const mods = (list: string) => new Set(list.split(",").filter(Boolean) as ModifierCode[]);

describe("calculateBeatLeaderPP", () => {
    it.each(BEATLEADER_SCORES.map((score) => ({ ...score, label: score.modifiers || "unmodded" })))(
        "matches the BeatLeader server for a real score: $label",
        ({ map, accuracy, modifiers, pp }) => {
            expect(calculateBeatLeaderPP(map, accuracy, mods(modifiers))).toBeCloseTo(pp, 1);
        },
    );

    it("gives 0 PP after a No Fail soft fail", () => {
        const { map, accuracy } = BEATLEADER_SCORES[0];
        expect(calculateBeatLeaderPP(map, accuracy, mods("NF"))).toBe(0);
    });

    it("uses the speed rating instead of a flat multiplier when available", () => {
        const { map, accuracy } = BEATLEADER_SCORES[0];
        const withRatings = calculateBeatLeaderPP(map, accuracy, mods("FS"));
        const withoutRatings = calculateBeatLeaderPP({ ...map, speedRatings: null }, accuracy, mods("FS"));
        expect(withRatings).not.toBeCloseTo(withoutRatings, 0);
    });

    it("applies negative modifier values to all ratings", () => {
        const { map, accuracy } = BEATLEADER_SCORES[0];
        expect(calculateBeatLeaderPP(map, accuracy, mods("NA"))).toBeLessThan(
            calculateBeatLeaderPP(map, accuracy, mods("")),
        );
    });

    it("rejects out-of-range accuracy", () => {
        const { map } = BEATLEADER_SCORES[0];
        expect(calculateBeatLeaderPP(map, 0, mods(""))).toBe(0);
        expect(calculateBeatLeaderPP(map, 1.01, mods(""))).toBe(0);
    });
});

describe("estimateBeatLeaderMapInfo", () => {
    it("derives ratings from stars with default modifiers and no speed ratings", () => {
        const info = estimateBeatLeaderMapInfo(10);
        expect(info.passRating).toBeGreaterThan(0);
        expect(info.accRating).toBeGreaterThan(info.passRating);
        expect(info.speedRatings).toBeNull();
        expect(info.modifierValues.na).toBe(-0.3);
    });
});
