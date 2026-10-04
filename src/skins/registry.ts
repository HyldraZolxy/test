import type { ComponentType } from "react";
import { ClassicOverlay } from "./classic/ClassicOverlay";
import { HorizonOverlay } from "./horizon/HorizonOverlay";
import { NeonOverlay } from "./neon/NeonOverlay";

/**
 * A skin is a full-screen React component without props.
 *
 * Contract:
 * - read game data through `game/hooks` and display helpers through `skins/shared/hooks`;
 * - honor every `show*` option from `useOverlayOptions()`;
 * - stay `pointer-events-none` (the overlay sits on top of the stream);
 * - render the standby indicator when `useStandbyVisible()` is true.
 *
 * To add a skin: create `skins/<id>/`, then register it below.
 */
export interface SkinDefinition {
    name: string;
    description: string;
    component: ComponentType;
}

export const SKINS = {
    horizon: {
        name: "Horizon Glass",
        description: "Frosted-glass floating widgets with rounded corners and saber-colored accents",
        component: HorizonOverlay,
    },
    neon: {
        name: "Neon Cyber",
        description: "Futuristic angular glow layout with combo dots and a circular energy ring",
        component: NeonOverlay,
    },
    classic: {
        name: "Classic Terminal",
        description: "Retro monospace HUD with horizontal energy/track gauges",
        component: ClassicOverlay,
    },
} as const satisfies Record<string, SkinDefinition>;

export type SkinId = keyof typeof SKINS;

export const SKIN_IDS = Object.keys(SKINS) as SkinId[];
export const DEFAULT_SKIN_ID: SkinId = "horizon";

export function isSkinId(value: unknown): value is SkinId {
    return typeof value === "string" && value in SKINS;
}

/** The skin after `id`, wrapping around. */
export function nextSkinId(id: SkinId): SkinId {
    return SKIN_IDS[(SKIN_IDS.indexOf(id) + 1) % SKIN_IDS.length];
}
