import { describe, expect, it } from "vitest";
import type { BeatmapInfo, BSEvent, Performance } from "./protocol";
import { INITIAL_GAME_STATE, isLifecycleEvent, reduceConnection, reduceEvent, type GameState } from "./reducer";

const BEATMAP = {
    songName: "Data Loss",
    songHash: "395477673EEADF9B79B9C6B58E99D87C138E0D77",
    length: 169_000,
    difficultyEnum: "Normal",
    notesCount: 0,
    maxScore: 355235,
} as BeatmapInfo;

const event = (name: BSEvent["event"], status: BSEvent["status"] = {}): BSEvent => ({ event: name, time: 0, status });
const perf = (fields: Partial<Performance>) => fields as Performance;

function play(...events: BSEvent[]): GameState {
    return events.reduce(reduceEvent, reduceConnection(INITIAL_GAME_STATE, "connected"));
}

describe("reduceEvent", () => {
    it("enters the song on songStart and resets energy", () => {
        const state = play(event("songStart", { beatmap: BEATMAP, performance: perf({ energy: 0.9 }) }));
        expect(state.inSong).toBe(true);
        expect(state.energy).toBe(0.5);
        expect(state.game?.scene).toBe("Song");
    });

    it("recovers the note count from the max score", () => {
        const state = play(event("songStart", { beatmap: BEATMAP }));
        expect(state.beatmap?.notesCount).toBe(394);
    });

    it("clears beatmap and performance when going back to the menu", () => {
        const state = play(
            event("songStart", { beatmap: BEATMAP }),
            event("scoreChanged", { performance: perf({ score: 1000 }) }),
            event("menu"),
        );
        expect(state.inSong).toBe(false);
        expect(state.beatmap).toBeNull();
        expect(state.performance).toBeNull();
    });

    it("treats gameplay events as being in a song (overlay opened mid-song)", () => {
        expect(play(event("noteCut")).inSong).toBe(true);
    });

    it("merges partial performance updates", () => {
        const state = play(
            event("songStart", { beatmap: BEATMAP }),
            event("scoreChanged", { performance: perf({ score: 1000, combo: 5 }) }),
            event("scoreChanged", { performance: perf({ score: 1100 }) }),
        );
        expect(state.performance).toMatchObject({ score: 1100, combo: 5 });
    });

    it("marks the soft fail", () => {
        const state = play(
            event("songStart", { beatmap: BEATMAP, performance: perf({ softFailed: false }) }),
            event("softFailed"),
        );
        expect(state.performance?.softFailed).toBe(true);
    });

    it("sets energy to 0 on fail and reads energyChanged values", () => {
        expect(play(event("songStart"), event("energyChanged", { energy: 0.7 })).energy).toBe(0.7);
        expect(play(event("songStart"), event("failed")).energy).toBe(0);
    });

    it("keeps the same reference when nothing changed", () => {
        const state = play(event("songStart", { beatmap: BEATMAP }), event("pause"));
        expect(reduceEvent(state, event("pause"))).toBe(state);
    });

    it("never changes the connection state", () => {
        expect(reduceEvent(INITIAL_GAME_STATE, event("songStart")).connection).toBe("disconnected");
    });
});

describe("reduceConnection", () => {
    it("leaves the song when the connection drops", () => {
        const state = play(event("songStart"));
        expect(reduceConnection(state, "disconnected").inSong).toBe(false);
    });
});

describe("isLifecycleEvent", () => {
    it("flags events that change the screen", () => {
        expect(isLifecycleEvent("songStart")).toBe(true);
        expect(isLifecycleEvent("menu")).toBe(true);
        expect(isLifecycleEvent("noteCut")).toBe(false);
    });
});
