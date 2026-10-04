import { memo } from "react";
import { MULTIPLIER_STEPS } from "../../config";
import { useOverlayOptions } from "../../options/store";
import { useComboDisplay } from "../shared/hooks";
import { neonCut } from "./neonStyle";

export const NeonCombo = memo(function NeonCombo() {
    const { combo, multiplier, fill } = useComboDisplay();
    const { showMultiplier } = useOverlayOptions();

    return (
        <div
            className="relative flex flex-col items-center gap-2 px-6 py-3.5 backdrop-blur-xl bg-zinc-950/90 border border-fuchsia-400/40 shadow-[0_0_35px_-8px_rgba(217,70,239,0.5)]"
            style={neonCut(14)}
        >
            {showMultiplier && (
                <div className="flex items-center gap-1.5">
                    {MULTIPLIER_STEPS.map((step) => (
                        <span
                            key={step}
                            className={`h-2 w-5 rounded-xs transition-colors duration-150 ${
                                multiplier >= step ? "bg-fuchsia-300 shadow-[0_0_10px_rgba(232,121,249,0.9)]" : "bg-white/15"
                            }`}
                        />
                    ))}
                </div>
            )}

            <div className="flex flex-col items-center -my-0.5">
                <span className="text-[10px] tracking-[0.4em] text-fuchsia-200/90 font-bold">COMBO</span>
                <span className="text-5xl font-black tabular-nums text-white leading-none drop-shadow-[0_2px_14px_rgba(217,70,239,0.8)] my-1">
                    {combo}
                </span>
            </div>

            {showMultiplier && (
                <div className="flex w-full items-center gap-2.5 min-w-32">
                    <span className="text-base font-black text-fuchsia-200 tabular-nums drop-shadow-sm">x{multiplier}</span>
                    <div className="relative h-2 flex-1 bg-white/15 overflow-hidden rounded-full border border-white/10">
                        <div
                            className="h-full transition-all duration-100 rounded-full"
                            style={{
                                width: `${fill * 100}%`,
                                background: "linear-gradient(to right, #ec4899, #c084fc)",
                                boxShadow: "0 0 10px rgba(236,72,153,0.8)",
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
});
