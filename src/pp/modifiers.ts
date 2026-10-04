import type { ModInfo } from "../game/protocol";

/**
 * Modifier codes shared by ScoreSaber and BeatLeader.
 * NF is only reported after a soft fail: since Beat Saber 1.13.2 the No Fail penalty
 * applies only once energy reached 0, and both leaderboards follow that rule.
 */
export type ModifierCode =
    | "NF" // No Fail (only after a soft fail)
    | "NO" // No Obstacles
    | "NB" // No Bombs
    | "NA" // No Arrows
    | "SS" // Slower Song
    | "FS" // Faster Song
    | "SF" // Super Fast Song
    | "DA" // Disappearing Arrows
    | "GN" // Ghost Notes
    | "SC" // Small Notes
    | "PM" // Pro Mode
    | "SA" // Strict Angles
    | "IF" // Insta Fail
    | "BE"; // Battery Energy

export const SPEED_MODIFIERS = ["FS", "SF", "SS"] as const satisfies readonly ModifierCode[];

/** Converts HttpSiraStatus modifier flags into leaderboard modifier codes. */
export function getActiveModifiers(mod: ModInfo | null, softFailed: boolean): Set<ModifierCode> {
    const codes = new Set<ModifierCode>();
    if (!mod) return codes;
    if (mod.noFail && softFailed) codes.add("NF");
    if (mod.obstacles === false) codes.add("NO");
    if (mod.noBombs) codes.add("NB");
    if (mod.noArrows) codes.add("NA");
    if (mod.songSpeed === "Slower") codes.add("SS");
    if (mod.songSpeed === "Faster") codes.add("FS");
    if (mod.songSpeed === "SuperFast") codes.add("SF");
    if (mod.disappearingArrows) codes.add("DA");
    if (mod.ghostNotes) codes.add("GN");
    if (mod.smallNotes) codes.add("SC");
    if (mod.proMode) codes.add("PM");
    if (mod.strictAngles) codes.add("SA");
    if (mod.instaFail) codes.add("IF");
    if (mod.batteryEnergy) codes.add("BE");
    return codes;
}
