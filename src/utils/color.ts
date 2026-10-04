import type { BeatmapColors, RGB } from "../game/protocol";

export const DEFAULT_SABER_A = "rgb(239, 68, 68)";
export const DEFAULT_SABER_B = "rgb(6, 182, 212)";
const DEFAULT_SABER_B_GLOW = "rgba(6, 182, 212, 0.4)";

/**
 * Normalizes a Beat Saber color (0..1 floats or 0..255 integers) to 0..255 integers.
 */
function normalizeRgb(rgb: RGB | null | undefined): RGB | null {
    if (!rgb || rgb.length < 3) return null;
    const [r, g, b] = rgb;
    const isFloat = r <= 1 && g <= 1 && b <= 1 && (r > 0 || g > 0 || b > 0);
    const scale = isFloat ? 255 : 1;
    return [Math.round(r * scale), Math.round(g * scale), Math.round(b * scale)];
}

/** Beat Saber color → CSS `rgb()` / `rgba()`, or `fallback` when missing. */
export function rgbToCss(rgb: RGB | null | undefined, alpha: number, fallback: string): string {
    const norm = normalizeRgb(rgb);
    if (!norm) return fallback;
    const [r, g, b] = norm;
    return alpha < 1 ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`;
}

export interface SaberTheme {
    /** Left saber color (usually red). */
    saberA: string;
    /** Right saber color (usually blue). */
    saberB: string;
    /** Translucent right saber color for glows. */
    saberBGlow: string;
}

const DEFAULT_THEME: SaberTheme = {
    saberA: DEFAULT_SABER_A,
    saberB: DEFAULT_SABER_B,
    saberBGlow: DEFAULT_SABER_B_GLOW,
};

/**
 * Saber colors of the current map, or the default palette when the map has none
 * or when `useMapColors` is disabled.
 */
export function getSaberTheme(colors: BeatmapColors | null | undefined, useMapColors: boolean): SaberTheme {
    if (!useMapColors) return DEFAULT_THEME;
    return {
        saberA: rgbToCss(colors?.saberA, 1, DEFAULT_SABER_A),
        saberB: rgbToCss(colors?.saberB, 1, DEFAULT_SABER_B),
        saberBGlow: rgbToCss(colors?.saberB, 0.4, DEFAULT_SABER_B_GLOW),
    };
}
