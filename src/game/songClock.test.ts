import { describe, expect, it } from "vitest";
import { SILENT_PAUSE_MS } from "../config";
import { SongClock, type ClockInput } from "./songClock";

const playing = (reportedMs: number, extra: Partial<ClockInput> = {}): ClockInput => ({
    inSong: true,
    songKey: "A|Normal|Standard",
    reportedMs,
    paused: false,
    ...extra,
});

/** Starts a song at t=0 and keeps events flowing every 100 ms up to `until`. */
function play(clock: SongClock, until: number): number {
    clock.sync(playing(0), 0);
    let lastEventAt = 0;
    for (let t = 100; t <= until; t += 100) {
        clock.sync(playing(Math.floor(t / 1000) * 1000), t);
        lastEventAt = t;
    }
    return lastEventAt;
}

describe("SongClock", () => {
    it("extrapolates between events", () => {
        const clock = new SongClock();
        const last = play(clock, 2500);
        expect(clock.elapsedAt(2550, last)).toBeCloseTo(2550);
    });

    it("never jumps backwards on whole-second reports", () => {
        const clock = new SongClock();
        clock.sync(playing(0), 0);
        // First report of second 1 arrives late, at 1.7 s
        clock.sync(playing(1000), 1700);
        expect(clock.elapsedAt(1700, 1700)).toBeCloseTo(1700);
    });

    it("corrects a clock that drifted out of the reported second", () => {
        const clock = new SongClock();
        clock.sync(playing(0), 0);
        clock.sync(playing(5000), 1000); // the game is far ahead (e.g. after a seek)
        expect(clock.elapsedAt(1000, 1000)).toBe(5000);
    });

    it("freezes when no event arrives (pause without a pause event)", () => {
        const clock = new SongClock();
        const last = play(clock, 3000);
        const pausedAt = last + SILENT_PAUSE_MS + 500;
        expect(clock.elapsedAt(pausedAt, last)).toBeCloseTo(3000);
        expect(clock.elapsedAt(pausedAt + 10_000, last)).toBeCloseTo(3000);
        expect(clock.isPaused(pausedAt, last)).toBe(true);
    });

    it("resumes from the frozen position when events come back", () => {
        const clock = new SongClock();
        const last = play(clock, 3000);
        clock.elapsedAt(last + 5000, last); // frozen at 3000
        const resumedAt = last + 20_000;
        clock.sync(playing(3000), resumedAt);
        expect(clock.elapsedAt(resumedAt + 400, resumedAt + 300)).toBeCloseTo(3400);
    });

    it("honors explicit pause events", () => {
        const clock = new SongClock();
        clock.sync(playing(0), 0);
        clock.sync(playing(0, { paused: true }), 800);
        expect(clock.elapsedAt(900, 800)).toBeCloseTo(800);
        clock.sync(playing(0), 5000);
        expect(clock.elapsedAt(5100, 5000)).toBeCloseTo(900);
    });

    it("does not reset on resume (the game moves its start epoch, not the song)", () => {
        const clock = new SongClock();
        clock.sync(playing(0), 0);
        clock.sync(playing(2000, { paused: true }), 2500);
        clock.sync(playing(2000), 9000); // resume
        expect(clock.elapsedAt(9100, 9000)).toBeCloseTo(2600);
    });

    it("ignores silence when pause events are reliable", () => {
        const clock = new SongClock();
        const last = play(clock, 3000);
        expect(clock.elapsedAt(last + 5000, last, false)).toBeCloseTo(8000);
        expect(clock.isPaused(last + 5000, last, false)).toBe(false);
    });

    it("restarts on a new song", () => {
        const clock = new SongClock();
        play(clock, 4000);
        clock.sync(playing(0, { songKey: "B|Hard|Standard" }), 10_000);
        expect(clock.elapsedAt(10_050, 10_000)).toBeCloseTo(50);
    });
});
