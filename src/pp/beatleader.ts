import { interpolate, round2, type Curve } from "./curves";
import { SPEED_MODIFIERS, type ModifierCode } from "./modifiers";
import type { BeatLeaderMapInfo, BeatLeaderModifierValues, BeatLeaderRatings } from "./types";

/**
 * BeatLeader PP, ported from the BeatLeader server.
 *
 * - No Fail (after a soft fail) gives 0 PP.
 * - Speed modifiers (FS/SF/SS) swap the ratings for dedicated per-map ratings when available.
 * - Other modifiers multiply all three ratings by `mp = 1 + Σ modifierValues`.
 * - `pp = inflate(passPP + accPP + techPP)`.
 *
 * Verified against real scores (plain, FS, SF, SS, DA, GN).
 * @see https://github.com/BeatLeader/beatleader-server/blob/master/Utils/ReplayUtils.cs
 */

/** BeatLeader "Curve2": `[accuracy, factor]`. */
export const BEATLEADER_ACC_CURVE: Curve = [
    [1.0, 7.424],
    [0.999, 6.241],
    [0.9975, 5.158],
    [0.995, 4.01],
    [0.9925, 3.241],
    [0.99, 2.7],
    [0.9875, 2.303],
    [0.985, 2.007],
    [0.9825, 1.786],
    [0.98, 1.618],
    [0.9775, 1.49],
    [0.975, 1.392],
    [0.9725, 1.315],
    [0.97, 1.256],
    [0.965, 1.167],
    [0.96, 1.094],
    [0.955, 1.039],
    [0.95, 1.0],
    [0.94, 0.931],
    [0.93, 0.867],
    [0.92, 0.813],
    [0.91, 0.768],
    [0.9, 0.729],
    [0.875, 0.65],
    [0.85, 0.581],
    [0.825, 0.522],
    [0.8, 0.473],
    [0.75, 0.404],
    [0.7, 0.345],
    [0.65, 0.296],
    [0.6, 0.256],
    [0.0, 0.0],
];

/**
 * Modifier values shared by almost all ranked maps (server defaults).
 * Used when the real per-map values are unknown (fallback data sources).
 */
export const DEFAULT_BEATLEADER_MODIFIER_VALUES: BeatLeaderModifierValues = {
    da: 0,
    fs: 0.4,
    sf: 0.72,
    ss: -0.3,
    gn: 0,
    na: -0.3,
    nb: -0.2,
    nf: -1,
    no: -0.2,
    pm: 0,
    sc: -0.5,
    sa: 0,
    op: -0.5,
};

/**
 * Median ratio between each rating and the overall stars over all ranked maps,
 * used to estimate ratings when only the stars are known.
 */
const ESTIMATED_RATING_RATIOS = { pass: 0.638, acc: 1.246, tech: 0.549 };

/** Estimates BeatLeader map info from the overall star rating alone. */
export function estimateBeatLeaderMapInfo(stars: number): BeatLeaderMapInfo {
    return {
        stars,
        passRating: stars * ESTIMATED_RATING_RATIOS.pass,
        accRating: stars * ESTIMATED_RATING_RATIOS.acc,
        techRating: stars * ESTIMATED_RATING_RATIOS.tech,
        modifierValues: DEFAULT_BEATLEADER_MODIFIER_VALUES,
        speedRatings: null,
    };
}

function inflate(pp: number): number {
    return (650 * Math.pow(pp, 1.3)) / Math.pow(650, 1.3);
}

function ratingsPP(accuracy: number, { passRating, accRating, techRating }: BeatLeaderRatings): number {
    let passPP = 15.2 * Math.exp(Math.pow(passRating, 1 / 2.62)) - 30;
    if (!Number.isFinite(passPP) || passPP < 0) passPP = 0;
    const accPP = interpolate(BEATLEADER_ACC_CURVE, accuracy) * accRating * 34;
    const techPP = Math.exp(1.9 * accuracy) * 1.08 * techRating;
    return passPP + accPP + techPP;
}

/**
 * Live BeatLeader PP for a modifier-neutral accuracy (0..1).
 */
export function calculateBeatLeaderPP(
    map: BeatLeaderMapInfo,
    accuracy: number,
    modifiers: ReadonlySet<ModifierCode>,
): number {
    if (accuracy <= 0 || accuracy > 1 || modifiers.has("NF")) return 0;

    const speed = SPEED_MODIFIERS.find((code) => modifiers.has(code));
    const useSpeedRatings = speed !== undefined && map.speedRatings !== null;
    const ratings: BeatLeaderRatings = useSpeedRatings
        ? map.speedRatings![speed.toLowerCase() as "fs" | "sf" | "ss"]
        : map;

    let multiplier = 1;
    for (const code of modifiers) {
        if (useSpeedRatings && code === speed) continue;
        multiplier += map.modifierValues[code.toLowerCase()] ?? 0;
    }

    const pp = inflate(
        ratingsPP(accuracy, {
            passRating: ratings.passRating * multiplier,
            accRating: ratings.accRating * multiplier,
            techRating: ratings.techRating * multiplier,
        }),
    );
    return Number.isFinite(pp) && pp > 0 ? round2(pp) : 0;
}
