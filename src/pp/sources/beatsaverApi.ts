import { estimateBeatLeaderMapInfo } from "../beatleader";
import { normalizeCharacteristic, normalizeDifficulty, type MapRef } from "../mapKey";
import { scoreSaberMaxPP } from "../scoresaber";
import type { BeatLeaderMapInfo, ScoreSaberMapInfo } from "../types";

interface BeatSaverDiff {
    difficulty?: string;
    characteristic?: string;
    stars?: number;
    blStars?: number;
}

interface BeatSaverMap {
    versions?: { diffs?: BeatSaverDiff[] }[];
}

/**
 * Last-resort source: BeatSaver allows any origin, but its star ratings can be stale
 * (e.g. maps re-rated after qualification) and BeatLeader ratings must be estimated.
 * Rejects when unreachable.
 */
export async function fetchBeatSaverStars(ref: MapRef): Promise<{
    scoresaber: ScoreSaberMapInfo | null;
    beatleader: BeatLeaderMapInfo | null;
}> {
    const res = await fetch(`https://api.beatsaver.com/maps/hash/${ref.hash.toLowerCase()}`);
    if (res.status === 404) return { scoresaber: null, beatleader: null };
    if (!res.ok) throw new Error(`BeatSaver HTTP ${res.status}`);

    const data = (await res.json()) as BeatSaverMap;
    const versions = data.versions ?? [];
    let diff: BeatSaverDiff | undefined;
    for (let i = versions.length - 1; i >= 0 && !diff; i--) {
        diff = versions[i].diffs?.find(
            (d) =>
                normalizeDifficulty(d.difficulty) === ref.difficulty &&
                normalizeCharacteristic(d.characteristic) === ref.characteristic,
        );
    }

    const ssStars = diff?.stars ?? 0;
    const blStars = diff?.blStars ?? 0;
    return {
        scoresaber: ssStars > 0 ? { stars: ssStars, maxPP: scoreSaberMaxPP(ssStars), positiveModifiers: false } : null,
        beatleader: blStars > 0 ? estimateBeatLeaderMapInfo(blStars) : null,
    };
}
