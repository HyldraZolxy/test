import { describe, expect, it } from "vitest";
import { BEATLEADER_SCORES } from "../__fixtures__/beatleaderScores";
import { makeMapRef } from "../mapKey";
import {
    buildIndexFromStars,
    decodeBeatLeaderRow,
    encodeBeatLeaderRow,
    isRankedIndexFile,
    lookupIndex,
    RANKED_INDEX_VERSION,
    type RankedIndexFile,
} from "./rankedIndex";

const HASH = "395477673EEADF9B79B9C6B58E99D87C138E0D77";

describe("BeatLeader row encoding", () => {
    it("round-trips ratings, modifier values and speed ratings", () => {
        const info = { ...BEATLEADER_SCORES[0].map, stars: 9.49 };
        const profiles: number[][] = [];
        const decoded = decodeBeatLeaderRow(encodeBeatLeaderRow(info, profiles), profiles);

        expect(decoded.passRating).toBeCloseTo(info.passRating, 3);
        expect(decoded.modifierValues).toEqual(info.modifierValues);
        expect(decoded.speedRatings?.fs.accRating).toBeCloseTo(info.speedRatings!.fs.accRating, 3);
    });

    it("deduplicates identical modifier profiles", () => {
        const profiles: number[][] = [];
        encodeBeatLeaderRow(BEATLEADER_SCORES[0].map, profiles);
        encodeBeatLeaderRow(BEATLEADER_SCORES[1].map, profiles);
        expect(profiles).toHaveLength(1);
    });

    it("omits speed ratings when unknown", () => {
        const profiles: number[][] = [];
        const row = encodeBeatLeaderRow({ ...BEATLEADER_SCORES[0].map, speedRatings: null }, profiles);
        expect(decodeBeatLeaderRow(row, profiles).speedRatings).toBeNull();
    });
});

describe("lookupIndex", () => {
    const index = buildIndexFromStars({
        scoresaber: { [`${HASH}_Normal_Standard`]: 4.33 },
        beatleader: { [`${HASH}_Hard_Standard`]: 6.1 },
    });

    it("finds ScoreSaber stars and derives maxPP", () => {
        const entry = lookupIndex(index, makeMapRef(HASH.toLowerCase(), "Normal", "Standard"), false);
        expect(entry.scoresaber?.info).toEqual({ stars: 4.33, maxPP: 182.35, positiveModifiers: false });
        expect(entry.beatleader).toBeNull();
    });

    it("labels BeatLeader data estimated from a dump as such", () => {
        const entry = lookupIndex(index, makeMapRef(HASH, "Hard", "Standard"), false);
        expect(entry.beatleader?.source).toBe("dump");
        expect(entry.beatleader?.info.stars).toBe(6.1);
    });

    it("returns nothing for unranked maps", () => {
        const entry = lookupIndex(index, makeMapRef(HASH, "Expert+", "Standard"), false);
        expect(entry).toEqual({ scoresaber: null, beatleader: null });
    });
});

describe("isRankedIndexFile", () => {
    it("validates the version and shape", () => {
        const valid: RankedIndexFile = buildIndexFromStars({ scoresaber: {}, beatleader: {} });
        expect(isRankedIndexFile(valid)).toBe(true);
        expect(isRankedIndexFile({ ...valid, version: RANKED_INDEX_VERSION - 1 })).toBe(false);
        expect(isRankedIndexFile(null)).toBe(false);
    });
});
