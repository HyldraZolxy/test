import { memo } from "react";
import { usePPDisplay } from "../shared/hooks";
import { PPBadges } from "../shared/PPBadges";
import { HORIZON_GLASS, HorizonAccentStripe } from "./HorizonPanel";

/** Standalone PP widget, shown when the score panel is hidden but PP are enabled. */
export const HorizonPP = memo(function HorizonPP({ accentColor }: { accentColor: string }) {
    const { visible } = usePPDisplay();
    if (!visible) return null;

    return (
        <div className={`relative px-5 py-3 ${HORIZON_GLASS}`}>
            <HorizonAccentStripe color={accentColor} />
            <PPBadges
                ssTone="purple"
                glow
                className="flex items-center gap-2.5 text-sm tabular-nums font-black tracking-wide"
            />
        </div>
    );
});
