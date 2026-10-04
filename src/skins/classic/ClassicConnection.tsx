import { memo } from "react";
import { useConnectionState } from "../../game/hooks";
import type { ConnectionState } from "../../game/protocol";

const STYLES: Record<ConnectionState, { label: string; color: string }> = {
    connecting: { label: "LINKING", color: "text-amber-300 border-amber-300/40 shadow-amber-300/30" },
    connected: { label: "ONLINE", color: "text-cyan-300 border-cyan-300/40 shadow-cyan-300/30" },
    disconnected: { label: "OFFLINE", color: "text-rose-400 border-rose-400/40 shadow-rose-400/30" },
};

export const ClassicConnection = memo(function ClassicConnection() {
    const state = useConnectionState();
    const { label, color } = STYLES[state];

    return (
        <div
            className={`inline-flex items-center gap-2 border ${color} bg-black/40 backdrop-blur-sm px-2.5 py-1 text-[10px] tracking-[0.25em] shadow-[0_0_12px_-2px] uppercase`}
        >
            <span className={`h-1.5 w-1.5 rounded-full bg-current ${state === "connected" ? "animate-pulse" : ""}`} />
            {label}
        </div>
    );
});
