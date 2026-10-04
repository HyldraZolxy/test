import { describe, expect, it } from "vitest";
import { DEFAULT_OPTIONS, sanitizeOptions } from "./schema";

describe("sanitizeOptions", () => {
    it("returns defaults for invalid input", () => {
        expect(sanitizeOptions(null)).toEqual(DEFAULT_OPTIONS);
        expect(sanitizeOptions("nope")).toEqual(DEFAULT_OPTIONS);
    });

    it("keeps valid values", () => {
        const options = sanitizeOptions({ showPP: false, ppProvider: "scoresaber", uiScale: 1.5 });
        expect(options).toMatchObject({ showPP: false, ppProvider: "scoresaber", uiScale: 1.5 });
    });

    it("drops unknown keys and wrongly typed values", () => {
        const options = sanitizeOptions({ showPP: "yes", ppProvider: "osu", uiScale: 99, hacked: true });
        expect(options).toEqual(DEFAULT_OPTIONS);
        expect("hacked" in options).toBe(false);
    });
});
