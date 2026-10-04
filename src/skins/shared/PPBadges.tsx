import { memo } from "react";
import type { LivePlatformPP } from "../../pp/types";
import { usePPDisplay } from "./hooks";

const SS_TONES = {
    purple: { text: "text-purple-300", tag: "bg-purple-500/25 border-purple-400/40 text-purple-200" },
    fuchsia: { text: "text-fuchsia-300", tag: "bg-fuchsia-500/25 border-fuchsia-400/40 text-fuchsia-200" },
} as const;

interface Props {
    /** Classes of the row container (spacing, border, font). */
    className: string;
    /** Color family of the ScoreSaber badge. */
    ssTone: keyof typeof SS_TONES;
    /** Adds a soft glow behind each value. */
    glow?: boolean;
}

function Badge({ label, data, text, tag, glow }: {
    label: string;
    data: LivePlatformPP;
    text: string;
    tag: string;
    glow: string;
}) {
    return (
        <span className={`flex items-center gap-1 ${text} ${glow}`}>
            <span className="text-amber-300 font-bold">★{data.stars}</span>
            <span>{data.pp}pp</span>
            <span className={`px-1.5 rounded text-[9px] font-black border ${tag}`}>{label}</span>
        </span>
    );
}

/**
 * Live PP row, e.g. `★9.5 373.02pp BL  ★8.9 326.82pp SS`.
 * Renders nothing when PP are disabled or the map is not ranked.
 */
export const PPBadges = memo(function PPBadges({ className, ssTone, glow = false }: Props) {
    const { visible, beatleader, scoresaber } = usePPDisplay();
    if (!visible) return null;
    const ss = SS_TONES[ssTone];

    return (
        <div className={className}>
            {beatleader && (
                <Badge
                    label="BL"
                    data={beatleader}
                    text="text-cyan-300"
                    tag="bg-cyan-500/25 border-cyan-400/40 text-cyan-200"
                    glow={glow ? "drop-shadow-[0_0_10px_rgba(103,232,249,0.4)]" : ""}
                />
            )}
            {scoresaber && (
                <Badge
                    label="SS"
                    data={scoresaber}
                    text={ss.text}
                    tag={ss.tag}
                    glow={glow ? "drop-shadow-[0_0_10px_rgba(216,180,254,0.4)]" : ""}
                />
            )}
        </div>
    );
});
