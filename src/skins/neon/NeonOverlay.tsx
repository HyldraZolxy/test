import { memo } from "react";
import { useInSong } from "../../game/hooks";
import { useOverlayOptions } from "../../options/store";
import { useSaberTheme, useStandbyVisible } from "../shared/hooks";
import { NeonCombo } from "./NeonCombo";
import { NeonConnection } from "./NeonConnection";
import { NeonEnergy } from "./NeonEnergy";
import { NeonPP } from "./NeonPP";
import { NeonScore } from "./NeonScore";
import { NeonSongCard } from "./NeonSongCard";
import { neonCut } from "./neonStyle";

/** Neon Cyber: angular glowing panels, combo step dots and a circular energy ring. */
export const NeonOverlay = memo(function NeonOverlay() {
    const inSong = useInSong();
    const options = useOverlayOptions();
    const standby = useStandbyVisible();
    const theme = useSaberTheme();
    const showStandalonePP = !options.showScore && options.showPP;

    // The ring keeps its own neon palette unless map colors are enabled
    const ringStart = options.useCustomSaberColors ? theme.saberB : undefined;
    const ringEnd = options.useCustomSaberColors ? theme.saberA : undefined;

    return (
        <div className="pointer-events-none fixed inset-0 select-none text-white [font-family:'Orbitron',ui-sans-serif,system-ui]">
            {options.showConnectionBadge && (
                <div className="absolute top-5 right-5 pointer-events-auto">
                    <NeonConnection />
                </div>
            )}

            {inSong && (
                <>
                    {/* Top-left: song card, with the PP right below when the score panel is hidden */}
                    {(options.showSongCard || showStandalonePP) && (
                        <div className="absolute top-5 left-5 flex flex-col items-start gap-3">
                            {options.showSongCard && <NeonSongCard />}
                            {showStandalonePP && <NeonPP />}
                        </div>
                    )}

                    {options.showCombo && (
                        <div className="absolute bottom-6 left-6">
                            <NeonCombo />
                        </div>
                    )}

                    {(options.showScore || options.showEnergy) && (
                        <div className="absolute bottom-6 right-6 flex items-end gap-3.5">
                            {options.showScore && <NeonScore />}
                            {options.showEnergy && <NeonEnergy colorStart={ringStart} colorEnd={ringEnd} />}
                        </div>
                    )}
                </>
            )}

            {standby && (
                <div className="absolute bottom-6 left-6">
                    <div
                        className="relative px-4 py-2 text-[10px] tracking-[0.5em] text-cyan-200/80 backdrop-blur-md bg-white/3 border border-white/10"
                        style={neonCut(12)}
                    >
                        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-cyan-300 align-middle animate-pulse" />
                        STANDBY · AWAITING TRACK
                    </div>
                </div>
            )}
        </div>
    );
});
