import { DEFAULT_BEATLEADER_MODIFIER_VALUES } from "../beatleader";
import type { MapRef } from "../mapKey";
import type { BeatLeaderMapInfo, BeatLeaderModifierValues, BeatLeaderRatings } from "../types";

/** BeatLeader difficulty status meaning "ranked". */
export const BEATLEADER_STATUS_RANKED = 3;

/** Shape of a difficulty in BeatLeader API responses (`/map/hash`, `/leaderboards`). */
export interface BeatLeaderApiDifficulty {
    difficultyName: string;
    modeName: string;
    status: number;
    stars: number | null;
    passRating: number | null;
    accRating: number | null;
    techRating: number | null;
    modifierValues?: Record<string, number> | null;
    modifiersRating?: Record<string, number> | null;
}

const SPEED_CODES = ["fs", "sf", "ss"] as const;

/** Converts a ranked BeatLeader API difficulty into map info, or null if unranked/incomplete. */
export function parseBeatLeaderDifficulty(d: BeatLeaderApiDifficulty): BeatLeaderMapInfo | null {
    if (d.status !== BEATLEADER_STATUS_RANKED || !d.stars || !d.passRating || !d.accRating || !d.techRating) {
        return null;
    }

    const modifierValues: BeatLeaderModifierValues = { ...DEFAULT_BEATLEADER_MODIFIER_VALUES };
    for (const key of Object.keys(DEFAULT_BEATLEADER_MODIFIER_VALUES)) {
        const value = d.modifierValues?.[key];
        if (typeof value === "number") modifierValues[key] = value;
    }

    const rating = d.modifiersRating;
    const speedRatings = rating
        ? (Object.fromEntries(
              SPEED_CODES.map((code) => [
                  code,
                  {
                      passRating: rating[`${code}PassRating`] ?? 0,
                      accRating: rating[`${code}AccRating`] ?? 0,
                      techRating: rating[`${code}TechRating`] ?? 0,
                  },
              ]),
          ) as Record<(typeof SPEED_CODES)[number], BeatLeaderRatings>)
        : null;

    return {
        stars: d.stars,
        passRating: d.passRating,
        accRating: d.accRating,
        techRating: d.techRating,
        modifierValues,
        speedRatings,
    };
}

/**
 * BeatLeader ranked data of a difficulty.
 * Rejects when the API is unreachable (CORS on file:///, network…); resolves to null when not ranked.
 */
export async function fetchBeatLeaderMap(ref: MapRef): Promise<BeatLeaderMapInfo | null> {
    const res = await fetch(`https://api.beatleader.xyz/map/hash/${ref.hash}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`BeatLeader HTTP ${res.status}`);

    const data = (await res.json()) as { difficulties?: BeatLeaderApiDifficulty[] };
    const match = data.difficulties?.find(
        (d) => d.difficultyName === ref.difficulty && d.modeName === ref.characteristic,
    );
    return match ? parseBeatLeaderDifficulty(match) : null;
}
