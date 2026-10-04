import { RANKED_CACHE_MAX_ENTRIES } from "../config";
import { gameStore } from "../game/store";
import { makeMapRef, mapKey, type MapRef } from "./mapKey";
import { fetchBeatLeaderMap } from "./sources/beatleaderApi";
import { fetchBeatSaverStars } from "./sources/beatsaverApi";
import { lookupRankedIndex, type RankedIndexEntry } from "./sources/rankedIndex";
import { fetchScoreSaberMap } from "./sources/scoresaberApi";
import type { MapRankedData, RankedPlatformData } from "./types";

/**
 * Resolves the ranked data of the map being played and exposes it as a store.
 *
 * Each platform goes down this chain and stops at the first source that answers
 * (an answer of "not ranked" is final, only unreachable sources are skipped):
 * 1. official API (blocked by CORS on file:///, works on http://localhost);
 * 2. ranked index (hosted index, else SongDetails dump);
 * 3. BeatSaver (possibly stale stars).
 */

export interface RankedState {
    data: MapRankedData | null;
    isLoading: boolean;
}

const IDLE: RankedState = { data: null, isLoading: false };

let state: RankedState = IDLE;
const listeners = new Set<() => void>();
/** LRU cache: Map iteration order is insertion order. */
const cache = new Map<string, MapRankedData>();
/** Static data served without network (e.g. the mock song). */
const staticData = new Map<string, MapRankedData>();
/** Incremented on every request: responses of outdated requests are dropped. */
let requestId = 0;

function setState(next: RankedState): void {
    state = next;
    listeners.forEach((listener) => listener());
}

function remember(data: MapRankedData): void {
    cache.delete(data.key);
    cache.set(data.key, data);
    if (cache.size > RANKED_CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value!);
}

/** Walks the source chain of one platform. */
async function resolvePlatform<T>(
    label: string,
    fromApi: Promise<T | null>,
    fromIndex: () => Promise<RankedPlatformData<T> | null>,
    fromBeatSaver: () => Promise<T | null>,
): Promise<RankedPlatformData<T> | null> {
    try {
        const info = await fromApi;
        return info ? { info, source: "api" } : null;
    } catch {
        // Official API unreachable: expected on file:///
    }
    try {
        return await fromIndex();
    } catch (err) {
        console.warn(`[PP] Ranked index unavailable for ${label}, using BeatSaver:`, err);
    }
    try {
        const info = await fromBeatSaver();
        return info ? { info, source: "beatsaver" } : null;
    } catch (err) {
        console.warn(`[PP] No ranked data source reachable for ${label}:`, err);
        return null;
    }
}

/** Fetches (or reuses) the ranked data of a map difficulty and publishes it. */
export async function loadRankedData(ref: MapRef): Promise<void> {
    const key = mapKey(ref);
    const id = ++requestId;

    const known = staticData.get(key) ?? cache.get(key);
    if (known) {
        remember(known);
        setState({ data: known, isLoading: false });
        return;
    }

    setState({ data: null, isLoading: true });

    // Share the fallback requests between both platforms
    let indexPromise: Promise<RankedIndexEntry> | null = null;
    let beatsaverPromise: ReturnType<typeof fetchBeatSaverStars> | null = null;
    const index = () => (indexPromise ??= lookupRankedIndex(ref));
    const beatsaver = () => (beatsaverPromise ??= fetchBeatSaverStars(ref));

    const [scoresaber, beatleader] = await Promise.all([
        resolvePlatform(
            `ScoreSaber ${key}`,
            fetchScoreSaberMap(ref),
            async () => (await index()).scoresaber,
            async () => (await beatsaver()).scoresaber,
        ),
        resolvePlatform(
            `BeatLeader ${key}`,
            fetchBeatLeaderMap(ref),
            async () => (await index()).beatleader,
            async () => (await beatsaver()).beatleader,
        ),
    ]);

    const data: MapRankedData = { key, scoresaber, beatleader };
    remember(data);
    if (id !== requestId) return; // Another map started meanwhile

    console.info(
        `[PP] ${key}: ScoreSaber ${scoresaber ? `★${scoresaber.info.stars} (${scoresaber.source})` : "unranked"}, ` +
            `BeatLeader ${beatleader ? `★${beatleader.info.stars} (${beatleader.source})` : "unranked"}`,
    );
    setState({ data, isLoading: false });
}

function clear(): void {
    requestId++;
    if (state !== IDLE) setState(IDLE);
}

export const rankedStore = {
    getState: (): RankedState => state,
    subscribe(listener: () => void): () => void {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
};

/** Serves ranked data for a map without any network request (used by the mock song). */
export function registerStaticRankedData(data: MapRankedData): void {
    staticData.set(data.key, data);
}

/**
 * Follows the game store and loads ranked data whenever a new map difficulty starts.
 * Call once at boot; returns an unsubscribe function.
 */
export function startRankedSync(): () => void {
    let currentKey = "";
    const sync = () => {
        const { inSong, beatmap } = gameStore.getState();
        if (!inSong || !beatmap?.songHash) {
            currentKey = "";
            clear();
            return;
        }
        const ref = makeMapRef(beatmap.songHash, beatmap.difficultyEnum || beatmap.difficulty, beatmap.characteristic);
        const key = mapKey(ref);
        if (key === currentKey) return;
        currentKey = key;
        void loadRankedData(ref);
    };
    sync();
    return gameStore.subscribe(sync);
}
