/**
 * Central configuration: every default value and tuning constant lives here,
 * so behaviour can be adjusted without hunting magic numbers across the codebase.
 */

/** HttpSiraStatus WebSocket endpoint defaults (overridable with `?host=` / `?port=`). */
export const SIRA_DEFAULT_HOST = "127.0.0.1";
export const SIRA_DEFAULT_PORT = 6557;

/** Reconnection backoff for the HttpSiraStatus WebSocket. */
export const RECONNECT_BASE_DELAY_MS = 1500;
export const RECONNECT_BACKOFF_FACTOR = 1.3;
export const RECONNECT_MAX_DELAY_MS = 8000;

/** UI scale applied to the whole overlay. */
export const DEFAULT_UI_SCALE = 1.15;
/** Scale used by the `?twitch=true` preset. */
export const TWITCH_PRESET_SCALE = 1.25;
/** Scale choices offered in the settings panel. */
export const UI_SCALE_CHOICES = [
    { scale: 1.0, label: "100%" },
    { scale: 1.15, label: "115% (Twitch)" },
    { scale: 1.3, label: "130% (Large)" },
    { scale: 1.5, label: "150% (Max)" },
] as const;

/** How long the shortcut help bar stays visible before auto-hiding. */
export const HELP_BAR_AUTO_HIDE_MS = 8000;
/** How long a "connected" badge stays visible before fading out. */
export const CONNECTION_BADGE_AUTO_HIDE_MS = 8000;

/** Song progress clock refresh interval (~25 FPS keeps OBS CPU usage low). */
export const PROGRESS_TICK_MS = 40;

/**
 * No game event for this long during a song means the game is paused: the progress clock freezes.
 * Needed because HttpSiraStatus does not always send "pause"/"resume" events.
 */
export const SILENT_PAUSE_MS = 1500;

/** Energy below this ratio is displayed as "low" (red, pulsing). */
export const LOW_ENERGY_THRESHOLD = 0.25;
/** Energy at song start in Beat Saber. */
export const INITIAL_ENERGY = 0.5;

/** Highest combo multiplier in Beat Saber, and its successive steps. */
export const MAX_MULTIPLIER = 8;
export const MULTIPLIER_STEPS = [1, 2, 4, 8] as const;

/**
 * Pre-filtered ranked index published by `.github/workflows/ranked-index.yml`.
 * raw.githubusercontent.com serves it gzip-compressed with `Access-Control-Allow-Origin: *`,
 * so it also works when the overlay is opened from `file:///`.
 */
export const HOSTED_RANKED_INDEX_URL =
    "https://raw.githubusercontent.com/HyldraZolxy/test/ranked-index/ranked-index.json";

/** How long a downloaded ranked index stays fresh in localStorage. */
export const RANKED_INDEX_TTL_MS = 6 * 60 * 60 * 1000;

/** Maximum number of map difficulties kept in the in-memory ranked data cache. */
export const RANKED_CACHE_MAX_ENTRIES = 200;
