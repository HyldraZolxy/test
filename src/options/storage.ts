import { sanitizeOptions, type OverlayOptions } from "./schema";

/**
 * Two-level persistence:
 * - localStorage: synchronous read at boot, so the overlay renders with the right options immediately
 *   (no flicker when OBS starts the browser source);
 * - IndexedDB: durable copy (localStorage can be evicted more easily).
 */

const DB_NAME = "BeatSaberOverlayDB";
const DB_VERSION = 1;
const STORE_NAME = "settings";
const SETTINGS_KEY = "current_overlay_profile";
export const LOCAL_CACHE_KEY = "bs_overlay_options_cache_v1";

let dbPromise: Promise<IDBDatabase> | null = null;

/** Synchronous read of the cached options (defaults if missing or invalid). */
export function readCachedOptions(): OverlayOptions {
    try {
        const raw = localStorage.getItem(LOCAL_CACHE_KEY);
        if (raw) return sanitizeOptions(JSON.parse(raw));
    } catch {
        // Storage disabled or corrupted: use defaults
    }
    return sanitizeOptions(null);
}

function writeCachedOptions(options: OverlayOptions): void {
    try {
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(options));
    } catch {
        // Storage disabled or full: IndexedDB still holds the options
    }
}

/** Opens the database once and reuses the connection. */
function openDB(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        if (typeof indexedDB === "undefined") {
            reject(new Error("IndexedDB is not available"));
            return;
        }
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            if (!req.result.objectStoreNames.contains(STORE_NAME)) req.result.createObjectStore(STORE_NAME);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        req.onblocked = () => reject(new Error("IndexedDB open blocked"));
    }).catch((err) => {
        dbPromise = null;
        throw err;
    });
    return dbPromise;
}

/** Loads options from IndexedDB, or null when nothing is stored (or IndexedDB is unavailable). */
export async function loadStoredOptions(): Promise<OverlayOptions | null> {
    try {
        const db = await openDB();
        const value = await new Promise<unknown>((resolve, reject) => {
            const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(SETTINGS_KEY);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        if (!value) return null;
        const options = sanitizeOptions(value);
        writeCachedOptions(options);
        return options;
    } catch (err) {
        console.warn("[Options] Could not read IndexedDB:", err);
        return null;
    }
}

/** Persists options to localStorage and IndexedDB. */
export async function saveOptions(options: OverlayOptions): Promise<void> {
    writeCachedOptions(options);
    try {
        const db = await openDB();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            tx.objectStore(STORE_NAME).put(options, SETTINGS_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
        });
    } catch (err) {
        console.warn("[Options] Could not write IndexedDB (localStorage copy kept):", err);
    }
}
