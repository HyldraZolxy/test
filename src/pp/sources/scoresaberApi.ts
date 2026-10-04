import { SCORESABER_DIFFICULTY_IDS, type MapRef } from "../mapKey";
import { scoreSaberMaxPP } from "../scoresaber";
import type { ScoreSaberMapInfo } from "../types";

/**
 * ScoreSaber leaderboard info.
 * Rejects when the API is unreachable (CORS on file:///, network…) so the caller can fall back;
 * resolves to null when the difficulty is not ranked.
 *
 * Note: ScoreSaber only allows CORS from localhost origins, so this works on
 * `http://localhost` but not when the overlay is opened from `file:///`.
 */
export async function fetchScoreSaberMap(ref: MapRef): Promise<ScoreSaberMapInfo | null> {
    if (ref.characteristic !== "Standard") return null; // Only SoloStandard leaderboards are ranked
    const id = SCORESABER_DIFFICULTY_IDS[ref.difficulty];
    const res = await fetch(`https://scoresaber.com/api/leaderboard/by-hash/${ref.hash}/info?difficulty=${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`ScoreSaber HTTP ${res.status}`);

    const data = (await res.json()) as {
        ranked?: boolean;
        stars?: number;
        maxPP?: number;
        positiveModifiers?: boolean;
    };
    if (!data.ranked || !data.stars || data.stars <= 0) return null;
    return {
        stars: data.stars,
        maxPP: typeof data.maxPP === "number" && data.maxPP > 0 ? data.maxPP : scoreSaberMaxPP(data.stars),
        positiveModifiers: data.positiveModifiers === true,
    };
}
