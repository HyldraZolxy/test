interface Props {
    skinName: string;
    isMock: boolean;
    scale: number;
    onOpenSettings: () => void;
    onNextSkin: () => void;
    onToggleMock: () => void;
    onDismiss: () => void;
}

/** Floating shortcut bar shown at load and after each shortcut, then auto-hidden. */
export function HelpBar({ skinName, isMock, scale, onOpenSettings, onNextSkin, onToggleMock, onDismiss }: Props) {
    return (
        <aside
            aria-label="Overlay controls"
            className="fixed top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-3 py-1 bg-black/70 backdrop-blur-md border border-white/15 rounded-full text-[10px] font-mono text-white/80 shadow-lg tracking-wider transition-opacity duration-500 pointer-events-auto"
        >
            <span className="flex items-center gap-1">
                <span className="text-cyan-300 font-semibold">{skinName}</span>
                {isMock && (
                    <span className="bg-fuchsia-500/30 text-fuchsia-300 border border-fuchsia-400/40 px-1.5 rounded text-[8px] tracking-widest font-bold">
                        MOCK
                    </span>
                )}
                <span className="text-white/40 text-[9px]">({Math.round(scale * 100)}%)</span>
            </span>
            <span className="text-white/20">|</span>
            <button
                type="button"
                onClick={onOpenSettings}
                className="text-cyan-300 hover:text-cyan-200 underline decoration-cyan-400/50 cursor-pointer"
            >
                [O] Options
            </button>
            <span className="text-white/20">|</span>
            <button type="button" onClick={onNextSkin} className="hover:text-white cursor-pointer">
                [S] Skin
            </button>
            <span className="text-white/20">|</span>
            <button type="button" onClick={onToggleMock} className="hover:text-white cursor-pointer">
                [M] {isMock ? "Live" : "Mock"}
            </button>
            <span className="text-white/20">|</span>
            <button
                type="button"
                onClick={onDismiss}
                className="text-white/40 hover:text-white cursor-pointer ml-1"
                aria-label="Hide the controls bar"
            >
                ✕
            </button>
        </aside>
    );
}
