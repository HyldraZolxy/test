import { useMemo, useSyncExternalStore } from "react";
import { usePPInputs } from "../game/hooks";
import { calculateBeatLeaderPP } from "./beatleader";
import { getActiveModifiers } from "./modifiers";
import { rankedStore } from "./rankedService";
import { calculateScoreSaberPP } from "./scoresaber";
import type { LivePP } from "./types";

const roundStars = (stars: number) => Math.round(stars * 10) / 10;

/**
 * Live PP of the current play on ScoreSaber and BeatLeader, recomputed on every
 * accuracy, modifier or soft-fail change. A null platform means the map is not ranked there.
 */
export function useLivePP(): LivePP {
    const { data, isLoading } = useSyncExternalStore(rankedStore.subscribe, rankedStore.getState);
    const { acc, mod, softFailed } = usePPInputs();

    return useMemo(() => {
        // Zen mode is never scored
        const modifiers = getActiveModifiers(mod, softFailed);
        const ss = mod?.zenMode ? null : data?.scoresaber?.info;
        const bl = mod?.zenMode ? null : data?.beatleader?.info;
        return {
            isRanked: Boolean(ss || bl),
            isLoading,
            scoresaber: ss ? { stars: roundStars(ss.stars), pp: calculateScoreSaberPP(ss, acc, modifiers) } : null,
            beatleader: bl ? { stars: roundStars(bl.stars), pp: calculateBeatLeaderPP(bl, acc, modifiers) } : null,
        };
    }, [data, isLoading, acc, mod, softFailed]);
}
