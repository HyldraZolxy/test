import { interpolate, round2, type Curve } from "./curves";
import type { ModifierCode } from "./modifiers";
import type { ScoreSaberMapInfo } from "./types";

/**
 * ScoreSaber PP.
 *
 * `pp = curve(accuracy × M) × maxPP`, where `M = 1 + Σ modifier values`:
 * - negative modifiers always count;
 * - positive modifiers count only on leaderboards with `positiveModifiers` (which also use a dedicated curve).
 *
 * Verified against real scores (plain, SF ignored, NF after soft fail).
 * @see https://scoresaber.com/api/v2/realms/1/pp-curve (both curves)
 * @see https://github.com/ScoreSaber/wiki/blob/HEAD/content/docs/faq.md (modifier rules)
 */

/** Standard ScoreSaber curve: `[accuracy, multiplier]`. */
export const SCORESABER_CURVE: Curve = [
    [1.0, 5.367394282890631],
    [0.9995, 5.019543595874787],
    [0.999, 4.715470646416203],
    [0.99825, 4.325027383589547],
    [0.9975, 3.996793606763322],
    [0.99625, 3.5526145337555373],
    [0.995, 3.2022017597337955],
    [0.99375, 2.9190155639254955],
    [0.9925, 2.685667856592722],
    [0.99125, 2.4902905794106913],
    [0.99, 2.324506282149922],
    [0.9875, 2.058947159052738],
    [0.985, 1.8563887693647105],
    [0.9825, 1.697536248647543],
    [0.98, 1.5702410055532239],
    [0.9775, 1.4664726399289512],
    [0.975, 1.3807102743105126],
    [0.9725, 1.3090333065057616],
    [0.97, 1.2485807759957321],
    [0.965, 1.1552120359501035],
    [0.96, 1.0871883573850478],
    [0.955, 1.0388633331418984],
    [0.95, 1.0],
    [0.94, 0.9417362980580238],
    [0.93, 0.9039994071865736],
    [0.92, 0.8728710341448851],
    [0.91, 0.8488375988124467],
    [0.9, 0.825756123560842],
    [0.875, 0.7816934560296046],
    [0.85, 0.7462290664143185],
    [0.825, 0.7150465663454271],
    [0.8, 0.6872268862950283],
    [0.75, 0.6451808210101443],
    [0.7, 0.6125565959114954],
    [0.65, 0.5866010012767576],
    [0.6, 0.18223233667439062],
    [0.0, 0.0],
];

/** Curve of leaderboards where positive modifiers count (accuracy × M can exceed 1). */
export const SCORESABER_POSITIVE_MODIFIER_CURVE: Curve = [
    [1.14, 1.25],
    [1.1, 1.18],
    [1.0, 1.12],
    [0.95, 1.046],
    [0.945, 1.015],
    [0.88, 0.826],
    [0.84, 0.695],
    [0.8, 0.563],
    [0.7, 0.285],
    [0.68, 0.24],
    [0.65, 0.16],
    [0.6, 0.105],
    [0.55, 0.06],
    [0.5, 0.03],
    [0.45, 0.015],
    [0.0, 0.0],
];

/**
 * Modifier values from the ScoreSaber realm API (`realm.modifierValues`).
 * Modifiers not listed (SF, PM, SC, SA, IF, BE) are worth 0 and still earn PP.
 */
export const SCORESABER_MODIFIER_VALUES: Partial<Record<ModifierCode, number>> = {
    NO: -0.05,
    NB: -0.1,
    NF: -0.5,
    SS: -0.3,
    NA: -0.3,
    FS: 0.08,
    DA: 0.02,
    GN: 0.04,
};

/** `maxPP` from stars, as computed by the ScoreSaber website (`star-conversion.ts`). */
export function scoreSaberMaxPP(stars: number): number {
    return round2((stars * 450) / 10.685333512);
}

/** Score multiplier `M` applied to the accuracy before the curve lookup. */
export function scoreSaberModifierMultiplier(
    modifiers: ReadonlySet<ModifierCode>,
    positiveModifiers: boolean,
): number {
    let multiplier = 1;
    for (const code of modifiers) {
        const value = SCORESABER_MODIFIER_VALUES[code] ?? 0;
        if (value < 0 || positiveModifiers) multiplier += value;
    }
    return multiplier;
}

/**
 * Live ScoreSaber PP for a modifier-neutral accuracy (0..1).
 */
export function calculateScoreSaberPP(
    map: ScoreSaberMapInfo,
    accuracy: number,
    modifiers: ReadonlySet<ModifierCode>,
): number {
    if (map.maxPP <= 0 || accuracy <= 0) return 0;
    const multiplier = scoreSaberModifierMultiplier(modifiers, map.positiveModifiers);
    const curve = map.positiveModifiers ? SCORESABER_POSITIVE_MODIFIER_CURVE : SCORESABER_CURVE;
    return round2(Math.max(0, interpolate(curve, accuracy * multiplier) * map.maxPP));
}
