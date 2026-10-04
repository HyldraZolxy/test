import { memo } from "react";
import { useInSong } from "../../game/hooks";
import { useOverlayOptions } from "../../options/store";
import { useSaberTheme, useStandbyVisible } from "../shared/hooks";
import { HorizonCombo } from "./HorizonCombo";
import { HorizonConnection } from "./HorizonConnection";
import { HorizonEnergy } from "./HorizonEnergy";
import { HorizonPP } from "./HorizonPP";
import { HorizonScore } from "./HorizonScore";
import { HorizonSongCard } from "./HorizonSongCard";

/** Horizon Glass: frosted-glass floating widgets in the corners, tinted with the saber colors. */
export const HorizonOverlay = memo(function HorizonOverlay() {
    const inSong = useInSong();
    const options = useOverlayOptions();
    const standby = useStandbyVisible();
    const { saberA, saberB } = useSaberTheme();
    const showStandalonePP = !options.showScore && options.showPP;

    return (
        <div className="pointer-events-none fixed inset-0 select-none text-white font-sans antialiased">
            {options.showConnectionBadge && (
                <div className="absolute top-5 right-5 pointer-events-auto">
                    <HorizonConnection />
                </div>
            )}

            {inSong && (
                <>
                    {/* Top-left: song card, with the PP right below when the score panel is hidden */}
                    {(options.showSongCard || showStandalonePP) && (
                        <div className="absolute top-5 left-5 flex flex-col items-start gap-3">
                            {options.showSongCard && <HorizonSongCard />}
                            {showStandalonePP && <HorizonPP accentColor={saberB} />}
                        </div>
                    )}

                    {options.showCombo && (
                        <div className="absolute bottom-6 left-6">
                            <HorizonCombo accentColor={saberA} />
                        </div>
                    )}

                    {(options.showScore || options.showEnergy) && (
                        <div className="absolute bottom-6 right-6 flex items-end gap-3.5">
                            {options.showScore && <HorizonScore accentColor={saberB} />}
                            {options.showEnergy && <HorizonEnergy accentColor={saberB} />}
                        </div>
                    )}
                </>
            )}

            {standby && (
                <div className="absolute bottom-6 left-6">
                    <div className="flex items-center gap-2.5 px-4 py-2 rounded-full backdrop-blur-2xl bg-black/45 border border-white/10 text-xs font-semibold tracking-wider text-white/75 shadow-lg">
                        <span className="flex h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />
                        <span>Ready for track</span>
                    </div>
                </div>
            )}
        </div>
    );
});
