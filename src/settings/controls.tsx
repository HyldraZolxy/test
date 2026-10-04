import type { ReactNode } from "react";

/** On/off card with a switch, used for every boolean option. */
export function ToggleCard({
    label,
    description,
    checked,
    onChange,
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`flex items-start justify-between gap-3 p-3 text-left border rounded-lg transition-all cursor-pointer ${
                checked
                    ? "border-cyan-400/40 bg-cyan-950/20 shadow-[0_0_15px_-4px_rgba(34,211,238,0.2)]"
                    : "border-white/10 bg-white/2 opacity-70 hover:opacity-100"
            }`}
        >
            <div className="min-w-0 pr-2">
                <div className="text-xs font-semibold tracking-wide text-white">{label}</div>
                <div className="text-[10px] text-white/60 leading-tight mt-0.5">{description}</div>
            </div>
            <div
                aria-hidden
                className={`shrink-0 w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                    checked ? "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" : "bg-zinc-800"
                }`}
            >
                <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${
                        checked ? "translate-x-4 shadow-sm" : "translate-x-0"
                    }`}
                />
            </div>
        </button>
    );
}

const ACCENTS = {
    cyan: {
        box: "border-cyan-400/30 bg-cyan-950/30",
        active: "border-cyan-400 bg-cyan-500/20 text-cyan-200 font-bold shadow-[0_0_10px_rgba(34,211,238,0.3)]",
    },
    purple: {
        box: "border-purple-400/30 bg-purple-950/20",
        active: "border-purple-400 bg-purple-500/20 text-purple-200 font-bold shadow-[0_0_10px_rgba(168,85,247,0.3)]",
    },
} as const;

/** A labelled row of mutually exclusive buttons. */
export function SegmentedControl<T extends string | number>({
    title,
    description,
    badge,
    options,
    value,
    onChange,
    accent,
}: {
    title: string;
    description: string;
    badge?: ReactNode;
    options: readonly { value: T; label: string }[];
    value: T;
    onChange: (value: T) => void;
    accent: keyof typeof ACCENTS;
}) {
    const colors = ACCENTS[accent];
    return (
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border ${colors.box}`}>
            <div>
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                    <span>{title}</span>
                    {badge}
                </div>
                <div className="text-[10px] text-white/60">{description}</div>
            </div>
            <div role="radiogroup" aria-label={title} className="flex items-center gap-1.5">
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={value === option.value}
                        onClick={() => onChange(option.value)}
                        className={`px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer ${
                            value === option.value
                                ? colors.active
                                : "border-white/10 text-white/60 hover:text-white bg-white/2"
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
