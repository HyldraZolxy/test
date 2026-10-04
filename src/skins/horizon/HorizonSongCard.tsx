import { memo } from "react";
import { useBeatmap } from "../../game/hooks";
import { useSongProgress } from "../../game/useSongProgress";
import { useOverlayOptions } from "../../options/store";
import { coverDataUrl, formatTime, getDifficultyStyle } from "../../utils/format";
import { notesCountOf, useSaberTheme } from "../shared/hooks";
import { HORIZON_GLASS } from "./HorizonPanel";

/** Isolated so that only the bar re-renders on every progress tick, not the whole card. */
const HorizonTrackProgress = memo(function HorizonTrackProgress({ saberA, saberB }: { saberA: string; saberB: string }) {
    const { elapsedMs, remainingMs, progress } = useSongProgress();

    return (
        <div className="mt-3 flex items-center gap-2.5 pt-2.5 border-t border-white/10">
            <span className="text-xs tabular-nums font-bold text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {formatTime(elapsedMs)}
            </span>
            <div className="relative h-2 flex-1 rounded-full bg-white/15 overflow-hidden p-0.5 border border-white/10">
                <div
                    className="h-full rounded-full transition-all duration-100 shadow-sm"
                    style={{
                        width: `${progress * 100}%`,
                        background: `linear-gradient(to right, ${saberB}, ${saberA})`,
                    }}
                />
            </div>
            <span className="text-xs tabular-nums font-bold text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                -{formatTime(remainingMs)}
            </span>
        </div>
    );
});

export const HorizonSongCard = memo(function HorizonSongCard() {
    const beatmap = useBeatmap();
    const { showSongProgress } = useOverlayOptions();
    const { saberA, saberB } = useSaberTheme(beatmap);
    if (!beatmap) return null;

    const cover = coverDataUrl(beatmap.songCover);
    const diff = getDifficultyStyle(beatmap.difficultyEnum, beatmap.difficulty);
    const notes = notesCountOf(beatmap);

    return (
        <div className={`relative w-[420px] p-4 ${HORIZON_GLASS}`}>
            <div
                className="absolute top-0 inset-x-8 h-[2px] rounded-full opacity-80"
                style={{ background: `linear-gradient(to right, ${saberB}, ${saberA})` }}
            />

            <div className="flex items-center gap-4">
                <div className="relative h-18 w-18 shrink-0 rounded-xl overflow-hidden shadow-lg border border-white/15 bg-white/5">
                    {cover ? (
                        <img src={cover} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div
                            className="h-full w-full opacity-80"
                            style={{ background: `linear-gradient(135deg, ${saberB}, ${saberA})` }}
                        />
                    )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <div className="truncate text-base font-black text-white tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                        {beatmap.songName}
                        {beatmap.songSubName && (
                            <span className="ml-1.5 text-xs font-bold text-white/80">{beatmap.songSubName}</span>
                        )}
                    </div>
                    <div className="truncate text-xs font-semibold text-white/80 tracking-normal mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        {beatmap.songAuthorName}
                        {beatmap.levelAuthorName && (
                            <span className="text-white/60 font-medium"> · {beatmap.levelAuthorName}</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2.5 mt-2 text-xs">
                        <span
                            className={`px-2.5 py-0.5 rounded-full border ${diff.ring} ${diff.color} ${diff.bg} font-black uppercase tracking-wider text-[10px] shadow-sm`}
                        >
                            {diff.label}
                        </span>
                        <span className="text-white/80 font-bold text-[11px] drop-shadow-sm">
                            {Math.round(beatmap.songBPM)} BPM
                        </span>
                        {notes > 0 && (
                            <>
                                <span className="text-white/30">·</span>
                                <span className="text-white/80 font-bold text-[11px] tabular-nums drop-shadow-sm">
                                    {notes} notes
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {showSongProgress && <HorizonTrackProgress saberA={saberA} saberB={saberB} />}
        </div>
    );
});
