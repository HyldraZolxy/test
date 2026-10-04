import { memo } from "react";
import { useOverlayOptions } from "../../options/store";
import { RANK_COLORS } from "../../utils/format";
import { useScoreDisplay } from "../shared/hooks";
import { PPBadges } from "../shared/PPBadges";

export const ClassicScore = memo(function ClassicScore() {
    const { score, acc, rank } = useScoreDisplay();
    const { showRank } = useOverlayOptions();

    return (
        <div className="flex flex-col items-end gap-1 border border-cyan-400/40 bg-zinc-950/90 backdrop-blur-md px-5 py-3 min-w-52 shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
            <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold tracking-[0.25em] text-white/70">SCORE</span>
                <span className="text-3xl font-black text-white tabular-nums tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                    {score}
                </span>
            </div>
            <div className="flex w-full items-center justify-between gap-3 text-sm mt-0.5">
                {showRank ? (
                    <span className={`text-2xl font-black ${RANK_COLORS[rank]} drop-shadow-sm`}>{rank}</span>
                ) : (
                    <span />
                )}
                <span className="tabular-nums text-cyan-300 font-black text-base drop-shadow-sm">
                    {acc}
                    <span className="text-cyan-300/70 text-xs ml-0.5">%</span>
                </span>
            </div>

            <PPBadges
                ssTone="purple"
                className="flex items-center gap-2 pt-1.5 mt-1 border-t border-white/15 text-xs tabular-nums font-black"
            />
        </div>
    );
});
