import { memo } from "react";
import { useOverlayOptions } from "../../options/store";
import { RANK_COLORS } from "../../utils/format";
import { useScoreDisplay } from "../shared/hooks";
import { PPBadges } from "../shared/PPBadges";
import { neonCut } from "./neonStyle";

export const NeonScore = memo(function NeonScore() {
    const { score, acc, rank } = useScoreDisplay();
    const { showRank } = useOverlayOptions();

    return (
        <div
            className="relative flex items-stretch backdrop-blur-xl bg-zinc-950/90 border border-cyan-400/40 shadow-[0_0_35px_-8px_rgba(6,182,212,0.5)]"
            style={neonCut(14)}
        >
            {showRank && (
                <div className="relative flex w-18 items-center justify-center border-r border-white/15 bg-black/60 px-2">
                    <span className={`text-3xl font-black tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] ${RANK_COLORS[rank]}`}>
                        {rank}
                    </span>
                </div>
            )}

            <div className="flex flex-col items-end gap-0.5 px-5 py-2.5 min-w-[190px]">
                <span className="text-[10px] tracking-[0.3em] text-cyan-200/90 font-bold">SCORE</span>
                <span className="text-3xl font-black tabular-nums text-white drop-shadow-[0_2px_10px_rgba(6,182,212,0.6)]">
                    {score}
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-[11px] tracking-[0.25em] text-white/70 font-bold">ACC</span>
                    <span className="text-base tabular-nums bg-linear-to-r from-cyan-300 to-fuchsia-300 bg-clip-text text-transparent font-black drop-shadow-sm">
                        {acc}%
                    </span>
                </div>

                <PPBadges
                    ssTone="fuchsia"
                    glow
                    className="flex items-center gap-2.5 mt-1.5 pt-1.5 border-t border-white/15 text-xs tabular-nums font-black tracking-wide"
                />
            </div>
        </div>
    );
});
