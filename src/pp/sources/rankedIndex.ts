import { HOSTED_RANKED_INDEX_URL, RANKED_INDEX_TTL_MS } from "../../config";
import { DEFAULT_BEATLEADER_MODIFIER_VALUES, estimateBeatLeaderMapInfo } from "../beatleader";
import { mapKey, type MapRef } from "../mapKey";
import { scoreSaberMaxPP } from "../scoresaber";
import type { BeatLeaderMapInfo, RankedPlatformData, ScoreSaberMapInfo } from "../types";
import { downloadRankedStars, type RankedStars } from "./songDetailsDump";

/**
 * Compact index of every ranked difficulty, usable from `file:///` (no CORS restriction).
 *
 * Sources, by priority:
 * 1. Hosted index built by `scripts/build-ranked-index.ts` in a GitHub Action (~280 KB gzip):
 *    ScoreSaber stars + full BeatLeader data (ratings, modifier values, speed ratings).
 * 2. SongDetailsCache dump (~10 MB) when the hosted index is unreachable:
 *    star ratings only, BeatLeader ratings are estimated.
 *
 * The index is cached in localStorage; once stale it is still served while a refresh runs.
 */

export const RANKED_INDEX_VERSION = 2;

/** Order of the values in {@link RankedIndexFile.blModifierProfiles}. */
export const BL_MODIFIER_KEYS = Object.keys(DEFAULT_BEATLEADER_MODIFIER_VALUES);

/**
 * BeatLeader row: `[stars, pass, acc, tech, modifierProfile]`,
 * optionally followed by the FS, SF and SS ratings (`pass, acc, tech` each).
 */
export type BeatLeaderRow = number[];

export interface RankedIndexFile {
    version: typeof RANKED_INDEX_VERSION;
    generatedAt: string;
    /** "api": BeatLeader data from the BeatLeader API; "dump": estimated from stars. */
    beatleaderSource: "api" | "dump";
    /** ScoreSaber stars by map key. */
    scoresaber: Record<string, number>;
    beatleader: Record<string, BeatLeaderRow>;
    /** Deduplicated modifier values (most maps share the same profile). */
    blModifierProfiles: number[][];
}

export interface RankedIndexEntry {
    scoresaber: RankedPlatformData<ScoreSaberMapInfo> | null;
    beatleader: RankedPlatformData<BeatLeaderMapInfo> | null;
}

// --- Encoding (shared with the build script) ---

const round3 = (value: number) => Math.round(value * 1000) / 1000;
const SPEED_CODES = ["fs", "sf", "ss"] as const;

/** Encodes BeatLeader map info into a compact row, registering its modifier profile. */
export function encodeBeatLeaderRow(info: BeatLeaderMapInfo, profiles: number[][]): BeatLeaderRow {
    const profile = BL_MODIFIER_KEYS.map((key) => info.modifierValues[key] ?? 0);
    let profileIndex = profiles.findIndex((p) => p.every((value, i) => value === profile[i]));
    if (profileIndex < 0) profileIndex = profiles.push(profile) - 1;

    const row = [info.stars, info.passRating, info.accRating, info.techRating].map(round3);
    row.push(profileIndex);
    if (info.speedRatings) {
        for (const code of SPEED_CODES) {
            const r = info.speedRatings[code];
            row.push(round3(r.passRating), round3(r.accRating), round3(r.techRating));
        }
    }
    return row;
}

export function decodeBeatLeaderRow(row: BeatLeaderRow, profiles: number[][]): BeatLeaderMapInfo {
    const [stars, passRating, accRating, techRating, profileIndex] = row;
    const profile = profiles[profileIndex];
    const modifierValues = profile
        ? Object.fromEntries(BL_MODIFIER_KEYS.map((key, i) => [key, profile[i]]))
        : DEFAULT_BEATLEADER_MODIFIER_VALUES;
    const speed = (offset: number) => ({
        passRating: row[offset],
        accRating: row[offset + 1],
        techRating: row[offset + 2],
    });
    return {
        stars,
        passRating,
        accRating,
        techRating,
        modifierValues,
        speedRatings: row.length >= 14 ? { fs: speed(5), sf: speed(8), ss: speed(11) } : null,
    };
}

/** Builds an index from dump star ratings (BeatLeader ratings estimated). */
export function buildIndexFromStars(stars: RankedStars, generatedAt = new Date().toISOString()): RankedIndexFile {
    const blModifierProfiles: number[][] = [];
    const beatleader: Record<string, BeatLeaderRow> = {};
    for (const [key, blStars] of Object.entries(stars.beatleader)) {
        beatleader[key] = encodeBeatLeaderRow(estimateBeatLeaderMapInfo(blStars), blModifierProfiles);
    }
    return {
        version: RANKED_INDEX_VERSION,
        generatedAt,
        beatleaderSource: "dump",
        scoresaber: stars.scoresaber,
        beatleader,
        blModifierProfiles,
    };
}

