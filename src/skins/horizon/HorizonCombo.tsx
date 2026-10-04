import { memo } from "react";
import { useOverlayOptions } from "../../options/store";
import { useComboDisplay } from "../shared/hooks";
import { HORIZON_GLASS, HorizonAccentStripe } from "./HorizonPanel";

const MULTIPLIER_END_COLOR = "#ec4899";

export const HorizonCombo = memo(function HorizonCombo({ accentColor }: { accentColor: string }) {
    const { combo, multiplier, fill } = useComboDisplay();
    const { showMultiplier } = useOverlayOptions();

    return (
        <div className={`relative flex flex-col items-center px-7 py-4 min-w-[150px] ${HORIZON_GLASS}`}>
            <HorizonAccentStripe color={accentColor} />

            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70 mb-0.5">Combo</span>
            <span className="text-5xl font-black tabular-nums tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] leading-none my-1">
                {combo}
            </span>

            {showMultiplier && (
                <div className="flex items-center gap-2 mt-2 w-full">
                    <span
                        className="text-xs font-black px-2.5 py-0.5 rounded-md text-white shadow-md"
                        style={{ background: `linear-gradient(135deg, ${accentColor}, ${MULTIPLIER_END_COLOR})` }}
                    >
                        {multiplier}x
                    </span>
                    <div className="relative h-2 flex-1 rounded-full bg-white/15 overflow-hidden border border-white/10">
                        <div
                            className="h-full rounded-full transition-all duration-150"
                            style={{
                                width: `${fill * 100}%`,
                                background: `linear-gradient(to right, ${accentColor}, ${MULTIPLIER_END_COLOR})`,
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
});
