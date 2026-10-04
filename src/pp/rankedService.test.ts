import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeMapRef } from "./mapKey";
import type { BeatLeaderMapInfo, ScoreSaberMapInfo } from "./types";

const ssInfo: ScoreSaberMapInfo = { stars: 4.33, maxPP: 182.35, positiveModifiers: false };
const blInfo = { stars: 5 } as BeatLeaderMapInfo;

const api = {
    scoresaber: vi.fn<() => Promise<ScoreSaberMapInfo | null>>(),
    beatleader: vi.fn<() => Promise<BeatLeaderMapInfo | null>>(),
    index: vi.fn(),
    beatsaver: vi.fn(),
};

vi.mock("./sources/scoresaberApi", () => ({ fetchScoreSaberMap: () => api.scoresaber() }));
vi.mock("./sources/beatleaderApi", () => ({ fetchBeatLeaderMap: () => api.beatleader() }));
vi.mock("./sources/rankedIndex", () => ({ lookupRankedIndex: () => api.index() }));
vi.mock("./sources/beatsaverApi", () => ({ fetchBeatSaverStars: () => api.beatsaver() }));

const { loadRankedData, rankedStore } = await import("./rankedService");

let hashCounter = 0;
/** Fresh hash per test: the service caches results by map. */
const freshRef = () => makeMapRef(`HASH${++hashCounter}`, "Normal", "Standard");
const unreachable = () => Promise.reject(new Error("CORS"));

beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    Object.values(api).forEach((fn) => fn.mockReset());
});

describe("loadRankedData", () => {
    it("uses the official APIs when reachable", async () => {
        api.scoresaber.mockResolvedValue(ssInfo);
        api.beatleader.mockResolvedValue(null);

        await loadRankedData(freshRef());

        const { data } = rankedStore.getState();
        expect(data?.scoresaber).toEqual({ info: ssInfo, source: "api" });
        expect(data?.beatleader).toBeNull();
        expect(api.index).not.toHaveBeenCalled();
    });

    it("falls back to the ranked index when the APIs are unreachable", async () => {
        api.scoresaber.mockImplementation(unreachable);
        api.beatleader.mockImplementation(unreachable);
        api.index.mockResolvedValue({
            scoresaber: { info: ssInfo, source: "index" },
            beatleader: { info: blInfo, source: "index" },
        });

        await loadRankedData(freshRef());

        const { data } = rankedStore.getState();
        expect(data?.scoresaber?.source).toBe("index");
        expect(data?.beatleader?.source).toBe("index");
        expect(api.index).toHaveBeenCalledTimes(1); // shared between both platforms
        expect(api.beatsaver).not.toHaveBeenCalled();
    });

    it("trusts a 'not ranked' answer instead of falling back", async () => {
        api.scoresaber.mockResolvedValue(null);
        api.beatleader.mockResolvedValue(null);

        await loadRankedData(freshRef());

        expect(rankedStore.getState().data).toMatchObject({ scoresaber: null, beatleader: null });
        expect(api.index).not.toHaveBeenCalled();
    });

    it("uses BeatSaver as a last resort", async () => {
        api.scoresaber.mockImplementation(unreachable);
        api.beatleader.mockResolvedValue(null);
        api.index.mockImplementation(unreachable);
        api.beatsaver.mockResolvedValue({ scoresaber: ssInfo, beatleader: null });

        await loadRankedData(freshRef());

        expect(rankedStore.getState().data?.scoresaber).toEqual({ info: ssInfo, source: "beatsaver" });
    });

    it("ignores the response of a map that is no longer played", async () => {
        let resolveSlow: (info: ScoreSaberMapInfo) => void = () => {};
        api.scoresaber.mockReturnValueOnce(new Promise((resolve) => (resolveSlow = resolve)));
        api.beatleader.mockResolvedValue(null);
        const slowRef = freshRef();
        const slow = loadRankedData(slowRef);

        const fastInfo = { ...ssInfo, stars: 7 };
        api.scoresaber.mockResolvedValueOnce(fastInfo);
        const fastRef = freshRef();
        await loadRankedData(fastRef);

        resolveSlow(ssInfo);
        await slow;

        expect(rankedStore.getState().data?.key).toBe(`${fastRef.hash}_Normal_Standard`);
        expect(rankedStore.getState().data?.scoresaber?.info.stars).toBe(7);
    });
});
