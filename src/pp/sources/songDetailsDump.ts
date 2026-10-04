import { CHARACTERISTICS, DIFFICULTIES, mapKey } from "../mapKey";

/**
 * Reader for the SongDetailsCache dump (the database Beat Saber mods use):
 * every BeatSaver map with ScoreSaber and BeatLeader star ratings, refreshed several times a day.
 * Served by GitHub with `Access-Control-Allow-Origin: *` (~10 MB gzipped protobuf).
 *
 * @see https://github.com/kinsi55/BeatSaber_SongDetails (schema: Structs/*.cs)
 */

export const SONG_DETAILS_DUMP_URLS = [
    "https://raw.githubusercontent.com/kinsi55/BeatSaberScrappedData/master/songDetails2_v3.gz",
    "https://cdn.jsdelivr.net/gh/kinsi55/BeatSaberScrappedData/songDetails2_v3.gz",
];

/** Star ratings of ranked difficulties, keyed by {@link mapKey}. */
export interface RankedStars {
    scoresaber: Record<string, number>;
    beatleader: Record<string, number>;
}

// SongProto.rankedStates flags
const RANKED_SCORESABER = 1 << 0;
const RANKED_BEATLEADER = 1 << 1;
// SongDifficultyProto enum indices
const PROTO_CHARACTERISTICS = ["Custom", "Standard", "OneSaber", "NoArrows", "90Degree", "360Degree", "Lightshow", "Lawless"];
const DEFAULT_CHARACTERISTIC = 1; // Standard
const DEFAULT_DIFFICULTY = 4; // ExpertPlus

/** Downloads the dump (first reachable mirror) and extracts ranked star ratings. */
export async function downloadRankedStars(): Promise<RankedStars> {
    let lastError: unknown;
    for (const url of SONG_DETAILS_DUMP_URLS) {
        try {
            const res = await fetch(url);
            if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
            const stream = res.body.pipeThrough(new DecompressionStream("gzip"));
            return parseSongDetailsDump(new Uint8Array(await new Response(stream).arrayBuffer()));
        } catch (err) {
            lastError = err;
        }
    }
    throw lastError;
}

// --- Minimal protobuf decoding (only what the dump uses: varints and length-delimited fields) ---

function readVarint(buf: Uint8Array, pos: { p: number }): number {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
        byte = buf[pos.p++];
        // Multiplication instead of bit shifts: values can exceed 32 bits
        result += (byte & 0x7f) * 2 ** shift;
        shift += 7;
    } while (byte & 0x80);
    return result;
}

type FieldHandler = (field: number, value: number, start: number, end: number) => void;

/**
 * Walks the fields of a message. Varints are passed as `value`;
 * length-delimited fields get `value = -1` and their byte range `[start, end)`.
 */
function readMessage(buf: Uint8Array, start: number, end: number, onField: FieldHandler): void {
    const pos = { p: start };
    while (pos.p < end) {
        const tag = readVarint(buf, pos);
        const field = Math.floor(tag / 8);
        switch (tag & 7) {
            case 0:
                onField(field, readVarint(buf, pos), 0, 0);
                break;
            case 1:
                pos.p += 8;
                break;
            case 2: {
                const length = readVarint(buf, pos);
                onField(field, -1, pos.p, pos.p + length);
                pos.p += length;
                break;
            }
            case 5:
                pos.p += 4;
                break;
            default:
                throw new Error(`Unsupported protobuf wire type ${tag & 7}`);
        }
    }
}

/** Parses a decompressed `SongProtoContainer` and keeps ranked difficulties only. */
export function parseSongDetailsDump(buf: Uint8Array): RankedStars {
    let hashesStart = -1;
    const songs: [number, number][] = [];
    readMessage(buf, 0, buf.length, (field, _value, start, end) => {
        if (field === 3) hashesStart = start; // 20-byte SHA1 per song, same order as `songs`
        else if (field === 4) songs.push([start, end]);
    });
    if (hashesStart < 0) throw new Error("Invalid SongDetails dump: no hashes");

    const result: RankedStars = { scoresaber: {}, beatleader: {} };

    songs.forEach(([start, end], index) => {
        let rankedStates = 0;
        const diffs: [number, number][] = [];
        readMessage(buf, start, end, (field, value, dStart, dEnd) => {
            if (field === 13) rankedStates = value;
            else if (field === 11) diffs.push([dStart, dEnd]);
        });
        if (!(rankedStates & (RANKED_SCORESABER | RANKED_BEATLEADER))) return;

        let hash = "";
        for (let b = 0; b < 20; b++) hash += buf[hashesStart + index * 20 + b].toString(16).padStart(2, "0");
        hash = hash.toUpperCase();

        for (const [dStart, dEnd] of diffs) {
            let characteristic = DEFAULT_CHARACTERISTIC;
            let difficulty = DEFAULT_DIFFICULTY;
            let ssStarsT100 = 0;
            let blStarsT100 = 0;
            readMessage(buf, dStart, dEnd, (field, value) => {
                if (field === 1) characteristic = value;
                else if (field === 2) difficulty = value;
                else if (field === 4) ssStarsT100 = value;
                else if (field === 5) blStarsT100 = value;
            });

            const characteristicName = PROTO_CHARACTERISTICS[characteristic];
            const difficultyName = DIFFICULTIES[difficulty];
            if (!difficultyName || !CHARACTERISTICS.includes(characteristicName as (typeof CHARACTERISTICS)[number])) {
                continue;
            }
            const key = mapKey({
                hash,
                difficulty: difficultyName,
                characteristic: characteristicName as (typeof CHARACTERISTICS)[number],
            });
            if (rankedStates & RANKED_SCORESABER && ssStarsT100 > 0) result.scoresaber[key] = ssStarsT100 / 100;
            if (rankedStates & RANKED_BEATLEADER && blStarsT100 > 0) result.beatleader[key] = blStarsT100 / 100;
        }
    });

    return result;
}
