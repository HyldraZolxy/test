import { memo } from "react";
import { usePPDisplay } from "../shared/hooks";
import { PPBadges } from "../shared/PPBadges";

/** Standalone PP widget, shown when the score panel is hidden but PP are enabled. */
export const ClassicPP = memo(function ClassicPP() {
    const { visible } = usePPDisplay();
    if (!visible) return null;

    return (
        <div className="border border-cyan-400/40 bg-zinc-950/90 backdrop-blur-md px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
            <PPBadges ssTone="purple" className="flex items-center gap-2 text-xs tabular-nums font-black" />
        </div>
    );
});
