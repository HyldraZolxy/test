import { memo } from "react";
import { CONNECTION_BADGE_AUTO_HIDE_MS } from "../../config";
import { useConnectionState } from "../../game/hooks";
import type { ConnectionState } from "../../game/protocol";
import { useAutoHide } from "../shared/hooks";
import { neonCut } from "./neonStyle";

const STYLES: Record<ConnectionState, { label: string; dot: string; text: string; border: string; glow: string }> = {
    connecting: {
        label: "SYNCING",
        dot: "bg-amber-300",
        text: "text-amber-200",
        border: "border-amber-300/40",
        glow: "shadow-[0_0_18px_-4px_rgba(252,211,77,0.7)]",
    },
    connected: {
        label: "LINKED",
        dot: "bg-cyan-300",
        text: "text-cyan-100",
        border: "border-cyan-300/40",
        glow: "shadow-[0_0_18px_-4px_rgba(103,232,249,0.7)]",
    },
    disconnected: {
        label: "OFFLINE",
        dot: "bg-rose-400",
        text: "text-rose-200",
        border: "border-rose-400/40",
        glow: "shadow-[0_0_18px_-4px_rgba(251,113,133,0.6)]",
    },
};

/** Connection badge; fades out a few seconds after the game is connected. */
export const NeonConnection = memo(function NeonConnection() {
    const state = useConnectionState();
    const visible = useAutoHide(state === "connected", CONNECTION_BADGE_AUTO_HIDE_MS);
    const style = STYLES[state];

    return (
        <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-[10px] tracking-[0.4em] backdrop-blur-md bg-white/4 border ${style.border} ${style.text} ${style.glow} transition-opacity duration-700 ${
                visible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            style={neonCut(10)}
        >
            <span className={`relative h-1.5 w-1.5 rounded-full ${style.dot}`}>
                {state === "connected" && (
                    <span className={`absolute inset-0 rounded-full ${style.dot} animate-ping opacity-60`} />
                )}
            </span>
            {style.label}
        </div>
    );
});
