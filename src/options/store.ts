import { useSyncExternalStore } from "react";
import { DEFAULT_OPTIONS, sanitizeOptions, type OverlayOptions } from "./schema";
import { loadStoredOptions, readCachedOptions, saveOptions } from "./storage";

const SYNC_CHANNEL = "bs_overlay_options_sync";

let current: OverlayOptions = readCachedOptions();
const listeners = new Set<() => void>();
let channel: BroadcastChannel | null = null;
/** Set once options changed after boot (locally or from another window). */
let changedSinceBoot = false;
let initialized = false;

function set(next: OverlayOptions): void {
    current = next;
    listeners.forEach((listener) => listener());
}

function commit(next: OverlayOptions): void {
    changedSinceBoot = true;
    set(next);
    void saveOptions(next);
    channel?.postMessage(next);
}

/**
 * Starts cross-window sync and hydrates options from IndexedDB.
 * Call once at boot. Every OBS browser source sharing this origin stays in sync live.
 */
export function initOptions(): void {
    if (initialized) return;
    initialized = true;

    if (typeof BroadcastChannel !== "undefined") {
        channel = new BroadcastChannel(SYNC_CHANNEL);
        channel.onmessage = (event: MessageEvent<unknown>) => {
            changedSinceBoot = true;
            set(sanitizeOptions(event.data));
        };
    }

    void loadStoredOptions().then((stored) => {
        // Never overwrite a change made while IndexedDB was loading
        if (stored && !changedSinceBoot) set(stored);
    });
}

export const optionsStore = {
    getSnapshot: (): OverlayOptions => current,

    subscribe(listener: () => void): () => void {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
};

/** All overlay options; re-renders on any change. */
export function useOverlayOptions(): OverlayOptions {
    return useSyncExternalStore(optionsStore.subscribe, optionsStore.getSnapshot);
}

/** Updates a single option and propagates it to storage and other windows. */
export function setOverlayOption<K extends keyof OverlayOptions>(key: K, value: OverlayOptions[K]): void {
    commit({ ...current, [key]: value });
}

/** Replaces all options (e.g. profile import); the input is validated. */
export function setAllOverlayOptions(options: unknown): void {
    commit(sanitizeOptions(options));
}

/** Restores the default options. */
export function resetOverlayOptions(): void {
    commit({ ...DEFAULT_OPTIONS });
}
