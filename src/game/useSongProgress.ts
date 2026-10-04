import { useSyncExternalStore } from "react";
import { PROGRESS_TICK_MS } from "../config";
import { gameStore } from "./store";

export interface SongProgress {
    elapsedMs: number;
    remainingMs: number;
    /** 0..1 */
    progress: number;
    isPaused: boolean;
}

const IDLE_PROGRESS: SongProgress = { elapsedMs: 0, remainingMs: 0, progress: 0, isPaused: false };

/**
 * Local song clock. HttpSiraStatus only reports the song time when an event happens,
 * so the clock is extrapolated between events and re-synced whenever the game reports a new time.
 */
const clock = {
    inSong: false,
    lengthMs: 0,
    paused: false,
    songStart: null as number | null,
    /** Last song time reported by the game, used to detect real updates. */
    reportedMs: -1,
    /** Song time at `syncedAt`. */
    syncedMs: 0,
    /** performance.now() of the last sync. */
    syncedAt: 0,
};

let snapshot: SongProgress = IDLE_PROGRESS;
const listeners = new Set<() => void>();
let rafId: number | null = null;
let lastTick = 0;
let unsubscribeGame: (() => void) | null = null;

function elapsedAt(now: number): number {
    return clock.paused ? clock.syncedMs : clock.syncedMs + (now - clock.syncedAt);
}

function publish(next: SongProgress): void {
    if (next === snapshot) return;
    snapshot = next;
    listeners.forEach((listener) => listener());
}

function refreshSnapshot(): void {
    if (!clock.inSong || clock.lengthMs <= 0) {
        publish(IDLE_PROGRESS);
        return;
    }
    const elapsedMs = Math.min(clock.lengthMs, Math.max(0, elapsedAt(performance.now())));
    publish({
        elapsedMs,
        remainingMs: clock.lengthMs - elapsedMs,
        progress: elapsedMs / clock.lengthMs,
        isPaused: clock.paused,
    });
}

function isRunning(): boolean {
    return clock.inSong && !clock.paused && clock.lengthMs > 0 && listeners.size > 0;
}

function stopLoop(): void {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
}

function startLoop(): void {
    if (rafId !== null || !isRunning()) return;
    const loop = (timestamp: number) => {
        if (!isRunning()) {
            stopLoop();
            return;
        }
        if (timestamp - lastTick >= PROGRESS_TICK_MS) {
            lastTick = timestamp;
            refreshSnapshot();
        }
        rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
}

/** Re-syncs the clock from the game state; only real time updates move it. */
function syncFromGame(): void {
    const { inSong, beatmap, performance: perf, lastEvent } = gameStore.getState();
    const now = performance.now();
    const reportedMs = (perf?.currentSongTime ?? 0) * 1000;
    const paused = beatmap?.paused != null || lastEvent === "pause";
    const songStart = beatmap?.start ?? null;

    const newSong = inSong !== clock.inSong || songStart !== clock.songStart;
    if (newSong || reportedMs !== clock.reportedMs) {
        clock.syncedMs = reportedMs;
        clock.syncedAt = now;
    } else if (paused !== clock.paused) {
        // Freeze (or resume) at the extrapolated position
        clock.syncedMs = elapsedAt(now);
        clock.syncedAt = now;
    }

    clock.inSong = inSong;
    clock.lengthMs = beatmap?.length ?? 0;
    clock.paused = paused;
    clock.songStart = songStart;
    clock.reportedMs = reportedMs;

    refreshSnapshot();
    if (isRunning()) startLoop();
    else stopLoop();
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    if (!unsubscribeGame) {
        unsubscribeGame = gameStore.subscribe(syncFromGame);
        syncFromGame();
    }
    startLoop();
    return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
            stopLoop();
            unsubscribeGame?.();
            unsubscribeGame = null;
        }
    };
}

/**
 * Smooth song progress (elapsed / remaining / ratio), refreshed at ~25 FPS.
 * A single animation loop is shared by all subscribers and stops when nothing listens.
 */
export function useSongProgress(): SongProgress {
    return useSyncExternalStore(subscribe, () => snapshot);
}
