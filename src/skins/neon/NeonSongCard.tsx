import { memo } from "react";
import { useBeatmap } from "../../game/hooks";
import { useSongProgress } from "../../game/useSongProgress";
import { useOverlayOptions } from "../../options/store";
import { coverDataUrl, formatTime, getDifficultyStyle } from "../../utils/format";
import { notesCountOf, useSaberTheme } from "../shared/hooks";
import { neonCut } from "./neonStyle";

/** Isolated so that only the bar re-renders on every progress tick, not the whole card. */
const NeonProgressBar = memo(function NeonProgressBar({ saberA, saberB }: { saberA: string; saberB: string }) {
    const { elapsedMs, remainingMs, progress } = useSongProgress();

    return (
        <div className="relative mt-2 flex items-center gap-2.5 px-1">
            <span className="text-xs tabular-nums text-cyan-200 font-bold tracking-wider drop-shadow-sm">
                {formatTime(elapsedMs)}
            </span>
            <div className="relative h-[4px] flex-1 bg-white/15 overflow-hidden rounded-full border border-white/10">
                <div
                    className="absolute inset-y-0 left-0 shadow-[0_0_12px_rgba(103,232,249,0.9)] transition-[width] duration-75 rounded-full"
                    style={{
                        width: `${progress * 100}%`,
                        background: `linear-gradient(to right, ${saberB}, ${saberA})`,
                    }}
                />
            </div>
            <span className="text-xs tabular-nums text-white/70 font-bold tracking-wider drop-shadow-sm">
                -{formatTime(remainingMs)}
            </span>
        </div>
    );
});

export const NeonSongCard = memo(function NeonSongCard() {
    const beatmap = useBeatmap();
    const { showSongProgress } = useOverlayOptions();
    const { saberA, saberB, saberBGlow } = useSaberTheme(beatmap);
    if (!beatmap) return null;

    const cover = coverDataUrl(beatmap.songCover);
    const diff = getDifficultyStyle(beatmap.difficultyEnum, beatmap.difficulty);
    const notes = notesCountOf(beatmap);

    return (
        <div className="relative w-[440px]">
            <div
                className="absolute -inset-3 blur-xl opacity-60 pointer-events-none"
                style={{ background: `radial-gradient(closest-side, ${saberBGlow}, transparent 75%)` }}
            />

            <div
                className="relative flex items-stretch gap-3.5 p-3.5 backdrop-blur-xl bg-zinc-950/90 border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.8)]"
                style={neonCut(16)}
            >
                <span
                    className="absolute top-0 left-4 h-[2px] w-28"
                    style={{ background: `linear-gradient(to right, ${saberB}, transparent)` }}
                />
                <span
                    className="absolute bottom-0 right-4 h-[2px] w-28"
                    style={{ background: `linear-gradient(to left, ${saberA}, transparent)` }}
                />

                <div className={`relative h-20 w-20 shrink-0 overflow-hidden border-2 ${diff.ring} shadow-md`}>
                    {cover ? (
                        <img src={cover} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div
                            className="h-full w-full opacity-80"
                            style={{ background: `linear-gradient(135deg, ${saberB} 0%, ${saberA} 100%)` }}
                        />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/15" />
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                    <div className="min-w-0">
                        <div className="truncate text-base font-black tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                            {beatmap.songName}
                            {beatmap.songSubName && (
                                <span className="ml-1.5 text-xs font-bold text-cyan-200/90">{beatmap.songSubName}</span>
                            )}
                        </div>
                        <div className="truncate text-xs text-white/80 font-semibold tracking-wide mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                            {beatmap.songAuthorName}
                            {beatmap.levelAuthorName && (
                                <span className="text-white/60 font-medium"> · {beatmap.levelAuthorName}</span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[10px] tracking-wide">
                        <span className={`px-2.5 py-0.5 border-2 ${diff.ring} ${diff.color} bg-black/60 font-black uppercase text-[10px]`}>
                            {diff.label}
                        </span>
                        <span className="text-white/80 font-bold">BPM {Math.round(beatmap.songBPM)}</span>
                        {notes > 0 && (
                            <>
                                <span className="text-white/30">·</span>
                                <span className="text-white/80 font-bold tabular-nums">{notes} NOTES</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {showSongProgress && <NeonProgressBar saberA={saberA} saberB={saberB} />}
        </div>
    );
});
