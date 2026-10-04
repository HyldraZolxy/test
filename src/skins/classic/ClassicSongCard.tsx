import { memo } from "react";
import { useBeatmap } from "../../game/hooks";
import { coverDataUrl, getDifficultyStyle } from "../../utils/format";

export const ClassicSongCard = memo(function ClassicSongCard() {
    const beatmap = useBeatmap();
    if (!beatmap) return null;

    const cover = coverDataUrl(beatmap.songCover);
    const diff = getDifficultyStyle(beatmap.difficultyEnum, beatmap.difficulty);

    return (
        <div className="flex items-center gap-3 border border-cyan-300/30 bg-black/55 backdrop-blur-md p-2.5 pr-5 shadow-[0_0_24px_-6px] shadow-cyan-300/40 min-w-[320px] max-w-105">
            <div className="relative h-16 w-16 shrink-0 border border-cyan-300/40 overflow-hidden">
                {cover ? (
                    <img src={cover} alt="" className="h-full w-full object-cover" />
                ) : (
                    <div className="h-full w-full bg-linear-to-br from-cyan-900/60 to-fuchsia-900/60" />
                )}
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="truncate text-base font-semibold text-white tracking-wide">
                    {beatmap.songName}
                    {beatmap.songSubName && (
                        <span className="ml-1 text-cyan-300/70 text-sm">{beatmap.songSubName}</span>
                    )}
                </div>
                <div className="truncate text-xs text-white/60">
                    {beatmap.songAuthorName}
                    {beatmap.levelAuthorName && (
                        <span className="text-white/35"> · mapped by {beatmap.levelAuthorName}</span>
                    )}
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px] tracking-[0.2em]">
                    <span className={`border ${diff.ring} px-1.5 py-0.5 ${diff.color}`}>{diff.label}</span>
                    <span className="text-white/40">BPM {Math.round(beatmap.songBPM)}</span>
                </div>
            </div>
        </div>
    );
});
