import { describe, expect, it } from "vitest";
import { calculateNotesFromMaxScore, formatAcc, formatScore, formatTime, maxScoreForNotes } from "./format";

describe("maxScoreForNotes / calculateNotesFromMaxScore", () => {
    it("follows the multiplier ramp", () => {
        expect(maxScoreForNotes(1)).toBe(115);
        expect(maxScoreForNotes(5)).toBe(1035);
        expect(maxScoreForNotes(13)).toBe(4715);
        expect(maxScoreForNotes(394)).toBe(355235); // Data Loss (Normal)
    });

    it("inverts the max score", () => {
        for (const notes of [1, 2, 5, 6, 13, 14, 394, 1850]) {
            expect(calculateNotesFromMaxScore(maxScoreForNotes(notes))).toBe(notes);
        }
    });

    it("removes the modifier multiplier", () => {
        expect(calculateNotesFromMaxScore(355235 * 0.95, 0.95)).toBe(394);
    });

    it("handles missing values", () => {
        expect(calculateNotesFromMaxScore(0)).toBe(0);
        expect(calculateNotesFromMaxScore(null)).toBe(0);
    });
});

describe("formatters", () => {
    it("formats score, accuracy and time", () => {
        expect(formatScore(1234567.4)).toBe("1,234,567");
        expect(formatAcc(0.98104)).toBe("98.10");
        expect(formatAcc(1.2)).toBe("100.00");
        expect(formatTime(125_400)).toBe("2:05");
    });
});
