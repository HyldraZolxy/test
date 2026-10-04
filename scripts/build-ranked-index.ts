/**
 * Builds the ranked index read by the overlay (src/pp/sources/rankedIndex.ts) and published
 * by .github/workflows/ranked-index.yml. Runs server-side, where CORS does not apply:
 * - ScoreSaber stars: SongDetailsCache dump;
 * - BeatLeader: full ranked data from the BeatLeader API (ratings, modifier values, speed ratings).
 *
 * Usage: npm run build:index -- [output file]
 */
import { writeFileSync } from "node:fs";
import { mapKey, normalizeCharacteristic, normalizeDifficulty } from "../src/pp/mapKey";
import { parseBeatLeaderDifficulty, type BeatLeaderApiDifficulty } from "../src/pp/sources/beatleaderApi";
import {
    encodeBeatLeaderRow,
    RANKED_INDEX_VERSION,
    type BeatLeaderRow,
    type RankedIndexFile,
} from "../src/pp/sources/rankedIndex";
import { downloadRankedStars } from "../src/pp/sources/songDetailsDump";

const OUTPUT = process.argv[2] ?? "ranked-index.json";
const BEATLEADER_PAGE_SIZE = 100;
const REQUEST_DELAY_MS = 250;
/** Sanity floors: a broken upstream must never overwrite a good published index. */
const MIN_SCORESABER_ENTRIES = 3000;
const MIN_BEATLEADER_ENTRIES = 2000;

interface BeatLeaderLeaderboardsPage {
    metadata: { total: number };
    data: { song: { hash: string }; difficulty: BeatLeaderApiDifficulty }[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchBeatLeaderRanked(profiles: number[][]): Promise<Record<string, BeatLeaderRow>> {
    const rows: Record<string, BeatLeaderRow> = {};
    for (let page = 1; ; page++) {
        const url = `https://api.beatleader.xyz/leaderboards?type=ranked&page=${page}&count=${BEATLEADER_PAGE_SIZE}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`BeatLeader HTTP ${res.status} on page ${page}`);
        const body = (await res.json()) as BeatLeaderLeaderboardsPage;

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

        if (page * BEATLEADER_PAGE_SIZE >= body.metadata.total) return rows;
        await sleep(REQUEST_DELAY_MS);
    }
}

const stars = await downloadRankedStars();
const blModifierProfiles: number[][] = [];
const beatleader = await fetchBeatLeaderRanked(blModifierProfiles);

const ssCount = Object.keys(stars.scoresaber).length;
const blCount = Object.keys(beatleader).length;
if (ssCount < MIN_SCORESABER_ENTRIES || blCount < MIN_BEATLEADER_ENTRIES) {
    throw new Error(`Suspicious index: ${ssCount} ScoreSaber / ${blCount} BeatLeader entries`);
}

// Sorted keys keep the file stable between runs
const sortKeys = <T>(record: Record<string, T>) =>
    Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));

const index: RankedIndexFile = {
    version: RANKED_INDEX_VERSION,
    generatedAt: new Date().toISOString(),
    beatleaderSource: "api",
    scoresaber: sortKeys(stars.scoresaber),
    beatleader: sortKeys(beatleader),
    blModifierProfiles,
};

writeFileSync(OUTPUT, JSON.stringify(index));
console.log(`${OUTPUT}: ${ssCount} ScoreSaber, ${blCount} BeatLeader difficulties, ${blModifierProfiles.length} modifier profiles`);
