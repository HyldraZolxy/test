import { SILENT_PAUSE_MS } from "../config";

/** What the clock needs from the game, sampled at time `now`. */
export interface ClockInput {
    inSong: boolean;
    /** Song identity (hash + difficulty); a change means another song. */
    songKey: string | null;
    /** Song time reported by the game, in ms. HttpSiraStatus sends whole seconds. */
    reportedMs: number;
    /** Explicit pause reported by the game. */
    paused: boolean;
}

/** Precision of the reported song time (HttpSiraStatus sends an integer number of seconds). */
const REPORT_RESOLUTION_MS = 1000;

/**
 * Song clock extrapolated between game events.
 *
 * - The reported time only moves the clock when the clock leaves `[reported, reported + 1 s)`,
 *   so whole-second reports never make the bar jump backwards.
 * - Pauses come from the game's "pause"/"resume" events. As a fallback for setups where
 *   HttpSiraStatus does not send them, no event at all for {@link SILENT_PAUSE_MS} also freezes
 *   the clock (the game freezes while paused); it then resumes from where it stopped.
 *
 * All times are `performance.now()` values, passed in for testability.
 */
export class SongClock {
    private inSong = false;
    private songKey: string | null = null;
    private explicitPause = false;
    private reportedMs = -1;
    /** Song time at `syncedAt`. */
    private syncedMs = 0;
    private syncedAt = 0;
    /** Set while frozen by a silence: the frozen song time and the last event seen. */
    private frozen: { ms: number; lastEventAt: number } | null = null;

    /** Applies a game update received at `now`. */
    sync(input: ClockInput, now: number): void {
        // Not the start epoch: HttpSiraStatus moves it on every resume
        const newSong = input.inSong !== this.inSong || input.songKey !== this.songKey;
        if (newSong) {
            this.rebase(input.reportedMs, now);
        } else {
            const current = this.elapsedAt(now, now);
            if (input.reportedMs !== this.reportedMs) {
                // Keep the smooth extrapolation as long as it agrees with the reported second
                const clamped = Math.min(
                    Math.max(current, input.reportedMs),
                    input.reportedMs + REPORT_RESOLUTION_MS - 1,
                );
                this.rebase(clamped, now);
            } else if (input.paused !== this.explicitPause) {
                this.rebase(current, now);
            }
        }
        this.inSong = input.inSong;
        this.songKey = input.songKey;
        this.explicitPause = input.paused;
        this.reportedMs = input.reportedMs;
    }

    /**
     * Song time at `now`, given the time of the last received game event.
     * `detectSilence` enables the silence-based pause fallback (when the game does not send pauses).
     */
    elapsedAt(now: number, lastEventAt: number, detectSilence = true): number {
        if (this.explicitPause) return this.syncedMs;

        if (this.frozen) {
            if (lastEventAt <= this.frozen.lastEventAt) return this.frozen.ms;
            // Events are flowing again: resume from where the clock stopped
            this.rebase(this.frozen.ms, lastEventAt);
        }

        if (detectSilence && now - lastEventAt > SILENT_PAUSE_MS) {
            const ms = this.syncedMs + Math.max(0, lastEventAt - this.syncedAt);
            this.frozen = { ms, lastEventAt };
            return ms;
        }
        return this.syncedMs + (now - this.syncedAt);
    }

    /** Paused explicitly or by silence. */
    isPaused(now: number, lastEventAt: number, detectSilence = true): boolean {
        if (this.explicitPause || this.frozen !== null) return true;
        return detectSilence && now - lastEventAt > SILENT_PAUSE_MS;
    }

    private rebase(ms: number, at: number): void {
        this.syncedMs = ms;
        this.syncedAt = at;
        this.frozen = null;
    }
}
