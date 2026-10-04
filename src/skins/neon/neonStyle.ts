import type { CSSProperties } from "react";

/** Cuts the top-left and bottom-right corners: the signature Neon Cyber shape. */
export function neonCut(px: number): CSSProperties {
    return {
        clipPath: `polygon(${px}px 0, 100% 0, 100% calc(100% - ${px}px), calc(100% - ${px}px) 100%, 0 100%, 0 ${px}px)`,
    };
}
