/**
 * Builds the ranked index read by the overlay (src/pp/sources/rankedIndex.ts) and published
 * by .github/workflows/ranked-index.yml. Runs server-side, where CORS does not apply:
 * - ScoreSaber stars: SongDetailsCache dump;
 * - BeatLeader: full ranked data from the BeatLeader API (ratings, modifier values, speed ratings).
 *
 * If the BeatLeader API refuses the requests (it sits behind Cloudflare, which may block CI IPs),
 * the BeatLeader data of the previously published index is reused, or estimated from the dump.
 *
 * Usage: npm run build:index -- [output file]
 * Env: PREVIOUS_INDEX_URL (optional) — published index to reuse BeatLeader data from.
 */
import { writeFileSync } from "node:fs";
import { mapKey, normalizeCharacteristic, normalizeDifficulty } from "../src/pp/mapKey";
import { parseBeatLeaderDifficulty, type BeatLeaderApiDifficulty } from "../src/pp/sources/beatleaderApi";
import {
    buildIndexFromStars,
    encodeBeatLeaderRow,
    isRankedIndexFile,
    RANKED_INDEX_VERSION,
    type BeatLeaderRow,
    type RankedIndexFile,
} from "../src/pp/sources/rankedIndex";
import { downloadRankedStars } from "../src/pp/sources/songDetailsDump";

const OUTPUT = process.argv[2] ?? "ranked-index.json";
const PREVIOUS_INDEX_URL = process.env.PREVIOUS_INDEX_URL;

const BEATLEADER_HOSTS = ["https://api.beatleader.xyz", "https://api.beatleader.com"];
const BEATLEADER_PAGE_SIZE = 100;
const REQUEST_DELAY_MS = 250;
const RETRY_DELAYS_MS = [2_000, 5_000];
const REQUEST_HEADERS = {
    "User-Agent": "beat-saber-overlay-ranked-index/1.0 (GitHub Actions; +https://github.com)",
    Accept: "application/json",
};

/** Sanity floors: a broken upstream must never overwrite a good published index. */
const MIN_SCORESABER_ENTRIES = 3000;
const MIN_BEATLEADER_ENTRIES = 2000;

interface BeatLeaderLeaderboardsPage {
    metadata: { total: number };
    data: { song: { hash: string }; difficulty: BeatLeaderApiDifficulty }[];
}

interface BeatLeaderData {
    rows: Record<string, BeatLeaderRow>;
    profiles: number[][];
    source: RankedIndexFile["beatleaderSource"];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** GET a BeatLeader API path, trying every host with retries. Errors include the response details. */
async function fetchBeatLeader<T>(path: string): Promise<T> {
    const errors: string[] = [];
    for (const host of BEATLEADER_HOSTS) {
        for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
            try {
                const res = await fetch(host + path, { headers: REQUEST_HEADERS });
                if (res.ok) return (await res.json()) as T;
                const body = (await res.text()).replace(/\s+/g, " ").slice(0, 200);
                errors.push(
                    `${host} HTTP ${res.status} (server: ${res.headers.get("server") ?? "?"}, cf-ray: ${res.headers.get("cf-ray") ?? "-"}): ${body}`,
                );
                // Client errors other than rate limiting will not change on retry
                if (res.status !== 429 && res.status < 500) break;
            } catch (err) {
                errors.push(`${host}: ${String(err)}`);
            }
            if (attempt < RETRY_DELAYS_MS.length) await sleep(RETRY_DELAYS_MS[attempt]);
        }
    }
    throw new Error(`BeatLeader request failed for ${path}:\n  ${errors.join("\n  ")}`);
}

async function fetchBeatLeaderRanked(): Promise<BeatLeaderData> {
    const rows: Record<string, BeatLeaderRow> = {};
    const profiles: number[][] = [];
    for (let page = 1; ; page++) {
        const body = await fetchBeatLeader<BeatLeaderLeaderboardsPage>(
            `/leaderboards?type=ranked&page=${page}&count=${BEATLEADER_PAGE_SIZE}`,
        );
        for (const { song, difficulty } of body.data) {
            const info = parseBeatLeaderDifficulty(difficulty);
            if (!info) continue;
            const key = mapKey({
                hash: song.hash.toUpperCase(),
                difficulty: normalizeDifficulty(difficulty.difficultyName),
                characteristic: normalizeCharacteristic(difficulty.modeName),
            });
            rows[key] = encodeBeatLeaderRow(info, profiles);
        }
        if (page * BEATLEADER_PAGE_SIZE >= body.metadata.total) break;
        await sleep(REQUEST_DELAY_MS);
    }
    if (Object.keys(rows).length < MIN_BEATLEADER_ENTRIES) {
        throw new Error(`Only ${Object.keys(rows).length} BeatLeader entries received`);
    }
    return { rows, profiles, source: "api" };
}

/** BeatLeader data of the currently published index, if it came from the API. */
async function previousBeatLeaderData(): Promise<BeatLeaderData | null> {
    if (!PREVIOUS_INDEX_URL) return null;
    try {
        const res = await fetch(PREVIOUS_INDEX_URL);
        if (!res.ok) return null;
        const previous: unknown = await res.json();
        if (!isRankedIndexFile(previous) || previous.beatleaderSource !== "api") return null;
        console.warn(`Reusing BeatLeader data from the index published on ${previous.generatedAt}`);
        return { rows: previous.beatleader, profiles: previous.blModifierProfiles, source: "api" };
    } catch {
        return null;
    }
}

const stars = await downloadRankedStars();
const ssCount = Object.keys(stars.scoresaber).length;
if (ssCount < MIN_SCORESABER_ENTRIES) throw new Error(`Suspicious dump: only ${ssCount} ScoreSaber entries`);

let beatleader: BeatLeaderData;
try {
    beatleader = await fetchBeatLeaderRanked();
} catch (err) {
    console.warn(`::warning::BeatLeader API unavailable, falling back.\n${String(err)}`);
    const fromDump = buildIndexFromStars(stars);
    beatleader = (await previousBeatLeaderData()) ?? {
        rows: fromDump.beatleader,
        profiles: fromDump.blModifierProfiles,
        source: "dump",
    };
}

// Sorted keys keep the file stable between runs
const sortKeys = <T>(record: Record<string, T>) =>
    Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));

const index: RankedIndexFile = {
    version: RANKED_INDEX_VERSION,
    generatedAt: new Date().toISOString(),
    beatleaderSource: beatleader.source,
    scoresaber: sortKeys(stars.scoresaber),
    beatleader: sortKeys(beatleader.rows),
    blModifierProfiles: beatleader.profiles,
};

writeFileSync(OUTPUT, JSON.stringify(index));
console.log(
    `${OUTPUT}: ${ssCount} ScoreSaber, ${Object.keys(beatleader.rows).length} BeatLeader difficulties ` +
        `(BeatLeader source: ${beatleader.source}), ${beatleader.profiles.length} modifier profiles`,
);
