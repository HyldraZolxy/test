import { memo } from "react";
import { useOverlayOptions } from "../../options/store";
import { useComboDisplay } from "../shared/hooks";

export const ClassicCombo = memo(function ClassicCombo() {
    const { combo, multiplier, fill } = useComboDisplay();
    const { showMultiplier } = useOverlayOptions();

    return (
        <div className="flex flex-col items-center gap-1.5 border border-fuchsia-400/30 bg-black/55 backdrop-blur-md px-4 py-2.5 min-w-35 shadow-[0_0_24px_-6px] shadow-fuchsia-400/40">
            <div className="flex items-baseline gap-2">
                <span className="text-[10px] tracking-[0.3em] text-white/40">COMBO</span>
                <span className="text-2xl font-semibold text-white tabular-nums">{combo}</span>
            </div>

            {showMultiplier && (
                <div className="flex w-full items-center gap-2 min-w-24">
                    <span className="text-xs text-fuchsia-300 font-bold">x{multiplier}</span>
                    <div className="relative h-1.5 flex-1 overflow-hidden bg-white/10">
                        <div
                            className="absolute inset-y-0 left-0 bg-linear-to-r from-fuchsia-400 to-cyan-300 transition-[width] duration-150"
                            style={{ width: `${fill * 100}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
});
