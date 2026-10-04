import { useEffect, useState } from "react";
import { LOW_ENERGY_THRESHOLD, MAX_MULTIPLIER } from "../../config";
import { useBeatmap, useCombo, useConnectionState, useEnergy, useInSong, useScore } from "../../game/hooks";
import type { BeatmapInfo, Rank } from "../../game/protocol";
import { useOverlayOptions } from "../../options/store";
import type { LivePlatformPP } from "../../pp/types";
import { useLivePP } from "../../pp/useLivePP";
import { getSaberTheme, type SaberTheme } from "../../utils/color";
import { calculateNotesFromMaxScore, formatAcc, formatScore } from "../../utils/format";

/**
 * Display-ready values shared by every skin. Skins only decide how things look;
 * what is shown and how it is computed lives here.
 */

export interface ScoreDisplay {
    score: string;
    /** Accuracy percentage with 2 decimals, without the % sign. */
    acc: string;
    rank: Rank;
}

export function useScoreDisplay(): ScoreDisplay {
    const { score, acc, rank } = useScore();
    return { score: formatScore(score), acc: formatAcc(acc), rank };
}

export interface ComboDisplay {
    combo: number;
    multiplier: number;
    /** Multiplier bar fill, 0..1 (full once the max multiplier is reached). */
    fill: number;
}

export function useComboDisplay(): ComboDisplay {
    const { combo, multiplier, multiplierProgress } = useCombo();
    return { combo, multiplier, fill: multiplier >= MAX_MULTIPLIER ? 1 : multiplierProgress };
}

export interface EnergyDisplay {
    /** 0..1 */
    energy: number;
    percent: number;
    low: boolean;
}

export function useEnergyDisplay(): EnergyDisplay {
    const energy = useEnergy();
    return { energy, percent: Math.round(energy * 100), low: energy < LOW_ENERGY_THRESHOLD };
}

export interface PPDisplay {
    /** False when PP are hidden or the map is not ranked. */
    visible: boolean;
    beatleader: LivePlatformPP | null;
    scoresaber: LivePlatformPP | null;
}

/** Live PP filtered by the user's provider choice. */
export function usePPDisplay(): PPDisplay {
    const { showPP, ppProvider } = useOverlayOptions();
    const live = useLivePP();
    return {
        visible: showPP && live.isRanked,
        beatleader: ppProvider !== "scoresaber" ? live.beatleader : null,
        scoresaber: ppProvider !== "beatleader" ? live.scoresaber : null,
    };
}

/** Saber colors of the current map (or defaults when disabled in settings). */
export function useSaberTheme(beatmap?: BeatmapInfo | null): SaberTheme {
    const storeBeatmap = useBeatmap();
    const { useCustomSaberColors } = useOverlayOptions();
    return getSaberTheme((beatmap ?? storeBeatmap)?.color, useCustomSaberColors);
}

/** Note count of a map, recovered from its max score when the game does not send it. */
export function notesCountOf(beatmap: BeatmapInfo): number {
    return beatmap.notesCount > 0 ? beatmap.notesCount : calculateNotesFromMaxScore(beatmap.maxScore);
}

/** Whether the "waiting for a song" indicator should be shown. */
export function useStandbyVisible(): boolean {
    const { showStandby } = useOverlayOptions();
    const inSong = useInSong();
    const connection = useConnectionState();
    return showStandby && !inSong && connection === "connected";
}

/** Becomes false `delayMs` after `hideWhen` turns true; true again as soon as it turns false. */
export function useAutoHide(hideWhen: boolean, delayMs: number): boolean {
    const [hidden, setHidden] = useState(false);
    useEffect(() => {
        if (!hideWhen) return;
        const timer = window.setTimeout(() => setHidden(true), delayMs);
        return () => {
            window.clearTimeout(timer);
            setHidden(false);
        };
    }, [hideWhen, delayMs]);
    return !hidden;
}
