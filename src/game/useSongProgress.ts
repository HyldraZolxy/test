import { useSyncExternalStore } from "react";
import { PROGRESS_TICK_MS } from "../config";
import { SongClock } from "./songClock";
import { gameStore } from "./store";

export interface SongProgress {
    elapsedMs: number;
    remainingMs: number;
    /** 0..1 */
    progress: number;
    isPaused: boolean;
}

const IDLE_PROGRESS: SongProgress = { elapsedMs: 0, remainingMs: 0, progress: 0, isPaused: false };

const clock = new SongClock();
let inSong = false;
let lengthMs = 0;

let snapshot: SongProgress = IDLE_PROGRESS;
const listeners = new Set<() => void>();
let rafId: number | null = null;
let lastTick = 0;
let unsubscribeGame: (() => void) | null = null;

function publish(next: SongProgress): void {
    if (next === snapshot) return;
    snapshot = next;
    listeners.forEach((listener) => listener());
}

function refreshSnapshot(): void {
    if (!inSong || lengthMs <= 0) {
        publish(IDLE_PROGRESS);
        return;
    }
    const now = performance.now();
    const lastEventAt = gameStore.getLastEventAt();
    // Real pause events make the silence fallback unnecessary (it would freeze on quiet map sections)
    const detectSilence = !gameStore.hasPauseEvents();
    const elapsedMs = Math.min(lengthMs, Math.max(0, clock.elapsedAt(now, lastEventAt, detectSilence)));
    const isPaused = clock.isPaused(now, lastEventAt, detectSilence);
    if (snapshot.elapsedMs === elapsedMs && snapshot.isPaused === isPaused) return;
    publish({ elapsedMs, remainingMs: lengthMs - elapsedMs, progress: elapsedMs / lengthMs, isPaused });
}

function isRunning(): boolean {
    // Keeps ticking while paused by silence, to notice when events resume
    return inSong && lengthMs > 0 && listeners.size > 0;
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

function syncFromGame(): void {
    const { inSong: playing, beatmap, performance: perf, lastEvent } = gameStore.getState();
    inSong = playing;
    lengthMs = beatmap?.length ?? 0;
    clock.sync(
        {
            inSong: playing,
            songKey: beatmap ? `${beatmap.songHash ?? beatmap.songName}|${beatmap.difficulty}|${beatmap.characteristic}` : null,
            reportedMs: (perf?.currentSongTime ?? 0) * 1000,
            paused: beatmap?.paused != null || lastEvent === "pause",
        },
        performance.now(),
    );
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
