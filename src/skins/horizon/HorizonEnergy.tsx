import { memo } from "react";
import { useEnergyDisplay } from "../shared/hooks";

export const HorizonEnergy = memo(function HorizonEnergy({ accentColor }: { accentColor: string }) {
    const { energy, percent, low } = useEnergyDisplay();

    return (
        <div
            className={`flex items-center gap-3.5 px-5 py-3 rounded-2xl backdrop-blur-2xl bg-zinc-950/85 border transition-all duration-300 shadow-2xl ${
                low
                    ? "border-rose-500/80 shadow-[0_0_30px_-5px_rgba(244,63,94,0.6)] animate-pulse"
                    : "border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.8)]"
            }`}
        >
            <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-white/70 font-bold leading-none">Energy</span>
                <span className="text-xl font-black tabular-nums text-white leading-tight mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                    {percent}
                    <span className="text-xs text-white/60 font-bold ml-0.5">%</span>
                </span>
            </div>

            <div className="relative w-28 sm:w-36 h-3 rounded-full bg-white/15 overflow-hidden p-0.5 border border-white/15 shadow-inner">
                <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{
                        width: `${energy * 100}%`,
                        background: low
                            ? "linear-gradient(to right, #f43f5e, #fbbf24)"
                            : `linear-gradient(to right, ${accentColor}, #a855f7)`,
                        boxShadow: low ? "0 0 12px rgba(244,63,94,0.9)" : `0 0 12px ${accentColor}`,
                    }}
                />
            </div>
        </div>
    );
});
