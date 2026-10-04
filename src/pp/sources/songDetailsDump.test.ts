import { describe, expect, it } from "vitest";
import { parseSongDetailsDump } from "./songDetailsDump";

// --- Tiny protobuf encoder for fixtures ---

function varint(value: number): number[] {
    const bytes: number[] = [];
    do {
        let byte = value % 128;
        value = Math.floor(value / 128);
        if (value > 0) byte |= 0x80;
        bytes.push(byte);
    } while (value > 0);
    return bytes;
}

const varintField = (field: number, value: number) => [...varint(field * 8), ...varint(value)];
const bytesField = (field: number, payload: number[]) => [...varint(field * 8 + 2), ...varint(payload.length), ...payload];

const hashBytes = (hex: string) => hex.match(/../g)!.map((byte) => parseInt(byte, 16));

const HASH_A = "395477673eeadf9b79b9c6b58e99d87c138e0d77";
const HASH_B = "0000000000000000000000000000000000000001";
const HASH_C = "ffffffffffffffffffffffffffffffffffffffff";

function difficulty(fields: { characteristic?: number; difficulty?: number; ss?: number; bl?: number }): number[] {
    return [
        ...(fields.characteristic !== undefined ? varintField(1, fields.characteristic) : []),
        ...(fields.difficulty !== undefined ? varintField(2, fields.difficulty) : []),
        ...(fields.ss ? varintField(4, fields.ss) : []),
        ...(fields.bl ? varintField(5, fields.bl) : []),
    ];
}

function song(rankedStates: number, diffs: number[][]): number[] {
    return [...(rankedStates ? varintField(13, rankedStates) : []), ...diffs.flatMap((d) => bytesField(11, d))];
}

function dump(): Uint8Array {
    return new Uint8Array([
        ...varintField(1, 3),
        ...bytesField(3, [...hashBytes(HASH_A), ...hashBytes(HASH_B), ...hashBytes(HASH_C)]),
        // A: ScoreSaber-ranked; Normal Standard (characteristic omitted = default), and an unranked OneSaber diff
        ...bytesField(4, song(1, [difficulty({ difficulty: 1, ss: 433 }), difficulty({ characteristic: 2, difficulty: 4 })])),
        // B: unranked, must be skipped even with stars
        ...bytesField(4, song(0, [difficulty({ difficulty: 1, ss: 500 })])),
        // C: ranked on both; ExpertPlus omitted (default), BeatLeader stars present
        ...bytesField(4, song(3, [difficulty({ ss: 1234, bl: 1150 })])),
    ]);
}

describe("parseSongDetailsDump", () => {
    const result = parseSongDetailsDump(dump());

    it("keeps ScoreSaber-ranked difficulties with their stars", () => {
        expect(result.scoresaber[`${HASH_A.toUpperCase()}_Normal_Standard`]).toBe(4.33);
        expect(result.scoresaber[`${HASH_C.toUpperCase()}_ExpertPlus_Standard`]).toBe(12.34);
    });

    it("keeps BeatLeader-ranked difficulties", () => {
        expect(result.beatleader[`${HASH_C.toUpperCase()}_ExpertPlus_Standard`]).toBe(11.5);
        expect(result.beatleader[`${HASH_A.toUpperCase()}_Normal_Standard`]).toBeUndefined();
    });

    it("skips unranked maps and difficulties without stars", () => {
        expect(Object.keys(result.scoresaber)).toHaveLength(2);
        expect(Object.keys(result.scoresaber).some((key) => key.startsWith(HASH_B.toUpperCase()))).toBe(false);
        expect(result.scoresaber[`${HASH_A.toUpperCase()}_ExpertPlus_OneSaber`]).toBeUndefined();
    });

    it("rejects data without hashes", () => {
        expect(() => parseSongDetailsDump(new Uint8Array(varintField(1, 3)))).toThrow();
    });
});
