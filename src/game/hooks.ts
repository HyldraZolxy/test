import { useSyncExternalStore } from "react";
import type { BeatmapInfo, ConnectionState, ModInfo, Rank } from "./protocol";
import { createSliceSelector, gameStore } from "./store";

/**
 * Fine-grained subscriptions to the game store: each hook re-renders
 * its component only when the selected value changes.
 */

export interface ScoreSlice {
    score: number;
    /** Modifier-neutral accuracy, 0..1. */
    acc: number;
    rank: Rank;
}

export interface ComboSlice {
    combo: number;
    multiplier: number;
    /** Progress towards the next multiplier step, 0..1. */
    multiplierProgress: number;
}

/** Inputs of the live PP computation. */
export interface PPInputsSlice {
    acc: number;
    mod: ModInfo | null;
    softFailed: boolean;
}

const selectScore = createSliceSelector(({ performance }): ScoreSlice => ({
    score: performance?.score ?? 0,
    acc: performance?.relativeScore ?? 0,
    rank: performance?.rank ?? "E",
}));

const selectCombo = createSliceSelector(({ performance }): ComboSlice => ({
    combo: performance?.combo ?? 0,
    multiplier: performance?.multiplier ?? 1,
    multiplierProgress: Math.min(1, Math.max(0, performance?.multiplierProgress ?? 0)),
}));

const selectPPInputs = createSliceSelector(({ performance, mod }): PPInputsSlice => ({
    acc: performance?.relativeScore ?? 0,
    mod,
    softFailed: performance?.softFailed ?? false,
}));

export function useConnectionState(): ConnectionState {
    return useSyncExternalStore(gameStore.subscribe, () => gameStore.getState().connection);
}

export function useInSong(): boolean {
    return useSyncExternalStore(gameStore.subscribe, () => gameStore.getState().inSong);
}

export function useBeatmap(): BeatmapInfo | null {
    return useSyncExternalStore(gameStore.subscribe, () => gameStore.getState().beatmap);
}

/** Energy, clamped to 0..1. */
export function useEnergy(): number {
    return useSyncExternalStore(gameStore.subscribe, () =>
        Math.min(1, Math.max(0, gameStore.getState().energy)),
    );
}

export function useScore(): ScoreSlice {
    return useSyncExternalStore(gameStore.subscribe, selectScore);
}

export function useCombo(): ComboSlice {
    return useSyncExternalStore(gameStore.subscribe, selectCombo);
}

export function usePPInputs(): PPInputsSlice {
    return useSyncExternalStore(gameStore.subscribe, selectPPInputs);
}