/** Looks a map up in an index. Missing platforms are not ranked there. */
export function lookupIndex(index: RankedIndexFile, ref: MapRef, fromDump: boolean): RankedIndexEntry {
    const key = mapKey(ref);
    const ssStars = index.scoresaber[key];
    const blRow = index.beatleader[key];
    const source = fromDump ? "dump" : "index";
    return {
        scoresaber: ssStars
            ? { info: { stars: ssStars, maxPP: scoreSaberMaxPP(ssStars), positiveModifiers: false }, source }
            : null,
        beatleader: blRow
            ? {
                  info: decodeBeatLeaderRow(blRow, index.blModifierProfiles),
                  source: index.beatleaderSource === "api" && !fromDump ? "index" : "dump",
              }
            : null,
    };
}

export function isRankedIndexFile(data: unknown): data is RankedIndexFile {
    const index = data as RankedIndexFile | null;
    return (
        !!index &&
        index.version === RANKED_INDEX_VERSION &&
        typeof index.scoresaber === "object" &&
        typeof index.beatleader === "object" &&
        Array.isArray(index.blModifierProfiles)
    );
}

// --- Client-side loading and caching ---

const CACHE_KEY = "bs_overlay_ranked_index_v2";
const LEGACY_CACHE_KEYS = ["bs_overlay_ranked_index_v1"];

interface LoadedIndex {
    fetchedAt: number;
    fromDump: boolean;
    index: RankedIndexFile;
}

let loaded: LoadedIndex | null = null;
let refreshing: Promise<LoadedIndex> | null = null;

function readCache(): LoadedIndex | null {
    try {
        const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null") as LoadedIndex | null;
        return parsed && typeof parsed.fetchedAt === "number" && isRankedIndexFile(parsed.index) ? parsed : null;
    } catch {
        return null;
    }
}

function writeCache(value: LoadedIndex): void {
    try {
        LEGACY_CACHE_KEYS.forEach((key) => localStorage.removeItem(key));
        localStorage.setItem(CACHE_KEY, JSON.stringify(value));
    } catch {
        // Storage disabled or full: the index stays in memory
    }
}

async function downloadHostedIndex(): Promise<RankedIndexFile> {
    const res = await fetch(HOSTED_RANKED_INDEX_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: unknown = await res.json();
    if (!isRankedIndexFile(data)) throw new Error("Unexpected ranked index format");
    return data;
}

function refresh(): Promise<LoadedIndex> {
    refreshing ??= (async () => {
        let value: LoadedIndex;
        try {
            value = { fetchedAt: Date.now(), fromDump: false, index: await downloadHostedIndex() };
            console.info(`[PP] Hosted ranked index loaded (generated ${value.index.generatedAt})`);
        } catch (err) {
            console.warn("[PP] Hosted ranked index unreachable, downloading the full dump (~10 MB):", err);
            value = { fetchedAt: Date.now(), fromDump: true, index: buildIndexFromStars(await downloadRankedStars()) };
            console.info("[PP] Ranked index built from the SongDetails dump");
        }
        loaded = value;
        writeCache(value);
        return value;
    })().finally(() => {
        refreshing = null;
    });
    return refreshing;
}

/** An index built from the dump is a fallback: upgrade it as soon as the hosted index is reachable. */
let upgradeAttempted = false;
function upgradeFromDump(): void {
    if (upgradeAttempted || refreshing) return;
    upgradeAttempted = true;
    downloadHostedIndex()
        .then((index) => {
            loaded = { fetchedAt: Date.now(), fromDump: false, index };
            writeCache(loaded);
            console.info(`[PP] Upgraded to the hosted ranked index (generated ${index.generatedAt})`);
        })
        .catch(() => {
            // Still unreachable: keep the dump-based index, no 10 MB re-download
        });
}

async function getIndex(): Promise<LoadedIndex> {
    loaded ??= readCache();
    if (!loaded) return refresh();
    if (Date.now() - loaded.fetchedAt > RANKED_INDEX_TTL_MS) {
        refresh().catch((err) => console.warn("[PP] Ranked index refresh failed, keeping the cached one:", err));
    } else if (loaded.fromDump) {
        upgradeFromDump();
    }
    return loaded;
}

/**
 * Ranked data of a map from the index.
 * Rejects only when no index can be loaded at all (offline and nothing cached).
 */
export async function lookupRankedIndex(ref: MapRef): Promise<RankedIndexEntry> {
    const { index, fromDump } = await getIndex();
    return lookupIndex(index, ref, fromDump);
}
