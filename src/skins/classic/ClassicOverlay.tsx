import { memo } from "react";
import { useInSong } from "../../game/hooks";
import { useOverlayOptions } from "../../options/store";
import { useStandbyVisible } from "../shared/hooks";
import { ClassicCombo } from "./ClassicCombo";
import { ClassicConnection } from "./ClassicConnection";
import { ClassicEnergy } from "./ClassicEnergy";
import { ClassicPP } from "./ClassicPP";
import { ClassicScore } from "./ClassicScore";
import { ClassicSongCard } from "./ClassicSongCard";

/** Classic Terminal: retro monospace HUD docked at the bottom, with energy/track gauges. */
export const ClassicOverlay = memo(function ClassicOverlay() {
    const inSong = useInSong();
    const options = useOverlayOptions();
    const standby = useStandbyVisible();

    const showBars = options.showEnergy || options.showSongProgress;
    const showHud =
        inSong && (options.showSongCard || options.showCombo || options.showScore || options.showPP || showBars);

    return (
        <div className="pointer-events-none fixed inset-0 font-mono text-white select-none">
            {options.showConnectionBadge && (
                <div className="absolute top-4 right-4 pointer-events-auto">
                    <ClassicConnection />
                </div>
            )}

            {showHud && (
                <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-3">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        {/* Song card, with the PP right below when the score panel is hidden */}
                        <div className="flex flex-col items-start gap-3">
                            {options.showSongCard && <ClassicSongCard />}
                            {!options.showScore && options.showPP && <ClassicPP />}
                        </div>
                        <div className="flex items-end gap-3">
                            {options.showCombo && <ClassicCombo />}
                            {options.showScore && <ClassicScore />}
                        </div>
                    </div>

                    {showBars && (
                        <div className="border border-cyan-300/20 bg-black/55 backdrop-blur-md px-4 py-2 shadow-[0_0_24px_-8px] shadow-cyan-300/30">
                            <ClassicEnergy />
                        </div>
                    )}
                </div>
            )}

            {standby && (
                <div className="absolute bottom-4 left-4 pointer-events-auto">
                    <div className="border border-cyan-300/20 bg-black/55 backdrop-blur-md px-3 py-1.5 text-[10px] tracking-[0.3em] text-cyan-300/70">
                        AWAITING TRACK…
                    </div>
                </div>
            )}
        </div>
    );
});
