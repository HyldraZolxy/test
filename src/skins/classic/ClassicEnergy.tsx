import { memo } from "react";
import { useSongProgress } from "../../game/useSongProgress";
import { useOverlayOptions } from "../../options/store";
import { useEnergyDisplay } from "../shared/hooks";

const EnergyGauge = memo(function EnergyGauge() {
    const { energy, percent, low } = useEnergyDisplay();

    return (
        <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-[0.3em] text-white/40 w-16">ENERGY</span>
            <div className="relative h-1.5 flex-1 overflow-hidden bg-white/10 border border-white/10">
                <div
                    className={`absolute inset-y-0 left-0 transition-[width] duration-200 ${
                        low
                            ? "bg-linear-to-r from-rose-500 to-amber-300 animate-pulse"
                            : "bg-linear-to-r from-cyan-300 to-fuchsia-400"
                    }`}
                    style={{ width: `${energy * 100}%` }}
                />
            </div>
            <span className="text-[10px] tabular-nums text-white/60 w-10 text-right">{percent}%</span>
        </div>
    );
});

/** Isolated so that only this gauge re-renders on every progress tick. */
const TrackGauge = memo(function TrackGauge() {
    const { progress } = useSongProgress();

    return (
        <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-[0.3em] text-white/40 w-16">TRACK</span>
            <div className="relative h-1 flex-1 overflow-hidden bg-white/10 border border-white/10">
                <div
                    className="absolute inset-y-0 left-0 bg-white/70 transition-[width] duration-100"
                    style={{ width: `${progress * 100}%` }}
                />
            </div>
            <span className="text-[10px] tabular-nums text-white/60 w-10 text-right">
                {Math.round(progress * 100)}%
            </span>
        </div>
    );
});

/** Energy and track gauges, each shown according to the options. */
export const ClassicEnergy = memo(function ClassicEnergy() {
    const { showEnergy, showSongProgress } = useOverlayOptions();

    return (
        <div className="flex w-full flex-col gap-1.5">
            {showEnergy && <EnergyGauge />}
            {showSongProgress && <TrackGauge />}
        </div>
    );
});
