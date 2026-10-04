import { memo } from "react";
import { CONNECTION_BADGE_AUTO_HIDE_MS } from "../../config";
import { useConnectionState } from "../../game/hooks";
import type { ConnectionState } from "../../game/protocol";
import { useAutoHide } from "../shared/hooks";

const STYLES: Record<ConnectionState, { label: string; dot: string; glow: string; text: string }> = {
    connecting: {
        label: "Connecting",
        dot: "bg-amber-400",
        glow: "shadow-[0_0_12px_rgba(251,191,36,0.6)]",
        text: "text-amber-200",
    },
    connected: {
        label: "Live",
        dot: "bg-emerald-400",
        glow: "shadow-[0_0_12px_rgba(52,211,153,0.7)]",
        text: "text-emerald-200",
    },
    disconnected: {
        label: "Offline",
        dot: "bg-rose-500",
        glow: "shadow-[0_0_12px_rgba(244,63,94,0.6)]",
        text: "text-rose-200",
    },
};

/** Connection pill; fades out a few seconds after the game is connected. */
export const HorizonConnection = memo(function HorizonConnection() {
    const state = useConnectionState();
    const visible = useAutoHide(state === "connected", CONNECTION_BADGE_AUTO_HIDE_MS);
    const style = STYLES[state];

    return (
        <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-2xl bg-black/45 border border-white/10 text-xs font-medium tracking-wide shadow-lg transition-all duration-700 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
            }`}
        >
            <span className="relative flex h-2 w-2">
                {state === "connected" && (
                    <span className={`absolute inline-flex h-full w-full rounded-full ${style.dot} opacity-75 animate-ping`} />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${style.dot} ${style.glow}`} />
            </span>
            <span className={style.text}>{style.label}</span>
        </div>
    );
});
