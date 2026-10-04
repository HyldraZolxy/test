import { useEffect, useId, useRef, type KeyboardEvent } from "react";
import { DEFAULT_UI_SCALE, UI_SCALE_CHOICES } from "../config";
import { PP_PROVIDERS } from "../options/schema";
import { resetOverlayOptions, setOverlayOption, useOverlayOptions } from "../options/store";
import { SegmentedControl, ToggleCard } from "./controls";
import { PP_PROVIDER_LABELS, SETTINGS_SECTIONS, type SectionControl } from "./settingsSchema";
import { useProfileTransfer } from "./useProfileTransfer";

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function SectionControlView({ control }: { control: SectionControl }) {
    const options = useOverlayOptions();

    if (control === "ppProvider") {
        if (!options.showPP) return null;
        return (
            <SegmentedControl
                accent="cyan"
                title="PP leaderboard"
                description="Which leaderboard(s) to show Performance Points for"
                options={PP_PROVIDERS.map((value) => ({ value, label: PP_PROVIDER_LABELS[value] }))}
                value={options.ppProvider}
                onChange={(value) => setOverlayOption("ppProvider", value)}
            />
        );
    }

    return (
        <SegmentedControl
            accent="purple"
            title="Overlay scale"
            description="Enlarge the overlay for readability on small screens and mobile"
            badge={
                <span className="text-[10px] px-1.5 rounded bg-purple-500/20 text-purple-200 border border-purple-400/30 font-bold">
                    {Math.round(options.uiScale * 100)}%
                </span>
            }
            options={UI_SCALE_CHOICES.map(({ scale, label }) => ({ value: scale, label }))}
            value={options.uiScale ?? DEFAULT_UI_SCALE}
            onChange={(value) => setOverlayOption("uiScale", value)}
        />
    );
}

/**
 * Settings dialog (opened with `O`). Changes apply instantly, are saved locally
 * and synced to every other overlay window.
 */
export function SettingsModal({ onClose }: { onClose: () => void }) {
    const options = useOverlayOptions();
    const { exportProfile, importProfile, importError } = useProfileTransfer();
    const dialogRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const titleId = useId();

    // Move focus into the dialog, and give it back on close
    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;
        dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
        return () => previous?.focus();
    }, []);

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Escape") {
            event.stopPropagation();
            onClose();
            return;
        }
        if (event.key !== "Tab" || !dialogRef.current) return;
        // Keep keyboard focus inside the dialog
        const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md font-mono"
            onClick={(event) => event.target === event.currentTarget && onClose()}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onKeyDown={handleKeyDown}
                className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-zinc-950/90 border border-cyan-400/40 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.25)] text-white overflow-hidden"
                style={{
                    clipPath: "polygon(18px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%, 0 18px)",
                }}
            >
                <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/2">
                    <div className="flex items-center gap-3">
                        <span className="flex h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)] animate-pulse" />
                        <div>
                            <h2 id={titleId} className="text-base font-bold tracking-widest text-white uppercase">
                                Overlay settings
                            </h2>
                            <p className="text-[10px] tracking-wider text-cyan-300/70">
                                Saved locally · Synced live across OBS sources
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1 text-xs border border-white/20 hover:border-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors rounded cursor-pointer"
                    >
                        Close [Esc]
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {SETTINGS_SECTIONS.map((section) => (
                        <section key={section.id} aria-label={section.title} className="space-y-3">
                            <h3 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-cyan-300/90 border-b border-cyan-300/20 pb-1 uppercase">
                                <span aria-hidden>{section.icon}</span>
                                <span>{section.title}</span>
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {section.toggles.map((toggle) => (
                                    <ToggleCard
                                        key={toggle.key}
                                        label={toggle.label}
                                        description={toggle.description}
                                        checked={options[toggle.key]}
                                        onChange={(checked) => setOverlayOption(toggle.key, checked)}
                                    />
                                ))}
                            </div>
                            {section.control && <SectionControlView control={section.control} />}
                        </section>
                    ))}
                </div>

                <footer className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-white/10 bg-white/2 text-xs">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={exportProfile}
                            className="px-3 py-1.5 border border-white/20 hover:border-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded transition-colors cursor-pointer"
                        >
                            Export profile ⤓
                        </button>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 border border-white/20 hover:border-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded transition-colors cursor-pointer"
                        >
                            Import profile ⤒
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json,application/json"
                            onChange={importProfile}
                            className="hidden"
                            tabIndex={-1}
                        />
                        {importError && (
                            <span role="alert" className="text-rose-300">
                                {importError}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={resetOverlayOptions}
                            className="px-3 py-1.5 border border-rose-500/40 text-rose-300/80 hover:border-rose-400 hover:text-rose-200 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                        >
                            Reset defaults
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold tracking-wider rounded shadow-[0_0_15px_rgba(6,182,212,0.6)] transition-all cursor-pointer"
                        >
                            DONE
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
}
