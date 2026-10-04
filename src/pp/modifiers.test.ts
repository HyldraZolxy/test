import { describe, expect, it } from "vitest";
import type { ModInfo } from "../game/protocol";
import { getActiveModifiers } from "./modifiers";

const NO_MODS: ModInfo = {
    multiplier: 1,
    obstacles: "All",
    instaFail: false,
    noFail: false,
    batteryEnergy: false,
    batteryLives: null,
    disappearingArrows: false,
    noBombs: false,
    songSpeed: "Normal",
    songSpeedMultiplier: 1,
    noArrows: false,
    ghostNotes: false,
    failOnSaberClash: false,
    strictAngles: false,
    fastNotes: false,
    smallNotes: false,
    proMode: false,
    zenMode: false,
};

describe("getActiveModifiers", () => {
    it("is empty without modifiers", () => {
        expect(getActiveModifiers(NO_MODS, false).size).toBe(0);
        expect(getActiveModifiers(null, false).size).toBe(0);
    });

    it("only reports No Fail after a soft fail", () => {
        const mod = { ...NO_MODS, noFail: true };
        expect(getActiveModifiers(mod, false).has("NF")).toBe(false);
        expect(getActiveModifiers(mod, true).has("NF")).toBe(true);
    });

    it("maps song speed and walls", () => {
        expect([...getActiveModifiers({ ...NO_MODS, songSpeed: "Faster" }, false)]).toEqual(["FS"]);
        expect([...getActiveModifiers({ ...NO_MODS, songSpeed: "SuperFast" }, false)]).toEqual(["SF"]);
        expect([...getActiveModifiers({ ...NO_MODS, songSpeed: "Slower" }, false)]).toEqual(["SS"]);
        expect([...getActiveModifiers({ ...NO_MODS, obstacles: false }, false)]).toEqual(["NO"]);
    });

    it("maps every flag", () => {
        const mod: ModInfo = {
            ...NO_MODS,
            noBombs: true,
            noArrows: true,
            disappearingArrows: true,
            ghostNotes: true,
            smallNotes: true,
            proMode: true,
            strictAngles: true,
            instaFail: true,
            batteryEnergy: true,
        };
        expect([...getActiveModifiers(mod, false)].sort()).toEqual(
            ["BE", "DA", "GN", "IF", "NA", "NB", "PM", "SA", "SC"].sort(),
        );
    });
});
