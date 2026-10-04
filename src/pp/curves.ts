/** A piecewise-linear curve: points `[x, y]` sorted by descending x. */
export type Curve = readonly (readonly [number, number])[];

/**
 * Linear interpolation on a curve sorted by descending x.
 * Values above the first point are clamped to it; values below the last point to the last one.
 */
export function interpolate(curve: Curve, x: number): number {
    if (x >= curve[0][0]) return curve[0][1];
    for (let i = 1; i < curve.length; i++) {
        const [x1, y1] = curve[i - 1];
        const [x2, y2] = curve[i];
        if (x >= x2) return y2 + ((x - x2) / (x1 - x2)) * (y1 - y2);
    }
    return curve[curve.length - 1][1];
}

/** Rounds to 2 decimals. */
export function round2(value: number): number {
    return Math.round(value * 100) / 100;
}
