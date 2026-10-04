import { memo, useId } from "react";
import { useEnergyDisplay } from "../shared/hooks";
import { neonCut } from "./neonStyle";

const SIZE = 86;
const STROKE = 7;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface Props {
    /** Ring gradient start color (defaults to neon cyan). */
    colorStart?: string;
    /** Ring gradient end color (defaults to neon pink). */
    colorEnd?: string;
}

/** Circular energy gauge. */
export const NeonEnergy = memo(function NeonEnergy({ colorStart = "#67e9f9", colorEnd = "#e879f9" }: Props) {
    const { energy, percent, low } = useEnergyDisplay();
    // Unique SVG ids: several rings on one page must not share gradients/filters
    const id = useId();
    const gradientId = `${id}-gradient`;
    const glowId = `${id}-glow`;

    const start = low ? "#fb7185" : colorStart;
    const end = low ? "#fbbf24" : colorEnd;

    return (
        <div
            className="relative flex items-center justify-center backdrop-blur-xl bg-linear-to-br from-white/7 to-white/2 border border-white/10 p-2 shadow-[0_0_24px_-8px_rgba(103,232,249,0.5)]"
            style={{ width: SIZE + 20, height: SIZE + 20, ...neonCut(12) }}
        >
            <svg width={SIZE} height={SIZE} className={low ? "animate-pulse" : ""}>
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={start} />
                        <stop offset="100%" stopColor={end} />
                    </linearGradient>
                    <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth={STROKE}
                    fill="none"
                />
                <circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    stroke={`url(#${gradientId})`}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={CIRCUMFERENCE * (1 - energy)}
                    transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                    filter={`url(#${glowId})`}
                    style={{ transition: "stroke-dashoffset 200ms ease-out" }}
                />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[7.5px] font-semibold tracking-[0.35em] text-cyan-200/60 leading-none mb-0.5">HP</span>
                <span
                    className={`text-lg font-black tabular-nums leading-none ${
                        low
                            ? "text-rose-300 drop-shadow-[0_0_8px_rgba(251,113,133,0.8)]"
                            : "text-white drop-shadow-[0_0_8px_rgba(103,232,249,0.5)]"
                    }`}
                >
                    {percent}
                </span>
                <span className="text-[7px] text-white/30 tracking-widest leading-none mt-0.5">%</span>
            </div>
        </div>
    );
});
