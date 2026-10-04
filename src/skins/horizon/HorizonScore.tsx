import { memo } from "react";
import { useOverlayOptions } from "../../options/store";
import { RANK_COLORS } from "../../utils/format";
import { useScoreDisplay } from "../shared/hooks";
import { PPBadges } from "../shared/PPBadges";
import { HORIZON_GLASS, HorizonAccentStripe } from "./HorizonPanel";

export const HorizonScore = memo(function HorizonScore({ accentColor }: { accentColor: string }) {
    const { score, acc, rank } = useScoreDisplay();
    const { showRank } = useOverlayOptions();

    return (
        <div className={`relative flex items-center gap-5 px-6 py-3.5 ${HORIZON_GLASS}`}>
            <HorizonAccentStripe color={accentColor} />

            {showRank && (
                <div
                    className="flex items-center justify-center h-14 w-14 rounded-xl bg-white/8 border border-white/15 shadow-inner shrink-0"
                    style={{ boxShadow: "inset 0 1px 2px rgba(255,255,255,0.15)" }}
                >
                    <span className={`text-3xl font-black tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] ${RANK_COLORS[rank]}`}>
                        {rank}
                    </span>
                </div>
            )}

            <div className="flex flex-col items-end min-w-[150px]">
                <span className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-bold leading-none mb-0.5">
                    Score
                </span>
                <span className="text-3xl font-black tabular-nums tracking-tight text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                    {score}
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-[11px] uppercase tracking-wider text-white/70 font-bold">Acc</span>
                    <span
                        className="text-base font-black tabular-nums drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                        style={{ color: accentColor }}
                    >
                        {acc}
                        <span className="text-xs opacity-75 ml-0.5 font-bold">%</span>
                    </span>
                </div>

                <PPBadges
                    ssTone="purple"
                    glow
                    className="flex items-center gap-2.5 mt-1.5 pt-1.5 border-t border-white/15 text-xs tabular-nums font-black tracking-wide"
                />
            </div>
        </div>
    );
});
