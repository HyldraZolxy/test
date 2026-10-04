import { SIRA_DEFAULT_HOST, SIRA_DEFAULT_PORT } from "../config";
import { DEFAULT_SKIN_ID, isSkinId, type SkinId } from "../skins/registry";

/**
 * Query-string configuration, e.g. `index.html?skin=neon&scale=1.25&mock=true`.
 * Every parameter is optional and validated; invalid values fall back to defaults.
 */
export interface UrlParams {
    /** HttpSiraStatus host (`?host=`). */
    host: string;
    /** HttpSiraStatus port (`?port=`). */
    port: number;
    /** Initial skin (`?skin=`). */
    skin: SkinId;
    /** Start with the simulator (`?mock=true`). */
    mock: boolean;
    /** Open the settings panel at load (`?settings=true`, alias `?config=true`). */
    openSettings: boolean;
    /** Forced UI scale (`?scale=1.25`); overrides the saved option. */
    scale: number | null;
    /** Twitch preset: larger default scale (`?twitch=true`, alias `?stream=true`). */
    twitchPreset: boolean;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

function isTrue(value: string | null): boolean {
    return value === "true" || value === "1";
}

export function parseUrlParams(search: string): UrlParams {
    const params = new URLSearchParams(search);

    const port = Number(params.get("port"));
    const scale = Number(params.get("scale"));
    const skin = params.get("skin");

    return {
        host: params.get("host")?.trim() || SIRA_DEFAULT_HOST,
        port: Number.isInteger(port) && port > 0 && port < 65536 ? port : SIRA_DEFAULT_PORT,
        skin: isSkinId(skin) ? skin : DEFAULT_SKIN_ID,
        mock: isTrue(params.get("mock")),
        openSettings: isTrue(params.get("settings")) || isTrue(params.get("config")),
        scale: params.has("scale") && scale >= MIN_SCALE && scale <= MAX_SCALE ? scale : null,
        twitchPreset: isTrue(params.get("twitch")) || isTrue(params.get("stream")),
    };
}
