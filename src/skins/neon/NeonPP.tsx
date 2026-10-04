import { memo } from "react";
import { usePPDisplay } from "../shared/hooks";
import { PPBadges } from "../shared/PPBadges";
import { neonCut } from "./neonStyle";

/** Standalone PP widget, shown when the score panel is hidden but PP are enabled. */
export const NeonPP = memo(function NeonPP() {
    const { visible } = usePPDisplay();
    if (!visible) return null;

    return (
        <div
            className="px-5 py-3 backdrop-blur-xl bg-zinc-950/90 border border-cyan-400/40 shadow-[0_0_35px_-8px_rgba(6,182,212,0.5)]"
            style={neonCut(12)}
        >
            <PPBadges
                ssTone="fuchsia"
                glow
                className="flex items-center gap-2.5 text-sm tabular-nums font-black tracking-wide"
            />
        </div>
    );
});
