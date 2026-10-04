import type { ReactNode } from "react";

/** Frosted-glass card used by every Horizon widget. */
export const HORIZON_GLASS =
    "rounded-2xl backdrop-blur-2xl bg-zinc-950/85 border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.8)]";

/** Thin gradient line along the top edge of a Horizon widget. */
export function HorizonAccentStripe({ color, inset = "inset-x-4" }: { color: string; inset?: string }): ReactNode {
    return (
        <div
            className={`absolute top-0 ${inset} h-[2px] rounded-full opacity-90`}
            style={{ background: `linear-gradient(to right, transparent, ${color}, transparent)` }}
        />
    );
}
