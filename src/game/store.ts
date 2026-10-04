import type { BSEvent, ConnectionState } from "./protocol";
import { INITIAL_GAME_STATE, isLifecycleEvent, reduceConnection, reduceEvent, type GameState } from "./reducer";

type Listener = () => void;

let state: GameState = INITIAL_GAME_STATE;
const listeners = new Set<Listener>();
let notifyScheduled = false;
/** performance.now() of the last received event, even when it did not change the state. */
let lastEventAt = 0;
/** Whether HttpSiraStatus sent a pause/resume event (it depends on the game version). */
let pauseEventsSeen = false;

function notifyNow(): void {
    notifyScheduled = false;
    listeners.forEach((listener) => listener());
}

/**
 * Coalesces the burst of events Beat Saber emits for a single note
 * (noteCut, scoreChanged, energyChanged…) into one React render.
 */
function notifyBatched(): void {
    if (notifyScheduled) return;
    notifyScheduled = true;
    queueMicrotask(() => {
        if (notifyScheduled) notifyNow();
    });
}

/**
 * Global game store fed by an event source (live WebSocket or mock simulator).
 * Read it through the hooks in `./hooks.ts`.
 */
export const gameStore = {
    getState(): GameState {
        return state;
    },

    subscribe(listener: Listener): () => void {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },

    /**
     * performance.now() of the last received event. While a song plays, events (notes, lights, score)
     * arrive several times per second; a long silence means the game is paused.
     */
    getLastEventAt(): number {
        return lastEventAt;
    },

    /** True once the game sent a "pause" or "resume" event: pauses can then be trusted to be reported. */
    hasPauseEvents(): boolean {
        return pauseEventsSeen;
    },

    /** Folds an HttpSiraStatus event into the state. */
    dispatch(event: BSEvent): void {
        lastEventAt = performance.now();
        if (event.event === "pause" || event.event === "resume") pauseEventsSeen = true;
        const prev = state;
        const next = reduceEvent(prev, event);
        if (next === prev) return;
        state = next;
        if (isLifecycleEvent(event.event) || prev.inSong !== next.inSong) notifyNow();
        else notifyBatched();
    },

    /** Reports the connection state of the event source. */
    setConnection(connection: ConnectionState): void {
        const next = reduceConnection(state, connection);
        if (next === state) return;
        state = next;
        notifyNow();
    },
};

/**
 * Builds a selector returning a referentially stable object as long as its fields are equal,
 * as required by `useSyncExternalStore` for derived snapshots.
 */
export function createSliceSelector<T extends object>(select: (state: GameState) => T): () => T {
    let cached: T | null = null;
    return () => {
        const next = select(state);
        const prev = cached;
        if (prev && (Object.keys(next) as (keyof T)[]).every((key) => Object.is(next[key], prev[key]))) {
            return prev;
        }
        cached = next;
        return next;
    };
}
